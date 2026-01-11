#!/bin/bash

echo "========================================================"
echo "🔍 CREATIONHUB: COMPREHENSIVE BUG SCAN"
echo "Date: $(date)"
echo "========================================================"
echo ""

ISSUES_FOUND=0

# 1. ПРОВЕРКА NGINX КОНФИГУРАЦИИ
echo "--- 1. NGINX CONFIGURATION SCAN ---"
echo "Проверка на использование IP вместо имен контейнеров..."

if grep -E "proxy_pass.*http://[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+" nginx.conf; then
    echo "❌ НАЙДЕНО: Hardcoded IP addresses в nginx.conf"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ OK: Нет hardcoded IP в nginx.conf"
fi

echo ""
echo "Проверка всех proxy_pass на корректность..."
UPSTREAMS=$(grep -o "proxy_pass http://[^/]*" nginx.conf | sed 's/proxy_pass http:\/\///' | sort -u)
echo "Найденные upstream серверы:"
echo "$UPSTREAMS" | while read upstream; do
    echo "  - $upstream"
done

echo ""

# 2. ПРОВЕРКА DOCKER-COMPOSE НА DEPENDS_ON
echo "--- 2. DOCKER-COMPOSE DEPENDENCIES ---"
echo "Проверка зависимостей сервисов..."

# Проверим что критические зависимости указаны
if ! grep -A 3 "grafana:" docker-compose.yml | grep -q "depends_on"; then
    echo "⚠️  WARNING: Grafana не имеет depends_on (может стартовать до Prometheus)"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if grep -A 3 "system-api:" docker-compose.yml | grep -q "depends_on"; then
    echo "✅ OK: system-api имеет depends_on"
else
    echo "⚠️  WARNING: system-api не имеет depends_on на postgres/redis"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

# 3. ПРОВЕРКА ХАРДКОЖЕНЫХ URL В КОДЕ
echo "--- 3. HARDCODED URLs IN CODE ---"
echo "Поиск хардкоженых IP/портов в исходниках..."

# Проверка в system-api
HARDCODED=$(grep -r "192\.168\.1\." system-api/ --include="*.js" 2>/dev/null || true)
if [ -n "$HARDCODED" ]; then
    echo "❌ НАЙДЕНО: Hardcoded IPs в system-api:"
    echo "$HARDCODED" | head -5
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ OK: Нет hardcoded IPs в system-api"
fi

# Проверка во фронтенде
FRONTEND_HARDCODED=$(grep -r "http://192\.168\.1\." src/ --include="*.tsx" --include="*.ts" 2>/dev/null || true)
if [ -n "$FRONTEND_HARDCODED" ]; then
    echo "❌ НАЙДЕНО: Hardcoded URLs во фронтенде:"
    echo "$FRONTEND_HARDCODED" | head -5
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ OK: Нет hardcoded URLs во фронтенде"
fi

echo ""

# 4. ПРОВЕРКА ПУБЛИЧНЫХ ПОРТОВ
echo "--- 4. PUBLIC PORTS EXPOSURE ---"
echo "Проверка портов с биндингом на 0.0.0.0..."

PUBLIC_PORTS=$(grep -E "^\s+- \"0\.0\.0\.0:" docker-compose.yml | grep -v "#" || true)
if [ -n "$PUBLIC_PORTS" ]; then
    echo "⚠️  WARNING: Найдены публично открытые порты:"
    echo "$PUBLIC_PORTS"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ OK: Нет публично открытых портов (кроме dashboard)"
fi

echo ""

# 5. ПРОВЕРКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ
echo "--- 5. ENVIRONMENT VARIABLES ---"
echo "Проверка на дефолтные/небезопасные значения..."

if grep -q "CHANGEME" .env 2>/dev/null; then
    echo "❌ КРИТИЧНО: Найдены CHANGEME значения в .env!"
    grep "CHANGEME" .env
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ OK: Нет CHANGEME в .env"
fi

