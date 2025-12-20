import { HardDrive, Cloud, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface BackupItem {
  id: string;
  name: string;
  size: string;
  date: string;
  status: 'completed' | 'in-progress' | 'failed';
  type: 'local' | 'cloud';
}

const BackupStatus = () => {
  const backups: BackupItem[] = [
    { id: '1', name: 'Full System Backup', size: '12.4 GB', date: 'Today, 03:00', status: 'completed', type: 'local' },
    { id: '2', name: 'Database Backup', size: '2.1 GB', date: 'Today, 06:00', status: 'completed', type: 'cloud' },
    { id: '3', name: 'Media Files', size: '8.7 GB', date: 'In progress...', status: 'in-progress', type: 'cloud' },
    { id: '4', name: 'Config Backup', size: '156 MB', date: 'Yesterday, 12:00', status: 'completed', type: 'local' },
  ];

  const totalSpace = 100;
  const usedSpace = 67;

  const getStatusIcon = (status: BackupItem['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-warning animate-pulse" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <div className="dashboard-card">
      <div className="flex items-center gap-2 mb-4">
        <HardDrive className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Backup Status</h3>
      </div>

      {/* Storage Overview */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Storage Used</span>
          <span className="text-sm font-medium text-foreground">{usedSpace} GB / {totalSpace} GB</span>
        </div>
        <Progress value={(usedSpace / totalSpace) * 100} className="h-2" />
      </div>

      {/* Backup List */}
      <div className="space-y-2">
        {backups.map((backup) => (
          <div
            key={backup.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className={cn(
              "p-2 rounded-lg",
              backup.type === 'cloud' ? 'bg-primary/10' : 'bg-muted'
            )}>
              {backup.type === 'cloud' ? (
                <Cloud className="h-4 w-4 text-primary" />
              ) : (
                <HardDrive className="h-4 w-4 text-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{backup.name}</p>
              <p className="text-xs text-muted-foreground">{backup.size} • {backup.date}</p>
            </div>
            {getStatusIcon(backup.status)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BackupStatus;
