import {
  Eye, Users, Play, Clock, TrendingUp, TrendingDown,
  ThumbsUp, MessageSquare, Share2, DollarSign,
  Video, Heart, Zap, Star, Activity
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';

// RuTube and TikTok don't have public APIs for analytics

interface MediaChannel {
  id: string;
  name: string;
  platform: string;
  subscribers: number;
  views: number;
  engagement: number;
  growth: number;
  videos_count: number;
  is_monetized: boolean;
  watch_hours: number;
  avg_view_duration: number;
  ctr: number;
  revenue: number;
  likes: number;
  comments: number;
  shares: number;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatCurrency = (num: number, currency: string = 'RUB') => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(num);
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Generate mock data for charts
// Generate mock data for charts
const generateViewsData = (baseViews: number) => {
  // TODO: Connect to real stats table
  return [];
};

// ============== YouTube Analytics ==============
export const YouTubeAnalytics = ({ channel }: { channel: MediaChannel }) => {
  const viewsData = generateViewsData(channel.views / 30);

  const trafficSources = [];

  const requirements = {
    subscribers: { current: channel.subscribers, required: 1000 },
    watchHours: { current: channel.watch_hours, required: 4000 },
  };

  const subscribersProgress = Math.min((requirements.subscribers.current / requirements.subscribers.required) * 100, 100);
  const watchHoursProgress = Math.min((requirements.watchHours.current / requirements.watchHours.required) * 100, 100);
  const isEligible = subscribersProgress >= 100 && watchHoursProgress >= 100;

  return (
    <div className="space-y-6">
      {/* Monetization Status */}
      <div className="p-4 rounded-xl bg-background/50 border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className={`h-5 w-5 ${channel.is_monetized ? 'text-emerald-500' : 'text-muted-foreground'}`} />
            <span className="font-medium">YouTube Partner Program</span>
          </div>
          {channel.is_monetized ? (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Активна</Badge>
          ) : isEligible ? (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Доступна</Badge>
          ) : (
            <Badge variant="outline">Недоступна</Badge>
          )}
        </div>

        {!channel.is_monetized && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Подписчиков</span>
                <span>{formatNumber(requirements.subscribers.current)} / 1K</span>
              </div>
              <Progress value={subscribersProgress} className="h-2" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Часов просмотра (год)</span>
                <span>{formatNumber(requirements.watchHours.current)} / 4K</span>
              </div>
              <Progress value={watchHoursProgress} className="h-2" />
            </div>
          </div>
        )}

        {channel.is_monetized && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-muted-foreground">Доход</p>
              <p className="text-lg font-bold text-emerald-500">{formatCurrency(channel.revenue)}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground">CPM</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency((channel.revenue / Math.max(channel.views, 1)) * 1000)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-muted-foreground">RPM</p>
              <p className="text-lg font-bold text-amber-500">
                {formatCurrency((channel.revenue / Math.max(channel.views, 1)) * 1000 * 0.55)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Eye} label="Просмотры" value={formatNumber(channel.views)} trend="+12.5%" positive />
        <MetricCard icon={Clock} label="Часы просмотра" value={formatNumber(channel.watch_hours) + 'ч'} trend="+8.3%" positive />
        <MetricCard icon={Activity} label="Ср. длительность" value={formatDuration(channel.avg_view_duration || 245)} trend="-2.1%" positive={false} />
        <MetricCard icon={Zap} label="CTR" value={(channel.ctr || 4.5).toFixed(1) + '%'} trend="+0.5%" positive />
      </div>

      {/* Engagement */}
      <div className="grid grid-cols-3 gap-3">
        <EngagementCard icon={ThumbsUp} label="Лайки" value={formatNumber(channel.likes || 15420)} color="pink" />
        <EngagementCard icon={MessageSquare} label="Комментарии" value={formatNumber(channel.comments || 892)} color="blue" />
        <EngagementCard icon={Share2} label="Репосты" value={formatNumber(channel.shares || 234)} color="purple" />
      </div>

      {/* Views Chart */}
      <ViewsChart data={viewsData} color="#FF0000" title="Динамика просмотров" />

      {/* Traffic Sources */}
      <TrafficSourcesChart data={trafficSources} />
    </div>
  );
};

// ============== Twitch Analytics ==============
export const TwitchAnalytics = ({ channel }: { channel: MediaChannel }) => {
  const viewsData = generateViewsData(channel.views / 30);

  // Twitch-specific metrics
  const twitchMetrics = {
    averageViewers: Math.floor(channel.views / 30 / 24), // Estimate
    peakViewers: Math.floor(channel.views / 30 / 24 * 2.5),
    hoursStreamed: Math.floor(channel.watch_hours / 10),
    chatMessages: channel.comments * 50,
    newFollowers: Math.floor(channel.subscribers * 0.1),
    subscriptions: Math.floor(channel.subscribers * 0.05),
    bitsReceived: Math.floor(channel.revenue * 100),
    clipsCreated: Math.floor(channel.shares * 2),
  };

  return (
    <div className="space-y-6">
      {/* Affiliate/Partner Status */}
      <div className="p-4 rounded-xl bg-background/50 border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className={`h-5 w-5 ${channel.is_monetized ? 'text-purple-500' : 'text-muted-foreground'}`} />
            <span className="font-medium">Twitch Partner Program</span>
          </div>
          {channel.is_monetized ? (
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Partner</Badge>
          ) : channel.subscribers >= 50 ? (
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Affiliate</Badge>
          ) : (
            <Badge variant="outline">Стример</Badge>
          )}
        </div>

        {!channel.is_monetized && channel.subscribers < 50 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-2">Требования для Affiliate:</p>
            <div className="grid grid-cols-2 gap-2">
              <RequirementItem label="Подписчиков" current={channel.subscribers} required={50} />
              <RequirementItem label="Ср. зрителей" current={twitchMetrics.averageViewers} required={3} />
              <RequirementItem label="Дней стрима" current={7} required={7} />
              <RequirementItem label="Часов стрима" current={twitchMetrics.hoursStreamed} required={8} />
            </div>
          </div>
        )}
      </div>

      {/* Stream Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Users} label="Ср. зрителей" value={formatNumber(twitchMetrics.averageViewers)} trend="+15%" positive />
        <MetricCard icon={TrendingUp} label="Пик зрителей" value={formatNumber(twitchMetrics.peakViewers)} trend="+22%" positive />
        <MetricCard icon={Clock} label="Часов стрима" value={formatNumber(twitchMetrics.hoursStreamed)} trend="+5%" positive />
        <MetricCard icon={MessageSquare} label="Сообщений чата" value={formatNumber(twitchMetrics.chatMessages)} trend="+18%" positive />
      </div>

      {/* Revenue Metrics */}
      {channel.is_monetized && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
            <DollarSign className="h-5 w-5 text-purple-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{formatCurrency(channel.revenue, 'USD')}</p>
            <p className="text-xs text-muted-foreground">Подписки</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <Zap className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{formatNumber(twitchMetrics.bitsReceived)}</p>
            <p className="text-xs text-muted-foreground">Bits</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
            <Heart className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{formatNumber(twitchMetrics.newFollowers)}</p>
            <p className="text-xs text-muted-foreground">Новые фолловеры</p>
          </div>
        </div>
      )}

      <ViewsChart data={viewsData} color="#9146FF" title="Зрители по дням" />
    </div>
  );
};

