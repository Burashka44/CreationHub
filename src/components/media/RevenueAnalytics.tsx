import { useState, useMemo } from 'react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  TrendingUp, TrendingDown, Download, Calendar,
  DollarSign, ArrowUpRight, ArrowDownRight, Calculator,
  Target, Users, MousePointer, Percent, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, LineChart, Line, Legend
} from 'recharts';

interface AdPurchase {
  id: string;
  name: string;
  cost: number;
  new_subscribers: number;
  clicks: number;
  created_at: string;
  status: string;
}

interface AdSale {
  id: string;
  price: number;
  clicks: number;
  is_paid: boolean;
  created_at: string;
  payment_date: string | null;
  status: string;
}

interface RevenueAnalyticsProps {
  sales: AdSale[];
  purchases: AdPurchase[];
}

const formatCurrency = (num: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(num);
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export const RevenueAnalytics = ({ sales, purchases }: RevenueAnalyticsProps) => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // ROI Calculator state
  const [roiCalculator, setRoiCalculator] = useState({
    adCost: 5000,
    expectedSubscribers: 100,
    revenuePerSubscriber: 50,
    conversionRate: 2,
    channelSubscribers: 10000,
  });

  // Filter data by date range
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const date = parseISO(sale.created_at);
      return date >= dateRange.from && date <= dateRange.to;
    });
  }, [sales, dateRange]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(purchase => {
      const date = parseISO(purchase.created_at);
      return date >= dateRange.from && date <= dateRange.to;
    });
  }, [purchases, dateRange]);

  // Generate chart data
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const displayDate = format(day, 'dd.MM', { locale: ru });

      const dayRevenue = sales
        .filter(s => s.is_paid && s.payment_date && format(parseISO(s.payment_date), 'yyyy-MM-dd') === dayStr)
        .reduce((sum, s) => sum + s.price, 0);

      const dayExpenses = purchases
        .filter(p => format(parseISO(p.created_at), 'yyyy-MM-dd') === dayStr)
        .reduce((sum, p) => sum + p.cost, 0);

      const daySales = sales
        .filter(s => format(parseISO(s.created_at), 'yyyy-MM-dd') === dayStr)
        .length;

      const dayPurchases = purchases
        .filter(p => format(parseISO(p.created_at), 'yyyy-MM-dd') === dayStr)
        .length;

      return {
        date: displayDate,
        fullDate: dayStr,
        revenue: dayRevenue,
        expenses: dayExpenses,
        profit: dayRevenue - dayExpenses,
        sales: daySales,
        purchases: dayPurchases,
      };
    });
  }, [sales, purchases, dateRange]);

  // Summary calculations
  const summary = useMemo(() => {
    const totalRevenue = filteredSales.filter(s => s.is_paid).reduce((sum, s) => sum + s.price, 0);
    const totalExpenses = filteredPurchases.reduce((sum, p) => sum + p.cost, 0);
    const totalProfit = totalRevenue - totalExpenses;
    const totalNewSubs = filteredPurchases.reduce((sum, p) => sum + p.new_subscribers, 0);
    const avgCostPerSub = totalNewSubs > 0 ? totalExpenses / totalNewSubs : 0;
    const roi = totalExpenses > 0 ? ((totalRevenue - totalExpenses) / totalExpenses) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      totalProfit,
      totalNewSubs,
      avgCostPerSub,
      roi,
      salesCount: filteredSales.length,
      purchasesCount: filteredPurchases.length,
    };
  }, [filteredSales, filteredPurchases]);

  // ROI Calculator results
  const roiResults = useMemo(() => {
    const { adCost, expectedSubscribers, revenuePerSubscriber, conversionRate, channelSubscribers } = roiCalculator;

    const expectedRevenue = expectedSubscribers * revenuePerSubscriber;
    const expectedProfit = expectedRevenue - adCost;
    const roi = adCost > 0 ? ((expectedRevenue - adCost) / adCost) * 100 : 0;
    const costPerSubscriber = expectedSubscribers > 0 ? adCost / expectedSubscribers : 0;
    const breakEvenSubscribers = revenuePerSubscriber > 0 ? Math.ceil(adCost / revenuePerSubscriber) : 0;

    // Прогноз на основе конверсии
    const expectedClicksFromChannel = Math.floor(channelSubscribers * (conversionRate / 100));
    const expectedSubscribersFromChannel = Math.floor(expectedClicksFromChannel * 0.15); // 15% конверсия кликов в подписки

    return {
      expectedRevenue,
      expectedProfit,
      roi,
      costPerSubscriber,
      breakEvenSubscribers,
      expectedClicksFromChannel,
      expectedSubscribersFromChannel,
      isProfitable: expectedProfit > 0,
    };
  }, [roiCalculator]);

  // Export to Excel (CSV)
  const exportToExcel = () => {
    const headers = ['Дата', 'Доход (₽)', 'Расходы (₽)', 'Прибыль (₽)', 'Продаж', 'Покупок'];
    const rows = chartData.map(d => [
      d.fullDate,
      d.revenue,
      d.expenses,
      d.profit,
      d.sales,
      d.purchases,
    ]);

    // Summary row
    rows.push([]);
    rows.push(['ИТОГО', summary.totalRevenue, summary.totalExpenses, summary.totalProfit, summary.salesCount, summary.purchasesCount]);
    rows.push(['ROI', `${summary.roi.toFixed(1)}%`, '', '', '', '']);
    rows.push(['Ср. стоимость подписчика', formatCurrency(summary.avgCostPerSub), '', '', '', '']);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `revenue_report_${format(dateRange.from, 'yyyy-MM-dd')}_${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector & Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                {format(dateRange.from, 'dd.MM.yyyy', { locale: ru })} - {format(dateRange.to, 'dd.MM.yyyy', { locale: ru })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}
            >
              7д
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
            >
              30д
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}
            >
              Месяц
            </Button>
          </div>
        </div>

        <Button onClick={exportToExcel} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Экспорт в Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              <span className="text-xs">Доход</span>
            </div>
            <p className="text-2xl font-bold text-emerald-500">{formatCurrency(summary.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">{summary.salesCount} продаж</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ArrowDownRight className="h-4 w-4 text-red-500" />
              <span className="text-xs">Расходы</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{formatCurrency(summary.totalExpenses)}</p>
            <p className="text-xs text-muted-foreground">{summary.purchasesCount} покупок</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "bg-gradient-to-br border",
          summary.totalProfit >= 0
            ? "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30"
            : "from-red-500/20 to-red-600/10 border-red-500/30"
        )}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className={cn("h-4 w-4", summary.totalProfit >= 0 ? "text-emerald-500" : "text-red-500")} />
              <span className="text-xs">Прибыль</span>
            </div>
            <p className={cn("text-2xl font-bold", summary.totalProfit >= 0 ? "text-emerald-500" : "text-red-500")}>
              {summary.totalProfit >= 0 ? '+' : ''}{formatCurrency(summary.totalProfit)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Percent className="h-4 w-4 text-blue-500" />
              <span className="text-xs">ROI</span>
            </div>
            <p className={cn("text-2xl font-bold", summary.roi >= 0 ? "text-blue-500" : "text-red-500")}>
              {summary.roi >= 0 ? '+' : ''}{summary.roi.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Доходы/Расходы</TabsTrigger>
          <TabsTrigger value="profit">Прибыль</TabsTrigger>
          <TabsTrigger value="roi">Калькулятор ROI</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">Динамика доходов и расходов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => formatNumber(v)} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'revenue' ? 'Доход' : 'Расходы'
                      ]}
                    />
                    <Legend formatter={(value) => value === 'revenue' ? 'Доход' : 'Расходы'} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revenueGradient)" />
                    <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expensesGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit" className="mt-4">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">Динамика прибыли</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => formatNumber(v)} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Прибыль']}
                    />
                    <Bar
                      dataKey="profit"
                      radius={[4, 4, 0, 0]}
                      fill="#3b82f6"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Calculator Input */}
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Калькулятор ROI
                </CardTitle>
                <CardDescription>Рассчитайте эффективность рекламной кампании</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Стоимость рекламы (₽)</Label>
                  <Input
                    type="number"
                    value={roiCalculator.adCost}
                    onChange={e => setRoiCalculator({ ...roiCalculator, adCost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ожидаемое кол-во подписчиков</Label>
                  <Input
                    type="number"
                    value={roiCalculator.expectedSubscribers}
                    onChange={e => setRoiCalculator({ ...roiCalculator, expectedSubscribers: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Доход с подписчика (₽)</Label>
                  <Input
                    type="number"
                    value={roiCalculator.revenuePerSubscriber}
                    onChange={e => setRoiCalculator({ ...roiCalculator, revenuePerSubscriber: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">Средний доход от одного подписчика за время жизни</p>
                </div>
                <div className="space-y-2">
                  <Label>Подписчики канала где реклама</Label>
                  <Input
                    type="number"
                    value={roiCalculator.channelSubscribers}
                    onChange={e => setRoiCalculator({ ...roiCalculator, channelSubscribers: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ожидаемый CTR (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={roiCalculator.conversionRate}
                    onChange={e => setRoiCalculator({ ...roiCalculator, conversionRate: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">Процент подписчиков, которые кликнут по рекламе</p>
                </div>
              </CardContent>
            </Card>

            {/* Calculator Results */}
            <Card className={cn(
              "bg-gradient-to-br border",
              roiResults.isProfitable
                ? "from-emerald-500/10 to-emerald-600/5 border-emerald-500/30"
                : "from-red-500/10 to-red-600/5 border-red-500/30"
            )}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Прогноз эффективности
                </CardTitle>
                <Badge className={roiResults.isProfitable ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                  {roiResults.isProfitable ? 'Прибыльно' : 'Убыточно'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Ожидаемый доход</p>
                    <p className="text-xl font-bold text-emerald-500">{formatCurrency(roiResults.expectedRevenue)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Ожидаемая прибыль</p>
                    <p className={cn("text-xl font-bold", roiResults.isProfitable ? "text-emerald-500" : "text-red-500")}>
                      {roiResults.expectedProfit >= 0 ? '+' : ''}{formatCurrency(roiResults.expectedProfit)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">ROI</p>
                    <p className={cn("text-xl font-bold", roiResults.roi >= 0 ? "text-blue-500" : "text-red-500")}>
                      {roiResults.roi >= 0 ? '+' : ''}{roiResults.roi.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Цена подписчика</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(roiResults.costPerSubscriber)}</p>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4 space-y-3">
                  <h4 className="text-sm font-medium">Прогноз по каналу</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-background/30">
                      <MousePointer className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{formatNumber(roiResults.expectedClicksFromChannel)}</p>
                        <p className="text-xs text-muted-foreground">Ожидаемых кликов</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-background/30">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{formatNumber(roiResults.expectedSubscribersFromChannel)}</p>
                        <p className="text-xs text-muted-foreground">Ожидаемых подписок</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Target className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-amber-500">
                        {roiResults.breakEvenSubscribers} подписчиков
                      </p>
                      <p className="text-xs text-muted-foreground">Точка безубыточности</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
