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

# Confirm Launch
if (whiptail --title "Ready to Install" --yesno "Configuration complete.\n\nSelected Storage: $AI_PATH\n\nStart installation now? (This will run docker compose up)" 12 70); then
    echo "Starting CreationHub..."
    docker compose up -d --build
    
    # Check if we should pull Llama 3
    if (whiptail --title "AI Setup" --yesno "Do you want to download the Local Copilot model (Llama 3) now?\n\nThis is highly recommended for the Chat feature to work immediately.\nSize: ~4.7GB" 12 70); then
        echo "Downloading Llama 3... This may take a while."
        docker exec creationhub_ollama ollama pull llama3
        whiptail --title "Success" --msgbox "Llama 3 installed successfully!" 8 45
    fi

    whiptail --title "Installation Complete" --msgbox "CreationHub is running!\n\nOpen http://localhost:7777 in your browser." 10 60
else
    echo "Installation ready. Run 'docker compose up -d' manually."
fi
