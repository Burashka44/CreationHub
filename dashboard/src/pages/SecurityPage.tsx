import SecurityStatus from '@/components/dashboard/SecurityStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Lock, Key, AlertTriangle, CheckCircle, Flame, Plus, Trash2, RefreshCw, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface FirewallRule {
  id: number;
  port: string;
  action: string;
  from: string;
  comment: string;
}

const SecurityPage = () => {
  const { t } = useLanguage();
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ufwStatus, setUfwStatus] = useState('unknown');
  const [fail2banBanned, setFail2banBanned] = useState(0);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  // New rule form
  const [newPort, setNewPort] = useState('');
  const [newProtocol, setNewProtocol] = useState('tcp');
  const [newComment, setNewComment] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ruleType, setRuleType] = useState<'custom' | 'app'>('app');
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  // Time ago helper
  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds} сек назад`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} мин назад`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч назад`;
    const days = Math.floor(hours / 24);
    return `${days} дн назад`;
  };

  // Load security events from activity_logs
  const fetchSecurityEvents = async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('activity_type', 'security')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setRecentEvents(data.map((e: any) => ({
        type: e.action_key?.includes('fail') || e.action_key?.includes('block') || e.action_key?.includes('warn') ? 'warning' : 'success',
        message: e.action_key,
        ip: e.target || 'system',
        time: timeAgo(e.created_at)
      })));
    }
  };

  // Load security settings
  useEffect(() => {
    loadSecurityData();
    fetchServices();
    fetchSecurityEvents();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*').order('name');
    if (data) setServices(data);
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setNewPort(service.port);
      setNewComment(service.name);
    }
  };

  const loadSecurityData = async () => {
    setIsLoading(true);
    try {
      // Load from security_settings
      const { data } = await supabase
        .from('security_settings')
        .select('setting_key, setting_value')
        .eq('setting_key', 'realtime')
        .single();

      if (data?.setting_value) {
        const val = data.setting_value as any;
        setUfwStatus(val.ufw?.status || 'unknown');
        setFail2banBanned(val.fail2ban?.banned || 0);
      }

      // Load firewall rules from firewall_rules table
      const { data: rules } = await supabase
        .from('firewall_rules')
        .select('*')
        .order('id');

      if (rules) {
        setFirewallRules(rules.map((r: any, idx: number) => ({
          id: r.id || idx + 1,
          port: r.port,
          action: r.action,
          from: r.from_ip || 'Anywhere',
          comment: r.comment || ''
        })));
      }
    } catch (e) {
      console.error('Error loading security data:', e);
    }
    setIsLoading(false);
  };

  const handleAddRule = async () => {
    if (!newPort) {
      toast.error('Укажите порт');
      return;
    }

    const port = `${newPort}/${newProtocol}`;

    try {
      // Insert to firewall_rules table
      const { error } = await supabase.from('firewall_rules').insert({
        port,
        action: 'ALLOW',
        from_ip: 'Anywhere',
        comment: newComment || `Port ${newPort}`
      });

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        action_key: 'firewallRuleAdded',
        target: port,
        user_name: 'Admin',
        activity_type: 'security'
      });

      toast.success(`Правило для ${port} добавлено`, {
        description: 'Выполните reload UFW на сервере'
      });

      setNewPort('');
      setNewComment('');
      setDialogOpen(false);
      loadSecurityData();
    } catch (e) {
      toast.error('Ошибка добавления правила');
    }
  };

  const handleDeleteRule = async (rule: FirewallRule) => {
    try {
      const { error } = await supabase
        .from('firewall_rules')
        .delete()
        .eq('id', rule.id);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        action_key: 'firewallRuleDeleted',
        target: rule.port,
        user_name: 'Admin',
        activity_type: 'security'
      });

      toast.success(`Правило ${rule.port} удалено`);
      loadSecurityData();
    } catch (e) {
      toast.error('Ошибка удаления');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <Shield className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('security')}</h1>
            <p className="text-muted-foreground">Защита и мониторинг безопасности</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={ufwStatus === 'active' ? 'default' : 'destructive'} className="gap-1">
            <Flame className="h-3 w-3" />
            UFW: {ufwStatus}
          </Badge>
          {fail2banBanned > 0 && (
            <Badge variant="destructive">{fail2banBanned} banned</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SecurityStatus />

        {/* Firewall Rules */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Правила файрвола (UFW)
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={loadSecurityData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" /> Добавить
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Добавить правило UFW</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <RadioGroup defaultValue="app" value={ruleType} onValueChange={(v: 'custom' | 'app') => setRuleType(v)} className="flex gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="app" id="r-app" />
                        <Label htmlFor="r-app">Приложение</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="r-custom" />
                        <Label htmlFor="r-custom">Свой порт</Label>
                      </div>
                    </RadioGroup>

                    {ruleType === 'app' && (
                      <div className="space-y-2">
                        <Select value={selectedServiceId} onValueChange={handleServiceSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите приложение..." />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map(s => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                {s.name} ({s.port})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Input
                        placeholder="Порт (например 3000)"
                        value={newPort}
                        onChange={(e) => setNewPort(e.target.value)}
                        className={`flex-1 ${ruleType === 'app' ? 'bg-muted' : ''}`}
                        readOnly={ruleType === 'app'}
                      />
                      <Select value={newProtocol} onValueChange={setNewProtocol}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tcp">TCP</SelectItem>
                          <SelectItem value="udp">UDP</SelectItem>
                          <SelectItem value="any">Any</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Input
                      placeholder="Комментарий (например: My App)"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button onClick={handleAddRule} className="w-full gap-2">
                      <Plus className="h-4 w-4" /> Добавить правило
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {firewallRules.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  Нет правил в базе. Добавьте правила или синхронизируйте с UFW.
                </p>
              ) : (
                firewallRules.map((rule) => {
                  const isWan = rule.from === 'Anywhere' || rule.from === '0.0.0.0/0';
                  return (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {rule.port}
                        </Badge>
                        <div className="flex flex-col">
                          <span className="text-sm text-foreground font-medium">{rule.comment.replace(' (LAN)', '').replace(' (WAN)', '')}</span>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            {isWan ? <Globe className="h-3 w-3 text-primary" /> : <Shield className="h-3 w-3 text-emerald-500" />}
                            {isWan ? 'Доступен из Интернет (WAN)' : 'Только локальная сеть (LAN)'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={isWan ? 'WAN' : 'LAN'}
                          onValueChange={async (val) => {
                            const newFrom = val === 'WAN' ? 'Anywhere' : '192.168.0.0/16';
                            const newComment = rule.comment.replace(/ \((LAN|WAN)\)/, '') + ` (${val})`;

                            // Optimistic update
                            setFirewallRules(prev => prev.map(r => r.id === rule.id ? { ...r, from: newFrom, comment: newComment } : r));

                            const { error } = await supabase
                              .from('firewall_rules')
                              .update({ from_ip: newFrom, comment: newComment })
                              .eq('id', rule.id);

                            if (error) {
                              toast.error('Ошибка обновления правила');
                              loadSecurityData(); // Revert
                            } else {
                              toast.success(`Правило обновлено: ${val}`);
                            }
                          }}
                        >
                          <SelectTrigger className={`w-24 h-8 text-xs ${isWan ? 'border-primary/50 text-primary' : 'border-emerald-500/50 text-emerald-500'}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WAN">WAN 🌍</SelectItem>
                            <SelectItem value="LAN">LAN 🏠</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Only show delete if it is a custom rule (no service attached) or if we want to allow removing the rule to revert to Default LAN */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteRule(rule)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Implicit Services (No Rule Yet) */}
              {services.filter(s => !firewallRules.find(r => r.port.startsWith(s.port.split('/')[0]))).map((service) => (
                <div
                  key={`svc-${service.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">
                      {service.port}
                    </Badge>
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground font-medium">{service.name}</span>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Shield className="h-3 w-3 text-emerald-500" />
                        Только локальная сеть (LAN)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value="LAN"
                      onValueChange={async (val) => {
                        if (val === 'WAN') {
                          // Create Rule
                          const port = service.port.includes('/') ? service.port : `${service.port}/tcp`;
                          const { error } = await supabase.from('firewall_rules').insert({
                            port,
                            action: 'ALLOW',
                            from_ip: 'Anywhere',
                            comment: `${service.name} (WAN)`
                          });
                          if (error) toast.error('Ошибка создания правила');
                          else {
                            toast.success('Правило создано: WAN');
                            loadSecurityData();
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-24 h-8 text-xs border-emerald-500/50 text-emerald-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WAN">WAN 🌍</SelectItem>
                        <SelectItem value="LAN">LAN 🏠</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={async () => {
                        // Create a DENY rule to explicitly block this port
                        const port = service.port.includes('/') ? service.port : `${service.port}/tcp`;
                        const { error } = await supabase.from('firewall_rules').insert({
                          port,
                          action: 'DENY',
                          from_ip: 'Anywhere',
                          comment: `${service.name} (Blocked)`
                        });
                        if (error) toast.error('Ошибка создания правила');
                        else {
                          toast.success(`Порт ${service.port} заблокирован`);
                          loadSecurityData();
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Последние события
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentEvents.length === 0 ? (
              <div className="col-span-2 text-center text-muted-foreground py-4">
                Нет событий безопасности
              </div>
            ) : (
              recentEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  {event.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{event.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground font-mono">{event.ip}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{event.time}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div >
  );
};

export default SecurityPage;
