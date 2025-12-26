#!/bin/bash
# ===========================================
# CreationHub PostgreSQL Backup Script
# ===========================================
# Run daily via cron:
# 0 3 * * * /path/to/backup_db.sh

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/home/inno/compose/backups/postgres}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-creationhub-postgres}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/creationhub_${TIMESTAMP}.sql.gz"

echo -e "${GREEN}Starting PostgreSQL backup...${NC}"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${POSTGRES_CONTAINER}$"; then
    echo -e "${RED}Error: Container ${POSTGRES_CONTAINER} is not running${NC}"
    exit 1
fi

# Create backup
if docker exec "$POSTGRES_CONTAINER" pg_dumpall -U "$POSTGRES_USER" | gzip > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}Backup created: ${BACKUP_FILE} (${BACKUP_SIZE})${NC}"
else
    echo -e "${RED}Backup failed!${NC}"
    exit 1
fi

# Remove old backups
echo -e "${GREEN}Cleaning up backups older than ${RETENTION_DAYS} days...${NC}"
find "$BACKUP_DIR" -name "creationhub_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

# List recent backups
echo -e "${GREEN}Recent backups:${NC}"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5

echo -e "${GREEN}Backup complete!${NC}"
