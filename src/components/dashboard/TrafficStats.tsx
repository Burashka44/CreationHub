import { Globe, ArrowUpRight, ArrowDownRight, Activity, Zap, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect, useRef } from 'react';

const TrafficStats = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    currentDownload: 0,
    currentUpload: 0,
    totalReceived: 0,
    totalSent: 0,
    peakSpeed: 0,
  });
  const totalAccumulated = useRef({ rx: 0, tx: 0, samples: 0 });

  useEffect(() => {
    let lastTime = Date.now();
    let lastRx = 0;
    let lastTx = 0;

    const fetchTraffic = async () => {
      try {
        const res = await fetch('/api/system/network');
        if (!res.ok) return;
        const json = await res.json();
        const data = json.data;

        let rx = 0;
        let tx = 0;

        if (Array.isArray(data)) {
          data.forEach((iface: any) => {
            if (iface.name === 'lo') return; // Skip loopback
            rx += iface.rx_bytes || 0;
            tx += iface.tx_bytes || 0;
          });
        }

        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000; // in seconds

        // Only calc rate if we have a previous sample and time has passed
        if (lastRx > 0 && timeDiff > 0) {
          const rxRate = Math.max(0, (rx - lastRx) / timeDiff);
          const txRate = Math.max(0, (tx - lastTx) / timeDiff);
          const currentSpeed = rxRate + txRate;

          setStats(prev => ({
            currentDownload: rxRate / 1024 / 1024, // MB/s
            currentUpload: txRate / 1024 / 1024,
            totalReceived: rx / 1024 / 1024 / 1024, // GB total
            totalSent: tx / 1024 / 1024 / 1024,
            peakSpeed: Math.max(prev.peakSpeed, currentSpeed / 1024 / 1024),
          }));
        } else {
          // First run, just set totals
          setStats(prev => ({
            ...prev,
            totalReceived: rx / 1024 / 1024 / 1024,
            totalSent: tx / 1024 / 1024 / 1024,
          }));
        }

        lastRx = rx;
        lastTx = tx;
        lastTime = now;

      } catch (e) {
        console.error("Traffic fetch error", e);
      }
    };

    fetchTraffic();
    const interval = setInterval(fetchTraffic, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatSize = (gb: number) => {
    if (gb >= 1000) return (gb / 1000).toFixed(2) + ' TB';
    if (gb >= 1) return gb.toFixed(2) + ' GB';
    return (gb * 1024).toFixed(0) + ' MB';
  };

  const items = [
    {
      icon: ArrowDownRight,
      label: "Скачивание",
      value: stats.currentDownload.toFixed(2) + ' MB/s',
      sub: formatSize(stats.totalReceived) + ' всего',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: ArrowUpRight,
      label: "Отправка",
      value: stats.currentUpload.toFixed(2) + ' MB/s',
      sub: formatSize(stats.totalSent) + ' всего',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: TrendingUp,
      label: "Пик скорости",
      value: stats.peakSpeed.toFixed(2) + ' MB/s',
      sub: 'За сессию',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Activity,
      label: "Общий трафик",
      value: formatSize(stats.totalReceived + stats.totalSent),
      sub: 'С момента загрузки',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <div className="dashboard-card">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">{t('trafficStats')}</h3>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl ${item.bgColor} border border-border/30 hover:scale-[1.02] transition-all`}
          >
            <div className="flex items-center gap-2 mb-2">
              <item.icon className={`h-4 w-4 ${item.color}`} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrafficStats;
