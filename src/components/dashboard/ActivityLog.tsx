import { History, User, Server, Database, Shield, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityItem {
  id: string;
  actionKey: string;
  target: string;
  user: string;
  time: string;
  type: 'user' | 'server' | 'database' | 'security' | 'settings';
}

const ActivityLog = () => {
  const { t } = useLanguage();
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Convert timestamp to relative time (min/hours ago)
  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

    let interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";

    return Math.floor(seconds) + "s";
  };

  useEffect(() => {
    const fetchActivity = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setActivities(data.map((item: any) => ({
          id: item.id,
          actionKey: item.action_key,
          target: item.target,
          user: item.user_name,
          time: timeAgo(item.created_at),
          type: item.activity_type
        })));
      }
    };

    fetchActivity();

    // Subscribe to new logs
    const channel = supabase
      .channel('activity-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        () => fetchActivity()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user': return <User className="h-4 w-4" />;
      case 'server': return <Server className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'settings': return <Settings className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  const getColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user': return 'bg-primary/20 text-primary';
      case 'server': return 'bg-success/20 text-success';
      case 'database': return 'bg-warning/20 text-warning';
      case 'security': return 'bg-destructive/20 text-destructive';
      case 'settings': return 'bg-purple-500/20 text-purple-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="dashboard-card max-h-[400px] overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">{t('activityLog')}</h3>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1 pr-1 scrollbar-thin">
        {activities.length === 0 ? (
          <div className="text-center text-muted-foreground py-4 text-sm">No activity recorded</div>
        ) : (
          activities.map((activity, index) => (
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
                  <span className="font-medium">{t(activity.actionKey) || activity.actionKey}</span>
                  {' '}
                  <span className="text-muted-foreground">{activity.target}</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{t('by')} {activity.user}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{activity.time} {t('ago')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
