#!/usr/bin/env bash
set -euo pipefail

# ==================================================
# CreationHub Orchestrator (install.sh)
# Architecture V1
# ==================================================

PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STATE_DIR="$PROJECT_ROOT/state"
ANSWERS_FILE="$STATE_DIR/answers.json"
LOG_DIR="$PROJECT_ROOT/logs"
LOG_FILE="$LOG_DIR/install.log"

# --------------------------------------------------
# Helpers
# --------------------------------------------------
log() {
  local msg="[$(date '+%H:%M:%S')] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

require_root() {
  if [[ $EUID -ne 0 ]]; then
    echo "ERROR: Must run as root (sudo)."
    exit 1
  fi
}

setup_logging() {
  mkdir -p "$STATE_DIR" "$LOG_DIR"
  touch "$LOG_FILE"
  chmod 600 "$LOG_FILE"
}

banner() {
  clear
  echo "=================================================="
  echo " CreationHub Installer V1"
  echo "=================================================="
}

# --------------------------------------------------
# Phase 0: Pre-flight
# --------------------------------------------------
preflight_checks() {
  require_root
  setup_logging
  banner
  
  log "[PREFLIGHT] Checking OS..."
  if ! grep -qi "ubuntu" /etc/os-release; then
    log "ERROR: Ubuntu required."
    exit 1
  fi

}

detect_hardware() {
  # CPU
  local cpu_model
  cpu_model=$(grep -m1 'model name' /proc/cpuinfo | awk -F: '{print $2}' | xargs)
  local cpu_cores
  cpu_cores=$(nproc)
  
  # RAM
  local ram_gb
  ram_gb=$(free -h | awk '/^Mem:/ {print $2}')
  
  # Disk (Physical only, heuristic)
  local disks
  disks=$(lsblk -d -o NAME,SIZE,TYPE -e 7,11 | grep disk | awk '{print $1 "(" $2 ")"} ' | tr '\n' ', ')
  
  # GPU
  local gpu="None"
  if lspci | grep -i nvidia >/dev/null; then
     gpu=$(lspci | grep -i nvidia | head -n1 | cut -d: -f3 | xargs)
  fi

  echo "SYSTEM HARDWARE:"
  echo "----------------"
  echo "CPU:  $cpu_model ($cpu_cores Threads)"
  echo "RAM:  $ram_gb"
  echo "GPU:  $gpu"
  echo "DISK: $disks"
}

# --------------------------------------------------
# Phase 1: UI
# --------------------------------------------------
run_whiptail_ui() {
  local hw_info
  hw_info=$(detect_hardware)
  
  # Welcome Screen
  whiptail --title "CreationHub Installer V1.3" --msgbox \
    "Welcome to CreationHub Setup!\n\n$hw_info\n\nWe will now configure your Personal Media & Automation Center.\nReady?" 20 78
    
  log "[UI] Starting Wizard (V2 Spec)..."
  
  local hostname="CreationHub"
  local timezone="Europe/Moscow"
  local email="simonredison@gmail.com"
  local db_pass="Tarantul1310"
  local wireguard="false"
  local dns="1.1.1.1"
  local telegram="@Urban1a"
  local services
  
  if [[ -f "$ANSWERS_FILE" ]]; then
    if (whiptail --title "Existing Configuration" --yesno "Found existing configuration. Use it?" 10 60); then
        log "[UI] Using existing configuration."
        return
    fi
  fi

  # Navigation State Machine
  local step=1
  while true; do
      case $step in
          1) # Hostname
              hostname=$(whiptail --inputbox "Step 1/9: Enter System Hostname:" 8 78 "$hostname" --title "Hostname" --ok-button "Next" --cancel-button "Exit" 3>&1 1>&2 2>&3)
              if [[ $? -ne 0 ]]; then exit 0; fi 
              step=$((step+1))
              ;;
          2) # Timezone
              timezone=$(whiptail --menu "Step 2/9: Select Timezone" 15 60 5 \
                "UTC" "Universal Coordinated Time" \
                "America/New_York" "New York" \
                "Europe/Moscow" "Moscow" \
                "Asia/Sakhalin" "Sakhalin" \
                "Asia/Shanghai" "China/Shanghai" --default-item "$timezone" --ok-button "Next" --cancel-button "Back" 3>&1 1>&2 2>&3)
              if [[ $? -ne 0 ]]; then step=$((step-1)); continue; fi
              step=$((step+1))
              ;;
          3) # Email
              email=$(whiptail --inputbox "Step 3/9: Enter Admin Email:" 8 78 "$email" --title "Identity" --ok-button "Next" --cancel-button "Back" 3>&1 1>&2 2>&3)
              if [[ $? -ne 0 ]]; then step=$((step-1)); continue; fi
              step=$((step+1))
              ;;
          4) # Password
              db_pass=$(whiptail --inputbox "Step 4/9: Global Password:" 8 78 "$db_pass" --title "Secrets" --ok-button "Next" --cancel-button "Back" 3>&1 1>&2 2>&3)
              if [[ $? -ne 0 ]]; then step=$((step-1)); continue; fi
              step=$((step+1))
              ;;
          5) # Telegram (Moved to 5)
              telegram=$(whiptail --inputbox "Step 5/9: Telegram Username:" 8 78 "$telegram" --title "Contacts" --ok-button "Next" --cancel-button "Back" 3>&1 1>&2 2>&3)
              if [[ $? -ne 0 ]]; then step=$((step-1)); continue; fi
              step=$((step+1))
              ;;
          6) # AI STORAGE (Disk Selection)
              log "[UI] Step 6: AI Storage Configuration"
              
              # Detect physical disks/partitions (exclude loops, tmpfs, overlay)
              local disks
              disks=$(df -h --output=source,size,avail,target -x tmpfs -x devtmpfs -x overlay -x squashfs 2>/dev/null | grep -v "Filesystem" | awk '{print $4 " [" $2 " Total | " $3 " Free]"}')
              
              if [[ -z "$disks" ]]; then
                  whiptail --msgbox "No suitable data drives found!\nDefaulting to ./volumes/ai_models" 10 50
                  ai_storage_path="./volumes/ai_models"
                  step=$((step+1))
              else
                  # Create array for whiptail
                  declare -a disk_menu=()
                  while IFS= read -r line; do
                      local mount_point
                      mount_point=$(echo "$line" | awk '{print $1}')
                      local info
                      info=$(echo "$line" | cut -d' ' -f2-)
                      disk_menu+=("$mount_point" "$info")
                  done <<< "$disks"
                  
                  local selected_mount
                  selected_mount=$(whiptail --title "Step 6/9: Select AI Storage Drive" --menu \
                  "Select a drive for AI models (Llama 3, Stable Diffusion, etc.)\n\nModels will be stored in: <Drive>/ai_models\nRecommended: Choose the drive with most free space." 18 78 6 \
                  "${disk_menu[@]}" 3>&1 1>&2 2>&3)
                  
                  if [[ $? -ne 0 ]]; then step=$((step-1)); continue; fi
                  
                  # Set path based on selection
                  if [[ "$selected_mount" == "/" ]]; then
                      ai_storage_path="/ai_models"
                  else
                      ai_storage_path="${selected_mount%/}/ai_models"
                  fi
                  
                  # Confirm
                  if (whiptail --title "Confirm AI Storage Path" --yesno "AI Models will be stored in:\n\n$ai_storage_path\n\nProceed?" 12 60); then
                      step=$((step+1))
                  else
                      # Manual override
                      ai_storage_path=$(whiptail --inputbox "Enter custom path for AI models:" 10 60 "$ai_storage_path" 3>&1 1>&2 2>&3)
                      step=$((step+1))
                  fi
              fi
              ;;
          7) # Wireguard (Shifted)
              local wg_choice
              wg_choice=$(whiptail --menu "Step 7/9: Enable WireGuard VPN?" 14 65 3 \
                 "Yes" "Enable VPN Access" \
                 "No" "Disable VPN Access" \
                 "Back" "Go Previous Step" 3>&1 1>&2 2>&3)
              
              if [[ "$wg_choice" == "Back" ]]; then step=$((step-1)); continue; fi
              if [[ -z "$wg_choice" ]]; then step=$((step-1)); continue; fi
              if [[ "$wg_choice" == "Yes" ]]; then wireguard="true"; else wireguard="false"; fi
              step=$((step+1))
              ;;
          8) # DNS
              if [[ "$wireguard" == "false" ]]; then
                  dns=$(whiptail --menu "Step 8/9: Select Upstream DNS" 15 60 4 \
                    "1.1.1.1" "Cloudflare" \
                    "8.8.8.8" "Google" \
                    "77.88.8.8" "Yandex" \
                    "9.9.9.9" "Quad9" --default-item "$dns" --ok-button "Next" --cancel-button "Back" 3>&1 1>&2 2>&3)
                  if [[ $? -ne 0 ]]; then step=$((step-1)); continue; fi
              fi
              step=$((step+1))
              ;;
          9) # Services
               services=$(whiptail --title "Step 9/9: Select Services" --checklist \
                "Select components to enable:" 22 78 12 \
                "npm"          "[CORE] Nginx Proxy Manager" ON \
                "postgres"     "[CORE] PostgreSQL" ON \
                "redis"        "[CORE] Redis" ON \
                "portainer"    "[ADMIN] Portainer" ON \
                "dozzle"       "[ADMIN] Dozzle" ON \
                "watchtower"   "[ADMIN] Watchtower" ON \
                "glances"      "[ADMIN] Glances" ON \
                "grafana"      "[STATS] Grafana" ON \
                "landing"      "[WEB] Landing Page" ON \
                "adminer"      "[ADMIN] Adminer" ON \
                "wireguard-ui" "[ADMIN] WireGuard UI" ON \
                "firewall-ui"  "[ADMIN] Firewall UI" ON \
                "n8n"          "[AUTO] n8n" ON \
                "browserless"  "[AUTO] Browserless" ON \
                "rsshub"       "[AUTO] RSSHub" ON \
                "nextcloud"    "[CLOUD] Nextcloud" ON \
                "filebrowser"  "[CLOUD] Filebrowser" ON \
                "media"        "[MEDIA] Media Stack" ON \
                "ai-chat"       "[AI] Local ChatGPT (Llama 3)" ON \
                "ai-image"      "[AI] Image Gen (Stable Diffusion)" OFF \
                "ai-transcribe" "[AI] Whisper GPU" ON \
                "ai-translate"  "[AI] Translate" ON \
                "ai-tts"        "[AI] Piper TTS" ON \
                "homepage"     "[DASH] Homepage" ON \
                "healthchecks" "[MON] Healthchecks" ON \
                --ok-button "Install" --cancel-button "Back" 3>&1 1>&2 2>&3)
                
               if [[ $? -ne 0 ]]; then step=$((step-1)); continue; fi
               break # DONE
               ;;
      esac
  done

  # Sanitize services
  services=$(echo "$services" | tr -d '"')

  cat <<EOF > "$ANSWERS_FILE"
{
  "hostname": "$hostname",
  "timezone": "$timezone",
  "admin_email": "$email",
  "db_password": "$db_pass",
  "wireguard_enabled": "$wireguard",
  "dns_provider": "$dns",
  "telegram_contact": "$telegram",
  "ai_storage_path": "${ai_storage_path:-./volumes/ai_models}",
  "services_raw": "$services" 
}
EOF
  log "[UI] Configuration saved."
}

