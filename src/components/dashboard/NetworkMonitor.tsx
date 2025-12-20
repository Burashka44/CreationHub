import { Activity, ArrowDown, ArrowUp, Wifi } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

const NetworkMonitor = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    download: 0,
    upload: 0,
    latency: 0,
    packets: 0,
  });

  useEffect(() => {
    const fetchNet = async () => {
      try {
        const res = await fetch('/api/glances/network');
        if (!res.ok) return;
        const data = await res.json();

        // Sum across all interfaces (eth0, wlan0, etc, excluding loopback usually has traffic but we can include it or filter)
        // Glances provides 'bytes_recv_rate_per_sec'
        let rx = 0;
        let tx = 0;

        if (Array.isArray(data)) {
          data.forEach((iface: any) => {
            // Optional: Filter 'lo' if we only want external traffic
            if (iface.interface_name === 'lo') return;

            rx += iface.bytes_recv_rate_per_sec || 0;
            tx += iface.bytes_sent_rate_per_sec || 0;
          });
        }

        setStats({
          download: rx / 1024 / 1024, // MB/s
          upload: tx / 1024 / 1024,   // MB/s
          latency: 1, // Placeholder as Glances doesn't provide ping latency
          packets: 0, // Not strictly tracking packets per sec in this view, or we could sum packets rate if available
        });
      } catch (e) {
        console.error("Net fetch error", e);
      }
    };

    fetchNet();
    const interval = setInterval(fetchNet, 2000);
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
          <p className="text-lg font-bold text-success">{stats.download.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">MB/s</p>
        </div>

        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground">{t('upload')}</span>
          </div>
          <p className="text-lg font-bold text-primary">{stats.upload.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">MB/s</p>
        </div>

        <div className="p-2.5 rounded-lg bg-warning/10 border border-warning/20">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="h-3.5 w-3.5 text-warning" />
            <span className="text-[10px] text-muted-foreground">{t('latency')}</span>
          </div>
          <p className="text-lg font-bold text-warning">{"<1"}</p>
          <p className="text-[10px] text-muted-foreground">ms (Local)</p>
        </div>

        <div className="p-2.5 rounded-lg bg-muted border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <Wifi className="h-3.5 w-3.5 text-foreground" />
            <span className="text-[10px] text-muted-foreground">Network</span>
          </div>
          <p className="text-lg font-bold text-foreground">Active</p>
          <p className="text-[10px] text-muted-foreground">Status</p>
        </div>
      </div>
    </div>
  );
};

export default NetworkMonitor;