// ============== VK Video Analytics ==============
export const VKVideoAnalytics = ({ channel }: { channel: MediaChannel }) => {
  const viewsData = generateViewsData(channel.views / 30);

  const vkMetrics = {
    clipsViews: Math.floor(channel.views * 0.3),
    clipsLikes: Math.floor(channel.likes * 0.4),
    stories: Math.floor(channel.videos_count * 0.5),
    reposts: channel.shares * 2,
  };

  return (
    <div className="space-y-6">
      {/* VK Donut (monetization) */}
      <div className="p-4 rounded-xl bg-background/50 border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className={`h-5 w-5 ${channel.is_monetized ? 'text-blue-500' : 'text-muted-foreground'}`} />
            <span className="font-medium">VK Donut</span>
          </div>
          {channel.is_monetized ? (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Активен</Badge>
          ) : (
            <Badge variant="outline">Не подключен</Badge>
          )}
        </div>
        {channel.is_monetized && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-muted-foreground">Доход от Donut</p>
              <p className="text-lg font-bold text-blue-500">{formatCurrency(channel.revenue * 0.7)}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground">Подписчиков Donut</p>
              <p className="text-lg font-bold text-primary">{formatNumber(Math.floor(channel.subscribers * 0.02))}</p>
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Eye} label="Просмотры видео" value={formatNumber(channel.views)} trend="+8%" positive />
        <MetricCard icon={Play} label="Просмотры клипов" value={formatNumber(vkMetrics.clipsViews)} trend="+25%" positive />
        <MetricCard icon={Video} label="Видео" value={formatNumber(channel.videos_count)} trend="+3" positive />
        <MetricCard icon={Users} label="Подписчики" value={formatNumber(channel.subscribers)} trend="+5.2%" positive />
      </div>

      {/* Engagement */}
      <div className="grid grid-cols-3 gap-3">
        <EngagementCard icon={ThumbsUp} label="Лайки" value={formatNumber(channel.likes)} color="blue" />
        <EngagementCard icon={MessageSquare} label="Комментарии" value={formatNumber(channel.comments)} color="sky" />
        <EngagementCard icon={Share2} label="Репосты" value={formatNumber(vkMetrics.reposts)} color="indigo" />
      </div>

      <ViewsChart data={viewsData} color="#0077FF" title="Динамика просмотров" />
    </div>
  );
};

