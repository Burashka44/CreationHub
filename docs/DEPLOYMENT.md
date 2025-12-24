# Инструкция по развёртыванию Dashboard на Ubuntu 24.04 LTS

## Требования

- Ubuntu 24.04 LTS (Server или Desktop)
- Минимум 2 GB RAM
- 10 GB свободного места на диске
- Доступ в интернет
- Права sudo

---

## 1. Обновление системы

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 2. Установка Node.js 20 LTS

```bash
# Добавляем репозиторий NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Устанавливаем Node.js
sudo apt install -y nodejs

# Проверяем версии
node -v  # должно показать v20.x.x
npm -v   # должно показать 10.x.x
```

---

## 3. Установка Git

```bash
sudo apt install -y git
```

---

## 4. Клонирование репозитория

```bash
# Переходим в директорию для проектов
cd /opt

# Клонируем репозиторий (замените URL на ваш)
sudo git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git dashboard

# Меняем владельца на текущего пользователя
sudo chown -R $USER:$USER /opt/dashboard

# Переходим в директорию проекта
cd /opt/dashboard
```

---

## 5. Установка зависимостей

```bash
npm install
```

---

## 6. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
nano .env
```

Добавьте следующие переменные (замените значения на свои):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

Сохраните файл: `Ctrl+O`, затем `Ctrl+X`

---

## 7. Сборка для продакшена

```bash
npm run build
```

После сборки статические файлы будут в папке `dist/`

---

## 8. Установка и настройка Nginx

### Установка Nginx

```bash
sudo apt install -y nginx
```

### Создание конфигурации сайта

```bash
sudo nano /etc/nginx/sites-available/dashboard
```

Вставьте конфигурацию:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # или IP-адрес сервера

    root /opt/dashboard/dist;
    index index.html;

    # Gzip сжатие
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Кэширование статики
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA роутинг - все запросы направляем на index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Проксирование запросов к Supabase Edge Functions (опционально)
    location /functions/ {
        proxy_pass https://your-project-id.supabase.co/functions/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Активация конфигурации

```bash
# Создаём символическую ссылку
sudo ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/

# Удаляем дефолтный сайт
sudo rm /etc/nginx/sites-enabled/default

# Проверяем конфигурацию
sudo nginx -t

# Перезапускаем Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 9. Настройка SSL с Let's Encrypt (рекомендуется)

```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение SSL сертификата
sudo certbot --nginx -d your-domain.com

# Автоматическое обновление сертификатов
sudo systemctl enable certbot.timer
```

---

## 10. Настройка файрвола

```bash
# Разрешаем HTTP и HTTPS
sudo ufw allow 'Nginx Full'

# Включаем файрвол (если ещё не включён)
sudo ufw enable

# Проверяем статус
sudo ufw status
```

---

## 11. Автоматическое обновление (опционально)

Создайте скрипт для обновления:

```bash
sudo nano /opt/dashboard/update.sh
```

```bash
#!/bin/bash
cd /opt/dashboard
git pull origin main
npm install
npm run build
echo "Dashboard updated at $(date)"
```

```bash
chmod +x /opt/dashboard/update.sh
```

### Добавление в cron для автообновления

```bash
# Редактируем crontab
crontab -e

# Добавляем строку для обновления каждый день в 3:00
0 3 * * * /opt/dashboard/update.sh >> /var/log/dashboard-update.log 2>&1
```

---

## 12. Режим разработки (для локального тестирования)

Если нужно запустить в режиме разработки:

```bash
cd /opt/dashboard
npm run dev -- --host 0.0.0.0
```

Приложение будет доступно на порту 8080.

Для запуска в фоне:

```bash
# Установка PM2
sudo npm install -g pm2

# Запуск dev сервера через PM2
pm2 start npm --name "dashboard-dev" -- run dev -- --host 0.0.0.0

# Автозапуск при перезагрузке
pm2 startup
pm2 save
```

---

## Структура проекта

```
/opt/dashboard/
├── dist/                 # Собранные файлы (после npm run build)
├── src/                  # Исходный код React
├── supabase/
│   └── functions/        # Edge Functions
├── public/               # Статические файлы
├── .env                  # Переменные окружения
├── package.json          # Зависимости
└── vite.config.ts        # Конфигурация сборки
```

---

## Полезные команды

```bash
# Проверка статуса Nginx
sudo systemctl status nginx

# Просмотр логов Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Перезапуск Nginx
sudo systemctl restart nginx

# Пересборка проекта
cd /opt/dashboard && npm run build
```

---

## Решение проблем

### Ошибка "Permission denied"
```bash
sudo chown -R $USER:$USER /opt/dashboard
```

### Ошибка "Port 80 already in use"
```bash
sudo lsof -i :80
sudo systemctl stop apache2  # если Apache запущен
```

### Ошибка сборки "Out of memory"
```bash
# Увеличиваем лимит памяти Node.js
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Белый экран после деплоя
Проверьте, что в Nginx правильно настроен `try_files` для SPA роутинга.

---

## Технологический стек

- **Frontend**: React 18, TypeScript, Vite
- **Стили**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **Сборка**: Vite
- **Веб-сервер**: Nginx

---

## Контакты и поддержка

При возникновении проблем создайте Issue в репозитории.
