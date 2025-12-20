import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Settings, Globe, Palette, Bell, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import TelegramBotsManager from '@/components/dashboard/TelegramBotsManager';

const SettingsPage = () => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted">
          <Settings className="h-6 w-6 text-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('settings')}</h1>
          <p className="text-muted-foreground">Настройки приложения</p>
        </div>
      </div>
      
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
              <Switch id="email-notif" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notif">Push уведомления</Label>
              <Switch id="push-notif" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="security-alerts">Оповещения безопасности</Label>
              <Switch id="security-alerts" defaultChecked />
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
      
      {/* Telegram Bots */}
      <div className="max-w-4xl">
        <TelegramBotsManager />
      </div>
    </div>
  );
};

export default SettingsPage;
