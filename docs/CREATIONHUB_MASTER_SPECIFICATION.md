CREATIONHUB — MASTER SPECIFICATION (FULL PROJECT, DETAILED)
========================================================

This document is the SINGLE SOURCE OF TRUTH for the entire CreationHub project:
- what the project is
- what components exist
- how everything interacts
- how installation works end-to-end
- what defaults/rules are mandatory
- what is considered correct vs incorrect implementation

If a developer reads ONLY this file plus install.sh, they must understand the full intent.

Version: v1 (authoritative)
Scope: Ubuntu 24 + Docker Compose v2 + WireGuard + Firewall + Web UIs

========================================================
1) PROJECT PURPOSE
========================================================

CreationHub is a single-server platform providing:

- Infrastructure baseline for self-hosting
- Web-managed administration for all major functions
- Media workflows (download, decode/encode, GPU acceleration)
- Automation (n8n) as orchestration brain
- Private cloud for family (Nextcloud)
- File management for admin tasks (Filebrowser)
- Health monitoring (Healthchecks)
- Secure remote access (WireGuard VPN)
- Reverse-proxy gateway for controlled exposure (Nginx Proxy Manager)
- Database + cache as shared infrastructure primitives (PostgreSQL, Redis)

CreationHub must be reproducible and maintainable:
- safe re-runs of installer
- explicit states and transitions
- no hidden or “magical” behavior

========================================================
2) NON-NEGOTIABLE PRINCIPLES (CONTRACT)
========================================================

2.1 Determinism & Idempotency
- install.sh must be safely rerunnable
- re-run must not “randomly” change passwords or break running services
- state must be explicit and stored

2.2 Phase separation (STRICT)
- UI (collect only) → INSTALL (software only) → CONFIGURE (settings only) → START (run only)
- never mix these responsibilities

2.3 Web UI everywhere
- every service that is user-facing MUST have a Web UI endpoint or be managed via a Web UI service
- CLI usage is allowed only for debugging/emergency

2.4 LAN-first security posture
- direct WAN access to containers is forbidden
- WAN access only through WireGuard and/or Nginx Proxy Manager (NPM)

2.5 Docker networking is isolated & conflict-proof
- no default docker ranges for project networks
- project networks must use CGNAT ranges (100.64.0.0/10), explicitly defined

2.6 Single PostgreSQL instance with isolation inside
- one Postgres container
- each service gets its own database + its own DB user with limited privileges

2.7 Secrets handling
- secrets live in .env with strict permissions (600)
- logs must not leak secrets

========================================================
3) SYSTEM REQUIREMENTS
========================================================

OS:
- Ubuntu 24.04 LTS

Hardware:
- Intel desktop (example: i5/Xeon class) + NVIDIA GTX 1080 Ti (Pascal)

Packages needed (high level):
- docker + docker compose (v2 plugin)
- wireguard-tools
- ufw (firewall backend)
- systemd-resolved (DNS)
- nvidia driver (535+ recommended) + nvidia-container-toolkit
- media tools (ffmpeg, yt-dlp if used on host; otherwise containerized)

========================================================
4) DIRECTORY STRUCTURE (ON HOST)
========================================================

/opt/creationhub/
├─ install.sh                    # orchestrator
├─ apply_config.sh               # apply CONFIGURE phase (called by install.sh)
├─ .env                          # runtime secrets (chmod 600)
├─ compose/                      # modular compose files
│   ├─ base.yml
│   ├─ postgres.yml
│   ├─ redis.yml
│   ├─ npm.yml
│   ├─ portainer.yml
│   ├─ adminer.yml
│   ├─ redis-commander.yml       # optional
│   ├─ n8n.yml
│   ├─ nextcloud.yml
│   ├─ filebrowser.yml
│   ├─ healthchecks.yml
│   ├─ browserless.yml
│   ├─ media.yml                 # ffmpeg + ytdlp workers / tooling
│   ├─ wireguard-ui.yml          # web management
│   └─ firewall-ui.yml           # web management
├─ state/
│   ├─ state.json                # all UI answers + derived config (atomic writes)
│   ├─ enabled_services.json      # computed list for compose selection
│   ├─ system_state.json          # install/configure/start markers
│   └─ summary.txt               # final service endpoints & creds
├─ logs/
│   └─ install.log               # full log (chmod 600)
└─ bin/
   ├─ creationhub-doctor          # diagnostics command
   └─ creationhub-compose         # helper wrapper that builds the -f list

Volumes root (recommended):
/opt/creationhub/volumes/
  postgres/
  redis/
  n8n/
  nextcloud/
  filebrowser/
  healthchecks/
  npm/
  portainer/
  browserless/
  media/
  wireguard-ui/
  firewall-ui/

Rule: each service uses its own volume directory.

========================================================
5) INSTALL.SH — HIGH LEVEL BEHAVIOR
========================================================

install.sh is the single entrypoint.
It must:

