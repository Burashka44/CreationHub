import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Play, Square, RotateCw, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const BotListPage = () => {
    // Placeholder data with mutable state simulation would need real backend integration
    // For now, illustrating the UI structure requested
    const bots = [
        { id: 1, name: "CreationHub Helper", username: "@creationhub_helper_bot", status: "active", users: 540 },
        { id: 2, name: "Support Bot", username: "@creationhub_support_bot", status: "active", users: 120 },
        { id: 3, name: "Dev Test Bot", username: "@creationhub_test_bot", status: "stopped", users: 5 },
    ];

    const handleAction = (action: string, botName: string) => {
        toast.success(`${action} initiated for ${botName}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">My Bots</h1>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Connect New Bot
                </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {bots.map((bot) => (
                    <Card key={bot.id} className="hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-bold">
                                {bot.name}
                            </CardTitle>
                            <Badge variant={bot.status === 'active' ? 'default' : 'destructive'}>
                                {bot.status === 'active' ? 'Running' : 'Stopped'}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                {bot.username}
                            </p>
                            
                            <div className="flex items-center gap-2 mb-4">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                    onClick={() => handleAction('Start', bot.name)}
                                    disabled={bot.status === 'active'}
                                >
                                    <Play className="h-4 w-4 mr-1" /> Start
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                                    onClick={() => handleAction('Restart', bot.name)}
                                >
                                    <RotateCw className="h-4 w-4 mr-1" /> Restart
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleAction('Stop', bot.name)}
                                    disabled={bot.status !== 'active'}
                                >
                                    <Square className="h-4 w-4 mr-1" /> Stop
                                </Button>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t text-sm">
                                <div className="font-medium">
                                    {bot.users} <span className="text-muted-foreground font-normal">users</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleAction('Config', bot.name)}>
                                    <Settings className="h-4 w-4 mr-1" /> Config
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default BotListPage;