# --------------------------------------------------
# Phase 2: Install
# --------------------------------------------------
phase_install() {
  log "=================================================="
  log " PHASE: INSTALL"
  log "=================================================="
  
  # Prevent interactive prompts during apt
  export DEBIAN_FRONTEND=noninteractive
  
  log "[INSTALL] Updating system..."
  apt-get update -qq
  
  # Base Tools
  log "[INSTALL] Installing base dependencies..."
  apt-get install -y -qq \
    curl wget git jq whiptail \
    ca-certificates gnupg lsb-release \
    wireguard wireguard-tools \
    apt-transport-https

  # Docker
  if ! command -v docker >/dev/null; then
     log "[INSTALL] Installing Docker..."
     mkdir -p /etc/apt/keyrings
     curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
     echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
     apt-get update -qq
     apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  else
     log "[INSTALL] Docker already installed."
  fi
  
  # Nvidia GPU Detection & Install
  if lspci | grep -i nvidia >/dev/null; then
     log "[INSTALL] Nvidia GPU Detected."
     if ! command -v nvidia-smi >/dev/null; then
        apt-get install -y -qq ubuntu-drivers-common
        ubuntu-drivers autoinstall
     fi
     # Nvidia Container Toolkit
     if ! dpkg -s nvidia-container-toolkit >/dev/null 2>&1; then
        log "[INSTALL] Installing Nvidia Container Toolkit..."
        curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor --yes -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
        curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
          sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
          tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
        apt-get update -qq
        apt-get install -y -qq nvidia-container-toolkit
        nvidia-ctk runtime configure --runtime=docker
        systemctl restart docker
     fi
  fi
}

