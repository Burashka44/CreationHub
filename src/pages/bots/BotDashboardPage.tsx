import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Megaphone, Activity, Bot, HardDrive, Database } from "lucide-react";
import { useBots } from '@/contexts/BotContext';
import { useLanguage } from '@/contexts/LanguageContext';

const BotDashboardPage = () => {
    const { bots, stats } = useBots();
    const { t } = useLanguage();

    const statCards = [
        { title: t('totalBots'), value: stats.totalBots, icon: Bot, change: `${stats.activeBots} ${t('active')}`, desc: t('deployedInstances') },
        { title: t('totalUsers'), value: stats.totalUsers, icon: Users, change: "+12%", desc: t('acrossAllBots') },
        { 
            title: t('globalStorageUsage'), 
            value: `${(stats.usedStorage / 1024).toFixed(2)} GB`, 
            icon: HardDrive, 
            change: `/ 50 GB ${t('limit')}`, 
            desc: t('totalPhysicalSpaceOccupied') 
        },
        { title: t('messagesToday'), value: "8,920", icon: Activity, change: "+15%", desc: t('volumeVsYesterday') },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{t('botStudioOverview')}</h1>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.change} {stat.desc}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>{t('autoConnectedServices')}</CardTitle>
                        <CardDescription>
                            {t('localServicesDescription')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Mock Visualizer of Service Mesh */}
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-full text-purple-500">
                                        <Activity className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{t('localAi')}</p>
                                        <p className="text-sm text-muted-foreground">Running on :11434</p>
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-emerald-500">{t('connected')}</div>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                                        <Database className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{t('sharedDb')}</p>
                                        <p className="text-sm text-muted-foreground">PostgreSQL 16</p>
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-emerald-500">{t('linked')}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>{t('activeBots')}</CardTitle>
                        <CardDescription>
                            {t('currentStatusAndLoad')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {bots.slice(0, 5).map((bot) => (
                                <div key={bot.id} className="flex items-center">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{bot.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {bot.username}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium text-sm">
                                        {bot.status === 'active' ? (
                                            <span className="text-emerald-500">{t('running')}</span>
                                        ) : (
                                            <span className="text-muted-foreground">{t('stopped')}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {bots.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">{t('noBotsConnected')}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default BotDashboardPage;
