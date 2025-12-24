import { HardDrive, Cloud, CheckCircle, Clock, AlertTriangle, Database } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Format bytes to readable string
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format date relative to today
  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('inProgress');

    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return t('today');
    if (date.toDateString() === yesterday.toDateString()) return t('yesterday');

    return date.toLocaleDateString('ru-RU');
  };

  useEffect(() => {
    const fetchBackups = async () => {
      try {
        const { data, error } = await supabase
          .from('backups')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const mappedBackups: BackupItem[] = data.map((item: any) => ({
            id: item.id,
            nameKey: item.name_key,
            size: formatBytes(item.size_bytes),
            dateKey: formatDate(item.completed_at),
            status: item.status,
            type: item.backup_type
          }));
          setBackups(mappedBackups);
        }
      } catch (error) {
        console.error('Error fetching backups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBackups();
    // Real-time subscription could be added here
  }, [t]);

  const totalSpace = 100;
  // Calculate used space based on actual data if possible, or keep mock/estimated
  const usedSpace = 67; // This could also be fetched or calculated

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

      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
        {loading ? (
          <div className="text-sm text-muted-foreground text-center py-4">Loading backups...</div>
        ) : (
          backups.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No backups found</div>
          ) : (
            backups.map((backup) => (
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
                    <Database className="h-4 w-4 text-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t(backup.nameKey) || backup.nameKey}</p>
                  <p className="text-xs text-muted-foreground">{backup.size} • {backup.dateKey}</p>
                </div>
                {getStatusIcon(backup.status)}
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default BackupStatus;
