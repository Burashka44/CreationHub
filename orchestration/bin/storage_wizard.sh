#!/usr/bin/env bash
set -u

# ==================================================
# CreationHub Storage Wizard V2 (storage_wizard.sh)
# Logic: Safe Discovery -> Partitioning -> Mounting
# ==================================================

PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
LOG_FILE="$PROJECT_ROOT/logs/storage.log"
VOLUMES_DIR="$PROJECT_ROOT/volumes"
BACKUPS_DIR="$PROJECT_ROOT/backups"

log() {
  local msg="[$(date '+%H:%M:%S')] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

require_root() {
  if [[ $EUID -ne 0 ]]; then
    whiptail --title "Error" --msgbox "Must run as root (sudo)." 8 40
    exit 1
  fi
}

install_deps() {
    if ! command -v parted >/dev/null; then
        apt-get update -qq && apt-get install -y -qq parted
    fi
}

# --------------------------------------------------
# 1. Safe Discovery
# --------------------------------------------------
get_storage_summary() {
    echo "Filesystem      Size  Used Avail Use%"
    df -h --output=target,size,used,avail,pcent -x tmpfs -x devtmpfs -x overlay -x squashfs | grep -vE "^/snap|^/boot" | head -n 10
}

select_disk() {
  local root_disk=""
  # Identify root disk
  for dev in $(lsblk -d -n -o NAME); do
       if lsblk -n -o MOUNTPOINT "/dev/$dev" | grep -q -E "^/$|^/boot"; then
           root_disk="$dev"
           break
       fi
  done
  
  local disk_list=""
  
  # Build list
  while read -r name size type model; do
      if [[ "$name" != "$root_disk" ]]; then
          if [[ -z "$model" ]]; then model="Generic"; fi
          safe_model=$(echo "$model" | tr ' ' '_')
          disk_list+="$name ${size}-${safe_model} OFF "
      fi
  done < <(lsblk -d -n -o NAME,SIZE,TYPE,MODEL -e 7,11 | grep "disk")
  
  local summary
  summary=$(get_storage_summary)
  
  if [[ -z "$disk_list" ]]; then
    echo "----------------------------------------------------------------" >&2
    echo " ERROR: No valid storage disks found!" >&2
    echo "----------------------------------------------------------------" >&2
    echo "$summary" >&2
    return 1
  fi

  local disk
  disk=$(whiptail --title "Select Disk" --radiolist \
    "Disks Status:\n$summary\n\nSelect a disk to initialize (SPACE to select):" 25 90 5 \
    $disk_list 3>&1 1>&2 2>&3 < /dev/tty)
  
  if [[ -z "$disk" ]]; then return 1; fi
  
  echo "$disk" | tr -d '"'
}

# --------------------------------------------------
# 2. Partitioning Logic
# --------------------------------------------------
partition_disk() {
  local disk="$1"
  local dev="/dev/$disk"
  
  local action
  action=$(whiptail --title "Strategy" --menu "How to use $disk?" 15 60 3 \
    "DATA"  "Main Storage (Cloud, Files, Media)" \
    "SPLIT" "Split: Data + Backups (Recommended)" \
    "BACKUP" "Dedicate Disk to Backups" 3>&1 1>&2 2>&3)
    
  if [[ -z "$action" ]]; then return 1; fi

  if ! (whiptail --title "Confirm Erase" --yesno "WARNING: ALL DATA ON $dev WILL BE ERASED.\nAre you sure?" 10 60); then
     return 1
  fi

  log "Wiping $dev..."
  wipefs -a "$dev"
  parted -s "$dev" mklabel gpt

  if [[ "$action" == "SPLIT" ]]; then
      local backup_pct
      backup_pct=$(whiptail --inputbox "Enter percentage for BACKUPS (e.g. 20):" 8 40 "20" 3>&1 1>&2 2>&3)
      local media_pct=$((100 - backup_pct))
      
      log "Partitioning $dev: $media_pct% Media, $backup_pct% Backup..."
      parted -s "$dev" mkpart primary ext4 0% "${media_pct}%"
      parted -s "$dev" mkpart primary ext4 "${media_pct}%" 100%
      
      mkfs.ext4 -F -L "creation_media" "${dev}1"
      mkfs.ext4 -F -L "creation_backup" "${dev}2"
      
      mount_part "${dev}1" "$VOLUMES_DIR/media"
      mount_part "${dev}2" "$BACKUPS_DIR"
      
  elif [[ "$action" == "DATA" ]]; then
      parted -s "$dev" mkpart primary ext4 0% 100%
      mkfs.ext4 -F -L "creation_data" "${dev}1"
      mount_part "${dev}1" "$VOLUMES_DIR/media"
      
  elif [[ "$action" == "BACKUP" ]]; then
      parted -s "$dev" mkpart primary ext4 0% 100%
      mkfs.ext4 -F -L "creation_backup" "${dev}1"
      mount_part "${dev}1" "$BACKUPS_DIR"
  fi
  
  whiptail --title "Success" --msgbox "Disk initialized and mounted!" 8 40
}

# --------------------------------------------------
# 3. Mounter
# --------------------------------------------------
mount_part() {
    local part="$1"
    local mountpoint="$2"
    
    log "Mounting $part -> $mountpoint"
    mkdir -p "$mountpoint"
    
    local uuid
    uuid=$(blkid -s UUID -o value "$part")
    
    echo "UUID=$uuid $mountpoint ext4 defaults 0 2" >> /etc/fstab
    
    mount -a
    chmod 777 "$mountpoint"
}

# --------------------------------------------------
# Main
# --------------------------------------------------
main() {
  require_root
  install_deps
  
  while true; do
      local target
      target=$(select_disk) 
      if [[ $? -ne 0 ]]; then
          break
      fi
      
      partition_disk "$target"
  done
}

main "$@"
