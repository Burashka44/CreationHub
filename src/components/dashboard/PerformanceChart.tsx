import { Activity } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface DataPoint {
  time: string;
  cpu: number;
  memory: number;
  network: number;
}

const generateMockData = (): DataPoint[] => {
  const data: DataPoint[] = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    data.push({
      time: time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      cpu: Math.random() * 40 + 30 + Math.sin(i / 4) * 15,
      memory: Math.random() * 20 + 55 + Math.cos(i / 5) * 10,
      network: Math.random() * 50 + 20 + Math.sin(i / 3) * 20,
    });
  }
  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">{entry.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PerformanceChart = () => {
  const { t } = useLanguage();
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    setData(generateMockData());
    
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev.slice(1)];
        const now = new Date();
        newData.push({
          time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          cpu: Math.random() * 40 + 30,
          memory: Math.random() * 20 + 55,
          network: Math.random() * 50 + 20,
        });
        return newData;
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const currentValues = useMemo(() => {
    if (data.length === 0) return { cpu: 0, memory: 0, network: 0 };
    const last = data[data.length - 1];
    return last;
  }, [data]);

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t('performanceMonitor')}</h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">CPU</span>
            <span className="font-medium text-foreground">{currentValues.cpu.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-muted-foreground">RAM</span>
            <span className="font-medium text-foreground">{currentValues.memory.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-muted-foreground">Net</span>
            <span className="font-medium text-foreground">{currentValues.network.toFixed(0)}%</span>
          </div>
        </div>
      </div>
      
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="networkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(217, 33%, 25%)" 
              opacity={0.3}
            />
            <XAxis 
              dataKey="time" 
              stroke="hsl(215, 20%, 65%)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="hsl(215, 20%, 65%)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cpu"
              name="CPU"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2}
              fill="url(#cpuGradient)"
            />
            <Area
              type="monotone"
              dataKey="memory"
              name="RAM"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              fill="url(#memoryGradient)"
            />
            <Area
              type="monotone"
              dataKey="network"
              name="Network"
              stroke="hsl(38, 92%, 50%)"
              strokeWidth={2}
              fill="url(#networkGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;
