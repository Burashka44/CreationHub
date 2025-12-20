import { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Eye, TrendingUp, Youtube, Video, 
  MessageCircle, Plus, UserPlus, UserMinus, ChevronDown, ChevronRight,
  Play, ExternalLink, Trash2, DollarSign, Clock, ThumbsUp, MessageSquare,
  Share2, MousePointer, Target, Calendar, Link2, Copy, Check, Settings,
  AlertTriangle, CheckCircle, Percent, Timer, PlayCircle, TrendingDown,
  Megaphone, BarChart, PieChart, Tv2
} from 'lucide-react';
import { ApiSettingsDialog } from '@/components/media/ApiSettingsDialog';
import { YouTubeAnalytics, TwitchAnalytics, VKVideoAnalytics, RuTubeAnalytics } from '@/components/media/PlatformAnalytics';
import { AdRevenueManager } from '@/components/media/AdRevenueManager';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Platform configurations
const videoPlatforms = {
  youtube: { icon: Youtube, color: '#FF0000', name: 'YouTube', gradient: 'from-red-500/20 to-red-600/10' },
  twitch: { icon: Tv2, color: '#9146FF', name: 'Twitch', gradient: 'from-purple-500/20 to-purple-600/10' },
  vk_video: { icon: Play, color: '#0077FF', name: 'VK Видео', gradient: 'from-blue-500/20 to-blue-600/10' },
  rutube: { icon: Video, color: '#FF6B00', name: 'RuTube', gradient: 'from-orange-500/20 to-orange-600/10' },
  tiktok: { icon: Video, color: '#ff0050', name: 'TikTok', gradient: 'from-pink-500/20 to-pink-600/10' },
};

const messagingPlatforms = {
  telegram: { icon: MessageCircle, color: '#0088cc', name: 'Telegram', gradient: 'from-sky-500/20 to-sky-600/10' },
};

interface MediaChannel {
  id: string;
  name: string;
  platform: string;
  channel_url: string | null;
  channel_id: string | null;
  subscribers: number;
  views: number;
  engagement: number;
  growth: number;
  videos_count: number;
  is_active: boolean;
  is_monetized: boolean;
  watch_hours: number;
  avg_view_duration: number;
  ctr: number;
  revenue: number;
  likes: number;
  comments: number;
  shares: number;
}

interface TelegramAd {
  id: string;
  channel_id: string;
  name: string;
  ad_text: string;
  ad_link: string;
  tracking_code: string;
  clicks: number;
  impressions: number;
  start_date: string;
  end_date: string;
  budget: number;
  spent: number;
  status: string;
  is_active: boolean;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatCurrency = (num: number) => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(num);
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Generate mock views data per channel
const generateChannelViewsData = () => {
  const data = [];
  const baseViews = Math.floor(Math.random() * 50000) + 10000;
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      views: Math.floor(baseViews + Math.random() * 20000 - 10000),
      watchTime: Math.floor(Math.random() * 5000) + 1000,
      impressions: Math.floor(Math.random() * 100000) + 20000,
    });
  }
  return data;
};

