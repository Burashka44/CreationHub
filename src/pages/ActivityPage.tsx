import ActivityLog from '@/components/dashboard/ActivityLog';
import { useLanguage } from '@/contexts/LanguageContext';
import { History, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ActivityPage = () => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <History className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('activity')}</h1>
            <p className="text-muted-foreground">Журнал действий и событий</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Фильтр
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Экспорт
          </Button>
        </div>
      </div>
      
      <div className="max-w-3xl">
        <ActivityLog />
      </div>
    </div>
  );
};

export default ActivityPage;
