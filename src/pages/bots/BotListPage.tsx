import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Play, Square, RotateCw, Settings, Trash2, HardDrive, Database, Brain, Film } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import AddBotDialog from "@/components/bots/AddBotDialog";
import { useLanguage } from '@/contexts/LanguageContext';
import { useBots } from '@/contexts/BotContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const BotListPage = () => {
    const { t } = useLanguage();
    const { bots, addBot, deleteBot, toggleBotStatus } = useBots();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const navigate = useNavigate();

    const handleAction = (action: string, botName: string) => {
        toast.success(`${action} initiated for ${botName}`);
    };

    const handleToggleStatus = (id: number) => {
        toggleBotStatus(id);
    };

    const handleDeleteBot = (id: number) => {
        deleteBot(id);
    };

    const formatSize = (mb: number) => {
        if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
        return `${mb} MB`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('myBots')}</h1>
                    <p className="text-muted-foreground">{t('manageBot')}</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> {t('connectBot')}
                </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {bots.map((bot) => {
                    const storagePercent = (bot.storageUsed / bot.storageTotal) * 100;
                    
                    return (
                        <Card key={bot.id} className="group hover:border-primary/50 transition-all duration-300">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <CardTitle className="text-lg font-bold truncate max-w-[180px]" title={bot.name}>
                                            {bot.name}
                                        </CardTitle>
                                        <Badge variant={bot.status === 'active' ? 'default' : 'destructive'} className="shrink-0">
                                            {bot.status === 'active' ? t('running') : t('stopped')}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground font-mono">
                                        {bot.username}
                                    </p>
                                </div>
                                
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>{t('deleteBotTitle')}</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {t('deleteBotDesc')}
                                                <ul className="list-disc list-inside mt-2 space-y-1 font-mono text-xs">
                                                    <li>Volume: /media/bot_volumes/bot_{bot.id}</li>
                                                    <li>Database: bot_{bot.id}_db</li>
                                                    <li>All logs and configuration files</li>
                                                </ul>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                            <AlertDialogAction 
                                                className="bg-destructive hover:bg-destructive/90"
                                                onClick={() => handleDeleteBot(bot.id)}
                                            >
                                                {t('deleteEverything')}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardHeader>
                            
                            <CardContent className="space-y-6">
                                {/* Resources Info */}
                                <div className="space-y-3 p-3 bg-muted/40 rounded-lg border border-border/50">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                                <HardDrive className="h-3 w-3" /> {t('storageUsed')}
                                            </span>
                                            <span className="font-medium">
                                                {formatSize(bot.storageUsed)} / {formatSize(bot.storageTotal)}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 transition-all duration-500 ease-out"
                                                style={{ width: `${storagePercent}%` }}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 flex-wrap text-xs border-t border-border/50 pt-2 mt-2">
                                        {/* Database Badge */}
                                        <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-emerald-500/30 text-emerald-500 bg-emerald-500/5 gap-1">
                                            <Database className="h-2 w-2" /> bot_{bot.id}_db
                                        </Badge>
                                        
                                        {/* Connected Services Badges */}
                                        {bot.services?.filter(s => s.type !== 'db').map(service => (
                                            <Tooltip key={service.id}>
                                                <TooltipTrigger>
                                                    <Badge variant="outline" className={`text-[10px] h-4 px-1 py-0 gap-1 cursor-help ${
                                                        service.type === 'ai' ? 'border-purple-500/30 text-purple-500 bg-purple-500/5' :
                                                        service.type === 'video' ? 'border-pink-500/30 text-pink-500 bg-pink-500/5' :
                                                        'border-blue-500/30 text-blue-500 bg-blue-500/5'
                                                    }`}>
                                                        {service.type === 'ai' && <Brain className="h-2 w-2" />}
                                                        {service.type === 'video' && <Film className="h-2 w-2" />}
                                                        {service.type === 'other' && <Settings className="h-2 w-2" />}
                                                        {service.id.toUpperCase()}
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Linked: {service.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">Env injected automatically</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ))}
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-1 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 h-8"
                                        onClick={() => handleToggleStatus(bot.id)}
                                        disabled={bot.status === 'active'}
                                    >
                                        <Play className="h-3.5 w-3.5 mr-1.5" /> {t('start')}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-1 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 h-8"
                                        onClick={() => handleAction('Restart', bot.name)}
                                    >
                                        <RotateCw className="h-3.5 w-3.5 mr-1.5" /> {t('restart')}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                                        onClick={() => handleToggleStatus(bot.id)}
                                        disabled={bot.status !== 'active'}
                                    >
                                        <Square className="h-3.5 w-3.5 mr-1.5" /> {t('stop')}
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t text-sm">
                                    <div className="font-medium flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        {bot.users} {t('activeUsers')}
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-7" onClick={() => navigate(`/bots/${bot.id}`)}>
                                        <Settings className="h-3.5 w-3.5 mr-1" /> {t('config')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <AddBotDialog 
                open={isAddOpen} 
                onOpenChange={setIsAddOpen} 
                onAddBot={addBot} 
            />
        </div>
    );
};

export default BotListPage;
