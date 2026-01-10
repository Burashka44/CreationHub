import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit, Send, Check, X, Phone, Mail, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Admin {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  telegram_chat_id: string | null;
  telegram_username: string | null;
  is_active: boolean;
  receive_notifications: boolean;
  created_at: string;
}

const AdminsPage = () => {
  const { t } = useLanguage();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    telegram_chat_id: '',
    telegram_username: '',
    is_active: true,
    receive_notifications: true,
    password: '',
  });

  const fetchAdmins = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Ошибка загрузки администраторов');
      console.error(error);
    } else {
      setAdmins(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      telegram_chat_id: '',
      telegram_username: '',
      is_active: true,
      receive_notifications: true,
      password: '',
    });
    setEditingAdmin(null);
  };

  const handleOpenDialog = (admin?: Admin) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        name: admin.name,
        email: admin.email || '',
        phone: admin.phone || '',
        telegram_chat_id: admin.telegram_chat_id || '',
        telegram_username: admin.telegram_username || '',
        is_active: admin.is_active,
        receive_notifications: admin.receive_notifications,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Имя обязательно');
      return;
    }

    const adminData = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      telegram_chat_id: formData.telegram_chat_id || null,
      telegram_username: formData.telegram_username || null,
      is_active: formData.is_active,
      receive_notifications: formData.receive_notifications,
    };

    if (editingAdmin) {
      const { error } = await supabase
        .from('admins')
        .update(adminData)
        .eq('id', editingAdmin.id);

      if (error) {
        toast.error('Ошибка обновления');
        console.error(error);
      } else {
        toast.success('Администратор обновлён');
        fetchAdmins();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      // Create new admin via Gateway API
      try {
        const response = await fetch('/api/auth/register-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({
            ...adminData,
            password: (formData as any).password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create admin');
        }

        toast.success('Администратор добавлен');
        fetchAdmins();
        setIsDialogOpen(false);
        resetForm();

      } catch (error: any) {
        toast.error(error.message);
        console.error(error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Ошибка удаления');
      console.error(error);
    } else {
      toast.success('Администратор удалён');
      fetchAdmins();
    }
  };

  const handleTestTelegram = async (admin: Admin) => {
    if (!admin.telegram_chat_id) {
      toast.error('Telegram Chat ID не указан');
      return;
    }

    try {
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: admin.telegram_chat_id,
          message: `🔔 Тестовое уведомление\n\nПривет, ${admin.name}! Уведомления работают.`,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);
      toast.success('Тестовое сообщение отправлено');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Ошибка отправки');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('admins')}</h1>
            <p className="text-muted-foreground">{t('adminsDescription')}</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4" />
              {t('addAdmin')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingAdmin ? t('editAdmin') : t('addAdmin')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Иван Иванов"
                  className="bg-background border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@example.com"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+7 999 123 45 67"
                    className="bg-background border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram_username">Telegram Username</Label>
                <Input
                  id="telegram_username"
                  value={formData.telegram_username}
                  onChange={(e) => setFormData({ ...formData, telegram_username: e.target.value })}
                  placeholder="@username"
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram_chat_id">Telegram Chat ID</Label>
                <Input
                  id="telegram_chat_id"
                  value={formData.telegram_chat_id}
                  onChange={(e) => setFormData({ ...formData, telegram_chat_id: e.target.value })}
                  placeholder="123456789"
                  className="bg-background border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Получите через @userinfobot в Telegram
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">{t('active')}</p>
                  <p className="text-xs text-muted-foreground">Может входить в систему</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">{t('receiveNotifications')}</p>
                  <p className="text-xs text-muted-foreground">Получать уведомления в Telegram</p>
                </div>
                <Switch
                  checked={formData.receive_notifications}
                  onCheckedChange={(checked) => setFormData({ ...formData, receive_notifications: checked })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-border"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  {t('cancel')}
                </Button>
                <Button className="flex-1" onClick={handleSave}>
                  {t('save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('noAdmins')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('contacts')}</TableHead>
                  <TableHead>Telegram</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id} className="border-border/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {admin.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-foreground">{admin.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {admin.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {admin.email}
                          </div>
                        )}
                        {admin.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {admin.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {admin.telegram_username && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MessageCircle className="h-3 w-3" />
                            {admin.telegram_username}
                          </div>
                        )}
                        {admin.telegram_chat_id && (
                          <Badge variant="outline" className="text-xs">
                            ID: {admin.telegram_chat_id}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={admin.is_active
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                        }>
                          {admin.is_active ? t('active') : t('inactive')}
                        </Badge>
                        {admin.receive_notifications && (
                          <Badge variant="outline" className="text-xs">
                            🔔 Уведомления
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {admin.telegram_chat_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-blue-400"
                            onClick={() => handleTestTelegram(admin)}
                            title="Отправить тест"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenDialog(admin)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(admin.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminsPage;
