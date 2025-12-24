import { useState } from 'react';
import BackupStatus from '@/components/dashboard/BackupStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { HardDrive, Cloud, Clock, Plus, RefreshCw, Play, Trash2, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from "sonner";

interface BackupPreset {
  id: string;
  name: string;
  schedule: string;
  type: 'full' | 'database' | 'incremental';
  retention: string;
  compression: boolean;
}

const BackupsPage = () => {
  const { t } = useLanguage();

  // Active schedules
  const [schedules, setSchedules] = useState<any[]>([]);

  // Presets
  const [presets, setPresets] = useState<BackupPreset[]>([
    {
      id: '1',
      name: 'Ежедневный полный',
      schedule: '0 3 * * *',
      type: 'full',
      retention: '30 дней',
      compression: true,
    },
    {
      id: '2',
      name: 'Почасовой инкремент',
      schedule: '0 * * * *',
      type: 'incremental',
      retention: '7 дней',
      compression: false,
    },
    {
      id: '3',
      name: 'БД каждые 6ч',
      schedule: '0 */6 * * *',
      type: 'database',
      retention: '14 дней',
      compression: true,
    },
  ]);

  // Form state
  const [formSchedule, setFormSchedule] = useState('0 3 * * *');
  const [formType, setFormType] = useState<'full' | 'database' | 'incremental'>('full');
  const [formRetention, setFormRetention] = useState('30');
  const [formCompression, setFormCompression] = useState(true);

  // New preset form
  const [presetName, setPresetName] = useState('');
  const [presetSchedule, setPresetSchedule] = useState('0 3 * * *');
  const [presetType, setPresetType] = useState<'full' | 'database' | 'incremental'>('full');
  const [presetRetention, setPresetRetention] = useState('30 дней');
  const [presetCompression, setPresetCompression] = useState(true);

  // Fetch schedules
  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/system/backups/schedules');
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch schedules', e);
    }
  };

  const applyPreset = (preset: BackupPreset) => {
    setFormSchedule(preset.schedule);
    setFormType(preset.type);
    setFormRetention(preset.retention.replace(/\D/g, ''));
    setFormCompression(preset.compression);
    toast.success('Пресет применен к форме');
  };

  const addPreset = () => {
    if (!presetName) return;
    const newPreset: BackupPreset = {
      id: Math.random().toString(36).slice(2),
      name: presetName,
      schedule: presetSchedule,
      type: presetType,
      retention: presetRetention,
      compression: presetCompression,
    };
    setPresets(prev => [newPreset, ...prev]);
    setPresetName('');
    toast.success('Пресет добавлен локально');
  };

  const deletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
  };

  const handleBackupNow = async () => {
    try {
      const res = await fetch('/api/system/backups/run', { method: 'POST' });
      if (res.ok) {
        toast.success('Бэкап запущен (Stub)');
      } else {
        toast.error('Ошибка запуска');
      }
    } catch (e: any) {
      toast.error('Ошибка: ' + e.message);
    }
  };

  const handleCheckUpdates = async () => {
    try {
      const res = await fetch('/api/system/backups/check-updates');
      if (res.ok) {
        const data = await res.json();
        toast.info(data.message);
      }
    } catch (e: any) {
      toast.error('Ошибка проверки');
    }
  };

  const handleCreateTask = async () => {
    try {
      const res = await fetch('/api/system/backups/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Backup ${formType}`,
          time: formSchedule,
          type: formType
        })
      });
      if (res.ok) {
        toast.success('Задача создана');
        fetchSchedules();
      }
    } catch (e) {
      toast.error('Ошибка создания');
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'full': return 'bg-primary/20 text-primary border-primary/30';
      case 'database': return 'bg-warning/20 text-warning border-warning/30';
      case 'incremental': return 'bg-success/20 text-success border-success/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

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
          <Button variant="outline" className="gap-2" onClick={handleCheckUpdates}>
            <RefreshCw className="h-4 w-4" />
            {t('checkUpdates')}
          </Button>
          <Button className="gap-2" onClick={handleBackupNow}>
            <Plus className="h-4 w-4" />
            {t('backupNow')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Presets */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Пресеты бэкапов</CardTitle>
            </div>
            <CardDescription>
              Шаблоны расписаний
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[200px] pr-3">
              <div className="space-y-3">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3 rounded-lg border border-border/50 bg-background/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{preset.name}</span>
                      <Badge variant="outline" className={cn("text-xs", getTypeBadgeColor(preset.type))}>
                        {preset.type}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Cron: <span className="font-mono">{preset.schedule}</span></p>
                      <p>Хранить: {preset.retention} • {preset.compression ? 'Сжатие' : 'Без сжатия'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 gap-1.5"
                        onClick={() => applyPreset(preset)}
                      >
                        <Play className="h-3 w-3" />
                        Применить
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deletePreset(preset.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-border/50 pt-4 space-y-3">
              <p className="text-sm font-medium">Новый пресет</p>
              <Input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Название"
              />
              <Input
                value={presetSchedule}
                onChange={(e) => setPresetSchedule(e.target.value)}
                placeholder="Cron (0 3 * * *)"
                className="font-mono text-sm"
              />
              <Select value={presetType} onValueChange={(v) => setPresetType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Полный</SelectItem>
                  <SelectItem value="database">База данных</SelectItem>
                  <SelectItem value="incremental">Инкрементальный</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addPreset} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Добавить пресет
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Backup Configuration */}
        <Card className="xl:col-span-2 bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Настройка бэкапа
            </CardTitle>
            <CardDescription>
              Примените пресет или настройте вручную
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Расписание (Cron)</Label>
                <Input
                  value={formSchedule}
                  onChange={(e) => setFormSchedule(e.target.value)}
                  placeholder="0 3 * * *"
                  className="mt-1.5 font-mono"
                />
              </div>
              <div>
                <Label>Тип бэкапа</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as any)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Полный</SelectItem>
                    <SelectItem value="database">База данных</SelectItem>
                    <SelectItem value="incremental">Инкрементальный</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Хранить (дней)</Label>
                <Input
                  value={formRetention}
                  onChange={(e) => setFormRetention(e.target.value)}
                  placeholder="30"
                  className="mt-1.5"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={formCompression}
                  onCheckedChange={setFormCompression}
                  id="compression"
                />
                <Label htmlFor="compression">Сжатие</Label>
              </div>
            </div>
            <Button className="w-full gap-2" onClick={handleCreateTask}>
              <Plus className="h-4 w-4" />
              Создать задачу бэкапа
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BackupStatus />

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Активные расписания
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
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
                  <span className={`text-sm px-2 py-1 rounded-full ${schedule.status === 'active'
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