# --------------------------------------------------
# Phase 3: Configure
# --------------------------------------------------
phase_configure() {
  log "=================================================="
  log " PHASE: CONFIGURE"
  log "=================================================="
  
  if [[ -f "$PROJECT_ROOT/apply_config.sh" ]]; then
    chmod +x "$PROJECT_ROOT/apply_config.sh"
    "$PROJECT_ROOT/apply_config.sh" >> "$LOG_FILE" 2>&1
    local status=$?
    if [[ $status -ne 0 ]]; then
        log "ERROR: Configuration failed. Check logs."
        exit $status
    fi
  else
    log "ERROR: apply_config.sh not found!"
    exit 1
  fi
}

# --------------------------------------------------
# Phase 4: Start
# --------------------------------------------------
phase_start() {
  log "=================================================="
  log " PHASE: START"
  log "=================================================="
  
  cd "$PROJECT_ROOT"
  
  if [ -f .env ]; then
    set -a
    source .env
    set +a
  fi
  
  # Permission Fix
  log "[START] Fixing volume permissions..."
  mkdir -p "$PROJECT_ROOT/volumes/postgres"
  mkdir -p "$PROJECT_ROOT/volumes/media/downloads"
  mkdir -p "$PROJECT_ROOT/volumes/media/processing"
  mkdir -p "$PROJECT_ROOT/volumes/media/upload_ready"
  mkdir -p "$PROJECT_ROOT/volumes/redis"
  mkdir -p "$PROJECT_ROOT/volumes/ai/whisper"
  mkdir -p "$PROJECT_ROOT/volumes/ai/translate"
  mkdir -p "$PROJECT_ROOT/volumes/ai/piper"
  mkdir -p "$PROJECT_ROOT/volumes/ai/piper"

  # External AI Storage (If Configured)
  if [[ -n "${AI_DATA_PATH:-}" ]]; then
      log "[START] Creating AI Model directories at: $AI_DATA_PATH"
      # Structure: <Drive>/ai_models/{ollama,stable-diffusion,etc}
      mkdir -p "$AI_DATA_PATH/ollama"
      mkdir -p "$AI_DATA_PATH/stable-diffusion/data"
      mkdir -p "$AI_DATA_PATH/stable-diffusion/output"
      
      # Set permissive permissions
      chmod -R 777 "$AI_DATA_PATH" || true
  fi

  mkdir -p "$PROJECT_ROOT/volumes/grafana"
  mkdir -p "$PROJECT_ROOT/volumes/landing"
  # Postgres (uid 70 or 999 usually, we use 999 for alpine often, or simple chmod 777 for homelab simplicity to avoid id hell)
  # Using 777 on bind-mounted data dirs is the most robust 'it just works' method for homelab without complex user mapping
  chmod 777 "$PROJECT_ROOT/volumes/postgres"
  chmod 777 "$PROJECT_ROOT/volumes/redis"
  chmod 777 "$PROJECT_ROOT/volumes/grafana"
  mkdir -p "$PROJECT_ROOT/volumes/vpn/configs"
  mkdir -p "$PROJECT_ROOT/volumes/vpn/active"
  chmod -R 777 "$PROJECT_ROOT/volumes/ai" "$PROJECT_ROOT/volumes/vpn"

  log "[START] Determining enabled services..."
  
  # Default foundation
  COMPOSE_ARGS="-f services/base.yml -f services/vpn.yml"
  
  # Read selected services from JSON (requires jq now)
  if [[ -f "$ANSWERS_FILE" ]]; then
     RAW_SERVICES=$(jq -r '.services_raw' "$ANSWERS_FILE" | tr -d '"')
     # e.g. "npm portainer adminer"
     
     for svc in $RAW_SERVICES; do
        if [[ -f "services/${svc}.yml" ]]; then
            log " + Enabled: $svc"
            COMPOSE_ARGS="$COMPOSE_ARGS -f services/${svc}.yml"
        else
            log " ! Warning: Service '$svc' selected but services/${svc}.yml not found"
        fi
     done
  else
     log "Warning: No answers file found, bringing up base only."
  fi
  
  log "[START] Running: docker compose $COMPOSE_ARGS up -d"
  docker compose $COMPOSE_ARGS up -d --remove-orphans

  # Post-Start: AI Models Check
  if [[ "$RAW_SERVICES" == *"ai-chat"* ]]; then
      if (whiptail --title "AI Setup" --yesno "CreationHub AI Copilot (Ollama) detected.\n\nDo you want to download the Llama 3 model now?\nThis is required for the Chat feature to work.\n\nSize: ~4.7GB" 14 70); then
          log "[START] Pulling Llama 3 model..."
          docker exec creationhub_ollama ollama pull llama3 || log "Warning: Ollama pull failed"
          whiptail --title "Success" --msgbox "Llama 3 installed successfully!" 8 50
      fi
  fi
}

