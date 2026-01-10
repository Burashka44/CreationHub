#!/bin/bash
# PARTIAL ROLLBACK - Only restore PostgREST port
# Usage: ./rollback_postgrest_only.sh

set -e

DASHBOARD_DIR="/home/inno/.gemini/antigravity/scratch/dashboard"

echo "=================================="
echo "PARTIAL ROLLBACK - PostgREST Only"
echo "=================================="
echo ""
echo "This will restore PostgREST to 0.0.0.0:3000"
echo "Adminer will remain on 127.0.0.1:8083"
echo ""

read -p "Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Rollback cancelled."
    exit 1
fi

echo ""
echo "Changing PostgREST port binding..."
cd "$DASHBOARD_DIR"
sed -i 's/127.0.0.1:3000:3000/0.0.0.0:3000:3000/' docker-compose.yml

echo ""
echo "Restarting PostgREST..."
docker compose up -d postgrest

echo ""
echo "Waiting 5 seconds..."
sleep 5

echo ""
echo "Testing..."
curl -s -I http://192.168.1.220:3000/ | grep "200 OK" && echo "✅ PostgREST accessible" || echo "❌ FAIL"

echo ""
echo "✅ PostgREST rollback complete"
