#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

# Check for whiptail
if ! command -v whiptail &> /dev/null; then
    echo "Whiptail not found. Installing..."
    sudo apt-get update && sudo apt-get install -y whiptail
fi

# ===========================================
# LVM Auto-Extend (Ubuntu default uses only 100GB)
# ===========================================
if command -v lvextend &> /dev/null; then
    # Check if there's free space in the volume group
    VG_FREE=$(sudo vgs --noheadings -o vg_free --units g 2>/dev/null | tr -d ' g' | cut -d'.' -f1)
    if [ -n "$VG_FREE" ] && [ "$VG_FREE" -gt 5 ]; then
        echo -e "${GREEN}Found ${VG_FREE}GB unused space in LVM. Extending filesystem...${NC}"
        sudo lvextend -l +100%FREE /dev/ubuntu-vg/ubuntu-lv 2>/dev/null || true
        sudo resize2fs /dev/ubuntu-vg/ubuntu-lv 2>/dev/null || true
        echo -e "${GREEN}Filesystem extended successfully!${NC}"
    fi
fi

# Introduction
whiptail --title "CreationHub Setup" --msgbox "Welcome to the CreationHub Installation Wizard.\n\nThis guide will help you configure your storage and AI settings." 10 60

# Check for .env
if [ -f .env ]; then
    source .env
else
    if [ -f .env.example ]; then
        cp .env.example .env
        source .env
    fi
fi

# AI Storage Selection
AI_PATH=$(whiptail --title "AI Storage Configuration" --inputbox \
"CreationHub uses large AI models (Llama 3, Whisper, etc.) which can take 10GB+.\n\n\
Where should these models be stored?\n\
(Enter a path to a folder on your secondary drive, e.g., /mnt/ext_drive/ai-models)\n\n\
Default: ./ai_data" 15 70 "${AI_DATA_PATH:-./ai_data}" 3>&1 1>&2 2>&3)

if [ $? -ne 0 ]; then
    echo "Setup cancelled."
    exit 1
fi

# Create directory if it doesn't exist
mkdir -p "$AI_PATH"

# Enable/Disable Heavy AI Services
HEIGHT=15
WIDTH=60
CHOICE_HEIGHT=5
BACKTITLE="CreationHub Module Selection"
TITLE="AI Services"
MENU="Select which AI services to enable (Space to toggle):"

OPTIONS=(1 "Standard Chat (Llama 3) [~5GB]" ON
         2 "Transcription & Translation [~3GB]" ON
         3 "Stable Diffusion (Image Gen) [~10GB]" OFF
         4 "Full AV Dubbing Pipeline [~20GB + GPU]" OFF)

CHOICES=$(whiptail --title "$TITLE" --checklist \
"$MENU" $HEIGHT $WIDTH $CHOICE_HEIGHT \
"${OPTIONS[@]}" 3>&1 1>&2 2>&3)

# Update .env
# We are currently only handling the path for now, enabling services cleanly requires more complex composes or profiles.
# For now, we will just persist the path.

# Persist AI_PATH to .env
# Remove old entry if exists
sed -i '/AI_DATA_PATH=/d' .env
echo "AI_DATA_PATH=$AI_PATH" >> .env

echo -e "${GREEN}Configuration saved! AI Models will be stored in: $AI_PATH${NC}"

# ===========================================
# Pre-flight Checks
# ===========================================
if ! command -v docker &> /dev/null; then
    whiptail --title "Error" --msgbox "Docker is not installed!\n\nPlease install Docker first:\nhttps://docs.docker.com/engine/install/" 12 60
    exit 1
fi

if ! docker info &> /dev/null; then
    whiptail --title "Error" --msgbox "Docker daemon is not running or you don't have permissions.\n\nTry: sudo usermod -aG docker $USER" 12 60
    exit 1
fi

# ===========================================
# Database Network Check
# ===========================================
# Create external network if it doesn't exist
docker network create creationhub-backend 2>/dev/null || true

# Confirm Launch
if (whiptail --title "Ready to Install" --yesno "Configuration complete.\n\nSelected Storage: $AI_PATH\n\nStart installation now? (This will run docker compose up)" 12 70); then
    echo "Starting CreationHub..."
    
    # Use dashboard compose file
    cd dashboard
    docker compose up -d --build
    
    # ===========================================
    # Database Initialization
    # ===========================================
    echo -e "${GREEN}Waiting for PostgreSQL to be ready...${NC}"
    sleep 10
    
    # Check if PostgreSQL is ready
    for i in {1..30}; do
        if docker exec creationhub-postgres pg_isready -U postgres &>/dev/null; then
            echo -e "${GREEN}PostgreSQL is ready!${NC}"
            break
        fi
        echo "Waiting for PostgreSQL... ($i/30)"
        sleep 2
    done
    
    # Initialize database tables
    echo -e "${GREEN}Initializing database...${NC}"
    docker exec -i creationhub-postgres psql -U postgres < init_db.sql 2>/dev/null || true
    
    # Apply any additional migration scripts
    if [ -f scripts/fix_missing_tables.sql ]; then
        docker exec -i creationhub-postgres psql -U postgres < scripts/fix_missing_tables.sql 2>/dev/null || true
    fi
    
    # Reload PostgREST schema cache
    docker kill -s SIGUSR1 creationhub_api 2>/dev/null || true
    echo -e "${GREEN}Database initialized!${NC}"
    
    cd ..
    
    # Check if we should pull Llama 3
    if (whiptail --title "AI Setup" --yesno "Do you want to download the Local Copilot model (Llama 3) now?\n\nThis is highly recommended for the Chat feature to work immediately.\nSize: ~4.7GB" 12 70); then
        echo "Downloading Llama 3... This may take a while."
        docker exec creationhub_ollama ollama pull llama3
        whiptail --title "Success" --msgbox "Llama 3 installed successfully!" 8 45
    fi

    # Get server IP
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    whiptail --title "Installation Complete" --msgbox "CreationHub is running!\n\nOpen http://${SERVER_IP}:7777 in your browser.\n\nServices:\n- Dashboard: :7777\n- Portainer: :9000\n- n8n: :5678" 14 60
else
    echo "Installation ready. Run 'cd dashboard && docker compose up -d' manually."
fi

