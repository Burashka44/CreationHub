// Service Registry - All CreationHub services with their configurations
export interface ServiceConfig {
  id: string;
  name: string;
  description: string;
  category: 'ai' | 'admin' | 'automation' | 'media' | 'network' | 'core';
  port: number;
  icon: string;
  color: string;
  externalUrl?: string;
  internalUrl?: string;
  healthEndpoint?: string;
}

// Helper to build service URL using current hostname (works from any device)
// Fallback IP is configurable via VITE_SERVER_IP environment variable
const SERVER_IP_FALLBACK = import.meta.env.VITE_SERVER_IP || '192.168.1.220';
const getHost = () => typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? window.location.hostname
  : SERVER_IP_FALLBACK;
const buildUrl = (port: number) => `http://${getHost()}:${port}`;

export const SERVICES: ServiceConfig[] = [
  // AI Services
  { id: 'ai-chat', name: 'AI Chat', description: 'Ollama чат-модель для разговоров и помощи с кодом', category: 'ai', port: 11434, icon: 'MessageSquare', color: 'emerald', externalUrl: '/ai-hub' },
  { id: 'ai-transcribe', name: 'AI Transcribe', description: 'Whisper модель для распознавания речи в текст', category: 'ai', port: 8000, icon: 'Mic', color: 'blue', externalUrl: '/ai-hub' },
  { id: 'ai-translate', name: 'AI Translate', description: 'LibreTranslate сервис перевода между множеством языков', category: 'ai', port: 5000, icon: 'Languages', color: 'purple', externalUrl: '/ai-hub' },
  { id: 'ai-tts', name: 'AI TTS', description: 'Piper синтез речи из текста с разными голосами', category: 'ai', port: 10200, icon: 'Volume2', color: 'orange', externalUrl: '/ai-hub' },

  // Admin
  { id: 'portainer', name: 'Portainer', description: 'Управление Docker контейнерами через веб-интерфейс', category: 'admin', port: 9000, icon: 'Container', color: 'sky', get externalUrl() { return buildUrl(this.port); } },
  { id: 'grafana', name: 'Grafana', description: 'Визуализация метрик и создание дашбордов мониторинга', category: 'admin', port: 3001, icon: 'BarChart3', color: 'orange', get externalUrl() { return buildUrl(this.port); } },
  { id: 'dozzle', name: 'Dozzle', description: 'Просмотр логов контейнеров в реальном времени', category: 'admin', port: 8888, icon: 'ScrollText', color: 'gray', get externalUrl() { return buildUrl(this.port); } },
  { id: 'adminer', name: 'Adminer', description: 'Веб-интерфейс для управления базами данных PostgreSQL', category: 'admin', port: 8083, icon: 'Database', color: 'indigo', externalUrl: '/adminer/' },
  { id: 'glances', name: 'Glances', description: 'Мониторинг системных ресурсов и производительности сервера', category: 'admin', port: 61208, icon: 'Activity', color: 'green', get externalUrl() { return buildUrl(this.port); } },

  // Automation
  { id: 'n8n', name: 'n8n', description: 'Автоматизация рабочих процессов и интеграция сервисов', category: 'automation', port: 5678, icon: 'Workflow', color: 'rose', get externalUrl() { return buildUrl(this.port); } },
  { id: 'browserless', name: 'Browserless', description: 'Headless браузер для автоматизации и веб-скрейпинга', category: 'automation', port: 3002, icon: 'Globe', color: 'cyan', get externalUrl() { return buildUrl(this.port); } },
  { id: 'healthchecks', name: 'Healthchecks', description: 'Мониторинг cron задач и фоновых процессов', category: 'automation', port: 8001, icon: 'HeartPulse', color: 'red', get externalUrl() { return buildUrl(this.port); } },

  // Media
  { id: 'nextcloud', name: 'Nextcloud', description: 'Синхронизация файлов и совместная работа с документами', category: 'media', port: 8081, icon: 'Cloud', color: 'blue', get externalUrl() { return buildUrl(this.port); } },
  { id: 'filebrowser', name: 'File Browser', description: 'Веб-файловый менеджер для управления файлами сервера', category: 'media', port: 8082, icon: 'FolderOpen', color: 'amber', get externalUrl() { return buildUrl(this.port); } },
  { id: 'yt-dlp', name: 'YouTube DL', description: 'Загрузка видео с YouTube и других видеохостингов', category: 'media', port: 8084, icon: 'Youtube', color: 'red', get externalUrl() { return buildUrl(this.port); } },
  { id: 'rsshub', name: 'RSSHub', description: 'Генератор RSS лент из различных источников контента', category: 'media', port: 1200, icon: 'Rss', color: 'orange', get externalUrl() { return buildUrl(this.port); } },

  // Network
  { id: 'npm', name: 'Nginx Proxy', description: 'Обратный прокси-сервер и SSL терминация для сервисов', category: 'network', port: 81, icon: 'Shield', color: 'green', get externalUrl() { return buildUrl(this.port); } },
  { id: 'wireguard-ui', name: 'WireGuard UI', description: 'WireGuard VPN управление', category: 'network', port: 5003, icon: 'Shield', color: 'purple', get externalUrl() { return buildUrl(this.port); } },

  // Core (no external UI)
  { id: 'postgres', name: 'PostgreSQL', description: 'Основная реляционная база данных системы CreationHub', category: 'core', port: 5432, icon: 'Database', color: 'blue' },
  { id: 'redis', name: 'Redis', description: 'Кеш и очередь задач для производительности приложений', category: 'core', port: 6379, icon: 'Zap', color: 'red' },
];

export const getServicesByCategory = (category: ServiceConfig['category']) =>
  SERVICES.filter(s => s.category === category);

export const getServiceById = (id: string) =>
  SERVICES.find(s => s.id === id);
