"""
SAM 2 API - Segment Anything Model 2 for video object tracking
Provides endpoints for:
- Image segmentation with points/boxes
- Video object tracking
- Mask generation for inpainting
"""
import os
import io
import uuid
from pathlib import Path
from typing import List, Optional, Tuple
import numpy as np
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import torch

app = FastAPI(title="SAM 2 API", version="1.0.0")

# Configuration
CHECKPOINT_DIR = Path("/app/checkpoints")
TEMP_DIR = Path("/tmp/sam2")
TEMP_DIR.mkdir(parents=True, exist_ok=True)

# Global model (lazy loaded)
sam2_model = None
predictor = None


class PointPrompt(BaseModel):
    x: float  # 0-1 normalized
    y: float  # 0-1 normalized
    label: int = 1  # 1 = foreground, 0 = background


class BoxPrompt(BaseModel):
    x1: float  # 0-1 normalized
    y1: float
    x2: float
    y2: float


class SegmentRequest(BaseModel):
    points: Optional[List[PointPrompt]] = None
    boxes: Optional[List[BoxPrompt]] = None


def load_model():
    """Lazy load SAM 2 model."""
    global sam2_model, predictor
    
    if predictor is not None:
        return predictor
    
    try:
        from sam2.build_sam import build_sam2
        from sam2.sam2_image_predictor import SAM2ImagePredictor
        
        # Try to load model
        checkpoint_path = CHECKPOINT_DIR / "sam2_hiera_small.pt"
        config_path = "sam2_hiera_s.yaml"
        
        if not checkpoint_path.exists():
            # Download checkpoint if not exists
            import urllib.request
            url = "https://dl.fbaipublicfiles.com/segment_anything_2/072824/sam2_hiera_small.pt"
            print(f"Downloading SAM 2 checkpoint to {checkpoint_path}...")
            urllib.request.urlretrieve(url, checkpoint_path)
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        sam2_model = build_sam2(config_path, checkpoint_path, device=device)
        predictor = SAM2ImagePredictor(sam2_model)
        
        print(f"SAM 2 loaded on {device}")
        return predictor
    
    except Exception as e:
        print(f"Failed to load SAM 2: {e}")
        return None


def mask_to_png(mask: np.ndarray) -> bytes:
    """Convert binary mask to PNG bytes."""
    # Convert boolean mask to uint8
    mask_img = (mask.astype(np.uint8) * 255)
    img = Image.fromarray(mask_img, mode='L')
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return buffer.getvalue()


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": predictor is not None,
        "cuda_available": torch.cuda.is_available()
    }


@app.post("/segment")
async def segment_image(
    file: UploadFile = File(...),
    points_x: Optional[str] = None,  # comma-separated: "0.5,0.3"
    points_y: Optional[str] = None,
    labels: Optional[str] = None,  # "1,0" (1=fg, 0=bg)
    box_x1: Optional[float] = None,
    box_y1: Optional[float] = None,
    box_x2: Optional[float] = None,
    box_y2: Optional[float] = None,
):
    """
    Segment object in image using points or box prompts.
    Returns PNG mask.
    """
    pred = load_model()
    if pred is None:
        raise HTTPException(status_code=503, detail="SAM 2 model not available")
    
    # Load image
    content = await file.read()
    image = Image.open(io.BytesIO(content)).convert("RGB")
    image_np = np.array(image)
    
    # Set image for predictor
    pred.set_image(image_np)
    
    height, width = image_np.shape[:2]
    
    # Parse prompts
    input_points = None
    input_labels = None
    input_box = None
    
    if points_x and points_y:
        xs = [float(x) * width for x in points_x.split(",")]
        ys = [float(y) * height for y in points_y.split(",")]
        input_points = np.array(list(zip(xs, ys)))
        
        if labels:
            input_labels = np.array([int(l) for l in labels.split(",")])
        else:
            input_labels = np.ones(len(input_points), dtype=int)
    
    if all(v is not None for v in [box_x1, box_y1, box_x2, box_y2]):
        input_box = np.array([
            box_x1 * width,
            box_y1 * height,
            box_x2 * width,
            box_y2 * height
        ])
    
    if input_points is None and input_box is None:
        raise HTTPException(status_code=400, detail="Must provide points or box prompt")
    
    # Predict mask
    masks, scores, _ = pred.predict(
        point_coords=input_points,
        point_labels=input_labels,
        box=input_box,
        multimask_output=False
    )
    
    # Get best mask
    mask = masks[0]
    
    # Convert to PNG
    mask_bytes = mask_to_png(mask)
    
    return Response(content=mask_bytes, media_type="image/png")


@app.post("/auto-detect")
async def auto_detect(
    file: UploadFile = File(...),
    target: str = "watermark"  # watermark, logo, text, person
):
    """
    Automatically detect and segment specific objects.
    Uses automatic mask generation.
    """
    pred = load_model()
    if pred is None:
        raise HTTPException(status_code=503, detail="SAM 2 model not available")
    
    content = await file.read()
    image = Image.open(io.BytesIO(content)).convert("RGB")
    image_np = np.array(image)
    
    pred.set_image(image_np)
    height, width = image_np.shape[:2]
    
    # Common watermark positions (normalized)
    watermark_positions = {
        "bottom_right": (0.85, 0.90),
        "bottom_left": (0.15, 0.90),
        "top_right": (0.85, 0.10),
        "top_left": (0.15, 0.10),
        "center": (0.50, 0.50),
    }
    
    best_mask = None
    best_score = 0
    best_position = None
    
    # Try each position
    for pos_name, (nx, ny) in watermark_positions.items():
        point = np.array([[nx * width, ny * height]])
        label = np.array([1])
        
        try:
            masks, scores, _ = pred.predict(
                point_coords=point,
                point_labels=label,
                multimask_output=True
            )
            
            # Get smallest mask (likely watermark, not background)
            for i, (mask, score) in enumerate(zip(masks, scores)):
                mask_size = mask.sum() / (width * height)
                
                # Watermarks are typically 1-15% of image
                if 0.001 < mask_size < 0.15 and score > best_score:
                    best_mask = mask
                    best_score = score
                    best_position = pos_name
        except:
            continue
    
    if best_mask is None:
        return {"found": False, "message": "No watermark detected"}
    
    mask_bytes = mask_to_png(best_mask)
    
    return Response(content=mask_bytes, media_type="image/png", headers={
        "X-Position": best_position,
        "X-Score": str(best_score)
    })


@app.get("/models")
async def list_models():
    """List available SAM 2 model checkpoints."""
    checkpoints = list(CHECKPOINT_DIR.glob("*.pt"))
    return {
        "checkpoints": [cp.name for cp in checkpoints],
        "default": "sam2_hiera_small.pt"
    }
