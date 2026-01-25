import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Settings, Globe, Palette, Bell, User, Server, Key, Shield, Eye, EyeOff, Save, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SettingsPage = () => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // Server IP state
  const [serverIp, setServerIp] = useState('');
  const [serverIpSaved, setServerIpSaved] = useState(false);

  // API Keys state
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState({
    youtube: '',
    telegram: '',
    openai: '',
  });

  // Security state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    security: true
  });

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');

      if (!error && data) {
        data.forEach((setting: any) => {
          const val = setting.value;
          switch (setting.key) {
            case 'serverIp':
              if (val?.ip) setServerIp(val.ip);
              break;
            case 'apiKeys':
              if (val) setApiKeys(prev => ({ ...prev, ...val }));
              break;
            case 'security':
              if (val?.twoFactor !== undefined) setTwoFactorEnabled(val.twoFactor);
              if (val?.sessionTimeout) setSessionTimeout(val.sessionTimeout);
              break;
            case 'notifications':
              if (val) setNotificationSettings(prev => ({ ...prev, ...val }));
              break;
          }
        });
      }
    };

    loadSettings();
  }, []);

  // Save setting to database
  const saveSetting = async (key: string, value: any) => {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) {
      console.error('Save error:', error);
      return false;
    }
    return true;
  };

  const handleSaveServerIp = async () => {
    const success = await saveSetting('serverIp', { ip: serverIp });
    if (success) {
      setServerIpSaved(true);
      toast.success('Server IP сохранён в базе');
      setTimeout(() => setServerIpSaved(false), 2000);
    } else {
      toast.error('Ошибка сохранения');
    }
  };

  const handleSaveApiKey = async (key: string) => {
    const success = await saveSetting('apiKeys', apiKeys);
    if (success) {
      toast.success(`${key.toUpperCase()} API ключ сохранён`);
    } else {
      toast.error('Ошибка сохранения');
    }
  };

  const handleSaveNotifications = async (newSettings: typeof notificationSettings) => {
    setNotificationSettings(newSettings);
    await saveSetting('notifications', newSettings);
  };

  const handleSaveSecurity = async (twoFactor: boolean, timeout: number) => {
    setTwoFactorEnabled(twoFactor);
    setSessionTimeout(timeout);
    const success = await saveSetting('security', { twoFactor, sessionTimeout: timeout });
    if (success) {
      toast.success(twoFactor ? '2FA включена' : '2FA отключена');
    }
  };

  const toggleShowApiKey = (key: string) => {
    setShowApiKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChangePassword = async () => {
    const newPassword = prompt('Введите новый пароль (минимум 6 символов):');
    if (!newPassword || newPassword.length < 6) {
      if (newPassword) toast.error('Пароль слишком короткий');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Пароль успешно изменен');
    } catch (e: any) {
      toast.error('Ошибка смены пароля: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted">
          <Settings className="h-6 w-6 text-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('settings')}</h1>
          <p className="text-muted-foreground">Настройки приложения (сохраняются в БД)</p>
        </div>
      </div>

      {/* Server IP - Full Width */}
      <Card className="bg-card/50 border-border/50 max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="h-5 w-5 text-primary" />
            Server IP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Глобальный IP адрес сервера для подключения сервисов
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="192.168.1.100 или domain.com"
              value={serverIp}
              onChange={(e) => setServerIp(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSaveServerIp} className="gap-2">
              {serverIpSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {serverIpSaved ? 'Сохранено' : 'Сохранить'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        {/* Language */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-primary" />
              {t('language')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={language === 'ru' ? 'default' : 'outline'}
                onClick={() => setLanguage('ru')}
                className="flex-1"
              >
                🇷🇺 Русский
              </Button>
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                onClick={() => setLanguage('en')}
                className="flex-1"
              >
                🇬🇧 English
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="h-5 w-5 text-primary" />
              {t('theme')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => theme === 'light' && toggleTheme()}
                className="flex-1"
              >
                🌙 {t('dark')}
              </Button>
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => theme === 'dark' && toggleTheme()}
                className="flex-1"
              >
                ☀️ {t('light')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              {t('notifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notif">Email уведомления</Label>
              <Switch
                id="email-notif"
                checked={notificationSettings.email}
                onCheckedChange={(checked) => handleSaveNotifications({ ...notificationSettings, email: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notif">Push уведомления</Label>
              <Switch
                id="push-notif"
                checked={notificationSettings.push}
                onCheckedChange={(checked) => handleSaveNotifications({ ...notificationSettings, push: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="security-alerts">Оповещения безопасности</Label>
              <Switch
                id="security-alerts"
                checked={notificationSettings.security}
                onCheckedChange={(checked) => handleSaveNotifications({ ...notificationSettings, security: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Аккаунт
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-lg font-medium text-primary">A</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Admin</p>
                <p className="text-sm text-muted-foreground">admin@server.com</p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              {t('edit')} профиль
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* API Keys - Full Width */}
      <Card className="bg-card/50 border-border/50 max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5 text-primary" />
            API Ключи
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Настройте API ключи для интеграции с внешними сервисами (сохраняются в БД)
          </p>

          {/* YouTube API */}
          <div className="space-y-2">
            <Label>YouTube Data API</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKeys.youtube ? 'text' : 'password'}
                  placeholder="AIza..."
                  value={apiKeys.youtube}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, youtube: e.target.value }))}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => toggleShowApiKey('youtube')}
                >
                  {showApiKeys.youtube ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="outline" onClick={() => handleSaveApiKey('youtube')}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Telegram API */}
          <div className="space-y-2">
            <Label>Telegram Bot Token</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKeys.telegram ? 'text' : 'password'}
                  placeholder="123456:ABC..."
                  value={apiKeys.telegram}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, telegram: e.target.value }))}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => toggleShowApiKey('telegram')}
                >
                  {showApiKeys.telegram ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="outline" onClick={() => handleSaveApiKey('telegram')}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* OpenAI API */}
          <div className="space-y-2">
            <Label>OpenAI API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKeys.openai ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={apiKeys.openai}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => toggleShowApiKey('openai')}
                >
                  {showApiKeys.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="outline" onClick={() => handleSaveApiKey('openai')}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security - Full Width */}
      <Card className="bg-card/50 border-border/50 max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Безопасность
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="2fa">Двухфакторная аутентификация</Label>
              <p className="text-xs text-muted-foreground">Дополнительная защита аккаунта</p>
            </div>
            <Switch
              id="2fa"
              checked={twoFactorEnabled}
              onCheckedChange={(checked) => handleSaveSecurity(checked, sessionTimeout)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="session-lock">Автоблокировка сессии</Label>
              <p className="text-xs text-muted-foreground">Таймаут неактивности (минуты)</p>
            </div>
            <Input
              id="session-lock"
              type="number"
              min={5}
              max={120}
              value={sessionTimeout}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSessionTimeout(val);
              }}
              onBlur={() => handleSaveSecurity(twoFactorEnabled, sessionTimeout)}
              className="w-20 text-center"
            />
          </div>

          <div className="pt-2 border-t border-border/50">
            <Button variant="outline" className="w-full" onClick={handleChangePassword}>
              Сменить пароль
            </Button>
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

export default SettingsPage;
