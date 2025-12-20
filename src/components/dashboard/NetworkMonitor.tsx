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

  // Simulate real-time updates
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
        <h3 className="font-semibold text-foreground">Network Monitor</h3>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Download */}
        <div className="p-3 rounded-lg bg-success/10 border border-success/20">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDown className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">Download</span>
          </div>
          <p className="text-2xl font-bold text-success">{stats.download.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">MB/s</p>
        </div>

        {/* Upload */}
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUp className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Upload</span>
          </div>
          <p className="text-2xl font-bold text-primary">{stats.upload.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">MB/s</p>
        </div>

        {/* Latency */}
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-warning" />
            <span className="text-xs text-muted-foreground">Latency</span>
          </div>
          <p className="text-2xl font-bold text-warning">{stats.latency}</p>
          <p className="text-xs text-muted-foreground">ms</p>
        </div>

        {/* Packets */}
        <div className="p-3 rounded-lg bg-muted border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="h-4 w-4 text-foreground" />
            <span className="text-xs text-muted-foreground">Packets/s</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.packets}</p>
          <p className="text-xs text-muted-foreground">total</p>
        </div>
      </div>
    </div>
  );
};

export default NetworkMonitor;
