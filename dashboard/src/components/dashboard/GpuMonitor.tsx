import { Cpu, Thermometer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

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
// Mock data removed in favor of real API


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
  const [gpuData, setGpuData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGpu = async () => {
      try {
        // Try dedicated GPU plugin first
        const res = await fetch('/api/glances/gpu');
        const sensorsRes = await fetch('/api/glances/sensors');

        if (res.ok) {
          const data = await res.json();
          // Glances GPU plugin returns array
          if (Array.isArray(data) && data.length > 0) {
            const gpu = data[0]; // Take first GPU
            setGpuData({
              name: gpu.gpu_id || 'GPU 0',
              usage: gpu.proc || 0,
              temperature: gpu.temperature || 0,
              memory: {
                used: (gpu.mem || 0) / 1024 / 1024 / 1024, // Assuming bytes? Glances usually %, but let's check. 
                // Glances gpu plugin: mem is usually percent used. mem_used/mem_total might be available.
                // Fallback to percent logic if explicit bytes not clear.
                // actually 'mem' in glances gpu is percent.
                total: 0, // aggregate later
                percent: gpu.mem || 0
              },
              fanSpeed: gpu.fan_speed || 0,
              power: {
                current: 0, // often not available in standard export
                limit: 0
              }
            });
            setLoading(false);
            return;
          }
        }

        // Fallback: Check sensors for "Basic" GPU info (common for iGPUs or when nvidia-smi missing)
        if (sensorsRes.ok) {
          const sensors = await sensorsRes.json();
          const gpuSensor = sensors.find((s: any) => s.label.toLowerCase().includes('gpu') || s.label.toLowerCase().includes('edge'));
          if (gpuSensor) {
            setGpuData({
              name: 'Integrated/Discrete GPU',
              usage: 0, // No usage info from sensors usually
              temperature: gpuSensor.value,
              memory: { used: 0, total: 0, percent: 0 },
              fanSpeed: 0,
              power: { current: 0, limit: 0 }
            });
            setLoading(false);
            return;
          }
        }

        setGpuData(null); // No GPU found
      } catch (e) {
        console.error("GPU fetch error", e);
        setGpuData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGpu();
    const interval = setInterval(fetchGpu, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;
  if (!gpuData) return null; // Don't show if no GPU

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
            <span className="font-medium text-foreground">{gpuData.usage.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${getUsageColor(gpuData.usage)} transition-all duration-500`}
              style={{ width: `${Math.min(gpuData.usage, 100)}%` }}
            />
          </div>
        </div>

        {/* VRAM (Approx if only percent known) */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VRAM</span>
            <span className="font-medium text-foreground">
              {gpuData.memory.percent.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${Math.min(gpuData.memory.percent, 100)}%` }}
            />
          </div>
        </div>

        {/* Additional stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">{t('fanSpeed')}</p>
            <p className="text-lg font-bold text-foreground">{gpuData.fanSpeed}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GpuMonitor;
