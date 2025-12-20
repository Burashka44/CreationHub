import BackupStatus from '@/components/dashboard/BackupStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { HardDrive, Cloud, Clock, Plus, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const BackupsPage = () => {
  const { t } = useLanguage();
  
  const schedules = [
    { name: 'Ежедневный бэкап', time: '03:00', type: 'full', status: 'active' },
    { name: 'Бэкап БД', time: '*/6 часов', type: 'database', status: 'active' },
    { name: 'Инкрементальный', time: '*/1 час', type: 'incremental', status: 'paused' },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <HardDrive className="h-6 w-6 text-success" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('backups')}</h1>
            <p className="text-muted-foreground">Управление резервными копиями</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t('checkUpdates')}
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t('backupNow')}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BackupStatus />
        
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Расписание бэкапов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${schedule.type === 'database' ? 'bg-warning/10' : 'bg-primary/10'}`}>
                      {schedule.type === 'database' ? (
                        <Cloud className="h-4 w-4 text-warning" />
                      ) : (
                        <HardDrive className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{schedule.name}</p>
                      <p className="text-sm text-muted-foreground">{schedule.time}</p>
                    </div>
                  </div>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    schedule.status === 'active' 
                      ? 'bg-success/20 text-success' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {schedule.status === 'active' ? 'Активно' : 'Пауза'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BackupsPage;