# --------------------------------------------------
# Summary
# --------------------------------------------------
show_summary() {
  local ip_wan
  ip_wan=$(curl -s ifconfig.me || echo "Unknown")
  local ip_lan
  ip_lan=$(hostname -I | awk '{print $1}')
  
  local summary_text="INSTALLATION SUCCESS!\n\n"
  summary_text+="Core Endpoints:\n"
  summary_text+="--------------------------------\n"
  summary_text+="Dashboard:  http://$ip_lan:3000\n"
  summary_text+="NPM Admin:  http://$ip_lan:81\n"
  summary_text+="Portainer:  http://$ip_lan:9000\n"
  summary_text+="n8n:        http://$ip_lan:5678\n"
  summary_text+="\n"
  summary_text+="Configs:    $STATE_DIR/answers.json\n"
  summary_text+="Log:        $LOG_FILE\n\n"
  summary_text+="Please reboot if WireGuard was just installed."
  
  whiptail --title "Installation Complete" --msgbox "$summary_text" 20 70
  
  echo ""
  echo "=================================================="
  echo " FINAL STATUS"
  echo "=================================================="
  docker compose ps --format "table {{.Name}}\t{{.State}}\t{{.Ports}}"
}

# --------------------------------------------------
# Main
# --------------------------------------------------
main() {
  preflight_checks
  run_whiptail_ui
  phase_install
  phase_configure
  phase_start
  show_summary
}

main "$@"

