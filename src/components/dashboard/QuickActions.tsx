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
    { id: 'restart', icon: RotateCcw, labelKey: 'restartServer', color: 'text-warning' },
    { id: 'cache', icon: Trash2, labelKey: 'clearCache', color: 'text-destructive' },
    { id: 'backup', icon: Download, labelKey: 'backupNow', color: 'text-success' },
    { id: 'update', icon: Upload, labelKey: 'checkUpdates', color: 'text-primary' },
    { id: 'scan', icon: Shield, labelKey: 'securityScan', color: 'text-purple-500' },
    { id: 'terminal', icon: Terminal, labelKey: 'openTerminal', color: 'text-foreground' },
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            className="h-auto py-3 flex flex-col items-center gap-2 border-border hover:bg-muted/50 transition-all hover:scale-105"
            onClick={() => handleAction(action.id, action.labelKey)}
            disabled={loading === action.id}
          >
            <action.icon className={`h-5 w-5 ${action.color} ${loading === action.id ? 'animate-spin' : ''}`} />
            <span className="text-xs text-muted-foreground text-center">{t(action.labelKey)}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
