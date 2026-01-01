import { useState, useEffect, useRef } from 'react';
import { Bot, Send, RefreshCw, Plus, Trash2, Edit2, Check, X, Eye, EyeOff, Clock, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TelegramBot {
  id: string;
  name: string;
  token: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface TelegramChannel {
  id: string;
  name: string;
  username: string | null;
  subscribers: number;
  last_synced_at: string | null;
}

interface TelegramIntegrationProps {
  channels: TelegramChannel[];
  onSync?: () => void;
}

interface AutoSyncSettings {
  enabled: boolean;
  interval: number;
  unit: 'minutes' | 'hours';
}

const TelegramIntegration = ({ channels, onSync }: TelegramIntegrationProps) => {
  const { toast } = useToast();
  const [bots, setBots] = useState<TelegramBot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isBotDialogOpen, setIsBotDialogOpen] = useState(false);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<TelegramBot | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  const [autoSyncSettings, setAutoSyncSettings] = useState<AutoSyncSettings>({
    enabled: false,
    interval: 6,
    unit: 'hours',
  });
  const autoSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [botFormData, setBotFormData] = useState({
    name: '',
    token: '',
    description: '',
    is_active: true,
  });

  const [postFormData, setPostFormData] = useState({
    channel_username: '',
    text: '',
    parse_mode: 'HTML' as 'HTML' | 'Markdown' | 'MarkdownV2',
    disable_notification: false,
    button_text: '',
    button_url: '',
  });

  useEffect(() => {
    fetchBots();
    loadAutoSyncSettings();
  }, []);

  // Setup auto-sync interval
  useEffect(() => {
    if (autoSyncIntervalRef.current) {
      clearInterval(autoSyncIntervalRef.current);
      autoSyncIntervalRef.current = null;
    }

    if (autoSyncSettings.enabled && channels.length > 0) {
      const intervalMs = autoSyncSettings.unit === 'hours'
        ? autoSyncSettings.interval * 60 * 60 * 1000
        : autoSyncSettings.interval * 60 * 1000;

      autoSyncIntervalRef.current = setInterval(() => {
        handleSyncSubscribers();
      }, intervalMs);
    }

    return () => {
      if (autoSyncIntervalRef.current) {
        clearInterval(autoSyncIntervalRef.current);
      }
    };
  }, [autoSyncSettings, channels.length]);

  const loadAutoSyncSettings = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'telegram_auto_sync')
      .maybeSingle();

    if (data?.value) {
      const value = data.value as unknown as AutoSyncSettings;
      if (value.enabled !== undefined && value.interval !== undefined && value.unit !== undefined) {
        setAutoSyncSettings(value);
      }
    }
  };

  const saveAutoSyncSettings = async (settings: AutoSyncSettings) => {
    setAutoSyncSettings(settings);

    const { data: existing } = await supabase
      .from('app_settings')
      .select('id')
      .eq('key', 'telegram_auto_sync')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('app_settings')
        .update({ value: settings as any })
        .eq('key', 'telegram_auto_sync');
    } else {
      await supabase
        .from('app_settings')
        .insert({ key: 'telegram_auto_sync', value: settings as any });
    }

    toast({ title: 'Настройки сохранены' });
  };

  const fetchBots = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('telegram_bots').select('*').order('created_at', { ascending: false });
    if (data) setBots(data);
    setIsLoading(false);
  };

  const handleSyncSubscribers = async () => {
    setIsSyncing(true);
    try {
      // Get active bot token
      const activeBot = bots.find(b => b.is_active);
      if (!activeBot) {
        toast({
          title: 'Бот не настроен',
          description: 'Добавьте активный Telegram бот для синхронизации',
          variant: 'destructive'
        });
        setIsSyncing(false);
        return;
      }

      const response = await fetch('/api/telegram/sync-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: activeBot.token,
          channels: channels.map(c => ({ id: c.id, name: c.name, username: c.username }))
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update subscribers in database
        for (const result of data.results) {
          if (result.success) {
            await supabase
              .from('media_channels')
              .update({ subscribers: result.subscribers, last_synced_at: new Date().toISOString() })
              .eq('id', result.id);
          }
        }

        toast({
          title: 'Синхронизация завершена',
          description: `Обновлено каналов: ${data.results.filter((r: any) => r.success).length}`
        });
        onSync?.();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({ title: 'Ошибка синхронизации', description: error.message, variant: 'destructive' });
    }
    setIsSyncing(false);
  };

  const handlePublishPost = async () => {
    if (!postFormData.channel_username || !postFormData.text) {
      toast({ title: 'Ошибка', description: 'Заполните канал и текст сообщения', variant: 'destructive' });
      return;
    }

    // Get active bot
    const activeBot = bots.find(b => b.is_active);
    if (!activeBot) {
      toast({ title: 'Бот не настроен', description: 'Добавьте активный Telegram бот', variant: 'destructive' });
      return;
    }

    setIsPublishing(true);
    try {
      const payload: any = {
        token: activeBot.token,
        channel_id: '@' + postFormData.channel_username,
        text: postFormData.text,
        parse_mode: postFormData.parse_mode,
        disable_notification: postFormData.disable_notification,
      };

      if (postFormData.button_text && postFormData.button_url) {
        payload.buttons = [{ text: postFormData.button_text, url: postFormData.button_url }];
      }

      const response = await fetch('/api/telegram/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast({ title: 'Пост опубликован', description: `Message ID: ${data.message_id}` });
        setIsPostDialogOpen(false);
        setPostFormData({
          channel_username: '',
          text: '',
          parse_mode: 'HTML',
          disable_notification: false,
          button_text: '',
          button_url: '',
        });
      } else {
        toast({ title: 'Ошибка публикации', description: data.error, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
    setIsPublishing(false);
  };

  const handleBotSubmit = async () => {
    if (!botFormData.name || !botFormData.token) {
      toast({ title: 'Ошибка', description: 'Заполните обязательные поля', variant: 'destructive' });
      return;
    }

    if (editingBot) {
      const { error } = await supabase
        .from('telegram_bots')
        .update(botFormData)
        .eq('id', editingBot.id);

      if (error) {
        toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Бот обновлён' });
        fetchBots();
      }
    } else {
      const { error } = await supabase
        .from('telegram_bots')
        .insert(botFormData);

      if (error) {
        toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Бот добавлен' });
        fetchBots();
      }
    }

    setIsBotDialogOpen(false);
    resetBotForm();
  };

  const handleDeleteBot = async (id: string) => {
    const { error } = await supabase.from('telegram_bots').delete().eq('id', id);
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Бот удалён' });
      fetchBots();
    }
  };

  const handleEditBot = (bot: TelegramBot) => {
    setEditingBot(bot);
    setBotFormData({
      name: bot.name,
      token: bot.token,
      description: bot.description || '',
      is_active: bot.is_active,
    });
    setIsBotDialogOpen(true);
  };

  const resetBotForm = () => {
    setBotFormData({ name: '', token: '', description: '', is_active: true });
    setEditingBot(null);
  };

  const toggleShowToken = (id: string) => {
    setShowTokens(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskToken = (token: string) => {
    if (token.length <= 10) return '••••••••••';
    return token.slice(0, 6) + '••••••••' + token.slice(-4);
  };

  const getIntervalText = () => {
    if (!autoSyncSettings.enabled) return 'Выключено';
    const unit = autoSyncSettings.unit === 'hours' ? 'ч' : 'мин';
    return `Каждые ${autoSyncSettings.interval} ${unit}`;
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleSyncSubscribers} disabled={isSyncing} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Синхронизировать
        </Button>

        <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Send className="h-4 w-4" />
              Опубликовать пост
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Публикация поста в Telegram</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Канал *</Label>
                <Select
                  value={postFormData.channel_username}
                  onValueChange={(v) => setPostFormData({ ...postFormData, channel_username: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите канал" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map((ch) => (
                      <SelectItem key={ch.id} value={ch.username || ''}>
                        {ch.name} (@{ch.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Текст сообщения *</Label>
                <Textarea
                  value={postFormData.text}
                  onChange={(e) => setPostFormData({ ...postFormData, text: e.target.value })}
                  placeholder="Текст вашего поста..."
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Формат</Label>
                <Select
                  value={postFormData.parse_mode}
                  onValueChange={(v: any) => setPostFormData({ ...postFormData, parse_mode: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HTML">HTML</SelectItem>
                    <SelectItem value="Markdown">Markdown</SelectItem>
                    <SelectItem value="MarkdownV2">MarkdownV2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Текст кнопки</Label>
                  <Input
                    value={postFormData.button_text}
                    onChange={(e) => setPostFormData({ ...postFormData, button_text: e.target.value })}
                    placeholder="Подробнее"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL кнопки</Label>
                  <Input
                    value={postFormData.button_url}
                    onChange={(e) => setPostFormData({ ...postFormData, button_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={postFormData.disable_notification}
                  onCheckedChange={(checked) => setPostFormData({ ...postFormData, disable_notification: checked })}
                />
                <Label>Без уведомления</Label>
              </div>

              <Button onClick={handlePublishPost} disabled={isPublishing} className="w-full gap-2">
                <Send className="h-4 w-4" />
                {isPublishing ? 'Публикация...' : 'Опубликовать'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isBotDialogOpen} onOpenChange={(open) => { setIsBotDialogOpen(open); if (!open) resetBotForm(); }}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Bot className="h-4 w-4" />
              Управление ботами
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingBot ? 'Редактировать бота' : 'Telegram Боты'}</DialogTitle>
            </DialogHeader>

            {editingBot ? (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Название *</Label>
                  <Input
                    value={botFormData.name}
                    onChange={(e) => setBotFormData({ ...botFormData, name: e.target.value })}
                    placeholder="Notification Bot"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Token *</Label>
                  <Input
                    value={botFormData.token}
                    onChange={(e) => setBotFormData({ ...botFormData, token: e.target.value })}
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Input
                    value={botFormData.description}
                    onChange={(e) => setBotFormData({ ...botFormData, description: e.target.value })}
                    placeholder="Бот для уведомлений"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={botFormData.is_active}
                    onCheckedChange={(checked) => setBotFormData({ ...botFormData, is_active: checked })}
                  />
                  <Label>Активен</Label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleBotSubmit} className="flex-1">
                    <Check className="h-4 w-4 mr-1" />
                    Сохранить
                  </Button>
                  <Button variant="outline" onClick={() => resetBotForm()}>
                    <X className="h-4 w-4 mr-1" />
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setEditingBot({ id: '', name: '', token: '', description: null, is_active: true, created_at: '' })} className="gap-1">
                    <Plus className="h-4 w-4" />
                    Добавить бота
                  </Button>
                </div>

                {isLoading ? (
                  <div className="text-center text-muted-foreground py-4">Загрузка...</div>
                ) : bots.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Нет добавленных ботов</p>
                    <p className="text-xs mt-1">Создайте бота через @BotFather в Telegram</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {bots.map((bot) => (
                      <div key={bot.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{bot.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${bot.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {bot.is_active ? 'Активен' : 'Неактивен'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs text-muted-foreground font-mono truncate">
                              {showTokens[bot.id] ? bot.token : maskToken(bot.token)}
                            </code>
                            <button onClick={() => toggleShowToken(bot.id)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                              {showTokens[bot.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button size="icon" variant="ghost" onClick={() => handleEditBot(bot)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteBot(bot.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Auto-sync settings card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Автоматическая синхронизация
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Server-side cron job info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="p-2 rounded-full bg-emerald-500/20">
              <Check className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-500">Серверная синхронизация активна</p>
              <p className="text-xs text-muted-foreground">Автоматически каждые 6 часов, даже когда страница закрыта</p>
            </div>
          </div>

          {/* Client-side sync settings */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={autoSyncSettings.enabled}
                onCheckedChange={(checked) => {
                  const newSettings = { ...autoSyncSettings, enabled: checked };
                  saveAutoSyncSettings(newSettings);
                }}
              />
              <Label className="text-sm">Дополнительная синхронизация в браузере</Label>
            </div>

            {autoSyncSettings.enabled && (
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Каждые</Label>
                <Input
                  type="number"
                  min={1}
                  max={autoSyncSettings.unit === 'hours' ? 24 : 60}
                  value={autoSyncSettings.interval}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setAutoSyncSettings({ ...autoSyncSettings, interval: val });
                  }}
                  onBlur={() => saveAutoSyncSettings(autoSyncSettings)}
                  className="w-16 h-8"
                />
                <Select
                  value={autoSyncSettings.unit}
                  onValueChange={(v: 'minutes' | 'hours') => {
                    const newSettings = { ...autoSyncSettings, unit: v };
                    saveAutoSyncSettings(newSettings);
                  }}
                >
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">минут</SelectItem>
                    <SelectItem value="hours">часов</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TelegramIntegration;
