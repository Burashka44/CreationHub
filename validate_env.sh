#!/bin/bash
# Environment Variables Validation Script
# Run this before starting the application to ensure all required secrets are set

set -e

echo "🔍 Validating environment variables..."

REQUIRED_VARS=(
    "POSTGRES_PASSWORD"
    "JWT_SECRET"
    "POSTGRES_USER"
    "POSTGRES_DB"
)

WARNINGS=()
ERRORS=()

# Check required variables
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        ERRORS+=("❌ MISSING: $var")
    else
        echo "✅ $var is set"
        
        # Additional validation
        case $var in
            JWT_SECRET)
                if [ ${#JWT_SECRET} -lt 32 ]; then
                    WARNINGS+=("⚠️  JWT_SECRET should be at least 32 characters (current: ${#JWT_SECRET})")
                fi
                ;;
            POSTGRES_PASSWORD)
                if [ "$POSTGRES_PASSWORD" == "changeme" ] || [ "$POSTGRES_PASSWORD" == "Tarantul1310" ]; then
                    ERRORS+=("❌ POSTGRES_PASSWORD is using default/demo value - CHANGE IT!")
                fi
                ;;
        esac
    fi
done

# Check optional but recommended
if [ -z "$RECOVERY_PASSWORD" ]; then
    echo "ℹ️  RECOVERY_PASSWORD not set (OK if migration complete)"
else
    WARNINGS+=("⚠️  RECOVERY_PASSWORD is still set - remove after admin migration")
fi

if [ -z "$REDIS_PASSWORD" ]; then
    WARNINGS+=("⚠️  REDIS_PASSWORD not set (recommended for production)")
fi

# Print warnings
if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  WARNINGS:"
    for warning in "${WARNINGS[@]}"; do
        echo "  $warning"
    done
fi

# Print errors and exit if any
if [ ${#ERRORS[@]} -gt 0 ]; then
    echo ""
    echo "❌ ERRORS - Cannot start application:"
    for error in "${ERRORS[@]}"; do
        echo "  $error"
    done
    echo ""
    echo "📝 Please check .env.example for reference and set missing variables in .env"
    exit 1
fi

echo ""
echo "✅ All required environment variables are set!"
echo "🚀 Safe to start application"
