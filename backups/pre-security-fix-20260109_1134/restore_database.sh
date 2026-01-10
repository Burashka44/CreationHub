#!/bin/bash
# DATABASE RESTORE - Restore full database from backup
# WARNING: This will OVERWRITE current database!
# Usage: ./restore_database.sh

set -e

BACKUP_DIR="$(dirname "$0")"

echo "============================================"
echo "DATABASE RESTORE - DANGEROUS OPERATION"
echo "============================================"
echo ""
echo "⚠️  WARNING: This will COMPLETELY REPLACE the current database!"
echo "⚠️  All data created after this backup will be LOST!"
echo ""
echo "Backup file: $BACKUP_DIR/database_full_backup.sql.gz"
echo ""

read -p "Are you ABSOLUTELY SURE you want to restore? Type 'RESTORE' to confirm: " CONFIRM
if [ "$CONFIRM" != "RESTORE" ]; then
    echo "Database restore cancelled."
    exit 1
fi

echo ""
echo "Step 1: Stopping services that use database..."
cd /home/inno/.gemini/antigravity/scratch/dashboard
docker compose stop creationhub postgrest system-api stats-recorder ai-gateway

echo ""
echo "Step 2: Dropping and recreating database..."
docker compose exec -T creationhub-postgres psql -U postgres -c "DROP DATABASE IF EXISTS postgres_backup;"
docker compose exec -T creationhub-postgres psql -U postgres -c "CREATE DATABASE postgres_backup WITH TEMPLATE postgres;"
docker compose exec -T creationhub-postgres psql -U postgres -c "DROP DATABASE postgres;"
docker compose exec -T creationhub-postgres psql -U postgres -c "CREATE DATABASE postgres;"

echo ""
echo "Step 3: Restoring database from backup..."
gunzip -c "$BACKUP_DIR/database_full_backup.sql.gz" | docker compose exec -T creationhub-postgres psql -U postgres postgres

echo ""
echo "Step 4: Restarting services..."
docker compose up -d

echo ""
echo "Step 5: Waiting for services..."
sleep 15

echo ""
echo "Step 6: Testing..."
echo -n "Dashboard: "
curl -s http://192.168.1.220:7777/api/v1/rest/v1/services | jq 'length' && echo "✅ OK"

echo ""
echo "============================================"
echo "✅ DATABASE RESTORE COMPLETE"
echo "============================================"
echo ""
echo "Database restored from: $(date -r "$BACKUP_DIR/database_full_backup.sql.gz")"
