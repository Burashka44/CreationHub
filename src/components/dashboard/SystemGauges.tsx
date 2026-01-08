import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import TemperatureGauge from './TemperatureGauge';
import { useLanguage } from '@/contexts/LanguageContext';

const SystemGauges = () => {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState({
    cpu: { usage: 0, temperature: 0 },
    gpu: { usage: 0, temperature: 0 },
    memory: { usage: 0 },
    processes: [] as { name: string, usage: number }[]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cpuRes, memRes, gpuRes, procRes, sensorsRes] = await Promise.all([
          fetch('/api/glances/cpu'),
          fetch('/api/glances/mem'),
          fetch('/api/glances/gpu'),
          fetch('/api/glances/processes'),
          fetch('/api/glances/sensors')
        ]);

        const cpu = await cpuRes.json();
        const mem = await memRes.json();
        const gpu = await gpuRes.json();
        let sensors = [];
        try { sensors = await sensorsRes.json(); } catch (e) { }

        let processes = [];
        try {
          processes = await procRes.json();
        } catch (e) {
          console.error("Failed to parse processes", e);
        }

        // Parse CPU Usage
        const cpuUsage = typeof cpu.total === 'number' ? cpu.total : parseFloat(cpu.total || 0);

        // Parse Memory
        const memUsage = typeof mem.percent === 'number' ? mem.percent : parseFloat(mem.percent || 0);

        // Parse CPU Temperature
        let cpuTemp = 0;
        if (Array.isArray(sensors)) {
          const tempSensor = sensors.find((s: any) =>
            s.label.includes('Package id 0') ||
            s.label.includes('Composite') ||
            s.label.includes('Core 0')
          );
          if (tempSensor) cpuTemp = tempSensor.value;
        }

        // Parse GPU (first GPU)
        let gpuUsage = 0;
        let gpuTemp = 0;
        if (Array.isArray(gpu) && gpu.length > 0) {
          gpuUsage = gpu[0].proc || 0;
          gpuTemp = gpu[0].temperature || 0;
        }

        // Parse Processes - Take top 5
        const topProcesses = Array.isArray(processes)
          ? processes
            .sort((a: any, b: any) => b.cpu_percent - a.cpu_percent)
            .slice(0, 5)
            .map((p: any) => ({
              name: p.name,
              usage: p.cpu_percent
            }))
          : [];

        setMetrics({
          cpu: { usage: cpuUsage, temperature: cpuTemp },
          gpu: { usage: gpuUsage, temperature: gpuTemp },
          memory: { usage: memUsage },
          processes: topProcesses
        });

      } catch (e) {
        // Silent fail for UI updates to avoid spamming console
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          {t('systemPerformance')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <TemperatureGauge
            value={metrics.cpu.usage}
            max={100}
            label={t('cpuUsage')}
            size={100}
          />
          <TemperatureGauge
            value={metrics.cpu.temperature}
            max={100}
            label="CPU Temp"
            unit="°C"
            size={100}
            warning={80}
            critical={95}
          />
          <TemperatureGauge
            value={metrics.gpu.usage}
            max={100}
            label={t('gpuUsage')}
            size={100}
          />
          <TemperatureGauge
            value={metrics.gpu.temperature}
            max={100}
            label="GPU Temp"
            unit="°C"
            size={100}
          />
          <TemperatureGauge
            value={metrics.memory.usage}
            max={100}
            label={t('memoryUsage')}
            size={100}
          />
        </div>

        <div className="mt-6 pt-4 border-t border-border/50">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Процессы (Top 5)</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {metrics.processes.map((process, idx) => (
              <div
                key={`${process.name}-${idx}`}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <span className="text-sm text-foreground truncate mr-2" title={process.name}>{process.name}</span>
                <span className={`text-sm font-medium ${process.usage < 5 ? 'text-emerald-400' :
                  process.usage < 15 ? 'text-yellow-400' : 'text-orange-400'
                  }`}>
                  {process.usage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemGauges;
