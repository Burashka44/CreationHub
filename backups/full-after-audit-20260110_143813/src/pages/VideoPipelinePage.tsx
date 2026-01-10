import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Video, Settings, Wand2, History, Cpu, Eye, Eraser, Play, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PipelineSettings {
    // Detection settings
    autoDetectWatermark: boolean;
    detectionSensitivity: number;
    detectionModel: 'llava' | 'sam2' | 'both';
    commonPositions: string[];

    // Processing settings
    processingQuality: 'fast' | 'balanced' | 'quality';
    inpaintingModel: 'lama' | 'sd15' | 'sdxl';
    preserveAudio: boolean;
    outputFormat: 'mp4' | 'webm' | 'mkv';
    outputFps: number;

    // Resource settings
    gpuEnabled: boolean;
    maxConcurrentJobs: number;
    autocleanupDays: number;
}

interface ProcessingJob {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    videoName: string;
    watermarksFound: number;
    progress: number;
    createdAt: string;
    completedAt?: string;
}

const defaultSettings: PipelineSettings = {
    autoDetectWatermark: true,
    detectionSensitivity: 70,
    detectionModel: 'both',
    commonPositions: ['bottom_right', 'top_left'],
    processingQuality: 'balanced',
    inpaintingModel: 'lama',
    preserveAudio: true,
    outputFormat: 'mp4',
    outputFps: 30,
    gpuEnabled: true,
    maxConcurrentJobs: 2,
    autocleanupDays: 7,
};

const VIDEO_PROCESSOR_URL = '/api/video-processor';

