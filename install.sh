#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ===========================================
# Whiptail Check
# ===========================================
if ! command -v whiptail &> /dev/null; then
    echo "Whiptail not found. Installing..."
    sudo apt-get update && sudo apt-get install -y whiptail
fi

# ===========================================
# LVM Auto-Extend (Ubuntu default uses only 100GB)
# ===========================================
if command -v lvextend &> /dev/null; then
    VG_FREE=$(sudo vgs --noheadings -o vg_free --units g 2>/dev/null | tr -d ' g' | cut -d'.' -f1)
    if [ -n "$VG_FREE" ] && [ "$VG_FREE" -gt 5 ]; then
        echo -e "${GREEN}Found ${VG_FREE}GB unused space in LVM. Extending filesystem...${NC}"
        sudo lvextend -l +100%FREE /dev/ubuntu-vg/ubuntu-lv 2>/dev/null || true
        sudo resize2fs /dev/ubuntu-vg/ubuntu-lv 2>/dev/null || true
        echo -e "${GREEN}Filesystem extended successfully!${NC}"
    fi
fi

# ===========================================
# Introduction
# ===========================================
whiptail --title "CreationHub Setup" --msgbox "Welcome to the CreationHub Installation Wizard.\n\nThis guide will help you configure your storage and AI settings." 10 60

# ===========================================
# Environment Setup
# ===========================================
# Create .env if it doesn't exist
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}Created .env from template${NC}"
    else
        # Create minimal .env
        touch .env
        echo -e "${YELLOW}Created empty .env file${NC}"
    fi
fi
source .env 2>/dev/null || true

# ===========================================
# AI Storage Configuration
# ===========================================
# Use temp file to properly capture exit code
AI_PATH_TMP=$(mktemp)
whiptail --title "AI Storage Configuration" --inputbox \
"CreationHub uses large AI models (Llama 3, Whisper, etc.) which can take 10GB+.\n\n\
Where should these models be stored?\n\
(Enter path on secondary drive, e.g., /mnt/hdd/ai-models)\n\n\
Default: ./ai_data" 15 70 "${AI_DATA_PATH:-./ai_data}" 2>"$AI_PATH_TMP"

WHIPTAIL_EXIT=$?
AI_PATH=$(cat "$AI_PATH_TMP")
rm -f "$AI_PATH_TMP"

if [ $WHIPTAIL_EXIT -ne 0 ]; then
    echo -e "${RED}Setup cancelled by user.${NC}"
    exit 1
fi

# Validate and create directory
if [ -z "$AI_PATH" ]; then
    AI_PATH="./ai_data"
fi
mkdir -p "$AI_PATH"

# ===========================================
# AI Services Selection
# ===========================================
SERVICES_TMP=$(mktemp)
whiptail --title "AI Services" --checklist \
"Select which AI services to enable (Space to toggle):" 16 70 5 \
"ENABLE_CHAT" "Standard Chat (Llama 3) [~5GB]" ON \
"ENABLE_TRANSCRIBE" "Transcription & Translation [~3GB]" ON \
"ENABLE_IMAGE" "Stable Diffusion (Image Gen) [~10GB]" OFF \
"ENABLE_DUBBING" "Full AV Dubbing Pipeline [~20GB + GPU]" OFF \
2>"$SERVICES_TMP"

SELECTED_SERVICES=$(cat "$SERVICES_TMP")
rm -f "$SERVICES_TMP"

# ===========================================
# Save Configuration to .env
# ===========================================
# Remove old entries
sed -i '/^AI_DATA_PATH=/d' .env 2>/dev/null || true
sed -i '/^ENABLE_CHAT=/d' .env 2>/dev/null || true
sed -i '/^ENABLE_TRANSCRIBE=/d' .env 2>/dev/null || true
sed -i '/^ENABLE_IMAGE=/d' .env 2>/dev/null || true
sed -i '/^ENABLE_DUBBING=/d' .env 2>/dev/null || true

# Write new values
echo "AI_DATA_PATH=$AI_PATH" >> .env

# Parse selected services
ENABLE_CHAT="false"
ENABLE_TRANSCRIBE="false"
ENABLE_IMAGE="false"
ENABLE_DUBBING="false"

if [[ "$SELECTED_SERVICES" == *"ENABLE_CHAT"* ]]; then ENABLE_CHAT="true"; fi
if [[ "$SELECTED_SERVICES" == *"ENABLE_TRANSCRIBE"* ]]; then ENABLE_TRANSCRIBE="true"; fi
if [[ "$SELECTED_SERVICES" == *"ENABLE_IMAGE"* ]]; then ENABLE_IMAGE="true"; fi
if [[ "$SELECTED_SERVICES" == *"ENABLE_DUBBING"* ]]; then ENABLE_DUBBING="true"; fi

