import VpnMap from '@/components/dashboard/VpnMap';
import SystemGauges from '@/components/dashboard/SystemGauges';
import DiskStorageBar from '@/components/dashboard/DiskStorageBar';
import ServiceCard from '@/components/dashboard/ServiceCard';
import QuickActions from '@/components/dashboard/QuickActions';
import NetworkMonitor from '@/components/dashboard/NetworkMonitor';
import SecurityStatus from '@/components/dashboard/SecurityStatus';
import BackupStatus from '@/components/dashboard/BackupStatus';
import OnlineUsers from '@/components/dashboard/OnlineUsers';
import ActivityLog from '@/components/dashboard/ActivityLog';
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
    <>
      {/* Row 1: System Gauges (CPU/GPU/RAM) + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <SystemGauges />
        </div>
        <QuickActions />
      </div>
      
      {/* Row 2: Network Monitor + Security + Backups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NetworkMonitor />
        </div>
        <div className="space-y-6">
          <SecurityStatus />
          <BackupStatus />
        </div>
      </div>
      
      {/* Row 3: Services */}
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
      
      {/* Row 4: Map + Online Users */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <VpnMap />
        <OnlineUsers />
      </div>
      
      {/* Row 5: Activity Log + Disk Storage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityLog />
        <DiskStorageBar />
      </div>
    </>
  );
};

export default DashboardPage;
