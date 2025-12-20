import StatsBar from '@/components/dashboard/StatsBar';
import VpnMap from '@/components/dashboard/VpnMap';
import SystemCharts from '@/components/dashboard/SystemCharts';
import ServiceCard from '@/components/dashboard/ServiceCard';
import ChannelManager from '@/components/dashboard/ChannelManager';
import QuickActions from '@/components/dashboard/QuickActions';
import NetworkMonitor from '@/components/dashboard/NetworkMonitor';
import SecurityStatus from '@/components/dashboard/SecurityStatus';
import BackupStatus from '@/components/dashboard/BackupStatus';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';
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
      {/* Stats Bar */}
      <StatsBar />
      
      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickActions />
        <div className="lg:col-span-2">
          <NetworkMonitor />
        </div>
      </div>
      
      {/* Main Grid - Map & Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <VpnMap />
        <SystemCharts />
      </div>
      
      {/* Services & Channels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            {t('services')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {services.map((service) => (
              <ServiceCard key={service.name} {...service} />
            ))}
          </div>
        </div>
        <ChannelManager />
      </div>
      
      {/* Security, Backups, Notifications & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <SecurityStatus />
        <BackupStatus />
        <NotificationsPanel />
        <ActivityLog />
      </div>
    </>
  );
};

export default DashboardPage;
