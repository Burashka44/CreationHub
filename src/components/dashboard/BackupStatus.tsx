import { HardDrive, Cloud, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface BackupItem {
  id: string;
  nameKey: string;
  size: string;
  dateKey: string;
  status: 'completed' | 'in-progress' | 'failed';
  type: 'local' | 'cloud';
}

const BackupStatus = () => {
  const { t } = useLanguage();
  
  const backups: BackupItem[] = [
    { id: '1', nameKey: 'fullSystemBackup', size: '12.4 GB', dateKey: 'today', status: 'completed', type: 'local' },
    { id: '2', nameKey: 'databaseBackup', size: '2.1 GB', dateKey: 'today', status: 'completed', type: 'cloud' },
    { id: '3', nameKey: 'mediaFiles', size: '8.7 GB', dateKey: 'inProgress', status: 'in-progress', type: 'cloud' },
    { id: '4', nameKey: 'configBackup', size: '156 MB', dateKey: 'yesterday', status: 'completed', type: 'local' },
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
        <h3 className="font-semibold text-foreground">{t('backupStatus')}</h3>
      </div>

      <div className="p-3 rounded-lg bg-muted/50 border border-border mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{t('storageUsed')}</span>
          <span className="text-sm font-medium text-foreground">{usedSpace} GB / {totalSpace} GB</span>
        </div>
        <Progress value={(usedSpace / totalSpace) * 100} className="h-2" />
      </div>

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
              <p className="text-sm font-medium text-foreground truncate">{t(backup.nameKey)}</p>
              <p className="text-xs text-muted-foreground">{backup.size} • {t(backup.dateKey)}</p>
            </div>
            {getStatusIcon(backup.status)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BackupStatus;
