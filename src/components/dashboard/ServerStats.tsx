import { Server, Clock, Cpu, HardDrive, Thermometer, Power } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

const ServerStats = () => {
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  // Default values while loading
  const [statsData, setStatsData] = useState({
    cpu: 0,
    ram_used: 0,
    ram_total: 0,
    uptime: 'Loading...',
    cpu_temp: 'N/A'
  });

  useEffect(() => {
    const start = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(start);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch in parallel
        const [cpuRes, memRes, uptimeRes, sensorsRes] = await Promise.allSettled([
          fetch('/api/glances/cpu'),
          fetch('/api/glances/mem'),
          fetch('/api/glances/uptime'),
          fetch('/api/glances/sensors')
        ]);

        const newData = { ...statsData };

        if (cpuRes.status === 'fulfilled' && cpuRes.value.ok) {
          const cpu = await cpuRes.value.json();
          newData.cpu = cpu.total;
        }

        if (memRes.status === 'fulfilled' && memRes.value.ok) {
          const mem = await memRes.value.json();
          newData.ram_used = mem.percent;
          newData.ram_total = Math.round(mem.total / 1024 / 1024 / 1024); // GB
        }

        if (uptimeRes.status === 'fulfilled' && uptimeRes.value.json) {
          const uptime = await uptimeRes.value.json();
          // Glances returns seconds string or object
          const seconds = typeof uptime === 'string' ? parseFloat(uptime) : parseFloat(uptime.seconds);
          if (!isNaN(seconds)) {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            newData.uptime = `${days}d ${hours}h`;
          }
        }

        // Simple temp check (first sensor)
        if (sensorsRes.status === 'fulfilled' && sensorsRes.value.ok) {
          const sensors = await sensorsRes.value.json();
          if (Array.isArray(sensors) && sensors.length > 0) {
            newData.cpu_temp = `${Math.round(sensors[0].value)}°C`;
          }
        }

        setStatsData(newData);
      } catch (e) {
        console.error("Failed to fetch stats", e);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Update every 5s
    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      icon: Clock,
      label: t('uptime'),
      value: statsData.uptime,
      subValue: 'Linux 6.8', // Kernel
      color: 'text-success'
    },
    {
      icon: Cpu,
      label: t('cpuModel'),
      value: `${(statsData.cpu || 0).toFixed(1)}%`,
      subValue: 'Load',
      color: 'text-primary'
    },
    {
      icon: HardDrive,
      label: 'RAM',
      value: `${statsData.ram_total} GB`,
      subValue: `${statsData.ram_used.toFixed(1)}% used`,
      color: 'text-purple-500'
    },
    {
      icon: Thermometer,
      label: t('temperature'),
      value: statsData.cpu_temp,
      subValue: 'System',
      color: 'text-success'
    },
    {
      icon: Power,
      label: t('powerConsumption'),
      value: 'N/A', // Glances usually doesn't give power unless IPMI
      subValue: 'Est.',
      color: 'text-warning'
    },
    {
      icon: Server,
      label: t('serverTime'),
      value: currentTime.toLocaleTimeString('ru-RU'),
      subValue: currentTime.toLocaleDateString('ru-RU'),
      color: 'text-foreground'
    },
  ];

  return (
    <div className="dashboard-card">
      <div className="flex items-center gap-2 mb-4">
        <Server className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">{t('serverInfo')}</h3>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-success font-medium">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.subValue}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServerStats;
