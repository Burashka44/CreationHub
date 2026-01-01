import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'ru' | 'en';

interface Translations {
  [key: string]: {
    ru: string;
    en: string;
  };
}

const translations: Translations = {
  // Navigation
  dashboard: { ru: 'Панель управления', en: 'Dashboard' },
  work: { ru: 'Работа', en: 'Work' },
  data: { ru: 'Данные', en: 'Data' },
  admin: { ru: 'Админ', en: 'Admin' },
  channels: { ru: 'Каналы', en: 'Channels' },
  settings: { ru: 'Настройки', en: 'Settings' },
  network: { ru: 'Сеть', en: 'Network' },
  security: { ru: 'Безопасность', en: 'Security' },
  backups: { ru: 'Бэкапы', en: 'Backups' },
  activity: { ru: 'Активность', en: 'Activity' },
  admins: { ru: 'Администраторы', en: 'Administrators' },
  adminsDescription: { ru: 'Управление администраторами и уведомлениями', en: 'Manage administrators and notifications' },
  mediaAnalytics: { ru: 'Медиа аналитика', en: 'Media Analytics' },
  mediaAnalyticsDescription: { ru: 'Статистика по каналам и подписчикам', en: 'Channel and subscriber statistics' },
  aiHub: { ru: 'AI Hub', en: 'AI Hub' },
  aiHubDescription: { ru: 'Управление AI сервисами', en: 'AI services management' },
  videoPipeline: { ru: 'Видео обработка', en: 'Video Pipeline' },
  videoPipelineDescription: { ru: 'Настройка обработки видео и удаления водяных знаков', en: 'Video processing and watermark removal settings' },

  // Stats
  cpuUsage: { ru: 'Загрузка CPU', en: 'CPU Usage' },
  memoryUsage: { ru: 'Память', en: 'Memory' },
  diskUsage: { ru: 'Диск', en: 'Disk' },
  uptime: { ru: 'Аптайм', en: 'Uptime' },
  currentTime: { ru: 'Время', en: 'Time' },
  gpuMonitor: { ru: 'GPU Монитор', en: 'GPU Monitor' },
  gpuUsage: { ru: 'Загрузка GPU', en: 'GPU Usage' },
  fanSpeed: { ru: 'Скорость вентилятора', en: 'Fan Speed' },
  power: { ru: 'Мощность', en: 'Power' },

  // VPN/Location
  vpnLocation: { ru: 'VPN Локация', en: 'VPN Location' },
  currentIp: { ru: 'Текущий IP', en: 'Current IP' },
  country: { ru: 'Страна', en: 'Country' },
  city: { ru: 'Город', en: 'City' },

  // Services
  services: { ru: 'Сервисы', en: 'Services' },
  online: { ru: 'Онлайн', en: 'Online' },
  offline: { ru: 'Офлайн', en: 'Offline' },
  open: { ru: 'Открыть', en: 'Open' },

  // Channels
  addChannel: { ru: 'Добавить канал', en: 'Add Channel' },
  channelName: { ru: 'Название канала', en: 'Channel Name' },
  platform: { ru: 'Платформа', en: 'Platform' },
  credentials: { ru: 'Учётные данные', en: 'Credentials' },
  connectGoogle: { ru: 'Войти через Google', en: 'Connect with Google' },
  apiKey: { ru: 'API Ключ', en: 'API Key' },
  noChannels: { ru: 'Нет подключённых каналов', en: 'No connected channels' },

  // Quick Actions
  quickActions: { ru: 'Быстрые действия', en: 'Quick Actions' },
  restartServer: { ru: 'Перезапуск сервера', en: 'Restart Server' },
  clearCache: { ru: 'Очистить кэш', en: 'Clear Cache' },
  backupNow: { ru: 'Создать бэкап', en: 'Backup Now' },
  checkUpdates: { ru: 'Проверить обновления', en: 'Check Updates' },
  securityScan: { ru: 'Сканирование', en: 'Security Scan' },
  openTerminal: { ru: 'Терминал', en: 'Terminal' },

  // Network
  networkMonitor: { ru: 'Мониторинг сети', en: 'Network Monitor' },
  download: { ru: 'Загрузка', en: 'Download' },
  upload: { ru: 'Выгрузка', en: 'Upload' },
  latency: { ru: 'Задержка', en: 'Latency' },
  packetsPerSec: { ru: 'Пакетов/с', en: 'Packets/s' },
  live: { ru: 'Живой', en: 'Live' },

  // Notifications
  notifications: { ru: 'Уведомления', en: 'Notifications' },
  markAllRead: { ru: 'Прочитать все', en: 'Mark all read' },
  noNotifications: { ru: 'Нет уведомлений', en: 'No notifications' },

  // Activity Log
  activityLog: { ru: 'Журнал активности', en: 'Activity Log' },
  loggedIn: { ru: 'Вход выполнен', en: 'Logged in' },
  restarted: { ru: 'Перезапущен', en: 'Restarted' },
  backupCreated: { ru: 'Бэкап создан', en: 'Backup created' },
  firewallRuleAdded: { ru: 'Правило файрволла добавлено', en: 'Firewall rule added' },
  configUpdated: { ru: 'Конфигурация обновлена', en: 'Config updated' },
  cacheCleared: { ru: 'Кэш очищен', en: 'Cache cleared' },

  // Backup Status
  backupStatus: { ru: 'Статус бэкапов', en: 'Backup Status' },
  storageUsed: { ru: 'Использовано', en: 'Storage Used' },
  fullSystemBackup: { ru: 'Полный бэкап системы', en: 'Full System Backup' },
  databaseBackup: { ru: 'Бэкап БД', en: 'Database Backup' },
  mediaFiles: { ru: 'Медиа файлы', en: 'Media Files' },
  configBackup: { ru: 'Бэкап конфига', en: 'Config Backup' },
  inProgress: { ru: 'Выполняется...', en: 'In progress...' },
  completed: { ru: 'Завершено', en: 'Completed' },

  // Security
  securityStatus: { ru: 'Статус безопасности', en: 'Security Status' },
  securityScore: { ru: 'Уровень защиты', en: 'Security Score' },
  serverProtected: { ru: 'Ваш сервер хорошо защищён', en: 'Your server is well protected' },
  firewallActive: { ru: 'Файрволл активен', en: 'Firewall Active' },
  sslCertificate: { ru: 'SSL Сертификат', en: 'SSL Certificate' },
  ddosProtection: { ru: 'DDoS Защита', en: 'DDoS Protection' },
  malwareScan: { ru: 'Сканирование на вирусы', en: 'Malware Scan' },
  failedLoginAttempts: { ru: 'Неудачные попытки входа', en: 'Failed Login Attempts' },
  twoFactorAuth: { ru: '2FA Включена', en: '2FA Enabled' },

  // System Charts
  systemPerformance: { ru: 'Производительность системы (24ч)', en: 'System Performance (24h)' },
  cpu: { ru: 'CPU', en: 'CPU' },
  memory: { ru: 'Память', en: 'Memory' },

  // Admin Management
  addAdmin: { ru: 'Добавить админа', en: 'Add Admin' },
  editAdmin: { ru: 'Редактировать админа', en: 'Edit Admin' },
  noAdmins: { ru: 'Нет администраторов', en: 'No administrators' },
  name: { ru: 'Имя', en: 'Name' },
  email: { ru: 'Email', en: 'Email' },
  phone: { ru: 'Телефон', en: 'Phone' },
  contacts: { ru: 'Контакты', en: 'Contacts' },
  status: { ru: 'Статус', en: 'Status' },
  actions: { ru: 'Действия', en: 'Actions' },
  active: { ru: 'Активен', en: 'Active' },
  inactive: { ru: 'Неактивен', en: 'Inactive' },
  receiveNotifications: { ru: 'Получать уведомления', en: 'Receive Notifications' },

  // Media Analytics
  totalSubscribers: { ru: 'Всего подписчиков', en: 'Total Subscribers' },
  totalViews: { ru: 'Всего просмотров', en: 'Total Views' },
  avgEngagement: { ru: 'Средний ER', en: 'Avg Engagement' },
  monthlyGrowth: { ru: 'Рост за месяц', en: 'Monthly Growth' },
  viewsDynamics: { ru: 'Динамика просмотров', en: 'Views Dynamics' },
  subscribersDistribution: { ru: 'Распределение подписчиков', en: 'Subscribers Distribution' },
  subscriberGrowth: { ru: 'Рост подписчиков', en: 'Subscriber Growth' },
  subscribers: { ru: 'Подписчики', en: 'Subscribers' },
  views: { ru: 'Просмотры', en: 'Views' },
  engagement: { ru: 'Вовлечённость', en: 'Engagement' },

  // Online Users
  onlineUsers: { ru: 'Пользователи онлайн', en: 'Online Users' },
  adminsOnline: { ru: 'Админы', en: 'Admins' },
  usersOnline: { ru: 'Пользователи', en: 'Users' },

  // General
  save: { ru: 'Сохранить', en: 'Save' },
  cancel: { ru: 'Отмена', en: 'Cancel' },
  delete: { ru: 'Удалить', en: 'Delete' },
  edit: { ru: 'Редактировать', en: 'Edit' },
  search: { ru: 'Поиск...', en: 'Search...' },
  theme: { ru: 'Тема', en: 'Theme' },
  language: { ru: 'Язык', en: 'Language' },
  dark: { ru: 'Тёмная', en: 'Dark' },
  light: { ru: 'Светлая', en: 'Light' },
  today: { ru: 'Сегодня', en: 'Today' },
  yesterday: { ru: 'Вчера', en: 'Yesterday' },

  // Time
  days: { ru: 'дней', en: 'days' },
  hours: { ru: 'часов', en: 'hours' },
  minutes: { ru: 'минут', en: 'minutes' },
  ago: { ru: 'назад', en: 'ago' },

  // Misc
  by: { ru: 'от', en: 'by' },
  total: { ru: 'всего', en: 'total' },
  pending: { ru: 'Ожидание', en: 'Pending' },
  error: { ru: 'Ошибка', en: 'Error' },

  // Services Page
  servicesDescription: { ru: 'Каталог всех сервисов сервера', en: 'Server services catalog' },
  serverIp: { ru: 'IP сервера', en: 'Server IP' },
  searchServices: { ru: 'Поиск сервисов...', en: 'Search services...' },
  allServices: { ru: 'Все', en: 'All' },
  adminServices: { ru: 'Админ', en: 'Admin' },
  workServices: { ru: 'Работа', en: 'Work' },
  dataServices: { ru: 'Данные', en: 'Data' },
  aiStudio: { ru: 'AI Студия', en: 'AI Studio' },
  noServicesFound: { ru: 'Сервисы не найдены', en: 'No services found' },

  // Network Page
  networkDescription: { ru: 'WireGuard VPN, DNS и сетевые настройки', en: 'WireGuard VPN, DNS and network settings' },
  presets: { ru: 'Пресеты', en: 'Presets' },
  quickNetworkConfigs: { ru: 'Быстрые конфигурации сети', en: 'Quick network configurations' },
  configuration: { ru: 'Конфигурация', en: 'Configuration' },
  importConf: { ru: 'Импорт .conf', en: 'Import .conf' },
  networkInterfaces: { ru: 'Сетевые интерфейсы', en: 'Network Interfaces' },
  apply: { ru: 'Применить', en: 'Apply' },
  add: { ru: 'Добавить', en: 'Add' },
  newPreset: { ru: 'Новый пресет', en: 'New Preset' },
  title: { ru: 'Название', en: 'Title' },
  importWireGuard: { ru: 'Импорт WireGuard .conf файла', en: 'Import WireGuard .conf file' },
  import: { ru: 'Импортировать', en: 'Import' },
  uploadFile: { ru: 'Загрузить файл', en: 'Upload file' },
  addDns: { ru: 'Добавить DNS', en: 'Add DNS' },
  primaryDns: { ru: 'Основной DNS', en: 'Primary DNS' },
  secondaryDns: { ru: 'Резервный DNS', en: 'Secondary DNS' },

  // Service descriptions
  dockerManagement: { ru: 'Управление Docker контейнерами', en: 'Docker Container Management' },
  reverseProxy: { ru: 'Обратный прокси и SSL', en: 'Reverse Proxy & SSL Management' },
  systemMonitor: { ru: 'Мониторинг системы в реальном времени', en: 'Real-time System Monitor' },
  vpnServer: { ru: 'VPN Сервер', en: 'VPN Server' },
  dbManagement: { ru: 'Управление базами данных', en: 'Database Management' },
  uptimeMonitoring: { ru: 'Мониторинг аптайма', en: 'Uptime Monitoring' },
  logViewer: { ru: 'Просмотр логов контейнеров', en: 'Container Log Viewer' },
  workflowAutomation: { ru: 'Автоматизация рабочих процессов', en: 'Workflow Automation' },
  videoDownloader: { ru: 'Загрузчик видео', en: 'Video Downloader' },
  speechToText: { ru: 'Распознавание речи', en: 'Speech-to-Text Server' },
  headlessChrome: { ru: 'Headless браузер Chrome', en: 'Headless Chrome' },
  rssGenerator: { ru: 'Генератор RSS лент', en: 'RSS Feed Generator' },
  translationApi: { ru: 'API перевода', en: 'Translation API' },
  analytics: { ru: 'Аналитика и дашборды', en: 'Analytics & Dashboards' },
  cloudStorage: { ru: 'Облачное хранилище', en: 'Cloud Storage' },
  fileManager: { ru: 'Веб файловый менеджер', en: 'Web File Manager' },
  accountManager: { ru: 'Управление аккаунтами', en: 'Channel & Account Management' },
  asrApi: { ru: 'Распознавание речи (Whisper)', en: 'Speech Recognition (Whisper)' },
  ttsApi: { ru: 'Синтез речи', en: 'Text-to-Speech' },
  neuralTranslation: { ru: 'Нейронный машинный перевод', en: 'Neural Machine Translation' },
  videoDubbing: { ru: 'Конвейер дубляжа видео', en: 'Video Dubbing Pipeline' },
  videoInpainting: { ru: 'Удаление объектов (ProPainter/LaMa)', en: 'Object Removal (ProPainter/LaMa)' },

  // New Dashboard translations
  serverInfo: { ru: 'Информация о сервере', en: 'Server Info' },
  cpuModel: { ru: 'Процессор', en: 'CPU Model' },
  temperature: { ru: 'Температура', en: 'Temperature' },
  normal: { ru: 'Норма', en: 'Normal' },
  powerConsumption: { ru: 'Энергия', en: 'Power' },
  serverTime: { ru: 'Время сервера', en: 'Server Time' },
  performanceMonitor: { ru: 'Мониторинг производительности', en: 'Performance Monitor' },
  resourceMeters: { ru: 'Ресурсы системы', en: 'System Resources' },
  trafficStats: { ru: 'Статистика трафика', en: 'Traffic Stats' },
  totalRequests: { ru: 'Всего запросов', en: 'Total Requests' },
  requestsPerSec: { ru: 'Запросов/сек', en: 'Requests/sec' },
  bandwidth: { ru: 'Трафик', en: 'Bandwidth' },
  activeConnections: { ru: 'Активные соединения', en: 'Active Connections' },
  thisMonth: { ru: 'В этом месяце', en: 'This month' },
  now: { ru: 'Сейчас', en: 'Now' },
  processes: { ru: 'Процессы', en: 'Processes' },

  // Additional UI translations
  addPreset: { ru: 'Добавить пресет', en: 'Add Preset' },
  addHost: { ru: 'Добавить хост', en: 'Add Host' },
  addRule: { ru: 'Добавить правило', en: 'Add Rule' },
  addService: { ru: 'Добавить сервис', en: 'Add Service' },
  addBot: { ru: 'Добавить бота', en: 'Add Bot' },
  addVpnProfile: { ru: 'Добавить VPN профиль', en: 'Add VPN Profile' },
  addVpnLocation: { ru: 'Добавить VPN локацию', en: 'Add VPN Location' },
  addProfile: { ru: 'Добавить профиль', en: 'Add Profile' },
  addTelegramChannel: { ru: 'Добавить Telegram канал', en: 'Add Telegram Channel' },
  addUfwRule: { ru: 'Добавить правило UFW', en: 'Add UFW Rule' },
  editBot: { ru: 'Редактировать бота', en: 'Edit Bot' },

  // Dialog titles
  addDialogTitle: { ru: 'Добавить', en: 'Add' },

  // Security page
  firewallRules: { ru: 'Правила файрвола', en: 'Firewall Rules' },
  noRulesInDb: { ru: 'Нет правил в базе', en: 'No rules in database' },
  syncWithUfw: { ru: 'Синхронизировать с UFW', en: 'Sync with UFW' },

  // Additional common
  port: { ru: 'Порт', en: 'Port' },
  description: { ru: 'Описание', en: 'Description' },
  loading: { ru: 'Загрузка...', en: 'Loading...' },
  findingLocation: { ru: 'Определение локации...', en: 'Finding location...' },
  unknown: { ru: 'Неизвестно', en: 'Unknown' },
  health: { ru: 'Здоровье', en: 'Health' },
  noActivityRecorded: { ru: 'Нет записей активности', en: 'No activity recorded' },

  // Time ago
  secondsAgo: { ru: 'сек назад', en: 'sec ago' },
  minutesAgo: { ru: 'мин назад', en: 'min ago' },
  hoursAgo: { ru: 'ч назад', en: 'h ago' },
  daysAgo: { ru: 'дн назад', en: 'd ago' },

  // Security page
  securityDescription: { ru: 'Защита и мониторинг безопасности', en: 'Security monitoring and protection' },
  recentEvents: { ru: 'Последние события', en: 'Recent Events' },
  noSecurityEvents: { ru: 'Нет событий безопасности', en: 'No security events' },
  application: { ru: 'Приложение', en: 'Application' },
  customPort: { ru: 'Свой порт', en: 'Custom Port' },
  selectApp: { ru: 'Выберите приложение...', en: 'Select application...' },
  comment: { ru: 'Комментарий', en: 'Comment' },
  accessibleFromInternet: { ru: 'Доступен из Интернет (WAN)', en: 'Accessible from Internet (WAN)' },
  localNetworkOnly: { ru: 'Только локальная сеть (LAN)', en: 'Local network only (LAN)' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('ru');

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
