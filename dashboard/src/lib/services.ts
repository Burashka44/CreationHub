// Service Registry - All CreationHub services with their configurations
export interface ServiceConfig {
  id: string;
  name: string;
  description: string;
  category: 'ai' | 'admin' | 'automation' | 'media' | 'network' | 'core' | 'system';
  port: number;
  icon: string;
  color: string;
  externalUrl?: string;
  internalUrl?: string;
  healthEndpoint?: string;
}

export const SERVICES: ServiceConfig[] = [
  // AI Services
  { id: 'ai-chat', name: 'AI Chat', description: 'Ollama LLM for chat & code', category: 'ai', port: 11434, icon: 'MessageSquare', color: 'emerald', externalUrl: '/ai-hub' },
  { id: 'ai-transcribe', name: 'AI Transcribe', description: 'Whisper speech-to-text', category: 'ai', port: 8000, icon: 'Mic', color: 'blue', externalUrl: '/ai-hub' },
  { id: 'ai-translate', name: 'AI Translate', description: 'LibreTranslate', category: 'ai', port: 5000, icon: 'Languages', color: 'purple', externalUrl: '/ai-hub' },
  { id: 'ai-tts', name: 'AI TTS', description: 'Piper text-to-speech', category: 'ai', port: 10200, icon: 'Volume2', color: 'orange', externalUrl: '/ai-hub' },

  // Admin
  { id: 'portainer', name: 'Portainer', description: 'Docker management', category: 'admin', port: 9000, icon: 'Container', color: 'sky', externalUrl: 'http://localhost:9000' },
  { id: 'grafana', name: 'Grafana', description: 'Metrics & dashboards', category: 'admin', port: 3001, icon: 'BarChart3', color: 'orange', externalUrl: 'http://localhost:3001' },
  { id: 'dozzle', name: 'Dozzle', description: 'Container logs', category: 'admin', port: 8888, icon: 'ScrollText', color: 'gray', externalUrl: 'http://localhost:8888' },
  { id: 'adminer', name: 'Adminer', description: 'Database admin', category: 'admin', port: 8083, icon: 'Database', color: 'indigo', externalUrl: 'http://localhost:8083' },
  { id: 'glances', name: 'Glances', description: 'System monitoring', category: 'admin', port: 61208, icon: 'Activity', color: 'green', externalUrl: 'http://localhost:61208' },

  // Automation
  { id: 'n8n', name: 'n8n', description: 'Workflow automation', category: 'automation', port: 5678, icon: 'Workflow', color: 'rose', externalUrl: 'http://localhost:5678' },
  { id: 'browserless', name: 'Browserless', description: 'Headless browser', category: 'automation', port: 3002, icon: 'Globe', color: 'cyan', externalUrl: 'http://localhost:3002' },
  { id: 'healthchecks', name: 'Healthchecks', description: 'Cron monitoring', category: 'automation', port: 8001, icon: 'HeartPulse', color: 'red', externalUrl: 'http://localhost:8001' },

  // Media
  { id: 'nextcloud', name: 'Nextcloud', description: 'File sync & share', category: 'media', port: 8081, icon: 'Cloud', color: 'blue', externalUrl: 'http://localhost:8081' },
  { id: 'filebrowser', name: 'File Browser', description: 'File management', category: 'media', port: 8082, icon: 'FolderOpen', color: 'amber', externalUrl: 'http://localhost:8082' },
  { id: 'yt-dlp', name: 'YouTube DL', description: 'Video downloader', category: 'media', port: 8084, icon: 'Youtube', color: 'red', externalUrl: 'http://localhost:8084' },
  { id: 'rsshub', name: 'RSSHub', description: 'RSS feed generator', category: 'media', port: 1200, icon: 'Rss', color: 'orange', externalUrl: 'http://localhost:1200' },

  // Network
  { id: 'npm', name: 'Nginx Proxy', description: 'Reverse proxy & SSL', category: 'network', port: 81, icon: 'Shield', color: 'green', externalUrl: 'http://localhost:81' },
  { id: 'wireguard-ui', name: 'WireGuard UI', description: 'VPN management', category: 'network', port: 5003, icon: 'Lock', color: 'purple', externalUrl: 'http://localhost:5003' },
  { id: 'vpn-manager', name: 'VPN Manager', description: 'VPN tunnel control', category: 'network', port: 5001, icon: 'Network', color: 'violet', externalUrl: 'http://localhost:5001' },

  // Core (no external UI)
  { id: 'postgres', name: 'PostgreSQL', description: 'Main database', category: 'core', port: 5432, icon: 'Database', color: 'blue' },
  { id: 'redis', name: 'Redis', description: 'Cache & queues', category: 'core', port: 6379, icon: 'Zap', color: 'red' },
];

export const getServicesByCategory = (category: ServiceConfig['category']) =>
  SERVICES.filter(s => s.category === category);

export const getServiceById = (id: string) =>
  SERVICES.find(s => s.id === id);
