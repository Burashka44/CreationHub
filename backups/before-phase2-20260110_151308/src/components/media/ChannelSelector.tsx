import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface MediaChannel {
    id: string;
    name: string;
    platform: string;
    subscribers: number;
    channel_url: string | null;
    username: string | null;
}

interface ChannelSelectorProps {
    channels: MediaChannel[];
    selectedChannelId: string | null;
    onSelectChannel: (id: string | null) => void;
    onAddChannel: () => void;
}

export function ChannelSelector({
    channels,
    selectedChannelId,
    onSelectChannel,
    onAddChannel
}: ChannelSelectorProps) {

    const getPlatformColor = (platform: string) => {
        switch (platform) {
            case 'youtube': return 'border-red-500/50 hover:bg-red-500/10';
            case 'telegram': return 'border-sky-500/50 hover:bg-sky-500/10';
            case 'vk_video': return 'border-blue-500/50 hover:bg-blue-500/10';
            default: return 'border-border hover:bg-accent';
        }
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'youtube': return 'text-red-500';
            case 'telegram': return 'text-sky-500';
            case 'vk_video': return 'text-blue-500';
            default: return 'text-muted-foreground';
        }
    };

    return (
        <div className="relative mb-6">
            <ScrollArea className="w-full whitespace-nowrap rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
                <div className="flex w-max space-x-4">
                    <Button
                        variant="outline"
                        className={cn(
                            "h-24 w-24 flex-col gap-2 rounded-xl border-2 transition-all",
                            selectedChannelId === null
                                ? "border-primary bg-primary/10 hover:bg-primary/20"
                                : "border-border hover:bg-accent"
                        )}
                        onClick={() => onSelectChannel(null)}
                    >
                        <span className="text-2xl font-bold">ALL</span>
                        <span className="text-xs text-muted-foreground">Обзор</span>
                    </Button>

                    {channels.map((channel) => (
                        <div key={channel.id} className="relative group">
                            <Button
                                variant="outline"
                                className={cn(
                                    "h-24 w-24 flex-col gap-2 rounded-xl border-2 p-2 transition-all overflow-hidden",
                                    selectedChannelId === channel.id
                                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                        : getPlatformColor(channel.platform)
                                )}
                                onClick={() => onSelectChannel(channel.id)}
                            >
                                <div className={cn("text-xs font-bold uppercase tracking-wider", getPlatformIcon(channel.platform))}>
                                    {channel.platform}
                                </div>
                                <div className="font-semibold truncate w-full text-center text-sm" title={channel.name}>
                                    {channel.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {(channel.subscribers / 1000).toFixed(1)}k
                                </div>
                            </Button>
                            {['youtube', 'telegram'].includes(channel.platform) && (
                                <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                    ✓
                                </Badge>
                            )}
                        </div>
                    ))}

                    <Button
                        variant="ghost"
                        className="h-24 w-24 flex-col gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5"
                        onClick={onAddChannel}
                    >
                        <Plus className="h-8 w-8 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Добавить</span>
                    </Button>
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
