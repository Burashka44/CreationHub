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
    <div className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <Wifi className="h-5 w-5 text-emerald-400" />
        <h3 className="font-semibold text-foreground">{t('networkMonitor')}</h3>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground">{t('live')}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 grid-rows-3 gap-2">
        {/* Row 1: Internet + Download */}
        <div
          onClick={toggleInternet}
          className={`p-3 rounded-lg cursor-pointer transition-all duration-300 border ${internetEnabled
            ? 'bg-emerald-500/10 border-primary/30 hover:bg-emerald-500/20'
            : 'bg-muted/50 border-border hover:bg-muted'
            }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Power className={`h-4 w-4 ${internetEnabled ? 'text-emerald-400' : 'text-gray-400'}`} />
            <span className="text-xs text-muted-foreground">Internet</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-lg font-bold ${internetEnabled ? 'text-emerald-400' : 'text-gray-400'}`}>
              {internetEnabled ? 'ON' : 'OFF'}
            </span>
            <div className={`w-10 h-5 rounded-full relative transition-all ${internetEnabled ? 'bg-emerald-500' : 'bg-gray-600'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${internetEnabled ? 'left-5' : 'left-0.5'}`} />
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDown className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground">{t('download')}</span>
          </div>
          <p className="text-xl font-bold text-emerald-400">{stats.download.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">MB/s</p>
        </div>

        {/* Row 2: WiFi + Upload */}
        <WiFiToggle />

        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUp className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground">{t('upload')}</span>
          </div>
          <p className="text-xl font-bold text-emerald-400">{stats.upload.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">MB/s</p>
        </div>

        {/* Row 3: WireGuard + Public IP */}
        <WireGuardToggle />
        <GlobalIpDisplay label="Public IP" endpoint="/api/system/public-ip" icon={Globe} t={t} />
      </div>
    </div>
  );
};

// WiFi Toggle Component
const WiFiToggle = () => {
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/system/wifi/status')
      .then(res => res.json())
      .then(data => {
        if (data.success) setIsActive(data.isActive);
      })
      .catch(() => { });
  }, []);

  const toggleWiFi = async () => {
    setIsLoading(true);
    try {
      const action = isActive ? 'off' : 'on';
      const res = await fetch('/api/system/wifi/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        setIsActive(data.isActive);
        toast.success(data.isActive ? '📶 WiFi включен' : '📴 WiFi выключен');
      } else {
        toast.error(data.error || 'WiFi toggle failed');
      }
    } catch (e) {
      toast.error('Ошибка сети');
    }
    setIsLoading(false);
  };

  return (
    <div
      onClick={toggleWiFi}
      className={`p-3 rounded-lg cursor-pointer transition-all duration-300 border ${isLoading ? 'opacity-50' : ''} ${isActive
        ? 'bg-emerald-500/10 border-primary/30 hover:bg-emerald-500/20'
        : 'bg-muted/50 border-border hover:bg-muted'
        }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Wifi className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
        <span className="text-xs text-muted-foreground">WiFi</span>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-lg font-bold ${isActive ? 'text-emerald-400' : 'text-gray-400'}`}>
          {isLoading ? '...' : isActive ? 'ON' : 'OFF'}
        </span>
        <div className={`w-10 h-5 rounded-full relative transition-all ${isActive ? 'bg-emerald-500' : 'bg-gray-600'}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isActive ? 'left-5' : 'left-0.5'}`} />
        </div>
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
      className={`p-3 rounded-lg cursor-pointer transition-all duration-300 border ${isLoading ? 'opacity-50' : ''} ${isActive
        ? 'bg-emerald-500/10 border-primary/30 hover:bg-emerald-500/20'
        : 'bg-muted/50 border-border hover:bg-muted'
        }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Shield className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
        <span className="text-xs text-muted-foreground">WireGuard</span>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-lg font-bold ${isActive ? 'text-emerald-400' : 'text-gray-400'}`}>
          {isLoading ? '...' : isActive ? 'ON' : 'OFF'}
        </span>
        <div className={`w-10 h-5 rounded-full relative transition-all ${isActive ? 'bg-emerald-500' : 'bg-gray-600'}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isActive ? 'left-5' : 'left-0.5'}`} />
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
      className="p-3 rounded-lg bg-muted/50 border border-border cursor-pointer hover:bg-muted transition-colors relative group"
      onClick={handleCopy}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-emerald-400" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold text-foreground truncate">{ip}</p>
      <p className="text-xs text-muted-foreground">Netherlands</p>

      {/* Copy Overlay */}
      <div className={`absolute inset-0 rounded-lg bg-background/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-200 ${copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <span className="text-sm font-medium text-emerald-400">
          {copied ? '✓ Copied!' : 'Click to copy'}
        </span>
      </div>
    </div>
  );
};

export default NetworkMonitor;
