import { HardDrive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

const DiskStorageBar = () => {
  const { t } = useLanguage();
  const [disks, setDisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDisks = async () => {
      try {
        const res = await fetch('/api/glances/fs');
        if (!res.ok) return;
        const data = await res.json();

        // Strict filtering based on user environment
        const realDisks: any[] = [];

        // Exact names of files to ignore (Docker often mounts these into containers)
        const ignoredFiles = [
          '/etc/hostname',
          '/etc/hosts',
          '/etc/resolv.conf',
          '/dev/shm' // often a tmpfs
        ];

        data.forEach((fs: any) => {
          const mount = fs.mnt_point;

          // 1. Explicit Ignores - Filter out system crap
          if (ignoredFiles.some(f => mount.includes(f))) return; // aggressive match
          if (mount.includes('/boot') || mount.includes('/efi')) return;
          if (mount.startsWith('/run') || mount.startsWith('/sys') || mount.startsWith('/proc') || mount.startsWith('/dev')) return;
          if (mount.includes('containers') || mount.includes('overlay') || mount.includes('docker')) return;

          let displayName = '';
          let show = false;

          // 2. Specific Mappings
          // The user screenshot showed /host path, so we map that to System
          if (mount === '/' || mount === '/host') {
            displayName = 'System (C:)';
            show = true;
          } else if (mount.includes('/volumes/media')) {
            displayName = 'Media (D:)';
            show = true;
          } else if (mount.includes('/compose/backups')) {
            displayName = 'Backups (E:)';
            show = true;
          } else if (mount === '/home') {
            displayName = 'Home Data';
            show = true;
          }

          // 3. Fallback: if it's large (> 50GB) and not system path
          if (!show) {
            const sizeGB = fs.size / 1024 / 1024 / 1024;
            if (sizeGB > 50 && !mount.startsWith('/host/')) {
              displayName = mount.split('/').pop()?.toUpperCase() || 'Disk';
              show = true;
            }
          }

          if (show) {
            // Check for duplicate display names
            if (realDisks.some(d => d.name === displayName)) return;

            realDisks.push({
              name: displayName,
              mountPoint: mount.replace('/host', '') || '/',
              used: fs.used / 1024 / 1024 / 1024,
              total: fs.size / 1024 / 1024 / 1024,
              type: fs.fs_type.toUpperCase(),
              percent: fs.percent
            });
          }
        });

        // Sort: System (C) < Media (D) < Backups (E) < Others
        realDisks.sort((a, b) => {
          const getOrder = (name: string) => {
            if (name.includes('(C:)')) return 1;
            if (name.includes('(D:)')) return 2;
            if (name.includes('(E:)')) return 3;
            return 4;
          };
          const orderA = getOrder(a.name);
          const orderB = getOrder(b.name);

          if (orderA !== orderB) return orderA - orderB;
          return a.name.localeCompare(b.name);
        });

        setDisks(realDisks);
      } catch (e) {
        console.error("Disk fetch failed", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDisks();
    const interval = setInterval(fetchDisks, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatSize = (gb: number) => {
    if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
    return `${gb.toFixed(1)} GB`;
  };

  const getUsageColor = (percent: number) => {
    if (percent > 90) return 'bg-red-500';
    return 'bg-blue-500';
  };

  if (loading && disks.length === 0) return null;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          {t('diskUsage')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {disks.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">No disks found</div>
        ) : (
          disks.map((disk) => {
            const free = disk.total - disk.used;
            return (
              <div key={disk.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{disk.name}</span>
                  </div>
                  <span className="text-sm text-foreground">
                    {formatSize(disk.used)} / {formatSize(disk.total)}
                  </span>
                </div>

                <div className="relative h-4 bg-secondary rounded-full overflow-hidden border border-border/50">
                  <div
                    className={`h-full ${getUsageColor(disk.percent)} transition-all duration-500`}
                    style={{ width: `${disk.percent}%` }}
                  />
                </div>

                <div className="flex justify-end text-xs text-muted-foreground">
                  <span>{formatSize(free)} free</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default DiskStorageBar;
