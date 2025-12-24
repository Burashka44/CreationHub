CREATIONHUB — FINAL SYSTEM SUMMARY (END-TO-END)
==================================================

THIS IS THE EXECUTIVE + TECHNICAL SUMMARY
----------------------------------------
This document explains the FINAL CreationHub project:
- what the system is
- what components exist
- how they interact
- how data flows
- how networking works
- how security works
- how installation works
- what assumptions are fixed

This is NOT an implementation guide.
This is a SYSTEM EXPLANATION.

==================================================
1. WHAT CREATIONHUB IS
==================================================

CreationHub is a single-server, self-hosted PLATFORM, not a single application.

Its purpose:
- act as a MEDIA HUB (download, process, encode, store)
- act as an AUTOMATION HUB (workflows, bots, schedulers)
- act as a PRIVATE CLOUD for non-technical users
- act as a SECURE REMOTE WORK ENVIRONMENT
- be REPRODUCIBLE and MAINTAINABLE

It is designed to be:
- always-on
- web-managed
- safe to reconfigure
- safe to reinstall
- understandable without tribal knowledge

==================================================
2. CORE IDEA (ONE SENTENCE)
==================================================

CreationHub = Docker-based media + automation platform
where n8n orchestrates media pipelines,
GPU accelerates processing,
Nextcloud serves end-users,
and everything is securely accessed via LAN/VPN.

==================================================
3. ROLES (VERY IMPORTANT)
==================================================

There are TWO DIFFERENT USER ROLES:

ADMIN:
- manages infrastructure
- manages files
- manages services
- uses Filebrowser, Portainer, Adminer

USERS / FAMILY:
- consume media
- store files
- watch videos on TV
- use Nextcloud ONLY

These roles NEVER MIX.

==================================================
4. HIGH-LEVEL COMPONENTS
==================================================

Infrastructure layer:
- Ubuntu 24
- systemd-resolved (DNS)
- UFW (firewall)
- WireGuard (VPN client)
- NVIDIA drivers + container toolkit

Platform layer:
- Docker Engine
- Docker Compose v2

Shared services:
- PostgreSQL (single instance, isolated DBs)
- Redis (cache / queues)

Gateway & access:
- Nginx Proxy Manager (reverse proxy)
- WireGuard Web UI
- Firewall Web UI

Core applications:
- n8n (automation orchestrator)
- Nextcloud (family cloud)
- Filebrowser (admin filesystem access)

Automation helpers:
- Browserless (headless browser)
- RSSHub

Monitoring:
- Healthchecks

Media tooling:
- yt-dlp (download)
- FFmpeg (GPU accelerated encode/decode)

==================================================
5. NETWORKING MODEL (CRITICAL)
==================================================

Host networking:
- LAN (192.168.x.x or similar)
- WAN (public IP)
- WireGuard interface (10.x.x.x typical)

Docker networking:
- backend network: 100.64.10.0/24 (internal only)
- egress network: 100.64.20.0/24 (outbound internet)

Why:
- no conflicts with LAN/VPN
- no accidental exposure

==================================================
6. HOW CONTAINERS TALK TO EACH OTHER
==================================================

Rules:
- containers talk ONLY via Docker service names
- never via IP
- never via localhost

Examples:
- n8n -> postgres:5432
- nextcloud -> postgres:5432
- n8n -> browserless:3000

==================================================
7. INTERNET ACCESS RULES
==================================================

Two classes of services:

Class A (needs internet):
- n8n
- yt-dlp
- Browserless
- RSSHub
- Nextcloud
- NPM

Class B (no internet):
- PostgreSQL
- Redis
- Adminer
- Filebrowser
- Healthchecks

Implementation:
- Class A attached to backend + egress
- Class B attached only to backend

==================================================
8. ACCESS FROM OUTSIDE
==================================================

Direct WAN -> containers:
- FORBIDDEN

Allowed:
- LAN -> containers
- VPN (WireGuard) -> containers
- WAN -> NPM -> containers (explicit routes only)

==================================================
9. DNS & WIREGUARD POLICY
==================================================

DNS is globally enforced.

Rules:
- If WireGuard is ACTIVE:
  - DNS is taken from WireGuard config
- If WireGuard is INACTIVE:
  - DNS is taken from system default (UI choice)

Implementation:
- systemd-resolved
- resolvectl
- no manual resolv.conf edits

==================================================
10. DATABASE MODEL
==================================================

PostgreSQL:
- single container

Isolation:
- each service has its own DB
- each service has its own DB user
- no shared schemas
- no superuser usage by apps

==================================================
11. MEDIA PIPELINE (CORE VALUE)
==================================================

Media flow is orchestrated by n8n.

Typical pipeline:
1. n8n triggers workflow
2. yt-dlp downloads media
3. media stored in staging volume
4. FFmpeg processes media (GPU)
5. output written to media volume
6. result published to Nextcloud
7. notification sent (Telegram, etc.)

No tight coupling.
Volumes are the interface.

==================================================
12. INSTALLATION MODEL
==================================================

install.sh is an ORCHESTRATOR.

Phases:
1. UI (whiptail) — collect ALL decisions
2. INSTALL — install software only
3. CONFIGURE — apply settings only
4. START — run containers only

Never mixed.

==================================================
13. SERVICE ENABLE / DISABLE
==================================================

Services are modular.

Disable:
- container removed
- volume removed
- env commented
- config preserved

Re-enable:
- clean start
- old config reused

==================================================
14. SECRETS & CONFIG
==================================================

.env file:
- single source of truth
- chmod 600
- secrets never logged
- passwords NOT rotated on re-run

==================================================
15. MONITORING & DIAGNOSTICS
==================================================

Health:
- Healthchecks monitors jobs/workflows

Diagnostics:
- creationhub-doctor command
- checks docker, dns, vpn, gpu, disk, logs

==================================================
16. WHAT MAKES THIS DIFFERENT
==================================================

CreationHub is NOT:
- a dev playground
- a single app
- a throwaway script
- a cloud replacement

CreationHub IS:
- a personal media + automation backbone
- stable
- predictable
- controlled

==================================================
END OF SUMMARY
==================================================
