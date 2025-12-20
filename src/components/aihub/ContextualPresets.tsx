import React from 'react';
import { Play, Trash2, Plus, Download, Upload, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

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
  const [newPresetJSON, setNewPresetJSON] = React.useState('{}');

  // Фильтруем пресеты для текущей вкладки
  const filteredPresets = presets.filter(p => p.target === currentTab);

  const handleAddPreset = () => {
    try {
      const payload = JSON.parse(newPresetJSON);
      onAddPreset(newPresetName || `Пресет ${currentTab}`, payload);
      setNewPresetName('');
      setNewPresetJSON('{}');
    } catch {
      // Invalid JSON
    }
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
          <span className="text-xs text-muted-foreground">
            {isOpen ? '▲' : '▼'}
          </span>
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-3 space-y-3">
        {/* Существующие пресеты */}
        {filteredPresets.length > 0 ? (
          <div className="space-y-2">
            {filteredPresets.map((preset) => (
              <div 
                key={preset.id} 
                className="p-2.5 rounded-lg border border-border/50 bg-background/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{preset.name}</span>
                  <div className="flex gap-1.5">
                    <Button 
                      size="sm" 
                      variant="default" 
                      className="h-7 gap-1 text-xs px-2"
                      onClick={() => onApplyPreset(preset)}
                    >
                      <Play className="h-3 w-3" />
                      Применить
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="h-7 w-7 p-0"
                      onClick={() => onDeletePreset(preset.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {preset.description && (
                  <p className="text-xs text-muted-foreground">{preset.description}</p>
                )}
                <details className="text-xs">
                  <summary className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    Параметры
                  </summary>
                  <pre className="mt-1.5 bg-muted/50 p-2 rounded border border-border/30 overflow-x-auto text-xs">
                    {JSON.stringify(preset.payload, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            Нет сохранённых пресетов для этой вкладки
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
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Параметры (JSON)
            </Label>
            <Textarea
              value={newPresetJSON}
              onChange={(e) => setNewPresetJSON(e.target.value)}
              placeholder='{"key": "value"}'
              className="font-mono text-xs h-16"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddPreset} size="sm" className="flex-1 gap-1.5 h-8">
              <Plus className="h-3 w-3" />
              Сохранить
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1 h-8"
              onClick={onExport}
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
