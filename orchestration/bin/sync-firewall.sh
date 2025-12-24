#!/usr/bin/env bash
set -e

# ==============================================================================
# Sync UFW Firewall with Supabase Database
# ==============================================================================

LOG_FILE="/var/log/creationhub-firewall.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting Firewall Sync..."

# 1. Fetch Rules from DB
# We fetch as a JSON array of objects
RAW_RULES=$(sudo docker exec creationhub-postgres psql -U postgres -d postgres -t -A -c "
SELECT json_agg(json_build_object(
    'port', port, 
    'ip', from_ip, 
    'comment', comment,
    'scope', scope
)) FROM firewall_rules WHERE action = 'ALLOW';
")

if [[ -z "$RAW_RULES" || "$RAW_RULES" == "[]" ]]; then
    log "WARNING: No rules found in DB. Aborting to prevent lockout."
    exit 1
fi

# Safety Check: Ensure SSH (22) and Dashboard (7777) are present
if ! echo "$RAW_RULES" | grep -q "22/tcp"; then
    log "CRITICAL ERROR: SSH rule missing from DB. Aborting reset."
    exit 1
fi
if ! echo "$RAW_RULES" | grep -q "7777/tcp"; then
    log "CRITICAL ERROR: Dashboard rule missing from DB. Aborting reset."
    exit 1
fi

# 2. Reset UFW (Danger Zone)
# We proceed because safety checks passed
log "Resetting UFW rules..."
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null

# 3. Apply Rules
# Using jq to parse (assumes jq is installed, which install.sh did)
echo "$RAW_RULES" | jq -c '.[]' | while read -r rule; do
    PORT=$(echo "$rule" | jq -r '.port')
    IP=$(echo "$rule" | jq -r '.ip')
    COMMENT=$(echo "$rule" | jq -r '.comment')
    
    # Clean port (handle 80/tcp -> 80, proto tcp)
    PORT_NUM=${PORT%/*}
    PROTO=${PORT#*/}
    
    if [[ "$IP" == "Anywhere" || "$IP" == "0.0.0.0/0" ]]; then
        log "Allowing $PORT ($COMMENT) from ANY"
        ufw allow proto "$PROTO" from any to any port "$PORT_NUM" comment "$COMMENT" >/dev/null
    else
        log "Allowing $PORT ($COMMENT) from $IP"
        ufw allow proto "$PROTO" from "$IP" to any port "$PORT_NUM" comment "$COMMENT" >/dev/null
    fi
done

# 4. Enable
ufw --force enable >/dev/null
log "Firewall Sync Complete. Status: Active"
ufw status numbered | tee -a "$LOG_FILE"
