#!/bin/bash
# Recovery Password Setup Script
# This sets a temporary recovery password for 24-hour emergency access

RECOVERY_PASSWORD=$(openssl rand -base64 32)

echo "🔐 Setting up 24-hour recovery access..."
echo ""
echo "Recovery Password (save this): $RECOVERY_PASSWORD"
echo ""
echo "Add to .env file:"
echo "RECOVERY_PASSWORD=$RECOVERY_PASSWORD"
echo ""
echo "⏰ This password expires: $(date -d '+24 hours' '+%Y-%m-%d %H:%M:%S %Z')"
echo ""
echo "To login with recovery mode:"
echo "  Email: admin@example.com (or any email)"
echo "  Password: <recovery password above>"
echo ""
echo "⚠️  IMPORTANT: Create a new admin with hashed password within 24 hours!"
