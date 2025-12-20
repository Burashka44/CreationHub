import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Server, ExternalLink, Settings, Shield, Database, 
  Container, Terminal, Key, Activity, Workflow, Youtube,
  Mic, Chrome, Rss, Languages, BarChart3, Cloud, FolderOpen,
  Users, FileText, HardDrive, Bell, Eye, Search, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  description: string;
  category: 'admin' | 'work' | 'data' | 'ai';
  port: number | string;
  status: 'online' | 'offline' | 'unknown';
  url?: string;
  icon: React.ReactNode;
}

const ServicesPage = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [serverIp, setServerIp] = useState('192.168.1.100');
  
  const services: Service[] = [
    // Admin Services
    {
      id: 'portainer',
      name: 'Portainer',
      description: 'Docker Container Management',
      category: 'admin',
      port: 9000,
      status: 'online',
      icon: <Container className="h-5 w-5" />,
    },
    {
      id: 'npm',
      name: 'Nginx Proxy Manager',
      description: 'Reverse Proxy & SSL Management',
      category: 'admin',
      port: 81,
      status: 'online',
      icon: <Shield className="h-5 w-5" />,
    },
    {
      id: 'glances',
      name: 'Glances',
      description: 'Real-time System Monitor',
      category: 'admin',
      port: 61208,
      status: 'online',
      icon: <Activity className="h-5 w-5" />,
    },
    {
      id: 'wireguard',
      name: 'WireGuard',
      description: 'VPN Server',
      category: 'admin',
      port: '51820 (UDP)',
      status: 'online',
      icon: <Key className="h-5 w-5" />,
    },
    {
      id: 'adminer',
      name: 'Adminer',
      description: 'Database Management',
      category: 'admin',
      port: 8080,
      status: 'online',
      icon: <Database className="h-5 w-5" />,
    },
    {
      id: 'healthchecks',
      name: 'Healthchecks',
      description: 'Uptime Monitoring',
      category: 'admin',
      port: 8000,
      status: 'online',
      icon: <Bell className="h-5 w-5" />,
    },
    {
      id: 'dozzle',
      name: 'Dozzle',
      description: 'Container Log Viewer',
      category: 'admin',
      port: 8081,
      status: 'online',
      icon: <Terminal className="h-5 w-5" />,
    },
    
    // Work Services
    {
      id: 'n8n',
      name: 'n8n',
      description: 'Workflow Automation',
      category: 'work',
      port: 5678,
      status: 'online',
      icon: <Workflow className="h-5 w-5" />,
    },
    {
      id: 'ytdlp',
      name: 'yt-dlp',
      description: 'Video Downloader',
      category: 'work',
      port: 8080,
      status: 'online',
      icon: <Youtube className="h-5 w-5" />,
    },
    {
      id: 'whisper',
      name: 'Whisper',
      description: 'Speech-to-Text Server',
      category: 'work',
      port: 9000,
      status: 'online',
      icon: <Mic className="h-5 w-5" />,
    },
    {
      id: 'browserless',
      name: 'Browserless',
      description: 'Headless Chrome',
      category: 'work',
      port: 3000,
      status: 'online',
      icon: <Chrome className="h-5 w-5" />,
    },
    {
      id: 'rsshub',
      name: 'RSSHub',
      description: 'RSS Feed Generator',
      category: 'work',
      port: 1200,
      status: 'online',
      icon: <Rss className="h-5 w-5" />,
    },
    {
      id: 'translate',
      name: 'LibreTranslate',
      description: 'Translation API',
      category: 'work',
      port: 5000,
      status: 'online',
      icon: <Languages className="h-5 w-5" />,
    },
    
    // Data Services
    {
      id: 'grafana',
      name: 'Grafana',
      description: 'Analytics & Dashboards',
      category: 'data',
      port: 3000,
      status: 'online',
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      id: 'nextcloud',
      name: 'Nextcloud',
      description: 'Cloud Storage',
      category: 'data',
      port: 8083,
      status: 'online',
      icon: <Cloud className="h-5 w-5" />,
    },
    {
      id: 'filebrowser',
      name: 'File Browser',
      description: 'Web File Manager',
      category: 'data',
      port: 8082,
      status: 'online',
      icon: <FolderOpen className="h-5 w-5" />,
    },
    {
      id: 'channels',
      name: 'Account Manager',
      description: 'Channel & Account Management',
      category: 'data',
      port: 8084,
      status: 'online',
      icon: <Users className="h-5 w-5" />,
    },
    
    // AI Services (AI Hub)
    {
      id: 'aihub-asr',
      name: 'ASR API',
      description: 'Speech Recognition (Whisper)',
      category: 'ai',
      port: 8088,
      status: 'online',
      icon: <Mic className="h-5 w-5" />,
    },
    {
      id: 'aihub-tts',
      name: 'TTS API',
      description: 'Text-to-Speech',
      category: 'ai',
      port: 8088,
      status: 'online',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: 'aihub-translate',
      name: 'Translation API',
      description: 'Neural Machine Translation',
      category: 'ai',
      port: 8088,
      status: 'online',
      icon: <Languages className="h-5 w-5" />,
    },
    {
      id: 'aihub-av',
      name: 'AV Pipeline',
      description: 'Video Dubbing Pipeline',
      category: 'ai',
      port: 8088,
      status: 'online',
      icon: <Activity className="h-5 w-5" />,
    },
    {
      id: 'aihub-clean',
      name: 'Video Inpainting',
      description: 'Object Removal (ProPainter/LaMa)',
      category: 'ai',
      port: 8088,
      status: 'online',
      icon: <Eye className="h-5 w-5" />,
    },
  ];
  
  const categories = [
    { id: 'all', label: 'Все', icon: <Server className="h-4 w-4" /> },
    { id: 'admin', label: 'Admin', icon: <Settings className="h-4 w-4" /> },
    { id: 'work', label: 'Work', icon: <Workflow className="h-4 w-4" /> },
    { id: 'data', label: 'Data', icon: <Database className="h-4 w-4" /> },
    { id: 'ai', label: 'AI Studio', icon: <Activity className="h-4 w-4" /> },
  ];
  
  const [activeCategory, setActiveCategory] = useState('all');
  
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
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
    const port = typeof service.port === 'string' ? service.port.split(' ')[0] : service.port;
    return `http://${serverIp}:${port}`;
  };
  
  const onlineCount = services.filter(s => s.status === 'online').length;
  const offlineCount = services.filter(s => s.status === 'offline').length;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Server className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Сервисы</h1>
            <p className="text-muted-foreground">Каталог всех сервисов сервера</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
            {onlineCount} онлайн
          </Badge>
          {offlineCount > 0 && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
              {offlineCount} офлайн
            </Badge>
          )}
        </div>
      </div>
      
      {/* Server IP Configuration */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Server IP
              </label>
              <Input
                value={serverIp}
                onChange={(e) => setServerIp(e.target.value)}
                placeholder="192.168.1.100"
                className="font-mono"
              />
            </div>
            <div className="flex-1 min-w-[300px]">
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Поиск сервисов
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по названию или описанию..."
                  className="pl-10"
                />
              </div>
            </div>
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
              "border-border/50 bg-card/50 backdrop-blur hover:bg-card/80 transition-all cursor-pointer group",
              service.status === 'offline' && "opacity-60"
            )}
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  service.status === 'online' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {service.icon}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-xs", getCategoryColor(service.category))}>
                    {service.category}
                  </Badge>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    service.status === 'online' ? "bg-success animate-pulse" : "bg-destructive"
                  )} />
                </div>
              </div>
              
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {service.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {service.description}
              </p>
              
              <div className="flex items-center justify-between">
                <code className="text-xs font-mono text-muted-foreground">
                  :{typeof service.port === 'string' ? service.port : service.port}
                </code>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="gap-1.5 h-7"
                  onClick={() => window.open(getServiceUrl(service), '_blank')}
                  disabled={service.status === 'offline'}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Открыть
                </Button>
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
    </div>
  );
};

export default ServicesPage;
