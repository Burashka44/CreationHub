import { Server, Clock, Cpu, HardDrive, Thermometer, Power } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

const ServerStats = () => {
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { 
      icon: Clock, 
      label: t('uptime'), 
      value: '47д 12ч', 
      subValue: '99.98%',
      color: 'text-success' 
    },
    { 
      icon: Cpu, 
      label: t('cpuModel'), 
      value: 'AMD EPYC 7742', 
      subValue: '64 ядра',
      color: 'text-primary' 
    },
    { 
      icon: HardDrive, 
      label: 'RAM', 
      value: '128 GB', 
      subValue: 'DDR4 ECC',
      color: 'text-purple-500' 
    },
    { 
      icon: Thermometer, 
      label: t('temperature'), 
      value: '42°C', 
      subValue: t('normal'),
      color: 'text-success' 
    },
    { 
      icon: Power, 
      label: t('powerConsumption'), 
      value: '340W', 
      subValue: '≈$45/мес',
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
          <span className="text-xs text-success font-medium">Online</span>
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
