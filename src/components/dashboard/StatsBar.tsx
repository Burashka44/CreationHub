import React from 'react';
import { Clock, HardDrive, MapPin, Wifi } from 'lucide-react';
import Gauge from './Gauge';
import { useLanguage } from '@/contexts/LanguageContext';

interface StatsBarProps {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: { days: number; hours: number };
  ipLocation: { city: string; country: string; ip: string };
}

const StatsBar = ({ cpuUsage, memoryUsage, diskUsage, uptime, ipLocation }: StatsBarProps) => {
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const countryFlags: Record<string, string> = {
    NL: '🇳🇱', US: '🇺🇸', DE: '🇩🇪', GB: '🇬🇧', FR: '🇫🇷', 
    JP: '🇯🇵', RU: '🇷🇺', CA: '🇨🇦', AU: '🇦🇺', CH: '🇨🇭',
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <Gauge value={cpuUsage} label={t('cpuUsage')} size={80} strokeWidth={6} />
      <Gauge value={memoryUsage} label={t('memoryUsage')} size={80} strokeWidth={6} />
      
      {/* Disk Usage */}
      <div className="stat-card">
        <HardDrive className="h-6 w-6 text-primary mb-2" />
        <div className="w-full bg-muted rounded-full h-2 mb-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${diskUsage}%` }}
          />
        </div>
        <span className="text-lg font-bold text-foreground">{diskUsage}%</span>
        <span className="text-xs text-muted-foreground">{t('diskUsage')}</span>
      </div>

      {/* Uptime */}
      <div className="stat-card">
        <Clock className="h-6 w-6 text-success mb-2" />
        <span className="text-lg font-bold text-foreground">
          {uptime.days}d {uptime.hours}h
        </span>
        <span className="text-xs text-muted-foreground">{t('uptime')}</span>
      </div>

      {/* IP Location */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-5 w-5 text-warning" />
          <span className="text-2xl">{countryFlags[ipLocation.country] || '🌍'}</span>
        </div>
        <span className="text-sm font-semibold text-foreground">{ipLocation.city}</span>
        <span className="text-xs text-muted-foreground font-mono">{ipLocation.ip}</span>
      </div>

      {/* Current Time */}
      <div className="stat-card">
        <Wifi className="h-6 w-6 text-primary mb-2" />
        <span className="text-lg font-bold text-foreground font-mono">
          {currentTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <span className="text-xs text-muted-foreground">
          {currentTime.toLocaleDateString('ru-RU')}
        </span>
      </div>
    </div>
  );
};

export default StatsBar;
