#!/bin/bash
# Security status checker - writes to database

# Get database connection
DB_HOST="${DATABASE_HOST:-creationhub-postgres}"
DB_USER="${DATABASE_USER:-postgres}"
DB_NAME="${DATABASE_NAME:-postgres}"

# Check UFW status
UFW_STATUS=$(sudo ufw status 2>/dev/null | head -1 | awk '{print $2}')
UFW_RULES=$(sudo ufw status numbered 2>/dev/null | grep -c "ALLOW")

# Check Fail2Ban status
F2B_STATUS=$(sudo systemctl is-active fail2ban 2>/dev/null)
F2B_JAILS=$(sudo fail2ban-client status 2>/dev/null | grep "Number of jail" | awk '{print $NF}')
F2B_BANNED=$(sudo fail2ban-client status sshd 2>/dev/null | grep "Currently banned" | awk '{print $NF}')

# Check SSL (if nginx on 443)
SSL_VALID="unknown"
if command -v openssl &> /dev/null; then
  SSL_DAYS=$(echo | openssl s_client -connect localhost:443 -servername localhost 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2)
  if [ -n "$SSL_DAYS" ]; then
    SSL_VALID="valid"
  fi
fi

# Check pending security updates
UPDATES=$(apt list --upgradable 2>/dev/null | grep -c security || echo "0")

# Output JSON
cat << EOF
{
  "ufw": {
    "status": "$UFW_STATUS",
    "rules": $UFW_RULES
  },
  "fail2ban": {
    "status": "$F2B_STATUS",
    "jails": ${F2B_JAILS:-0},
    "banned": ${F2B_BANNED:-0}
  },
  "ssl": "$SSL_VALID",
  "updates": ${UPDATES:-0},
  "timestamp": "$(date -Iseconds)"
}
EOF
