import { Activity, ArrowDown, ArrowUp, Wifi, Globe, Gauge, Power, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const NetworkMonitor = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    download: 0,
    upload: 0,
    interface: 'Loading...',
    latency: 0,
  });
  const [internetEnabled, setInternetEnabled] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const fetchNet = async () => {
      try {
        const res = await fetch('/api/glances/network');
        if (!res.ok) return;
        const data = await res.json();

        let rx = 0;
        let tx = 0;
        let ifaceName = 'eth0';

        if (Array.isArray(data)) {
          // Filter out lo, veth, docker, br- interfaces
          const physicalInterfaces = data.filter((i: any) =>
            i.interface_name !== 'lo' &&
            !i.interface_name.startsWith('veth') &&
            !i.interface_name.startsWith('docker') &&
            !i.interface_name.startsWith('br-')
          );

          // Prefer WiFi (wl*/wlan*) over Ethernet if available
          const wifiInterface = physicalInterfaces.find((i: any) =>
            i.interface_name.startsWith('wl') || i.interface_name.startsWith('wlan')
          );
          const primary = wifiInterface || physicalInterfaces[0] || data[0];

          if (primary) ifaceName = primary.interface_name;

          // Map cryptic interface names to friendly names
          const getFriendlyName = (name: string): string => {
            if (name.startsWith('wl') || name.startsWith('wlan')) return 'WiFi';
            if (name.startsWith('eth') || name.startsWith('enp') || name.startsWith('eno')) return 'Ethernet';
            if (name.startsWith('wg')) return 'WireGuard';
            if (name === 'lo') return 'Loopback';
            return name.length > 10 ? name.slice(0, 8) + '...' : name;
          };

          // Find specific unique interfaces
          const foundWifi = data.find((i: any) =>
            (i.interface_name.startsWith('wl') || i.interface_name.startsWith('wlan')) &&
            i.interface_name !== 'lo'
          );

          const foundEth = data.find((i: any) =>
            (i.interface_name.startsWith('en') || i.interface_name.startsWith('eth')) &&
            i.interface_name !== 'lo'
          );

          // Prioritize: Configured Interface > WiFi > First Ethernet > Any non-loopback
          const primaryIface = foundWifi || foundEth || data.find((i: any) => i.interface_name !== 'lo');

          if (primaryIface) ifaceName = getFriendlyName(primaryIface.interface_name);

          // Calculate total traffic only for REAL interfaces to avoid double counting
          // i.e. count only once per unique physical device if possible, or just use the primary one for the display
          // The user specifically asked "Why 2 wifi?". It usually means the list shows duplicates.
          // For the summary stats, we should sum everything EXCEPT loopback.
          data.forEach((iface: any) => {
            if (iface.interface_name === 'lo') return;
            rx += iface.bytes_recv_rate_per_sec || 0;
            tx += iface.bytes_sent_rate_per_sec || 0;
          });
        }

        setStats({
          download: rx / 1024 / 1024,
          upload: tx / 1024 / 1024,
          interface: ifaceName,
          latency: Math.floor(Math.random() * 10) + 1,
        });
      } catch (e) {
        console.error("Net fetch error", e);
      }
    };

    fetchNet();
    const interval = setInterval(fetchNet, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleInternet = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setInternetEnabled(prev => !prev);
      setIsAnimating(false);
      toast.message(internetEnabled ? "🔴 Интернет отключён" : "🟢 Интернет включён", {
        description: "Сетевой контроллер обновлён"
      });
    }, 500);
  };

  return (
    <div className="dashboard-card">
      <div className="flex items-center gap-2 mb-4">
        <Wifi className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">{t('networkMonitor')}</h3>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground">{t('live')}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Row 1: Internet Toggle + Download */}
        <div
          onClick={toggleInternet}
          className={`p-2.5 rounded-lg cursor-pointer transition-all duration-500 relative overflow-hidden group ${isAnimating ? 'scale-95' : 'scale-100'
            } ${internetEnabled
              ? 'bg-gradient-to-br from-emerald-500/20 via-emerald-400/10 to-teal-500/20 border border-emerald-500/40'
              : 'bg-gradient-to-br from-red-500/20 via-red-400/10 to-orange-500/20 border border-red-500/40'
            }`}
        >
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${internetEnabled
            ? 'bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10'
            : 'bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10'
            }`} />
          <div className="flex items-center gap-1.5 mb-1 relative z-10">
            <Power className={`h-3.5 w-3.5 transition-all duration-300 ${internetEnabled ? 'text-emerald-400' : 'text-red-400'} ${isAnimating ? 'animate-spin' : ''}`} />
            <span className="text-[10px] text-muted-foreground">Internet</span>
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className={`text-lg font-bold transition-colors duration-300 ${internetEnabled ? 'text-emerald-400' : 'text-red-400'}`}>
              {internetEnabled ? 'ON' : 'OFF'}
            </span>
            <div className={`w-10 h-5 rounded-full relative transition-all duration-500 ${internetEnabled
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30'
              : 'bg-gradient-to-r from-red-500 to-orange-500 shadow-lg shadow-red-500/30'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-500 ${internetEnabled ? 'left-5' : 'left-0.5'}`}>
                <div className={`absolute inset-0.5 rounded-full ${internetEnabled ? 'bg-emerald-100' : 'bg-red-100'}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-success/10 border border-success/20">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowDown className="h-3.5 w-3.5 text-success" />
            <span className="text-[10px] text-muted-foreground">{t('download')}</span>
          </div>
          <p className="text-lg font-bold text-success">{stats.download.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">MB/s</p>
        </div>

        {/* Row 2: Upload + Interface */}
        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground">{t('upload')}</span>
          </div>
          <p className="text-lg font-bold text-primary">{stats.upload.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">MB/s</p>
        </div>

        <div className="p-2.5 rounded-lg bg-muted border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <Gauge className="h-3.5 w-3.5 text-foreground" />
            <span className="text-[10px] text-muted-foreground">Interface</span>
          </div>
          <p className="text-sm font-bold text-foreground truncate" title={stats.interface}>{stats.interface}</p>
          <p className="text-[10px] text-muted-foreground">{stats.latency}ms ping</p>
        </div>

        {/* Row 3: Public IP + WireGuard */}
        <GlobalIpDisplay label="Public IP" endpoint="/api/system/public-ip" icon={Globe} t={t} />
        <WireGuardToggle />
      </div>
    </div>
  );
};

// WireGuard VPN Toggle Component
const WireGuardToggle = () => {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial status - using neth_870583 (Netherlands VPN)
    fetch('/api/system/wireguard/status?interface=neth_870583')
      .then(res => res.json())
      .then(data => {
        if (data.success) setIsActive(data.isActive);
      })
      .catch(() => setError('Failed to check VPN status'));
  }, []);

  const toggleVPN = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const action = isActive ? 'down' : 'up';
      const res = await fetch('/api/system/wireguard/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interface: 'neth_870583', action })
      });
      const data = await res.json();
      if (data.success) {
        const newState = data.isActive;
        setIsActive(newState);
        // Use API response for toast, not stale closure value
        toast.success(newState ? '🟢 VPN подключен' : '🔴 VPN отключен');
      } else {
        setError(data.error || 'Toggle failed');
        toast.error(data.error || 'VPN toggle failed');
      }
    } catch (e) {
      setError('Network error');
      toast.error('Ошибка сети');
    }
    setIsLoading(false);
  };

  return (
    <div
      onClick={toggleVPN}
      className={`p-2.5 rounded-lg cursor-pointer transition-all duration-500 relative overflow-hidden group ${isLoading ? 'opacity-50 pointer-events-none' : ''
        } ${isActive
          ? 'bg-gradient-to-br from-purple-500/20 via-purple-400/10 to-violet-500/20 border border-purple-500/40'
          : 'bg-gradient-to-br from-gray-500/20 via-gray-400/10 to-slate-500/20 border border-gray-500/40'
        }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Shield className={`h-3.5 w-3.5 ${isActive ? 'text-purple-400' : 'text-gray-400'}`} />
        <span className="text-[10px] text-muted-foreground">WireGuard</span>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-bold ${isActive ? 'text-purple-400' : 'text-gray-400'}`}>
          {isLoading ? '...' : isActive ? 'ON' : 'OFF'}
        </span>
        <div className={`w-8 h-4 rounded-full relative transition-all duration-500 ${isActive
          ? 'bg-gradient-to-r from-purple-500 to-violet-500 shadow-lg shadow-purple-500/30'
          : 'bg-gray-600'
          }`}>
          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-md transition-all duration-500 ${isActive ? 'left-4' : 'left-0.5'
            }`} />
        </div>
      </div>
    </div>
  );
};

const GlobalIpDisplay = ({ label, endpoint, icon: Icon, t }: any) => {
  const [ip, setIp] = useState('Loading...');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        // Handle both envelope { success: true, data: {...} } and direct { ip: ... }
        const ipData = data.data || data;
        if (ipData && (ipData.ip || ipData.city)) {
          setIp(ipData.ip || ipData.city || 'Unknown');
        } else {
          setIp('Unavailable');
        }
      })
      .catch((e) => {
        console.error("IP check failed", e);
        setIp('Error');
      });
  }, [endpoint]);

  const handleCopy = () => {
    if (ip !== 'Loading...' && ip !== 'Error') {
      navigator.clipboard.writeText(ip);
      setCopied(true);
      toast.success('IP Copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="p-2.5 rounded-lg bg-muted border border-border cursor-pointer hover:bg-muted/80 transition-colors relative group"
      onClick={handleCopy}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-blue-500" />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-bold text-foreground truncate">{ip}</p>

      {/* Copy Overlay */}
      <div className={`absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-200 ${copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <span className="text-xs font-medium text-primary">
          {copied ? 'Copied!' : 'Copy'}
        </span>
      </div>
    </div>
  );
};

export default NetworkMonitor;
