FROM python:3.10-slim-bookworm

WORKDIR /app

# Install system dependencies (Debian Bookworm compatible)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install IOPaint
RUN pip install --no-cache-dir iopaint

# Create cache directory
RUN mkdir -p /root/.cache

EXPOSE 8080

# Run IOPaint with LaMA model (fast, good quality)
CMD ["iopaint", "start", "--model", "lama", "--port", "8080", "--host", "0.0.0.0"]
