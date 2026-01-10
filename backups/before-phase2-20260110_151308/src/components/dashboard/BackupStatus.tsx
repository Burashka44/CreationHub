import { Cloud, HardDrive, RefreshCw, ArrowUpDown, Folder, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BackupStatus = () => {
  const { t } = useLanguage();
  const [usage, setUsage] = useState({ used: 0, total: 0, percentage: 0 });
  const [backups, setBackups] = useState<any[]>([]);
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'size'>('date');

  const fetchBackupData = async () => {
    try {
      const [usageRes, listRes] = await Promise.all([
        fetch('/api/system/backups/usage'),
        fetch('/api/system/backups/list')
      ]);

      if (usageRes.ok) {
        const data = await usageRes.json();
        if (data.success) setUsage(data.data);
      }

      if (listRes.ok) {
        const data = await listRes.json();
        if (data.success) setBackups(data.files || []);
      }
    } catch (e) {
      console.error("Backup fetch error", e);
    }
  };

  useEffect(() => {
    fetchBackupData();
  }, []);

  const triggerBackup = async () => {
    setIsBackupRunning(true);
    toast.info("Запуск резервного копирования...");
    try {
      const res = await fetch('/api/system/backups/run', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success("Бэкап успешно создан");
        fetchBackupData();
      } else {
        toast.error("Ошибка бэкапа: " + data.error);
      }
    } catch (e) {
      toast.error("Ошибка сети");
    }
    setIsBackupRunning(false);
  };

  return (
    <div className="dashboard-card flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t('backupStatus')}</h3>
        </div>
        <button
          onClick={triggerBackup}
          disabled={isBackupRunning}
          className={`p-2 hover:bg-muted rounded-full transition-colors ${isBackupRunning ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
          <HardDrive className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Backup Storage</span>
              <span className="text-sm text-muted-foreground">
                {usage.used}GB / {usage.total}GB
              </span>
            </div>
            <Progress value={usage.percentage} className="h-2" />
          </div>
        </div>


        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">Последние копии</h4>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'size')}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">По дате</SelectItem>
                <SelectItem value="size">По размеру</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {[...backups]
              .sort((a, b) => {
                if (sortBy === 'date') {
                  return new Date(b.date).getTime() - new Date(a.date).getTime();
                } else {
                  return (b.size || 0) - (a.size || 0);
                }
              })
              .slice(0, 10).map((backup, i) => {
                const isObject = typeof backup === 'object' && backup !== null;
                const name = isObject ? (backup.name || 'Unknown') : String(backup);
                const size = isObject ? backup.sizeFormatted : null;
                const date = isObject ? backup.dateFormatted : null;

                return (
                  <div key={i} className="p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-foreground truncate max-w-[180px]" title={name}>
                            {name}
                          </span>
                          {size && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {size}
                            </span>
                          )}
                        </div>
                        {date && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {date}
                          </div>
                        )}
                      </div>
                      {isObject && backup.name && (
                        <a
                          href={`/api/system/backups/download/${backup.name}`}
                          download
                          className="ml-2 text-xs text-primary hover:text-primary/80 underline"
                        >
                          Скачать
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            {backups.length === 0 && <span className="text-xs text-muted-foreground">Нет копий</span>}
            {backups.length > 10 && (
              <div className="text-xs text-muted-foreground text-center pt-2 border-t border-muted">
                +{backups.length - 10} еще...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupStatus;
