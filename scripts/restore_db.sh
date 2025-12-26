#!/bin/bash
# ===========================================
# CreationHub PostgreSQL Restore Script
# ===========================================
# Usage: ./restore_db.sh backup_file.sql.gz

set -e

# Configuration
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-creationhub-postgres}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Usage: $0 <backup_file.sql.gz>${NC}"
    echo ""
    echo "Available backups:"
    ls -lh /home/inno/compose/backups/postgres/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

echo -e "${YELLOW}WARNING: This will replace ALL data in the database!${NC}"
echo -e "${YELLOW}Backup file: ${BACKUP_FILE}${NC}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo -e "${GREEN}Restoring from ${BACKUP_FILE}...${NC}"

# Restore
if gunzip -c "$BACKUP_FILE" | docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER"; then
    echo -e "${GREEN}Restore complete!${NC}"
    
    # Reload PostgREST schema
    docker kill -s SIGUSR1 creationhub_api 2>/dev/null || true
    echo -e "${GREEN}PostgREST schema cache reloaded${NC}"
else
    echo -e "${RED}Restore failed!${NC}"
    exit 1
fi
