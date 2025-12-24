#!/bin/bash
# Theme Switcher for CreationHub Dashboard

DASH_DIR="/home/inno/compose/volumes/homepage/config"
CUSTOM_CSS="$DASH_DIR/custom.css"
SETTINGS="$DASH_DIR/settings.yaml"

function apply_theme_enterprise() {
    echo "Applying Enterprise Theme (Clean, Minimal, Professional)..."
    
    # 1. Update Settings
    sed -i 's/image: .*/image: ""/' "$SETTINGS"
    sed -i 's/opacity: .*/opacity: 100/' "$SETTINGS"
    
    # 2. CSS
    cat > "$CUSTOM_CSS" <<EOF
/* ENTERPRISE THEME */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

:root {
    --bg-color: #0f172a;
    --card-bg: #1e293b;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --accent: #3b82f6;
    --danger: #ef4444;
}

body {
    background: var(--bg-color) !important;
    font-family: 'Inter', sans-serif !important;
}

.services .service {
    background: var(--card-bg) !important;
    border: 1px solid #334155 !important;
    border-radius: 8px !important;
    box-shadow: none !important;
}

.services .service:hover {
    border-color: var(--accent) !important;
    transform: translateY(-2px);
}

.service-name { color: var(--text-primary) !important; font-weight: 600 !important; }
.service-desc { color: var(--text-secondary) !important; }

/* Clean Progress Bars */
.progress-bar-fill {
    background: var(--accent) !important;
}
EOF
}

function apply_theme_cyber() {
    echo "Applying Cyber Theme (Neon, Dark, Tech)..."
    
    # CSS
    cat > "$CUSTOM_CSS" <<EOF
/* CYBER THEME */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');

body {
    background: #050505 !important;
    font-family: 'JetBrains Mono', monospace !important;
}

.services .service {
    background: #000 !important;
    border: 1px solid #333 !important;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.1) !important;
}

.services .service:hover {
    border-color: #00ff00 !important;
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.4) !important;
}

.service-name { color: #fff !important; text-transform: uppercase; }
.progress-bar-fill { background: #00ff00 !important; }
EOF
}

function apply_theme_glass() {
    echo "Applying Glass Theme (Original)..."
    # Re-runs the apply_config logic ideally, but here we just restore the file
    /home/inno/compose/apply_config.sh
}

echo "Select Theme:"
echo "1) Enterprise (Clean Slate)"
echo "2) Cyberpunk (Neon Terminal)"
echo "3) Glass (Gradients)"
read -p "Choice [1-3]: " choice

case $choice in
    1) apply_theme_enterprise ;;
    2) apply_theme_cyber ;;
    3) apply_theme_glass ;;
    *) echo "Invalid choice"; exit 1 ;;
esac

# Fix Permissions & Restart
chown -R 1000:1000 "$DASH_DIR"
docker restart creationhub-homepage
echo "Theme applied. Refresh Dashboard!"