# Проверка что все переменные из .env.example присутствуют в .env
MISSING_VARS=$(comm -23 <(grep "^[A-Z]" .env.example | cut -d= -f1 | sort) <(grep "^[A-Z]" .env 2>/dev/null | cut -d= -f1 | sort) || true)
if [ -n "$MISSING_VARS" ]; then
    echo "⚠️  WARNING: Переменные из .env.example отсутствуют в .env:"
    echo "$MISSING_VARS"
fi

echo ""

# 6. ПРОВЕРКА ЛОГОВ НА ОШИБКИ (последние 100 строк)
echo "--- 6. RECENT ERROR LOGS ---"
echo "Проверка логов контейнеров на ошибки..."

CONTAINERS="creationhub creationhub_system_api creationhub_postgres creationhub_redis"
for container in $CONTAINERS; do
    ERRORS=$(docker logs $container --tail 50 2>&1 | grep -i "error\|failed\|exception" | wc -l)
    if [ "$ERRORS" -gt 0 ]; then
        echo "⚠️  $container: $ERRORS недавних ошибок в логах"
        docker logs $container --tail 50 2>&1 | grep -i "error\|failed\|exception" | head -3
    else
        echo "✅ $container: Нет ошибок"
    fi
done

echo ""

# 7. ПРОВЕРКА ЗДОРОВЬЯ КОНТЕЙНЕРОВ
echo "--- 7. CONTAINER HEALTH STATUS ---"
UNHEALTHY=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" || true)
if [ -n "$UNHEALTHY" ]; then
    echo "❌ КРИТИЧНО: Нездоровые контейнеры:"
    echo "$UNHEALTHY"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ OK: Все контейнеры с healthcheck здоровы"
fi

STARTING=$(docker ps --filter "health=starting" --format "{{.Names}}" || true)
if [ -n "$STARTING" ]; then
    echo "⚠️  INFO: Контейнеры в состоянии starting:"
    echo "$STARTING"
fi

echo ""

# 8. ПРОВЕРКА КРИТИЧЕСКИХ ЭНДПОИНТОВ
echo "--- 8. CRITICAL ENDPOINTS CHECK ---"
ENDPOINTS=(
    "http://localhost:7777/"
    "http://localhost:9191/health"
    "http://localhost:7777/api/services/status-by-port"
    "http://localhost:9090/-/healthy"
    "http://localhost:3001/api/health"
)

for endpoint in "${ENDPOINTS[@]}"; do
    if curl -sf "$endpoint" > /dev/null 2>&1; then
        echo "✅ $endpoint"
    else
        echo "❌ $endpoint - NOT ACCESSIBLE"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

echo ""

# 9. ПРОВЕРКА ДИСКОВОГО ПРОСТРАНСТВА
echo "--- 9. DISK SPACE ---"
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "❌ КРИТИЧНО: Диск заполнен на ${DISK_USAGE}%"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
elif [ "$DISK_USAGE" -gt 70 ]; then
    echo "⚠️  WARNING: Диск заполнен на ${DISK_USAGE}%"
else
    echo "✅ OK: Диск заполнен на ${DISK_USAGE}%"
fi

echo ""

# 10. ПРОВЕРКА ПРАВ НА ФАЙЛЫ
echo "--- 10. FILE PERMISSIONS ---"
ENV_PERMS=$(stat -c "%a" .env 2>/dev/null || echo "000")
if [ "$ENV_PERMS" != "600" ]; then
    echo "⚠️  WARNING: .env permissions не 600 (текущие: $ENV_PERMS)"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "✅ OK: .env permissions = 600"
fi

echo ""

# ФИНАЛЬНЫЙ ОТЧЕТ
echo "========================================================"
if [ $ISSUES_FOUND -eq 0 ]; then
    echo "✅ ПРОВЕРКА ЗАВЕРШЕНА: ПРОБЛЕМ НЕ НАЙДЕНО"
    echo "Система в отличном состоянии!"
else
    echo "⚠️  ПРОВЕРКА ЗАВЕРШЕНА: НАЙДЕНО $ISSUES_FOUND ПРОБЛЕМ(Ы)"
    echo "Рекомендуется проверить детали выше."
fi
echo "========================================================"

exit 0
