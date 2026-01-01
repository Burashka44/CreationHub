# CreationHub Dashboard

Это центральный дашборд управления сервером InoGuru / CreationHub.

## Возможности
*   **Мониторинг**: Статистика сервера (CPU, RAM, GPU), сеть, аптайм.
*   **Управление**: WireGuard VPN, Сервисы, Резервное копирование.
*   **AI Хаб**: Локальная интеграция с Ollama (Chat, Image Gen).
*   **Уведомления**: Интеграция с Telegram ботами.

## Установка и Запуск

Проект работает в Docker контейнерах.

```bash
cd creationhub-dashboard

# Запуск
docker compose up -d --build
```

После запуска дашборд доступен по адресу `http://localhost:80` (через Nginx) или по IP вашего сервера.

## Структура
*   `src/`: Frontend на React + Vite + ShadcnUI.
*   `system-api/`: Локальный API для работы с системными файлами (WireGuard, OS info) и проксирования Ollama.
*   `stats-recorder/`: Сервис сбора метрик в PostgreSQL.

## Бэкап и Перенос
См. подробную инструкцию в [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md).