- run preflight checks
- run whiptail UI wizard (full menu) to collect configuration
- execute INSTALL phase
- execute CONFIGURE phase
- execute START phase
- print and save summary
- provide a single diagnostics command

Install logging:
- everything to /opt/creationhub/logs/install.log
- whiptail must use /dev/tty and NOT be broken by logging redirection

========================================================
6) WHIPTAIL UI — FULL BEHAVIOR
========================================================

Whiptail must follow WHIPTAIL_BEHAVIOR_DETAILED.md exactly.
Summary here (must match detailed file):

Screens (sequence):
1) Intro
2) Hostname
3) Timezone selection (UTC, NY, Moscow, Sakhalin, China)
4) Admin email
5) Temporary password (confirm)
6) LAN IP (auto/manual)
7) WAN IP (auto/manual)
8) WireGuard enable/disable
9) DNS provider selection (WG / Google / Cloudflare / Yandex)
10) Services checklist (defaults ON)
11) Summary + Install/Back/Abort

UI rules:
- one continuous session
- Back/Next navigation
- Abort requires confirmation
- validate inputs, no silent fixes
- save state.json after each screen

========================================================
7) PHASE MODEL (STRICT)
========================================================

7.1 UI (collect only)
- no system changes

7.2 INSTALL (software only)
- apt update + full-upgrade
- install docker, compose, wireguard, ufw, nvidia stack (if GPU)
- pull required docker images
- no configuration applied

