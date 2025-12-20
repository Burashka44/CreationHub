import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import TemperatureGauge from './TemperatureGauge';
import { useLanguage } from '@/contexts/LanguageContext';

// Mock data - in production this would come from system API
const systemMetrics = {
  cpu: {
    usage: 45.3,
    temperature: 67,
  },
  gpu: {
    usage: 72.8,
    temperature: 74,
  },
  memory: {
    usage: 62.4,
  },
  processes: [
    { name: 'Nginx', usage: 2.1 },
    { name: 'PostgreSQL', usage: 8.4 },
    { name: 'Docker', usage: 15.2 },
    { name: 'Node.js', usage: 5.7 },
    { name: 'Redis', usage: 1.2 },
    { name: 'FFmpeg', usage: 12.3 },
  ],
};

const SystemGauges = () => {
  const { t } = useLanguage();

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          {t('systemPerformance')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {/* CPU Usage */}
          <TemperatureGauge
            value={systemMetrics.cpu.usage}
            max={100}
            label={t('cpuUsage')}
            size={100}
          />
          
          {/* CPU Temperature */}
          <TemperatureGauge
            value={systemMetrics.cpu.temperature}
            max={100}
            label="CPU Temp"
            unit="°C"
            size={100}
          />
          
          {/* GPU Usage */}
          <TemperatureGauge
            value={systemMetrics.gpu.usage}
            max={100}
            label={t('gpuUsage')}
            size={100}
          />
          
          {/* GPU Temperature */}
          <TemperatureGauge
            value={systemMetrics.gpu.temperature}
            max={100}
            label="GPU Temp"
            unit="°C"
            size={100}
          />
          
          {/* Memory Usage */}
          <TemperatureGauge
            value={systemMetrics.memory.usage}
            max={100}
            label={t('memoryUsage')}
            size={100}
          />
        </div>

        {/* Process list */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Процессы</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {systemMetrics.processes.map((process) => (
              <div 
                key={process.name} 
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <span className="text-sm text-foreground">{process.name}</span>
                <span className={`text-sm font-medium ${
                  process.usage < 5 ? 'text-emerald-400' : 
                  process.usage < 15 ? 'text-yellow-400' : 'text-orange-400'
                }`}>
                  {process.usage}%
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
