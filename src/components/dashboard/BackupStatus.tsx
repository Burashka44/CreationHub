import { Cloud, HardDrive, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const BackupStatus = () => {
  const { t } = useLanguage();
  const [usage, setUsage] = useState({ used: 0, total: 0, percentage: 0 });
  const [backups, setBackups] = useState<string[]>([]);
  const [isBackupRunning, setIsBackupRunning] = useState(false);

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
    <div className="dashboard-card space-y-4">
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
          <h4 className="text-sm font-medium text-muted-foreground">Последние копии</h4>
          <div className="space-y-1">
            {backups.slice(0, 3).map((backup, i) => (
              <div key={i} className="text-xs text-muted-foreground flex justify-between">
                <span>{backup}</span>
                <span className="text-success">OK</span>
              </div>
            ))}
            {backups.length === 0 && <span className="text-xs text-muted-foreground">Нет копий</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupStatus;
