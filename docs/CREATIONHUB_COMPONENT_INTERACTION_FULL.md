
CREATIONHUB — COMPLETE COMPONENT & INTERACTION SPECIFICATION
============================================================

This document answers ONE question in full detail:

FOR WHAT PURPOSE EACH SERVICE EXISTS
AND HOW IT INTERACTS WITH ALL OTHER PARTS OF THE SYSTEM.

This is NOT marketing.
This is NOT architecture-only.
This is an OPERATIONAL AND SEMANTIC DESCRIPTION.

Anyone reading this must understand:
- why each service exists
- what problem it solves
- who uses it (admin / automation / family)
- what it talks to
- what it MUST NOT talk to

============================================================
1. SYSTEM OVERVIEW (BIG PICTURE)
============================================================

CreationHub is a SINGLE integrated system composed of multiple cooperating services.

The system has three functional layers:

1) Infrastructure & Security Layer
2) Platform & Shared Services Layer
3) Application & Workflow Layer

Everything runs on ONE physical server.
All services are containerized.
All access is web-based.

============================================================
2. INFRASTRUCTURE & SECURITY LAYER
============================================================

--------------------------------
2.1 Ubuntu 24.04 LTS (Host OS)
--------------------------------
Purpose:
- Stable, long-term base OS
- systemd, nftables, modern kernel

Responsibilities:
- hardware control
- networking
- firewall
- DNS
- GPU drivers

Interacts with:
- Docker Engine
- WireGuard
- systemd-resolved
- UFW
- NVIDIA drivers

Must NOT:
- run application logic directly
- host databases outside Docker

--------------------------------
2.2 systemd-resolved (DNS)
--------------------------------
Purpose:
- Single authoritative DNS manager for the whole system

Why:
- Predictable DNS behavior
- Safe interaction with VPNs
- Avoid DNS leaks

Behavior:
- If WireGuard active → DNS from WG config
- If WireGuard inactive → DNS from user-selected provider

Interacts with:
- WireGuard
- Docker (via resolv.conf)

Must NOT:
- be bypassed by containers
- be overridden by NetworkManager

--------------------------------
2.3 UFW + nftables (Firewall)
--------------------------------
Purpose:
- Enforce network security policy

Rules enforced:
- deny incoming by default
- allow outgoing
- allow LAN access to service UIs
- allow VPN access
- block WAN access to containers

Interacts with:
- Docker networking
- WireGuard interface
- Nginx Proxy Manager

--------------------------------
2.4 WireGuard (VPN client mode)
--------------------------------
Purpose:
- Secure remote access
- Bypass external blocking
- Secure admin access

Used by:
- Admin
- Automation needing clean internet egress

Interacts with:
- systemd-resolved (DNS override)
- Firewall
- Docker (egress traffic)

============================================================
3. PLATFORM & SHARED SERVICES LAYER
============================================================

--------------------------------
3.1 Docker Engine + Compose v2
--------------------------------
Purpose:
- Unified runtime for all services

Why:
- Isolation
- Reproducibility
- Clean dependency management

Interacts with:
- Host OS
- All containers

--------------------------------
3.2 Docker Networks
--------------------------------

backend network (100.64.10.0/24):
- internal-only
- no internet
- service-to-service communication

egress network (100.64.20.0/24):
- outbound internet only
- used by services that must reach the internet

--------------------------------
3.3 PostgreSQL (single instance)
--------------------------------
Purpose:
- Persistent relational storage

Used by:
- n8n (workflows, executions)
- Nextcloud (files metadata, users)
- Healthchecks
- Other apps if added

Isolation model:
- One DB per service
- One DB user per service

Must NOT:
- expose port to WAN
- share credentials between services

--------------------------------
3.4 Redis
--------------------------------
Purpose:
- Fast in-memory store

Used by:
- n8n (queues, caching)
- Nextcloud (locking, caching)
- Optional background jobs

============================================================
4. GATEWAY & ACCESS SERVICES
============================================================

--------------------------------
4.1 Nginx Proxy Manager (NPM)
--------------------------------
Purpose:
- Controlled gateway from WAN to selected services

Why:
- Central TLS management
- No direct exposure of containers

Interacts with:
- Firewall
- Docker backend services
- WAN clients

--------------------------------
4.2 WireGuard Web UI
--------------------------------
Purpose:
- Import/manage WireGuard configs via browser

Used by:
- Admin

Interacts with:
- WireGuard service
- Firewall

--------------------------------
4.3 Firewall Web UI
--------------------------------
Purpose:
- Visual management of firewall rules

Used by:
- Admin

Interacts with:
- UFW / nftables

============================================================
5. APPLICATION & WORKFLOW LAYER
============================================================

--------------------------------
5.1 n8n (AUTOMATION BRAIN)
--------------------------------
Purpose:
- Central orchestration engine

This is NOT "just automation".
n8n is the LOGIC CORE of CreationHub.

Used for:
- Media pipelines
- Bots (Telegram, etc.)
- Scheduled jobs
- Event-driven workflows

Interacts with:
- PostgreSQL
- Redis
- yt-dlp
- FFmpeg
- Browserless
- Nextcloud
- External APIs

--------------------------------
5.2 yt-dlp (MEDIA INGEST)
--------------------------------
Purpose:
- Download media from external sources

Used by:
- n8n workflows

Interacts with:
- Internet (egress)
- Media volumes

Must NOT:
- expose any UI
- accept inbound connections

--------------------------------
5.3 FFmpeg (MEDIA PROCESSING)
--------------------------------
Purpose:
- Encode, decode, transcode media
- Use GPU acceleration

Used by:
- n8n workflows

Interacts with:
- NVIDIA GPU
- Media volumes

--------------------------------
5.4 Browserless
--------------------------------
Purpose:
- Headless browser automation

Used by:
- n8n workflows
- Scraping
- JS-heavy websites

--------------------------------
5.5 RSSHub
--------------------------------
Purpose:
- Convert sites into RSS feeds

Used by:
- n8n
- Automation workflows

--------------------------------
5.6 Nextcloud (FAMILY CLOUD)
--------------------------------
Purpose:
- Cloud storage for non-technical users

Used by:
- Family
- TVs
- Mobile devices

Interacts with:
- PostgreSQL
- Redis
- Media volumes

Must NOT:
- be used for admin filesystem access

--------------------------------
5.7 Filebrowser (ADMIN FS ACCESS)
--------------------------------
Purpose:
- Web-based filesystem access for admin

Used by:
- Admin

Interacts with:
- Host filesystem
- Media volumes
- Config directories

--------------------------------
5.8 Healthchecks
--------------------------------
Purpose:
- Monitor scheduled jobs and workflows

Used by:
- n8n
- Cron-like tasks

============================================================
6. DATA & MEDIA FLOW (EXPLICIT)
============================================================

Media pipeline example:

1) n8n triggers workflow
2) yt-dlp downloads media
3) Media stored in staging volume
4) FFmpeg processes media (GPU)
5) Output written to media volume
6) Media synced to Nextcloud
7) Notification sent

============================================================
7. WHAT MUST NEVER HAPPEN
============================================================

- Containers talking by IP
- Containers exposed directly to WAN
- Media tools running on host instead of containers
- Databases exposed externally
- DNS overridden manually
- Secrets logged
- Family users accessing admin tools

============================================================
END OF DOCUMENT
============================================================
