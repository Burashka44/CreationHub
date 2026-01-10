import { useState } from 'react';
import {
  RotateCcw, Trash2, Download, Upload, Shield,
  Terminal, Zap, RefreshCw, Power
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const QuickActions = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState<string | null>(null);

  const actions = [
    { id: 'restart', icon: Power, labelKey: 'restartServer', shortLabel: 'Рестарт', color: 'text-destructive' },
    { id: 'nginx', icon: RefreshCw, labelKey: 'restartNginx', shortLabel: 'Nginx', color: 'text-blue-500' },
    { id: 'cache', icon: Trash2, labelKey: 'clearCache', shortLabel: 'Кэш', color: 'text-orange-500' },
    { id: 'backup', icon: Download, labelKey: 'backupNow', shortLabel: 'Бэкап', color: 'text-success' },
    { id: 'update', icon: Upload, labelKey: 'checkUpdates', shortLabel: 'Апдейт', color: 'text-primary' },
    { id: 'scan', icon: Shield, labelKey: 'securityScan', shortLabel: 'Скан', color: 'text-purple-500' },
    { id: 'terminal', icon: Terminal, labelKey: 'openTerminal', shortLabel: 'CLI', color: 'text-foreground' },
  ];

  const logActivity = async (action: string, target: string) => {
    try {
      await supabase.from('activity_logs').insert({
        action_key: action,
        target: target,
        user_name: 'admin',
        activity_type: 'server'
      });
    } catch (e) {
      console.error('Failed to log activity', e);
    }
  };

  const handleAction = async (id: string, labelKey: string) => {
    setLoading(id);

    try {
      if (id === 'cache') {
        // Clear Frontend Cache
        localStorage.clear();
        sessionStorage.clear();
        await logActivity('cacheCleared', 'Browser Storage');
        toast.success(t('cacheCleared') || 'Cache cleared successfully');
        setTimeout(() => window.location.reload(), 1000);
        return;
      }

      if (id === 'terminal') {
        toast.info("CLI functionality requires SSH connection");
        return;
      }

      // Special handling for backup
      if (id === 'backup') {
        const response = await fetch('/api/system/backups/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'database' })
        });
        const data = await response.json();
        if (data.success) {
          await logActivity(id, 'System Database');
          toast.success('Бэкап успешно запущен', { description: `Файл: ${data.data.file}` });
        } else {
          toast.error(data.error || 'Backup failed');
        }
        return;
      }

      // Backend Actions via system-api
      const response = await fetch('/api/system/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: id })
      });

      const data = await response.json();

      if (data.success) {
        await logActivity(id, 'System');
        toast.success(data.message || `${t(labelKey)} - Success`);
      } else {
        toast.error(data.error || 'Action failed');
      }

    } catch (error) {
      console.error(error);
      toast.error('Action failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="dashboard-card h-full">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-warning" />
        <h3 className="font-semibold text-foreground">{t('quickActions')}</h3>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            className="h-auto py-3 px-2 flex flex-col items-center gap-2 border-border hover:bg-muted/50 transition-all hover:scale-105"
            onClick={() => handleAction(action.id, action.labelKey)}
            disabled={loading === action.id}
            title={t(action.labelKey)}
          >
            <action.icon className={`h-5 w-5 shrink-0 ${action.color} ${loading === action.id ? 'animate-spin' : ''}`} />
            <span className="text-xs text-muted-foreground">{action.shortLabel}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