// ============== RuTube Analytics ==============
export const RuTubeAnalytics = ({ channel }: { channel: MediaChannel }) => {
  const viewsData = generateViewsData(channel.views / 30);

  return (
    <div className="space-y-6">
      {/* Monetization */}
      <div className="p-4 rounded-xl bg-background/50 border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className={`h-5 w-5 ${channel.is_monetized ? 'text-orange-500' : 'text-muted-foreground'}`} />
            <span className="font-medium">Монетизация RuTube</span>
          </div>
          {channel.is_monetized ? (
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Активна</Badge>
          ) : channel.subscribers >= 1000 ? (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Доступна</Badge>
          ) : (
            <Badge variant="outline">Недоступна</Badge>
          )}
        </div>

        {!channel.is_monetized && channel.subscribers < 1000 && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Подписчиков (мин. 1000)</span>
                <span>{formatNumber(channel.subscribers)} / 1K</span>
              </div>
              <Progress value={Math.min((channel.subscribers / 1000) * 100, 100)} className="h-2" />
            </div>
          </div>
        )}

        {channel.is_monetized && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-xs text-muted-foreground">Доход</p>
              <p className="text-lg font-bold text-orange-500">{formatCurrency(channel.revenue)}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground">CPM</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency((channel.revenue / Math.max(channel.views, 1)) * 1000)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Eye} label="Просмотры" value={formatNumber(channel.views)} trend="+10%" positive />
        <MetricCard icon={Clock} label="Время просмотра" value={formatNumber(channel.watch_hours) + 'ч'} trend="+6%" positive />
        <MetricCard icon={Video} label="Видео" value={formatNumber(channel.videos_count)} trend="+2" positive />
        <MetricCard icon={Users} label="Подписчики" value={formatNumber(channel.subscribers)} trend="+4.8%" positive />
      </div>

      {/* Engagement */}
      <div className="grid grid-cols-3 gap-3">
        <EngagementCard icon={ThumbsUp} label="Лайки" value={formatNumber(channel.likes)} color="orange" />
        <EngagementCard icon={MessageSquare} label="Комментарии" value={formatNumber(channel.comments)} color="amber" />
        <EngagementCard icon={Share2} label="Репосты" value={formatNumber(channel.shares)} color="yellow" />
      </div>

      <ViewsChart data={viewsData} color="#FF6B00" title="Динамика просмотров" />
    </div>
  );
};

