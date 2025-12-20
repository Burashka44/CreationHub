import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Settings, Server, Activity, Mic, Languages, Volume2, 
  Video, Sparkles, Play, Trash2, Plus, RefreshCw, ArrowLeftRight,
  Check, AlertCircle, HelpCircle, FileAudio, Upload,
  MessageSquare, Image, FileText, History, Send, Loader2, Download, Paperclip, X
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ContextualPresets from '@/components/aihub/ContextualPresets';

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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIRequest {
  id: string;
  request_type: string;
  input_data: unknown;
  output_data: unknown;
  model: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

const AIHubPage = () => {
  const { t } = useLanguage();
  
  // Config state
  const [apiBase, setApiBase] = useState('http://localhost:8088');
  const [apiKey, setApiKey] = useState('');
  const [health, setHealth] = useState<'ok' | 'error' | 'checking' | 'unknown'>('unknown');
  
  // Presets
  const [presets, setPresets] = useState<Preset[]>([
    // Chat presets - роли
    {
      id: 'chat-1',
      name: 'Программист',
      target: 'chat',
      payload: { system_prompt: 'Ты опытный программист. Помогай с кодом, объясняй концепции, предлагай лучшие практики.' },
      description: 'AI-ассистент для помощи с программированием',
    },
    {
      id: 'chat-2',
      name: 'Переводчик',
      target: 'chat',
      payload: { system_prompt: 'Ты профессиональный переводчик. Переводи тексты качественно, сохраняя смысл и стиль.' },
      description: 'Переводит тексты между языками',
    },
    {
      id: 'chat-3',
      name: 'Копирайтер',
      target: 'chat',
      payload: { system_prompt: 'Ты креативный копирайтер. Пиши продающие тексты, заголовки, посты для соцсетей.' },
      description: 'Создаёт маркетинговые тексты и контент',
    },
    {
      id: 'chat-4',
      name: 'Редактор',
      target: 'chat',
      payload: { system_prompt: 'Ты редактор текстов. Исправляй ошибки, улучшай стиль, делай текст читабельнее.' },
      description: 'Редактирует и улучшает тексты',
    },
    // Image presets
    {
      id: 'img-1',
      name: 'Фотореализм',
      target: 'image',
      payload: { style: 'photorealistic, 8k, ultra detailed, professional photography' },
      description: 'Генерация фотореалистичных изображений',
    },
    {
      id: 'img-2',
      name: 'Аниме стиль',
      target: 'image',
      payload: { style: 'anime style, vibrant colors, detailed, studio ghibli inspired' },
      description: 'Изображения в стиле аниме',
    },
    {
      id: 'img-3',
      name: 'Логотип',
      target: 'image',
      payload: { style: 'minimalist logo design, vector style, clean lines, professional' },
      description: 'Минималистичные логотипы',
    },
    {
      id: 'img-4',
      name: 'Иллюстрация',
      target: 'image',
      payload: { style: 'digital illustration, colorful, artistic, detailed artwork' },
      description: 'Художественные иллюстрации',
    },
    {
      id: 'img-5',
      name: 'Концепт-арт',
      target: 'image',
      payload: { style: 'concept art, cinematic, dramatic lighting, epic scene' },
      description: 'Концептуальное искусство для игр/фильмов',
    },
    // AV presets
    {
      id: 'av-1',
      name: 'Дубляж → EN',
      target: 'av',
      payload: { src_lang: 'auto', tgt_lang: 'en' },
      description: 'Перевод и озвучка видео на английский',
    },
    {
      id: 'av-2',
      name: 'Дубляж → RU',
      target: 'av',
      payload: { src_lang: 'auto', tgt_lang: 'ru' },
      description: 'Перевод и озвучка видео на русский',
    },
    // Clean presets
    {
      id: 'clean-1',
      name: 'Убрать логотипы',
      target: 'clean',
      payload: { method: 'propainter', objects: 'logo,watermark' },
      description: 'Удаление логотипов и водяных знаков из видео',
    },
    {
      id: 'clean-2',
      name: 'Размыть лица',
      target: 'clean',
      payload: { method: 'propainter', objects: 'face' },
      description: 'Размытие/удаление лиц из видео',
    },
    // ASR presets
    {
      id: 'asr-1',
      name: 'Расшифровка RU',
      target: 'asr',
      payload: { task: 'transcribe', language: 'ru' },
      description: 'Транскрибация русской речи',
    },
    {
      id: 'asr-2',
      name: 'Перевод → EN',
      target: 'asr',
      payload: { task: 'translate', language: 'en' },
      description: 'Распознавание + перевод на английский',
    },
    // TTS presets
    {
      id: 'tts-1',
      name: 'Озвучка RU',
      target: 'tts',
      payload: { language: 'ru', voice: 'default' },
      description: 'Синтез русской речи',
    },
    {
      id: 'tts-2',
      name: 'Озвучка EN',
      target: 'tts',
      payload: { language: 'en', voice: 'default' },
      description: 'Синтез английской речи',
    },
  ]);
  
  // Console logs
  const [logs, setLogs] = useState<LogItem[]>([]);
  
  // Active tab
  const [activeTab, setActiveTab] = useState('chat');
  
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
  
  // AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-flash');
  const [streamingContent, setStreamingContent] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Image generation state
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  
  // Summarization state
  const [summarizeText, setSummarizeText] = useState('');
  const [summarizeResult, setSummarizeResult] = useState('');
  const [summarizeLoading, setSummarizeLoading] = useState(false);
  
  // History state
  const [aiHistory, setAiHistory] = useState<AIRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Drag-and-drop state for file uploads
  const [asrDragActive, setAsrDragActive] = useState(false);
  const [avDragActive, setAvDragActive] = useState(false);
  const [cleanDragActive, setCleanDragActive] = useState(false);
  const [asrFile, setAsrFile] = useState<File | null>(null);
  const [avFile, setAvFile] = useState<File | null>(null);
  const [cleanFile, setCleanFile] = useState<File | null>(null);
  const [asrUploadProgress, setAsrUploadProgress] = useState(0);
  const [avUploadProgress, setAvUploadProgress] = useState(0);
  const [cleanUploadProgress, setCleanUploadProgress] = useState(0);
  const asrInputRef = useRef<HTMLInputElement>(null);
  const avInputRef = useRef<HTMLInputElement>(null);
  const cleanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);
  
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

  const saveToHistory = async (
    type: string, 
    input: Record<string, unknown>, 
    output: Record<string, unknown> | null, 
    model: string | null,
    status: string,
    error?: string
  ) => {
    try {
      await supabase.from('ai_requests').insert([{
        request_type: type,
        input_data: input as unknown as Record<string, never>,
        output_data: output as unknown as Record<string, never>,
        model,
        status,
        error_message: error || null,
        completed_at: status === 'completed' || status === 'error' ? new Date().toISOString() : null
      }]);
    } catch (e) {
      console.error('Failed to save to history:', e);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setAiHistory(data || []);
    } catch (e) {
      console.error('Failed to load history:', e);
      toast.error('Не удалось загрузить историю');
    } finally {
      setHistoryLoading(false);
    }
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
  

  // Добавление пресета для конкретной вкладки (для контекстных пресетов)
  const addPresetForTab = (name: string, payload: Record<string, string>) => {
    const newPreset: Preset = {
      id: Math.random().toString(36).slice(2),
      name,
      target: activeTab,
      payload,
    };
    setPresets(prev => [newPreset, ...prev]);
    toast.success('Пресет сохранён');
  };

  // Словарь описаний полей для экспорта
  const fieldDescriptions: Record<string, string> = {
    src_lang: 'Исходный язык (auto = автоопределение)',
    tgt_lang: 'Целевой язык перевода/дубляжа',
    method: 'Метод обработки (propainter, deepfill и др.)',
    objects: 'Объекты для удаления (logo, face, watermark)',
    model: 'Модель AI для обработки',
    voice: 'Голос для синтеза речи',
    speed: 'Скорость речи (0.5-2.0)',
    format: 'Формат выходного файла',
    quality: 'Качество обработки (low, medium, high)',
    prompt: 'Промпт для генерации',
    temperature: 'Температура генерации (0-1)',
  };

  const getTargetDescription = (target: string): string => {
    switch (target) {
      case 'av': return 'Дубляж видео - перевод и озвучка';
      case 'asr': return 'Распознавание речи в текст';
      case 'tts': return 'Синтез речи из текста';
      case 'translate': return 'Перевод текста';
      case 'clean': return 'Очистка видео от объектов';
      case 'chat': return 'AI чат-ассистент';
      case 'image': return 'Генерация изображений';
      case 'summarize': return 'Суммаризация текста';
      default: return target;
    }
  };

  const exportPresets = () => {
    // Создаём экспортируемый формат с комментариями
    const exportData = {
      _info: {
        exported_at: new Date().toISOString(),
        version: '1.0',
        description: 'Экспорт пресетов AI Hub. Поля payload описаны в _field_descriptions.',
      },
      _field_descriptions: fieldDescriptions,
      _target_types: {
        av: 'Дубляж видео',
        asr: 'Распознавание речи',
        tts: 'Синтез речи',
        translate: 'Перевод текста',
        clean: 'Очистка видео',
        chat: 'AI чат',
        image: 'Генерация картинок',
        summarize: 'Суммаризация',
      },
      presets: presets.map(p => ({
        name: p.name,
        target: p.target,
        target_description: getTargetDescription(p.target),
        description: p.description || '',
        payload: p.payload,
        payload_explained: Object.fromEntries(
          Object.entries(p.payload).map(([key, value]) => [
            key,
            { value, description: fieldDescriptions[key] || 'Пользовательский параметр' }
          ])
        ),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-hub-presets-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Пресеты экспортированы');
  };

  const importPresetsInputRef = useRef<HTMLInputElement>(null);

  const importPresets = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // Поддержка разных форматов импорта
        let importedPresets: Preset[] = [];
        
        if (Array.isArray(data)) {
          // Простой массив пресетов
          importedPresets = data.map((p, i) => ({
            id: Math.random().toString(36).slice(2),
            name: p.name || `Imported ${i + 1}`,
            target: p.target || 'chat',
            payload: p.payload || {},
            description: p.description,
          }));
        } else if (data.presets && Array.isArray(data.presets)) {
          // Формат с метаданными
          importedPresets = data.presets.map((p: Record<string, unknown>, i: number) => ({
            id: Math.random().toString(36).slice(2),
            name: (p.name as string) || `Imported ${i + 1}`,
            target: (p.target as string) || 'chat',
            payload: (p.payload as Record<string, string>) || {},
            description: p.description as string | undefined,
          }));
        } else {
          throw new Error('Неверный формат файла');
        }

        if (importedPresets.length === 0) {
          toast.error('Файл не содержит пресетов');
          return;
        }

        setPresets(prev => [...importedPresets, ...prev]);
        toast.success(`Импортировано ${importedPresets.length} пресетов`);
      } catch (err) {
        toast.error('Ошибка чтения файла: ' + (err instanceof Error ? err.message : 'Неверный JSON'));
      }
    };
    reader.readAsText(file);
    
    // Сброс input для повторного импорта того же файла
    if (importPresetsInputRef.current) {
      importPresetsInputRef.current.value = '';
    }
  };
  
  const getTargetBadgeColor = (target: string) => {
    switch (target) {
      case 'av': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'asr': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'tts': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'translate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'clean': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'chat': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'image': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'summarize': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
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

  // Handle file attachment
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 1MB for text files)
    if (file.size > 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 1MB)');
      return;
    }

    // Check if it's a text-based file
    const textTypes = ['text/', 'application/json', 'application/xml', 'application/javascript'];
    const isTextFile = textTypes.some(type => file.type.startsWith(type)) || 
                       /\.(txt|md|json|xml|csv|js|ts|tsx|py|html|css|yaml|yml|log)$/i.test(file.name);

    if (!isTextFile) {
      toast.error('Поддерживаются только текстовые файлы');
      return;
    }

    try {
      const content = await file.text();
      setAttachedFile(file);
      setFileContent(content);
      toast.success(`Файл ${file.name} прикреплён`);
    } catch {
      toast.error('Не удалось прочитать файл');
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setFileContent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers for media files
  const handleDragOver = useCallback((e: React.DragEvent, setActive: (v: boolean) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, setActive: (v: boolean) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(false);
  }, []);

  const handleDropFile = useCallback((
    e: React.DragEvent, 
    setActive: (v: boolean) => void, 
    setFile: (f: File | null) => void,
    acceptedTypes: string[]
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    const isValidType = acceptedTypes.some(type => 
      file.type.includes(type) || file.name.toLowerCase().endsWith(type)
    );
    
    if (!isValidType) {
      toast.error(`Неподдерживаемый формат. Используйте: ${acceptedTypes.join(', ')}`);
      return;
    }
    
    setFile(file);
    toast.success(`Файл ${file.name} загружен`);
  }, []);

  const handleInputFileChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setProgress?: (p: number) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate progress for large files
      if (setProgress && file.size > 1024 * 1024) { // > 1MB
        setProgress(0);
        const totalSteps = 20;
        let currentStep = 0;
        const interval = setInterval(() => {
          currentStep++;
          setProgress(Math.min((currentStep / totalSteps) * 100, 95));
          if (currentStep >= totalSteps) {
            clearInterval(interval);
            setProgress(100);
            setTimeout(() => setProgress(0), 500);
          }
        }, 50);
      }
      setFile(file);
      toast.success(`Файл ${file.name} загружен`);
    }
  }, []);

  // Parse markdown code blocks for syntax highlighting
  const renderMessageContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <span key={keyIndex++} className="whitespace-pre-wrap">
            {content.slice(lastIndex, match.index)}
          </span>
        );
      }

      const language = match[1] || 'text';
      const code = match[2].trim();

      parts.push(
        <div key={keyIndex++} className="my-2 rounded-md overflow-hidden">
          <div className="flex items-center justify-between bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
            <span>{language}</span>
          </div>
          <SyntaxHighlighter
            language={language}
            style={oneDark}
            customStyle={{ margin: 0, fontSize: '0.75rem', padding: '0.75rem' }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={keyIndex++} className="whitespace-pre-wrap">
          {content.slice(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : <span className="whitespace-pre-wrap">{content}</span>;
  };

  // AI Chat handler with streaming
  const handleSendChat = async () => {
    if ((!chatInput.trim() && !fileContent) || chatLoading) return;

    let messageContent = chatInput.trim();
    if (fileContent) {
      messageContent = `${messageContent}\n\n[Прикреплённый файл: ${attachedFile?.name}]\n\`\`\`\n${fileContent}\n\`\`\``;
    }

    const userMessage: ChatMessage = { role: 'user', content: messageContent };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    removeAttachment();
    setChatLoading(true);
    setStreamingContent('');

    try {
      // Use streaming
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage],
          type: 'chat',
          model: selectedModel,
          stream: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let textBuffer = '';

      // Add empty assistant message for streaming
      setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line-by-line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          const line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              // Update the last assistant message
              setChatMessages(prev => {
                const updated = [...prev];
                if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
                  updated[updated.length - 1] = { role: 'assistant', content: fullContent };
                }
                return updated;
              });
            }
          } catch {
            // Incomplete JSON, continue
          }
        }
      }

      await saveToHistory('chat', { messages: [...chatMessages, userMessage] }, { response: fullContent }, selectedModel, 'completed');
      pushLog('AI Chat (streaming)', { responseLength: fullContent.length });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      toast.error('Ошибка AI: ' + errorMessage);
      pushLog('AI Chat error', undefined, undefined, errorMessage);
      await saveToHistory('chat', { messages: [...chatMessages, userMessage] }, null, null, 'error', errorMessage);
      
      // Remove empty assistant message on error
      setChatMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].role === 'assistant' && prev[prev.length - 1].content === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setChatLoading(false);
      setStreamingContent('');
    }
  };

  // Image generation handler
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || imageLoading) return;

    setImageLoading(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-image', {
        body: { prompt: imagePrompt.trim() }
      });

      if (error) throw error;

      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        await saveToHistory('image', { prompt: imagePrompt }, { imageUrl: data.imageUrl }, data.model, 'completed');
        pushLog('Image generated', { prompt: imagePrompt.substring(0, 50) });
        toast.success('Изображение сгенерировано!');
      } else {
        throw new Error('No image returned');
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      toast.error('Ошибка генерации: ' + errorMessage);
      pushLog('Image generation error', undefined, undefined, errorMessage);
      await saveToHistory('image', { prompt: imagePrompt }, null, null, 'error', errorMessage);
    } finally {
      setImageLoading(false);
    }
  };

  // Summarization handler
  const handleSummarize = async () => {
    if (!summarizeText.trim() || summarizeLoading) return;

    setSummarizeLoading(true);
    setSummarizeResult('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: [{ role: 'user', content: `Пожалуйста, суммаризируй следующий текст:\n\n${summarizeText}` }],
          type: 'summarize'
        }
      });

      if (error) throw error;

      setSummarizeResult(data.content);
      await saveToHistory('summarize', { text: summarizeText }, { summary: data.content }, data.model, 'completed');
      pushLog('Text summarized', { inputLength: summarizeText.length, outputLength: data.content.length });
      toast.success('Текст суммаризирован!');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      toast.error('Ошибка суммаризации: ' + errorMessage);
      pushLog('Summarization error', undefined, undefined, errorMessage);
      await saveToHistory('summarize', { text: summarizeText }, null, null, 'error', errorMessage);
    } finally {
      setSummarizeLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'chat': return 'Чат';
      case 'image': return 'Изображение';
      case 'summarize': return 'Суммаризация';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">Готово</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Ошибка</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">В процессе</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
            <p className="text-sm text-muted-foreground">Единый центр управления AI-сервисами: чат, генерация изображений, перевод, озвучка и обработка видео</p>
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

      <div className="grid lg:grid-cols-2 gap-6">
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
              <TabsList className="grid grid-cols-9 mb-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="chat" className="gap-1 text-xs">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Chat</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Чат с AI-ассистентом</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="image" className="gap-1 text-xs">
                        <Image className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Image</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Генерация изображений по описанию</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="summarize" className="gap-1 text-xs">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Summary</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Суммаризация текста</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="history" className="gap-1 text-xs">
                        <History className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">History</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>История AI-запросов</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="asr" className="gap-1 text-xs">
                        <Mic className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">ASR</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>ASR — Автоматическое распознавание речи (Speech-to-Text)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="translate" className="gap-1 text-xs">
                        <Languages className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">MT</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>MT — Машинный перевод текста (Machine Translation)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="tts" className="gap-1 text-xs">
                        <Volume2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">TTS</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>TTS — Синтез речи из текста (Text-to-Speech)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="av" className="gap-1 text-xs">
                        <Video className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">AV</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>AV — Автодубляж видео (ASR→MT→TTS)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="clean" className="gap-1 text-xs">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Clean</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Clean — Удаление объектов из видео (логотипы, лица, текст)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TabsList>

              {/* AI Chat Tab */}
              <TabsContent value="chat" className="space-y-4">
                <ContextualPresets
                  presets={presets}
                  currentTab={activeTab}
                  onApplyPreset={applyPreset}
                  onDeletePreset={deletePreset}
                  onAddPreset={addPresetForTab}
                  onExport={exportPresets}
                  onImport={importPresets}
                  importInputRef={importPresetsInputRef}
                />
                {/* Model selector */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    <Label className="text-sm whitespace-nowrap">Модель:</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="w-[280px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-[320px]">
                        <SelectItem value="gemini-flash">
                          <div className="flex items-center justify-between w-full gap-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              <span>Gemini Flash</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="text-emerald-500">⚡ Быстрая</span>
                              <span>•</span>
                              <span className="text-blue-400">$ Дешёвая</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="gemini-pro">
                          <div className="flex items-center justify-between w-full gap-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                              <span>Gemini Pro</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="text-yellow-500">🐢 Медленная</span>
                              <span>•</span>
                              <span className="text-orange-400">$$$ Дорогая</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="gemini-lite">
                          <div className="flex items-center justify-between w-full gap-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-cyan-500" />
                              <span>Gemini Lite</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="text-emerald-500">⚡⚡ Очень быстрая</span>
                              <span>•</span>
                              <span className="text-blue-400">$ Самая дешёвая</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="gpt-5">
                          <div className="flex items-center justify-between w-full gap-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>GPT-5</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="text-yellow-500">🐢 Медленная</span>
                              <span>•</span>
                              <span className="text-orange-400">$$$ Самая дорогая</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="gpt-5-mini">
                          <div className="flex items-center justify-between w-full gap-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                              <span>GPT-5 Mini</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="text-emerald-500">⚡ Быстрая</span>
                              <span>•</span>
                              <span className="text-yellow-400">$$ Средняя</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="gpt-5-nano">
                          <div className="flex items-center justify-between w-full gap-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-lime-500" />
                              <span>GPT-5 Nano</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="text-emerald-500">⚡⚡ Очень быстрая</span>
                              <span>•</span>
                              <span className="text-blue-400">$ Дешёвая</span>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedModel.includes('gpt') ? 'OpenAI' : 'Google'}
                    </Badge>
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      (selectedModel === 'gemini-pro' || selectedModel === 'gpt-5') 
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    )}>
                      {(selectedModel === 'gemini-pro' || selectedModel === 'gpt-5') ? 'Pro' : 'Fast'}
                    </Badge>
                  </div>
                </div>

                <div className="border border-border/50 rounded-lg h-[280px] flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    {chatMessages.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Начните диалог с AI ассистентом
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map((msg, idx) => (
                          <div key={idx} className={cn(
                            "flex",
                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                          )}>
                            <div className={cn(
                              "max-w-[85%] p-3 rounded-lg text-sm overflow-hidden",
                              msg.role === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            )}>
                              {msg.content ? (
                                renderMessageContent(msg.content)
                              ) : (
                                chatLoading && idx === chatMessages.length - 1 ? <Loader2 className="h-4 w-4 animate-spin" /> : ''
                              )}
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Attachment preview */}
                  {attachedFile && (
                    <div className="px-3 py-2 border-t border-border/50 bg-muted/30">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="truncate flex-1">{attachedFile.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(attachedFile.size / 1024).toFixed(1)} KB
                        </span>
                        <Button variant="ghost" size="sm" onClick={removeAttachment} className="h-6 w-6 p-0">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="p-3 border-t border-border/50 flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".txt,.md,.json,.xml,.csv,.js,.ts,.tsx,.py,.html,.css,.yaml,.yml,.log"
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={chatLoading}
                      title="Прикрепить файл"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={attachedFile ? "Добавьте комментарий к файлу..." : "Введите сообщение..."}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                      disabled={chatLoading}
                      className="flex-1"
                    />
                    <Button onClick={handleSendChat} disabled={chatLoading || (!chatInput.trim() && !attachedFile)}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setChatMessages([])} className="w-full">
                  Очистить чат
                </Button>
              </TabsContent>

              {/* Image Generation Tab */}
              <TabsContent value="image" className="space-y-4">
                <ContextualPresets
                  presets={presets}
                  currentTab="image"
                  onApplyPreset={applyPreset}
                  onDeletePreset={deletePreset}
                  onAddPreset={addPresetForTab}
                  onExport={exportPresets}
                  onImport={importPresets}
                  importInputRef={importPresetsInputRef}
                />
                <div>
                  <Label>Промпт для генерации</Label>
                  <Textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Опишите изображение, которое хотите сгенерировать..."
                    className="mt-1.5 h-24"
                  />
                </div>
                <Button 
                  onClick={handleGenerateImage} 
                  disabled={imageLoading || !imagePrompt.trim()}
                  className="w-full gap-2"
                >
                  {imageLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
                  {imageLoading ? 'Генерация...' : 'Сгенерировать изображение'}
                </Button>
                {generatedImage && (
                  <div className="border border-border/50 rounded-lg p-4 space-y-3">
                    <img 
                      src={generatedImage} 
                      alt="Generated" 
                      className="w-full max-h-[300px] object-contain rounded-lg"
                    />
                    <Button variant="outline" asChild className="w-full gap-2">
                      <a href={generatedImage} download="generated-image.png">
                        <Download className="h-4 w-4" />
                        Скачать
                      </a>
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Summarization Tab */}
              <TabsContent value="summarize" className="space-y-4">
                <ContextualPresets
                  presets={presets}
                  currentTab="summarize"
                  onApplyPreset={applyPreset}
                  onDeletePreset={deletePreset}
                  onAddPreset={addPresetForTab}
                  onExport={exportPresets}
                  onImport={importPresets}
                  importInputRef={importPresetsInputRef}
                />
                <div>
                  <Label>Текст для суммаризации</Label>
                  <Textarea
                    value={summarizeText}
                    onChange={(e) => setSummarizeText(e.target.value)}
                    placeholder="Вставьте текст, который нужно сократить..."
                    className="mt-1.5 h-32"
                  />
                </div>
                <Button 
                  onClick={handleSummarize} 
                  disabled={summarizeLoading || !summarizeText.trim()}
                  className="w-full gap-2"
                >
                  {summarizeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  {summarizeLoading ? 'Обработка...' : 'Суммаризировать'}
                </Button>
                {summarizeResult && (
                  <div className="border border-border/50 rounded-lg p-4 space-y-2">
                    <Label>Результат:</Label>
                    <div className="bg-muted/50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                      {summarizeResult}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Последние 50 запросов</p>
                  <Button variant="outline" size="sm" onClick={loadHistory} disabled={historyLoading}>
                    <RefreshCw className={cn("h-4 w-4", historyLoading && "animate-spin")} />
                  </Button>
                </div>
                <ScrollArea className="h-[350px]">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : aiHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      История пуста
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {aiHistory.map((item) => (
                        <div 
                          key={item.id}
                          className="p-3 rounded-lg border border-border/50 bg-background/50 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getTargetBadgeColor(item.request_type)}>
                                {getTypeLabel(item.request_type)}
                              </Badge>
                              {getStatusBadge(item.status)}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.created_at).toLocaleString()}
                            </span>
                          </div>
                          {item.model && (
                            <p className="text-xs text-muted-foreground">Model: {item.model}</p>
                          )}
                          {item.error_message && (
                            <p className="text-xs text-destructive">{item.error_message}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="asr" className="space-y-4">
                <ContextualPresets
                  presets={presets}
                  currentTab="asr"
                  onApplyPreset={applyPreset}
                  onDeletePreset={deletePreset}
                  onAddPreset={addPresetForTab}
                  onExport={exportPresets}
                  onImport={importPresets}
                  importInputRef={importPresetsInputRef}
                />
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-sm text-muted-foreground">
                    <strong>ASR (Automatic Speech Recognition)</strong> — автоматическое распознавание речи. Преобразует аудио и видео в текст.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Задача</Label>
                    <Select value={asrTask} onValueChange={setAsrTask}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transcribe">Transcribe (транскрипция)</SelectItem>
                        <SelectItem value="translate">Translate (перевод на EN)</SelectItem>
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
                <input
                  type="file"
                  ref={asrInputRef}
                  className="hidden"
                  accept=".mp3,.wav,.mp4,.webm,audio/*,video/*"
                  onChange={(e) => handleInputFileChange(e, setAsrFile, setAsrUploadProgress)}
                />
                <div 
                  className={cn(
                    "flex flex-col gap-2 p-4 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
                    asrDragActive 
                      ? "border-primary bg-primary/10" 
                      : asrFile 
                        ? "border-emerald-500/50 bg-emerald-500/10" 
                        : "border-border/50 hover:border-primary/50"
                  )}
                  onDragOver={(e) => handleDragOver(e, setAsrDragActive)}
                  onDragLeave={(e) => handleDragLeave(e, setAsrDragActive)}
                  onDrop={(e) => handleDropFile(e, setAsrDragActive, setAsrFile, ['mp3', 'wav', 'mp4', 'webm', 'audio', 'video'])}
                  onClick={() => asrInputRef.current?.click()}
                >
                  <div className="flex items-center gap-3">
                    <FileAudio className={cn("h-8 w-8", asrFile ? "text-emerald-500" : "text-muted-foreground")} />
                    <div className="flex-1">
                      {asrFile ? (
                        <>
                          <p className="text-sm font-medium text-emerald-500">{asrFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(asrFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium">Перетащите файл или нажмите</p>
                          <p className="text-xs text-muted-foreground">MP3, WAV, MP4, WebM</p>
                        </>
                      )}
                    </div>
                    {asrFile ? (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => { e.stopPropagation(); setAsrFile(null); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  {asrUploadProgress > 0 && asrUploadProgress < 100 && (
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-150 ease-out"
                        style={{ width: `${asrUploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
                <Button className="w-full" disabled={!asrFile}>Запустить ASR</Button>
              </TabsContent>

              <TabsContent value="translate" className="space-y-4">
                <ContextualPresets
                  presets={presets}
                  currentTab="translate"
                  onApplyPreset={applyPreset}
                  onDeletePreset={deletePreset}
                  onAddPreset={addPresetForTab}
                  onExport={exportPresets}
                  onImport={importPresets}
                  importInputRef={importPresetsInputRef}
                />
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-sm text-muted-foreground">
                    <strong>MT (Machine Translation)</strong> — машинный перевод текста между языками с сохранением смысла и контекста.
                  </p>
                </div>
                <Textarea
                  value={trText}
                  onChange={(e) => setTrText(e.target.value)}
                  placeholder="Текст для перевода"
                  className="h-24"
                />
                <div className="flex items-end gap-2">
                  <div className="flex-1">
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
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="shrink-0 mb-0"
                    onClick={() => {
                      const temp = trSrc;
                      setTrSrc(trTgt);
                      setTrTgt(temp);
                    }}
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
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
                <ContextualPresets
                  presets={presets}
                  currentTab="tts"
                  onApplyPreset={applyPreset}
                  onDeletePreset={deletePreset}
                  onAddPreset={addPresetForTab}
                  onExport={exportPresets}
                  onImport={importPresets}
                  importInputRef={importPresetsInputRef}
                />
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-sm text-muted-foreground">
                    <strong>TTS (Text-to-Speech)</strong> — синтез речи из текста. Создаёт естественную озвучку с возможностью клонирования голоса.
                  </p>
                </div>
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
                      Speaker WAV (клонирование голоса)
                    </Button>
                  </div>
                </div>
                <Button className="w-full">Синтезировать</Button>
              </TabsContent>

              <TabsContent value="av" className="space-y-4">
                <ContextualPresets
                  presets={presets}
                  currentTab="av"
                  onApplyPreset={applyPreset}
                  onDeletePreset={deletePreset}
                  onAddPreset={addPresetForTab}
                  onExport={exportPresets}
                  onImport={importPresets}
                  importInputRef={importPresetsInputRef}
                />
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-sm text-muted-foreground">
                    <strong>AV (Audio-Video Pipeline)</strong> — полный конвейер автодубляжа: распознавание речи (ASR) → перевод (MT) → синтез голоса (TTS).
                  </p>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label>Исходный язык</Label>
                    <Select value={avSrcLang} onValueChange={setAvSrcLang}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto (автоопределение)</SelectItem>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="shrink-0 mb-0"
                    onClick={() => {
                      if (avSrcLang !== 'auto') {
                        const temp = avSrcLang;
                        setAvSrcLang(avTgtLang);
                        setAvTgtLang(temp);
                      }
                    }}
                    disabled={avSrcLang === 'auto'}
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
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
                <input
                  type="file"
                  ref={avInputRef}
                  className="hidden"
                  accept=".mp4,.webm,.mkv,video/*"
                  onChange={(e) => handleInputFileChange(e, setAvFile, setAvUploadProgress)}
                />
                <div 
                  className={cn(
                    "flex flex-col gap-2 p-4 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
                    avDragActive 
                      ? "border-primary bg-primary/10" 
                      : avFile 
                        ? "border-emerald-500/50 bg-emerald-500/10" 
                        : "border-border/50 hover:border-primary/50"
                  )}
                  onDragOver={(e) => handleDragOver(e, setAvDragActive)}
                  onDragLeave={(e) => handleDragLeave(e, setAvDragActive)}
                  onDrop={(e) => handleDropFile(e, setAvDragActive, setAvFile, ['mp4', 'webm', 'mkv', 'video'])}
                  onClick={() => avInputRef.current?.click()}
                >
                  <div className="flex items-center gap-3">
                    <Video className={cn("h-8 w-8", avFile ? "text-emerald-500" : "text-muted-foreground")} />
                    <div className="flex-1">
                      {avFile ? (
                        <>
                          <p className="text-sm font-medium text-emerald-500">{avFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(avFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium">Перетащите видео или нажмите</p>
                          <p className="text-xs text-muted-foreground">MP4, WebM, MKV</p>
                        </>
                      )}
                    </div>
                    {avFile ? (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => { e.stopPropagation(); setAvFile(null); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  {avUploadProgress > 0 && avUploadProgress < 100 && (
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-150 ease-out"
                        style={{ width: `${avUploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
                <Button className="w-full" disabled={!avFile}>Запустить дубляж</Button>
              </TabsContent>

              <TabsContent value="clean" className="space-y-4">
                <ContextualPresets
                  presets={presets}
                  currentTab="clean"
                  onApplyPreset={applyPreset}
                  onDeletePreset={deletePreset}
                  onAddPreset={addPresetForTab}
                  onExport={exportPresets}
                  onImport={importPresets}
                  importInputRef={importPresetsInputRef}
                />
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-sm text-muted-foreground">
                    <strong>Clean (Video Inpainting)</strong> — удаление нежелательных объектов из видео: логотипы, водяные знаки, лица, текст с восстановлением фона.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Метод</Label>
                    <Select value={cleanMethod} onValueChange={setCleanMethod}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="propainter">ProPainter (точный, медленный)</SelectItem>
                        <SelectItem value="lama">LaMa (быстрый)</SelectItem>
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
                <input
                  type="file"
                  ref={cleanInputRef}
                  className="hidden"
                  accept=".mp4,.webm,video/*"
                  onChange={(e) => handleInputFileChange(e, setCleanFile, setCleanUploadProgress)}
                />
                <div 
                  className={cn(
                    "flex flex-col gap-2 p-4 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
                    cleanDragActive 
                      ? "border-primary bg-primary/10" 
                      : cleanFile 
                        ? "border-emerald-500/50 bg-emerald-500/10" 
                        : "border-border/50 hover:border-primary/50"
                  )}
                  onDragOver={(e) => handleDragOver(e, setCleanDragActive)}
                  onDragLeave={(e) => handleDragLeave(e, setCleanDragActive)}
                  onDrop={(e) => handleDropFile(e, setCleanDragActive, setCleanFile, ['mp4', 'webm', 'video'])}
                  onClick={() => cleanInputRef.current?.click()}
                >
                  <div className="flex items-center gap-3">
                    <Video className={cn("h-8 w-8", cleanFile ? "text-emerald-500" : "text-muted-foreground")} />
                    <div className="flex-1">
                      {cleanFile ? (
                        <>
                          <p className="text-sm font-medium text-emerald-500">{cleanFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(cleanFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium">Перетащите видео или нажмите</p>
                          <p className="text-xs text-muted-foreground">MP4, WebM</p>
                        </>
                      )}
                    </div>
                    {cleanFile ? (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => { e.stopPropagation(); setCleanFile(null); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  {cleanUploadProgress > 0 && cleanUploadProgress < 100 && (
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-150 ease-out"
                        style={{ width: `${cleanUploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
                <Button className="w-full" disabled={!cleanFile}>Запустить очистку</Button>
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
