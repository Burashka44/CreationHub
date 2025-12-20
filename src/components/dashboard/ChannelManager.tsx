import { useState } from 'react';
import { Youtube, MessageCircle, Video, Plus, Trash2, ExternalLink, Key, LogIn } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Channel {
  id: string;
  name: string;
  platform: 'youtube' | 'tiktok' | 'telegram' | 'rutube';
  url?: string;
  status: 'connected' | 'pending' | 'error';
  authType: 'google' | 'api_key' | 'manual';
}

const platformConfig = {
  youtube: {
    icon: Youtube,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    name: 'YouTube',
    supportsGoogle: true,
  },
  tiktok: {
    icon: Video,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    name: 'TikTok',
    supportsGoogle: false,
  },
  telegram: {
    icon: MessageCircle,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/30',
    name: 'Telegram',
    supportsGoogle: false,
  },
  rutube: {
    icon: Video,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    name: 'RuTube',
    supportsGoogle: false,
  },
};

const ChannelManager = () => {
  const { t } = useLanguage();
  const [channels, setChannels] = useState<Channel[]>([
    { id: '1', name: 'Tech Channel', platform: 'youtube', status: 'connected', authType: 'google' },
    { id: '2', name: '@innoguru_news', platform: 'telegram', status: 'connected', authType: 'api_key' },
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newChannel, setNewChannel] = useState({
    name: '',
    platform: 'youtube' as Channel['platform'],
    url: '',
    apiKey: '',
  });

  const handleAddChannel = () => {
    const channel: Channel = {
      id: Date.now().toString(),
      name: newChannel.name,
      platform: newChannel.platform,
      url: newChannel.url,
      status: 'pending',
      authType: newChannel.apiKey ? 'api_key' : 'manual',
    };
    setChannels([...channels, channel]);
    setNewChannel({ name: '', platform: 'youtube', url: '', apiKey: '' });
    setIsDialogOpen(false);
  };

  const handleDeleteChannel = (id: string) => {
    setChannels(channels.filter(ch => ch.id !== id));
  };

  const handleGoogleAuth = () => {
    // Simulate Google OAuth
    console.log('Initiating Google OAuth...');
  };

  const getStatusBadge = (status: Channel['status']) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{t('online')}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>;
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          {t('channels')}
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              {t('addChannel')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">{t('addChannel')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="platform" className="text-muted-foreground">{t('platform')}</Label>
                <Select
                  value={newChannel.platform}
                  onValueChange={(val) => setNewChannel({ ...newChannel, platform: val as Channel['platform'] })}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {Object.entries(platformConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key} className="focus:bg-muted">
                        <div className="flex items-center gap-2">
                          <config.icon className={`h-4 w-4 ${config.color}`} />
                          {config.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-muted-foreground">{t('channelName')}</Label>
                <Input
                  id="name"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                  placeholder="My Channel"
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">{t('credentials')}</Label>
                
                {platformConfig[newChannel.platform].supportsGoogle && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 border-border hover:bg-muted"
                    onClick={handleGoogleAuth}
                  >
                    <LogIn className="h-4 w-4" />
                    {t('connectGoogle')}
                  </Button>
                )}

                <div className="relative">
                  {platformConfig[newChannel.platform].supportsGoogle && (
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                  )}
                  {platformConfig[newChannel.platform].supportsGoogle && (
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">или</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="apiKey" className="text-muted-foreground flex items-center gap-2">
                    <Key className="h-3 w-3" />
                    {t('apiKey')}
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={newChannel.apiKey}
                    onChange={(e) => setNewChannel({ ...newChannel, apiKey: e.target.value })}
                    placeholder="••••••••••••••••"
                    className="bg-background border-border"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-border"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t('cancel')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddChannel}
                  disabled={!newChannel.name}
                >
                  {t('save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {channels.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Нет подключенных каналов
            </p>
          ) : (
            channels.map((channel) => {
              const config = platformConfig[channel.platform];
              const Icon = config.icon;
              
              return (
                <div
                  key={channel.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${config.bgColor} ${config.borderColor} transition-all hover:scale-[1.01]`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{channel.name}</p>
                      <p className="text-sm text-muted-foreground">{config.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(channel.status)}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteChannel(channel.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChannelManager;
