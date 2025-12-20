import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Sidebar, { SidebarProvider, useSidebar } from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsBar from '@/components/dashboard/StatsBar';
import VpnMap from '@/components/dashboard/VpnMap';
import SystemCharts from '@/components/dashboard/SystemCharts';
import ServiceCard from '@/components/dashboard/ServiceCard';
import ChannelManager from '@/components/dashboard/ChannelManager';
import QuickActions from '@/components/dashboard/QuickActions';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';
import NetworkMonitor from '@/components/dashboard/NetworkMonitor';
import ActivityLog from '@/components/dashboard/ActivityLog';
import BackupStatus from '@/components/dashboard/BackupStatus';
import SecurityStatus from '@/components/dashboard/SecurityStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const services = [
  { name: 'Nginx', status: 'online' as const, port: 80 },
  { name: 'PostgreSQL', status: 'online' as const, port: 5432 },
  { name: 'Redis', status: 'online' as const, port: 6379 },
  { name: 'Docker', status: 'online' as const, port: 2375 },
  { name: 'SSH', status: 'online' as const, port: 22 },
  { name: 'FTP', status: 'offline' as const, port: 21 },
];

const DashboardContent = () => {
  const { t } = useLanguage();
  const { isOpen } = useSidebar();
  
  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar />
      
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        isOpen ? "ml-64" : "ml-16"
      )}>
        <DashboardHeader />
        
        <main className="flex-1 p-4 lg:p-6 space-y-6 overflow-auto scrollbar-thin">
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
        </main>
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SidebarProvider>
          <DashboardContent />
        </SidebarProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default Index;
