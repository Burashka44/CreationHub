import { useState } from 'react';
import { BarChart3, Users, Eye, TrendingUp, Youtube, Video, MessageCircle, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const platformConfig = {
  youtube: { icon: Youtube, color: '#FF0000', name: 'YouTube' },
  tiktok: { icon: Video, color: '#ff0050', name: 'TikTok' },
  rutube: { icon: Video, color: '#FF6B00', name: 'RuTube' },
  max: { icon: MessageCircle, color: '#8B5CF6', name: 'Max' },
  telegram: { icon: MessageCircle, color: '#0088cc', name: 'Telegram' },
};

// Mock data for demonstration
const channelsData = [
  { 
    id: '1', 
    name: 'Tech Channel', 
    platform: 'youtube' as const, 
    subscribers: 125400, 
    views: 2450000, 
    engagement: 4.2,
    growth: 12.5,
    videos: 234
  },
  { 
    id: '2', 
    name: 'Daily Updates', 
    platform: 'tiktok' as const, 
    subscribers: 89200, 
    views: 1230000, 
    engagement: 8.7,
    growth: 23.4,
    videos: 456
  },
  { 
    id: '3', 
    name: 'InnoGuru News', 
    platform: 'telegram' as const, 
    subscribers: 45600, 
    views: 890000, 
    engagement: 12.3,
    growth: 8.9,
    videos: 0
  },
  { 
    id: '4', 
    name: 'RuTube Channel', 
    platform: 'rutube' as const, 
    subscribers: 12300, 
    views: 340000, 
    engagement: 3.1,
    growth: 5.2,
    videos: 87
  },
];

const viewsData = [
  { date: '01.12', youtube: 45000, tiktok: 32000, telegram: 12000, rutube: 5000 },
  { date: '02.12', youtube: 52000, tiktok: 28000, telegram: 14000, rutube: 6200 },
  { date: '03.12', youtube: 48000, tiktok: 41000, telegram: 11000, rutube: 5800 },
  { date: '04.12', youtube: 61000, tiktok: 35000, telegram: 15000, rutube: 7100 },
  { date: '05.12', youtube: 55000, tiktok: 38000, telegram: 13000, rutube: 6500 },
  { date: '06.12', youtube: 67000, tiktok: 42000, telegram: 16000, rutube: 7800 },
  { date: '07.12', youtube: 72000, tiktok: 45000, telegram: 18000, rutube: 8200 },
];

const subscriberGrowth = [
  { date: '01.12', subscribers: 268000 },
  { date: '02.12', subscribers: 269500 },
  { date: '03.12', subscribers: 270200 },
  { date: '04.12', subscribers: 271800 },
  { date: '05.12', subscribers: 272100 },
  { date: '06.12', subscribers: 273400 },
  { date: '07.12', subscribers: 275500 },
];

const pieData = [
  { name: 'YouTube', value: 125400, color: '#FF0000' },
  { name: 'TikTok', value: 89200, color: '#ff0050' },
  { name: 'Telegram', value: 45600, color: '#0088cc' },
  { name: 'RuTube', value: 12300, color: '#FF6B00' },
];

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const MediaAnalyticsPage = () => {
  const { t } = useLanguage();

  const totalSubscribers = channelsData.reduce((sum, ch) => sum + ch.subscribers, 0);
  const totalViews = channelsData.reduce((sum, ch) => sum + ch.views, 0);
  const avgEngagement = channelsData.reduce((sum, ch) => sum + ch.engagement, 0) / channelsData.length;
  const avgGrowth = channelsData.reduce((sum, ch) => sum + ch.growth, 0) / channelsData.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('mediaAnalytics')}</h1>
          <p className="text-muted-foreground">{t('mediaAnalyticsDescription')}</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatNumber(totalSubscribers)}</p>
                <p className="text-sm text-muted-foreground">{t('totalSubscribers')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <Eye className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatNumber(totalViews)}</p>
                <p className="text-sm text-muted-foreground">{t('totalViews')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avgEngagement.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">{t('avgEngagement')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Play className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">+{avgGrowth.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">{t('monthlyGrowth')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Views Chart */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              {t('viewsDynamics')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={viewsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={formatNumber} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => formatNumber(value)}
                />
                <Line type="monotone" dataKey="youtube" stroke="#FF0000" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="tiktok" stroke="#ff0050" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="telegram" stroke="#0088cc" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="rutube" stroke="#FF6B00" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
              {Object.entries(platformConfig).slice(0, 4).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                  <span className="text-sm text-muted-foreground">{config.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subscribers Distribution */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {t('subscribersDistribution')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatNumber(value)}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => formatNumber(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subscriber Growth */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t('subscriberGrowth')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={subscriberGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={formatNumber} domain={['dataMin - 1000', 'dataMax + 1000']} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => formatNumber(value)}
              />
              <Bar dataKey="subscribers" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channelsData.map((channel) => {
          const config = platformConfig[channel.platform];
          const Icon = config.icon;
          
          return (
            <Card key={channel.id} className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-3 rounded-lg" 
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      <Icon className="h-6 w-6" style={{ color: config.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{channel.name}</h3>
                      <p className="text-sm text-muted-foreground">{config.name}</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400">
                    +{channel.growth}%
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-lg font-bold text-foreground">{formatNumber(channel.subscribers)}</p>
                    <p className="text-xs text-muted-foreground">{t('subscribers')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{formatNumber(channel.views)}</p>
                    <p className="text-xs text-muted-foreground">{t('views')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{channel.engagement}%</p>
                    <p className="text-xs text-muted-foreground">{t('engagement')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MediaAnalyticsPage;
