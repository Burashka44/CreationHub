import { useState } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', type: 'success', title: 'Backup Complete', message: 'Daily backup finished successfully', time: '5m ago', read: false },
    { id: '2', type: 'warning', title: 'High CPU Usage', message: 'CPU usage exceeded 80% for 10 minutes', time: '15m ago', read: false },
    { id: '3', type: 'info', title: 'System Update', message: 'New security patches available', time: '1h ago', read: true },
    { id: '4', type: 'error', title: 'Connection Failed', message: 'Redis connection timeout', time: '2h ago', read: true },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'info': return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="dashboard-card max-h-[400px] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
          Mark all read
        </Button>
      </div>
      
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No notifications</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "p-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/30",
                notification.read 
                  ? "bg-transparent border-border/50" 
                  : "bg-primary/5 border-primary/20"
              )}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                {getIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm text-foreground truncate">{notification.title}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{notification.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification(notification.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;
