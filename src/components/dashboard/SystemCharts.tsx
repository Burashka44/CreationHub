import React from 'react';
import { 
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

const generateMockData = () => {
  const data = [];
  for (let i = 0; i < 24; i++) {
    data.push({
      time: `${i}:00`,
      cpu: Math.floor(Math.random() * 40) + 10,
      memory: Math.floor(Math.random() * 30) + 40,
    });
  }
  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm text-foreground font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const SystemCharts = () => {
  const { t } = useLanguage();
  const data = React.useMemo(() => generateMockData(), []);

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">System Performance (24h)</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">CPU</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-muted-foreground">Memory</span>
          </div>
        </div>
      </div>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="cpu" 
              stroke="hsl(217, 91%, 60%)" 
              fillOpacity={1}
              fill="url(#colorCpu)"
              name="CPU"
            />
            <Area 
              type="monotone" 
              dataKey="memory" 
              stroke="hsl(142, 76%, 36%)" 
              fillOpacity={1}
              fill="url(#colorMemory)"
              name="Memory"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SystemCharts;
