import { Activity, Clock, History } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  timestamp?: string;
}

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

type TimePeriod = 'live' | '1h' | '6h' | '24h' | '7d';

const PerformanceChart = () => {
  const { t } = useLanguage();
  const [data, setData] = useState<DataPoint[]>([]);
  const [period, setPeriod] = useState<TimePeriod>('live');
  const [isLoading, setIsLoading] = useState(false);

  // Load historical data from Supabase
  const loadHistoricalData = async (selectedPeriod: TimePeriod) => {
    if (selectedPeriod === 'live') return;

    setIsLoading(true);
    try {
      const now = new Date();
      let fromDate: Date;
      let limit = 100;

      switch (selectedPeriod) {
        case '1h':
          fromDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '6h':
          fromDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          break;
        case '24h':
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          limit = 200;
          break;
        case '7d':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          limit = 500;
          break;
        default:
          fromDate = new Date(now.getTime() - 60 * 60 * 1000);
      }

      const { data: metrics, error } = await supabase
        .from('system_metrics')
        .select('*')
        .gte('timestamp', fromDate.toISOString())
        .order('timestamp', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error loading historical data:', error);
        return;
      }

      if (metrics && metrics.length > 0) {
        const mappedData = metrics.map((m: any) => {
          const netMb = ((m.net_rx_bytes || 0) + (m.net_tx_bytes || 0)) / 1024 / 1024;
          const date = new Date(m.timestamp);

          let timeFormat: string;
          if (selectedPeriod === '7d') {
            timeFormat = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
          } else if (selectedPeriod === '24h' || selectedPeriod === '6h') {
            timeFormat = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          } else {
            timeFormat = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          }

          return {
            time: timeFormat,
            cpu: Number(m.cpu_percent) || 0,
            memory: Number(m.ram_percent) || 0,
            network: Math.min(netMb * 10, 100),
            timestamp: m.timestamp,
          };
        });
        setData(mappedData);
      } else {
        setData([]);
      }
    } catch (e) {
      console.error('Error loading history:', e);
    }
    setIsLoading(false);
  };

  // Live data fetching
  useEffect(() => {
    if (period !== 'live') {
      loadHistoricalData(period);
      return;
    }

    // Initialize with empty data for live mode
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

        // Calculate Network
        let netSpeed = 0;
        if (Array.isArray(net)) {
          net.forEach((iface: any) => {
            if (iface.interface_name === 'lo') return;
            netSpeed += (iface.bytes_recv_rate_per_sec || 0) + (iface.bytes_sent_rate_per_sec || 0);
          });
        }
        const netMb = netSpeed / 1024 / 1024;
        const netScaled = Math.min(netMb * 10, 100);

        const cpuVal = typeof cpu.total === 'number' ? cpu.total : parseFloat(cpu.total || 0);
        const memVal = typeof mem.percent === 'number' ? mem.percent : parseFloat(mem.percent || 0);

        // Save to database for history (direct insert, not edge function)
        supabase.from('system_metrics').insert({
          cpu_percent: cpuVal,
          ram_percent: memVal,
          net_rx_total: Math.round(netSpeed / 2),
          net_tx_total: Math.round(netSpeed / 2),
        }).then(({ error }) => {
          if (error) console.log('Metrics save error:', error);
        });

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

    fetchData();
    const interval = setInterval(fetchData, 60000); // Save every minute instead of 2 seconds

    // Fast UI updates
    const uiInterval = setInterval(async () => {
      try {
        const [cpuRes, memRes, netRes] = await Promise.all([
          fetch('/api/glances/cpu'),
          fetch('/api/glances/mem'),
          fetch('/api/glances/network')
        ]);

        const cpu = await cpuRes.json();
        const mem = await memRes.json();
        const net = await netRes.json();

        let netSpeed = 0;
        if (Array.isArray(net)) {
          net.forEach((iface: any) => {
            if (iface.interface_name === 'lo') return;
            netSpeed += (iface.bytes_recv_rate_per_sec || 0) + (iface.bytes_sent_rate_per_sec || 0);
          });
        }
        const netMb = netSpeed / 1024 / 1024;
        const netScaled = Math.min(netMb * 10, 100);

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
        // Silent fail for UI updates
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(uiInterval);
    };
  }, [period]);

  const currentValues = useMemo(() => {
    if (data.length === 0) return { cpu: 0, memory: 0, network: 0 };
    return data[data.length - 1];
  }, [data]);

  const periodLabels: Record<TimePeriod, string> = {
    live: 'Сейчас',
    '1h': '1 час',
    '6h': '6 часов',
    '24h': '24 часа',
    '7d': '7 дней',
  };

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t('performanceMonitor')}</h3>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(v: TimePeriod) => setPeriod(v)}>
            <SelectTrigger className="w-[130px] h-8">
              <History className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(periodLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <span className="text-muted-foreground">Net</span>
              <span className="font-medium text-foreground">{currentValues.network.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {!isLoading && data.length === 0 && period !== 'live' && (
        <div className="flex items-center justify-center h-[200px] text-muted-foreground">
          <Clock className="h-5 w-5 mr-2" />
          Нет данных за выбранный период
        </div>
      )}

      {!isLoading && data.length > 0 && (
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
                isAnimationActive={false}
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
                name="Network"
                stroke="hsl(38, 92%, 50%)"
                strokeWidth={2}
                fill="url(#networkGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PerformanceChart;