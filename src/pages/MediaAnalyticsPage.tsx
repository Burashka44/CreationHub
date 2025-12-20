import { useState, useEffect } from 'react';
import { BarChart3, Users, Eye, TrendingUp, Youtube, Video, MessageCircle, Play, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const platformConfig: Record<string, { icon: React.ComponentType<any>; color: string; name: string }> = {
  youtube: { icon: Youtube, color: '#FF0000', name: 'YouTube' },
  tiktok: { icon: Video, color: '#ff0050', name: 'TikTok' },
  rutube: { icon: Video, color: '#FF6B00', name: 'RuTube' },
  max: { icon: MessageCircle, color: '#8B5CF6', name: 'Max' },
  telegram: { icon: MessageCircle, color: '#0088cc', name: 'Telegram' },
  vk: { icon: MessageCircle, color: '#0077FF', name: 'VK' },
};

interface MediaChannel {
  id: string;
  name: string;
  platform: string;
  channel_url: string | null;
  subscribers: number;
  views: number;
  engagement: number;
  growth: number;
  videos_count: number;
  is_active: boolean;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const MediaAnalyticsPage = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [channels, setChannels] = useState<MediaChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    platform: 'youtube',
    channel_url: '',
    subscribers: 0,
    views: 0,
    engagement: 0,
    growth: 0,
  });

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    const { data, error } = await supabase
      .from('media_channels')
      .select('*')
      .order('subscribers', { ascending: false });
    
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      setChannels(data || []);
    }
    setIsLoading(false);
  };

  const handleAddChannel = async () => {
    if (!formData.name || !formData.platform) {
      toast({ title: t('error'), description: 'Заполните обязательные поля', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('media_channels')
      .insert({
        name: formData.name,
        platform: formData.platform,
        channel_url: formData.channel_url || null,
        subscribers: formData.subscribers,
        views: formData.views,
        engagement: formData.engagement,
        growth: formData.growth,
      });
    
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Канал добавлен' });
      fetchChannels();
      setIsDialogOpen(false);
      setFormData({ name: '', platform: 'youtube', channel_url: '', subscribers: 0, views: 0, engagement: 0, growth: 0 });
    }
  };

  const totalSubscribers = channels.reduce((sum, ch) => sum + ch.subscribers, 0);
  const totalViews = channels.reduce((sum, ch) => sum + ch.views, 0);
  const avgEngagement = channels.length ? channels.reduce((sum, ch) => sum + ch.engagement, 0) / channels.length : 0;
  const avgGrowth = channels.length ? channels.reduce((sum, ch) => sum + ch.growth, 0) / channels.length : 0;

  // Prepare data for charts
  const pieData = Object.keys(platformConfig).map(platform => {
    const platformChannels = channels.filter(ch => ch.platform === platform);
    const total = platformChannels.reduce((sum, ch) => sum + ch.subscribers, 0);
    return {
      name: platformConfig[platform].name,
      value: total,
      color: platformConfig[platform].color,
    };
  }).filter(item => item.value > 0);

  const viewsData = [
    { date: '01.12', ...Object.fromEntries(Object.keys(platformConfig).map(p => [p, Math.floor(Math.random() * 50000)])) },
    { date: '02.12', ...Object.fromEntries(Object.keys(platformConfig).map(p => [p, Math.floor(Math.random() * 50000)])) },
    { date: '03.12', ...Object.fromEntries(Object.keys(platformConfig).map(p => [p, Math.floor(Math.random() * 50000)])) },
    { date: '04.12', ...Object.fromEntries(Object.keys(platformConfig).map(p => [p, Math.floor(Math.random() * 50000)])) },
    { date: '05.12', ...Object.fromEntries(Object.keys(platformConfig).map(p => [p, Math.floor(Math.random() * 50000)])) },
    { date: '06.12', ...Object.fromEntries(Object.keys(platformConfig).map(p => [p, Math.floor(Math.random() * 50000)])) },
    { date: '07.12', ...Object.fromEntries(Object.keys(platformConfig).map(p => [p, Math.floor(Math.random() * 50000)])) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('mediaAnalytics')}</h1>
            <p className="text-muted-foreground">{t('mediaAnalyticsDescription')}</p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Добавить канал
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить канал</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Название *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Мой канал"
                />
              </div>
              <div className="space-y-2">
                <Label>Платформа *</Label>
                <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(platformConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                          {config.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>URL канала</Label>
                <Input
                  value={formData.channel_url}
                  onChange={(e) => setFormData({ ...formData, channel_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Подписчики</Label>
                  <Input
                    type="number"
                    value={formData.subscribers}
                    onChange={(e) => setFormData({ ...formData, subscribers: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Просмотры</Label>
                  <Input
                    type="number"
                    value={formData.views}
                    onChange={(e) => setFormData({ ...formData, views: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ER (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.engagement}
                    onChange={(e) => setFormData({ ...formData, engagement: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Рост (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.growth}
                    onChange={(e) => setFormData({ ...formData, growth: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <Button onClick={handleAddChannel} className="w-full">
                Добавить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatNumber(totalSubscribers)}</p>
                <p className="text-sm text-muted-foreground">{t('totalSubscribers')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <Eye className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatNumber(totalViews)}</p>
                <p className="text-sm text-muted-foreground">{t('totalViews')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avgEngagement.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">{t('avgEngagement')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Play className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{channels.length}</p>
                <p className="text-sm text-muted-foreground">Каналов</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {channels.length === 0 && !isLoading ? (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Нет добавленных каналов</p>
            <p className="text-sm text-muted-foreground mt-1">Добавьте каналы для отображения аналитики</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Views Chart */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  {t('viewsDynamics')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={viewsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={formatNumber} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => formatNumber(value)}
                    />
                    {Object.entries(platformConfig).map(([key, config]) => (
                      <Line key={key} type="monotone" dataKey={key} stroke={config.color} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-4 mt-4 justify-center">
                  {Object.entries(platformConfig).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                      <span className="text-sm text-muted-foreground">{config.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Subscribers Distribution */}
            {pieData.length > 0 && (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {t('subscribersDistribution')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${formatNumber(value)}`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => formatNumber(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Channel Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((channel) => {
              const config = platformConfig[channel.platform] || platformConfig.youtube;
              const Icon = config.icon;
              
              return (
                <Card key={channel.id} className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-3 rounded-lg" 
                          style={{ backgroundColor: `${config.color}20` }}
                        >
                          <Icon className="h-6 w-6" style={{ color: config.color }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{channel.name}</h3>
                          <p className="text-sm text-muted-foreground">{config.name}</p>
                        </div>
                      </div>
                      {channel.growth > 0 && (
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                          +{channel.growth}%
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-lg font-bold text-foreground">{formatNumber(channel.subscribers)}</p>
                        <p className="text-xs text-muted-foreground">{t('subscribers')}</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{formatNumber(channel.views)}</p>
                        <p className="text-xs text-muted-foreground">{t('views')}</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{channel.engagement}%</p>
                        <p className="text-xs text-muted-foreground">{t('engagement')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default MediaAnalyticsPage;
