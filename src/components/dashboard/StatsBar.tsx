import React from 'react';
import { Clock, HardDrive, MapPin, Wifi } from 'lucide-react';
import Gauge from './Gauge';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const StatsBar = () => {
  const { t } = useLanguage();
  const [metrics, setMetrics] = React.useState({ cpu: 0, memory: 0, disk: 0 });
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [osInfo, setOsInfo] = React.useState<any>(null);
  const [uptimeStr, setUptimeStr] = React.useState('Loading...');

  // Real stats 
  const { cpu: cpuUsage, memory: memoryUsage, disk: diskUsage } = metrics;
  const ipLocation = { city: 'Unknown', country: 'XX', ip: 'Unknown' };

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await supabase
          .from('system_metrics')
          .select('*')
          .order('recorded_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setMetrics({
            cpu: Math.round(data.cpu_percent || 0),
            memory: Math.round(data.memory_percent || 0),
            disk: Math.round(data.disk_percent || 0)
          });
        }
      } catch (e) {
        console.error('Metrics fetch error:', e);
      }
    };

    fetchMetrics();
    const metricInterval = setInterval(fetchMetrics, 5000);

    const fetchData = async () => {
      try {
        const [osRes, upRes] = await Promise.all([
          fetch('/api/system/os'),
          fetch('/api/system/uptime')
        ]);

        if (osRes.ok) {
          const data = await osRes.json();
          setOsInfo(data.data);
        }

        if (upRes.ok) {
          const data = await upRes.json();
          setUptimeStr(data.pretty);
        }
      } catch (e) {
        console.error('Stats fetch error:', e);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    return () => {
      clearInterval(interval);
      clearInterval(metricInterval);
    };
  }, []);

  const countryFlags: Record<string, string> = {
    NL: '🇳🇱', US: '🇺🇸', DE: '🇩🇪', GB: '🇬🇧', FR: '🇫🇷',
    JP: '🇯🇵', RU: '🇷🇺', CA: '🇨🇦', AU: '🇦🇺', CH: '🇨🇭',
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
          {uptimeStr}
        </span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {osInfo ? (
            <>
              <span className="font-semibold">{osInfo.name}</span>
              <span className="opacity-75">{osInfo.version}</span>
            </>
          ) : (
            t('uptime')
          )}
        </div>
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
