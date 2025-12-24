# CreationHub Dashboard - Полная Спецификация для Lovable.dev

## 🎯 Цель
Создать кастомный дашборд для управления домашним сервером CreationHub с 28+ Docker-контейнерами.

---

## 🖥️ Сервисы и Порты

### TAB: WORK (Рабочие инструменты)
| Сервис | Порт | URL | Описание | Иконка |
|--------|------|-----|----------|--------|
| **n8n** | 5678 | http://192.168.1.220:5678 | Workflow Automation (как Zapier) | n8n logo |
| **yt-dlp** | 8080 | http://192.168.1.220:8080/api/info | Скачивание видео с YouTube | YouTube icon |
| **Browserless** | 3002 | http://192.168.1.220:3002 | Headless Chrome для автоматизации | Chrome icon |
| **RSSHub** | 1200 | http://192.168.1.220:1200 | Генератор RSS-фидов | RSS icon |
| **Whisper** | 8000 | http://192.168.1.220:8000/docs | Speech-to-Text AI | OpenAI icon |
| **Translate** | 5000 | http://192.168.1.220:5000 | LibreTranslate (переводчик) | Translate icon |

### TAB: DATA (Данные и хранилище)
| Сервис | Порт | URL | Описание | Иконка |
|--------|------|-----|----------|--------|
| **Grafana** | 3001 | http://192.168.1.220:3001 | Аналитика и дашборды | Grafana logo |
| **Nextcloud** | 8081 | http://192.168.1.220:8081 | Облачное хранилище | Nextcloud logo |
| **Filebrowser** | 8082 | http://192.168.1.220:8082 | Файловый менеджер | Folder icon |
| **Channel Manager** | 5002 | http://192.168.1.220:5002 | Управление YouTube/TG каналами | YouTube icon |

### TAB: ADMIN (Администрирование)
| Сервис | Порт | URL | Описание | Иконка |
|--------|------|-----|----------|--------|
| **Portainer** | 9000 | http://192.168.1.220:9000 | Docker UI | Portainer logo |
| **NPM** | 81 | http://192.168.1.220:81 | Nginx Proxy Manager | Nginx icon |
| **Dozzle** | 8888 | http://192.168.1.220:8888 | Логи контейнеров | Terminal icon |
| **Glances** | 61208 | http://192.168.1.220:61208 | Системный монитор | Chart icon |
| **Adminer** | 8083 | http://192.168.1.220:8083 | Админка PostgreSQL | Database icon |
| **Healthchecks** | 8001 | http://192.168.1.220:8001 | Мониторинг uptime | Heart icon |
| **WireGuard UI** | 5003 | http://192.168.1.220:5003 | Настройка VPN | VPN icon |
| **VPN Manager** | 5001 | http://192.168.1.220:5001 | Статус VPN + карта | Map icon |

---

## 🗺️ ГЛАВНАЯ ФИЧА: IP Geolocation Map

### Требования:
1. **Карта мира** с точкой текущего местоположения
2. **Данные берутся из API**: `http://192.168.1.220:5001/api/status`
3. **Ответ API (JSON)**:
```json
{
  "ip": "185.32.xxx.xxx",
  "city": "Amsterdam",
  "region": "North Holland",
  "country": "NL",
  "loc": "52.3676,4.9041",
  "org": "AS12345 VPN Provider",
  "timezone": "Europe/Amsterdam"
}
```
4. **Поле `loc`** содержит координаты `"lat,lon"` для отображения на карте
5. Карта должна обновляться каждые 30 секунд
6. Показывать флаг страны рядом с названием города

---

## 📊 Виджеты верхней панели

### Ряд статистики (слева направо):
1. **CPU Usage** - Круговой gauge (0-100%)
2. **Memory Usage** - Круговой gauge (0-100%)
3. **Disk Usage** - Progress bar с процентом
4. **Uptime** - Текст "X days, Y hours"
5. **IP Location** - Город + Страна + Флаг
6. **Current Time** - Часы с датой

### Источники данных:
- CPU/Memory/Disk: `http://192.168.1.220:61208/api/3/cpu` (Glances API v4)
- IP Location: `http://192.168.1.220:5001/api/status`

---

## 🎨 Дизайн-требования

### Цветовая схема (Dark Theme):
```css
--bg-primary: #0f172a;      /* Темно-синий фон */
--bg-secondary: #1e293b;    /* Карточки */
--accent: #3b82f6;          /* Синий акцент */
--success: #22c55e;         /* Зеленый */
--warning: #f59e0b;         /* Оранжевый */
--danger: #ef4444;          /* Красный */
--text-primary: #f1f5f9;    /* Белый текст */
--text-secondary: #94a3b8;  /* Серый текст */
```