7.3 CONFIGURE (settings only)
- set timezone
- set hostname
- configure DNS + WireGuard logic (systemd-resolved)
- configure firewall rules
- generate .env (do not overwrite existing secrets unless explicitly first install)
- generate enabled_services.json
- prepare compose selection (list of compose/*.yml to include)

7.4 START (run only)
- docker compose up -d with selected compose files
- wait for health checks
- run doctor
- produce summary

========================================================
8) DNS + WIREGUARD (AUTHORITATIVE POLICY)
========================================================

Goal: predictable DNS behavior with explicit rules.

Rule A (priority):
- If WireGuard is ENABLED and active → system DNS is forced from WireGuard config (DNS= line in wg0.conf)
- If WireGuard is DISABLED or removed → system DNS is forced from UI selection

Implementation constraints:
- DNS must be enforced via systemd-resolved (resolvectl)
- do not manually edit /etc/resolv.conf
- do not depend on NetworkManager “auto DNS” behavior
- when switching WG state, flush caches

Notes:
- If WG is enabled, UI DNS selection is stored but not used until WG is disabled.
- This behavior must be clearly stated in final summary.

========================================================
9) FIREWALL (UFW) + WEB UI
========================================================

Backend firewall: UFW (nftables backend).
Firewall must be enabled by default with policy:
- deny incoming
- allow outgoing
- allow established

Rules:
- allow SSH from LAN (or restricted IP set)
- allow WireGuard port
- allow NPM ports (80/443) as needed (LAN or VPN; never expose extra UIs on WAN)
- allow container UIs from LAN only
- block WAN access to all container ports

Web UI firewall management:
- provide a firewall Web UI service container (firewall-ui)
- accessible LAN-only (or behind NPM/VPN)

Docker + UFW caveat:
- docker can bypass UFW in some setups; rules must be applied in a docker-aware manner
- the project must enforce “WAN cannot access container ports” as a tested invariant

========================================================
10) DOCKER MODEL (NETWORKS, COMMUNICATION, ACCESS)
========================================================

10.1 Networks
Project networks must be explicit and conflict-proof:

- backend:
  subnet: 100.64.10.0/24
  internal: true
  purpose: internal-only service communication (no internet)

- egress:
  subnet: 100.64.20.0/24
  internal: false
  purpose: outbound internet access for selected services

No other project network ranges are allowed.

10.2 Communication contract
Containers communicate ONLY by service name (Docker DNS), never by IP.

Examples:
- postgres:5432
- redis:6379
- n8n:5678
- browserless:3000

10.3 Internet access by class
Class A (needs internet egress):
- Nginx Proxy Manager (for certs / upstream checks)
- n8n (APIs, Telegram, webhooks)
- yt-dlp / media tooling (downloads)
- RSSHub
- Browserless
- Nextcloud (updates, app store, integrations)

Class B (no internet needed):
- PostgreSQL
- Redis
- Adminer
- Filebrowser (optional)
- Healthchecks (depends; can be internal-only)

Implementation:
- Class A services attach to both backend + egress
- Class B services attach only to backend

10.4 LAN-only access to UIs
All UIs must be bound to LAN only or accessed via NPM/VPN:
- No container UI port should be exposed on 0.0.0.0 unless explicitly restricted by firewall and documented.

========================================================
11) SERVICES LIST (MINIMUM STACK)
========================================================

Infrastructure:
- Docker Engine + Compose v2
- PostgreSQL (single instance)
- Redis

Gateway / access:
- Nginx Proxy Manager (NPM)
- WireGuard (client mode) + Web UI for management/import

Admin / management UIs:
- Portainer (Docker management)
- Adminer (DB management)
- Filebrowser (server filesystem management)
- Firewall Web UI (manages UFW)

Core apps:
- n8n (automation)
- Nextcloud (family cloud)

Automation helpers:
- Browserless (headless browser automation)
- RSSHub (feeds)

Monitoring:
- Healthchecks

Media:
- FFmpeg + tooling (GPU-capable)
- yt-dlp as part of media tooling

Notes:
- All are enabled by default in UI unless user unchecks.
- Removing a service removes containers + volumes but preserves config templates and commented env values.

========================================================
12) DATABASE & PERMISSIONS MODEL
========================================================

PostgreSQL:
- single container

For each app:
- create database: db_<service>
- create user: user_<service>
- grant only required privileges on its database
- do not use postgres superuser in app connections

Example mapping:
- n8n → db_n8n / user_n8n
- nextcloud → db_nextcloud / user_nextcloud
- healthchecks → db_healthchecks / user_healthchecks

========================================================
13) SECRETS & CREDENTIALS POLICY
========================================================

Temporary password:
- provided by user in UI
- used as initial password for service UIs where applicable
- shown in summary
- user is instructed to change after first login

Critical rule:
- re-running install.sh must NOT rotate passwords automatically
- secrets should be generated only if missing

.env file:
- chmod 600
- owned by root or install user depending on policy
- never print secrets into logs
- if logging commands, mask secrets

========================================================
14) ENABLE / DISABLE SERVICES (IDEMPOTENT BEHAVIOR)
========================================================

Services are modular compose files.
install.sh composes the final stack by building a docker compose command with multiple -f files:

docker compose -f compose/base.yml -f compose/postgres.yml -f compose/n8n.yml up -d

Disable behavior when a service is unchecked:
- stop and remove containers for that service
- remove volumes for that service
- remove the compose module from enabled_services.json
- comment its env vars in .env
- preserve config templates and state history for future re-enable

Re-enable behavior:
- include compose module again
- recreate volume
- start service clean using preserved configuration templates

========================================================
15) MEDIA WORKFLOWS (INTERACTION MODEL)
========================================================

Media processing is coordinated by n8n.

Typical pipeline:
1) Download media (yt-dlp) → write to media volume
2) Process/encode (ffmpeg with GPU) → write output to media volume
3) Publish/store (Nextcloud or filesystem)
4) Optional: notify via Telegram / webhook

Key constraints:
- avoid HTTP coupling between yt-dlp and ffmpeg; prefer shared volume + n8n orchestration
- ensure GPU container runtime is configured for ffmpeg container
- keep media volume separate from Nextcloud data volume

========================================================
16) LOGGING, SUMMARY, DIAGNOSTICS
========================================================

install.log:
- /opt/creationhub/logs/install.log
- chmod 600
- capture all stdout/stderr except whiptail UI

summary.txt:
- /opt/creationhub/state/summary.txt
- printed to terminal at end
- includes:
  - hostname
  - LAN IP
  - WAN IP
  - timezone
  - DNS mode explanation (WG override)
  - list of services with:
    - URL (LAN)
    - port
    - username (if relevant)
    - password (temporary password or pointer to .env)

Doctor command:
- /opt/creationhub/bin/creationhub-doctor
Must report:
- docker status
- compose version
- container health state
- DNS state (resolved status)
- WireGuard status
- GPU availability (nvidia-smi)
- disk space
- last N error lines from install.log (without secrets)

========================================================
17) VERSIONING & COMPATIBILITY (GENERAL RULES)
========================================================

- Use latest stable versions available for Ubuntu 24 unless otherwise pinned.
- Prefer major version pinning where upgrades may break data:
  - PostgreSQL: pin major (15 or 16)
  - Redis: pin major (7)
  - Nextcloud: pin major (e.g., 29)
  - NPM/Portainer: pin stable tags where possible

- Avoid “latest” tags for stateful services unless explicitly accepted.

========================================================
18) WHAT IS CONSIDERED A BUG / FAILURE
========================================================

Any of the following is considered incorrect implementation:

- whiptail missing or partial compared to WHIPTAIL_BEHAVIOR_DETAILED.md
- system changes happening during UI
- mixing phases (install in configure, etc.)
- container UIs accessible from WAN directly
- docker network subnets overlapping LAN/VPN
- services using IP addresses instead of service names
- secrets printed to logs
- re-run breaks stack or rotates credentials unexpectedly

========================================================
19) WHAT SUCCESS LOOKS LIKE (ACCEPTANCE CRITERIA)
========================================================

After running install.sh:
- user sees a full whiptail wizard
- installation completes without manual edits
- all selected services run
- all UIs are reachable from LAN
- WAN cannot reach container ports directly
- DNS behavior follows WG override rule
- doctor provides actionable diagnostics
- summary lists all endpoints and credentials

========================================================
END OF MASTER SPECIFICATION
========================================================
