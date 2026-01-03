import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Server, ExternalLink, Settings, Shield, Database,
  Container, Terminal, Key, Activity, Workflow, Youtube,
  Mic, Chrome, Rss, Languages, BarChart3, Cloud, FolderOpen,
  Users, FileText, HardDrive, Bell, Eye, Search, Plus, Trash2,
  RefreshCw, Edit2, TrendingUp, Clock, CheckCircle, XCircle,
  AlertCircle, Loader2, Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  port: string;
  url: string | null;
  icon: string;
  is_active: boolean;
  status: string | null;
  last_check_at: string | null;
  response_time_ms: number | null;
  created_at: string;
}

interface UptimeRecord {
  id: string;
  service_id: string;
  status: string;
  response_time_ms: number | null;
  checked_at: string;
}

const iconMap: Record<string, React.ReactNode> = {
  'container': <Container className="h-5 w-5" />,
  'shield': <Shield className="h-5 w-5" />,
  'activity': <Activity className="h-5 w-5" />,
  'key': <Key className="h-5 w-5" />,
  'database': <Database className="h-5 w-5" />,
  'bell': <Bell className="h-5 w-5" />,
  'terminal': <Terminal className="h-5 w-5" />,
  'workflow': <Workflow className="h-5 w-5" />,
  'youtube': <Youtube className="h-5 w-5" />,
  'mic': <Mic className="h-5 w-5" />,
  'chrome': <Chrome className="h-5 w-5" />,
  'rss': <Rss className="h-5 w-5" />,
  'languages': <Languages className="h-5 w-5" />,
  'bar-chart-3': <BarChart3 className="h-5 w-5" />,
  'cloud': <Cloud className="h-5 w-5" />,
  'folder-open': <FolderOpen className="h-5 w-5" />,
  'users': <Users className="h-5 w-5" />,
  'file-text': <FileText className="h-5 w-5" />,
  'hard-drive': <HardDrive className="h-5 w-5" />,
  'eye': <Eye className="h-5 w-5" />,
  'server': <Server className="h-5 w-5" />,
};

