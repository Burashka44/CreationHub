import { useState } from 'react';
import { 
  RotateCcw, Trash2, Download, Upload, Shield, 
  Terminal, Power, RefreshCw, HardDrive, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const QuickActions = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState<string | null>(null);

  const actions = [
    { id: 'restart', icon: RotateCcw, label: 'Restart Server', color: 'text-warning' },
    { id: 'cache', icon: Trash2, label: 'Clear Cache', color: 'text-destructive' },
    { id: 'backup', icon: Download, label: 'Backup Now', color: 'text-success' },
    { id: 'update', icon: Upload, label: 'Check Updates', color: 'text-primary' },
    { id: 'scan', icon: Shield, label: 'Security Scan', color: 'text-purple-500' },
    { id: 'terminal', icon: Terminal, label: 'Open Terminal', color: 'text-foreground' },
  ];

  const handleAction = async (id: string, label: string) => {
    setLoading(id);
    // Simulate action
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(null);
    toast.success(`${label} completed successfully`);
  };

  return (
    <div className="dashboard-card">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-warning" />
        <h3 className="font-semibold text-foreground">Quick Actions</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            className="h-auto py-3 flex flex-col items-center gap-2 border-border hover:bg-muted/50 transition-all hover:scale-105"
            onClick={() => handleAction(action.id, action.label)}
            disabled={loading === action.id}
          >
            <action.icon className={`h-5 w-5 ${action.color} ${loading === action.id ? 'animate-spin' : ''}`} />
            <span className="text-xs text-muted-foreground">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
