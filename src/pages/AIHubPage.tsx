import React, { useState } from 'react';
import { 
  Settings, Server, Activity, Mic, Languages, Volume2, 
  Video, Sparkles, Play, Trash2, Plus, RefreshCw, 
  Check, AlertCircle, HelpCircle, FileAudio, Upload
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface Preset {
  id: string;
  name: string;
  target: string;
  payload: Record<string, string>;
  description?: string;
}

interface LogItem {
  id: string;
  title: string;
  body?: unknown;
  downloadUrl?: string;
  error?: string;
  timestamp: Date;
}

const AIHubPage = () => {
  const { t } = useLanguage();
  
  // Config state
  const [apiBase, setApiBase] = useState('http://localhost:8088');
  const [apiKey, setApiKey] = useState('');
  const [health, setHealth] = useState<'ok' | 'error' | 'checking' | 'unknown'>('unknown');
  
  // Presets
  const [presets, setPresets] = useState<Preset[]>([
    {
      id: '1',
      name: 'Dubbing → English',
      target: 'av',
      payload: { src_lang: 'auto', tgt_lang: 'en' },
      description: 'ASR→MT→TTS с авто-определением языка, выход EN',
    },
    {
      id: '2',
      name: 'Dubbing → French',
      target: 'av',
      payload: { src_lang: 'auto', tgt_lang: 'fr' },
      description: 'ASR→MT→TTS, выход FR',
    },
    {
      id: '3',
      name: 'Clean: logo+face',
      target: 'clean',
      payload: { method: 'propainter', objects: 'logo,face' },
      description: 'Инпейнт логотипов и лиц',
    },
  ]);
  
  // Console logs
  const [logs, setLogs] = useState<LogItem[]>([]);
  
  // Active tab
  const [activeTab, setActiveTab] = useState('asr');
  
  // Form states
  const [asrTask, setAsrTask] = useState('transcribe');
  const [asrLang, setAsrLang] = useState('');
  const [trText, setTrText] = useState('Привет! Это тест перевода.');
  const [trSrc, setTrSrc] = useState('ru');
  const [trTgt, setTrTgt] = useState('en');
  const [ttsText, setTtsText] = useState('Hello! This is a synthesized sample.');
  const [ttsLang, setTtsLang] = useState('en');
  const [avSrcLang, setAvSrcLang] = useState('auto');
  const [avTgtLang, setAvTgtLang] = useState('en');
  const [cleanMethod, setCleanMethod] = useState('propainter');
  const [cleanObjects, setCleanObjects] = useState('logo,face');
  
  // New preset form
  const [presetName, setPresetName] = useState('');
  const [presetTarget, setPresetTarget] = useState('av');
  const [presetJSON, setPresetJSON] = useState('{\n  "src_lang": "auto",\n  "tgt_lang": "en"\n}');
  
  const pushLog = (title: string, body?: unknown, downloadUrl?: string, error?: string) => {
    setLogs(prev => [{ 
      id: Math.random().toString(36).slice(2), 
      title, 
      body, 
      downloadUrl, 
      error,
      timestamp: new Date()
    }, ...prev]);
  };
  
  const applyPreset = (preset: Preset) => {
    setActiveTab(preset.target);
    const p = preset.payload;
    
    switch (preset.target) {
      case 'asr':
        if (p.task) setAsrTask(p.task);
        if (p.lang) setAsrLang(p.lang);
        break;
      case 'translate':
        if (p.text) setTrText(p.text);
        if (p.src_lang) setTrSrc(p.src_lang);
        if (p.tgt_lang) setTrTgt(p.tgt_lang);
        break;
      case 'tts':
        if (p.text) setTtsText(p.text);
        if (p.lang) setTtsLang(p.lang);
        break;
      case 'av':
        if (p.src_lang) setAvSrcLang(p.src_lang);
        if (p.tgt_lang) setAvTgtLang(p.tgt_lang);
        break;
      case 'clean':
        if (p.method) setCleanMethod(p.method);
        if (p.objects) setCleanObjects(p.objects);
        break;
    }
    
    pushLog(`Пресет "${preset.name}" применён`, preset.payload);
  };
  
  const checkHealth = async () => {
    setHealth('checking');
    try {
      const r = await fetch(`${apiBase.replace(/\/$/, '')}/healthz`, {
        headers: apiKey ? { 'X-API-Key': apiKey } : {},
      });
      const j = await r.json();
      setHealth(j.status === 'ok' ? 'ok' : 'error');
      pushLog('/healthz', j);
    } catch (e) {
      setHealth('error');
      pushLog('/healthz error', undefined, undefined, String(e));
    }
  };
  
  const deletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
  };
  
  const addPreset = () => {
    try {
      const payload = JSON.parse(presetJSON);
      const newPreset: Preset = {
        id: Math.random().toString(36).slice(2),
        name: presetName || 'New Preset',
        target: presetTarget,
        payload,
      };
      setPresets(prev => [newPreset, ...prev]);
      setPresetName('');
    } catch {
      pushLog('Preset error', undefined, undefined, 'Invalid JSON');
    }
  };
  
  const getTargetBadgeColor = (target: string) => {
    switch (target) {
      case 'av': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'asr': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'tts': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'translate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'clean': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const HintTooltip = ({ text, example }: { text: string; example?: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help inline ml-1" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{text}</p>
          {example && <p className="text-muted-foreground mt-1">Пример: {example}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Hub</h1>
            <p className="text-sm text-muted-foreground">Управление AI сервисами</p>
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={cn(
            "gap-1.5 px-3 py-1",
            health === 'ok' && 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
            health === 'error' && 'bg-destructive/10 text-destructive border-destructive/30',
            health === 'checking' && 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
            health === 'unknown' && 'bg-muted text-muted-foreground'
          )}
        >
          {health === 'ok' && <Check className="h-3.5 w-3.5" />}
          {health === 'error' && <AlertCircle className="h-3.5 w-3.5" />}
          {health === 'checking' && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
          {health === 'unknown' && <Activity className="h-3.5 w-3.5" />}
          Health: {health}
        </Badge>
      </div>

      {/* API Configuration */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">API Конфигурация</CardTitle>
          </div>
          <CardDescription>
            Укажите адрес бэкенда и ключ доступа. Сохраняется локально.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-sm">
                API Base URL
                <HintTooltip text="Адрес FastAPI сервиса" example="https://aihub.example.com" />
              </Label>
              <Input
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
                placeholder="http://localhost:8088"
                className="mt-1.5"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="text-sm">
                API Key (X-API-Key)
                <HintTooltip text="Токен авторизации" example="скопируй из .env → API_KEY" />
              </Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="optional"
                className="mt-1.5"
              />
            </div>
            <Button onClick={checkHealth} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Проверить
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Presets */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Пресеты</CardTitle>
            </div>
            <CardDescription>
              Создавай и применяй наборы параметров
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[280px] pr-3">
              <div className="space-y-3">
                {presets.map((preset) => (
                  <div 
                    key={preset.id} 
                    className="p-3 rounded-lg border border-border/50 bg-background/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{preset.name}</span>
                      <Badge variant="outline" className={cn("text-xs", getTargetBadgeColor(preset.target))}>
                        {preset.target}
                      </Badge>
                    </div>
                    {preset.description && (
                      <p className="text-xs text-muted-foreground">{preset.description}</p>
                    )}
                    <pre className="text-xs bg-muted/50 p-2 rounded border border-border/30 overflow-x-auto">
                      {JSON.stringify(preset.payload, null, 2)}
                    </pre>
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
              <Select value={presetTarget} onValueChange={setPresetTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="av">AV Pipeline</SelectItem>
                  <SelectItem value="asr">ASR</SelectItem>
                  <SelectItem value="tts">TTS</SelectItem>
                  <SelectItem value="translate">Translate</SelectItem>
                  <SelectItem value="clean">Video Clean</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                value={presetJSON}
                onChange={(e) => setPresetJSON(e.target.value)}
                placeholder="JSON payload"
                className="font-mono text-xs h-20"
              />
              <Button onClick={addPreset} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Добавить пресет
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">API Эндпоинты</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="asr" className="gap-1.5 text-xs">
                  <Mic className="h-3.5 w-3.5" />
                  ASR
                </TabsTrigger>
                <TabsTrigger value="translate" className="gap-1.5 text-xs">
                  <Languages className="h-3.5 w-3.5" />
                  Translate
                </TabsTrigger>
                <TabsTrigger value="tts" className="gap-1.5 text-xs">
                  <Volume2 className="h-3.5 w-3.5" />
                  TTS
                </TabsTrigger>
                <TabsTrigger value="av" className="gap-1.5 text-xs">
                  <Video className="h-3.5 w-3.5" />
                  AV Pipeline
                </TabsTrigger>
                <TabsTrigger value="clean" className="gap-1.5 text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  Clean
                </TabsTrigger>
              </TabsList>

              <TabsContent value="asr" className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Задача</Label>
                    <Select value={asrTask} onValueChange={setAsrTask}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transcribe">Transcribe</SelectItem>
                        <SelectItem value="translate">Translate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Язык (опционально)</Label>
                    <Input
                      value={asrLang}
                      onChange={(e) => setAsrLang(e.target.value)}
                      placeholder="auto"
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border border-dashed border-border/50 rounded-lg">
                  <FileAudio className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Загрузить аудио/видео</p>
                    <p className="text-xs text-muted-foreground">MP3, WAV, MP4, WebM</p>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Выбрать
                  </Button>
                </div>
                <Button className="w-full">Запустить ASR</Button>
              </TabsContent>

              <TabsContent value="translate" className="space-y-4">
                <Textarea
                  value={trText}
                  onChange={(e) => setTrText(e.target.value)}
                  placeholder="Текст для перевода"
                  className="h-24"
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Исходный язык</Label>
                    <Select value={trSrc} onValueChange={setTrSrc}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Целевой язык</Label>
                    <Select value={trTgt} onValueChange={setTrTgt}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full">Перевести</Button>
              </TabsContent>

              <TabsContent value="tts" className="space-y-4">
                <Textarea
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  placeholder="Текст для синтеза"
                  className="h-24"
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Язык</Label>
                    <Select value={ttsLang} onValueChange={setTtsLang}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" className="gap-2 w-full">
                      <Upload className="h-4 w-4" />
                      Speaker WAV
                    </Button>
                  </div>
                </div>
                <Button className="w-full">Синтезировать</Button>
              </TabsContent>

              <TabsContent value="av" className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Исходный язык</Label>
                    <Select value={avSrcLang} onValueChange={setAvSrcLang}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Целевой язык</Label>
                    <Select value={avTgtLang} onValueChange={setAvTgtLang}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border border-dashed border-border/50 rounded-lg">
                  <Video className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Загрузить видео</p>
                    <p className="text-xs text-muted-foreground">MP4, WebM, MKV</p>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Выбрать
                  </Button>
                </div>
                <Button className="w-full">Запустить дубляж</Button>
              </TabsContent>

              <TabsContent value="clean" className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Метод</Label>
                    <Select value={cleanMethod} onValueChange={setCleanMethod}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="propainter">ProPainter</SelectItem>
                        <SelectItem value="lama">LaMa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Объекты для удаления</Label>
                    <Input
                      value={cleanObjects}
                      onChange={(e) => setCleanObjects(e.target.value)}
                      placeholder="logo,face,text"
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border border-dashed border-border/50 rounded-lg">
                  <Video className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Загрузить видео</p>
                    <p className="text-xs text-muted-foreground">MP4, WebM</p>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Выбрать
                  </Button>
                </div>
                <Button className="w-full">Запустить очистку</Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Console */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Консоль</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLogs([])}
              className="text-muted-foreground"
            >
              Очистить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Нет логов. Выполните запрос для отображения результатов.
              </p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className={cn(
                      "p-3 rounded-lg border text-sm font-mono",
                      log.error 
                        ? "bg-destructive/10 border-destructive/30 text-destructive" 
                        : "bg-muted/50 border-border/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{log.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    {log.error && <p className="text-xs">{log.error}</p>}
                    {log.body && (
                      <pre className="text-xs mt-1 overflow-x-auto">
                        {JSON.stringify(log.body, null, 2)}
                      </pre>
                    )}
                    {log.downloadUrl && (
                      <Button size="sm" variant="outline" className="mt-2" asChild>
                        <a href={log.downloadUrl} download>Скачать</a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIHubPage;
