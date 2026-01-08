# Handoff: CreationHub v2.5 (Stable)
**Date:** 2026-01-08
**Branch:** `fix/dashboard-repairs`

## Current State
✅ **Dashboard:** Fully functional on `http://192.168.1.220:7777/`
✅ **Services:** 20 active services, all reachable.
✅ **LAN Access:** Services like Adminer, PostgREST, Ollama are accessible from LAN (0.0.0.0).

## Recent Major Changes
1.  **Service Accessibility:**
    *   Fixed `ServiceCard.tsx` to handle custom URLs (Adminer :8083, NPM :81, etc).
    *   Changed bindings to `0.0.0.0` for previously localhost-only services.
2.  **Healthchecks Fixed:**
    *   Added `SITE_ROOT` env var.
    *   Fixed port mapping `8001:8000`.
3.  **AI Services Exposed:**
    *   AI Transcribe (`:8000`), Translate (`:5000`), TTS (`:5500`) ports exposed for direct API usage.
4.  **Cleanup:**
    *   **REMOVED** `vpn-manager` (IPSec) as it was redundant with WireGuard.

## Known "Issues" (Not Bugs)
*   **IOPaint (:8585):** Shows "Welcome to nginx". This is intentional placeholder.
*   **VPN Manager:** Removed intentionally.

## Next Steps
1.  Monitor resource usage with new AI services exposed.
2.  If IOPaint Docker image becomes available, update `docker-compose.yml`.
