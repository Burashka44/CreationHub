import React, { useState } from 'react';
import NetworkMonitor from '@/components/dashboard/NetworkMonitor';
import VpnMap from '@/components/dashboard/VpnMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Network, Globe, Wifi, Router, Shield, Plus, 
  Trash2, Play, Settings, Upload, Download,
  FileCode, Eye, EyeOff, Copy, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface VpnProfile {
  id: string;
  name: string;
  endpoint: string;
  publicKey: string;
  privateKey: string;
  address: string;
  dns: string;
  allowedIPs: string;
  isActive: boolean;
  configContent?: string;
}

interface DnsConfig {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  type: 'cloudflare' | 'google' | 'custom' | 'adguard';
}

interface NetworkPreset {
  id: string;
  name: string;
  type: 'vpn' | 'dns' | 'firewall';
  description: string;
  config: Record<string, string>;
}

const NetworkPage = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('vpn');
  const [showPrivateKey, setShowPrivateKey] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  
  // VPN Profiles
  const [vpnProfiles, setVpnProfiles] = useState<VpnProfile[]>([
    {
      id: '1',
      name: 'Production VPN',
      endpoint: 'vpn.example.com:51820',
      publicKey: 'aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789=',
      privateKey: 'xYz789AbCdEfGhIjKlMnOpQrStUvWx123=',
      address: '10.0.0.2/24',
      dns: '1.1.1.1',
      allowedIPs: '0.0.0.0/0',
      isActive: true,
    },
    {
      id: '2',
      name: 'Dev Environment',
      endpoint: 'dev.vpn.local:51820',
      publicKey: 'DevKeyAbCdEfGhIjKlMnOpQrStUvWx12=',
      privateKey: 'PrivDevKeyAbCdEfGhIjKlMnOpQrStUv=',
      address: '10.1.0.5/24',
      dns: '8.8.8.8',
      allowedIPs: '10.1.0.0/24',
      isActive: false,
    },
  ]);
  
  // DNS Configurations
  const [dnsConfigs] = useState<DnsConfig[]>([
    { id: '1', name: 'Cloudflare', primary: '1.1.1.1', secondary: '1.0.0.1', type: 'cloudflare' },
    { id: '2', name: 'Google DNS', primary: '8.8.8.8', secondary: '8.8.4.4', type: 'google' },
    { id: '3', name: 'AdGuard', primary: '94.140.14.14', secondary: '94.140.15.15', type: 'adguard' },
  ]);
  
  // Network Presets
  const [presets, setPresets] = useState<NetworkPreset[]>([
    {
      id: '1',
      name: 'Full Tunnel VPN',
      type: 'vpn',
      description: 'Весь трафик через VPN (0.0.0.0/0)',
      config: { allowedIPs: '0.0.0.0/0', dns: '1.1.1.1' },
    },
    {
      id: '2',
      name: 'Split Tunnel',
      type: 'vpn',
      description: 'Только внутренняя сеть через VPN',
      config: { allowedIPs: '10.0.0.0/8, 172.16.0.0/12', dns: '10.0.0.1' },
    },
    {
      id: '3',
      name: 'Secure DNS',
      type: 'dns',
      description: 'Cloudflare DoH + блокировка рекламы',
      config: { primary: '1.1.1.1', secondary: '1.0.0.1', protocol: 'DoH' },
    },
    {
      id: '4',
      name: 'Gaming Mode',
      type: 'dns',
      description: 'Минимальная задержка DNS',
      config: { primary: '8.8.8.8', secondary: '208.67.222.222', cache: 'aggressive' },
    },
  ]);
  
  // Form states
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetType, setNewPresetType] = useState<'vpn' | 'dns' | 'firewall'>('vpn');
  const [newPresetConfig, setNewPresetConfig] = useState('{\n  "allowedIPs": "0.0.0.0/0"\n}');
  const [importConfig, setImportConfig] = useState('');
  
  const connections = [
    { name: 'eth0', ip: '192.168.1.100', type: 'Ethernet', speed: '1 Gbps', status: 'online' },
    { name: 'wg0', ip: '10.0.0.2', type: 'WireGuard', speed: 'VPN', status: 'online' },
    { name: 'docker0', ip: '172.17.0.1', type: 'Bridge', speed: '10 Gbps', status: 'online' },
  ];
  
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'vpn': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'dns': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'firewall': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };
  
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };
  
  const toggleVpnProfile = (id: string) => {
    setVpnProfiles(prev => prev.map(p => ({
      ...p,
      isActive: p.id === id ? !p.isActive : false
    })));
  };
  
  const deleteVpnProfile = (id: string) => {
    setVpnProfiles(prev => prev.filter(p => p.id !== id));
  };
  
  const applyPreset = (preset: NetworkPreset) => {
    if (preset.type === 'vpn') {
      setActiveTab('vpn');
    } else if (preset.type === 'dns') {
      setActiveTab('dns');
    }
  };
  
  const addPreset = () => {
    try {
      const config = JSON.parse(newPresetConfig);
      const newPreset: NetworkPreset = {
        id: Math.random().toString(36).slice(2),
        name: newPresetName || 'New Preset',
        type: newPresetType,
        description: '',
        config,
      };
      setPresets(prev => [newPreset, ...prev]);
      setNewPresetName('');
    } catch {
      // Invalid JSON
    }
  };
  
  const parseWireGuardConfig = (config: string): Partial<VpnProfile> | null => {
    try {
      const lines = config.split('\n');
      const profile: Partial<VpnProfile> = {};
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('Address')) {
          profile.address = trimmed.split('=')[1]?.trim();
        } else if (trimmed.startsWith('PrivateKey')) {
          profile.privateKey = trimmed.split('=')[1]?.trim();
        } else if (trimmed.startsWith('DNS')) {
          profile.dns = trimmed.split('=')[1]?.trim();
        } else if (trimmed.startsWith('PublicKey')) {
          profile.publicKey = trimmed.split('=')[1]?.trim();
        } else if (trimmed.startsWith('Endpoint')) {
          profile.endpoint = trimmed.split('=')[1]?.trim();
        } else if (trimmed.startsWith('AllowedIPs')) {
          profile.allowedIPs = trimmed.split('=')[1]?.trim();
        }
      }
      
      return profile;
    } catch {
      return null;
    }
  };
  
  const importWireGuardConfig = () => {
    const parsed = parseWireGuardConfig(importConfig);
    if (parsed) {
      const newProfile: VpnProfile = {
        id: Math.random().toString(36).slice(2),
        name: `Imported ${new Date().toLocaleDateString()}`,
        endpoint: parsed.endpoint || '',
        publicKey: parsed.publicKey || '',
        privateKey: parsed.privateKey || '',
        address: parsed.address || '',
        dns: parsed.dns || '1.1.1.1',
        allowedIPs: parsed.allowedIPs || '0.0.0.0/0',
        isActive: false,
        configContent: importConfig,
      };
      setVpnProfiles(prev => [...prev, newProfile]);
      setImportConfig('');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Network className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('network')}</h1>
          <p className="text-muted-foreground">{t('networkDescription')}</p>
        </div>
      </div>
      
      {/* Combined Monitors Row - Network + VPN together */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <NetworkMonitor />
            <VpnMap />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Network Presets */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">{t('presets')}</CardTitle>
            </div>
            <CardDescription>
              {t('quickNetworkConfigs')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[280px] pr-3">
              <div className="space-y-3">
                {presets.map((preset) => (
                  <div 
                    key={preset.id} 
                    className="p-3 rounded-lg border border-border/50 bg-background/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{preset.name}</span>
                      <Badge variant="outline" className={cn("text-xs", getTypeBadgeColor(preset.type))}>
                        {preset.type}
                      </Badge>
                    </div>
                    {preset.description && (
                      <p className="text-xs text-muted-foreground">{preset.description}</p>
                    )}
                    <pre className="text-xs bg-muted/50 p-2 rounded border border-border/30 overflow-x-auto">
                      {JSON.stringify(preset.config, null, 2)}
                    </pre>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="flex-1 gap-1.5"
                        onClick={() => applyPreset(preset)}
                      >
                        <Play className="h-3 w-3" />
                        {t('apply')}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => setPresets(prev => prev.filter(p => p.id !== preset.id))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="border-t border-border/50 pt-4 space-y-3">
              <p className="text-sm font-medium">{t('newPreset')}</p>
              <Input
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder={t('title')}
              />
              <Select value={newPresetType} onValueChange={(v: 'vpn' | 'dns' | 'firewall') => setNewPresetType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vpn">VPN</SelectItem>
                  <SelectItem value="dns">DNS</SelectItem>
                  <SelectItem value="firewall">Firewall</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                value={newPresetConfig}
                onChange={(e) => setNewPresetConfig(e.target.value)}
                placeholder="JSON config"
                className="font-mono text-xs h-20"
              />
              <Button onClick={addPreset} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                {t('add')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* VPN & DNS Configuration */}
        <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">{t('configuration')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="vpn" className="gap-1.5 text-xs">
                  <Shield className="h-3.5 w-3.5" />
                  WireGuard VPN
                </TabsTrigger>
                <TabsTrigger value="dns" className="gap-1.5 text-xs">
                  <Globe className="h-3.5 w-3.5" />
                  DNS
                </TabsTrigger>
                <TabsTrigger value="import" className="gap-1.5 text-xs">
                  <Upload className="h-3.5 w-3.5" />
                  {t('importConf')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="vpn" className="space-y-4">
                <ScrollArea className="h-[350px]">
                  <div className="space-y-4 pr-4">
                    {vpnProfiles.map((profile) => (
                      <div 
                        key={profile.id}
                        className={cn(
                          "p-4 rounded-lg border transition-all",
                          profile.isActive 
                            ? "border-success/50 bg-success/5" 
                            : "border-border/50 bg-background/50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              profile.isActive ? "bg-success animate-pulse" : "bg-muted-foreground"
                            )} />
                            <span className="font-semibold">{profile.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={profile.isActive} 
                              onCheckedChange={() => toggleVpnProfile(profile.id)}
                            />
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteVpnProfile(profile.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Endpoint</Label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 px-2 py-1 bg-muted/50 rounded text-xs font-mono">
                                {profile.endpoint}
                              </code>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(profile.endpoint, `endpoint-${profile.id}`)}
                              >
                                {copied === `endpoint-${profile.id}` ? (
                                  <Check className="h-3 w-3 text-success" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Address</Label>
                            <code className="block px-2 py-1 bg-muted/50 rounded text-xs font-mono">
                              {profile.address}
                            </code>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Public Key</Label>
                            <code className="block px-2 py-1 bg-muted/50 rounded text-xs font-mono truncate">
                              {profile.publicKey}
                            </code>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Private Key</Label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 px-2 py-1 bg-muted/50 rounded text-xs font-mono truncate">
                                {showPrivateKey[profile.id] ? profile.privateKey : '••••••••••••••••••••'}
                              </code>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6"
                                onClick={() => setShowPrivateKey(prev => ({
                                  ...prev,
                                  [profile.id]: !prev[profile.id]
                                }))}
                              >
                                {showPrivateKey[profile.id] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">DNS</Label>
                            <code className="block px-2 py-1 bg-muted/50 rounded text-xs font-mono">
                              {profile.dns}
                            </code>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Allowed IPs</Label>
                            <code className="block px-2 py-1 bg-muted/50 rounded text-xs font-mono">
                              {profile.allowedIPs}
                            </code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="dns" className="space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dnsConfigs.map((dns) => (
                    <div 
                      key={dns.id}
                      className="p-4 rounded-lg border border-border/50 bg-background/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{dns.name}</span>
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          dns.type === 'cloudflare' && 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                          dns.type === 'google' && 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                          dns.type === 'adguard' && 'bg-green-500/20 text-green-400 border-green-500/30',
                          dns.type === 'custom' && 'bg-muted text-muted-foreground'
                        )}>
                          {dns.type}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('primaryDns')}</span>
                          <code className="font-mono">{dns.primary}</code>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('secondaryDns')}</span>
                          <code className="font-mono">{dns.secondary}</code>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm" className="w-full">
                        {t('apply')}
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-border/50 pt-4 space-y-3">
                  <p className="text-sm font-medium">{t('addDns')}</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Input placeholder={t('title')} />
                    <Input placeholder={t('primaryDns')} />
                    <Input placeholder={t('secondaryDns')} />
                  </div>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('addDns')}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="import" className="space-y-4">
                <div className="space-y-3">
                  <Label>{t('importWireGuard')}</Label>
                  <Textarea
                    value={importConfig}
                    onChange={(e) => setImportConfig(e.target.value)}
                    placeholder={`[Interface]
PrivateKey = your_private_key_here
Address = 10.0.0.2/24
DNS = 1.1.1.1

[Peer]
PublicKey = server_public_key
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0`}
                    className="font-mono text-xs h-[200px]"
                  />
                  <div className="flex gap-3">
                    <Button onClick={importWireGuardConfig} className="gap-2">
                      <Download className="h-4 w-4" />
                      {t('import')}
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <FileCode className="h-4 w-4" />
                      {t('uploadFile')}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Network Interfaces */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Router className="h-5 w-5 text-primary" />
            {t('networkInterfaces')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {connections.map((conn) => (
              <div
                key={conn.name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    conn.status === 'online' ? "bg-success/10" : "bg-destructive/10"
                  )}>
                    {conn.type === 'WireGuard' ? (
                      <Shield className={cn("h-4 w-4", conn.status === 'online' ? "text-success" : "text-destructive")} />
                    ) : (
                      <Wifi className={cn("h-4 w-4", conn.status === 'online' ? "text-success" : "text-destructive")} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{conn.name}</p>
                    <p className="text-sm text-muted-foreground">{conn.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-foreground">{conn.ip}</p>
                  <p className="text-sm text-muted-foreground">{conn.speed}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkPage;