const ServicesPage = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [uptimeData, setUptimeData] = useState<Record<string, UptimeRecord[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [serverIp, setServerIp] = useState(window.location.hostname || '192.168.1.220');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'admin',
    port: '',
    url: '',
    icon: 'server',
    is_active: true,
  });

  const [firewallRules, setFirewallRules] = useState<any[]>([]);

  useEffect(() => {
    fetchServices();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'serverIp')
      .single();

    if (data?.value?.ip) {
      setServerIp(data.value.ip);
    }
  };

  // Auto-check services when they are loaded and then every 60s
  useEffect(() => {
    if (services.length > 0) {
      // Initial check
      checkAllServices();

      // Periodic check
      const interval = setInterval(() => {
        checkAllServices();
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [services.length]); // Only re-run if services array size changes (loaded)

  const fetchServices = async () => {
    setIsLoading(true);

    // 1. Fetch Services
    const { data: servicesData, error } = await supabase
      .from('services')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    // 2. Fetch Firewall Rules
    const { data: rulesData } = await supabase
      .from('firewall_rules')
      .select('port, from_ip');

    if (rulesData) {
      setFirewallRules(rulesData);
    }

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      setServices(servicesData || []);
    }
    setIsLoading(false);
  };

  const getServiceScope = (servicePort: string) => {
    if (!servicePort) return 'LAN';
    const portStr = servicePort.includes('/') ? servicePort : `${servicePort}/tcp`;
    // Also check for raw port number match
    const rule = firewallRules.find(r => r.port === portStr || r.port === servicePort);

    if (rule && (rule.from_ip === 'Anywhere' || rule.from_ip === '0.0.0.0/0')) {
      return 'WAN';
    }
    return 'LAN';
  };

  const fetchUptimeHistory = async (serviceId: string) => {
    const { data, error } = await supabase
      .from('service_uptime')
      .select('*')
      .eq('service_id', serviceId)
      .order('checked_at', { ascending: true })
      .limit(100);

    if (!error && data) {
      setUptimeData(prev => ({ ...prev, [serviceId]: data }));
    }
  };

  const checkServiceStatus = async (service: Service): Promise<string> => {
    // Determine target host
    const port = service.port.toString().split(/\D/)[0]; // Extract numeric port
    // If running in docker, using internal hostname might be better? 
    // Ideally we ping the IP defined in settings (serverIp)
    const target = `${serverIp}:${port}`;

    try {
      const response = await fetch('/api/v1/system/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: target, method: 'ping' }), // Use 'ping' (ICMP) or 'http'
      });

      if (response.ok) {
        const result = await response.json();
        // Result format: { success: true, data: { status: 'online', ... } }
        if (result.success && result.data?.status === 'online') {
          return 'online';
        }
      }
      return 'offline';
    } catch (error) {
      console.error(`Check failed for ${service.name}:`, error);
      return 'offline';
    }
  };

  const checkAllServices = async () => {
    setIsChecking(true);
    const newStatusMap: Record<string, string> = {};
    let onlineCount = 0;

    // Toast start
    toast({
      title: 'Проверка доступности...',
      description: 'Пингуем сервисы локально',
    });

    const checkPromises = services.map(async (service) => {
      // Skip if no port
      if (!service.port) {
        newStatusMap[service.id] = 'offline';
        return;
      }

      const status = await checkServiceStatus(service);
      newStatusMap[service.id] = status;
      if (status === 'online') onlineCount++;

      // Update local state immediately for responsiveness if desired, 
      // but here we batch update after or update DB?
      // Updating DB from client is risky if RLS is strict, but let's try updating state first.
    });

    await Promise.all(checkPromises);

    // Update state to show colors immediately
    setServices(prev => prev.map(s => ({
      ...s,
      status: newStatusMap[s.id] || 'offline',
      last_check_at: new Date().toISOString()
    })));

    toast({
      title: 'Проверка завершена',
      description: `Онлайн: ${onlineCount} из ${services.length}`,
    });

    setIsChecking(false);
  };

  const checkSingleService = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    const status = await checkServiceStatus(service);

    // Update local state
    setServices(prev => prev.map(s =>
      s.id === serviceId
        ? { ...s, status, last_check_at: new Date().toISOString() }
        : s
    ));

    toast({
      title: status === 'online' ? 'Онлайн' : 'Офлайн',
      description: `${service.name}: ${status}`,
    });
  };

  const handleAddService = async () => {
    if (!formData.name || !formData.port) {
      toast({ title: 'Ошибка', description: 'Заполните обязательные поля', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('services')
      .insert({
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        port: formData.port,
        url: formData.url || null,
        icon: formData.icon,
        is_active: formData.is_active,
      });

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Сервис добавлен' });
      fetchServices();
      setIsAddDialogOpen(false);
      resetForm();
    }
  };

  const handleUpdateService = async () => {
    if (!selectedService) return;

    const oldPort = selectedService.port;
    const oldName = selectedService.name;

    // 1. Update Service
    const { error } = await supabase
      .from('services')
      .update({
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        port: formData.port,
        url: formData.url || null,
        icon: formData.icon,
        is_active: formData.is_active,
      })
      .eq('id', selectedService.id);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      // 2. Cascade Update to Firewall Rules
      // If port or name changed, we should try to update the corresponding rule
      if (oldPort !== formData.port || oldName !== formData.name) {
        // Find rule with old port
        const oldPortClean = oldPort.includes('/') ? oldPort : `${oldPort}/tcp`;
        const newPortClean = formData.port.includes('/') ? formData.port : `${formData.port}/tcp`;

        const { data: existingRules } = await supabase
          .from('firewall_rules')
          .select('*')
          .eq('port', oldPortClean);

        if (existingRules && existingRules.length > 0) {
          const ruleId = existingRules[0].id;
          // Update the rule
          // We also update the comment to match the new name if it was auto-generated
          await supabase
            .from('firewall_rules')
            .update({
              port: newPortClean,
              comment: existingRules[0].comment.replace(oldName, formData.name) // Basic attempt to preserve suffix
            })
            .eq('id', ruleId);
        }
      }

      toast({ title: 'Сервис и правила обновлены' });
      fetchServices();
      setIsEditDialogOpen(false);
      setSelectedService(null);
      resetForm();
    }
  };

  const handleDeleteService = async (id: string) => {
    // Get service details first to know which port to delete
    const serviceToDelete = services.find(s => s.id === id);
    if (!serviceToDelete) return;

    const { error } = await supabase.from('services').delete().eq('id', id);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      // Cascade delete firewall rule
      const portClean = serviceToDelete.port.includes('/') ? serviceToDelete.port : `${serviceToDelete.port}/tcp`;
      await supabase.from('firewall_rules').delete().eq('port', portClean);

      toast({ title: 'Сервис и правило удалены' });
      fetchServices();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'admin',
      port: '',
      url: '',
      icon: 'server',
      is_active: true,
    });
  };

  const openEditDialog = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      category: service.category,
      port: service.port,
      url: service.url || '',
      icon: service.icon,
      is_active: service.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const openStatsDialog = (service: Service) => {
    setSelectedService(service);
    fetchUptimeHistory(service.id);
    setIsStatsDialogOpen(true);
  };

  const categories = [
    { id: 'all', label: 'Все', icon: <Server className="h-4 w-4" /> },
    { id: 'admin', label: 'Админ', icon: <Settings className="h-4 w-4" /> },
    { id: 'work', label: 'Работа', icon: <Workflow className="h-4 w-4" /> },
    { id: 'data', label: 'Данные', icon: <Database className="h-4 w-4" /> },
    { id: 'ai', label: 'AI', icon: <Activity className="h-4 w-4" /> },
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'work': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'data': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'ai': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getServiceUrl = (service: Service) => {
    if (service.url) return service.url;
    // Handle "8083/tcp" or "8083"
    const port = service.port.toString().split(/\D/)[0];
    return `http://${serverIp}:${port}`;
  };

  const onlineCount = services.filter(s => s.status === 'online').length;
  const offlineCount = services.filter(s => s.status === 'offline').length;
  const unknownCount = services.filter(s => !s.status || s.status === 'unknown').length;

  // Calculate uptime percentage
  const calculateUptime = (serviceId: string) => {
    const records = uptimeData[serviceId] || [];
    if (records.length === 0) return null;
    const online = records.filter(r => r.status === 'online').length;
    return ((online / records.length) * 100).toFixed(1);
  };

  // Prepare chart data
  const getChartData = (serviceId: string) => {
    const records = uptimeData[serviceId] || [];
    return records.map(r => ({
      time: new Date(r.checked_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      responseTime: r.response_time_ms || 0,
      status: r.status === 'online' ? 1 : 0,
    }));
  };

  const ServiceForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Название *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Portainer"
          />
        </div>
        <div className="space-y-2">
          <Label>Порт *</Label>
          <Input
            value={formData.port}
            onChange={(e) => setFormData({ ...formData, port: e.target.value })}
            placeholder="9000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Описание</Label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Docker management"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Категория</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Админ</SelectItem>
              <SelectItem value="work">Работа</SelectItem>
              <SelectItem value="data">Данные</SelectItem>
              <SelectItem value="ai">AI</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Иконка</Label>
          <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(iconMap).map(key => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    {iconMap[key]}
                    {key}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>URL (опционально)</Label>
        <Input
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://custom.domain.com"
        />
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <Label>Активен</Label>
        <Switch
          checked={formData.is_active}
          onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
        />
      </div>

      <Button onClick={onSubmit} className="w-full">{submitLabel}</Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Server className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('services')}</h1>
            <p className="text-muted-foreground">{t('servicesDescription')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            {onlineCount} онлайн
          </Badge>
          {offlineCount > 0 && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
              <XCircle className="h-3 w-3 mr-1" />
              {offlineCount} офлайн
            </Badge>
          )}
          {unknownCount > 0 && (
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              <AlertCircle className="h-3 w-3 mr-1" />
              {unknownCount} неизвестно
            </Badge>
          )}
        </div>
      </div>

      {/* Controls */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="pt-4">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <Label className="mb-1.5 block">IP сервера</Label>
              <Input
                value={serverIp}
                onChange={(e) => setServerIp(e.target.value)}
                placeholder="192.168.1.100"
                className="font-mono"
              />
            </div>
            <div className="flex-1 min-w-[250px]">
              <Label className="mb-1.5 block">Поиск</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск сервисов..."
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              onClick={checkAllServices}
              disabled={isChecking}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isChecking && "animate-spin")} />
              Проверить все
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Добавить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="gap-1.5">
              {cat.icon}
              <span className="hidden sm:inline">{cat.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredServices.map((service) => (
          <Card
            key={service.id}
            className={cn(
              "border-border/50 bg-card/50 backdrop-blur hover:bg-card/80 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group cursor-pointer",
              !service.is_active && "opacity-60"
            )}
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  service.status === 'online' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {iconMap[service.icon] || <Server className="h-5 w-5" />}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-xs", getCategoryColor(service.category))}>
                    {categories.find(c => c.id === service.category)?.label || service.category}
                  </Badge>
                  {/* Scope Badge */}
                  <Badge variant="outline" className={cn(
                    "text-[10px] px-1.5 py-0.5 flex items-center gap-1",
                    getServiceScope(service.port) === 'WAN'
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  )}>
                    {getServiceScope(service.port) === 'WAN' ? <Globe className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                    {getServiceScope(service.port)}
                  </Badge>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    service.status === 'online' ? "bg-success animate-pulse" :
                      service.status === 'offline' ? "bg-destructive" : "bg-muted-foreground"
                  )} />
                </div>
              </div>

              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {service.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                {service.description || 'Нет описания'}
              </p>

              {service.response_time_ms && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <Clock className="h-3 w-3" />
                  {service.response_time_ms}ms
                </div>
              )}

              <div className="flex items-center justify-between">
                <code className="text-xs font-mono text-muted-foreground">
                  :{service.port}
                </code>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => openStatsDialog(service)}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => openEditDialog(service)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDeleteService(service.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(getServiceUrl(service), '_blank');
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Сервисы не найдены</p>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="min-h-[500px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Добавить сервис</DialogTitle>
            <DialogDescription>Заполните информацию о новом сервисе</DialogDescription>
          </DialogHeader>
          <ServiceForm onSubmit={handleAddService} submitLabel="Добавить" />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="min-h-[500px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Редактировать сервис</DialogTitle>
            <DialogDescription>Измените информацию о сервисе</DialogDescription>
          </DialogHeader>
          <ServiceForm onSubmit={handleUpdateService} submitLabel="Сохранить" />
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Статистика: {selectedService?.name}</DialogTitle>
            <DialogDescription>История доступности и время отклика</DialogDescription>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-6 pt-4">
              {/* Uptime */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {calculateUptime(selectedService.id) || '—'}%
                  </p>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {selectedService.response_time_ms || '—'}ms
                  </p>
                  <p className="text-sm text-muted-foreground">Отклик</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {uptimeData[selectedService.id]?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Проверок</p>
                </div>
              </div>

              {/* Response Time Chart */}
              {uptimeData[selectedService.id]?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Время отклика</h4>
                  <div className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getChartData(selectedService.id)}>
                        <defs>
                          <linearGradient id="responseGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="time" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="responseTime"
                          name="Время (ms)"
                          stroke="hsl(217, 91%, 60%)"
                          fill="url(#responseGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <Button
                onClick={() => checkSingleService(selectedService.id)}
                className="w-full gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Проверить сейчас
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesPage;