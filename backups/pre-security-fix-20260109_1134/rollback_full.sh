#!/bin/bash
# FULL ROLLBACK - Restore everything to pre-security-fix state
# Usage: ./rollback_full.sh

set -e

BACKUP_DIR="$(dirname "$0")"
DASHBOARD_DIR="/home/inno/.gemini/antigravity/scratch/dashboard"

echo "==================================="
echo "FULL ROLLBACK - Security Fix Undo"
echo "==================================="
echo ""
echo "Backup location: $BACKUP_DIR"
echo ""

read -p "This will restore EVERYTHING to pre-security-fix state. Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Rollback cancelled."
    exit 1
fi

echo ""
echo "Step 1: Stopping containers..."
cd "$DASHBOARD_DIR"
docker compose stop postgrest adminer

echo ""
echo "Step 2: Restoring docker-compose.yml..."
cp "$BACKUP_DIR/docker-compose.yml.original" "$DASHBOARD_DIR/docker-compose.yml"

echo ""
echo "Step 3: Restoring nginx.conf..."
cp "$BACKUP_DIR/nginx.conf.original" "$DASHBOARD_DIR/nginx.conf"

echo ""
echo "Step 4: Restarting containers..."
docker compose up -d postgrest adminer creationhub

echo ""
echo "Step 5: Waiting for services..."
sleep 10

echo ""
echo "Step 6: Testing services..."
echo -n "Dashboard: "
curl -s -I http://192.168.1.220:7777/ | grep "200 OK" && echo "✅ OK" || echo "❌ FAIL"

echo -n "PostgREST direct: "
curl -s -I http://192.168.1.220:3000/ | grep "200 OK" && echo "✅ OK" || echo "❌ FAIL"

echo -n "Adminer direct: "
curl -s -I http://192.168.1.220:8083/ | grep "200 OK" && echo "✅ OK" || echo "❌ FAIL"

echo ""
echo "==================================="
echo "✅ FULL ROLLBACK COMPLETE"
echo "==================================="
