import { useState, useEffect } from 'react';
import { Settings, Key, Eye, EyeOff, Check, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ApiConfig {
  id: string;
  name: string;
  description: string;
  keyName: string;
  docsUrl: string;
  placeholder: string;
  isConfigured: boolean;
}

const apiConfigs: ApiConfig[] = [
  {
    id: 'youtube',
    name: 'YouTube Data API v3',
    description: 'Получение статистики каналов, видео, подписчиков и монетизации',
    keyName: 'YOUTUBE_API_KEY',
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
    placeholder: 'AIzaSy...',
    isConfigured: false,
  },
  {
    id: 'twitch',
    name: 'Twitch API',
    description: 'Аналитика стримов, подписчиков и зрителей',
    keyName: 'TWITCH_CLIENT_ID',
    docsUrl: 'https://dev.twitch.tv/console/apps',
    placeholder: 'uo6dggojyb...',
    isConfigured: false,
  },
  {
    id: 'twitch_secret',
    name: 'Twitch Client Secret',
    description: 'Секретный ключ для аутентификации Twitch API',
    keyName: 'TWITCH_CLIENT_SECRET',
    docsUrl: 'https://dev.twitch.tv/console/apps',
    placeholder: '41vpdji4e9...',
    isConfigured: false,
  },
  {
    id: 'vk',
    name: 'VK API',
    description: 'Статистика VK Видео и сообществ',
    keyName: 'VK_ACCESS_TOKEN',
    docsUrl: 'https://dev.vk.com/api/access-token/getting-started',
    placeholder: 'vk1.a.xxx...',
    isConfigured: false,
  },
  {
    id: 'telegram_bot',
    name: 'Telegram Bot Token',
    description: 'Токен бота для отправки уведомлений и управления каналами',
    keyName: 'TELEGRAM_BOT_TOKEN',
    docsUrl: 'https://t.me/BotFather',
    placeholder: '123456:ABC-DEF...',
    isConfigured: false,
  },
];

export const ApiSettingsDialog = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [configuredApis, setConfiguredApis] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      checkApiStatus();
    }
  }, [isOpen]);

  const checkApiStatus = async () => {
    // Check YouTube API status
    try {
      const { data } = await supabase.functions.invoke('fetch-youtube-stats', {
        body: { checkOnly: true }
      });
      setConfiguredApis(prev => ({ ...prev, youtube: data?.configured || false }));
    } catch (e) {
      console.log('YouTube API check failed');
    }
  };

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveKey = async (config: ApiConfig) => {
    const key = apiKeys[config.id];
    if (!key) {
      toast({ title: 'Ошибка', description: 'Введите API ключ', variant: 'destructive' });
      return;
    }

    toast({ 
      title: 'Информация', 
      description: `Для сохранения ${config.keyName} используйте Supabase Dashboard → Settings → Secrets` 
    });
  };

  const handleSyncData = async (platform: string) => {
    setIsSyncing(prev => ({ ...prev, [platform]: true }));
    
    try {
      let functionName = '';
      switch (platform) {
        case 'youtube':
          functionName = 'fetch-youtube-stats';
          break;
        case 'telegram':
          functionName = 'fetch-telegram-stats';
          break;
        default:
          throw new Error('Платформа не поддерживается');
      }

      const { data, error } = await supabase.functions.invoke(functionName);
      
      if (error) throw error;
      
      if (data?.configured === false) {
        toast({ 
          title: 'API не настроен', 
          description: `Добавьте API ключ для ${platform}`,
          variant: 'destructive'
        });
      } else {
        toast({ 
          title: 'Синхронизация завершена', 
          description: `Данные ${platform} обновлены` 
        });
      }
    } catch (error: any) {
      toast({ 
        title: 'Ошибка синхронизации', 
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(prev => ({ ...prev, [platform]: false }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Настройки API
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Настройки API интеграций
          </DialogTitle>
          <DialogDescription>
            Настройте API ключи для автоматического получения статистики с различных платформ
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="video" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="video">Видеоплатформы</TabsTrigger>
            <TabsTrigger value="messaging">Мессенджеры</TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="space-y-4 mt-4">
            {apiConfigs
              .filter(c => ['youtube', 'twitch', 'twitch_secret', 'vk'].includes(c.id))
              .map(config => (
                <Card key={config.id} className="bg-card/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {config.name}
                          {configuredApis[config.id] ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              <Check className="h-3 w-3 mr-1" />
                              Настроен
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Не настроен
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {config.description}
                        </CardDescription>
                      </div>
                      {configuredApis[config.id] && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSyncData(config.id)}
                          disabled={isSyncing[config.id]}
                        >
                          {isSyncing[config.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{config.keyName}</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showKeys[config.id] ? 'text' : 'password'}
                            placeholder={config.placeholder}
                            value={apiKeys[config.id] || ''}
                            onChange={(e) => setApiKeys(prev => ({ ...prev, [config.id]: e.target.value }))}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => toggleShowKey(config.id)}
                          >
                            {showKeys[config.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <Button onClick={() => handleSaveKey(config)} disabled={!apiKeys[config.id]}>
                          Сохранить
                        </Button>
                      </div>
                    </div>
                    <a 
                      href={config.docsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Получить API ключ →
                    </a>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="messaging" className="space-y-4 mt-4">
            {apiConfigs
              .filter(c => ['telegram_bot'].includes(c.id))
              .map(config => (
                <Card key={config.id} className="bg-card/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {config.name}
                          {configuredApis[config.id] ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              <Check className="h-3 w-3 mr-1" />
                              Настроен
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Не настроен
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {config.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{config.keyName}</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showKeys[config.id] ? 'text' : 'password'}
                            placeholder={config.placeholder}
                            value={apiKeys[config.id] || ''}
                            onChange={(e) => setApiKeys(prev => ({ ...prev, [config.id]: e.target.value }))}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => toggleShowKey(config.id)}
                          >
                            {showKeys[config.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <Button onClick={() => handleSaveKey(config)} disabled={!apiKeys[config.id]}>
                          Сохранить
                        </Button>
                      </div>
                    </div>
                    <a 
                      href={config.docsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Получить API ключ →
                    </a>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border/50">
          <h4 className="font-medium text-sm mb-2">Как добавить API ключи?</h4>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Перейдите по ссылке для получения API ключа</li>
            <li>Создайте проект/приложение на платформе разработчика</li>
            <li>Скопируйте API ключ и вставьте в поле выше</li>
            <li>После сохранения данные будут автоматически синхронизироваться</li>
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
};
