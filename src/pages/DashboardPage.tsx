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
      .order('category', { ascending: true });

    if (!error && servicesData) {
      setServices(servicesData.map(s => ({
        ...s,
        status: (s.status === 'online' ? 'online' : 'offline')
      })));
    }
  };

  // Update statuses via System API
  const updateServiceStatuses = async () => {
    if (services.length === 0) return;

    try {
      const res = await fetch('/api/services/status-by-port');
      if (res.ok) {
        const statuses = await res.json();

        setServices(prev => prev.map(s => {
          // Extract port number from string (e.g. "8080/tcp" -> "8080")
          const portKey = s.port.toString().split(/\D/)[0];

          // Use status from API, default to 'offline' if not found
          // API returns: 'online' or 'offline'
          const apiStatus = statuses[portKey];

          // If we have an explicit status from API, use it. 
          // Otherwise keep existing status (which might be from initial DB load) or default to offline.
          const finalStatus = apiStatus || s.status || 'offline';

          return { ...s, status: finalStatus };
        }));
      }
    } catch (e) {
      console.error("Failed to fetch service statuses", e);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (services.length > 0) {
      updateServiceStatuses();
      const interval = setInterval(updateServiceStatuses, 10000); // 10s interval
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
