import SecurityStatus from '@/components/dashboard/SecurityStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Lock, Key, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SecurityPage = () => {
  const { t } = useLanguage();
  
  const recentEvents = [
    { type: 'success', message: 'Успешный вход в систему', ip: '192.168.1.50', time: '2 мин назад' },
    { type: 'warning', message: 'Неудачная попытка входа', ip: '45.33.22.11', time: '15 мин назад' },
    { type: 'success', message: 'SSL сертификат обновлён', ip: 'system', time: '1 час назад' },
    { type: 'warning', message: 'Подозрительная активность', ip: '103.21.44.55', time: '3 часа назад' },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <Shield className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('security')}</h1>
            <p className="text-muted-foreground">Защита и мониторинг безопасности</p>
          </div>
        </div>
        <Button className="gap-2">
          <Shield className="h-4 w-4" />
          {t('securityScan')}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SecurityStatus />
        
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Последние события
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  {event.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{event.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground font-mono">{event.ip}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{event.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecurityPage;
