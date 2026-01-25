#!/bin/bash

BASE_URL="http://localhost:7777"
echo "🔍 SYSTEM VERIFICATION START"
echo "========================================"

check_endpoint() {
    URL="$1"
    EXPECTED_CODES="$2" # E.g., "200 401"
    NAME="$3"

    CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$URL")
    
    if [[ "$EXPECTED_CODES" == *"$CODE"* ]]; then
        echo "✅ [${CODE}] $NAME ($URL)"
    else
        echo "❌ [${CODE}] $NAME ($URL) - Expected: $EXPECTED_CODES"
        # Print first 50 chars of response on failure
        curl -s "$BASE_URL$URL" | head -c 100
        echo ""
    fi
}

echo "1. CORE SERVICES"
check_endpoint "/" "200" "Dashboard Frontend"
check_endpoint "/api/ping" "200" "Nginx Health Check"

echo ""
echo "2. SYSTEM API"
check_endpoint "/api/v1/system/health" "200" "System API Health"
check_endpoint "/api/system/health" "200" "System API Health (Legacy)"
check_endpoint "/api/services/status-by-port" "200" "Services List"

echo ""
echo "3. POSTGREST (DATA)"
# Expect 200 (list) or 401 (unauthorized) or 404 (if table list disabled)
# PostgREST root usually requires authentication or specific table
check_endpoint "/api/v1/rest/v1/" "200 404" "PostgREST Root"

echo ""
echo "4. MONITORING"
check_endpoint "/api/v1/glances/cpu/history" "200" "Glances CPU"
# check_endpoint "/api/glances/cpu/history" "200" "Glances Legacy"

echo ""
echo "5. AUTH (System API)"
# Expect 405 Method Not Allowed (since we send GET) or 401/400
check_endpoint "/api/auth/check" "200" "Auth Check (Guest)"

echo ""
echo "6. ADMINER"
check_endpoint "/adminer/" "200" "Adminer UI"

echo ""
echo "7. EXTERNAL DB CONNECTIVITY CHECKS"
echo "Checking PostgREST logs for connection..."
docker logs creationhub_api 2>&1 | grep "Connection successfully established" | tail -1

echo "Checking System API logs for DB..."
docker logs creationhub_system_api 2>&1 | grep "Connected to Postgres" | tail -1

echo "Checking Stats Recorder logs..."
docker logs creationhub_stats 2>&1 | tail -5

echo "========================================"
echo "🏁 VERIFICATION COMPLETE"
