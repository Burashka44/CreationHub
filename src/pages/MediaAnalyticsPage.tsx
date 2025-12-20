import { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Eye, TrendingUp, Youtube, Video, 
  MessageCircle, Plus, UserPlus, UserMinus, ChevronDown, ChevronRight,
  Play, ExternalLink, Trash2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar 
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Platform configurations
const videoPlatforms = {
  youtube: { icon: Youtube, color: '#FF0000', name: 'YouTube', gradient: 'from-red-500/20 to-red-600/10' },
  vk_video: { icon: Play, color: '#0077FF', name: 'VK Видео', gradient: 'from-blue-500/20 to-blue-600/10' },
  tiktok: { icon: Video, color: '#ff0050', name: 'TikTok', gradient: 'from-pink-500/20 to-pink-600/10' },
  rutube: { icon: Video, color: '#FF6B00', name: 'RuTube', gradient: 'from-orange-500/20 to-orange-600/10' },
};

const messagingPlatforms = {
  telegram: { icon: MessageCircle, color: '#0088cc', name: 'Telegram', gradient: 'from-sky-500/20 to-sky-600/10' },
};

const allPlatforms = { ...videoPlatforms, ...messagingPlatforms };

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

// Generate mock views data per channel
const generateChannelViewsData = (channelName: string) => {
  const data = [];
  const baseViews = Math.floor(Math.random() * 50000) + 10000;
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      views: Math.floor(baseViews + Math.random() * 20000 - 10000),
    });
  }
  return data;
};

// Generate mock subscriber data for Telegram
const generateSubscriberData = () => {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      subscribed: Math.floor(Math.random() * 150) + 50,
      unsubscribed: Math.floor(Math.random() * 80) + 20,
    });
  }
  return data;
};

