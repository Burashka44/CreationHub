import React from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

const generateMockData = () => {
  const data = [];
  for (let i = 0; i < 24; i++) {
    data.push({
      time: `${i}:00`,
      cpu: Math.floor(Math.random() * 40) + 10,
      memory: Math.floor(Math.random() * 30) + 40,
      network: Math.floor(Math.random() * 100) + 50,
    });
  }
  return data;
};

const SystemCharts = () => {
  const { t } = useLanguage();
  const data = React.useMemo(() => generateMockData(), []);

  return (
    <div className="dashboard-card">
      <h3 className="font-semibold text-foreground mb-4">System Performance (24h)</h3>
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
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="cpu" 
              stroke="hsl(217, 91%, 60%)" 
              fillOpacity={1}
              fill="url(#colorCpu)"
              name="CPU %"
            />
            <Area 
              type="monotone" 
              dataKey="memory" 
              stroke="hsl(142, 76%, 36%)" 
              fillOpacity={1}
              fill="url(#colorMemory)"
              name="Memory %"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SystemCharts;
