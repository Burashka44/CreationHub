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
  
  // Stats
  cpuUsage: { ru: 'Загрузка CPU', en: 'CPU Usage' },
  memoryUsage: { ru: 'Память', en: 'Memory Usage' },
  diskUsage: { ru: 'Диск', en: 'Disk Usage' },
  uptime: { ru: 'Аптайм', en: 'Uptime' },
  currentTime: { ru: 'Время', en: 'Current Time' },
  
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
  credentials: { ru: 'Учетные данные', en: 'Credentials' },
  connectGoogle: { ru: 'Войти через Google', en: 'Connect with Google' },
  apiKey: { ru: 'API Ключ', en: 'API Key' },
  
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
  
  // Days
  days: { ru: 'дней', en: 'days' },
  hours: { ru: 'часов', en: 'hours' },
  minutes: { ru: 'минут', en: 'minutes' },
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
