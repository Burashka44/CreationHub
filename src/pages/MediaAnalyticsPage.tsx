import { useState, useEffect } from 'react';
import {
  BarChart3, Users, Eye, TrendingUp, Youtube, Video,
  MessageCircle, Plus, Trash2, Check, Search, RefreshCw, DollarSign
} from 'lucide-react';
import { ApiSettingsDialog } from '@/components/media/ApiSettingsDialog';
import { ChannelSelector } from '@/components/media/ChannelSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Platform configurations
const videoPlatforms: Record<string, { icon: any; color: string; name: string }> = {
  youtube: { icon: Youtube, color: '#FF0000', name: 'YouTube' },
  twitch: { icon: Video, color: '#9146FF', name: 'Twitch' },
  vk_video: { icon: Video, color: '#0077FF', name: 'VK Видео' },
  rutube: { icon: Video, color: '#FF6B00', name: 'RuTube' },
  tiktok: { icon: Video, color: '#ff0050', name: 'TikTok' },
};

const messagingPlatforms: Record<string, { icon: any; color: string; name: string }> = {
  telegram: { icon: MessageCircle, color: '#0088cc', name: 'Telegram' },
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
  last_synced_at: string | null;
  username: string | null;
}

const MediaAnalyticsPage = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [channels, setChannels] = useState<MediaChannel[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  // Add Channel Form State
  const [formData, setFormData] = useState({
    name: '',
    platform: 'youtube',
    channel_url: '',
    channel_id: '',
    subscribers: 0,
    views: 0,
    api_key: ''
  });

  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [fetchedChannelInfo, setFetchedChannelInfo] = useState<any>(null);

  useEffect(() => {
    fetchChannels();
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'apiKeys').single();
    if (data?.value?.youtube) {
      setFormData(prev => ({ ...prev, api_key: data.value.youtube }));
    }
  };

  const fetchChannels = async () => {
    const { data, error } = await supabase
      .from('media_channels')
      .select('*')
      .order('subscribers', { ascending: false });

    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      setChannels(data as MediaChannel[] || []);
    }
  };

  const handleFetchChannelInfo = async () => {
    if (!formData.channel_url) {
      toast({ title: 'Ошибка', description: 'Введите URL или ID канала', variant: 'destructive' });
      return;
    }

    if (formData.platform === 'youtube') {
      if (!formData.api_key) {
        toast({ title: 'Нет API ключа', description: 'Сохраните YouTube API Key в настройках', variant: 'destructive' });
        return;
      }

      setIsFetchingInfo(true);
      try {
        const response = await fetch(`/api/media/youtube/info?input=${encodeURIComponent(formData.channel_url)}&key=${formData.api_key}`);
        const data = await response.json();

        if (data.success) {
          setFetchedChannelInfo(data.data);
          setFormData(prev => ({
            ...prev,
            name: data.data.name,
            channel_id: data.data.channel_id,
            subscribers: data.data.subscribers,
            views: data.data.views,
            channel_url: data.data.channel_url
          }));
          toast({ title: 'Данные получены', description: `Канал: ${data.data.name}` });
        } else {
          throw new Error(data.error);
        }
      } catch (e: any) {
        toast({ title: 'Ошибка получения данных', description: e.message, variant: 'destructive' });
      }
      setIsFetchingInfo(false);
    } else {
      toast({ title: 'Инфо', description: 'Авто-поиск пока доступен только для YouTube', variant: 'default' });
    }
  };

  const handleAddChannel = async () => {
    const { error } = await supabase
      .from('media_channels')
      .insert({
        name: formData.name || 'New Channel',
        platform: formData.platform,
        channel_url: formData.channel_url,
        channel_id: formData.channel_id,
        subscribers: formData.subscribers,
        views: formData.views,
        is_active: true
      });

    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Канал добавлен' });
      fetchChannels();
      setIsDialogOpen(false);
      setFetchedChannelInfo(null);
      setFormData(prev => ({ ...prev, name: '', channel_url: '', channel_id: '', subscribers: 0, views: 0 }));
    }
  };

  const handleDeleteChannel = async (id: string) => {
    const { error } = await supabase.from('media_channels').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Канал удалён' });
      if (selectedChannelId === id) setSelectedChannelId(null);
      fetchChannels();
    }
  };

  // Filter logic
  const displayedChannels = selectedChannelId
    ? channels.filter(c => c.id === selectedChannelId)
    : channels;

  const totalSubscribers = displayedChannels.reduce((sum, ch) => sum + (ch.subscribers || 0), 0);
  const totalViews = displayedChannels.reduce((sum, ch) => sum + (ch.views || 0), 0);
  const totalRevenue = displayedChannels.reduce((sum, ch) => sum + (ch.revenue || 0), 0);

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
        <ApiSettingsDialog />
      </div>

      {/* Channel Selector */}
      <ChannelSelector
        channels={channels}
        selectedChannelId={selectedChannelId}
        onSelectChannel={setSelectedChannelId}
        onAddChannel={() => setIsDialogOpen(true)}
      />

      {/* Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md transition-all">
          <DialogHeader>
            <DialogTitle>Добавить канал</DialogTitle>
            <DialogDescription>Подключите канал для аналитики</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Платформа</Label>
              <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="vk_video">VK Видео</SelectItem>
                  <SelectItem value="rutube">RuTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Min-height container to prevent jumping when switching/loading */}
            <div className="space-y-4 min-h-[140px]">
              <div className="space-y-2">
                <Label>Ссылка или ID канала</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.channel_url}
                    onChange={(e) => setFormData({ ...formData, channel_url: e.target.value })}
                    placeholder={formData.platform === 'youtube' ? "@username или URL" : "URL канала"}
                  />
                  {formData.platform === 'youtube' && (
                    <Button variant="outline" onClick={handleFetchChannelInfo} disabled={isFetchingInfo}>
                      {isFetchingInfo ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>

              {fetchedChannelInfo ? (
                <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  {fetchedChannelInfo.thumbnails?.default?.url && (
                    <img src={fetchedChannelInfo.thumbnails.default.url} alt="Avatar" className="w-10 h-10 rounded-full" />
                  )}
                  <div>
                    <p className="font-bold text-sm">{fetchedChannelInfo.name}</p>
                    <p className="text-xs text-muted-foreground">{fetchedChannelInfo.subscribers?.toLocaleString()} подписчиков</p>
                  </div>
                  <Check className="ml-auto w-5 h-5 text-emerald-500" />
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  {/* Manual inputs shown when not fetched OR for non-YouTube platforms */}
                  <div className="space-y-2">
                    <Label>Название (Вручную)</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Название канала"
                    />
                  </div>
                </div>
              )}
            </div>

            {!fetchedChannelInfo && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Подписчики</Label>
                  <Input type="number" value={formData.subscribers} onChange={(e) => setFormData({ ...formData, subscribers: parseInt(e.target.value) || 0 })} />
                </div>
                {formData.platform !== 'telegram' && (
                  <div className="space-y-2">
                    <Label>Просмотры</Label>
                    <Input type="number" value={formData.views} onChange={(e) => setFormData({ ...formData, views: parseInt(e.target.value) || 0 })} />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleAddChannel} disabled={!formData.name && !fetchedChannelInfo}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Всего подписчиков</p>
                <h3 className="text-2xl font-bold">{totalSubscribers.toLocaleString()}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Eye className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Всего просмотров</p>
                <h3 className="text-2xl font-bold">{totalViews.toLocaleString()}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/10">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Общий доход</p>
                <h3 className="text-2xl font-bold">{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(totalRevenue)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Platform View */}
      {displayedChannels.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Детальная статистика</h2>
          {displayedChannels.map(channel => (
            <div key={channel.id} className="relative">
              <Card className="overflow-hidden bg-card/40 border-border/50">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${channel.platform === 'youtube' ? 'bg-red-500' :
                    channel.platform === 'telegram' ? 'bg-sky-500' : 'bg-gray-500'
                  }`} />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        {channel.name}
                        <Badge variant="outline" className="uppercase text-[10px]">{channel.platform}</Badge>
                      </h3>
                      <p className="text-sm text-muted-foreground">{channel.channel_url || 'Нет ссылки'}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteChannel(channel.id)}>
                      <Trash2 className="h-4 w-4 text-destructive/70" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Подписчики</p>
                      <p className="text-lg font-semibold">{channel.subscribers.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Просмотры</p>
                      <p className="text-lg font-semibold">{channel.views.toLocaleString()}</p>
                    </div>
                    {channel.is_monetized && (
                      <div>
                        <p className="text-xs text-muted-foreground">Доход</p>
                        <p className="text-lg font-semibold text-emerald-500">{channel.revenue.toLocaleString()} ₽</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Нет активных каналов. Добавьте первый канал!
        </div>
      )}
    </div>
  );
};

export default MediaAnalyticsPage;
