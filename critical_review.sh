#!/bin/bash

echo "============================================================"
echo "🔍 CRITICAL CODE REVIEW - Devil's Advocate Analysis"
echo "Date: $(date)"
echo "============================================================"
echo ""

echo "=== 1. SECURITY VULNERABILITIES ==="
echo ""

echo "🔒 Checking for JWT secrets strength..."
JWT_SECRET=$(grep "^JWT_SECRET=" .env 2>/dev/null | cut -d= -f2)
if [ -n "$JWT_SECRET" ]; then
    LENGTH=${#JWT_SECRET}
    if [ "$LENGTH" -lt 32 ]; then
        echo "❌ CRITICAL: JWT_SECRET is only $LENGTH chars (should be 32+)"
    else
        echo "✅ JWT_SECRET length adequate ($LENGTH chars)"
    fi
fi

echo ""
echo "🔒 Checking for SQL injection vulnerabilities..."
SQL_QUERIES=$(grep -rn "\.query\|\.raw\|\.exec" system-api/ --include="*.js" | grep -v "node_modules" | wc -l)
PARAMETERIZED=$(grep -rn "\$[0-9]" system-api/ --include="*.js" | wc -l)
echo "SQL queries found: $SQL_QUERIES"
echo "Parameterized queries: $PARAMETERIZED"
if [ "$SQL_QUERIES" -gt 0 ] && [ "$PARAMETERIZED" -eq 0 ]; then
    echo "⚠️  WARNING: Direct SQL queries without parameterization"
fi

echo ""
echo "🔒 Checking for command injection risks..."
grep -rn "exec\|spawn\|system" system-api/ --include="*.js" | grep -v "node_modules\|execPromise\|'docker" | head -10

echo ""
echo "=== 2. DATA PERSISTENCE & BACKUP ==="
echo ""

echo "💾 Checking Redis persistence..."
docker exec creationhub_redis redis-cli CONFIG GET save 2>/dev/null | head -2

echo ""
echo "💾 Checking PostgreSQL backup automation..."
if crontab -l 2>/dev/null | grep -q "pg_dump\|backup"; then
    echo "✅ Automated backups configured"
else
    echo "⚠️  WARNING: No automated database backups in crontab"
fi

echo ""
echo "💾 Checking volume backup strategy..."
if [ -d "volumes/" ]; then
    VOLUME_SIZE=$(du -sh volumes/ 2>/dev/null | cut -f1)
    echo "Volume size: $VOLUME_SIZE"
    if [ ! -f "volumes/.gitignore" ]; then
        echo "⚠️  WARNING: volumes/ might be tracked in git (sensitive data?)"
    fi
fi

echo ""
echo "=== 3. PERFORMANCE & SCALABILITY ==="
echo ""

echo "⚡ Checking for N+1 query patterns..."
grep -rn "forEach.*await\|map.*await" system-api/ --include="*.js" | grep -v "node_modules" | wc -l | xargs -I {} echo "Potential N+1 queries: {}"

echo ""
echo "⚡ Checking for memory leaks (event listeners)..."
grep -rn "\.on\(" system-api/ --include="*.js" | grep -v "node_modules\|\.once" | wc -l | xargs -I {} echo "Event listeners (check for .removeListener): {}"

echo ""
echo "⚡ Checking Docker resource limits..."
CONTAINERS_NO_LIMITS=$(docker ps --format "{{.Names}}" | while read container; do
    docker inspect "$container" 2>/dev/null | jq -r '.[0].HostConfig | select(.Memory == 0 and .CpuShares == 0) | "NO_LIMITS"' 2>/dev/null
done | grep -c "NO_LIMITS" || echo 0)
echo "Containers without resource limits: $CONTAINERS_NO_LIMITS"

echo ""
echo "=== 4. ERROR HANDLING & LOGGING ==="
echo ""

echo "📝 Checking log rotation..."
LOG_SIZE=$(du -sh system-api/logs 2>/dev/null | cut -f1 || echo "N/A")
echo "Current log size: $LOG_SIZE"

LOG_FILES=$(find system-api/logs -name "*.log" 2>/dev/null | wc -l || echo 0)
echo "Log files count: $LOG_FILES"

if [ "$LOG_FILES" -gt 30 ]; then
    echo "⚠️  WARNING: Many log files ($LOG_FILES) - rotation might not work"
fi

echo ""
echo "📝 Checking for console.log (should use logger)..."
CONSOLE_LOGS=$(grep -rn "console\." system-api/ --include="*.js" | grep -v "node_modules\|console.error\|logger" | wc -l)
echo "console.log statements: $CONSOLE_LOGS (should be 0 in production)"

echo ""
echo "=== 5. DEPENDENCIES & UPDATES ==="
echo ""

echo "📦 Checking npm vulnerabilities..."
cd system-api && npm audit --json 2>/dev/null | jq '{vulnerabilities: .metadata.vulnerabilities}' 2>/dev/null || echo "Run 'npm audit' manually"
cd ..

echo ""
echo "📦 Checking for outdated packages..."
OUTDATED=$(cd system-api && npm outdated 2>/dev/null | wc -l || echo 0)
echo "Outdated packages: $OUTDATED"

echo ""
echo "=== 6. MONITORING & OBSERVABILITY ==="
echo ""

echo "🔔 Checking for alert configurations..."
if [ -f "monitoring/prometheus/alerts.yml" ]; then
    echo "✅ Prometheus alerts configured"
else
    echo "❌ MISSING: No Prometheus alert rules"
fi

echo ""
echo "🔔 Checking for health check failures..."
docker ps --filter "health=unhealthy" --format "{{.Names}}: UNHEALTHY" || echo "✅ All containers healthy"

echo ""
echo "=== 7. SECRETS MANAGEMENT ==="
echo ""

echo "🔐 Checking .env file exposure..."
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo "❌ CRITICAL: .env is tracked in git!"
else
    echo "✅ .env not in git"
fi

echo ""
echo "🔐 Checking for hardcoded secrets in code..."
POTENTIAL_SECRETS=$(grep -rn "password.*=.*['\"].*['\"]" system-api/ --include="*.js" | grep -v "node_modules\|bcrypt\|process.env" | wc -l)
echo "Potential hardcoded secrets: $POTENTIAL_SECRETS"

echo ""
echo "=== 8. TESTING & CI/CD ==="
echo ""

if [ -f "package.json" ]; then
    TESTS=$(grep -c "\"test\":" package.json || echo 0)
    if [ "$TESTS" -eq 0 ]; then
        echo "❌ CRITICAL: No test scripts configured"
    else
        echo "✅ Test scripts exist"
    fi
fi

if [ -d ".github/workflows" ] || [ -f ".gitlab-ci.yml" ] || [ -f "Jenkinsfile" ]; then
    echo "✅ CI/CD configured"
else
    echo "⚠️  WARNING: No CI/CD pipeline"
fi

echo ""
echo "=== 9. DOCKER BEST PRACTICES ==="
echo ""

echo "🐋 Checking for root users in containers..."
docker ps --format "{{.Names}}" | head -5 | while read container; do
    USER=$(docker exec "$container" whoami 2>/dev/null || echo "unknown")
    if [ "$USER" = "root" ]; then
        echo "⚠️  $container runs as root"
    fi
done

echo ""
echo "🐋 Checking Docker image sizes..."
docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}" | grep dashboard | head -5

echo ""
echo "=== 10. RATE LIMITING & ABUSE PREVENTION ==="
echo ""

echo "🛡️ Checking rate limit configuration..."
RATE_LIMIT=$(grep "RATE_LIMIT" .env 2>/dev/null)
if [ -n "$RATE_LIMIT" ]; then
    echo "$RATE_LIMIT"
else
    echo "⚠️  WARNING: Rate limit not configured in .env"
fi

echo ""
echo "🛡️ Checking for brute force protection on login..."
grep -rn "login\|auth" system-api/routes/ --include="*.js" -A 10 | grep -c "rateLimit\|attempts" || echo "⚠️  No brute force protection detected"

echo ""
echo "============================================================"
echo "CRITICAL REVIEW COMPLETE"
echo "Review findings above for potential improvements"
echo "============================================================"
