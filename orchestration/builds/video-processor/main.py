"""
Video Processor API
Provides endpoints for video processing with watermark detection and removal.
Integrates with FFmpeg, Ollama (LLava), and IOPaint.
"""
import os
import uuid
import shutil
import subprocess
import asyncio
from pathlib import Path
from typing import Optional
import httpx
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import base64

app = FastAPI(title="Video Processor API", version="1.0.0")

# Configuration
MEDIA_DIR = Path("/media")
TEMP_DIR = MEDIA_DIR / "temp"
OUTPUT_DIR = MEDIA_DIR / "processed"
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://creationhub_ollama:11434")
IOPAINT_URL = os.getenv("IOPAINT_URL", "http://creationhub-iopaint:8080")
SAM2_URL = os.getenv("SAM2_URL", "http://creationhub-sam2:8787")

# Ensure directories exist
TEMP_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class ProcessRequest(BaseModel):
    video_path: str
    detect_watermark: bool = True
    watermark_area: Optional[dict] = None  # {"x": 0, "y": 0, "width": 100, "height": 50}
    output_format: str = "mp4"


class DetectionResult(BaseModel):
    has_watermark: bool
    area: Optional[dict] = None
    confidence: float = 0.0


# ============================================
# FFmpeg Functions
# ============================================

async def extract_frames(video_path: Path, output_dir: Path, fps: int = 1) -> list[Path]:
    """Extract frames from video using FFmpeg."""
    output_dir.mkdir(parents=True, exist_ok=True)
    pattern = output_dir / "frame_%05d.png"
    
    cmd = [
        "ffmpeg", "-i", str(video_path),
        "-vf", f"fps={fps}",
        "-q:v", "2",
        str(pattern),
        "-y"
    ]
    
    process = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    await process.communicate()
    
    frames = sorted(output_dir.glob("frame_*.png"))
    return frames


async def assemble_video(frames_dir: Path, output_path: Path, fps: int = 30, audio_path: Optional[Path] = None) -> Path:
    """Assemble frames back into video using FFmpeg."""
    pattern = frames_dir / "frame_%05d.png"
    
    cmd = [
        "ffmpeg", "-framerate", str(fps),
        "-i", str(pattern),
    ]
    
    if audio_path and audio_path.exists():
        cmd.extend(["-i", str(audio_path), "-c:a", "aac"])
    
    cmd.extend([
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "18",
        str(output_path),
        "-y"
    ])
    
    process = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    await process.communicate()
    
    return output_path


async def extract_audio(video_path: Path, output_path: Path) -> Path:
    """Extract audio track from video."""
    cmd = [
        "ffmpeg", "-i", str(video_path),
        "-vn", "-acodec", "copy",
        str(output_path),
        "-y"
    ]
    
    process = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    await process.communicate()
    
    return output_path


