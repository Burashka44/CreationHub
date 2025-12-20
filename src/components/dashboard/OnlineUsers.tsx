import { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, User, Circle } from 'lucide-react';
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

// Mock data - в реальном приложении это приходило бы через Realtime
const mockUsers: OnlineUser[] = [
  { id: '1', name: 'Admin', role: 'admin', status: 'online' },
  { id: '2', name: 'Root System', role: 'root', status: 'online' },
  { id: '3', name: 'Operator 1', role: 'user', status: 'online' },
  { id: '4', name: 'Operator 2', role: 'user', status: 'away' },
];

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
  const [users, setUsers] = useState<OnlineUser[]>(mockUsers);
  const [adminCount, setAdminCount] = useState(0);

  useEffect(() => {
    // Fetch admin count from database
    const fetchAdminCount = async () => {
      const { count, error } = await supabase
        .from('admins')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      if (!error && count !== null) {
        setAdminCount(count);
      }
    };

    fetchAdminCount();

    // Subscribe to admin changes
    const channel = supabase
      .channel('admins-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admins' },
        () => {
          fetchAdminCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onlineAdmins = users.filter(u => u.role === 'admin' && u.status === 'online').length;
  const onlineRoots = users.filter(u => u.role === 'root' && u.status === 'online').length;
  const onlineUsers = users.filter(u => u.role === 'user' && u.status !== 'offline').length;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {t('onlineUsers')}
          </div>
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
            {users.filter(u => u.status === 'online').length} {t('online').toLowerCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10 text-center">
            <p className="text-lg font-bold text-amber-400">{onlineAdmins}/{adminCount}</p>
            <p className="text-xs text-muted-foreground">{t('adminsOnline')}</p>
          </div>
          <div className="p-2 rounded-lg bg-red-500/10 text-center">
            <p className="text-lg font-bold text-red-400">{onlineRoots}</p>
            <p className="text-xs text-muted-foreground">Root</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10 text-center">
            <p className="text-lg font-bold text-blue-400">{onlineUsers}</p>
            <p className="text-xs text-muted-foreground">{t('usersOnline')}</p>
          </div>
        </div>

        {/* User List */}
        <div className="space-y-2">
          {users.map((user) => {
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
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default OnlineUsers;
