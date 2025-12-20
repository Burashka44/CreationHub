# Self-Hosting Guide / Руководство по самостоятельному развёртыванию

Это руководство описывает, как развернуть CreationHub Dashboard на своём сервере без зависимости от Lovable Cloud.

---

## Содержание

1. [Требования](#требования)
2. [Быстрый старт (локальная разработка)](#быстрый-старт-локальная-разработка)
3. [Полное развёртывание на сервере](#полное-развёртывание-на-сервере)
4. [Настройка базы данных](#настройка-базы-данных)
5. [Edge Functions](#edge-functions)
6. [Секреты и переменные окружения](#секреты-и-переменные-окружения)
7. [Nginx и SSL](#nginx-и-ssl)
8. [Автоматические обновления](#автоматические-обновления)
9. [Мониторинг и логи](#мониторинг-и-логи)
10. [Решение проблем](#решение-проблем)

---

## Требования

### Минимальные системные требования
- **ОС:** Ubuntu 22.04/24.04 LTS, Debian 11+, или CentOS 8+
- **CPU:** 2 ядра
- **RAM:** 4 GB (рекомендуется 8 GB)
- **Диск:** 20 GB SSD
- **Docker:** версия 20.10+
- **Docker Compose:** версия 2.0+
- **Node.js:** версия 20 LTS

### Порты
- `80` - HTTP
- `443` - HTTPS
- `8080` - Фронтенд (разработка)
- `54321` - Supabase API
- `54322` - Supabase Studio
- `54323` - Supabase Inbucket (email)
- `5432` - PostgreSQL

---

## Быстрый старт (локальная разработка)

### 1. Клонирование репозитория

```bash
git clone https://github.com/Burashka44/CreationHub.git
cd CreationHub
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Установка Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Linux
curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/scripts/install.sh | sh

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 4. Запуск локального Supabase

```bash
# Инициализация (если ещё не инициализирован)
npx supabase init

# Запуск всех сервисов
npx supabase start
```

После запуска вы увидите:
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Создание файла .env.local

Создайте файл `.env.local` в корне проекта:

```env
# Supabase Configuration
VITE_SUPABASE_URL="http://localhost:54321"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # anon key из вывода выше
VITE_SUPABASE_PROJECT_ID="local"

# Optional: для разработки
VITE_DEV_MODE="true"
```

### 6. Применение миграций базы данных

```bash
# Применить все миграции
npx supabase db push

# Или применить миграции вручную
npx supabase migration up
```

### 7. Запуск фронтенда

```bash
npm run dev
```

Откройте браузер: `http://localhost:8080`

### 8. Доступ к Supabase Studio

Откройте `http://localhost:54323` для доступа к админ-панели базы данных.

---

## Полное развёртывание на сервере

### Шаг 1: Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка необходимых пакетов
sudo apt install -y curl git nginx certbot python3-certbot-nginx

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Установка Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Шаг 2: Self-Hosted Supabase

#### Вариант A: Supabase с Docker Compose (рекомендуется)

```bash
# Клонирование Supabase
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# Копирование примера конфигурации
cp .env.example .env
```

Отредактируйте файл `.env`:

```env
############
# Secrets - ОБЯЗАТЕЛЬНО ИЗМЕНИТЕ!
############

# Генерация секретов:
# openssl rand -base64 32

POSTGRES_PASSWORD=ваш_супер_сложный_пароль_для_postgres
JWT_SECRET=ваш_jwt_секрет_минимум_32_символа
ANON_KEY=сгенерированный_anon_key
SERVICE_ROLE_KEY=сгенерированный_service_role_key

############
# General
############

SITE_URL=https://yourdomain.com
API_EXTERNAL_URL=https://api.yourdomain.com

############
# Database
############

POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432

############
# Studio
############

STUDIO_PORT=54323
STUDIO_DEFAULT_ORGANIZATION=CreationHub
STUDIO_DEFAULT_PROJECT=Dashboard

############
# API Proxy
############

KONG_HTTP_PORT=54321
KONG_HTTPS_PORT=54322
```

Генерация JWT ключей:

```bash
# Установите jwt-cli или используйте онлайн генератор
# https://supabase.com/docs/guides/self-hosting#api-keys

# Или используйте Node.js скрипт:
node -e "
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const jwtSecret = crypto.randomBytes(32).toString('base64');
console.log('JWT_SECRET=' + jwtSecret);

const anonPayload = {
  role: 'anon',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60)
};

const servicePayload = {
  role: 'service_role',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60)
};

console.log('ANON_KEY=' + jwt.sign(anonPayload, jwtSecret));
console.log('SERVICE_ROLE_KEY=' + jwt.sign(servicePayload, jwtSecret));
"
```

Запуск Supabase:

```bash
docker-compose up -d
```

#### Вариант B: Только PostgreSQL (минимальный)

Если вам не нужен полный Supabase, можно использовать только PostgreSQL:

```bash
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_secure_password
      POSTGRES_DB: creationhub
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

В этом случае вам нужно будет написать свой API-слой или использовать PostgREST.

### Шаг 3: Развёртывание фронтенда

```bash
# Клонирование проекта
cd /var/www
git clone https://github.com/Burashka44/CreationHub.git
cd CreationHub

# Установка зависимостей
npm install

# Создание production .env
cat > .env.production << EOF
VITE_SUPABASE_URL="https://api.yourdomain.com"
VITE_SUPABASE_PUBLISHABLE_KEY="ваш_anon_key"
VITE_SUPABASE_PROJECT_ID="production"
EOF

# Сборка
npm run build
```

### Шаг 4: Настройка Nginx

```bash
sudo nano /etc/nginx/sites-available/creationhub
```

```nginx
# Фронтенд
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/CreationHub/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}

# Supabase API Proxy
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:54321;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/creationhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Шаг 5: SSL сертификаты

```bash
# Получение сертификатов Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Автоматическое обновление
sudo crontab -e
# Добавьте строку:
0 0 1 * * certbot renew --quiet
```

---

## Настройка базы данных

### Применение существующих миграций

Все миграции находятся в папке `supabase/migrations/`. Для применения:

```bash
# Через Supabase CLI
npx supabase db push

# Или напрямую через psql
for file in supabase/migrations/*.sql; do
    psql -h localhost -U postgres -d postgres -f "$file"
done
```

### Структура таблиц

Основные таблицы:
- `media_channels` - Telegram/YouTube каналы
- `telegram_bots` - Telegram боты
- `admins` - Администраторы
- `ad_purchases` - Покупки рекламы
- `ad_sales` - Продажи рекламы
- `ai_requests` - AI запросы
- `app_settings` - Настройки приложения

### Резервное копирование

```bash
# Создание бэкапа
pg_dump -h localhost -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление
psql -h localhost -U postgres -d postgres < backup_file.sql

# Автоматический бэкап (добавьте в crontab)
0 3 * * * pg_dump -h localhost -U postgres -d postgres | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

---

## Edge Functions

### Локальный запуск

```bash
# Запуск всех функций
npx supabase functions serve

# Запуск конкретной функции
npx supabase functions serve fetch-telegram-stats
```

### Развёртывание на сервере

Edge Functions можно развернуть как:

#### Вариант A: Deno Deploy (рекомендуется)

1. Зарегистрируйтесь на https://deno.com/deploy
2. Подключите GitHub репозиторий
3. Укажите путь к функциям: `supabase/functions`

#### Вариант B: Самостоятельный запуск с Deno

```bash
# Установка Deno
curl -fsSL https://deno.land/x/install/install.sh | sh

# Запуск функции как сервиса
deno run --allow-net --allow-env supabase/functions/fetch-telegram-stats/index.ts
```

#### Вариант C: Docker контейнер

Создайте `Dockerfile.functions`:

```dockerfile
FROM denoland/deno:1.40.0

WORKDIR /app
COPY supabase/functions ./functions

# Установка переменных окружения
ENV SUPABASE_URL=http://localhost:54321
ENV SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

EXPOSE 8000

CMD ["deno", "run", "--allow-net", "--allow-env", "functions/fetch-telegram-stats/index.ts"]
```

```bash
docker build -f Dockerfile.functions -t creationhub-functions .
docker run -d -p 8000:8000 --env-file .env creationhub-functions
```

### Список Edge Functions

| Функция | Описание | Endpoint |
|---------|----------|----------|
| `fetch-telegram-stats` | Получение статистики Telegram каналов | `/functions/v1/fetch-telegram-stats` |
| `fetch-youtube-stats` | Получение статистики YouTube | `/functions/v1/fetch-youtube-stats` |
| `send-telegram-notification` | Отправка уведомлений в Telegram | `/functions/v1/send-telegram-notification` |
| `publish-telegram-post` | Публикация постов в Telegram | `/functions/v1/publish-telegram-post` |
| `ai-chat` | AI чат | `/functions/v1/ai-chat` |
| `ai-image` | Генерация изображений | `/functions/v1/ai-image` |
| `track-ad-click` | Отслеживание кликов по рекламе | `/functions/v1/track-ad-click` |

---

## Секреты и переменные окружения

### Список необходимых секретов

| Переменная | Описание | Обязательно |
|------------|----------|-------------|
| `SUPABASE_URL` | URL Supabase API | Да |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key | Да |
| `SUPABASE_ANON_KEY` | Anon Key | Да |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота | Для Telegram функций |
| `YOUTUBE_API_KEY` | API ключ YouTube | Для YouTube функций |
| `OPENAI_API_KEY` | API ключ OpenAI | Для AI функций |
| `LOVABLE_API_KEY` | API ключ Lovable AI | Для Lovable AI |

### Настройка секретов

#### Для локальной разработки

Создайте файл `supabase/.env.local`:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
YOUTUBE_API_KEY=your_youtube_api_key
OPENAI_API_KEY=your_openai_api_key
```

#### Для production

```bash
# Через Supabase CLI
npx supabase secrets set TELEGRAM_BOT_TOKEN=your_token
npx supabase secrets set YOUTUBE_API_KEY=your_key

# Или через переменные окружения Docker
docker run -e TELEGRAM_BOT_TOKEN=your_token ...
```

---

## Nginx и SSL

### Полная конфигурация с SSL

```nginx
# /etc/nginx/sites-available/creationhub

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# Frontend
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    root /var/www/CreationHub/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

    # Cache static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.yourdomain.com wss://api.yourdomain.com;" always;
}

# Supabase API
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # WebSocket support
    location / {
        proxy_pass http://localhost:54321;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

---

## Автоматические обновления

### Скрипт автообновления

Создайте `/opt/scripts/update-creationhub.sh`:

```bash
#!/bin/bash

set -e

PROJECT_DIR="/var/www/CreationHub"
LOG_FILE="/var/log/creationhub-update.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cd "$PROJECT_DIR"

# Проверка обновлений
git fetch origin

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    log "No updates available"
    exit 0
fi

log "Updates found, starting deployment..."

# Создание бэкапа
cp -r dist dist.backup.$(date +%Y%m%d_%H%M%S)

# Обновление
git pull origin main
npm install
npm run build

# Применение миграций
npx supabase db push

log "Update completed successfully"

# Очистка старых бэкапов (оставить последние 5)
ls -dt dist.backup.* | tail -n +6 | xargs rm -rf 2>/dev/null || true
```

```bash
chmod +x /opt/scripts/update-creationhub.sh

# Добавление в crontab (проверка каждые 30 минут)
crontab -e
# */30 * * * * /opt/scripts/update-creationhub.sh
```

### Systemd сервис для разработки

Создайте `/etc/systemd/system/creationhub-dev.service`:

```ini
[Unit]
Description=CreationHub Development Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/CreationHub
ExecStart=/usr/bin/npm run dev
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=development

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable creationhub-dev
sudo systemctl start creationhub-dev
```

---

## Мониторинг и логи

### Просмотр логов

```bash
# Nginx логи
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Docker логи Supabase
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f postgres
docker-compose logs -f kong
```

### Мониторинг ресурсов

```bash
# Установка htop
sudo apt install htop

# Мониторинг Docker
docker stats

# Проверка дискового пространства
df -h

# Проверка использования памяти PostgreSQL
docker exec -it supabase-db psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('postgres'));"
```

### Настройка алертов

Создайте `/opt/scripts/health-check.sh`:

```bash
#!/bin/bash

DOMAIN="https://yourdomain.com"
API_DOMAIN="https://api.yourdomain.com"
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_CHAT_ID="your_chat_id"

send_alert() {
    curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
        -d chat_id="$TELEGRAM_CHAT_ID" \
        -d text="🚨 CreationHub Alert: $1"
}

# Проверка фронтенда
if ! curl -s --head "$DOMAIN" | grep "200 OK" > /dev/null; then
    send_alert "Frontend is down!"
fi

# Проверка API
if ! curl -s "$API_DOMAIN/rest/v1/" | grep -q ""; then
    send_alert "API is down!"
fi

# Проверка диска
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt 90 ]; then
    send_alert "Disk usage is above 90%: ${DISK_USAGE}%"
fi
```

```bash
# Запуск каждые 5 минут
crontab -e
# */5 * * * * /opt/scripts/health-check.sh
```

---

## Решение проблем

### Частые проблемы

#### 1. Ошибка подключения к базе данных

```bash
# Проверка статуса PostgreSQL
docker-compose ps
docker-compose logs postgres

# Проверка подключения
psql -h localhost -U postgres -d postgres -c "SELECT 1"
```

#### 2. CORS ошибки

Добавьте в конфигурацию Kong (`supabase/docker/volumes/api/kong.yml`):

```yaml
plugins:
  - name: cors
    config:
      origins:
        - https://yourdomain.com
      methods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
      headers:
        - Authorization
        - Content-Type
      credentials: true
```

#### 3. Edge Functions не работают

```bash
# Проверка логов
npx supabase functions logs fetch-telegram-stats

# Проверка переменных окружения
npx supabase secrets list
```

#### 4. Медленная загрузка

```bash
# Включение кеширования в Nginx (см. конфигурацию выше)

# Оптимизация PostgreSQL
# Добавьте в postgresql.conf:
shared_buffers = 256MB
effective_cache_size = 768MB
maintenance_work_mem = 64MB
```

#### 5. Нехватка памяти

```bash
# Проверка использования памяти
free -h
docker stats

# Добавление swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Полезные команды

```bash
# Перезапуск всех сервисов
docker-compose restart

# Очистка Docker
docker system prune -a

# Пересборка фронтенда
cd /var/www/CreationHub && npm run build

# Проверка SSL сертификата
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Тест производительности
ab -n 1000 -c 100 https://yourdomain.com/
```

---

## Контакты и поддержка

- **GitHub Issues:** https://github.com/Burashka44/CreationHub/issues
- **Документация Supabase:** https://supabase.com/docs

---

## Лицензия

MIT License - см. файл LICENSE
