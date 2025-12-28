FROM python:3.11-slim

WORKDIR /app

# Install FFmpeg and dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8686

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8686"]
