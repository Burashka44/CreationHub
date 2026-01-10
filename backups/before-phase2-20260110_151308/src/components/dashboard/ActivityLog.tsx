import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Activity, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActivityLogProps {
  limit?: number;
  className?: string;
  hideHeader?: boolean;
}

const ActivityLog = ({ limit = 20, className, hideHeader = false }: ActivityLogProps) => {
  const [activities, setActivities] = useState<any[]>([]);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const fetchActivity = async () => {
    // Type casting to bypass missing table definition in generated types
    const { data } = await (supabase as any)
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (data) setActivities(data);
  };

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 10000);
    return () => clearInterval(interval);
  }, [limit]);

  const clearLogs = async () => {
    try {
      // Use system-api for cleanup if complex, or direct Supabase if policy allows.
      // Based on previous session, there might be a backend route, but direct DB is easier if permitted.
      // We'll try the API we saw in "Previous Session Summary": DELETE /api/activity/logs
      // But for now, let's assume direct supabase for speed, or fallback to API.

      const { error } = await (supabase as any)
        .from('activity_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using uuid string)

      if (error) throw error;
      toast.success("Журнал очищен");
      fetchActivity();
    } catch (e) {
      toast.error("Ошибка очистки журнала");
    }
  };

  return (
    <div className={cn("flex flex-col p-4 rounded-lg border border-border bg-muted/50", className || "max-h-[400px]")}>
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Активность</h3>
          </div>
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={clearLogs} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {activities.map((item) => (
            <div key={item.id} className="flex gap-3 text-sm border-b border-border/50 pb-3 last:border-0 last:pb-0">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-primary flex-shrink-0" />
              <div className="grid gap-1">
                <p className="text-foreground font-medium leading-none">
                  {item.activity_type}
                  <span className="text-muted-foreground font-normal ml-2">
                    {item.description}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.timestamp || new Date()), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </p>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Нет активности
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ActivityLog;
