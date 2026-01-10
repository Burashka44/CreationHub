# Backup Package - Pre Security Fix
**Created:** $(date)
**Project:** CreationHub v2.5

## 📦 Contents

### Backups
- `database_full_backup.sql.gz` - Complete PostgreSQL database dump (1.3MB)
- `docker-compose.yml.original` - Original compose configuration
- `nginx.conf.original` - Original nginx configuration
- `docker-compose.resolved.yml` - Fully resolved compose config with all env vars
- `containers_state.json` - Container states snapshot

### Rollback Scripts

#### 🔴 Full Rollback (Use if everything breaks)
```bash
./rollback_full.sh
```
Restores:
- docker-compose.yml
- nginx.conf
- Restarts PostgREST and Adminer
- Tests all services

**Time:** ~30 seconds
**Risk:** Very low

---

#### 🟡 Partial Rollback - PostgREST Only
```bash
./rollback_postgrest_only.sh
```
Only reopens PostgREST port (0.0.0.0:3000)
Keeps Adminer closed

**Use when:** Dashboard stopped working, but Adminer is fine

---

#### 🟡 Partial Rollback - Adminer Only
```bash
./rollback_adminer_only.sh
```
Only reopens Adminer port (0.0.0.0:8083)
Keeps PostgREST closed

**Use when:** Need direct Adminer access, dashboard works fine

---

#### 🔴 Database Restore (DANGEROUS)
```bash
./restore_database.sh
```
**⚠️ WARNING:** Completely replaces database!
**Use only when:** Database corruption or critical data loss

---

## 🚨 Quick Rollback Commands

### If dashboard is broken:
```bash
cd $(dirname "$0")
./rollback_full.sh
```

### If only need Adminer access:
```bash
cd $(dirname "$0")
./rollback_adminer_only.sh
```

### Manual one-liner rollback:
```bash
cd /home/inno/.gemini/antigravity/scratch/dashboard
cp $(dirname "$0")/docker-compose.yml.original docker-compose.yml
docker compose up -d postgrest adminer
```

---

## 📋 What Changed

### Before Fix:
- PostgREST: `0.0.0.0:3000` (accessible from LAN)
- Adminer: `0.0.0.0:8083` (accessible from LAN)

### After Fix:
- PostgREST: `127.0.0.1:3000` (localhost only)
- Adminer: `127.0.0.1:8083` (localhost only)

### Still Works:
- Dashboard → Nginx → PostgREST (via Docker network)
- Dashboard → Nginx → Adminer (via `/adminer/` proxy)

---

## ✅ Verification After Rollback

```bash
# Dashboard
curl -I http://192.168.1.220:7777/ | grep "200 OK"

# Services API
curl -s http://192.168.1.220:7777/api/v1/rest/v1/services | jq 'length'

# PostgREST direct
curl -I http://192.168.1.220:3000/ | grep "200 OK"

# Adminer direct
curl -I http://192.168.1.220:8083/ | grep "200 OK"
```

All should return success (200 OK).

---

## 📞 Support

If rollback fails:
1. Check Docker logs: `docker compose logs postgrest adminer`
2. Verify containers are running: `docker compose ps`
3. Check disk space: `df -h`
4. Manual restore from this backup directory

---

**Backup preserved at:** $(pwd)
