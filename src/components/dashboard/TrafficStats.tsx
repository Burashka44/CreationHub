import { Globe, ArrowUpRight, ArrowDownRight, Activity, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

const TrafficStats = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalRequests: 1456789,
    requestsPerSec: 342,
    bandwidth: 2.4,
    activeConnections: 847,
    blockedThreats: 23,
    avgResponseTime: 45,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 100),
        requestsPerSec: Math.floor(Math.random() * 200) + 250,
        bandwidth: Math.random() * 2 + 1.5,
        activeConnections: Math.floor(Math.random() * 300) + 600,
        blockedThreats: prev.blockedThreats + (Math.random() > 0.9 ? 1 : 0),
        avgResponseTime: Math.floor(Math.random() * 30) + 35,
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const items = [
    {
      icon: Globe,
      label: t('totalRequests'),
      value: formatNumber(stats.totalRequests),
      change: '+12.5%',
      positive: true,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Activity,
      label: t('requestsPerSec'),
      value: stats.requestsPerSec.toString(),
      change: t('live'),
      positive: true,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: ArrowUpRight,
      label: t('bandwidth'),
      value: stats.bandwidth.toFixed(2) + ' TB',
      change: t('thisMonth'),
      positive: true,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Users,
      label: t('activeConnections'),
      value: stats.activeConnections.toString(),
      change: t('now'),
      positive: true,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <div className="dashboard-card">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">{t('trafficStats')}</h3>
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
            <div className="flex items-center gap-1 mt-1">
              {item.positive ? (
                <ArrowUpRight className="h-3 w-3 text-success" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-destructive" />
              )}
              <span className="text-xs text-muted-foreground">{item.change}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrafficStats;
