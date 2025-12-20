import { Activity, ArrowDown, ArrowUp, Wifi } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

const NetworkMonitor = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    download: 45.2,
    upload: 12.8,
    latency: 24,
    packets: 1524,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats({
        download: Math.random() * 80 + 20,
        upload: Math.random() * 30 + 5,
        latency: Math.floor(Math.random() * 50) + 10,
        packets: Math.floor(Math.random() * 3000) + 500,
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-card">
      <div className="flex items-center gap-2 mb-4">
        <Wifi className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">{t('networkMonitor')}</h3>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground">{t('live')}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-lg bg-success/10 border border-success/20">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowDown className="h-3.5 w-3.5 text-success" />
            <span className="text-[10px] text-muted-foreground">{t('download')}</span>
          </div>
          <p className="text-lg font-bold text-success">{stats.download.toFixed(1)}</p>
          <p className="text-[10px] text-muted-foreground">MB/s</p>
        </div>

        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground">{t('upload')}</span>
          </div>
          <p className="text-lg font-bold text-primary">{stats.upload.toFixed(1)}</p>
          <p className="text-[10px] text-muted-foreground">MB/s</p>
        </div>

        <div className="p-2.5 rounded-lg bg-warning/10 border border-warning/20">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="h-3.5 w-3.5 text-warning" />
            <span className="text-[10px] text-muted-foreground">{t('latency')}</span>
          </div>
          <p className="text-lg font-bold text-warning">{stats.latency}</p>
          <p className="text-[10px] text-muted-foreground">ms</p>
        </div>

        <div className="p-2.5 rounded-lg bg-muted border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <Wifi className="h-3.5 w-3.5 text-foreground" />
            <span className="text-[10px] text-muted-foreground">{t('packetsPerSec')}</span>
          </div>
          <p className="text-lg font-bold text-foreground">{stats.packets}</p>
          <p className="text-[10px] text-muted-foreground">{t('total')}</p>
        </div>
      </div>
    </div>
  );
};

export default NetworkMonitor;
