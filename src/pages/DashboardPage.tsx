import VpnMap from '@/components/dashboard/VpnMap';
import NetworkMonitor from '@/components/dashboard/NetworkMonitor';
import SecurityStatus from '@/components/dashboard/SecurityStatus';
import BackupStatus from '@/components/dashboard/BackupStatus';
import ActivityLog from '@/components/dashboard/ActivityLog';
import DiskStorageBar from '@/components/dashboard/DiskStorageBar';
import QuickActions from '@/components/dashboard/QuickActions';
import ServerStats from '@/components/dashboard/ServerStats';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import ResourceMeters from '@/components/dashboard/ResourceMeters';
import TrafficStats from '@/components/dashboard/TrafficStats';
import ServiceCard from '@/components/dashboard/ServiceCard';
import { useLanguage } from '@/contexts/LanguageContext';

const services = [
  { name: 'CreationHub', status: 'online' as const, port: 80 },
  { name: 'Portainer', status: 'online' as const, port: 9000 },
  { name: 'NPM', status: 'online' as const, port: 81 },
  { name: 'n8n', status: 'online' as const, port: 5678 },
  { name: 'FileBrowser', status: 'online' as const, port: 8082 },
  { name: 'Glances', status: 'online' as const, port: 61208 },
];

const DashboardPage = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Row 1: Server Info + VPN Map + Network Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-3 bg-primary/10 p-4 rounded-lg border border-primary text-center">
          <h2 className="text-xl font-bold text-primary">CREATION HUB: GLANCES LINKED v2.2 (FIXED)</h2>
          <p className="text-sm opacity-80">Stats loaded from Server (192.168.1.220)</p>
        </div>
        <ServerStats />
        <VpnMap />
        <NetworkMonitor />
      </div>

      {/* Row 2: Performance Chart (full width) */}
      <PerformanceChart />

      {/* Row 3: Resource Meters */}
      <ResourceMeters />

      {/* Row 4: Traffic Stats */}
      <TrafficStats />

      {/* Row 5: Quick Actions + Security + Backup */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActions />
        <SecurityStatus />
        <BackupStatus />
      </div>

      {/* Row 6: Services */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          {t('services')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {services.map((service) => (
            <ServiceCard key={service.name} {...service} />
          ))}
        </div>
      </div>

      {/* Row 7: Activity Log + Disk Storage */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActivityLog />
        <DiskStorageBar />
      </div>
    </div>
  );
};

export default DashboardPage;
