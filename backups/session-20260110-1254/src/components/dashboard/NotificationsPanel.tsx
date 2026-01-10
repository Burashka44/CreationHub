import { useState } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  titleKey: string;
  messageKey: string;
  time: string;
  read: boolean;
}

const NotificationsPanel = () => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', type: 'success', titleKey: 'backupCreated', messageKey: 'databaseBackup', time: '5m', read: false },
    { id: '2', type: 'warning', titleKey: 'cpuUsage', messageKey: 'cpuUsage', time: '15m', read: false },
    { id: '3', type: 'info', titleKey: 'checkUpdates', messageKey: 'checkUpdates', time: '1h', read: true },
    { id: '4', type: 'error', titleKey: 'error', messageKey: 'error', time: '2h', read: true },
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
          <h3 className="font-semibold text-foreground">{t('notifications')}</h3>
          {unreadCount > 0 && (
            <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
          {t('markAllRead')}
        </Button>
      </div>
      
      <div className="space-y-2 overflow-y-auto flex-1 pr-1 scrollbar-thin">
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t('noNotifications')}</p>
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
                    <p className="font-medium text-sm text-foreground truncate">{t(notification.titleKey)}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{notification.time} {t('ago')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t(notification.messageKey)}</p>
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