const MediaAnalyticsPage = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [channels, setChannels] = useState<MediaChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedPlatforms, setExpandedPlatforms] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('video');
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
      // Auto-expand platforms that have channels
      const platforms: Record<string, boolean> = {};
      (data || []).forEach(ch => {
        platforms[ch.platform] = true;
      });
      setExpandedPlatforms(platforms);
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

  const handleDeleteChannel = async (id: string) => {
    const { error } = await supabase.from('media_channels').delete().eq('id', id);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Канал удалён' });
      fetchChannels();
    }
  };

  const togglePlatform = (platform: string) => {
    setExpandedPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  // Group channels by platform
  const videoChannels = channels.filter(ch => Object.keys(videoPlatforms).includes(ch.platform));
  const telegramChannels = channels.filter(ch => ch.platform === 'telegram');

  // Stats
  const totalVideoViews = videoChannels.reduce((sum, ch) => sum + ch.views, 0);
  const totalVideoSubscribers = videoChannels.reduce((sum, ch) => sum + ch.subscribers, 0);
  const totalTelegramSubscribers = telegramChannels.reduce((sum, ch) => sum + ch.subscribers, 0);

  const getPlatformsForTab = () => {
    if (activeTab === 'video') return videoPlatforms;
    return messagingPlatforms;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Видео платформы</div>
                    {Object.entries(videoPlatforms).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                          {config.name}
                        </div>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Мессенджеры</div>
                    {Object.entries(messagingPlatforms).map(([key, config]) => (
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
              <Button onClick={handleAddChannel} className="w-full">
                Добавить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="video" className="gap-2">
            <Play className="h-4 w-4" />
            Видео платформы
          </TabsTrigger>
          <TabsTrigger value="telegram" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Telegram
          </TabsTrigger>
        </TabsList>

        {/* Video Platforms Tab */}
        <TabsContent value="video" className="space-y-6 mt-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-emerald-500/10">
                    <Eye className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatNumber(totalVideoViews)}</p>
                    <p className="text-sm text-muted-foreground">Всего просмотров</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatNumber(totalVideoSubscribers)}</p>
                    <p className="text-sm text-muted-foreground">Подписчиков</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-purple-500/10">
                    <Play className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{videoChannels.length}</p>
                    <p className="text-sm text-muted-foreground">Каналов</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-amber-500/10">
                    <TrendingUp className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{Object.keys(videoPlatforms).length}</p>
                    <p className="text-sm text-muted-foreground">Платформ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Video Platforms with Channels */}
          <div className="space-y-4">
            {Object.entries(videoPlatforms).map(([platformKey, platform]) => {
              const platformChannels = channels.filter(ch => ch.platform === platformKey);
              const Icon = platform.icon;
              const isExpanded = expandedPlatforms[platformKey];
              
              return (
                <Card key={platformKey} className={`bg-gradient-to-r ${platform.gradient} border-border/50`}>
                  <Collapsible open={isExpanded} onOpenChange={() => togglePlatform(platformKey)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/10 transition-colors rounded-t-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="p-3 rounded-lg" 
                              style={{ backgroundColor: `${platform.color}20` }}
                            >
                              <Icon className="h-6 w-6" style={{ color: platform.color }} />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{platform.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {platformChannels.length} {platformChannels.length === 1 ? 'канал' : 'каналов'} • 
                                {' '}{formatNumber(platformChannels.reduce((s, c) => s + c.views, 0))} просмотров
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        {platformChannels.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Нет добавленных каналов</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => {
                                setFormData({ ...formData, platform: platformKey });
                                setIsDialogOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Добавить
                            </Button>
                          </div>
                        ) : (
                          platformChannels.map((channel) => {
                            const viewsData = generateChannelViewsData(channel.name);
                            
                            return (
                              <div key={channel.id} className="p-4 rounded-xl bg-card/80 border border-border/50">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <h4 className="font-semibold text-foreground">{channel.name}</h4>
                                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <span>{formatNumber(channel.subscribers)} подписчиков</span>
                                        <span>•</span>
                                        <span>{formatNumber(channel.views)} просмотров</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {channel.growth > 0 && (
                                      <Badge className="bg-emerald-500/20 text-emerald-400">
                                        +{channel.growth}%
                                      </Badge>
                                    )}
                                    {channel.channel_url && (
                                      <Button variant="ghost" size="icon" asChild>
                                        <a href={channel.channel_url} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="h-4 w-4" />
                                        </a>
                                      </Button>
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteChannel(channel.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Views Chart for this channel */}
                                <div className="h-[150px]">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={viewsData}>
                                      <defs>
                                        <linearGradient id={`gradient-${channel.id}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor={platform.color} stopOpacity={0.3} />
                                          <stop offset="95%" stopColor={platform.color} stopOpacity={0} />
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                      <XAxis 
                                        dataKey="date" 
                                        stroke="hsl(var(--muted-foreground))" 
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                      />
                                      <YAxis 
                                        stroke="hsl(var(--muted-foreground))" 
                                        fontSize={10}
                                        tickFormatter={formatNumber}
                                        tickLine={false}
                                        axisLine={false}
                                      />
                                      <Tooltip 
                                        contentStyle={{ 
                                          backgroundColor: 'hsl(var(--card))', 
                                          border: '1px solid hsl(var(--border))',
                                          borderRadius: '8px'
                                        }}
                                        formatter={(value: number) => [formatNumber(value), 'Просмотры']}
                                      />
                                      <Area
                                        type="monotone"
                                        dataKey="views"
                                        stroke={platform.color}
                                        strokeWidth={2}
                                        fill={`url(#gradient-${channel.id})`}
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Telegram Tab */}
        <TabsContent value="telegram" className="space-y-6 mt-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-sky-500/10">
                    <Users className="h-6 w-6 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatNumber(totalTelegramSubscribers)}</p>
                    <p className="text-sm text-muted-foreground">Всего подписчиков</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-emerald-500/10">
                    <UserPlus className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">+{Math.floor(Math.random() * 500) + 200}</p>
                    <p className="text-sm text-muted-foreground">Новых за неделю</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-destructive/10">
                    <UserMinus className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">-{Math.floor(Math.random() * 100) + 30}</p>
                    <p className="text-sm text-muted-foreground">Отписок за неделю</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-purple-500/10">
                    <MessageCircle className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{telegramChannels.length}</p>
                    <p className="text-sm text-muted-foreground">Каналов</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Telegram Channels */}
          {telegramChannels.length === 0 ? (
            <Card className="bg-gradient-to-r from-sky-500/20 to-sky-600/10 border-border/50">
              <CardContent className="py-12 text-center">
                <MessageCircle className="h-12 w-12 text-sky-500 mx-auto mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground">Нет добавленных Telegram каналов</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setFormData({ ...formData, platform: 'telegram' });
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить Telegram канал
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {telegramChannels.map((channel) => {
                const subscriberData = generateSubscriberData();
                const weeklyGain = subscriberData.reduce((s, d) => s + d.subscribed, 0);
                const weeklyLoss = subscriberData.reduce((s, d) => s + d.unsubscribed, 0);
                const netGrowth = weeklyGain - weeklyLoss;
                
                return (
                  <Card key={channel.id} className="bg-gradient-to-r from-sky-500/10 to-sky-600/5 border-border/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-sky-500/20">
                            <MessageCircle className="h-6 w-6 text-sky-500" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{channel.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {formatNumber(channel.subscribers)} подписчиков
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`text-lg font-bold ${netGrowth >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                              {netGrowth >= 0 ? '+' : ''}{netGrowth}
                            </p>
                            <p className="text-xs text-muted-foreground">за неделю</p>
                          </div>
                          {channel.channel_url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={channel.channel_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteChannel(channel.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Quick Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                          <UserPlus className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                          <p className="text-xl font-bold text-emerald-500">+{weeklyGain}</p>
                          <p className="text-xs text-muted-foreground">Подписалось</p>
                        </div>
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                          <UserMinus className="h-5 w-5 text-destructive mx-auto mb-1" />
                          <p className="text-xl font-bold text-destructive">-{weeklyLoss}</p>
                          <p className="text-xs text-muted-foreground">Отписалось</p>
                        </div>
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                          <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
                          <p className="text-xl font-bold text-primary">
                            {((netGrowth / (channel.subscribers || 1)) * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Рост</p>
                        </div>
                      </div>
                      
                      {/* Subscriber Chart */}
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={subscriberData} barGap={0}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis 
                              dataKey="date" 
                              stroke="hsl(var(--muted-foreground))" 
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis 
                              stroke="hsl(var(--muted-foreground))" 
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Bar 
                              dataKey="subscribed" 
                              name="Подписалось"
                              fill="hsl(var(--success))" 
                              radius={[4, 4, 0, 0]} 
                            />
                            <Bar 
                              dataKey="unsubscribed" 
                              name="Отписалось"
                              fill="hsl(var(--destructive))" 
                              radius={[4, 4, 0, 0]} 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Legend */}
                      <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-success" />
                          <span className="text-sm text-muted-foreground">Подписалось</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-destructive" />
                          <span className="text-sm text-muted-foreground">Отписалось</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MediaAnalyticsPage;
