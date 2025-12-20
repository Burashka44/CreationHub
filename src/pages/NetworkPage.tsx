import NetworkMonitor from '@/components/dashboard/NetworkMonitor';
import VpnMap from '@/components/dashboard/VpnMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { Network, Globe, Wifi, Router } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const NetworkPage = () => {
  const { t } = useLanguage();
  
  const connections = [
    { name: 'eth0', ip: '192.168.1.100', type: 'Ethernet', speed: '1 Gbps' },
    { name: 'wlan0', ip: '192.168.1.101', type: 'WiFi', speed: '300 Mbps' },
    { name: 'docker0', ip: '172.17.0.1', type: 'Bridge', speed: '10 Gbps' },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Network className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('network')}</h1>
          <p className="text-muted-foreground">Мониторинг сетевых подключений</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <NetworkMonitor />
        <VpnMap />
      </div>
      
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Router className="h-5 w-5 text-primary" />
            Сетевые интерфейсы
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
                  <div className="p-2 rounded-lg bg-success/10">
                    <Wifi className="h-4 w-4 text-success" />
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