### Вдохновение:
- Тот дашборд с картой и графиками (как Tautulli/Grafana)
- Круговые gauges для CPU/RAM
- Карта с точкой геолокации
- Таблицы с текущими процессами/контейнерами

### Элементы UI:
1. **Cards** - Закругленные углы (8px), легкая тень
2. **Map** - Leaflet.js или Mapbox с темной темой
3. **Charts** - Chart.js или ApexCharts
4. **Gauges** - SVG круговые индикаторы
5. **Icons** - Lucide or Heroicons
6. **Animations** - Плавные переходы (0.2s ease)

---

## 🔗 API Endpoints для интеграции

### Glances (Системный мониторинг):
```
GET http://192.168.1.220:61208/api/3/cpu
GET http://192.168.1.220:61208/api/3/mem
GET http://192.168.1.220:61208/api/3/fs
GET http://192.168.1.220:61208/api/3/sensors
GET http://192.168.1.220:61208/api/3/docker
```

### VPN Manager:
```
GET http://192.168.1.220:5001/api/status     # IP geolocation
GET http://192.168.1.220:5001/api/configs    # List VPN configs
POST http://192.168.1.220:5001/api/switch    # Switch VPN
```

### Channel Manager:
```
GET http://192.168.1.220:5002/               # UI
GET http://192.168.1.220:5002/api/channels   # List channels
POST http://192.168.1.220:5002/add           # Add channel
```

---

## 📐 Layout Structure

```
+-------------------------------------------------------------------+
| HEADER: Logo + Search + Time                                      |
+-------------------------------------------------------------------+
| STATS ROW: [CPU] [RAM] [Disk] [Uptime] [IP: City, Country] [Time] |
+-------------------------------------------------------------------+
| TABS: [ Work ] [ Data ] [ Admin ]                                 |
+-------------------------------+-----------------------------------+
|                               |                                   |
|   MAP: IP LOCATION            |   SYSTEM STATS                    |
|   (Leaflet with dark tiles)   |   - CPU Graph (line chart)        |
|   Point at current location   |   - RAM Graph                     |
|                               |   - Network I/O                   |
|                               |                                   |
+-------------------------------+-----------------------------------+
| SERVICE CARDS GRID (3-4 columns)                                  |
| +----------+ +----------+ +----------+ +----------+               |
| | n8n      | | yt-dlp   | | Whisper  | | Grafana  |               |
| | * UP     | | * UP     | | * UP     | | * UP     |               |
| +----------+ +----------+ +----------+ +----------+               |
+-------------------------------------------------------------------+
```

---

## 🚀 Prompt для Lovable.dev

```
Create a modern dark-themed dashboard for a home server called "CreationHub".

REQUIREMENTS:
1. Dark blue color scheme (#0f172a background)
2. 3 tabs: Work, Data, Admin
3. Top stats bar with: CPU gauge, RAM gauge, Disk bar, Uptime, IP location
4. Interactive world map showing current IP geolocation (fetch from /api/status)
5. Grid of service cards with status indicators (green dot = online)
6. Each card is clickable and opens the service URL
7. Real-time updates every 30 seconds

SERVICES TO DISPLAY:
- n8n (port 5678) - Workflow Automation
- yt-dlp (port 8080) - Video Downloader
- Browserless (port 3002) - Headless Browser
- Whisper (port 8000) - Speech-to-Text
- Translate (port 5000) - LibreTranslate
- Grafana (port 3001) - Analytics
- Nextcloud (port 8081) - Cloud Storage
- Filebrowser (port 8082) - File Manager
- Portainer (port 9000) - Docker UI
- NPM (port 81) - Reverse Proxy
- Dozzle (port 8888) - Container Logs
- Glances (port 61208) - System Monitor
- Adminer (port 8083) - Database Admin
- WireGuard (port 5003) - VPN Config
- VPN Manager (port 5001) - VPN Status with Map

API ENDPOINTS:
- System stats: GET /api/3/cpu, /api/3/mem (Glances on port 61208)
- IP Location: GET /api/status on port 5001 returns {ip, city, country, loc: "lat,lon"}

DESIGN INSPIRATION:
- Grafana dashboards
- Tautulli media server dashboard
- Dark mode with neon blue accents

BASE URL: http://192.168.1.220
```

---

## 📁 Использование

Скачай этот файл и загрузи в Lovable.dev как контекст для генерации дашборда.
