import { Cpu, Thermometer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';

interface GpuStats {
  name: string;
  usage: number;
  temperature: number;
  memory: {
    used: number;
    total: number;
  };
  fanSpeed: number;
  power: {
    current: number;
    limit: number;
  };
}

// Mock GPU data - in real app this would come from system API
const gpuData: GpuStats = {
  name: 'NVIDIA RTX 4090',
  usage: 67,
  temperature: 72,
  memory: {
    used: 18.2,
    total: 24,
  },
  fanSpeed: 65,
  power: {
    current: 320,
    limit: 450,
  },
};

const getTemperatureColor = (temp: number) => {
  if (temp < 50) return 'text-emerald-400';
  if (temp < 70) return 'text-yellow-400';
  if (temp < 85) return 'text-orange-400';
  return 'text-red-400';
};

const getUsageColor = (usage: number) => {
  if (usage < 50) return 'bg-emerald-500';
  if (usage < 75) return 'bg-yellow-500';
  if (usage < 90) return 'bg-orange-500';
  return 'bg-red-500';
};

const GpuMonitor = () => {
  const { t } = useLanguage();
  const memoryUsage = (gpuData.memory.used / gpuData.memory.total) * 100;
  const powerUsage = (gpuData.power.current / gpuData.power.limit) * 100;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          {t('gpuMonitor')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{gpuData.name}</span>
          <div className="flex items-center gap-2">
            <Thermometer className={`h-4 w-4 ${getTemperatureColor(gpuData.temperature)}`} />
            <span className={`text-lg font-bold ${getTemperatureColor(gpuData.temperature)}`}>
              {gpuData.temperature}°C
            </span>
          </div>
        </div>

        {/* GPU Usage */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('gpuUsage')}</span>
            <span className="font-medium text-foreground">{gpuData.usage}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full ${getUsageColor(gpuData.usage)} transition-all duration-500`}
              style={{ width: `${gpuData.usage}%` }}
            />
          </div>
        </div>

        {/* VRAM */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VRAM</span>
            <span className="font-medium text-foreground">
              {gpuData.memory.used.toFixed(1)} / {gpuData.memory.total} GB
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${memoryUsage}%` }}
            />
          </div>
        </div>

        {/* Additional stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">{t('fanSpeed')}</p>
            <p className="text-lg font-bold text-foreground">{gpuData.fanSpeed}%</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">{t('power')}</p>
            <p className="text-lg font-bold text-foreground">
              {gpuData.power.current}W
              <span className="text-xs font-normal text-muted-foreground ml-1">
                / {gpuData.power.limit}W
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GpuMonitor;
