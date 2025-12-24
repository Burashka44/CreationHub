import React, { useState, useEffect } from 'react';
import NetworkMonitor from '@/components/dashboard/NetworkMonitor';
import VpnMap from '@/components/dashboard/VpnMap';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Network, Globe, Wifi, Router, Shield, Plus,
  Trash2, Settings, Upload, Download,
  FileCode, Eye, EyeOff, Copy, Check, Activity,
  Server, RefreshCw, TrendingUp, Pencil
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface VpnProfile {
  id: string;
  name: string;
  endpoint: string | null;
  public_key: string | null;
  private_key: string | null;
  address: string | null;
  dns: string | null;
  allowed_ips: string | null;
  is_active: boolean | null;
  config_content: string | null;
}

interface DnsConfig {
  id: string;
  name: string;
  primary_dns: string;
  secondary_dns: string | null;
  dns_type: string | null;
  is_active: boolean | null;
}

interface MonitoredHost {
  id: string;
  name: string;
  host: string;
  check_type: string | null;
  status: string | null;
  response_time_ms: number | null;
  last_check_at: string | null;
  is_active: boolean | null;
}

interface NetworkTraffic {
  id: string;
  interface_name: string | null;
  rx_bytes: number | null;
  tx_bytes: number | null;
  rx_rate: number | null;
  tx_rate: number | null;
  recorded_at: string;
}

