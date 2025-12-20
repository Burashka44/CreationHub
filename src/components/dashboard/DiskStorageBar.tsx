import { HardDrive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface Disk {
  name: string;
  mountPoint: string;
  total: number; // GB
  used: number; // GB
  type: 'ssd' | 'hdd' | 'nvme';
}

const mockDisks: Disk[] = [
  { name: 'System Drive', mountPoint: '/', total: 512, used: 198, type: 'nvme' },
  { name: 'Data Storage', mountPoint: '/data', total: 2000, used: 1247, type: 'ssd' },
  { name: 'Backup Drive', mountPoint: '/backup', total: 4000, used: 2890, type: 'hdd' },
  { name: 'Media Storage', mountPoint: '/media', total: 8000, used: 5632, type: 'hdd' },
];

const formatSize = (gb: number) => {
  if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
  return `${gb} GB`;
};

const getUsageColor = (percent: number) => {
  if (percent < 50) return 'bg-emerald-500';
  if (percent < 75) return 'bg-yellow-500';
  if (percent < 90) return 'bg-orange-500';
  return 'bg-red-500';
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'nvme': return 'text-purple-400';
    case 'ssd': return 'text-blue-400';
    case 'hdd': return 'text-muted-foreground';
    default: return 'text-muted-foreground';
  }
};

const DiskStorageBar = () => {
  const { t } = useLanguage();
  
  const totalStorage = mockDisks.reduce((sum, d) => sum + d.total, 0);
  const usedStorage = mockDisks.reduce((sum, d) => sum + d.used, 0);
  const overallPercent = (usedStorage / totalStorage) * 100;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            {t('diskUsage')}
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {formatSize(usedStorage)} / {formatSize(totalStorage)} ({overallPercent.toFixed(1)}%)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockDisks.map((disk) => {
          const percent = (disk.used / disk.total) * 100;
          const free = disk.total - disk.used;
          
          return (
            <div key={disk.mountPoint} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{disk.name}</span>
                  <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {disk.mountPoint}
                  </code>
                  <span className={`text-xs uppercase font-medium ${getTypeColor(disk.type)}`}>
                    {disk.type}
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {formatSize(disk.used)} / {formatSize(disk.total)}
                </span>
              </div>
              
              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getUsageColor(percent)} transition-all duration-500 rounded-full`}
                  style={{ width: `${percent}%` }}
                />
                {/* Markers */}
                <div className="absolute inset-0 flex">
                  <div className="w-1/4 border-r border-background/30" />
                  <div className="w-1/4 border-r border-background/30" />
                  <div className="w-1/4 border-r border-background/30" />
                </div>
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{percent.toFixed(1)}% занято</span>
                <span>{formatSize(free)} свободно</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default DiskStorageBar;
