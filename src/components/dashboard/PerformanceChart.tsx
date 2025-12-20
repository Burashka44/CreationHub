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
    // Fill initial empty data or fetch history
    const fetchHistory = async () => {
      try {
        // Fetch last 60 records from DB
        const res = await fetch('/api/v1/rest/v1/system_metrics?select=timestamp,cpu_percent,ram_percent,net_rx_total,net_tx_total&order=timestamp.desc&limit=60', {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || 'my-secret-anon-key',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'my-secret-anon-key'}`
          }
        });

        if (res.ok) {
          const history = await res.json();
          if (Array.isArray(history) && history.length > 0) {
            const mappedHistory = history.reverse().map((h: any) => {
              const netMb = (h.net_rx_total + h.net_tx_total) / 1024 / 1024;
              return {
                time: new Date(h.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
                cpu: h.cpu_percent,
                memory: h.ram_percent,
                network: Math.min(netMb * 10, 100) // Same scaling as live
              };
            });
            setData(mappedHistory);
            return;
          }
        }
      } catch (e) {
        console.error("History fetch failed", e);
      }

      // Fallback to empty if DB fails
      const initialData: DataPoint[] = [];
      const now = new Date();
      for (let i = 19; i >= 0; i--) {
        initialData.push({
          time: new Date(now.getTime() - i * 2000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: 0,
          memory: 0,
          network: 0
        });
      }
      setData(initialData);
    };

    fetchHistory();

    const fetchData = async () => {
      try {
        const [cpuRes, memRes, netRes] = await Promise.all([
          fetch('/api/glances/cpu'),
          fetch('/api/glances/mem'),
          fetch('/api/glances/network')
        ]);

        const cpu = await cpuRes.json();
        const mem = await memRes.json();
        const net = await netRes.json();

        // Calculate Network (MB/s) -> Scale 0-100 (Where 10MB/s = 100% roughly for visibility)
        let netSpeed = 0;
        if (Array.isArray(net)) {
          net.forEach((iface: any) => {
            if (iface.interface_name === 'lo') return;
            netSpeed += (iface.bytes_recv_rate_per_sec || 0) + (iface.bytes_sent_rate_per_sec || 0);
          });
        }
        const netMb = netSpeed / 1024 / 1024;
        // Scale: 10 MB/s = 100 on chart.
        const netScaled = Math.min(netMb * 10, 100);

        // Parse CPU/Mem (handle v4/v3 formats just in case)
        const cpuVal = typeof cpu.total === 'number' ? cpu.total : parseFloat(cpu.total || 0);
        const memVal = typeof mem.percent === 'number' ? mem.percent : parseFloat(mem.percent || 0);

        setData(prev => {
          const newData = [...prev.slice(1)];
          const now = new Date();
          newData.push({
            time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            cpu: cpuVal,
            memory: memVal,
            network: netScaled,
          });
          return newData;
        });

      } catch (e) {
        console.error("Perf chart error", e);
      }
    };

    // Initial fetch
    fetchData();

    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const currentValues = useMemo(() => {
    if (data.length === 0) return { cpu: 0, memory: 0, network: 0 };
    return data[data.length - 1];
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
            <span className="font-medium text-foreground">{currentValues.cpu.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-muted-foreground">RAM</span>
            <span className="font-medium text-foreground">{currentValues.memory.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-muted-foreground">Net (Sc)</span>
            {/* Show actual value in tooltip, here show scaled % or just text? */}
            {/* Let's show scaled % for consistency with graph */}
            <span className="font-medium text-foreground">{currentValues.network.toFixed(1)}%</span>
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
              isAnimationActive={false} // Disable animation for smooth realtime updates
            />
            <Area
              type="monotone"
              dataKey="memory"
              name="RAM"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              fill="url(#memoryGradient)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="network"
              name="Network (Sc)"
              stroke="hsl(38, 92%, 50%)"
              strokeWidth={2}
              fill="url(#networkGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;
