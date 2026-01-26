import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Save, Plus, Trash2, Key } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

interface BotEnvEditorProps {
    initialEnv: Record<string, string>;
    onSave: (env: Record<string, string>) => void;
}

const BotEnvEditor = ({ initialEnv, onSave }: BotEnvEditorProps) => {
    const { t } = useLanguage();
    const [envVars, setEnvVars] = useState<Array<{ key: string, value: string }>>(
        Object.entries(initialEnv).map(([key, value]) => ({ key, value }))
    );
    const [showValues, setShowValues] = useState<Record<number, boolean>>({});

    const handleAdd = () => {
        setEnvVars([...envVars, { key: '', value: '' }]);
    };

    const handleRemove = (index: number) => {
        setEnvVars(envVars.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: 'key' | 'value', value: string) => {
        const newVars = [...envVars];
        newVars[index][field] = value;
        setEnvVars(newVars);
    };

    const toggleShow = (index: number) => {
        setShowValues(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const handleSave = () => {
        const envMap: Record<string, string> = {};
        envVars.forEach(v => {
            if (v.key) envMap[v.key] = v.value;
        });
        onSave(envMap);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-purple-500" />
                    Environment Variables
                </CardTitle>
                <CardDescription>
                    Manage secure environment variables for your bot container.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {envVars.map((v, i) => (
                    <div key={i} className="flex items-start gap-4">
                        <div className="grid gap-1.5 flex-1">
                            <Label className="text-xs text-muted-foreground">Key</Label>
                            <Input 
                                placeholder="API_KEY"
                                value={v.key}
                                onChange={(e) => handleChange(i, 'key', e.target.value)}
                                className="font-mono bg-muted/50"
                            />
                        </div>
                        <div className="grid gap-1.5 flex-[2]">
                            <Label className="text-xs text-muted-foreground">Value</Label>
                            <div className="relative">
                                <Input 
                                    type={showValues[i] ? "text" : "password"}
                                    placeholder="Value"
                                    value={v.value}
                                    onChange={(e) => handleChange(i, 'value', e.target.value)}
                                    className="pr-10 font-mono bg-muted/50"
                                />
                                <button 
                                    onClick={() => toggleShow(i)}
                                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showValues[i] ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="mt-6 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemove(i)}
                        >
                            <Trash2 size={18} />
                        </Button>
                    </div>
                ))}

                <div className="flex items-center justify-between pt-4">
                    <Button variant="outline" onClick={handleAdd} className="gap-2">
                        <Plus size={16} />
                        Add Variable
                    </Button>
                    <Button onClick={handleSave} className="gap-2">
                        <Save size={16} />
                        Save Changes
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default BotEnvEditor;