// ============== Telegram Analytics ==============
export const TelegramAnalytics = ({ channel, subscriberData }: { channel: MediaChannel; subscriberData?: any[] }) => {
  const viewsData = generateViewsData(channel.views / 30);

  // Telegram monetization:
  // 1. Telegram Premium revenue sharing (50% от подписок Premium в канале)
  // 2. Telegram Ads (для каналов с 1000+ подписчиков)
  // 3. Продажа рекламы напрямую

  const requirements = {
    subscribers: { current: channel.subscribers, required: 1000 },
  };

  const subscribersProgress = Math.min((requirements.subscribers.current / requirements.subscribers.required) * 100, 100);
  const isEligibleForAds = subscribersProgress >= 100;

  // Estimated Premium revenue (based on subscribers with Premium)
  const estimatedPremiumUsers = Math.floor(channel.subscribers * 0.08); // ~8% пользователей с Premium
  const estimatedPremiumRevenue = estimatedPremiumUsers * 2.5; // ~$2.5 за Premium пользователя в месяц (50% от $5)

  // Estimated Ad revenue 
  const estimatedCPM = channel.subscribers >= 10000 ? 3 : channel.subscribers >= 5000 ? 2 : 1; // $/1000 просмотров
  const estimatedAdRevenue = (channel.views / 1000) * estimatedCPM * 0.5; // 50% от рекламы

  return (
    <div className="space-y-6">
      {/* Telegram Monetization Status */}
      <div className="p-4 rounded-xl bg-background/50 border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className={`h-5 w-5 ${channel.is_monetized ? 'text-sky-500' : 'text-muted-foreground'}`} />
            <span className="font-medium">Монетизация Telegram</span>
          </div>
          {channel.is_monetized ? (
            <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30">Активна</Badge>
          ) : isEligibleForAds ? (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Доступна</Badge>
          ) : (
            <Badge variant="outline">Недоступна</Badge>
          )}
        </div>

        {/* Monetization Methods */}
        <div className="space-y-4">
          {/* Telegram Premium */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-sky-500/10 to-purple-500/10 border border-sky-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-sky-500" />
                <span className="text-sm font-medium">Telegram Premium</span>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Активно</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              50% дохода от подписчиков Premium, которые смотрят ваш контент
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-background/50">
                <p className="text-xs text-muted-foreground">Premium подписчики</p>
                <p className="text-lg font-bold text-sky-500">~{formatNumber(estimatedPremiumUsers)}</p>
              </div>
              <div className="p-2 rounded bg-background/50">
                <p className="text-xs text-muted-foreground">Оценка дохода/мес</p>
                <p className="text-lg font-bold text-emerald-500">${estimatedPremiumRevenue.toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* Telegram Ads */}
          <div className={`p-3 rounded-lg border ${isEligibleForAds ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20' : 'bg-muted/20 border-border/50'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className={`h-4 w-4 ${isEligibleForAds ? 'text-amber-500' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">Telegram Ads</span>
              </div>
              {isEligibleForAds ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Доступно</Badge>
              ) : (
                <Badge variant="outline" className="text-xs">1K подписчиков</Badge>
              )}
            </div>
            {isEligibleForAds ? (
              <>
                <p className="text-xs text-muted-foreground mb-2">
                  Официальная рекламная платформа Telegram. 50% от дохода.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-background/50">
                    <p className="text-xs text-muted-foreground">CPM</p>
                    <p className="text-lg font-bold text-amber-500">${estimatedCPM}</p>
                  </div>
                  <div className="p-2 rounded bg-background/50">
                    <p className="text-xs text-muted-foreground">Оценка дохода/мес</p>
                    <p className="text-lg font-bold text-emerald-500">${estimatedAdRevenue.toFixed(0)}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Требуется минимум 1,000 подписчиков
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Прогресс</span>
                    <span>{formatNumber(channel.subscribers)} / 1K</span>
                  </div>
                  <Progress value={subscribersProgress} className="h-2" />
                </div>
              </div>
            )}
          </div>

          {/* Direct Ad Sales */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Прямые продажи рекламы</span>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">100% дохода</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Продавайте рекламу напрямую рекламодателям через раздел "Реклама"
            </p>
          </div>
        </div>

        {/* Total Revenue Estimate */}
        {channel.is_monetized && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Общий доход за месяц</span>
              <span className="text-xl font-bold text-emerald-500">{formatCurrency(channel.revenue || 0)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Users} label="Подписчики" value={formatNumber(channel.subscribers)} trend="+5.2%" positive />
        <MetricCard icon={Eye} label="Просмотры поста" value={formatNumber(Math.floor(channel.subscribers * 0.4))} trend="+8%" positive />
        <MetricCard icon={Activity} label="ERR" value={((channel.engagement || 45) / 10).toFixed(1) + '%'} trend="+1.2%" positive />
        <MetricCard icon={TrendingUp} label="Охват" value={formatNumber(Math.floor(channel.subscribers * 0.6))} trend="+3%" positive />
      </div>

      {/* Engagement */}
      <div className="grid grid-cols-3 gap-3">
        <EngagementCard icon={ThumbsUp} label="Реакции" value={formatNumber(channel.likes || Math.floor(channel.subscribers * 0.05))} color="sky" />
        <EngagementCard icon={MessageSquare} label="Комментарии" value={formatNumber(channel.comments || Math.floor(channel.subscribers * 0.01))} color="blue" />
        <EngagementCard icon={Share2} label="Репосты" value={formatNumber(channel.shares || Math.floor(channel.subscribers * 0.02))} color="indigo" />
      </div>

      <ViewsChart data={viewsData} color="#0088cc" title="Просмотры постов" />
    </div>
  );
};

// ============== TikTok Analytics ==============
export const TikTokAnalytics = ({ channel }: { channel: MediaChannel }) => {
  const viewsData = generateViewsData(channel.views / 30);

  // TikTok Creativity Program requirements (updated 2024)
  // 10K followers, 100K video views in 30 days, 18+ years, active in eligible region
  const requirements = {
    followers: { current: channel.subscribers, required: 10000 },
    views30Days: { current: Math.floor(channel.views * 0.3), required: 100000 },
  };

  const followersProgress = Math.min((requirements.followers.current / requirements.followers.required) * 100, 100);
  const viewsProgress = Math.min((requirements.views30Days.current / requirements.views30Days.required) * 100, 100);
  const isEligible = followersProgress >= 100 && viewsProgress >= 100;

  return (
    <div className="space-y-6">
      {/* TikTok Creativity Program */}
      <div className="p-4 rounded-xl bg-background/50 border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className={`h-5 w-5 ${channel.is_monetized ? 'text-pink-500' : 'text-muted-foreground'}`} />
            <span className="font-medium">TikTok Creativity Program</span>
          </div>
          {channel.is_monetized ? (
            <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">Активна</Badge>
          ) : isEligible ? (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Доступна</Badge>
          ) : (
            <Badge variant="outline">Недоступна</Badge>
          )}
        </div>

        {!channel.is_monetized && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Подписчиков</span>
                <span className={followersProgress >= 100 ? 'text-emerald-500' : 'text-foreground'}>
                  {formatNumber(requirements.followers.current)} / 10K
                </span>
              </div>
              <Progress value={followersProgress} className="h-2" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Просмотров за 30 дней</span>
                <span className={viewsProgress >= 100 ? 'text-emerald-500' : 'text-foreground'}>
                  {formatNumber(requirements.views30Days.current)} / 100K
                </span>
              </div>
              <Progress value={viewsProgress} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Также требуется: возраст 18+, оригинальный контент от 1 мин.
            </p>
          </div>
        )}

        {channel.is_monetized && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <p className="text-xs text-muted-foreground">Доход</p>
              <p className="text-lg font-bold text-pink-500">{formatCurrency(channel.revenue)}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground">RPM</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency((channel.revenue / Math.max(channel.views, 1)) * 1000)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <p className="text-xs text-muted-foreground">За видео (ср.)</p>
              <p className="text-lg font-bold text-cyan-500">
                {formatCurrency(channel.revenue / Math.max(channel.videos_count || 1, 1))}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Eye} label="Просмотры" value={formatNumber(channel.views)} trend="+18%" positive />
        <MetricCard icon={Users} label="Подписчики" value={formatNumber(channel.subscribers)} trend="+12%" positive />
        <MetricCard icon={Video} label="Видео" value={formatNumber(channel.videos_count)} trend="+5" positive />
        <MetricCard icon={Activity} label="Вовлечённость" value={(channel.engagement || 8.5).toFixed(1) + '%'} trend="+2.3%" positive />
      </div>

      {/* Engagement */}
      <div className="grid grid-cols-3 gap-3">
        <EngagementCard icon={ThumbsUp} label="Лайки" value={formatNumber(channel.likes)} color="pink" />
        <EngagementCard icon={MessageSquare} label="Комментарии" value={formatNumber(channel.comments)} color="cyan" />
        <EngagementCard icon={Share2} label="Репосты" value={formatNumber(channel.shares)} color="purple" />
      </div>

      <ViewsChart data={viewsData} color="#ff0050" title="Динамика просмотров" />
    </div>
  );
};

// ============== Helper Components ==============

const MetricCard = ({ icon: Icon, label, value, trend, positive }: {
  icon: any; label: string; value: string; trend: string; positive: boolean;
}) => (
  <div className="p-3 rounded-lg bg-background/50 border border-border/50">
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      <Icon className="h-4 w-4" />
      <span className="text-xs">{label}</span>
    </div>
    <p className="text-xl font-bold">{value}</p>
    <p className={`text-xs ${positive ? 'text-emerald-500' : 'text-red-500'}`}>{trend} за месяц</p>
  </div>
);

const EngagementCard = ({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string; color: string;
}) => (
  <div className={`p-3 rounded-lg bg-${color}-500/10 border border-${color}-500/20 text-center`}>
    <Icon className={`h-5 w-5 text-${color}-500 mx-auto mb-1`} />
    <p className="text-lg font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

const RequirementItem = ({ label, current, required }: { label: string; current: number; required: number }) => {
  const progress = Math.min((current / required) * 100, 100);
  const completed = progress >= 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={completed ? 'text-emerald-500' : ''}>{current}/{required}</span>
      </div>
      <Progress value={progress} className="h-1.5" />
    </div>
  );
};

const ViewsChart = ({ data, color, title }: { data: any[]; color: string; title: string }) => (
  <div className="p-4 rounded-xl bg-background/50 border border-border/50">
    <h4 className="font-medium mb-4">{title}</h4>
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={formatNumber} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
            formatter={(value: number) => [formatNumber(value), 'Просмотры']}
          />
          <Area type="monotone" dataKey="views" stroke={color} strokeWidth={2} fill={`url(#gradient-${color})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const TrafficSourcesChart = ({ data }: { data: any[] }) => (
  <div className="p-4 rounded-xl bg-background/50 border border-border/50">
    <h4 className="font-medium mb-4">Источники трафика</h4>
    <div className="flex items-center gap-6">
      <div className="w-[150px] h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2">
        {data.map((source, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
              <span className="text-muted-foreground">{source.name}</span>
            </div>
            <span className="font-medium">{source.value}%</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);
