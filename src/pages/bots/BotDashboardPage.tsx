import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Megaphone, Activity, Bot } from "lucide-react";

const BotDashboardPage = () => {
    // Placeholder data
    const stats = [
        { title: "Total Bots", value: "3", icon: Bot, change: "+1", desc: "Active Telegram bots" },
        { title: "Total Users", value: "1,240", icon: Users, change: "+12%", desc: "Across all bots" },
        { title: "Ad Campaigns", value: "5", icon: Megaphone, change: "2 Active", desc: "Running campaigns" },
        { title: "Messages Today", value: "8,920", icon: Activity, change: "+15%", desc: "Volume vs yesterday" },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Bot Studio Overview</h1>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
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
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest interactions across your bot network.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground py-10 text-center border-2 border-dashed rounded-lg">
                            Chart placeholder (Messages over time)
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top Performing Bots</CardTitle>
                        <CardDescription>
                            By verification and engagement.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {["CreationHub Helper", "Support Bot", "Sales Assistant"].map((bot, i) => (
                                <div key={i} className="flex items-center">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{bot}</p>
                                        <p className="text-xs text-muted-foreground">
                                            @{bot.replace(/\s/g, '').toLowerCase()}_bot
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium">
                                        {(100 - i * 15) + Math.floor(Math.random() * 10)} users
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default BotDashboardPage;