// Generate mock subscriber data for Telegram
const generateSubscriberData = () => {
  const data = [];
  for (let i = 29; i >= 0; i--) {
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

// Traffic source data
const generateTrafficSources = () => [
  { name: 'Рекомендации', value: 45, color: '#FF6B6B' },
  { name: 'Поиск', value: 25, color: '#4ECDC4' },
  { name: 'Внешние ссылки', value: 15, color: '#45B7D1' },
  { name: 'Прямой трафик', value: 10, color: '#96CEB4' },
  { name: 'Подписки', value: 5, color: '#FFEAA7' },
];

const MediaAnalyticsPage = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [channels, setChannels] = useState<MediaChannel[]>([]);
  const [ads, setAds] = useState<TelegramAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdDialogOpen, setIsAdDialogOpen] = useState(false);
  const [expandedPlatforms, setExpandedPlatforms] = useState<Record<string, boolean>>({});
  const [expandedChannels, setExpandedChannels] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('video');
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    platform: 'youtube',
    channel_url: '',
    channel_id: '',
    subscribers: 0,
    views: 0,
    engagement: 0,
    growth: 0,
    is_monetized: false,
    watch_hours: 0,
    revenue: 0,
  });

  const [adFormData, setAdFormData] = useState({
    name: '',
    ad_text: '',
    ad_link: '',
    budget: 0,
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchChannels();
    fetchAds();
  }, []);

  const fetchChannels = async () => {
    const { data, error } = await supabase
      .from('media_channels')
      .select('*')
      .order('subscribers', { ascending: false });
    
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      setChannels(data as MediaChannel[] || []);
      const platforms: Record<string, boolean> = {};
      (data || []).forEach(ch => {
        platforms[ch.platform] = true;
      });
      setExpandedPlatforms(platforms);
    }
    setIsLoading(false);
  };

  const fetchAds = async () => {
    const { data, error } = await supabase
      .from('telegram_ads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching ads:', error);
    } else {
      setAds(data as TelegramAd[] || []);
    }
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
        channel_id: formData.channel_id || null,
        subscribers: formData.subscribers,
        views: formData.views,
        engagement: formData.engagement,
        growth: formData.growth,
        is_monetized: formData.is_monetized,
        watch_hours: formData.watch_hours,
        revenue: formData.revenue,
      });
    
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Канал добавлен' });
      fetchChannels();
      setIsDialogOpen(false);
      setFormData({ name: '', platform: 'youtube', channel_url: '', channel_id: '', subscribers: 0, views: 0, engagement: 0, growth: 0, is_monetized: false, watch_hours: 0, revenue: 0 });
    }
  };

  const handleAddAd = async () => {
    if (!adFormData.name || !selectedChannel) {
      toast({ title: t('error'), description: 'Заполните обязательные поля', variant: 'destructive' });
      return;
    }

    const trackingCode = `tg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { error } = await supabase
      .from('telegram_ads')
      .insert({
        channel_id: selectedChannel,
        name: adFormData.name,
        ad_text: adFormData.ad_text,
        ad_link: adFormData.ad_link,
        tracking_code: trackingCode,
        budget: adFormData.budget,
        start_date: adFormData.start_date || null,
        end_date: adFormData.end_date || null,
        status: 'active',
      });
    
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Рекламная кампания создана' });
      fetchAds();
      setIsAdDialogOpen(false);
      setAdFormData({ name: '', ad_text: '', ad_link: '', budget: 0, start_date: '', end_date: '' });
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

  const handleDeleteAd = async (id: string) => {
    const { error } = await supabase.from('telegram_ads').delete().eq('id', id);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Кампания удалена' });
      fetchAds();
    }
  };

  const togglePlatform = (platform: string) => {
    setExpandedPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  const toggleChannel = (channelId: string) => {
    setExpandedChannels(prev => ({ ...prev, [channelId]: !prev[channelId] }));
  };

  const copyTrackingLink = (code: string, link: string) => {
    const fullLink = `${link}${link.includes('?') ? '&' : '?'}utm_source=telegram&utm_campaign=${code}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: 'Ссылка скопирована' });
  };

  const videoChannels = channels.filter(ch => Object.keys(videoPlatforms).includes(ch.platform));
  const telegramChannels = channels.filter(ch => ch.platform === 'telegram');

  const totalVideoViews = videoChannels.reduce((sum, ch) => sum + (ch.views || 0), 0);
  const totalVideoSubscribers = videoChannels.reduce((sum, ch) => sum + (ch.subscribers || 0), 0);
  const totalTelegramSubscribers = telegramChannels.reduce((sum, ch) => sum + (ch.subscribers || 0), 0);
  const totalRevenue = videoChannels.reduce((sum, ch) => sum + (ch.revenue || 0), 0);
  const totalAdClicks = ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0);

  // YouTube Monetization Requirements
  const MonetizationStatus = ({ channel }: { channel: MediaChannel }) => {
    const requirements = {
      subscribers: { current: channel.subscribers || 0, required: 1000, label: 'Подписчиков' },
      watchHours: { current: channel.watch_hours || 0, required: 4000, label: 'Часов просмотра (за год)' },
    };

    const subscribersProgress = Math.min((requirements.subscribers.current / requirements.subscribers.required) * 100, 100);
    const watchHoursProgress = Math.min((requirements.watchHours.current / requirements.watchHours.required) * 100, 100);
    const isEligible = subscribersProgress >= 100 && watchHoursProgress >= 100;

    return (
      <div className="space-y-4 p-4 rounded-xl bg-background/50 border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className={`h-5 w-5 ${channel.is_monetized ? 'text-emerald-500' : 'text-muted-foreground'}`} />
            <span className="font-medium">Монетизация</span>
          </div>
          {channel.is_monetized ? (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Активна
            </Badge>
          ) : isEligible ? (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Доступна
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Недоступна
            </Badge>
          )}
        </div>

        {!channel.is_monetized && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{requirements.subscribers.label}</span>
                <span className={subscribersProgress >= 100 ? 'text-emerald-500' : 'text-foreground'}>
                  {formatNumber(requirements.subscribers.current)} / {formatNumber(requirements.subscribers.required)}
                </span>
              </div>
              <Progress value={subscribersProgress} className="h-2" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{requirements.watchHours.label}</span>
                <span className={watchHoursProgress >= 100 ? 'text-emerald-500' : 'text-foreground'}>
                  {formatNumber(requirements.watchHours.current)} / {formatNumber(requirements.watchHours.required)}
                </span>
              </div>
              <Progress value={watchHoursProgress} className="h-2" />
            </div>
          </div>
        )}

        {channel.is_monetized && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-muted-foreground">Доход за месяц</p>
              <p className="text-lg font-bold text-emerald-500">{formatCurrency(channel.revenue || 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground">CPM средний</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(((channel.revenue || 0) / Math.max(channel.views || 1, 1)) * 1000)}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Detailed YouTube Analytics
  const YouTubeDetailedStats = ({ channel }: { channel: MediaChannel }) => {
    const viewsData = generateChannelViewsData();
    const trafficSources = generateTrafficSources();

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-xs">Просмотры</span>
            </div>
            <p className="text-xl font-bold">{formatNumber(channel.views || 0)}</p>
            <p className="text-xs text-emerald-500">+12.5% за месяц</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Время просмотра</span>
            </div>
            <p className="text-xl font-bold">{formatNumber(channel.watch_hours || 0)}ч</p>
            <p className="text-xs text-emerald-500">+8.3% за месяц</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Timer className="h-4 w-4" />
              <span className="text-xs">Ср. длительность</span>
            </div>
            <p className="text-xl font-bold">{formatDuration(channel.avg_view_duration || 245)}</p>
            <p className="text-xs text-amber-500">-2.1% за месяц</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Percent className="h-4 w-4" />
              <span className="text-xs">CTR</span>
            </div>
            <p className="text-xl font-bold">{(channel.ctr || 4.5).toFixed(1)}%</p>
            <p className="text-xs text-emerald-500">+0.5% за месяц</p>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20 text-center">
            <ThumbsUp className="h-5 w-5 text-pink-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{formatNumber(channel.likes || 15420)}</p>
            <p className="text-xs text-muted-foreground">Лайки</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
            <MessageSquare className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{formatNumber(channel.comments || 892)}</p>
            <p className="text-xs text-muted-foreground">Комментарии</p>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
            <Share2 className="h-5 w-5 text-purple-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{formatNumber(channel.shares || 234)}</p>
            <p className="text-xs text-muted-foreground">Репосты</p>
          </div>
        </div>

        {/* Views Chart */}
        <div className="p-4 rounded-xl bg-background/50 border border-border/50">
          <h4 className="font-medium mb-4">Динамика просмотров</h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewsData}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF0000" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF0000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={formatNumber} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: number) => [formatNumber(value), 'Просмотры']}
                />
                <Area type="monotone" dataKey="views" stroke="#FF0000" strokeWidth={2} fill="url(#viewsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="p-4 rounded-xl bg-background/50 border border-border/50">
          <h4 className="font-medium mb-4">Источники трафика</h4>
          <div className="flex items-center gap-6">
            <div className="w-[150px] h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={trafficSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {trafficSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {trafficSources.map((source) => (
                <div key={source.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                    <span className="text-sm">{source.name}</span>
                  </div>
                  <span className="text-sm font-medium">{source.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monetization */}
        <MonetizationStatus channel={channel} />
      </div>
    );
  };

  // Telegram Ad Card
  const TelegramAdCard = ({ ad, channelName }: { ad: TelegramAd; channelName: string }) => {
    const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00';
    const budgetUsed = ad.budget > 0 ? (ad.spent / ad.budget) * 100 : 0;

    return (
      <div className="p-4 rounded-xl bg-background/50 border border-border/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/20">
              <Megaphone className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <h4 className="font-medium">{ad.name}</h4>
              <p className="text-sm text-muted-foreground">{channelName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={ad.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'}>
              {ad.status === 'active' ? 'Активна' : ad.status === 'paused' ? 'Пауза' : 'Завершена'}
            </Badge>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteAd(ad.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <MousePointer className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{formatNumber(ad.clicks)}</p>
            <p className="text-xs text-muted-foreground">Клики</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <Eye className="h-4 w-4 mx-auto text-blue-500 mb-1" />
            <p className="text-lg font-bold">{formatNumber(ad.impressions)}</p>
            <p className="text-xs text-muted-foreground">Показы</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <Percent className="h-4 w-4 mx-auto text-amber-500 mb-1" />
            <p className="text-lg font-bold">{ctr}%</p>
            <p className="text-xs text-muted-foreground">CTR</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <DollarSign className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
            <p className="text-lg font-bold">{formatCurrency(ad.spent)}</p>
            <p className="text-xs text-muted-foreground">Потрачено</p>
          </div>
        </div>

        {ad.budget > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Бюджет</span>
              <span>{formatCurrency(ad.spent)} / {formatCurrency(ad.budget)}</span>
            </div>
            <Progress value={budgetUsed} className="h-2" />
          </div>
        )}

        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <code className="text-xs flex-1 truncate">{ad.tracking_code}</code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyTrackingLink(ad.tracking_code, ad.ad_link)}
          >
            {copiedCode === ad.tracking_code ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
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
        
        <div className="flex items-center gap-2">
          <ApiSettingsDialog />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Добавить канал
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Добавить канал</DialogTitle>
              <DialogDescription>Заполните информацию о канале</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>URL канала</Label>
                  <Input
                    value={formData.channel_url}
                    onChange={(e) => setFormData({ ...formData, channel_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID канала</Label>
                  <Input
                    value={formData.channel_id}
                    onChange={(e) => setFormData({ ...formData, channel_id: e.target.value })}
                    placeholder="UC..."
                  />
                </div>
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

              {formData.platform === 'youtube' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Часы просмотра</Label>
                      <Input
                        type="number"
                        value={formData.watch_hours}
                        onChange={(e) => setFormData({ ...formData, watch_hours: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Доход (₽)</Label>
                      <Input
                        type="number"
                        value={formData.revenue}
                        onChange={(e) => setFormData({ ...formData, revenue: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      <Label>Монетизация включена</Label>
                    </div>
                    <Switch
                      checked={formData.is_monetized}
                      onCheckedChange={(v) => setFormData({ ...formData, is_monetized: v })}
                    />
                  </div>
                </>
              )}

              <Button onClick={handleAddChannel} className="w-full">
                Добавить
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="video" className="gap-2">
            <Play className="h-4 w-4" />
            Видео
          </TabsTrigger>
          <TabsTrigger value="telegram" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Telegram
          </TabsTrigger>
          <TabsTrigger value="ads" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Реклама
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Доходы
          </TabsTrigger>
        </TabsList>

        {/* Video Platforms Tab */}
        <TabsContent value="video" className="space-y-6 mt-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-emerald-500/10">
                    <Eye className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{formatNumber(totalVideoViews)}</p>
                    <p className="text-xs text-muted-foreground">Просмотры</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{formatNumber(totalVideoSubscribers)}</p>
                    <p className="text-xs text-muted-foreground">Подписчики</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-purple-500/10">
                    <PlayCircle className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{videoChannels.length}</p>
                    <p className="text-xs text-muted-foreground">Каналов</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-emerald-500/10">
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
                    <p className="text-xs text-muted-foreground">Доход</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-amber-500/10">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{Object.keys(videoPlatforms).length}</p>
                    <p className="text-xs text-muted-foreground">Платформ</p>
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
                            <div className="p-3 rounded-lg" style={{ backgroundColor: `${platform.color}20` }}>
                              <Icon className="h-6 w-6" style={{ color: platform.color }} />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{platform.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {platformChannels.length} каналов • {formatNumber(platformChannels.reduce((s, c) => s + (c.views || 0), 0))} просмотров
                              </p>
                            </div>
                          </div>
                          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        {platformChannels.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Нет добавленных каналов</p>
                            <Button variant="outline" size="sm" className="mt-2" onClick={() => { setFormData({ ...formData, platform: platformKey }); setIsDialogOpen(true); }}>
                              <Plus className="h-4 w-4 mr-1" />
                              Добавить
                            </Button>
                          </div>
                        ) : (
                          platformChannels.map((channel) => (
                            <Collapsible key={channel.id} open={expandedChannels[channel.id]} onOpenChange={() => toggleChannel(channel.id)}>
                              <div className="rounded-xl bg-card/80 border border-border/50 overflow-hidden">
                                <CollapsibleTrigger asChild>
                                  <div className="p-4 cursor-pointer hover:bg-muted/10 transition-colors">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        {expandedChannels[channel.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        <div>
                                          <h4 className="font-semibold">{channel.name}</h4>
                                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <span>{formatNumber(channel.subscribers || 0)} подписчиков</span>
                                            <span>•</span>
                                            <span>{formatNumber(channel.views || 0)} просмотров</span>
                                            {channel.is_monetized && (
                                              <>
                                                <span>•</span>
                                                <span className="text-emerald-500">{formatCurrency(channel.revenue || 0)}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {channel.is_monetized && (
                                          <Badge className="bg-emerald-500/20 text-emerald-400">
                                            <DollarSign className="h-3 w-3 mr-1" />
                                            Монетизация
                                          </Badge>
                                        )}
                                        {channel.channel_url && (
                                          <Button variant="ghost" size="icon" asChild>
                                            <a href={channel.channel_url} target="_blank" rel="noopener noreferrer">
                                              <ExternalLink className="h-4 w-4" />
                                            </a>
                                          </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteChannel(channel.id); }}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </CollapsibleTrigger>
                                
                                <CollapsibleContent>
                                  <div className="px-4 pb-4">
                                    {platformKey === 'youtube' && <YouTubeAnalytics channel={channel} />}
                                    {platformKey === 'twitch' && <TwitchAnalytics channel={channel} />}
                                    {platformKey === 'vk_video' && <VKVideoAnalytics channel={channel} />}
                                    {platformKey === 'rutube' && <RuTubeAnalytics channel={channel} />}
                                    {platformKey === 'tiktok' && <YouTubeAnalytics channel={channel} />}
                                  </div>
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          ))
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
                    <Users className="h-5 w-5 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{formatNumber(totalTelegramSubscribers)}</p>
                    <p className="text-xs text-muted-foreground">Подписчиков</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-emerald-500/10">
                    <UserPlus className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-emerald-500">+{Math.floor(Math.random() * 500) + 200}</p>
                    <p className="text-xs text-muted-foreground">За неделю</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-destructive/10">
                    <UserMinus className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-destructive">-{Math.floor(Math.random() * 100) + 30}</p>
                    <p className="text-xs text-muted-foreground">Отписки</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-purple-500/10">
                    <MessageCircle className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{telegramChannels.length}</p>
                    <p className="text-xs text-muted-foreground">Каналов</p>
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
                <Button variant="outline" className="mt-4" onClick={() => { setFormData({ ...formData, platform: 'telegram' }); setIsDialogOpen(true); }}>
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
                const channelAds = ads.filter(ad => ad.channel_id === channel.id);
                
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
                            <p className="text-sm text-muted-foreground">{formatNumber(channel.subscribers || 0)} подписчиков</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`text-lg font-bold ${netGrowth >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                              {netGrowth >= 0 ? '+' : ''}{netGrowth}
                            </p>
                            <p className="text-xs text-muted-foreground">за месяц</p>
                          </div>
                          {channel.channel_url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={channel.channel_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteChannel(channel.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Quick Stats */}
                      <div className="grid grid-cols-4 gap-3">
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
                          <p className="text-xl font-bold text-primary">{(((channel.subscribers || 0) > 0 ? netGrowth / (channel.subscribers || 1) : 0) * 100).toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Рост</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                          <Megaphone className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                          <p className="text-xl font-bold text-amber-500">{channelAds.length}</p>
                          <p className="text-xs text-muted-foreground">Кампаний</p>
                        </div>
                      </div>
                      
                      {/* Subscriber Chart */}
                      <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                        <h4 className="font-medium mb-4">Динамика подписчиков</h4>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={subscriberData} barGap={0}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                              <Bar dataKey="subscribed" name="Подписалось" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="unsubscribed" name="Отписалось" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-6 mt-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(142 76% 36%)' }} />
                            <span className="text-sm text-muted-foreground">Подписалось</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-destructive" />
                            <span className="text-sm text-muted-foreground">Отписалось</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Ads Tab */}
        <TabsContent value="ads" className="space-y-6 mt-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Megaphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{ads.length}</p>
                    <p className="text-xs text-muted-foreground">Кампаний</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-emerald-500/10">
                    <MousePointer className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{formatNumber(totalAdClicks)}</p>
                    <p className="text-xs text-muted-foreground">Кликов</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Eye className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{formatNumber(ads.reduce((s, a) => s + (a.impressions || 0), 0))}</p>
                    <p className="text-xs text-muted-foreground">Показов</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-amber-500/10">
                    <DollarSign className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{formatCurrency(ads.reduce((s, a) => s + (a.spent || 0), 0))}</p>
                    <p className="text-xs text-muted-foreground">Потрачено</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Ad Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Рекламные кампании</h3>
            <Dialog open={isAdDialogOpen} onOpenChange={setIsAdDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" disabled={telegramChannels.length === 0}>
                  <Plus className="h-4 w-4" />
                  Создать кампанию
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новая рекламная кампания</DialogTitle>
                  <DialogDescription>Создайте рекламу для Telegram канала</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Канал *</Label>
                    <Select value={selectedChannel || ''} onValueChange={setSelectedChannel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите канал" />
                      </SelectTrigger>
                      <SelectContent>
                        {telegramChannels.map(ch => (
                          <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Название кампании *</Label>
                    <Input
                      value={adFormData.name}
                      onChange={(e) => setAdFormData({ ...adFormData, name: e.target.value })}
                      placeholder="Промо акция..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Текст рекламы</Label>
                    <Textarea
                      value={adFormData.ad_text}
                      onChange={(e) => setAdFormData({ ...adFormData, ad_text: e.target.value })}
                      placeholder="Текст рекламного поста..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ссылка</Label>
                    <Input
                      value={adFormData.ad_link}
                      onChange={(e) => setAdFormData({ ...adFormData, ad_link: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Бюджет (₽)</Label>
                      <Input
                        type="number"
                        value={adFormData.budget}
                        onChange={(e) => setAdFormData({ ...adFormData, budget: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Дата начала</Label>
                      <Input
                        type="date"
                        value={adFormData.start_date}
                        onChange={(e) => setAdFormData({ ...adFormData, start_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddAd} className="w-full">
                    Создать кампанию
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Ads List */}
          {ads.length === 0 ? (
            <Card className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-border/50">
              <CardContent className="py-12 text-center">
                <Megaphone className="h-12 w-12 text-amber-500 mx-auto mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground">Нет рекламных кампаний</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {telegramChannels.length === 0 ? 'Сначала добавьте Telegram канал' : 'Создайте первую кампанию'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {ads.map((ad) => {
                const channel = telegramChannels.find(ch => ch.id === ad.channel_id);
                return (
                  <TelegramAdCard key={ad.id} ad={ad} channelName={channel?.name || 'Неизвестный канал'} />
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6 mt-6">
          <AdRevenueManager channels={channels as any} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MediaAnalyticsPage;
