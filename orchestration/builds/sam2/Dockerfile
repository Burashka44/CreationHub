FROM python:3.10-slim-bookworm

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    libgl1 \
    libglib2.0-0 \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install SAM 2 and dependencies
RUN pip install --no-cache-dir \
    torch \
    torchvision \
    opencv-python-headless \
    Pillow \
    numpy \
    fastapi \
    uvicorn \
    python-multipart \
    aiofiles

# Install SAM 2 from Meta
RUN pip install --no-cache-dir git+https://github.com/facebookresearch/segment-anything-2.git

# Create model cache directory
RUN mkdir -p /app/checkpoints

EXPOSE 8787

COPY main.py .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8787"]