def get_video_fps(video_path: Path) -> float:
    """Get FPS of video."""
    cmd = [
        "ffprobe", "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=r_frame_rate",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(video_path)
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    fps_str = result.stdout.strip()
    if "/" in fps_str:
        num, den = fps_str.split("/")
        return float(num) / float(den)
    return float(fps_str) if fps_str else 30.0


# ============================================
# AI Functions
# ============================================

async def detect_watermark_llava(image_path: Path) -> DetectionResult:
    """Use LLava to detect watermarks in image."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Read and encode image
        with open(image_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode()
        
        prompt = """Analyze this image and detect any watermarks, logos, or text overlays.
If you find a watermark, describe its location (top-left, top-right, bottom-left, bottom-right, center).
If no watermark is found, say "No watermark detected".
Be concise."""

        try:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": "llava:7b",
                    "prompt": prompt,
                    "images": [image_data],
                    "stream": False
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                text = result.get("response", "").lower()
                
                has_watermark = "watermark" in text and "no watermark" not in text
                
                # Parse location
                area = None
                if has_watermark:
                    if "top-right" in text or "upper-right" in text:
                        area = {"x": 0.7, "y": 0, "width": 0.3, "height": 0.15}
                    elif "top-left" in text or "upper-left" in text:
                        area = {"x": 0, "y": 0, "width": 0.3, "height": 0.15}
                    elif "bottom-right" in text or "lower-right" in text:
                        area = {"x": 0.7, "y": 0.85, "width": 0.3, "height": 0.15}
                    elif "bottom-left" in text or "lower-left" in text:
                        area = {"x": 0, "y": 0.85, "width": 0.3, "height": 0.15}
                    elif "center" in text:
                        area = {"x": 0.35, "y": 0.4, "width": 0.3, "height": 0.2}
                    else:
                        # Default to bottom-right (most common)
                        area = {"x": 0.7, "y": 0.85, "width": 0.3, "height": 0.15}
                
                return DetectionResult(
                    has_watermark=has_watermark,
                    area=area,
                    confidence=0.8 if has_watermark else 0.9
                )
        except Exception as e:
            print(f"LLava detection error: {e}")
    
    return DetectionResult(has_watermark=False, confidence=0.5)


async def remove_watermark_iopaint(image_path: Path, mask_area: dict, output_path: Path) -> Path:
    """Use IOPaint to remove watermark from image."""
    from PIL import Image
    import io
    
    # Create mask image
    img = Image.open(image_path)
    width, height = img.size
    
    # Convert relative coordinates to absolute
    x = int(mask_area["x"] * width)
    y = int(mask_area["y"] * height)
    w = int(mask_area["width"] * width)
    h = int(mask_area["height"] * height)
    
    # Create black mask with white area to inpaint
    mask = Image.new("L", (width, height), 0)
    from PIL import ImageDraw
    draw = ImageDraw.Draw(mask)
    draw.rectangle([x, y, x + w, y + h], fill=255)
    
    # Convert to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    img_bytes.seek(0)
    
    mask_bytes = io.BytesIO()
    mask.save(mask_bytes, format="PNG")
    mask_bytes.seek(0)
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(
                f"{IOPAINT_URL}/inpaint",
                files={
                    "image": ("image.png", img_bytes, "image/png"),
                    "mask": ("mask.png", mask_bytes, "image/png")
                }
            )
            
            if response.status_code == 200:
                result_img = Image.open(io.BytesIO(response.content))
                result_img.save(output_path)
                return output_path
        except Exception as e:
            print(f"IOPaint error: {e}")
            # If IOPaint fails, copy original
            shutil.copy(image_path, output_path)
    
    return output_path


# ============================================
# API Endpoints
# ============================================

@app.get("/health")
async def health():
    return {"status": "ok", "service": "video-processor"}


@app.post("/extract-frames")
async def api_extract_frames(file: UploadFile = File(...), fps: int = 1):
    """Extract frames from uploaded video."""
    job_id = str(uuid.uuid4())
    job_dir = TEMP_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    
    video_path = job_dir / file.filename
    with open(video_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    frames_dir = job_dir / "frames"
    frames = await extract_frames(video_path, frames_dir, fps)
    
    return {
        "job_id": job_id,
        "frames_count": len(frames),
        "frames_dir": str(frames_dir)
    }


@app.post("/detect-watermark")
async def api_detect_watermark(file: UploadFile = File(...)):
    """Detect watermark in uploaded image."""
    job_id = str(uuid.uuid4())
    image_path = TEMP_DIR / f"{job_id}_{file.filename}"
    
    with open(image_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    result = await detect_watermark_llava(image_path)
    
    # Cleanup
    image_path.unlink(missing_ok=True)
    
    return result.model_dump()


@app.post("/remove-watermark")
async def api_remove_watermark(
    file: UploadFile = File(...),
    x: float = 0.7,
    y: float = 0.85,
    width: float = 0.3,
    height: float = 0.15
):
    """Remove watermark from uploaded image."""
    job_id = str(uuid.uuid4())
    input_path = TEMP_DIR / f"{job_id}_input.png"
    output_path = TEMP_DIR / f"{job_id}_output.png"
    
    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    mask_area = {"x": x, "y": y, "width": width, "height": height}
    await remove_watermark_iopaint(input_path, mask_area, output_path)
    
    return FileResponse(output_path, media_type="image/png", filename="cleaned.png")


@app.post("/process-video")
async def api_process_video(request: ProcessRequest, background_tasks: BackgroundTasks):
    """Full video processing pipeline."""
    job_id = str(uuid.uuid4())
    job_dir = TEMP_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    
    video_path = Path(request.video_path)
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    
    # Get video FPS
    original_fps = get_video_fps(video_path)
    
    # Extract audio
    audio_path = job_dir / "audio.aac"
    await extract_audio(video_path, audio_path)
    
    # Extract frames (1 fps for processing, we'll interpolate back)
    frames_dir = job_dir / "frames"
    processed_dir = job_dir / "processed"
    processed_dir.mkdir(parents=True, exist_ok=True)
    
    frames = await extract_frames(video_path, frames_dir, fps=1)
    
    # Process each frame
    watermark_area = request.watermark_area
    
    for i, frame in enumerate(frames):
        output_frame = processed_dir / frame.name
        
        if request.detect_watermark and not watermark_area:
            # Detect on first frame only
            if i == 0:
                detection = await detect_watermark_llava(frame)
                if detection.has_watermark and detection.area:
                    watermark_area = detection.area
        
        if watermark_area:
            await remove_watermark_iopaint(frame, watermark_area, output_frame)
        else:
            shutil.copy(frame, output_frame)
    
    # Assemble video
    output_video = OUTPUT_DIR / f"{job_id}.{request.output_format}"
    await assemble_video(processed_dir, output_video, fps=1, audio_path=audio_path if audio_path.exists() else None)
    
    # Cleanup
    shutil.rmtree(job_dir, ignore_errors=True)
    
    return {
        "job_id": job_id,
        "output_path": str(output_video),
        "watermark_detected": watermark_area is not None,
        "watermark_area": watermark_area
    }


@app.get("/download/{job_id}")
async def download_video(job_id: str):
    """Download processed video."""
    for ext in ["mp4", "mkv", "avi", "webm"]:
        path = OUTPUT_DIR / f"{job_id}.{ext}"
        if path.exists():
            return FileResponse(path, media_type="video/mp4", filename=f"processed_{job_id}.{ext}")
    
    raise HTTPException(status_code=404, detail="Video not found")


@app.delete("/cleanup/{job_id}")
async def cleanup_job(job_id: str):
    """Clean up job files."""
    job_dir = TEMP_DIR / job_id
    if job_dir.exists():
        shutil.rmtree(job_dir, ignore_errors=True)
    
    for ext in ["mp4", "mkv", "avi", "webm"]:
        path = OUTPUT_DIR / f"{job_id}.{ext}"
        path.unlink(missing_ok=True)
    
    return {"status": "cleaned"}
