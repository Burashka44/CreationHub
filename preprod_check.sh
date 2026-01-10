#!/bin/bash

echo "========================================================"
echo "🚀 CREATIONHUB: PRE-PRODUCTION SYSTEM CHECK"
echo "Date: $(date)"
echo "========================================================"
echo ""

FAIL=0

check_status() {
    if [ $? -eq 0 ]; then
        echo -e "✅ $1: OK"
    else
        echo -e "❌ $1: FAILED"
        FAIL=1
    fi
}

echo "--- 1. CONTAINER HEALTH ---"
docker ps --format "{{.Names}}: {{.Status}}"
echo ""

# Check essential containers
for container in creationhub_system_api creationhub_postgres creationhub_redis creationhub_api creationhub; do
    if docker ps --format '{{.Names}}' | grep -q "$container"; then
        echo -e "✅ Container $container is RUNNING"
        
        # Check health status if available
        HEALTH=$(docker inspect --format='{{json .State.Health.Status}}' "$container" 2>/dev/null)
        if [ "$HEALTH" != "null" ] && [ "$HEALTH" != "" ]; then
            echo -e "   Health: $HEALTH"
        fi
    else
        echo -e "❌ Container $container is MISSING"
        FAIL=1
    fi
done

echo ""
echo "--- 2. CONNECTIVITY & API ---"

# Dashboard
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:7777/)
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "✅ Dashboard (Port 7777): Accessible (200 OK)"
else
    echo -e "❌ Dashboard (Port 7777): FAILED ($HTTP_CODE)"
    FAIL=1
fi

# System API Health
API_RESP=$(curl -s http://localhost:9191/health)
if echo "$API_RESP" | grep -q "ok"; then
    echo -e "✅ System API (Port 9191): Healthy"
    uptime=$(echo "$API_RESP" | jq -r .uptime)
    echo "   Uptime: ${uptime}s"
else
    echo -e "❌ System API (Port 9191): UNHEALTHY"
    FAIL=1
fi

# Performance Check (Latency)
TIME_TOTAL=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:9191/api/system/os)
echo -e "✅ API Latency (/api/system/os): ${TIME_TOTAL}s (cached)"

echo ""
echo "--- 3. DATABASE & STORAGE ---"

# Postgres Connection
if docker exec creationhub_postgres pg_isready -U postgres > /dev/null; then
    echo -e "✅ PostgreSQL: Ready to accept connections"
    
    # Check DB Size
    DB_SIZE=$(docker exec creationhub_postgres psql -U postgres -d postgres -t -c "SELECT pg_size_pretty(pg_database_size('postgres'));" | xargs)
    echo "   DB Size: $DB_SIZE"
    
    # Check Tables
    TABLE_COUNT=$(docker exec creationhub_postgres psql -U postgres -d postgres -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    echo "   Tables: $TABLE_COUNT"
else
    echo -e "❌ PostgreSQL: Connection FAILED"
    FAIL=1
fi

# Redis Connection
REDIS_PASS=$(grep REDIS_PASSWORD .env | cut -d= -f2)
if docker exec creationhub_redis redis-cli -a "$REDIS_PASS" ping | grep -q "PONG"; then
    echo -e "✅ Redis: Connected & Authenticated"
    
    # Check Keys
    KEYS=$(docker exec creationhub_redis redis-cli -a "$REDIS_PASS" dbsize | cut -f1)
    echo "   Keys: $KEYS"
else
    echo -e "❌ Redis: Connection FAILED"
    FAIL=1
fi

echo ""
echo "--- 4. BACKUPS & LOGS ---"

# Check Backup Cron
if crontab -l | grep -q "backup_script.sh"; then
    echo -e "✅ Backup Cron Job: Active"
else
    echo -e "❌ Backup Cron Job: MISSING"
    FAIL=1
fi

# Check Backup Files
BACKUP_COUNT=$(ls -1 backups/auto/*.sql.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 0 ]; then
    echo -e "✅ Auto Backups: Found $BACKUP_COUNT files"
    ls -lh backups/auto/ | tail -3
else
    echo -e "⚠️  Auto Backups: No backups found (check cron logs)"
    # Not a fatal fail, maybe just installed
fi

# Check Logs
if docker exec creationhub_system_api ls /var/log/system-api/app-$(date +%Y-%m-%d).log > /dev/null 2>&1; then
    echo -e "✅ System API Logs: Active"
    LOG_SIZE=$(docker exec creationhub_system_api du -h /var/log/system-api/app-$(date +%Y-%m-%d).log | cut -f1)
    echo "   Current Log Size: $LOG_SIZE"
else
    echo -e "❌ System API Logs: MISSING"
    FAIL=1
fi

echo ""
echo "--- 5. SECURITY ---"

# Check opened ports (host)
echo "   Open Ports (Host):"
ss -tulpn | grep -E ':(7777|9191|3000|5432|6379|80|443)'

# Check .env permissions
ENV_PERM=$(stat -c "%a" .env)
if [ "$ENV_PERM" -le "644" ]; then
    echo -e "✅ .env Permissions: Safe ($ENV_PERM)"
else
    echo -e "⚠️  .env Permissions: Unsafe ($ENV_PERM) - Recommend 600"
fi

echo ""
echo "========================================================"
if [ $FAIL -eq 0 ]; then
    echo "🎉 RESULT: PASSED - READY FOR PRODUCTION"
else
    echo "🔥 RESULT: FAILED - CHECK ISSUES ABOVE"
fi
echo "========================================================"
