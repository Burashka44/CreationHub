# CreationHub Self-Hosting Guide

This guide describes how to deploy the full CreationHub stack (Dashboard, System API, AI Hub, Database) from scratch using Docker Compose.

## Prerequisites

- **OS**: Linux (Ubuntu 22.04+ recommended), macOS, or Windows (WSL2).
- **Docker**: Engine 24+ and Docker Compose (V2).
- **Resources**: 
  - Minimum: 4 CPU cores, 8GB RAM (for basic metrics).
  - Recommended for AI: 16GB+ RAM, NVIDIA GPU (with NVIDIA Container Toolkit installed) for fast inference.

## Quick Start (Production/Dev)

### 1. Clone Repository

```bash
git clone https://github.com/Burashka44/CreationHub.git
cd CreationHub
```

### 2. Environment Setup

Create the `.env` file from the example:

```bash
cp .env.example .env
```

**Critical Variables to Check:**
- `VITE_SUPABASE_URL`: Ensure it points to `/api/v1` (internal proxy) or your external URL.
- `POSTGRES_PASSWORD`: Set a secure password.
- `JWT_SECRET`: Generate a secure key for API tokens.

### 3. Build and Start Services

Run the entire stack with Docker Compose:

```bash
# Using new Docker Compose V2 syntax
docker compose up -d --build
```

Wait a few minutes for all containers to build and start.

### 4. Install AI Models (Critical)

By default, the Ollama container starts empty. You must pull the initial models for Chat to work.

```bash
# Pull Llama 3 (Required for Chat and Summarization)
docker exec creationhub_ollama ollama pull llama3
```

*Note: This downloads ~4.7GB. Ensure you have stable internet.*

### 5. Access the Dashboard

Open your browser:
- **URL**: `http://localhost:7777` (or your server IP).

---

## Architecture Overview

The system runs as a set of microservices orchestrated by Docker Compose:

| Service | Container Name | Internal Port | Description |
|---------|----------------|---------------|-------------|
| **Frontend** | `creationhub` | 80 | React/Vite Dashboard + Nginx Proxy |
| **Backend** | `creationhub_system_api` | 9191 | Express-based System API (AI Proxy, Stats) |
| **AI Engine** | `creationhub_ollama` | 11434 | LLM Inference (Llama 3) |
| **Transcribe** | `creationhub-ai-transcribe` | 8000 | Faster-Whisper |
| **Translate** | `creationhub-ai-translate` | 5000 | LibreTranslate |
| **TTS** | `creationhub-ai-tts` | 10200 | Piper TTS |
| **Database** | `creationhub-postgres` | 5432 | PostgreSQL |

## Troubleshooting

### Chat returns 502 or Empty Response
- Ensure you ran **Step 4** (Pull Llama 3).
- Check logs: `docker logs creationhub_system_api`.

### "Service not installed" for Image/Video
- This is expected behavior if you don't have the heavy Stable Diffusion/AV containers enabled in `docker-compose.yml`.

### Updating
To update the simplified stack:
```bash
git pull
docker compose up -d --build
```
