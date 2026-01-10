#!/bin/bash
# PARTIAL ROLLBACK - Only restore Adminer port
# Usage: ./rollback_adminer_only.sh

set -e

DASHBOARD_DIR="/home/inno/.gemini/antigravity/scratch/dashboard"

echo "================================"
echo "PARTIAL ROLLBACK - Adminer Only"
echo "================================"
echo ""
echo "This will restore Adminer to 0.0.0.0:8083"
echo "PostgREST will remain on 127.0.0.1:3000"
echo ""

read -p "Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Rollback cancelled."
    exit 1
fi

echo ""
echo "Changing Adminer port binding..."
cd "$DASHBOARD_DIR"
sed -i 's/127.0.0.1:8083:8080/0.0.0.0:8083:8080/' docker-compose.yml

echo ""
echo "Restarting Adminer..."
docker compose up -d adminer

echo ""
echo "Waiting 5 seconds..."
sleep 5

echo ""
echo "Testing..."
curl -s -I http://192.168.1.220:8083/ | grep "200 OK" && echo "✅ Adminer accessible" || echo "❌ FAIL"

echo ""
echo "✅ Adminer rollback complete"
