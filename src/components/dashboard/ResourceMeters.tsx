import { Cpu, MemoryStick, HardDrive, Thermometer, Gauge } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

interface ResourceMeterProps {
  icon: React.ElementType;
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  warning?: number;
  critical?: number;
}

const ResourceMeter = ({ icon: Icon, label, value, max, unit, color, warning = 70, critical = 90 }: ResourceMeterProps) => {
  const percent = (value / max) * 100;
  
  const getColor = () => {
    if (percent >= critical) return 'bg-destructive';
    if (percent >= warning) return 'bg-warning';
    return color;
  };

  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${color.replace('bg-', 'bg-').replace(/bg-(\w+)/, 'bg-$1/20')}`}>
            <Icon className={`h-4 w-4 ${color.replace('bg-', 'text-')}`} />
          </div>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="text-lg font-bold text-foreground">{percent.toFixed(1)}%</span>
      </div>
      
      <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} rounded-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>{value.toFixed(1)} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
};

const ResourceMeters = () => {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState({
    cpu: 45.3,
    memory: 82.4,
    disk: 67.2,
    cpuTemp: 52,
    gpuTemp: 61,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.random() * 40 + 30,
        memory: Math.random() * 25 + 60,
        disk: 67.2 + Math.random() * 2,
        cpuTemp: Math.random() * 15 + 45,
        gpuTemp: Math.random() * 20 + 50,
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-card">
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">{t('resourceMeters')}</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ResourceMeter
          icon={Cpu}
          label={t('cpuUsage')}
          value={metrics.cpu}
          max={100}
          unit="%"
          color="bg-primary"
        />
        <ResourceMeter
          icon={MemoryStick}
          label={t('memoryUsage')}
          value={metrics.memory}
          max={100}
          unit="%"
          warning={80}
          critical={95}
          color="bg-success"
        />
        <ResourceMeter
          icon={HardDrive}
          label={t('diskUsage')}
          value={metrics.disk}
          max={100}
          unit="%"
          color="bg-purple-500"
        />
        <ResourceMeter
          icon={Thermometer}
          label="CPU Temp"
          value={metrics.cpuTemp}
          max={100}
          unit="°C"
          warning={70}
          critical={85}
          color="bg-warning"
        />
        <ResourceMeter
          icon={Thermometer}
          label="GPU Temp"
          value={metrics.gpuTemp}
          max={100}
          unit="°C"
          warning={75}
          critical={90}
          color="bg-destructive"
        />
      </div>
    </div>
  );
};

export default ResourceMeters;
