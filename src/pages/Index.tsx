import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsBar from '@/components/dashboard/StatsBar';
import VpnMap from '@/components/dashboard/VpnMap';
import SystemCharts from '@/components/dashboard/SystemCharts';
import ServiceCard from '@/components/dashboard/ServiceCard';
import ChannelManager from '@/components/dashboard/ChannelManager';
import { useLanguage } from '@/contexts/LanguageContext';

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
  
  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar />
      
      <div className="flex-1 flex flex-col ml-64">
        <DashboardHeader />
        
        <main className="flex-1 p-4 lg:p-6 space-y-6 overflow-auto">
          {/* Stats Bar */}
          <StatsBar />
          
          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* VPN Map */}
            <VpnMap />
            
            {/* System Charts */}
            <SystemCharts />
          </div>
          
          {/* Services & Channels Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Services */}
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
            
            {/* Channel Manager */}
            <ChannelManager />
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
        <DashboardContent />
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default Index;
