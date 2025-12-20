import { useState, useEffect } from 'react';
import { Bot, Send, RefreshCw, Plus, Trash2, Edit2, Check, X, Eye, EyeOff, MessageSquare, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const TelegramIntegration = () => {
  const { toast } = useToast();
  const [bots, setBots] = useState<TelegramBot[]>([]);
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isBotDialogOpen, setIsBotDialogOpen] = useState(false);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<TelegramBot | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  
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
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    const [botsResult, channelsResult] = await Promise.all([
      supabase.from('telegram_bots').select('*').order('created_at', { ascending: false }),
      supabase.from('media_channels').select('id, name, username, subscribers, last_synced_at')
        .eq('platform', 'telegram').eq('is_active', true)
    ]);

    if (botsResult.data) setBots(botsResult.data);
    if (channelsResult.data) setChannels(channelsResult.data);
    
    setIsLoading(false);
  };

  const handleSyncSubscribers = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-telegram-stats');
      
      if (error) throw error;
      
      if (data.configured === false) {
        toast({ 
          title: 'Бот не настроен', 
          description: 'Добавьте активный Telegram бот для синхронизации',
          variant: 'destructive'
        });
      } else if (data.success) {
        toast({ 
          title: 'Синхронизация завершена', 
          description: `Обновлено каналов: ${data.results?.filter((r: any) => r.success).length || 0}`
        });
        fetchData();
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

    setIsPublishing(true);
    try {
      const payload: any = {
        channel_username: postFormData.channel_username,
        text: postFormData.text,
        parse_mode: postFormData.parse_mode,
        disable_notification: postFormData.disable_notification,
      };

      if (postFormData.button_text && postFormData.button_url) {
        payload.buttons = [{ text: postFormData.button_text, url: postFormData.button_url }];
      }

      const { data, error } = await supabase.functions.invoke('publish-telegram-post', { body: payload });
      
      if (error) throw error;
      
      if (data.configured === false) {
        toast({ 
          title: 'Бот не настроен', 
          description: 'Добавьте активный Telegram бот',
          variant: 'destructive'
        });
      } else if (data.success) {
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
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('telegram_bots')
        .insert(botFormData);
      
      if (error) {
        toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Бот добавлен' });
        fetchData();
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
      fetchData();
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

  const formatDate = (date: string | null) => {
    if (!date) return 'Никогда';
    return new Date(date).toLocaleString('ru-RU');
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSyncSubscribers} disabled={isSyncing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Синхронизировать подписчиков
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
      </div>

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="channels" className="gap-2">
            <Users className="h-4 w-4" />
            Каналы
          </TabsTrigger>
          <TabsTrigger value="bots" className="gap-2">
            <Bot className="h-4 w-4" />
            Боты
          </TabsTrigger>
        </TabsList>

        <TabsContent value="channels">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Telegram Каналы
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center text-muted-foreground py-4">Загрузка...</div>
              ) : channels.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  Нет Telegram каналов. Добавьте каналы на вкладке "Telegram" выше.
                </div>
              ) : (
                <div className="space-y-3">
                  {channels.map((channel) => (
                    <div key={channel.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-foreground">{channel.name}</span>
                          <span className="text-sm text-muted-foreground">@{channel.username}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {channel.subscribers.toLocaleString('ru-RU')} подписчиков
                          </span>
                          <span>Синхронизация: {formatDate(channel.last_synced_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bots">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Telegram Боты
                </CardTitle>
                <Dialog open={isBotDialogOpen} onOpenChange={(open) => { setIsBotDialogOpen(open); if (!open) resetBotForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />
                      Добавить
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingBot ? 'Редактировать бота' : 'Добавить бота'}</DialogTitle>
                    </DialogHeader>
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
                        <p className="text-xs text-muted-foreground">
                          Получите токен у @BotFather в Telegram
                        </p>
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
                        <Button variant="outline" onClick={() => setIsBotDialogOpen(false)}>
                          <X className="h-4 w-4 mr-1" />
                          Отмена
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="text-center text-muted-foreground py-4">Загрузка...</div>
              ) : bots.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  Нет добавленных ботов. Создайте бота через @BotFather в Telegram.
                </div>
              ) : (
                bots.map((bot) => (
                  <div key={bot.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{bot.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${bot.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {bot.is_active ? 'Активен' : 'Неактивен'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs text-muted-foreground font-mono">
                          {showTokens[bot.id] ? bot.token : maskToken(bot.token)}
                        </code>
                        <button onClick={() => toggleShowToken(bot.id)} className="text-muted-foreground hover:text-foreground">
                          {showTokens[bot.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                      </div>
                      {bot.description && (
                        <p className="text-xs text-muted-foreground mt-1">{bot.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEditBot(bot)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteBot(bot.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TelegramIntegration;
