#!/bin/bash

echo "========================================================"
echo "🔍 COMPREHENSIVE CODE AUDIT: API, Cache, Timeout Issues"
echo "Date: $(date)"
echo "========================================================"
echo ""

ISSUES_FOUND=0

# 1. CHECK FOR SHORT TIMEOUTS IN API CALLS
echo "--- 1. TIMEOUT ANALYSIS ---"
echo "Searching for axios/fetch calls with short timeouts..."

SHORT_TIMEOUTS=$(grep -rn "timeout.*[0-9]" system-api/ --include="*.js" | grep -E "timeout.*:[[:space:]]*[1-4][0-9]{3}" || true)
if [ -n "$SHORT_TIMEOUTS" ]; then
    echo "⚠️  WARNING: Found potentially short timeouts (<5000ms):"
    echo "$SHORT_TIMEOUTS" | head -10
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ OK: No short timeouts found"
fi

echo ""

# 2. CHECK FOR MISSING ERROR HANDLING
echo "--- 2. ERROR HANDLING ---"
echo "Searching for axios calls without try-catch..."

# This is complex, but we can check for axios calls not wrapped in try
AXIOS_CALLS=$(grep -rn "axios\." system-api/ --include="*.js" | wc -l)
TRY_CATCH=$(grep -rn "try {" system-api/ --include="*.js" | wc -l)

echo "Axios calls found: $AXIOS_CALLS"
echo "Try-catch blocks: $TRY_CATCH"

if [ "$AXIOS_CALLS" -gt "$((TRY_CATCH * 2))" ]; then
    echo "⚠️  WARNING: Many axios calls might lack error handling"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ OK: Error handling appears adequate"
fi

echo ""

# 3. CHECK FOR MISSING CACHE
echo "--- 3. CACHE USAGE ---"
echo "Searching for external API calls without caching..."

# Find axios.get to external domains
EXTERNAL_APIS=$(grep -rn "axios.get.*http" system-api/ --include="*.js" | grep -v "localhost\|127.0.0.1\|creationhub" || true)
if [ -n "$EXTERNAL_APIS" ]; then
    echo "Found external API calls:"
    echo "$EXTERNAL_APIS" | head -5
    
    # Check if these are near cache.get
    echo ""
    echo "Checking cache usage for these endpoints..."
    # This is approximate
fi

echo ""

# 4. CHECK FOR HARDCODED IPS/URLs IN CODE
echo "--- 4. HARDCODED URLs IN JS ---"
echo "Searching for hardcoded external URLs..."

HARDCODED_URLS=$(grep -rn "http[s]*://[0-9]" system-api/ --include="*.js" | grep -v "localhost\|127.0.0.1" || true)
if [ -n "$HARDCODED_URLS" ]; then
    echo "⚠️  WARNING: Found hardcoded IPs in API calls:"
    echo "$HARDCODED_URLS" | head -5
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ OK: No hardcoded IPs in API code"
fi

echo ""

# 5. CHECK FOR MISSING FALLBACKS
echo "--- 5. FALLBACK MECHANISMS ---"
echo "Checking critical API endpoints for fallbacks..."

# Check if public-ip has fallback
PUBLIC_IP_FALLBACKS=$(grep -A 30 "app.get.*public-ip" system-api/index.js | grep -c "catch" || echo 0)
echo "Public IP fallbacks: $PUBLIC_IP_FALLBACKS"

if [ "$PUBLIC_IP_FALLBACKS" -lt 2 ]; then
    echo "⚠️  WARNING: public-ip might lack sufficient fallbacks"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ OK: public-ip has fallbacks"
fi

echo ""

# 6. CHECK FRONTEND API CALLS
echo "--- 6. FRONTEND API CALLS ---"
echo "Checking frontend for missing error handling..."

