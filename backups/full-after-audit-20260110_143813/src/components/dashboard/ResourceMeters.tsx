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
        <span className="text-lg font-bold text-foreground">{value.toFixed(1)}{unit}</span>
      </div>

      <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percent, 100)}%` }}
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
    cpu: 0,
    memory: 0,
    disk: 0,
    cpuTemp: 0,
    gpuTemp: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [cpuRes, memRes, fsRes, sensorsRes] = await Promise.allSettled([
          fetch('/api/glances/cpu'),
          fetch('/api/glances/mem'),
          fetch('/api/glances/fs'),
          fetch('/api/glances/sensors'),
        ]);

        const newMetrics = { ...metrics };

        // CPU
        if (cpuRes.status === 'fulfilled' && cpuRes.value.ok) {
          const cpu = await cpuRes.value.json();
          newMetrics.cpu = cpu.total;
        }

        // Memory
        if (memRes.status === 'fulfilled' && memRes.value.ok) {
          const mem = await memRes.value.json();
          newMetrics.memory = mem.percent;
        }

        // Disk (Find root /)
        if (fsRes.status === 'fulfilled' && fsRes.value.ok) {
          const fs = await fsRes.value.json();
          const root = Array.isArray(fs) ? fs.find((f: any) => f.mnt_point === '/') : fs;
          newMetrics.disk = root ? root.percent : 0;
        }

        // Temperatures
        if (sensorsRes.status === 'fulfilled' && sensorsRes.value.ok) {
          const sensors = await sensorsRes.value.json();
          if (Array.isArray(sensors)) {
            // Try to find CPU/Package temp
            const cpuSensor = sensors.find((s: any) =>
              s.label.toLowerCase().includes('package') ||
              s.label.toLowerCase().includes('core') ||
              s.label.toLowerCase().includes('cpu')
            );
            newMetrics.cpuTemp = cpuSensor ? cpuSensor.value : (sensors[0]?.value || 0);

            // Try to find GPU temp (often labeled as edge, junction, or nvme/composite if iGPU)
            // Or look for dedicated gpu plugin. For now, check standard sensors.
            const gpuSensor = sensors.find((s: any) => s.label.toLowerCase().includes('gpu') || s.label.toLowerCase().includes('edge'));
            newMetrics.gpuTemp = gpuSensor ? gpuSensor.value : 0;
          }
        }

        setMetrics(newMetrics);
      } catch (error) {
        console.error("Failed to fetch resource metrics", error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
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
        {metrics.gpuTemp > 0 && (
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
        )}
      </div>
    </div>
  );
};

export default ResourceMeters;
