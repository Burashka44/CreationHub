import { Server, Clock, Cpu, HardDrive, Thermometer, Container } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

const ServerStats = () => {
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [statsData, setStatsData] = useState({
    cpu: 0,
    ram_used: 0,
    ram_total: 0,
    uptime: 'Loading...',
    cpu_temp: 'N/A',
    gpu_temp: 'N/A',
    osInfo: 'Linux Server'
  });

  useEffect(() => {
    const start = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(start);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [cpuRes, memRes, uptimeRes, sensorsRes, gpuRes, systemRes] = await Promise.allSettled([
          fetch('/api/glances/cpu'),
          fetch('/api/glances/mem'),
          fetch('/api/glances/uptime'),
          fetch('/api/glances/sensors'),
          fetch('/api/glances/gpu'),
          fetch('/api/system/os')
        ]);

        const newData = { ...statsData };

        if (cpuRes.status === 'fulfilled' && cpuRes.value.ok) {
          const cpu = await cpuRes.value.json();
          newData.cpu = cpu.total;
        }

        if (memRes.status === 'fulfilled' && memRes.value.ok) {
          const mem = await memRes.value.json();
          newData.ram_used = mem.percent;
          newData.ram_total = Math.round(mem.total / 1024 / 1024 / 1024);
        }

        // Glances returns uptime as "1 day, 2:32:58" or "2:32:58"
        if (uptimeRes.status === 'fulfilled' && uptimeRes.value.ok) {
          const uptimeStr = await uptimeRes.value.json();
          if (typeof uptimeStr === 'string') {
            const clean = uptimeStr.replace(/"/g, '').trim();
            // Check for "X day(s), HH:MM:SS" format
            const dayMatch = clean.match(/(\d+)\s+day/);
            const timeMatch = clean.match(/(\d+):(\d+):(\d+)/);

            let days = dayMatch ? parseInt(dayMatch[1], 10) : 0;
            let hours = timeMatch ? parseInt(timeMatch[1], 10) : 0;
            let minutes = timeMatch ? parseInt(timeMatch[2], 10) : 0;

            if (days > 0) {
              newData.uptime = `${days}d ${hours}h`;
            } else if (hours > 0) {
              newData.uptime = `${hours}h ${minutes}m`;
            } else {
              newData.uptime = `${minutes}m`;
            }
          }
        }

        let gpuTempFound = false;

        // 1. Try dedicated GPU plugin first
        if (gpuRes.status === 'fulfilled' && gpuRes.value.ok) {
          const gpuData = await gpuRes.value.json();
          if (Array.isArray(gpuData) && gpuData.length > 0) {
            const gpu = gpuData[0];
            // Support multiple formats (Glances changes sometimes)
            const temp = gpu.temperature || gpu.proc || gpu.fan;
            if (gpu.temperature) {
              newData.gpu_temp = `${Math.round(gpu.temperature)}°C`;
              gpuTempFound = true;
            }
          }
        }

        // Parse sensors for CPU and GPU temperatures
        if (sensorsRes.status === 'fulfilled' && sensorsRes.value.ok) {
          const sensors = await sensorsRes.value.json();
          if (Array.isArray(sensors) && sensors.length > 0) {
            // Find CPU temp sensor (Core, Package, CPU)
            const cpuSensor = sensors.find((s: any) =>
              s.label?.toLowerCase().includes('core') ||
              s.label?.toLowerCase().includes('package') ||
              s.label?.toLowerCase().includes('cpu')
            );
            if (cpuSensor) {
              newData.cpu_temp = `${Math.round(cpuSensor.value)}°C`;
            }

            // Find GPU temp sensor as fallback if not already found from GPU API
            if (!gpuTempFound) {
              const gpuSensor = sensors.find((s: any) =>
                s.label?.toLowerCase().includes('gpu') ||
                s.label?.toLowerCase().includes('nvidia') ||
                s.label?.toLowerCase().includes('radeon')
              );
              if (gpuSensor) {
                newData.gpu_temp = `${Math.round(gpuSensor.value)}°C`;
              }
            }
          }
        }

        // Get system info (OS) - from our system-api (real host OS)
        if (systemRes.status === 'fulfilled' && systemRes.value.ok) {
          const result = await systemRes.value.json();
          if (result.success && result.data) {
            newData.osInfo = result.data.pretty_name || result.data.name || 'Linux';
          }
        }

        setStatsData(newData);
      } catch (e) {
        console.error("Failed to fetch stats", e);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      icon: Clock,
      label: t('uptime'),
      value: statsData.uptime,
      subValue: statsData.osInfo,
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
      subValue: 'CPU',
      color: 'text-success'
    },
    {
      icon: Thermometer,
      label: 'GPU Temp',
      value: statsData.gpu_temp,
      subValue: 'NVIDIA',
      color: 'text-orange-500'
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
    <div className="h-full">
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
            className="p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-all"
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
