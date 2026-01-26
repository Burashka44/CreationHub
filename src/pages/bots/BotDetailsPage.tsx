import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBots, LogEntry } from '@/contexts/BotContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Square, RotateCcw, Activity, Server, Shield, Globe } from "lucide-react";
import BotLogsViewer from '@/components/bots/BotLogsViewer';
import BotEnvEditor from '@/components/bots/BotEnvEditor';
import { toast } from 'sonner';
import { fetchContainerStats, ContainerStats } from '@/lib/cadvisor';

const BotDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { bots, toggleBotStatus, clearLogs, addLog, updateEnv } = useBots();
    const { t } = useLanguage();
    
    console.log('BotDetailsPage - ID from params:', id);
    console.log('BotDetailsPage - Available bots:', bots);
    
    const bot = useMemo(() => {
        const found = bots.find(b => b.id === Number(id));
        console.log('BotDetailsPage - Found bot:', found);
        return found;
    }, [bots, id]);
    
    const [stats, setStats] = useState<ContainerStats | null>(null);
    const [useMockStats, setUseMockStats] = useState(false);

    // Fetch real container stats from cAdvisor
    useEffect(() => {
        if (!bot || bot.status !== 'active') {
            setStats(null);
            setUseMockStats(false);
            return;
        }

        let mounted = true;
        let failureCount = 0;
        const containerName = `bot_${bot.id}`;

        const fetchStats = async () => {
            try {
                const data = await fetchContainerStats(containerName);
                if (mounted && data) {
                    setStats(data);
                    setUseMockStats(false);
                    failureCount = 0;
                } else if (mounted) {
                    failureCount++;
                    // After 3 failed attempts (6 seconds), use mock data
                    if (failureCount >= 3) {
                        setUseMockStats(true);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
                if (mounted) {
                    failureCount++;
                    if (failureCount >= 3) {
                        setUseMockStats(true);
                    }
                }
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 2000);
        
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [bot?.id, bot?.status]);

    // Mock Log Streamer
    useEffect(() => {
        if (!bot || bot.status !== 'active') return;

        const interval = setInterval(() => {
            const msgs = [
                "Processing update ID 83921...",
                "Webhook verified",
                "Database query execution: 12ms",
                "User interaction: /start command",
                "Memory GC complete"
            ];
            const type: LogEntry['level'] = Math.random() > 0.9 ? 'warn' : 'info';
            addLog(bot.id, type, msgs[Math.floor(Math.random() * msgs.length)]);
        }, 3000);

        return () => clearInterval(interval);
    }, [bot?.id, bot?.status, addLog]);

    if (!bot) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <h2 className="text-xl font-bold">Bot Not Found</h2>
                <Button onClick={() => navigate('/bots/list')}>Return to List</Button>
            </div>
        );
    }

    const handleStatusToggle = () => {
        toggleBotStatus(bot.id);
        if (bot.status === 'stopped') {
            addLog(bot.id, 'info', 'System: Starting container...');
        } else {
            addLog(bot.id, 'warn', 'System: Stopping container...');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/bots/list')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            {bot.name}
                            <Badge variant={bot.status === 'active' ? 'default' : 'secondary'} className={bot.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                                {bot.status === 'active' ? t('running') : t('stopped')}
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground">{bot.username} • {bot.token.substring(0, 15)}...</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleStatusToggle}>
                        {bot.status === 'active' ? <RotateCcw className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                        {t('restart')}
                    </Button>
                    <Button 
                        variant={bot.status === 'active' ? "destructive" : "default"} 
                        onClick={handleStatusToggle}
                    >
                        {bot.status === 'active' ? (
                            <><Square className="mr-2 h-4 w-4 fill-current" /> {t('stop')}</>
                        ) : (
                            <><Play className="mr-2 h-4 w-4 fill-current" /> {t('start')}</>
                        )}
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="logs" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                    <TabsTrigger value="env">Environment</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                
                {/* Overview Content */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats ? `${stats.cpu_percent.toFixed(1)}%` : 
                                     useMockStats ? '2.4%' : 
                                     (bot.status === 'active' ? 'Loading...' : '0%')}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {stats ? 'Real-time from cAdvisor' : useMockStats ? 'Simulated (cAdvisor unavailable)' : 'Waiting for data...'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Memory</CardTitle>
                                <Server className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats ? `${stats.memory_usage_mb.toFixed(0)} MB` : 
                                     useMockStats ? '128 MB' : 
                                     (bot.status === 'active' ? 'Loading...' : '0 MB')}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {stats ? `/ ${stats.memory_limit_mb.toFixed(0)} MB Limit` : 
                                     useMockStats ? '/ 512 MB Limit (Simulated)' : 
                                     'Waiting for data...'}
                                </p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                                <Globe className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{bot.storageUsed} MB</div>
                                <p className="text-xs text-muted-foreground">/ {bot.storageTotal} MB Persisted</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Network</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm font-bold">
                                    ↓ {stats ? `${(stats.network_rx_bytes / 1024 / 1024).toFixed(2)} MB` : '0 MB'}
                                </div>
                                <div className="text-sm font-bold">
                                    ↑ {stats ? `${(stats.network_tx_bytes / 1024 / 1024).toFixed(2)} MB` : '0 MB'}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Logs Content */}
                <TabsContent value="logs" className="mt-4">
                    <BotLogsViewer 
                        logs={bot.logs || []} 
                        onClear={() => clearLogs(bot.id)} 
                    />
                </TabsContent>

                {/* Env Content */}
                <TabsContent value="env" className="mt-4">
                    <BotEnvEditor 
                        initialEnv={bot.env || {}} 
                        onSave={(env) => updateEnv(bot.id, env)} 
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default BotDetailsPage;
