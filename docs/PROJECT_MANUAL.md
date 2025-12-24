# CreationHub Project Manual

## 1. Architecture Overview

CreationHub is a self-hosted platform orchestrating **30+ Docker services** for AI, Media, Automation, and System Administration.

- **Orchestration**: Docker Compose
- **Platform**: Ubuntu Linux (Host)
- **Frontend**: Dashboard (React + Vite)
- **Backend API**: System API (Node.js) + PostgREST
- **Databases**: PostgreSQL 16 (Primary), Redis, SQLite (various services)
- **Monitoring**: Glances (Host), Grafana, Healthchecks
- **Security**: UFW Firewall, Nginx Proxy Manager (NPM)

---

## 2. Directory Structure

```plaintext
/home/inno/creationhub/
├── dashboard/               # Custom Dashboard Application
│   ├── src/                 # React Frontend Code
│   ├── system-api/          # Node.js API (Hardware/Docker control)
│   ├── full_schema.sql      # Database Schema
│   ├── nginx.conf           # Dashboard Nginx Config
│   └── Dockerfile           # Dashboard Container Build
│
├── orchestration/           # Docker Compose Stack
│   ├── services/            # Service YAML definitions
│   │   ├── ai-*.yml         # AI Services (Ollama, Whisper, TTS)
│   │   ├── core.yml         # Postgres, Redis, Portainer
│   │   ├── media.yml        # Nextcloud, FileBrowser
│   │   └── ...
│   ├── volumes/             # PERSISTENT DATA (Do not delete)
│   │   ├── postgres/        # Main DB storage
│   │   ├── nextcloud/       # Nextcloud data
│   │   ├── grafana/         # Dashboards & SQLite
│   │   └── ...
│   ├── .env                 # Environment secrets (Passwords, Paths)
│   └── install.sh           # Deployment script
│
└── docs/                    # Project documentation
```

---

## 3. Database Architecture (PostgreSQL)

**Container:** `creationhub-postgres` (Port 5432)
**User/Pass:** Defined in `.env` (`POSTGRES_USER`, `POSTGRES_PASSWORD`)

### Databases Created:
1. **db_dashboard** (Main)
   - **Purpose:** Stores analytics, admin users, ad integration data.
   - **Schema:** `admins`, `telegram_bots`, `telegram_ads`, `media_channels`, etc.
   - **Access:** Accessed via **PostgREST** (`creationhub_api`) on port 3003.

2. **db_n8n**
   - **Purpose:** Workflows and execution history for n8n.

3. **db_nextcloud**
   - **Purpose:** File metadata and sharing info for Nextcloud.

4. **db_healthchecks**
   - **Purpose:** Cron monitoring configuration.

5. **db_analytics**
   - **Purpose:** Future analytics storage.

---

## 4. Dashboard Integration

The Dashboard (`creationhub` container, Port 7777) aggregates 3 APIs:

1. **System API** (Port 9191)
   - **Source:** `/home/inno/creationhub/dashboard/system-api`
   - **Functions:**
     - `/api/system/*`: Hardware stats (CPU, RAM via Glances), OS info.
     - `/api/ai/*`: Proxy for Ollama, Whisper, TTS, Translate.
     - `/api/services/*`: Service health & discovery.
   - **Mounts:** `/var/run/docker.sock` (to control containers), `/proc` (host stats).

2. **PostgREST** (Port 3003)
   - **Container:** `creationhub_api`
   - **Function:** Auto-generates REST API from `db_dashboard` PostgreSQL database.
   - **Endpoints:** `/admins`, `/telegram_bots`, etc.

3. **Glances** (Host Port 61208)
   - **Role:** Deep hardware monitoring (GPU temps, NVMe health).
   - **Access:** Proxied via System API and Dashboard Nginx to host `192.168.1.220`.

---

## 5. Network & Security

### Docker Networks
- **creationhub-backend** (Internal): All services communicate here securely.
- **creationhub-egress** (External): Gateway for NPM and Dashboard to access internet.

### UFW Firewall Rules
- **WAN (Internet):**
  - `80`, `443` (NPM Proxy)
  - `22` (SSH)
- **LAN Only (192.168.1.0/24):**
  - All management ports: `7777` (Dash), `9000` (Portainer), `61208` (Glances), `5678` (n8n), etc.

---

## 6. Restoration Guide (How to Restore from Scratch)

### Prerequisites
1. Clean Ubuntu Server (Recommend 22.04/24.04).
2. Install Docker & Docker Compose.
3. Install `make`, `jq`, `unzip`, `python3-venv`.

### Step 1: Restore Files
Copy the backup of `/home/inno/creationhub/` to the new server.
**Critical:** You MUST have the `.env` file and `orchestration/volumes/` folder.

### Step 2: System Setup
```bash
# 1. Install System Dependencies
sudo apt update && sudo apt install -y lm-sensors ufw

# 2. Configure Firewall
sudo ufw default deny incoming
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# Allow LAN (adjust subnet if needed)
sudo ufw allow from 192.168.1.0/24
sudo ufw enable

# 3. Install Glances (Host Service)
pipx install "glances[all]"
pipx inject glances nvidia-ml-py pynvml
# Create systemd service (see docs/glances.service)
```

### Step 3: Start Services
```bash
cd /home/inno/creationhub/orchestration
./install.sh
```
This script will:
- Create Docker networks.
- Pull all 30+ images.
- Start containers in correct order.

### Step 4: Verify
1. Open Dashboard: `http://<LAN_IP>:7777`
2. Check AI Model Download: `docker exec -it creationhub_ollama ollama pull llama3`

---

## 7. Service Map

| Category | Service | Port | Description |
|---|---|---|---|
| **AI** | Ollama | 11434 | LLM Backend (Chat) |
| | Whisper | 8000 | Speech-to-Text |
| | LibreTranslate | 5000 | Translation |
| | Piper TTS | 10200 | Text-to-Speech |
| **Media** | Nextcloud | 8081 | Cloud Storage |
| | FileBrowser | 8082 | Web File Manager |
| **Admin** | Portainer | 9000 | Docker UI |
| | Adminer | 8083 | Database UI |
| | Glances | 61208 | System Monitor |
| | Grafana | 3001 | Visualizations |
| **Auto** | n8n | 5678 | Workflow Automation |
