# 🔄 RESTORATION GUIDE

## Prerequisites
- Docker & Docker Compose installed
- Git installed
- Sufficient disk space (~2-3 GB)

## Quick Restoration Steps

### 1. Extract Project Files
```bash
cd /path/to/new/location
tar -xzf project-files.tar.gz
```

### 2. Restore .env
```bash
cp dot-env-SENSITIVE .env
chmod 600 .env
```

### 3. Install Dependencies
```bash
cd system-api && npm install
cd .. && npm install
```

### 4. Start Services (without data first)
```bash
docker compose up -d postgres redis
sleep 10
```

### 5. Restore PostgreSQL Database
```bash
gunzip -c postgres-dump.sql.gz | docker exec -i creationhub_postgres psql -U postgres postgres
```

### 6. Restore Redis (if available)
```bash
docker cp redis-dump.rdb creationhub_redis:/data/dump.rdb
docker compose restart redis
```

### 7. Restore Volumes (optional)
```bash
mkdir -p volumes/grafana volumes/prometheus
tar -xzf volumes/grafana.tar.gz -C .
tar -xzf volumes/prometheus.tar.gz -C .
sudo chown -R 472:472 volumes/grafana
sudo chown -R 65534:65534 volumes/prometheus
```

### 8. Start All Services
```bash
docker compose up -d
```

### 9. Verify
```bash
docker compose ps
curl http://localhost:7777
curl http://localhost:9191/health
```

## Troubleshooting

### Database Connection Failed
- Check .env passwords match
- Verify postgres container is healthy: `docker compose ps`
- Check logs: `docker compose logs postgres`

### Permission Denied on Volumes
- Run: `sudo chown -R 472:472 volumes/grafana`
- Run: `sudo chown -R 65534:65534 volumes/prometheus`

### Git Restore (optional)
If you want to restore exact git state:
```bash
git checkout <commit-hash-from-git-info.txt>
```

## Partial Restoration

### Just Database
```bash
gunzip -c postgres-dump.sql.gz | docker exec -i creationhub_postgres psql -U postgres postgres
```

### Just Code
```bash
tar -xzf project-files.tar.gz
npm install
cd system-api && npm install
```

## Security Note
After restoration, consider:
1. Rotating all passwords in .env
2. Regenerating JWT_SECRET
3. Updating API keys

---
Backup Created: $(date)
