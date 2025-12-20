import { useLanguage } from '@/contexts/LanguageContext';
import { Database, Table, HardDrive, FileJson } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DataPage = () => {
  const { t } = useLanguage();
  
  const databases = [
    { name: 'PostgreSQL', size: '2.4 GB', tables: 45, status: 'online' },
    { name: 'Redis', size: '512 MB', tables: 12, status: 'online' },
    { name: 'MongoDB', size: '1.8 GB', tables: 28, status: 'offline' },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-warning/10">
          <Database className="h-6 w-6 text-warning" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('data')}</h1>
          <p className="text-muted-foreground">Управление базами данных</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {databases.map((db) => (
          <Card key={db.name} className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-primary" />
                {db.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <HardDrive className="h-4 w-4" /> Размер
                </span>
                <span className="font-medium text-foreground">{db.size}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Table className="h-4 w-4" /> Таблицы
                </span>
                <span className="font-medium text-foreground">{db.tables}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Статус</span>
                <span className={`font-medium ${db.status === 'online' ? 'text-success' : 'text-destructive'}`}>
                  {db.status === 'online' ? t('online') : t('offline')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DataPage;