const NetworkPage = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('vpn');
  const [showPrivateKey, setShowPrivateKey] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Data from DB
  const [vpnProfiles, setVpnProfiles] = useState<VpnProfile[]>([]);
  const [dnsConfigs, setDnsConfigs] = useState<DnsConfig[]>([]);
  const [monitoredHosts, setMonitoredHosts] = useState<MonitoredHost[]>([]);
  const [networkTraffic, setNetworkTraffic] = useState<NetworkTraffic[]>([]);
  const [interfaces, setInterfaces] = useState<any[]>([]); // Real interfaces from Glances

  // Real system data from system-api
  const [systemDns, setSystemDns] = useState<{ nameservers: string[]; search: string[] } | null>(null);
  const [systemWgConfigs, setSystemWgConfigs] = useState<{ name: string; filename: string; content: string }[]>([]);
  const [wgStatus, setWgStatus] = useState<string>('unknown');
  const [applyingConfig, setApplyingConfig] = useState<string | null>(null);
  const [selectedConfigs, setSelectedConfigs] = useState<Set<string>>(new Set());

  // ... (existing code)

  // Form states
  const [importConfig, setImportConfig] = useState('');
  const [importConfigName, setImportConfigName] = useState('');
  const [newDnsName, setNewDnsName] = useState('');
  const [newDnsPrimary, setNewDnsPrimary] = useState('');
  const [newDnsSecondary, setNewDnsSecondary] = useState('');
  const [newHostName, setNewHostName] = useState('');

  // New VPN form
  const [newVpnName, setNewVpnName] = useState('');
  const [newVpnEndpoint, setNewVpnEndpoint] = useState('');
  const [newVpnPublicKey, setNewVpnPublicKey] = useState('');
  const [newVpnPrivateKey, setNewVpnPrivateKey] = useState('');
  const [newVpnAddress, setNewVpnAddress] = useState('');
  const [newVpnDns, setNewVpnDns] = useState('1.1.1.1');
  const [newVpnAllowedIps, setNewVpnAllowedIps] = useState('0.0.0.0/0');
  const [newHostAddress, setNewHostAddress] = useState('');
  const [newHostType, setNewHostType] = useState<'ping' | 'http' | 'tcp'>('ping');

  // Edit states
  const [editingVpn, setEditingVpn] = useState<VpnProfile | null>(null);
  const [editingDns, setEditingDns] = useState<DnsConfig | null>(null);
  const [editingHost, setEditingHost] = useState<MonitoredHost | null>(null);

  // Fetch data
  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates
    const vpnChannel = supabase
      .channel('vpn-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vpn_profiles' }, () => fetchVpnProfiles())
      .subscribe();

    const hostsChannel = supabase
      .channel('hosts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monitored_hosts' }, () => fetchMonitoredHosts())
      .subscribe();

    return () => {
      supabase.removeChannel(vpnChannel);
      supabase.removeChannel(hostsChannel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchVpnProfiles(),
      fetchDnsConfigs(),
      fetchMonitoredHosts(),
      fetchNetworkTraffic(),
      fetchInterfaces(),
      fetchSystemDns(),
      fetchSystemWgConfigs(),
    ]);
    setLoading(false);
  };

  const fetchVpnProfiles = async () => {
    const { data, error } = await supabase.from('vpn_profiles').select('*').order('created_at', { ascending: false });
    if (!error && data) setVpnProfiles(data);
  };

  const fetchDnsConfigs = async () => {
    const { data, error } = await supabase.from('dns_configs').select('*').order('name');
    if (!error && data) setDnsConfigs(data);
  };

  const fetchMonitoredHosts = async () => {
    const { data, error } = await supabase.from('monitored_hosts').select('*').order('name');
    if (!error && data) setMonitoredHosts(data);
  };

  const fetchNetworkTraffic = async () => {
    const { data, error } = await supabase
      .from('network_traffic')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(50);
    if (!error && data) setNetworkTraffic(data.reverse());
  };

  const fetchInterfaces = async () => {
    try {
      const res = await fetch('/api/glances/network');
      if (res.ok) {
        const data = await res.json();
        const formatted = Array.isArray(data) ? data.map((iface: any) => ({
          name: iface.interface_name,
          ip: '-', // Glances network plugin needs 'ip' plugin for IP, standard 'network' is traffic-focused
          type: iface.interface_name.startsWith('w') ? 'Wi-Fi' :
            iface.interface_name.startsWith('e') ? 'Ethernet' :
              iface.interface_name.startsWith('lo') ? 'Loopback' :
                iface.interface_name.startsWith('tun') || iface.interface_name.startsWith('wg') ? 'VPN' : 'Other',
          speed: 'Auto',
          status: (iface.rx > 0 || iface.tx > 0) ? 'online' : 'idle'
        })) : [];
        setInterfaces(formatted);
      }
    } catch (e) {
      console.error("Failed to fetch interfaces", e);
    }
  };

  // Fetch real DNS from system
  const fetchSystemDns = async () => {
    try {
      const res = await fetch('/api/system/dns');
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setSystemDns(result.data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch system DNS", e);
    }
  };

  // Fetch real WireGuard configs from system
  const fetchSystemWgConfigs = async () => {
    try {
      const res = await fetch('/api/system/wireguard');
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setSystemWgConfigs(result.data.configs || []);
          setWgStatus(result.data.status || 'unknown');
        }
      }
    } catch (e) {
      console.error("Failed to fetch WG configs", e);
    }
  };

  // Apply WireGuard config to system
  const applyWgConfig = async (configName: string, content: string) => {
    setApplyingConfig(configName);
    try {
      // Write config to system
      const writeRes = await fetch('/api/system/wireguard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: configName, content })
      });

      if (!writeRes.ok) {
        const err = await writeRes.json();
        throw new Error(err.error || 'Failed to write config');
      }

      // Config saved - refresh list immediately
      await fetchSystemWgConfigs();
      toast.success(`Конфигурация ${configName} сохранена`);

      // Try to restart WireGuard interface (optional)
      try {
        const restartRes = await fetch('/api/system/wireguard/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interface: configName })
        });
        if (restartRes.ok) {
          toast.success(`WireGuard интерфейс ${configName} активирован`);
        }
      } catch {
        // Restart is optional - config is already saved
      }
    } catch (e: any) {
      toast.error(`Ошибка: ${e.message}`);
    } finally {
      setApplyingConfig(null);
    }
  };

  // Save new WG config to system
  const saveNewWgConfig = async () => {
    if (!importConfigName.trim() || !importConfig.trim()) {
      toast.error('Введите название и содержимое конфигурации');
      return;
    }
    // Transliterate cyrillic to latin for safe filename
    const translitMap: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
      'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', ' ': '_'
    };
    const safeName = importConfigName.toLowerCase()
      .split('')
      .map(c => translitMap[c] !== undefined ? translitMap[c] : c)
      .join('')
      .replace(/[^a-z0-9_-]/g, '');

    if (!safeName) {
      toast.error('Некорректное название для файла');
      return;
    }

    await applyWgConfig(safeName, importConfig);
    setImportConfigName('');
    setImportConfig('');
  };

  // Toggle selection
  const toggleSelection = (configName: string) => {
    setSelectedConfigs(prev => {
      const next = new Set(prev);
      if (next.has(configName)) next.delete(configName);
      else next.add(configName);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedConfigs.size === systemWgConfigs.length) {
      setSelectedConfigs(new Set());
    } else {
      setSelectedConfigs(new Set(systemWgConfigs.map(c => c.name)));
    }
  };

  // Bulk Delete
  const deleteSelectedConfigs = async () => {
    if (selectedConfigs.size === 0) return;
    if (!confirm(`Удалить выбранные конфигурации (${selectedConfigs.size})?`)) return;

    let deletedCount = 0;
    for (const configName of selectedConfigs) {
      try {
        const res = await fetch(`/api/system/wireguard/${configName}`, { method: 'DELETE' });
        if (res.ok) deletedCount++;
      } catch (e) {
        console.error(`Failed to delete ${configName}`, e);
      }
    }

    if (deletedCount > 0) {
      toast.success(`Удалено конфигураций: ${deletedCount}`);
      setSelectedConfigs(new Set());
      fetchSystemWgConfigs();
    } else {
      toast.error('Ошибка удаления');
    }
  };

  // Rename WG config
  const renameWgConfig = async (oldName: string) => {
    const newName = prompt('Новое название:', oldName);
    if (!newName || newName === oldName) return;

    // Transliterate cyrillic
    const translitMap: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
      'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', ' ': '_'
    };
    const safeName = newName.toLowerCase()
      .split('')
      .map(c => translitMap[c] !== undefined ? translitMap[c] : c)
      .join('')
      .replace(/[^a-z0-9_-]/g, '');

    if (!safeName) {
      toast.error('Некорректное название');
      return;
    }

    try {
      const res = await fetch(`/api/system/wireguard/${oldName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: safeName })
      });

      if (res.ok) {
        toast.success(`Переименовано: ${oldName} → ${safeName}`);
        fetchSystemWgConfigs();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Ошибка переименования');
      }
    } catch (e: any) {
      toast.error(`Ошибка: ${e.message}`);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleVpnProfile = async (id: string, currentActive: boolean) => {
    // Deactivate all, then activate the selected one
    if (!currentActive) {
      await supabase.from('vpn_profiles').update({ is_active: false }).neq('id', id);
    }
    const { error } = await supabase
      .from('vpn_profiles')
      .update({ is_active: !currentActive })
      .eq('id', id);
    if (error) {
      toast.error('Ошибка переключения VPN');
    } else {
      fetchVpnProfiles();
    }
  };

  const deleteVpnProfile = async (id: string) => {
    const { error } = await supabase.from('vpn_profiles').delete().eq('id', id);
    if (error) {
      toast.error('Ошибка удаления');
    } else {
      toast.success('VPN профиль удален');
      fetchVpnProfiles();
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
          profile.private_key = trimmed.split('=')[1]?.trim();
        } else if (trimmed.startsWith('DNS')) {
          profile.dns = trimmed.split('=')[1]?.trim();
        } else if (trimmed.startsWith('PublicKey')) {
          profile.public_key = trimmed.split('=')[1]?.trim();
        } else if (trimmed.startsWith('Endpoint')) {
          profile.endpoint = trimmed.split('=')[1]?.trim();
        } else if (trimmed.startsWith('AllowedIPs')) {
          profile.allowed_ips = trimmed.split('=')[1]?.trim();
        }
      }

      return profile;
    } catch {
      return null;
    }
  };

  const importWireGuardConfig = async () => {
    const parsed = parseWireGuardConfig(importConfig);
    if (parsed) {
      const { error } = await supabase.from('vpn_profiles').insert({
        name: `Imported ${new Date().toLocaleDateString('ru-RU')}`,
        endpoint: parsed.endpoint || null,
        public_key: parsed.public_key || null,
        private_key: parsed.private_key || null,
        address: parsed.address || null,
        dns: parsed.dns || '1.1.1.1',
        allowed_ips: parsed.allowed_ips || '0.0.0.0/0',
        is_active: false,
        config_content: importConfig,
      });

      if (error) {
        toast.error('Ошибка импорта конфигурации');
      } else {
        toast.success('VPN профиль импортирован');
        setImportConfig('');
        fetchVpnProfiles();
      }
    } else {
      toast.error('Некорректный формат конфигурации');
    }
  };

  const addVpnProfile = async () => {
    if (!newVpnName) {
      toast.error('Введите название профиля');
      return;
    }

    const { error } = await supabase.from('vpn_profiles').insert({
      name: newVpnName,
      endpoint: newVpnEndpoint || null,
      public_key: newVpnPublicKey || null,
      private_key: newVpnPrivateKey || null,
      address: newVpnAddress || null,
      dns: newVpnDns || '1.1.1.1',
      allowed_ips: newVpnAllowedIps || '0.0.0.0/0',
      is_active: false,
    });

    if (error) {
      toast.error('Ошибка создания профиля');
    } else {
      toast.success('VPN профиль создан');
      setNewVpnName('');
      setNewVpnEndpoint('');
      setNewVpnPublicKey('');
      setNewVpnPrivateKey('');
      setNewVpnAddress('');
      setNewVpnDns('1.1.1.1');
      setNewVpnAllowedIps('0.0.0.0/0');
      fetchVpnProfiles();
    }
  };

  const addDnsConfig = async () => {
    if (!newDnsName || !newDnsPrimary) {
      toast.error('Заполните название и основной DNS');
      return;
    }

    const { error } = await supabase.from('dns_configs').insert({
      name: newDnsName,
      primary_dns: newDnsPrimary,
      secondary_dns: newDnsSecondary || null,
      dns_type: 'custom',
      is_active: false,
    });

    if (error) {
      toast.error('Ошибка добавления DNS');
    } else {
      toast.success('DNS конфигурация добавлена');
      setNewDnsName('');
      setNewDnsPrimary('');
      setNewDnsSecondary('');
      fetchDnsConfigs();
    }
  };

  const deleteDnsConfig = async (id: string) => {
    const { error } = await supabase.from('dns_configs').delete().eq('id', id);
    if (error) {
      toast.error('Ошибка удаления');
    } else {
      toast.success('DNS конфигурация удалена');
      fetchDnsConfigs();
    }
  };

  const toggleDnsActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('dns_configs')
      .update({ is_active: !currentActive })
      .eq('id', id);
    if (!error) fetchDnsConfigs();
  };

  // Update VPN Profile
  const updateVpnProfile = async () => {
    if (!editingVpn) return;

    const { error } = await supabase
      .from('vpn_profiles')
      .update({
        name: editingVpn.name,
        endpoint: editingVpn.endpoint,
        public_key: editingVpn.public_key,
        private_key: editingVpn.private_key,
        address: editingVpn.address,
        dns: editingVpn.dns,
        allowed_ips: editingVpn.allowed_ips,
      })
      .eq('id', editingVpn.id);

    if (error) {
      toast.error('Ошибка сохранения');
    } else {
      toast.success('VPN профиль обновлен');
      setEditingVpn(null);
      fetchVpnProfiles();
    }
  };

  // Update DNS Config
  const updateDnsConfig = async () => {
    if (!editingDns) return;

    const { error } = await supabase
      .from('dns_configs')
      .update({
        name: editingDns.name,
        primary_dns: editingDns.primary_dns,
        secondary_dns: editingDns.secondary_dns,
        dns_type: editingDns.dns_type,
      })
      .eq('id', editingDns.id);

    if (error) {
      toast.error('Ошибка сохранения');
    } else {
      toast.success('DNS конфигурация обновлена');
      setEditingDns(null);
      fetchDnsConfigs();
    }
  };

  const addMonitoredHost = async () => {
    if (!newHostName || !newHostAddress) {
      toast.error('Заполните название и адрес хоста');
      return;
    }

    const { error } = await supabase.from('monitored_hosts').insert({
      name: newHostName,
      host: newHostAddress,
      check_type: newHostType,
      status: 'unknown',
      is_active: true,
    });

    if (error) {
      toast.error('Ошибка добавления хоста');
    } else {
      toast.success('Хост добавлен для мониторинга');
      setNewHostName('');
      setNewHostAddress('');
      fetchMonitoredHosts();
    }
  };

  const deleteMonitoredHost = async (id: string) => {
    const { error } = await supabase.from('monitored_hosts').delete().eq('id', id);
    if (error) {
      toast.error('Ошибка удаления');
    } else {
      toast.success('Хост удален');
      fetchMonitoredHosts();
    }
  };

  const toggleHostActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('monitored_hosts')
      .update({ is_active: !currentActive })
      .eq('id', id);
    if (!error) fetchMonitoredHosts();
  };

  // Update monitored host
  const updateMonitoredHost = async () => {
    if (!editingHost) return;

    const { error } = await supabase
      .from('monitored_hosts')
      .update({
        name: editingHost.name,
        host: editingHost.host,
        check_type: editingHost.check_type,
      })
      .eq('id', editingHost.id);

    if (error) {
      toast.error('Ошибка сохранения');
    } else {
      toast.success('Хост обновлен');
      setEditingHost(null);
      fetchMonitoredHosts();
    }
  };

  // Export VPN to WireGuard .conf format
  const exportVpnToConf = (profile: VpnProfile) => {
    const confContent = `[Interface]
PrivateKey = ${profile.private_key || 'YOUR_PRIVATE_KEY'}
Address = ${profile.address || '10.0.0.2/24'}
DNS = ${profile.dns || '1.1.1.1'}

[Peer]
PublicKey = ${profile.public_key || 'SERVER_PUBLIC_KEY'}
Endpoint = ${profile.endpoint || 'vpn.example.com:51820'}
AllowedIPs = ${profile.allowed_ips || '0.0.0.0/0'}
PersistentKeepalive = 25
`;

    const blob = new Blob([confContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.name.replace(/\s+/g, '_')}.conf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Конфигурация экспортирована');
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-success/20 text-success border-success/30">Online</Badge>;
      case 'offline':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Offline</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDnsTypeBadge = (type: string | null) => {
    const colors: Record<string, string> = {
      cloudflare: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      google: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      adguard: 'bg-green-500/20 text-green-400 border-green-500/30',
      quad9: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      custom: 'bg-muted text-muted-foreground',
    };
    return colors[type || 'custom'] || colors.custom;
  };

  // Prepare traffic chart data
  const trafficChartData = networkTraffic.map((t) => ({
    time: new Date(t.recorded_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    download: ((t.rx_rate || 0) / 1024 / 1024).toFixed(2),
    upload: ((t.tx_rate || 0) / 1024 / 1024).toFixed(2),
  }));

  const chartConfig = {
    download: { label: 'Download', color: 'hsl(var(--success))' },
    upload: { label: 'Upload', color: 'hsl(var(--primary))' },
  };

  // Connections are now fetched dynamically via fetchInterfaces


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Network className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('network')}</h1>
            <p className="text-muted-foreground">{t('networkDescription')}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Обновить
        </Button>
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

      {/* Traffic History Chart */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">История трафика</CardTitle>
          </div>
          <CardDescription>Статистика сетевого трафика за последнее время</CardDescription>
        </CardHeader>
        <CardContent>
          {trafficChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <AreaChart data={trafficChartData}>
                <defs>
                  <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="time" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} unit=" MB/s" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="download" stroke="hsl(var(--success))" fill="url(#downloadGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="upload" stroke="hsl(var(--primary))" fill="url(#uploadGradient)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Нет данных о трафике
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Host Monitoring */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Мониторинг хостов</CardTitle>
            </div>
            <CardDescription>Проверка доступности внешних сервисов</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[280px] pr-3">
              <div className="space-y-3">
                {monitoredHosts.map((host) => (
                  <div
                    key={host.id}
                    className="p-3 rounded-lg border border-border/50 bg-background/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{host.name}</span>
                      {getStatusBadge(host.status)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-mono">{host.host}</span>
                      <Badge variant="outline" className="text-xs">{host.check_type}</Badge>
                    </div>
                    {host.response_time_ms && (
                      <p className="text-xs text-muted-foreground">
                        Время отклика: <span className="text-foreground">{host.response_time_ms}ms</span>
                      </p>
                    )}
                    <div className="flex gap-2 items-center">
                      <Switch
                        checked={host.is_active ?? false}
                        onCheckedChange={() => toggleHostActive(host.id, host.is_active ?? false)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto"
                        onClick={() => setEditingHost(host)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMonitoredHost(host.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {monitoredHosts.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    Нет хостов для мониторинга
                  </p>
                )}
              </div>
            </ScrollArea>

            <div className="border-t border-border/50 pt-4 space-y-3">
              <p className="text-sm font-medium">Добавить хост</p>
              <Input
                value={newHostName}
                onChange={(e) => setNewHostName(e.target.value)}
                placeholder="Название (Google, Cloudflare...)"
              />
              <Input
                value={newHostAddress}
                onChange={(e) => setNewHostAddress(e.target.value)}
                placeholder="Адрес (8.8.8.8, google.com...)"
              />
              <Select value={newHostType} onValueChange={(v: 'ping' | 'http' | 'tcp') => setNewHostType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ping">Ping (ICMP)</SelectItem>
                  <SelectItem value="http">HTTP Check</SelectItem>
                  <SelectItem value="tcp">TCP Port</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addMonitoredHost} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Добавить
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
                          profile.is_active
                            ? "border-success/50 bg-success/5"
                            : "border-border/50 bg-background/50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              profile.is_active ? "bg-success animate-pulse" : "bg-muted-foreground"
                            )} />
                            <span className="font-semibold">{profile.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={profile.is_active ?? false}
                              onCheckedChange={() => toggleVpnProfile(profile.id, profile.is_active ?? false)}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => exportVpnToConf(profile)}
                              title="Экспорт в .conf"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => setEditingVpn(profile)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
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
                                {profile.endpoint || '-'}
                              </code>
                              {profile.endpoint && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(profile.endpoint!, `endpoint-${profile.id}`)}
                                >
                                  {copied === `endpoint-${profile.id}` ? (
                                    <Check className="h-3 w-3 text-success" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Address</Label>
                            <code className="block px-2 py-1 bg-muted/50 rounded text-xs font-mono">
                              {profile.address || '-'}
                            </code>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Public Key</Label>
                            <code className="block px-2 py-1 bg-muted/50 rounded text-xs font-mono truncate">
                              {profile.public_key || '-'}
                            </code>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Private Key</Label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 px-2 py-1 bg-muted/50 rounded text-xs font-mono truncate">
                                {showPrivateKey[profile.id] ? profile.private_key : '••••••••••••••••••••'}
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
                              {profile.dns || '-'}
                            </code>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Allowed IPs</Label>
                            <code className="block px-2 py-1 bg-muted/50 rounded text-xs font-mono">
                              {profile.allowed_ips || '-'}
                            </code>
                          </div>
                        </div>
                      </div>
                    ))}
                    {vpnProfiles.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Нет VPN профилей. Добавьте вручную или импортируйте конфигурацию.
                      </p>
                    )}
                  </div>
                </ScrollArea>

                {/* Add VPN Form */}
                <div className="border-t border-border/50 pt-4 space-y-3">
                  <p className="text-sm font-medium">Добавить VPN профиль</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Input
                      value={newVpnName}
                      onChange={(e) => setNewVpnName(e.target.value)}
                      placeholder="Название профиля *"
                    />
                    <Input
                      value={newVpnEndpoint}
                      onChange={(e) => setNewVpnEndpoint(e.target.value)}
                      placeholder="Endpoint (vpn.example.com:51820)"
                    />
                    <Input
                      value={newVpnAddress}
                      onChange={(e) => setNewVpnAddress(e.target.value)}
                      placeholder="Address (10.0.0.2/24)"
                    />
                    <Input
                      value={newVpnDns}
                      onChange={(e) => setNewVpnDns(e.target.value)}
                      placeholder="DNS (1.1.1.1)"
                    />
                    <Input
                      value={newVpnPublicKey}
                      onChange={(e) => setNewVpnPublicKey(e.target.value)}
                      placeholder="Public Key"
                    />
                    <Input
                      value={newVpnPrivateKey}
                      onChange={(e) => setNewVpnPrivateKey(e.target.value)}
                      placeholder="Private Key"
                      type="password"
                    />
                    <Input
                      value={newVpnAllowedIps}
                      onChange={(e) => setNewVpnAllowedIps(e.target.value)}
                      placeholder="Allowed IPs (0.0.0.0/0)"
                      className="sm:col-span-2"
                    />
                  </div>
                  <Button onClick={addVpnProfile} className="gap-2" disabled={!newVpnName}>
                    <Plus className="h-4 w-4" />
                    Добавить профиль
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="dns" className="space-y-4">
                {/* Real System DNS */}
                {systemDns && (
                  <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Server className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">Текущий DNS сервера</span>
                      <Badge variant="outline" className="text-xs border-primary/50 text-primary">Системный</Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Nameservers</Label>
                        <div className="flex flex-wrap gap-2">
                          {systemDns.nameservers.map((ns, i) => (
                            <code key={i} className="px-2 py-1 bg-muted/50 rounded text-xs font-mono">{ns}</code>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Search Domains</Label>
                        <div className="flex flex-wrap gap-2">
                          {systemDns.search.map((s, i) => (
                            <code key={i} className="px-2 py-1 bg-muted/50 rounded text-xs font-mono">{s}</code>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dnsConfigs.map((dns) => (
                    <div
                      key={dns.id}
                      className={cn(
                        "p-4 rounded-lg border space-y-3",
                        dns.is_active
                          ? "border-success/50 bg-success/5"
                          : "border-border/50 bg-background/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{dns.name}</span>
                        <Badge variant="outline" className={cn("text-xs", getDnsTypeBadge(dns.dns_type))}>
                          {dns.dns_type}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('primaryDns')}</span>
                          <code className="font-mono">{dns.primary_dns}</code>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('secondaryDns')}</span>
                          <code className="font-mono">{dns.secondary_dns || '-'}</code>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={dns.is_active ?? false}
                          onCheckedChange={() => toggleDnsActive(dns.id, dns.is_active ?? false)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingDns(dns)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="ml-auto"
                          onClick={() => deleteDnsConfig(dns.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border/50 pt-4 space-y-3">
                  <p className="text-sm font-medium">{t('addDns')}</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Input
                      placeholder={t('title')}
                      value={newDnsName}
                      onChange={(e) => setNewDnsName(e.target.value)}
                    />
                    <Input
                      placeholder={t('primaryDns')}
                      value={newDnsPrimary}
                      onChange={(e) => setNewDnsPrimary(e.target.value)}
                    />
                    <Input
                      placeholder={t('secondaryDns')}
                      value={newDnsSecondary}
                      onChange={(e) => setNewDnsSecondary(e.target.value)}
                    />
                  </div>
                  <Button className="gap-2" onClick={addDnsConfig}>
                    <Plus className="h-4 w-4" />
                    {t('addDns')}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="import" className="space-y-4">
                {/* Existing WireGuard Configs from System */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 mr-2">
                        <Checkbox
                          checked={systemWgConfigs.length > 0 && selectedConfigs.size === systemWgConfigs.length}
                          onCheckedChange={toggleSelectAll}
                        />
                        <span className="text-xs text-muted-foreground">{selectedConfigs.size} выбр.</span>
                      </div>
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">VPN Локации</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedConfigs.size > 0 && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={deleteSelectedConfigs}
                          className="h-7 px-2"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Удалить ({selectedConfigs.size})
                        </Button>
                      )}
                      {wgStatus && !wgStatus.includes('not') && wgStatus !== 'unknown' && (
                        <Badge className="bg-success/20 text-success border-success/30">Подключено</Badge>
                      )}
                    </div>
                  </div>

                  {systemWgConfigs.length > 0 ? (
                    <div className="grid gap-2">
                      {systemWgConfigs.map((config) => (
                        <div
                          key={config.filename}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${selectedConfigs.has(config.name) ? 'border-primary/50 bg-primary/5' : 'border-border/50 bg-background/50 hover:bg-muted/30'}`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedConfigs.has(config.name)}
                              onCheckedChange={() => toggleSelection(config.name)}
                            />
                            <Globe className="h-5 w-5 text-primary" />
                            <div>
                              <span className="font-medium">{config.name}</span>
                              <p className="text-xs text-muted-foreground">{config.filename}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => applyWgConfig(config.name, config.content)}
                              disabled={applyingConfig === config.name}
                              className="gap-1"
                            >
                              {applyingConfig === config.name ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Activity className="h-3 w-3" />
                              )}
                              Подключить
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => renameWgConfig(config.name)}
                              title="Переименовать"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => {
                                try {
                                  const blob = new Blob([config.content], { type: 'text/plain' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = config.filename;
                                  document.body.appendChild(a); // Required for Firefox
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                } catch (e) {
                                  console.error("Download failed", e);
                                  toast.error("Ошибка скачивания");
                                }
                              }}
                              title="Скачать конфиг"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Нет сохранённых VPN конфигураций
                    </p>
                  )}
                </div>

                {/* Add New Config */}
                <div className="border-t border-border/50 pt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Добавить VPN локацию</span>
                  </div>

                  {/* File Upload */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      value={importConfigName}
                      onChange={(e) => setImportConfigName(e.target.value)}
                      placeholder="Название локации (usa, germany...)"
                      className="max-w-[200px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.conf';
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const content = await file.text();
                              setImportConfig(content);
                              // Автоматически берем имя из файла если не задано
                              if (!importConfigName) {
                                setImportConfigName(file.name.replace('.conf', ''));
                              }
                              toast.success(`Файл ${file.name} загружен`);
                            }
                          };
                          input.click();
                        }}
                      >
                        <FileCode className="h-4 w-4" />
                        Загрузить .conf
                      </Button>
                      <Button
                        onClick={saveNewWgConfig}
                        className="gap-2"
                        disabled={!importConfig.trim() || !importConfigName.trim() || !!applyingConfig}
                      >
                        {applyingConfig ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Добавить
                      </Button>
                    </div>
                  </div>

                  {/* Show loaded config preview */}
                  {importConfig && (
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Загруженная конфигурация:</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={() => {
                            setImportConfig('');
                            setImportConfigName('');
                          }}
                        >
                          Очистить
                        </Button>
                      </div>
                      <p className="text-sm font-medium">{importConfigName || 'Без названия'}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {importConfig.split('\n').length} строк
                      </p>
                    </div>
                  )}
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
            {interfaces.map((conn) => (
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

      {/* Edit VPN Dialog */}
      <Dialog open={!!editingVpn} onOpenChange={(open) => !open && setEditingVpn(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактировать VPN профиль</DialogTitle>
          </DialogHeader>
          {editingVpn && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input
                  value={editingVpn.name}
                  onChange={(e) => setEditingVpn({ ...editingVpn, name: e.target.value })}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Endpoint</Label>
                  <Input
                    value={editingVpn.endpoint || ''}
                    onChange={(e) => setEditingVpn({ ...editingVpn, endpoint: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={editingVpn.address || ''}
                    onChange={(e) => setEditingVpn({ ...editingVpn, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>DNS</Label>
                  <Input
                    value={editingVpn.dns || ''}
                    onChange={(e) => setEditingVpn({ ...editingVpn, dns: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Allowed IPs</Label>
                  <Input
                    value={editingVpn.allowed_ips || ''}
                    onChange={(e) => setEditingVpn({ ...editingVpn, allowed_ips: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Public Key</Label>
                  <Input
                    value={editingVpn.public_key || ''}
                    onChange={(e) => setEditingVpn({ ...editingVpn, public_key: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Private Key</Label>
                  <Input
                    type="password"
                    value={editingVpn.private_key || ''}
                    onChange={(e) => setEditingVpn({ ...editingVpn, private_key: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVpn(null)}>Отмена</Button>
            <Button onClick={updateVpnProfile}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit DNS Dialog */}
      <Dialog open={!!editingDns} onOpenChange={(open) => !open && setEditingDns(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать DNS конфигурацию</DialogTitle>
          </DialogHeader>
          {editingDns && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input
                  value={editingDns.name}
                  onChange={(e) => setEditingDns({ ...editingDns, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Основной DNS</Label>
                <Input
                  value={editingDns.primary_dns}
                  onChange={(e) => setEditingDns({ ...editingDns, primary_dns: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Вторичный DNS</Label>
                <Input
                  value={editingDns.secondary_dns || ''}
                  onChange={(e) => setEditingDns({ ...editingDns, secondary_dns: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Тип</Label>
                <Select
                  value={editingDns.dns_type || 'custom'}
                  onValueChange={(v) => setEditingDns({ ...editingDns, dns_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cloudflare">Cloudflare</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="adguard">AdGuard</SelectItem>
                    <SelectItem value="quad9">Quad9</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDns(null)}>Отмена</Button>
            <Button onClick={updateDnsConfig}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Host Dialog */}
      <Dialog open={!!editingHost} onOpenChange={(open) => !open && setEditingHost(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать хост мониторинга</DialogTitle>
          </DialogHeader>
          {editingHost && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input
                  value={editingHost.name}
                  onChange={(e) => setEditingHost({ ...editingHost, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Адрес</Label>
                <Input
                  value={editingHost.host}
                  onChange={(e) => setEditingHost({ ...editingHost, host: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Тип проверки</Label>
                <Select
                  value={editingHost.check_type || 'ping'}
                  onValueChange={(v) => setEditingHost({ ...editingHost, check_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ping">Ping (ICMP)</SelectItem>
                    <SelectItem value="http">HTTP Check</SelectItem>
                    <SelectItem value="tcp">TCP Port</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingHost(null)}>Отмена</Button>
            <Button onClick={updateMonitoredHost}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default NetworkPage;
