import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HardDrive, Bot, GitBranch, UploadCloud, File } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface AddBotDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddBot: (token: string, storageSize: number, gitUrl?: string, zipFile?: File) => void;
}

const AddBotDialog = ({ open, onOpenChange, onAddBot }: AddBotDialogProps) => {
    const { t } = useLanguage();
    const [token, setToken] = useState('');
    const [gitUrl, setGitUrl] = useState('');
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [sourceType, setSourceType] = useState('git');
    const [storageSize, setStorageSize] = useState([500]); // Default 500MB
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        if (!token) {
            toast.error(t('tokenHint'));
            return;
        }

        if (sourceType === 'git' && !gitUrl) {
            toast.error(t('gitUrlError'));
            return;
        }

        if (sourceType === 'zip' && !zipFile) {
            toast.error(t('zipError'));
            return;
        }

        setIsLoading(true);
        // Simulate API delay
        setTimeout(() => {
            onAddBot(token, storageSize[0], gitUrl, zipFile || undefined);
            setIsLoading(false);
            onOpenChange(false);
            // Reset form
            setToken('');
            setGitUrl('');
            setZipFile(null);
            setStorageSize([500]);
            toast.success("Bot created successfully with deployed code");
        }, 1500);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setZipFile(e.target.files[0]);
        }
    };

    const formatSize = (mb: number) => {
        if (mb >= 1024) {
            return `${(mb / 1024).toFixed(1)} GB`;
        }
        return `${mb} MB`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t('connectBot')}</DialogTitle>
                    <DialogDescription>
                        {t('volumeDesc')}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Token Input */}
                    <div className="space-y-2">
                        <Label htmlFor="token">{t('botToken')}</Label>
                        <div className="relative">
                            <Bot className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="token"
                                placeholder="123456789:ABCdefGHIjklMNOpqrs..."
                                className="pl-9"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Source Selection */}
                    <div className="space-y-2">
                        <Label>{t('sourceType')}</Label>
                        <Tabs defaultValue="git" className="w-full" onValueChange={setSourceType}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="git">{t('gitRepo')}</TabsTrigger>
                                <TabsTrigger value="zip">{t('uploadZip')}</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="git" className="pt-2">
                                <div className="relative">
                                    <GitBranch className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="https://github.com/user/my-bot.git"
                                        className="pl-9"
                                        value={gitUrl}
                                        onChange={(e) => setGitUrl(e.target.value)}
                                    />
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="zip" className="pt-2">
                                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                                    <input 
                                        type="file" 
                                        accept=".zip,.tar.gz" 
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                    />
                                    {zipFile ? (
                                        <>
                                            <File className="h-8 w-8 text-primary mb-2" />
                                            <p className="text-sm font-medium">{zipFile.name}</p>
                                            <p className="text-xs text-muted-foreground">{(zipFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">{t('uploadDesc')}</p>
                                            <p className="text-xs text-primary mt-1 font-medium">{t('selectFile')}</p>
                                        </>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Storage Slider */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>{t('storageQuota')}</Label>
                            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 border border-blue-500/20 px-3 py-1 rounded-md shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                                {formatSize(storageSize[0])}
                            </span>
                        </div>
                        
                        <div className="relative py-4 pb-8">
                            {/* Custom Gradient Slider Wrapper */}
                            <Slider
                                value={storageSize}
                                onValueChange={setStorageSize}
                                max={5120} // 5GB in MB
                                min={100}
                                step={100}
                                className="[&>.relative>.absolute]:bg-gradient-to-r [&>.relative>.absolute]:from-emerald-500 [&>.relative>.absolute]:to-blue-600 [&_span:focus-visible]:ring-blue-400 z-10"
                            />
                            {/* Ruler Scale */}
                            <div className="absolute bottom-0 left-0 right-0 h-4 flex justify-between px-1.5 pointer-events-none">
                                {[0.1, 1, 2, 3, 4, 5].map((val) => (
                                    <div key={val} className="flex flex-col items-center gap-1">
                                        <div className="w-0.5 h-2 bg-muted-foreground/30" />
                                        <span className="text-[10px] text-muted-foreground font-mono">{val}G</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="rounded-lg bg-muted p-3 text-sm flex gap-3">
                            <HardDrive className="h-5 w-5 text-blue-500 shrink-0" />
                            <div className="space-y-1">
                                <p className="font-medium">{t('dedicatedVolume')}</p>
                                <p className="text-muted-foreground text-xs">
                                    /media/bot_volumes/{token ? `bot_${token.substring(0, 8)}` : '...'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleCreate} disabled={isLoading}>
                        {isLoading ? (
                            <>{t('creating')}</>
                        ) : (
                            <>{t('createBot')}</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AddBotDialog;
