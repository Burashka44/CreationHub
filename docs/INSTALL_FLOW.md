# INSTALL_FLOW.md
CreationHub — Installation Flow

## Overview
Installation is orchestrated by install.sh.
install.sh never mixes responsibilities.

## Phase 1: UI (Configuration Collection)
- Uses whiptail
- Single uninterrupted wizard
- No system changes
- Collects:
  - Timezone
  - Hostname
  - Admin email
  - Temporary password
  - LAN/WAN IP
  - WireGuard on/off
  - DNS provider
  - Enabled services
- Writes state files to /opt/creationhub/state

## Phase 2: INSTALL
- apt update / upgrade
- install Docker, Compose, WireGuard, Firewall, GPU stack
- pull Docker images
- No configuration applied

## Phase 3: CONFIGURE
- Apply timezone and hostname
- Configure DNS (systemd-resolved)
- Enable/disable WireGuard
- Configure firewall rules
- Generate .env
- Select docker compose modules

## Phase 4: START
- docker compose up -d
- wait for healthchecks
- run diagnostics
- generate summary