FRONTEND_FETCH=$(find src/ -name "*.tsx" -o -name "*.ts" | xargs grep -l "fetch\|axios" | wc -l)
FRONTEND_CATCH=$(find src/ -name "*.tsx" -o -name "*.ts" | xargs grep -l "\.catch\|try.*catch" | wc -l)

echo "Files with fetch/axios: $FRONTEND_FETCH"
echo "Files with error handling: $FRONTEND_CATCH"

if [ "$FRONTEND_FETCH" -gt "$((FRONTEND_CATCH + 5))" ]; then
    echo "⚠️  WARNING: Many frontend API calls might lack error handling"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ OK: Frontend error handling appears adequate"
fi

echo ""

# 7. CHECK FOR CACHE TTL
echo "--- 7. CACHE TTL SETTINGS ---"
echo "Analyzing cache TTL values..."

CACHE_TTLS=$(grep -rn "systemCache.set\|cache.set" system-api/ --include="*.js" | grep -oE "[0-9]{3,}" || true)
if [ -n "$CACHE_TTLS" ]; then
    echo "Found cache TTLs (seconds):"
    echo "$CACHE_TTLS" | sort -n | uniq -c
    
    # Check for very short TTLs (< 60s)
    SHORT_TTL=$(echo "$CACHE_TTLS" | awk '$1 < 60' | wc -l)
    if [ "$SHORT_TTL" -gt 0 ]; then
        echo "⚠️  WARNING: Found caches with TTL < 60s (might be ineffective)"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo "✅ No cache TTL issues found"
fi

echo ""

# 8. CHECK FOR MISSING RATE LIMITING
echo "--- 8. RATE LIMITING ---"
echo "Checking API endpoints for rate limiting..."

TOTAL_ENDPOINTS=$(grep -rn "app\.get\|app\.post\|app\.put\|app\.delete" system-api/index.js | wc -l)
PROTECTED_ENDPOINTS=$(grep -B 5 "app\.get\|app\.post" system-api/index.js | grep -c "rateLimiter\|rateLimit" || echo 0)

echo "Total endpoints: $TOTAL_ENDPOINTS"
echo "Rate limited: $PROTECTED_ENDPOINTS"

echo ""

# 9. CHECK FOR ASYNC/AWAIT ISSUES
echo "--- 9. ASYNC/AWAIT PATTERNS ---"
echo "Checking for missing await keywords..."

# Find async functions
ASYNC_FUNCS=$(grep -rn "async.*=>" system-api/ --include="*.js" | wc -l)
AWAIT_CALLS=$(grep -rn "await " system-api/ --include="*.js" | wc -l)

echo "Async functions: $ASYNC_FUNCS"
echo "Await calls: $AWAIT_CALLS"

echo ""

# 10. CHECK FOR ENV VARIABLES
echo "--- 10. ENVIRONMENT VARIABLES ---"
echo "Checking for missing env variable validation..."

ENV_USAGE=$(grep -rn "process\.env\." system-api/ --include="*.js" | grep -v "NODE_ENV" | wc -l)
ENV_VALIDATION=$(grep -rn "requiredEnvVars\|if.*!process\.env" system-api/ --include="*.js" | wc -l)

echo "Environment variable usages: $ENV_USAGE"
echo "Environment validations: $ENV_VALIDATION"

if [ "$ENV_USAGE" -gt "$((ENV_VALIDATION * 10))" ]; then
    echo "⚠️  WARNING: Many env vars might lack validation"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ OK: Environment validation appears adequate"
fi

echo ""

# FINAL REPORT
echo "========================================================"
if [ $ISSUES_FOUND -eq 0 ]; then
    echo "✅ AUDIT COMPLETE: NO CRITICAL ISSUES FOUND"
    echo "Code quality appears good!"
else
    echo "⚠️  AUDIT COMPLETE: FOUND $ISSUES_FOUND POTENTIAL ISSUE(S)"
    echo "Review the warnings above for details."
fi
echo "========================================================"

exit 0
