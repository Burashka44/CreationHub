import React from 'react';
import { Play, Trash2, Plus, Download, Upload, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Preset {
  id: string;
  name: string;
  target: string;
  payload: Record<string, string>;
  description?: string;
}

interface ContextualPresetsProps {
  presets: Preset[];
  currentTab: string;
  onApplyPreset: (preset: Preset) => void;
  onDeletePreset: (id: string) => void;
  onAddPreset: (name: string, payload: Record<string, string>) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  importInputRef: React.RefObject<HTMLInputElement>;
}

// Конфигурация полей для каждого типа вкладки
const tabFieldConfigs: Record<string, { key: string; label: string; type: 'text' | 'select' | 'textarea'; options?: { value: string; label: string }[]; placeholder?: string }[]> = {
  chat: [
    { key: 'system_prompt', label: 'Роль/Системный промпт', type: 'textarea', placeholder: 'Опишите роль AI-ассистента...' },
  ],
  image: [
    { key: 'style', label: 'Стиль изображения', type: 'textarea', placeholder: 'photorealistic, anime, illustration...' },
  ],
  asr: [
    {
      key: 'task', label: 'Задача', type: 'select', options: [
        { value: 'transcribe', label: 'Транскрибация' },
        { value: 'translate', label: 'Перевод' },
      ]
    },
    {
      key: 'language', label: 'Язык', type: 'select', options: [
        { value: 'auto', label: 'Авто' },
        { value: 'ru', label: 'Русский' },
        { value: 'en', label: 'Английский' },
        { value: 'de', label: 'Немецкий' },
        { value: 'fr', label: 'Французский' },
        { value: 'es', label: 'Испанский' },
        { value: 'zh', label: 'Китайский' },
      ]
    },
  ],
  translate: [
    {
      key: 'src_lang', label: 'Исходный язык', type: 'select', options: [
        { value: 'auto', label: 'Авто' },
        { value: 'ru', label: 'Русский' },
        { value: 'en', label: 'Английский' },
        { value: 'de', label: 'Немецкий' },
        { value: 'fr', label: 'Французский' },
      ]
    },
    {
      key: 'tgt_lang', label: 'Целевой язык', type: 'select', options: [
        { value: 'ru', label: 'Русский' },
        { value: 'en', label: 'Английский' },
        { value: 'de', label: 'Немецкий' },
        { value: 'fr', label: 'Французский' },
      ]
    },
  ],
  tts: [
    {
      key: 'language', label: 'Язык', type: 'select', options: [
        { value: 'ru', label: 'Русский' },
        { value: 'en', label: 'Английский' },
        { value: 'de', label: 'Немецкий' },
        { value: 'fr', label: 'Французский' },
      ]
    },
    {
      key: 'voice', label: 'Голос', type: 'select', options: [
        { value: 'default', label: 'По умолчанию' },
        { value: 'male', label: 'Мужской' },
        { value: 'female', label: 'Женский' },
      ]
    },
  ],
  av: [
    {
      key: 'src_lang', label: 'Исходный язык', type: 'select', options: [
        { value: 'auto', label: 'Авто' },
        { value: 'ru', label: 'Русский' },
        { value: 'en', label: 'Английский' },
      ]
    },
    {
      key: 'tgt_lang', label: 'Целевой язык', type: 'select', options: [
        { value: 'ru', label: 'Русский' },
        { value: 'en', label: 'Английский' },
        { value: 'de', label: 'Немецкий' },
        { value: 'fr', label: 'Французский' },
        { value: 'es', label: 'Испанский' },
        { value: 'zh', label: 'Китайский' },
      ]
    },
  ],
  clean: [
    {
      key: 'method', label: 'Метод', type: 'select', options: [
        { value: 'propainter', label: 'ProPainter (рекомендуется)' },
        { value: 'deepfill', label: 'DeepFill v2' },
        { value: 'lama', label: 'LaMa' },
      ]
    },
    { key: 'objects', label: 'Объекты для удаления', type: 'text', placeholder: 'logo, face, watermark' },
  ],
  summarize: [
    {
      key: 'length', label: 'Длина резюме', type: 'select', options: [
        { value: 'short', label: 'Короткое (1-2 предложения)' },
        { value: 'medium', label: 'Среднее (абзац)' },
        { value: 'long', label: 'Подробное' },
      ]
    },
  ],
};

const ContextualPresets: React.FC<ContextualPresetsProps> = ({
  presets,
  currentTab,
  onApplyPreset,
  onDeletePreset,
  onAddPreset,
  onExport,
  onImport,
  importInputRef,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [newPresetName, setNewPresetName] = React.useState('');
  const [fieldValues, setFieldValues] = React.useState<Record<string, string>>({});

  // Фильтруем пресеты для текущей вкладки
  const filteredPresets = presets.filter(p => p.target === currentTab);
  const fieldConfig = tabFieldConfigs[currentTab] || [];

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [key]: value }));
  };

  const handleAddPreset = () => {
    if (!newPresetName.trim()) return;

    // Собираем payload из полей
    const payload: Record<string, string> = {};
    fieldConfig.forEach(field => {
      if (fieldValues[field.key]) {
        payload[field.key] = fieldValues[field.key];
      }
    });

    if (Object.keys(payload).length === 0) return;

    onAddPreset(newPresetName, payload);
    setNewPresetName('');
    setFieldValues({});
  };

  const getTabName = (tab: string): string => {
    switch (tab) {
      case 'av': return 'Дубляж';
      case 'asr': return 'Распознавание';
      case 'tts': return 'Озвучка';
      case 'translate': return 'Перевод';
      case 'clean': return 'Очистка';
      case 'chat': return 'Чат';
      case 'image': return 'Картинки';
      case 'summarize': return 'Резюме';
      default: return tab;
    }
  };

  const formatPayloadValue = (key: string, value: string): string => {
    // Находим конфиг для ключа и возвращаем понятное название
    const config = fieldConfig.find(f => f.key === key);
    if (config?.options) {
      const option = config.options.find(o => o.value === value);
      return option?.label || value;
    }
    return value;
  };

  // Не показываем для history вкладки
  if (currentTab === 'history') return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4">
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-between gap-2">
          <span className="flex items-center gap-2">
            <Settings className="h-3.5 w-3.5" />
            Пресеты для {getTabName(currentTab)}
            {filteredPresets.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filteredPresets.length}
              </Badge>
            )}
          </span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3 space-y-3">
        {/* Существующие пресеты */}
        {filteredPresets.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {filteredPresets.map((preset) => (
              <div
                key={preset.id}
                className="p-2.5 rounded-lg border border-border/50 bg-background/50 space-y-1.5 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm block truncate">{preset.name}</span>
                    {preset.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{preset.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 gap-1 text-xs px-2 hover:scale-105 transition-transform"
                      onClick={() => onApplyPreset(preset)}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => onDeletePreset(preset.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {/* Показываем параметры в читаемом виде */}
                <div className="flex flex-wrap gap-1">
                  {Object.entries(preset.payload).map(([key, value]) => (
                    <Badge key={key} variant="outline" className="text-xs font-normal">
                      {formatPayloadValue(key, value).slice(0, 20)}{value.length > 20 ? '...' : ''}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            Нет сохранённых пресетов
          </p>
        )}

        {/* Добавление нового пресета */}
        <div className="border-t border-border/30 pt-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Создать пресет</p>
          <Input
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Название пресета"
            className="h-8 text-sm"
          />

          {/* Динамические поля для текущей вкладки */}
          {fieldConfig.map(field => (
            <div key={field.key}>
              <Label className="text-xs text-muted-foreground mb-1 block">{field.label}</Label>
              {field.type === 'select' && field.options ? (
                <Select
                  value={fieldValues[field.key] || ''}
                  onValueChange={(v) => handleFieldChange(field.key, v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Выберите..." />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'textarea' ? (
                <Textarea
                  value={fieldValues[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="text-sm h-16"
                />
              ) : (
                <Input
                  value={fieldValues[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="h-8 text-sm"
                />
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <Button
              onClick={handleAddPreset}
              size="sm"
              className="flex-1 gap-1.5 h-8"
              disabled={!newPresetName.trim() || Object.keys(fieldValues).length === 0}
            >
              <Plus className="h-3 w-3" />
              Сохранить
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 h-8"
              onClick={onExport}
              title="Экспорт пресетов"
            >
              <Download className="h-3 w-3" />
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              onChange={onImport}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-1 h-8"
              onClick={() => importInputRef.current?.click()}
              title="Импорт пресетов"
            >
              <Upload className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ContextualPresets;
