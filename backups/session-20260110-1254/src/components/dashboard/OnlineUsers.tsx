import { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface OnlineUser {
  id: string;
  name: string;
  role: 'admin' | 'root' | 'user';
  status: 'online' | 'away' | 'offline';
  lastSeen?: string;
}

const roleConfig = {
  admin: { icon: Shield, color: 'text-amber-400', bgColor: 'bg-amber-500/10', label: 'Админ' },
  root: { icon: UserCheck, color: 'text-red-400', bgColor: 'bg-red-500/10', label: 'Root' },
  user: { icon: User, color: 'text-blue-400', bgColor: 'bg-blue-500/10', label: 'Пользователь' },
};

const statusConfig = {
  online: { color: 'bg-emerald-500', label: 'Онлайн' },
  away: { color: 'bg-yellow-500', label: 'Отошёл' },
  offline: { color: 'bg-gray-500', label: 'Офлайн' },
};

const OnlineUsers = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [adminCount, setAdminCount] = useState(0);

  useEffect(() => {
    // Fetch real admins from database
    const fetchAdmins = async () => {
      const { data, error } = await supabase
        .from('admins')
        .select('id, name, is_active, online_status, last_seen_at')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        const mappedUsers: OnlineUser[] = data.map((admin: any) => {
          // Determine status based on last_seen_at
          let status: 'online' | 'away' | 'offline' = 'offline';
          if (admin.online_status === 'online') {
            status = 'online';
          } else if (admin.last_seen_at) {
            const lastSeen = new Date(admin.last_seen_at);
            const now = new Date();
            const diffMinutes = (now.getTime() - lastSeen.getTime()) / 60000;
            if (diffMinutes < 5) status = 'online';
            else if (diffMinutes < 30) status = 'away';
          }

          return {
            id: admin.id,
            name: admin.name,
            role: 'admin' as const,
            status,
            lastSeen: admin.last_seen_at
          };
        });

        setUsers(mappedUsers);
        setAdminCount(data.length);
      }
    };

    fetchAdmins();

    // Subscribe to admin changes
    const channel = supabase
      .channel('admins-online')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admins' }, () => fetchAdmins())
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(fetchAdmins, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const onlineAdmins = users.filter(u => u.status === 'online').length;
  const awayAdmins = users.filter(u => u.status === 'away').length;
  const offlineAdmins = users.filter(u => u.status === 'offline').length;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {t('onlineUsers')}
          </div>
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
            {onlineAdmins} {t('online').toLowerCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-center">
            <p className="text-lg font-bold text-emerald-400">{onlineAdmins}</p>
            <p className="text-xs text-muted-foreground">Онлайн</p>
          </div>
          <div className="p-2 rounded-lg bg-yellow-500/10 text-center">
            <p className="text-lg font-bold text-yellow-400">{awayAdmins}</p>
            <p className="text-xs text-muted-foreground">Отошли</p>
          </div>
          <div className="p-2 rounded-lg bg-gray-500/10 text-center">
            <p className="text-lg font-bold text-gray-400">{offlineAdmins}</p>
            <p className="text-xs text-muted-foreground">Офлайн</p>
          </div>
        </div>

        {/* User List */}
        <div className="space-y-2">
          {users.length === 0 ? (
            <div className="text-center text-muted-foreground py-4 text-sm">
              Нет администраторов
            </div>
          ) : (
            users.map((user) => {
              const roleConf = roleConfig[user.role];
              const statusConf = statusConfig[user.status];
              const RoleIcon = roleConf.icon;

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`relative p-2 rounded-lg ${roleConf.bgColor}`}>
                      <RoleIcon className={`h-4 w-4 ${roleConf.color}`} />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${statusConf.color} border-2 border-card`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{roleConf.label}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${user.status === 'online' ? 'text-emerald-400 border-emerald-500/30' : 'text-muted-foreground border-border'}`}
                  >
                    {statusConf.label}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OnlineUsers;
