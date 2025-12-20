import { History, User, Server, Database, Shield, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  action: string;
  target: string;
  user: string;
  time: string;
  type: 'user' | 'server' | 'database' | 'security' | 'settings';
}

const ActivityLog = () => {
  const activities: ActivityItem[] = [
    { id: '1', action: 'Logged in', target: 'Dashboard', user: 'admin', time: '2m ago', type: 'user' },
    { id: '2', action: 'Restarted', target: 'Nginx', user: 'system', time: '15m ago', type: 'server' },
    { id: '3', action: 'Backup created', target: 'PostgreSQL', user: 'cron', time: '1h ago', type: 'database' },
    { id: '4', action: 'Firewall rule added', target: 'Port 8080', user: 'admin', time: '2h ago', type: 'security' },
    { id: '5', action: 'Config updated', target: 'SSL Certificate', user: 'admin', time: '3h ago', type: 'settings' },
    { id: '6', action: 'Cache cleared', target: 'Redis', user: 'admin', time: '5h ago', type: 'database' },
  ];

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user': return <User className="h-4 w-4" />;
      case 'server': return <Server className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'settings': return <Settings className="h-4 w-4" />;
    }
  };

  const getColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user': return 'bg-primary/20 text-primary';
      case 'server': return 'bg-success/20 text-success';
      case 'database': return 'bg-warning/20 text-warning';
      case 'security': return 'bg-destructive/20 text-destructive';
      case 'settings': return 'bg-purple-500/20 text-purple-500';
    }
  };

  return (
    <div className="dashboard-card max-h-[400px] overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Activity Log</h3>
      </div>
      
      <div className="space-y-3 overflow-y-auto flex-1 pr-1">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn("p-2 rounded-lg shrink-0", getColor(activity.type))}>
              {getIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-medium">{activity.action}</span>
                {' '}
                <span className="text-muted-foreground">{activity.target}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">by {activity.user}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;
