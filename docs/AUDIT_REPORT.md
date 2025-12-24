# Full System Audit Report - CreationHub
**Date**: 2025-12-20 13:04  
**Total Services**: 28 containers  
**Status**: 16 Working | 4 Failed | 8 Infrastructure

---

## ✅ Working Services (16/20)

| Service | Port | Status | Response |
|---------|------|--------|----------|
| Homepage | 3000 | ✅ UP | HTTP 200 |
| n8n | 5678 | ✅ UP | HTTP 200 |
| Grafana | 3001 | ✅ UP | HTTP 302 (redirect) |
| Nextcloud | 8081 | ✅ UP | HTTP 200 |
| Filebrowser | 8082 | ✅ UP | HTTP 200 |
| Channel Manager | 5002 | ✅ UP | HTTP 200 |
| Portainer | 9000 | ✅ UP | HTTP 307 (redirect) |
| NPM | 81 | ✅ UP | HTTP 200 |
| Dozzle | 8888 | ✅ UP | HTTP 200 |
| Glances | 61208 | ✅ UP | HTTP 200 |
| WireGuard UI | 5003 | ✅ UP | HTTP 307 |
| VPN Manager | 5001 | ✅ UP | HTTP 200 |
| yt-dlp (via VPN) | 8080 | ✅ UP | HTTP 200 |
| Browserless | 3002 | ✅ UP | HTTP 404 (expected) |
| RSSHub | 1200 | ✅ UP | HTTP 200 |
| Whisper AI | 8000 | ✅ UP | HTTP 200 |

---

## ❌ Broken Services (4/20)

### 1. Healthchecks (Port 8001)
**Status**: ❌ Container Missing  
**Issue**: Container removed and not recreated after Docker restart  
**Fix**:
```bash
sudo docker compose --env-file .env -f compose/postgres.yml -f compose/healthchecks.yml up -d
```

### 2. Adminer (Port 8083)
**Status**: ⚠️ Container UP, Port Not Accessible  
**Issue**: Running in host network mode (port 8080 internally), but binding fails  
**Container**: Up 15 minutes  
**Fix**: Recreate with proper port mapping
```bash
sudo docker rm -f creationhub-adminer
sudo docker compose -f compose/adminer.yml up -d
```

### 3. LibreTranslate (Port 5000)
**Status**: ⚠️ Container UP, Service Not Responding  
**Container**: Up 15 minutes  
**Port Binding**: ✅ Exposed (0.0.0.0:5000)  
**Issue**: Service not listening or startup error  
**Fix**: Check logs and restart
```bash
sudo docker logs creationhub-ai-translate --tail 50
sudo docker restart creationhub-ai-translate
```

### 4. Piper TTS (Port 10200)
**Status**: ⚠️ Container UP, Service Not Responding  
**Container**: Up 15 minutes  
**Port Binding**: ✅ Exposed (0.0.0.0:10200)  
**Issue**: Wyoming Piper downloaded model but may not be serving HTTP  
**Fix**: Verify Wyoming protocol vs HTTP API
```bash
sudo docker logs creationhub-ai-tts --tail 50
```

---

## 🔍 Port Conflicts Analysis

| Port | Service(s) | Conflict |
|------|-----------|----------|
| 8080 | yt-dlp (VPN), Adminer (internal) | ⚠️ Adminer should use 8083 |
| 8000 | Whisper, Healthchecks (internal) | ✅ Healthchecks remapped to 8001 |
| 5000 | Translate, VPN Manager (internal) | ✅ VPN Manager on 5001 |

---

## 📋 Configuration Issues

### 1. Missing Network Definitions
Several compose files were missing explicit network definitions. **Status**: ✅ Fixed in V1.12

### 2. Healthchecks Not Starting
After Docker restart, Healthchecks didn't auto-start because it wasn't included in the startup sequence.

### 3. Adminer Host Network Issue
Using `--network host` bypasses Docker's port mapping. Service listens on 8080 but we want 8083.

### 4. TTS Protocol Mismatch
`creationhub-ai-tts` uses Wyoming protocol (WebSocket/TCP), not HTTP. Port 10200 is open but curl won't work.

---

## 🐛 Additional Bugs Found

### Dashboard Widget Issues
1. **customapi widget** for IP location working but may need `mappings` refinement
2. **Glances widget** set to `metric: cpu` - temps/GPU not shown if available

### Service Icons
Some icons may not load in Homepage:
- `openai` → Should use standard icon library
- `tailscale` → Not in default set

---

## 🔧 Recommended Fixes

### Priority 1 (Broken Services)
1. ✅ Start Healthchecks container
2. ✅ Fix Adminer port binding
3. ⚠️ Investigate Translate startup (check if model downloaded)
4. ℹ️ TTS uses Wyoming protocol, not HTTP (expected behavior)

### Priority 2 (Dashboard)
1. Update icon names to use Homepage standard icons
2. Add more Glances metrics (temp, GPU if available)
3. Test customapi widget data display

### Priority 3 (Documentation)
1. Update DASHBOARD_SPEC_FOR_LOVABLE.md with correct statuses
2. Document Wyoming protocol for TTS
3. Create service health monitoring script

---

## 📊 Final Status

**Working**: 16/20 user-facing services (80%)  
**Infrastructure**: 8/8 backend services (postgres, redis, watchtower, etc.)  
**Critical Issues**: 1 (Healthchecks missing)  
**Minor Issues**: 3 (Adminer port, Translate, TTS)

**Overall System Health**: 🟡 Good (Most services operational)
