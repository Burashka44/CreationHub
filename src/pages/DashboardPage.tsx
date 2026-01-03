import VpnMap from '@/components/dashboard/VpnMap';
import NetworkMonitor from '@/components/dashboard/NetworkMonitor';
import SecurityStatus from '@/components/dashboard/SecurityStatus';
import BackupStatus from '@/components/dashboard/BackupStatus';
import DiskStorageBar from '@/components/dashboard/DiskStorageBar';
import QuickActions from '@/components/dashboard/QuickActions';
import ServerStats from '@/components/dashboard/ServerStats';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import ResourceMeters from '@/components/dashboard/ResourceMeters';
import TrafficStats from '@/components/dashboard/TrafficStats';
import ServiceCard from '@/components/dashboard/ServiceCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface Service {
  id: string;
  name: string;
  port: string;
  status: 'online' | 'offline' | 'unknown';
  icon: string;
}

const DashboardPage = () => {
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);

  // Fetch services from database
  const fetchServices = async () => {
    // 1. Get services
    const { data: servicesData, error } = await supabase
      .from('services')
      .select('id, name, port, status, icon')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .limit(10);

    if (!error && servicesData) {
      setServices(servicesData.map(s => ({
        ...s,
        status: (s.status === 'online' ? 'online' : 'offline')
      })));
    }
  };

  // Check service status by pinging
  const checkServiceStatus = async (port: string): Promise<'online' | 'offline'> => {
    const host = typeof window !== 'undefined' ? window.location.hostname : '192.168.1.220';
    const targetUrl = `http://${host}:${port}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      await fetch(targetUrl, { mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeoutId);
      return 'online';
    } catch {
      return 'offline';
    }
  };

  // Update statuses
  const updateServiceStatuses = async () => {
    if (services.length === 0) return;

    const statusPromises = services.map(async (service) => {
      const port = service.port.toString().split(/\D/)[0];
      const status = await checkServiceStatus(port);
      return { id: service.id, status };
    });

    const results = await Promise.all(statusPromises);

    setServices(prev => prev.map(s => {
      const result = results.find(r => r.id === s.id);
      return result ? { ...s, status: result.status } : s;
    }));
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (services.length > 0) {
      updateServiceStatuses();
      const interval = setInterval(updateServiceStatuses, 30000);
      return () => clearInterval(interval);
    }
  }, [services.length]);

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

      {/* Row 2: Performance Chart */}
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
            <ServiceCard
              key={service.id}
              name={service.name}
              port={parseInt(service.port.toString().split(/\D/)[0]) || 80}
              status={service.status}
            />
          ))}
        </div>
      </div>

      {/* Row 7: Disk Storage (Full Width, No Activity Log) */}
      <DiskStorageBar />
    </div>
  );
};

export default DashboardPage;