function VideoPipelinePage() {
    const { t } = useLanguage();
    const [settings, setSettings] = useState<PipelineSettings>(defaultSettings);
    const [jobs, setJobs] = useState<ProcessingJob[]>([]);
    const [loading, setLoading] = useState(false);
    const [servicesStatus, setServicesStatus] = useState({
        videoProcessor: false,
        iopaint: false,
        sam2: false,
        ollama: false,
    });

    useEffect(() => {
        loadSettings();
        loadJobs();
        checkServicesStatus();
    }, []);

    const loadSettings = async () => {
        try {
            const { data } = await supabase
                .from('app_settings')
                .select('*')
                .eq('key', 'video_pipeline_settings')
                .single();

            if (data?.value) {
                const settingsValue = typeof data.value === 'string'
                    ? JSON.parse(data.value)
                    : data.value;
                setSettings({ ...defaultSettings, ...settingsValue });
            }
        } catch (error) {
            console.error('Failed to load pipeline settings:', error);
        }
    };

    const saveSettings = async () => {
        setLoading(true);
        try {
            await supabase
                .from('app_settings')
                .upsert({
                    key: 'video_pipeline_settings',
                    value: JSON.stringify(settings),
                    category: 'video_pipeline',
                    updated_at: new Date().toISOString(),
                });
            toast.success('Настройки сохранены');
        } catch (error) {
            toast.error('Ошибка сохранения настроек');
        }
        setLoading(false);
    };

    const loadJobs = async () => {
        // Mock data for now - would fetch from video-processor API
        setJobs([]);
    };

    const checkServicesStatus = async () => {
        try {
            const res = await fetch('/api/services/status-by-port');
            if (res.ok) {
                const statuses = await res.json();

                // Map API status (keyed by port) to local state keys
                // 'online' means true, anything else means false
                setServicesStatus({
                    videoProcessor: statuses['8686'] === 'online',
                    iopaint: statuses['8585'] === 'online',
                    sam2: statuses['8787'] === 'online',
                    ollama: statuses['11434'] === 'online',
                });
            } else {
                console.error("Failed to fetch service statuses");
            }
        } catch (e) {
            console.error("Error checking services:", e);
        }
    };

    const updateSetting = <K extends keyof PipelineSettings>(key: K, value: PipelineSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const startTestJob = async () => {
        toast.info('Тестовая обработка запущена');
        // Would call video-processor API
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Video className="h-8 w-8" />
                        Video Processing Pipeline
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Настройка обработки видео, детекции и удаления водяных знаков
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={checkServicesStatus}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Проверить сервисы
                    </Button>
                    <Button onClick={saveSettings} disabled={loading}>
                        Сохранить настройки
                    </Button>
                </div>
            </div>

            {/* Services Status */}
            <div className="grid grid-cols-4 gap-4">
                {Object.entries(servicesStatus).map(([name, status]) => (
                    <Card key={name} className={status ? 'border-green-500/50' : 'border-red-500/50'}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="capitalize">{name.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Settings Tabs */}
            <Tabs defaultValue="detection" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="detection" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Детекция
                    </TabsTrigger>
                    <TabsTrigger value="processing" className="flex items-center gap-2">
                        <Eraser className="h-4 w-4" />
                        Обработка
                    </TabsTrigger>
                    <TabsTrigger value="resources" className="flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        Ресурсы
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        История
                    </TabsTrigger>
                </TabsList>

                {/* Detection Tab */}
                <TabsContent value="detection">
                    <Card>
                        <CardHeader>
                            <CardTitle>Настройки детекции водяных знаков</CardTitle>
                            <CardDescription>
                                Конфигурация автоматического обнаружения рекламы, логотипов и водяных знаков
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Автоматическая детекция</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Автоматически обнаруживать водяные знаки на первом кадре
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.autoDetectWatermark}
                                    onCheckedChange={(checked) => updateSetting('autoDetectWatermark', checked)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Чувствительность детекции: {settings.detectionSensitivity}%</Label>
                                <Slider
                                    value={[settings.detectionSensitivity]}
                                    onValueChange={([value]) => updateSetting('detectionSensitivity', value)}
                                    min={10}
                                    max={100}
                                    step={5}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground px-1">
                                    <span>10%</span>
                                    <span>25%</span>
                                    <span>50%</span>
                                    <span>75%</span>
                                    <span>100%</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Высокая чувствительность — больше обнаружений, возможны ложные срабатывания
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Модель детекции</Label>
                                <Select
                                    value={settings.detectionModel}
                                    onValueChange={(value: 'llava' | 'sam2' | 'both') => updateSetting('detectionModel', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="llava">LLava (описательная)</SelectItem>
                                        <SelectItem value="sam2">SAM 2 (сегментация)</SelectItem>
                                        <SelectItem value="both">Обе модели (рекомендуется)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Типичные позиции водяных знаков</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['top_left', 'top_center', 'top_right', 'center_left', 'center', 'center_right', 'bottom_left', 'bottom_center', 'bottom_right'].map((pos) => (
                                        <Button
                                            key={pos}
                                            variant={settings.commonPositions.includes(pos) ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => {
                                                const newPositions = settings.commonPositions.includes(pos)
                                                    ? settings.commonPositions.filter(p => p !== pos)
                                                    : [...settings.commonPositions, pos];
                                                updateSetting('commonPositions', newPositions);
                                            }}
                                        >
                                            {pos.replace(/_/g, ' ')}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Processing Tab */}
                <TabsContent value="processing">
                    <Card>
                        <CardHeader>
                            <CardTitle>Настройки обработки</CardTitle>
                            <CardDescription>
                                Параметры удаления водяных знаков и сборки видео
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Качество обработки</Label>
                                <Select
                                    value={settings.processingQuality}
                                    onValueChange={(value: 'fast' | 'balanced' | 'quality') => updateSetting('processingQuality', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fast">Быстрая (1 fps, LaMA)</SelectItem>
                                        <SelectItem value="balanced">Сбалансированная (5 fps, LaMA)</SelectItem>
                                        <SelectItem value="quality">Высокое качество (все кадры)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Модель инпейнтинга</Label>
                                <Select
                                    value={settings.inpaintingModel}
                                    onValueChange={(value: 'lama' | 'sd15' | 'sdxl') => updateSetting('inpaintingModel', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="lama">LaMA (быстрая, хорошее качество)</SelectItem>
                                        <SelectItem value="sd15">Stable Diffusion 1.5 (медленнее, лучше)</SelectItem>
                                        <SelectItem value="sdxl">SDXL (самое высокое качество, требует GPU)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Сохранять аудио</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Извлечь и добавить оригинальную аудиодорожку
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.preserveAudio}
                                    onCheckedChange={(checked) => updateSetting('preserveAudio', checked)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Выходной формат</Label>
                                    <Select
                                        value={settings.outputFormat}
                                        onValueChange={(value: 'mp4' | 'webm' | 'mkv') => updateSetting('outputFormat', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="mp4">MP4 (H.264)</SelectItem>
                                            <SelectItem value="webm">WebM (VP9)</SelectItem>
                                            <SelectItem value="mkv">MKV (H.265)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>FPS на выходе</Label>
                                    <Select
                                        value={settings.outputFps.toString()}
                                        onValueChange={(value) => updateSetting('outputFps', parseInt(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="24">24 fps</SelectItem>
                                            <SelectItem value="30">30 fps</SelectItem>
                                            <SelectItem value="60">60 fps</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Resources Tab */}
                <TabsContent value="resources">
                    <Card>
                        <CardHeader>
                            <CardTitle>Управление ресурсами</CardTitle>
                            <CardDescription>
                                GPU, параллельная обработка, автоочистка
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Использовать GPU</Label>
                                    <p className="text-sm text-muted-foreground">
                                        NVIDIA CUDA для ускорения обработки
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.gpuEnabled}
                                    onCheckedChange={(checked) => updateSetting('gpuEnabled', checked)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Параллельных задач: {settings.maxConcurrentJobs}</Label>
                                <Slider
                                    value={[settings.maxConcurrentJobs]}
                                    onValueChange={([value]) => updateSetting('maxConcurrentJobs', value)}
                                    min={1}
                                    max={4}
                                    step={1}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground px-1">
                                    <span>1</span>
                                    <span>2</span>
                                    <span>3</span>
                                    <span>4</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Больше задач = быстрее, но требует больше RAM/VRAM
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Автоочистка через {settings.autocleanupDays} дней</Label>
                                <Slider
                                    value={[settings.autocleanupDays]}
                                    onValueChange={([value]) => updateSetting('autocleanupDays', value)}
                                    min={1}
                                    max={30}
                                    step={1}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground px-1">
                                    <span>1</span>
                                    <span>7</span>
                                    <span>14</span>
                                    <span>21</span>
                                    <span>30</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <Button onClick={startTestJob} className="w-full">
                                    <Play className="h-4 w-4 mr-2" />
                                    Запустить тестовую обработку
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>История обработки</CardTitle>
                            <CardDescription>
                                Последние задачи обработки видео
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {jobs.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Нет обработанных видео</p>
                                    <p className="text-sm">Используйте n8n или API для запуска обработки</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {jobs.map((job) => (
                                        <div key={job.id} className="p-3 bg-muted rounded-lg flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{job.videoName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {job.watermarksFound} водяных знаков найдено
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2 py-1 rounded text-xs ${job.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                                    job.status === 'processing' ? 'bg-blue-500/20 text-blue-500' :
                                                        job.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                                                            'bg-gray-500/20 text-gray-500'
                                                    }`}>
                                                    {job.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default VideoPipelinePage;
