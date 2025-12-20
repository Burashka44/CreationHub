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
  { name: 'Nginx', status: 'online' as const, port: 80 },
  { name: 'PostgreSQL', status: 'online' as const, port: 5432 },
  { name: 'Redis', status: 'online' as const, port: 6379 },
  { name: 'Docker', status: 'online' as const, port: 2375 },
  { name: 'SSH', status: 'online' as const, port: 22 },
  { name: 'FTP', status: 'offline' as const, port: 21 },
];

const DashboardPage = () => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      {/* Row 1: Server Info + VPN Map + Network Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
