#!/usr/bin/env bash
set -e

# ==============================================================================
# CreationHub Backup System
# ==============================================================================

PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
BACKUP_ROOT="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_NAME="backup_$TIMESTAMP"
TEMP_DIR="$BACKUP_ROOT/temp_$TIMESTAMP"
LOG_FILE="$PROJECT_ROOT/logs/backup.log"

# Load Env for Secrets
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

log() {
    local msg="[$(date '+%H:%M:%S')] $1"
    echo "$msg"
    echo "$msg" >> "$LOG_FILE"
}

mkdir -p "$BACKUP_ROOT"
mkdir -p "$TEMP_DIR/db_dumps"

log "========================================"
log "STARTING BACKUP: $BACKUP_NAME"
log "========================================"

# ------------------------------------------------------------------------------
# 1. Database Dumps (PostgreSQL)
# ------------------------------------------------------------------------------
log "[1/4] Dumping Databases..."

# List of DBs to dump (could be dynamic, but hardcoded is safer for V1)
DBS=("db_n8n" "db_nextcloud" "db_analytics" "db_healthchecks")

for db in "${DBS[@]}"; do
    if docker exec creationhub-postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "$db"; then
        log "  -> Dumping $db..."
        docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" creationhub-postgres pg_dump -U postgres "$db" > "$TEMP_DIR/db_dumps/$db.sql"
    else
        log "  ! Warning: Database $db not found, skipping."
    fi
done

# ------------------------------------------------------------------------------
# 2. Config & Volume Backup
# ------------------------------------------------------------------------------
log "[2/4] Archiving Volumes..."

# We exclude large media folders to keep backups small
# Exclusions: downloads, media cache
cd "$PROJECT_ROOT"
tar --exclude='volumes/media/downloads' \
    --exclude='volumes/media/processing' \
    --exclude='volumes/postgres' \
    --exclude='volumes/redis' \
    -czf "$TEMP_DIR/files.tar.gz" \
    volumes/ .env state/ compose/ bin/ install.sh apply_config.sh

# ------------------------------------------------------------------------------
# 3. Final Packaging
# ------------------------------------------------------------------------------
log "[3/4] Packaging Backup..."

cd "$BACKUP_ROOT"
tar -czf "$BACKUP_NAME.tar.gz" -C "$TEMP_DIR" .

log "Filename: $BACKUP_ROOT/$BACKUP_NAME.tar.gz"

# ------------------------------------------------------------------------------
# 4. Cleanup & Rotation
# ------------------------------------------------------------------------------
log "[4/4] Cleaning up..."

# Remove temp dir
rm -rf "$TEMP_DIR"

# Keep last 7 backups
ls -dt "$BACKUP_ROOT"/backup_*.tar.gz | tail -n +8 | xargs -r rm --

log "Backup Complete!"
log "========================================"
