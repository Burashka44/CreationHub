#!/bin/bash
# ===========================================
# GPU Settings Persistence Script
# ===========================================
# Run this after reboot or add to cron @reboot
# Sets GPU to:
#   - Persistence mode (faster response)
#   - Temperature target 75°C (thermal throttling)

set -e

echo "Configuring GPU..."

# Check if nvidia-smi is available
if ! command -v nvidia-smi &> /dev/null; then
    echo "nvidia-smi not found. Is NVIDIA driver installed?"
    exit 1
fi

# Enable persistence mode (keeps GPU initialized)
sudo nvidia-smi -pm 1

# Set GPU temperature target to 75°C
# GPU will throttle to stay below this temp
sudo nvidia-smi -gtt 75

# Optional: Set power limit (uncomment if needed)
# sudo nvidia-smi -pl 200  # 200W power limit

echo "GPU configured successfully:"
nvidia-smi --query-gpu=name,persistence_mode,temperature.gpu,power.limit --format=csv
