#!/usr/bin/env bash
# /home/inno/compose/bin/dashboard_controller.sh
# Requires 'jq' and 'yq' (if available, otherwise sed hacks)

DASH_DIR="/home/inno/compose/volumes/homepage/config"
SETTINGS_FILE="$DASH_DIR/settings.yaml"

function set_language() {
    local lang="$1"
    # Homepage doesn't support 'language' key natively in settings.yaml for UI translation (it's mostly icons/text).
    # But we can change the TITLES of the services in services.yaml.
    # For now, we will just toggle a "locale" marker file and regenerate config.
    echo "$lang" > "$DASH_DIR/locale"
    echo "Language preference set to $lang. Please run ./apply_config.sh or Wait for restart."
}

function set_theme() {
    local theme="$1" # enterprise, glass, cyber
    /home/inno/compose/bin/theme_switch.sh "$theme"
}

case "$1" in
    "lang")
        set_language "$2"
        ;;
    "theme")
        set_theme "$2"
        ;;
    *)
        echo "Usage: $0 {lang [ru|en] | theme [enterprise|glass|cyber]}"
        exit 1
        ;;
esac