echo "ENABLE_CHAT=$ENABLE_CHAT" >> .env
echo "ENABLE_TRANSCRIBE=$ENABLE_TRANSCRIBE" >> .env
echo "ENABLE_IMAGE=$ENABLE_IMAGE" >> .env
echo "ENABLE_DUBBING=$ENABLE_DUBBING" >> .env

echo -e "${GREEN}Configuration saved!${NC}"
echo -e "  AI Storage: ${AI_PATH}"
echo -e "  Chat (Llama): ${ENABLE_CHAT}"
echo -e "  Transcribe: ${ENABLE_TRANSCRIBE}"
echo -e "  Images: ${ENABLE_IMAGE}"
echo -e "  Dubbing: ${ENABLE_DUBBING}"

# ===========================================
# Pre-flight Checks
# ===========================================
if ! command -v docker &> /dev/null; then
    whiptail --title "Error" --msgbox "Docker is not installed!\n\nPlease install Docker first:\nhttps://docs.docker.com/engine/install/" 12 60
    exit 1
fi

if ! docker info &> /dev/null 2>&1; then
    whiptail --title "Error" --msgbox "Docker daemon is not running or you don't have permissions.\n\nTry: sudo usermod -aG docker \$USER\nThen log out and back in." 12 60
    exit 1
fi

# Create external network if it doesn't exist
docker network create creationhub-backend 2>/dev/null || true

# ===========================================
# Confirm and Launch
# ===========================================
SUMMARY="Configuration Summary:\n\n"
SUMMARY+="AI Storage: $AI_PATH\n"
SUMMARY+="Chat (Llama 3): $ENABLE_CHAT\n"
SUMMARY+="Transcription: $ENABLE_TRANSCRIBE\n\n"
SUMMARY+="Start installation now?"

if ! whiptail --title "Ready to Install" --yesno "$SUMMARY" 14 60; then
    echo -e "${YELLOW}Installation cancelled. Run 'cd dashboard && docker compose up -d' manually.${NC}"
    exit 0
fi

echo -e "${GREEN}Starting CreationHub...${NC}"

# ===========================================
# Docker Compose Up
# ===========================================
cd dashboard
docker compose up -d --build

# ===========================================
# Database Initialization
# ===========================================
echo -e "${GREEN}Waiting for PostgreSQL to be ready...${NC}"

# Wait for PostgreSQL with timeout
POSTGRES_READY=false
for i in {1..30}; do
    if docker exec creationhub-postgres pg_isready -U postgres &>/dev/null; then
        echo -e "${GREEN}PostgreSQL is ready!${NC}"
        POSTGRES_READY=true
        break
    fi
    echo "Waiting for PostgreSQL... ($i/30)"
    sleep 2
done

if [ "$POSTGRES_READY" = true ]; then
    echo -e "${GREEN}Initializing database...${NC}"
    docker exec -i creationhub-postgres psql -U postgres < init_db.sql 2>/dev/null || echo -e "${YELLOW}Warning: Some tables may already exist${NC}"
    
    # Apply migrations if exist
    if [ -f scripts/fix_missing_tables.sql ]; then
        docker exec -i creationhub-postgres psql -U postgres < scripts/fix_missing_tables.sql 2>/dev/null || true
    fi
    
    # Reload PostgREST schema cache
    docker kill -s SIGUSR1 creationhub_api 2>/dev/null || true
    echo -e "${GREEN}Database initialized!${NC}"
else
    echo -e "${RED}Warning: PostgreSQL did not become ready. Database not initialized.${NC}"
fi

cd ..

# ===========================================
# AI Model Download (Optional)
# ===========================================
if [ "$ENABLE_CHAT" = "true" ]; then
    if whiptail --title "AI Setup" --yesno "Download the Local Copilot model (Llama 3) now?\n\nThis is recommended for Chat to work immediately.\nSize: ~4.7GB" 12 60; then
        echo -e "${GREEN}Downloading Llama 3... This may take a while.${NC}"
        if docker exec creationhub_ollama ollama pull llama3; then
            whiptail --title "Success" --msgbox "Llama 3 installed successfully!" 8 45
        else
            whiptail --title "Warning" --msgbox "Llama 3 download failed. You can try later with:\ndocker exec creationhub_ollama ollama pull llama3" 10 60
        fi
    fi
fi

# ===========================================
# Completion
# ===========================================
SERVER_IP=$(hostname -I | awk '{print $1}')

whiptail --title "Installation Complete" --msgbox "CreationHub is running!\n\n\
Open http://${SERVER_IP}:7777 in your browser.\n\n\
Services:\n\
- Dashboard: :7777\n\
- Portainer: :9000\n\
- n8n: :5678\n\
- Grafana: :3000" 16 60

echo -e "${GREEN}===========================================
CreationHub Installation Complete!
===========================================
Dashboard: http://${SERVER_IP}:7777
Portainer: http://${SERVER_IP}:9000
n8n:       http://${SERVER_IP}:5678
===========================================${NC}"
