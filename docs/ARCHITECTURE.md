# ARCHITECTURE.md
CreationHub — Architecture v1 (IMMUTABLE)

## Purpose
CreationHub is a single-server, production-grade platform for media processing,
automation, private cloud, and secure access.

This document defines architectural decisions.
They MUST NOT be changed during implementation.

## Core Principles
- One server = one project
- One installer entrypoint (install.sh)
- Idempotent execution
- Latest supported software versions only
- Everything has Web UI
- CLI is emergency-only
- Install → Configure → Start phases are strictly separated

## System Model
CreationHub is a controlled system with explicit states:
- Installed
- Configured
- Running

Transitions are one-directional per execution.

## Security Model
- All services are LAN-only by default
- WAN access only via WireGuard or Nginx Proxy Manager
- Firewall enabled by default (deny incoming / allow outgoing)
- Secrets stored in .env (permissions 600)

## DNS & WireGuard Policy
- If WireGuard is enabled → DNS is forced from WireGuard config
- If WireGuard is disabled → DNS is forced from UI selection
- DNS is always enforced globally via systemd-resolved
