import { useState, useEffect } from 'react';
import { Bot, Plus, Trash2, Edit2, Check, X, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface TelegramBot {
  id: string;
  name: string;
  token: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const TelegramBotsManager = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [bots, setBots] = useState<TelegramBot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<TelegramBot | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  
  const [formData, setFormData] = useState({
    name: '',
    token: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    const { data, error } = await supabase
      .from('telegram_bots')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      setBots(data || []);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.token) {
      toast({ title: t('error'), description: 'Заполните обязательные поля', variant: 'destructive' });
      return;
    }

    if (editingBot) {
      const { error } = await supabase
        .from('telegram_bots')
        .update(formData)
        .eq('id', editingBot.id);
      
      if (error) {
        toast({ title: t('error'), description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Бот обновлён' });
        fetchBots();
      }
    } else {
      const { error } = await supabase
        .from('telegram_bots')
        .insert(formData);
      
      if (error) {
        toast({ title: t('error'), description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Бот добавлен' });
        fetchBots();
      }
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('telegram_bots')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Бот удалён' });
      fetchBots();
    }
  };

  const handleEdit = (bot: TelegramBot) => {
    setEditingBot(bot);
    setFormData({
      name: bot.name,
      token: bot.token,
      description: bot.description || '',
      is_active: bot.is_active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', token: '', description: '', is_active: true });
    setEditingBot(null);
  };

  const toggleShowToken = (id: string) => {
    setShowTokens(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskToken = (token: string) => {
    if (token.length <= 10) return '••••••••••';
    return token.slice(0, 6) + '••••••••' + token.slice(-4);
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Telegram Боты
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Notification Bot"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Token *</Label>
                  <Input
                    value={formData.token}
                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Бот для уведомлений"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Активен</Label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSubmit} className="flex-1">
                    <Check className="h-4 w-4 mr-1" />
                    {t('save')}
                  </Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    <X className="h-4 w-4 mr-1" />
                    {t('cancel')}
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
          <div className="text-center text-muted-foreground py-4">Нет добавленных ботов</div>
        ) : (
          bots.map((bot) => (
            <div key={bot.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{bot.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${bot.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {bot.is_active ? t('active') : t('inactive')}
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
                <Button size="icon" variant="ghost" onClick={() => handleEdit(bot)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(bot.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default TelegramBotsManager;
