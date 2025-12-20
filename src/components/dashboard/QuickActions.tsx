import { useState } from 'react';
import { 
  RotateCcw, Trash2, Download, Upload, Shield, 
  Terminal, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const QuickActions = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState<string | null>(null);

  const actions = [
    { id: 'restart', icon: RotateCcw, labelKey: 'restartServer', shortLabel: 'Рестарт', color: 'text-warning' },
    { id: 'cache', icon: Trash2, labelKey: 'clearCache', shortLabel: 'Кэш', color: 'text-destructive' },
    { id: 'backup', icon: Download, labelKey: 'backupNow', shortLabel: 'Бэкап', color: 'text-success' },
    { id: 'update', icon: Upload, labelKey: 'checkUpdates', shortLabel: 'Апдейт', color: 'text-primary' },
    { id: 'scan', icon: Shield, labelKey: 'securityScan', shortLabel: 'Скан', color: 'text-purple-500' },
    { id: 'terminal', icon: Terminal, labelKey: 'openTerminal', shortLabel: 'CLI', color: 'text-foreground' },
  ];

  const handleAction = async (id: string, labelKey: string) => {
    setLoading(id);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(null);
    toast.success(`${t(labelKey)} - ${t('completed')}`);
  };

  return (
    <div className="dashboard-card">
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
