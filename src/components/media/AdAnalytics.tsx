import { useState, useEffect, useMemo } from 'react';
import { 
  MousePointer, TrendingUp, Users, Target, Calendar, Copy, Check,
  BarChart3, ExternalLink, Clock, Percent, DollarSign, Eye, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TelegramAd {
  id: string;
  name: string;
  tracking_code: string | null;
  clicks: number;
  impressions: number;
  budget: number;
  spent: number;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  ad_link: string | null;
  channel_id: string | null;
}

interface AdClick {
  id: string;
  ad_id: string | null;
  clicked_at: string;
  user_agent: string | null;
  referrer: string | null;
  ip_hash: string | null;
}

interface ChannelInfo {
  id: string;
  name: string;
  subscribers: number;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatCurrency = (num: number) => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(num);
};

const AdAnalytics = () => {
  const { toast } = useToast();
  const [ads, setAds] = useState<TelegramAd[]>([]);
  const [clicks, setClicks] = useState<AdClick[]>([]);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedAd, setSelectedAd] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    setIsLoading(true);
    
    const periodDays = parseInt(selectedPeriod);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const [adsResult, clicksResult, channelsResult] = await Promise.all([
      supabase.from('telegram_ads').select('*').order('created_at', { ascending: false }),
      supabase.from('ad_clicks').select('*').gte('clicked_at', startDate.toISOString()).order('clicked_at', { ascending: false }),
      supabase.from('media_channels').select('id, name, subscribers').eq('platform', 'telegram')
    ]);

    if (adsResult.data) setAds(adsResult.data);
    if (clicksResult.data) setClicks(clicksResult.data);
    if (channelsResult.data) setChannels(channelsResult.data);
    
    setIsLoading(false);
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalClicks = ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0);
    const totalImpressions = ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0);
    const totalSpent = ads.reduce((sum, ad) => sum + (ad.spent || 0), 0);
    const totalBudget = ads.reduce((sum, ad) => sum + (ad.budget || 0), 0);
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCPC = totalClicks > 0 ? totalSpent / totalClicks : 0;
    
    return { totalClicks, totalImpressions, totalSpent, totalBudget, avgCTR, avgCPC };
  }, [ads]);

  // Click timeline data
  const clickTimelineData = useMemo(() => {
    const periodDays = parseInt(selectedPeriod);
    const data: { date: string; clicks: number; uniqueUsers: number }[] = [];
    
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayClicks = clicks.filter(c => c.clicked_at.startsWith(dateStr));
      const uniqueIps = new Set(dayClicks.map(c => c.ip_hash).filter(Boolean));
      
      data.push({
        date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        clicks: dayClicks.length,
        uniqueUsers: uniqueIps.size
      });
    }
    
    return data;
  }, [clicks, selectedPeriod]);

  // Hourly distribution
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, clicks: 0 }));
    
    clicks.forEach(click => {
      const hour = new Date(click.clicked_at).getHours();
      hours[hour].clicks++;
    });
    
    return hours.map(h => ({
      ...h,
      hour: `${h.hour}:00`
    }));
  }, [clicks]);

  // Referrer sources
  const referrerData = useMemo(() => {
    const sources: Record<string, number> = { 'Прямой': 0, 'Telegram': 0, 'Другие': 0 };
    
    clicks.forEach(click => {
      if (!click.referrer) {
        sources['Прямой']++;
      } else if (click.referrer.includes('t.me') || click.referrer.includes('telegram')) {
        sources['Telegram']++;
      } else {
        sources['Другие']++;
      }
    });
    
    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  }, [clicks]);

  // Device breakdown from user agents
  const deviceData = useMemo(() => {
    const devices: Record<string, number> = { 'Mobile': 0, 'Desktop': 0, 'Tablet': 0, 'Other': 0 };
    
    clicks.forEach(click => {
      const ua = (click.user_agent || '').toLowerCase();
      if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        devices['Mobile']++;
      } else if (ua.includes('tablet') || ua.includes('ipad')) {
        devices['Tablet']++;
      } else if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
        devices['Desktop']++;
      } else {
        devices['Other']++;
      }
    });
    
    return Object.entries(devices)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [clicks]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  const copyTrackingLink = (ad: TelegramAd) => {
    if (!ad.tracking_code) return;
    
    const trackingUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-ad-click?code=${ad.tracking_code}&redirect=${encodeURIComponent(ad.ad_link || '')}`;
    navigator.clipboard.writeText(trackingUrl);
    setCopiedCode(ad.id);
    toast({ title: 'Ссылка скопирована' });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getChannelName = (channelId: string | null) => {
    if (!channelId) return 'Не указан';
    const channel = channels.find(c => c.id === channelId);
    return channel?.name || 'Неизвестный';
  };

  const getAdClicksForPeriod = (adId: string) => {
    return clicks.filter(c => c.ad_id === adId).length;
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8">Загрузка аналитики...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Аналитика рекламы</h2>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 дней</SelectItem>
            <SelectItem value="14">14 дней</SelectItem>
            <SelectItem value="30">30 дней</SelectItem>
            <SelectItem value="90">90 дней</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Клики</span>
            </div>
            <p className="text-2xl font-bold mt-1">{formatNumber(metrics.totalClicks)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-sky-500" />
              <span className="text-xs text-muted-foreground">Показы</span>
            </div>
            <p className="text-2xl font-bold mt-1">{formatNumber(metrics.totalImpressions)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">CTR</span>
            </div>
            <p className="text-2xl font-bold mt-1">{metrics.avgCTR.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Потрачено</span>
            </div>
            <p className="text-2xl font-bold mt-1">{formatCurrency(metrics.totalSpent)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">CPC</span>
            </div>
            <p className="text-2xl font-bold mt-1">{formatCurrency(metrics.avgCPC)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-rose-500" />
              <span className="text-xs text-muted-foreground">Кампаний</span>
            </div>
            <p className="text-2xl font-bold mt-1">{ads.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Click Timeline */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Динамика кликов</CardTitle>
            <CardDescription>Клики и уникальные пользователи</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={clickTimelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '8px' 
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="clicks" 
                    name="Все клики" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.2} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="uniqueUsers" 
                    name="Уникальные" 
                    stroke="hsl(var(--chart-2))" 
                    fill="hsl(var(--chart-2))" 
                    fillOpacity={0.2} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Распределение по времени</CardTitle>
            <CardDescription>Когда кликают по рекламе</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={2} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '8px' 
                    }} 
                  />
                  <Bar dataKey="clicks" name="Клики" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Источники трафика</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              {referrerData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={referrerData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {referrerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '8px' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground">Нет данных</p>
              )}
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {referrerData.map((source, index) => (
                <div key={source.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm text-muted-foreground">{source.name}: {source.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Devices */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Устройства</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deviceData.map((device, index) => {
                const total = deviceData.reduce((s, d) => s + d.value, 0);
                const percent = total > 0 ? (device.value / total) * 100 : 0;
                return (
                  <div key={device.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{device.name}</span>
                      <span className="text-muted-foreground">{device.value} ({percent.toFixed(1)}%)</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                  </div>
                );
              })}
              {deviceData.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Нет данных</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Рекламные кампании</CardTitle>
          <CardDescription>Детальная статистика по каждой кампании</CardDescription>
        </CardHeader>
        <CardContent>
          {ads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Нет рекламных кампаний</p>
          ) : (
            <div className="space-y-4">
              {ads.map((ad) => {
                const periodClicks = getAdClicksForPeriod(ad.id);
                const ctr = ad.impressions > 0 ? ((ad.clicks || 0) / ad.impressions) * 100 : 0;
                const cpc = (ad.clicks || 0) > 0 ? (ad.spent || 0) / (ad.clicks || 0) : 0;
                const budgetSpent = ad.budget > 0 ? ((ad.spent || 0) / ad.budget) * 100 : 0;
                
                return (
                  <div key={ad.id} className="p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{ad.name}</h4>
                          <Badge variant={ad.status === 'active' ? 'default' : 'secondary'}>
                            {ad.status === 'active' ? 'Активна' : ad.status === 'completed' ? 'Завершена' : 'Черновик'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Канал: {getChannelName(ad.channel_id)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {ad.tracking_code && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => copyTrackingLink(ad)}
                            className="gap-1"
                          >
                            {copiedCode === ad.id ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            Ссылка
                          </Button>
                        )}
                        {ad.ad_link && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={ad.ad_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Клики (всего)</p>
                        <p className="text-lg font-semibold">{formatNumber(ad.clicks || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">За период</p>
                        <p className="text-lg font-semibold text-primary">{periodClicks}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Показы</p>
                        <p className="text-lg font-semibold">{formatNumber(ad.impressions || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">CTR</p>
                        <p className="text-lg font-semibold">{ctr.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">CPC</p>
                        <p className="text-lg font-semibold">{formatCurrency(cpc)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Бюджет</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold">{formatCurrency(ad.spent || 0)}</p>
                          <span className="text-xs text-muted-foreground">/ {formatCurrency(ad.budget || 0)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {ad.budget > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Использовано бюджета</span>
                          <span>{budgetSpent.toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.min(budgetSpent, 100)} className="h-1.5" />
                      </div>
                    )}
                    
                    {ad.tracking_code && (
                      <div className="mt-3 p-2 rounded bg-background/50 flex items-center gap-2">
                        <code className="text-xs text-muted-foreground flex-1 truncate">
                          Код отслеживания: {ad.tracking_code}
                        </code>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdAnalytics;
