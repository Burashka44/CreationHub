#!/bin/bash
# Emergency Rollback Script - Optimization Changes
# Created: 2026-01-10 10:57 MSK
# Run this if something breaks after optimization

set -e

echo "🔄 Starting rollback..."

# 1. Restore Database (drop indexes)
echo "📦 Removing performance indexes..."
docker exec creationhub_postgres psql -U postgres -d postgres -c "
DROP INDEX IF EXISTS idx_system_metrics_timestamp;
DROP INDEX IF EXISTS idx_disk_snapshots_timestamp;
DROP INDEX IF EXISTS idx_disk_snapshots_name_timestamp;
"

# 2. Restore system-api/index.js
echo "📦 Restoring system-api/index.js..."
BACKUP_FILE=$(ls -t system-api/index.js.backup-* 2>/dev/null | head -1)
if [ -f "$BACKUP_FILE" ]; then
    cp "$BACKUP_FILE" system-api/index.js
    echo "✅ Restored from $BACKUP_FILE"
else
    echo "⚠️  No backup found for system-api/index.js"
fi

# 3. Restore docker-compose.yml (if changed)
COMPOSE_BACKUP=$(ls -t docker-compose.yml.backup-* 2>/dev/null | head -1)
if [ -f "$COMPOSE_BACKUP" ]; then
    cp "$COMPOSE_BACKUP" docker-compose.yml
    echo "✅ Restored docker-compose.yml from $COMPOSE_BACKUP"
fi

# 4. Restart affected services
echo "🔄 Restarting system-api..."
docker compose restart system-api

# 5. Verify
echo ""
echo "✅ Rollback complete!"
echo ""
echo "📊 Verification:"
docker compose ps | grep system_api
docker exec creationhub_postgres psql -U postgres -d postgres -c "\di" | grep -E "system_metrics|disk_snapshots"

echo ""
echo "🎯 To restore full database if needed:"
echo "   zcat /tmp/backup_before_optimization_*.sql.gz | docker exec -i creationhub_postgres psql -U postgres -d postgres"
