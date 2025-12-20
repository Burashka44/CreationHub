import { useState, useEffect } from 'react';
import { 
  DollarSign, Plus, Trash2, Edit2, TrendingUp, TrendingDown, 
  Users, MousePointer, Target, Calendar, Check, X, ArrowUpRight, 
  ArrowDownRight, Megaphone, Receipt, CreditCard, UserPlus,
  BarChart3, PieChart, ExternalLink, Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RevenueAnalytics } from './RevenueAnalytics';

interface MediaChannel {
  id: string;
  name: string;
  platform: string;
  subscribers: number;
}

interface AdRate {
  id: string;
  channel_id: string;
  format: string;
  price: number;
  currency: string;
  duration_hours: number;
  description: string | null;
  is_active: boolean;
}

interface AdPurchase {
  id: string;
  name: string;
  target_channel: string;
  target_subscribers: number;
  our_channel_id: string | null;
  ad_link: string | null;
  tracking_code: string | null;
  cost: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  subscribers_before: number;
  subscribers_after: number;
  new_subscribers: number;
  clicks: number;
  status: string;
  notes: string | null;
}

interface AdSale {
  id: string;
  channel_id: string;
  rate_id: string | null;
  client_name: string;
  client_contact: string | null;
  ad_link: string | null;
  tracking_code: string | null;
  price: number;
  currency: string;
  publish_date: string | null;
  end_date: string | null;
  clicks: number;
  impressions: number;
  status: string;
  is_paid: boolean;
  payment_date: string | null;
  notes: string | null;
}

const formatCurrency = (num: number, currency: string = 'RUB') => {
  return new Intl.NumberFormat('ru-RU', { 
    style: 'currency', 
    currency, 
    maximumFractionDigits: 0 
  }).format(num);
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const adFormats = [
  { value: 'post', label: 'Пост' },
  { value: 'story', label: 'Сторис' },
  { value: 'repost', label: 'Репост' },
  { value: 'mention', label: 'Упоминание' },
  { value: 'native', label: 'Нативная реклама' },
  { value: 'integration', label: 'Интеграция' },
];

const statusColors: Record<string, string> = {
  planned: 'bg-blue-500/20 text-blue-400',
  pending: 'bg-amber-500/20 text-amber-400',
  active: 'bg-emerald-500/20 text-emerald-400',
  published: 'bg-emerald-500/20 text-emerald-400',
  completed: 'bg-purple-500/20 text-purple-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

const statusLabels: Record<string, string> = {
  planned: 'Запланировано',
  pending: 'Ожидание',
  active: 'Активно',
  published: 'Опубликовано',
  completed: 'Завершено',
  cancelled: 'Отменено',
};

interface AdRevenueManagerProps {
  channels: MediaChannel[];
}

export const AdRevenueManager = ({ channels }: AdRevenueManagerProps) => {
  const { toast } = useToast();
  const [rates, setRates] = useState<AdRate[]>([]);
  const [purchases, setPurchases] = useState<AdPurchase[]>([]);
  const [sales, setSales] = useState<AdSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  
  const [rateForm, setRateForm] = useState({
    channel_id: '',
    format: 'post',
    price: 0,
    duration_hours: 24,
    description: '',
  });

  const [purchaseForm, setPurchaseForm] = useState({
    name: '',
    target_channel: '',
    target_subscribers: 0,
    our_channel_id: '',
    ad_link: '',
    cost: 0,
    subscribers_before: 0,
    start_date: '',
    notes: '',
  });

  const [saleForm, setSaleForm] = useState({
    channel_id: '',
    rate_id: '',
    client_name: '',
    client_contact: '',
    ad_link: '',
    price: 0,
    publish_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    const [ratesRes, purchasesRes, salesRes] = await Promise.all([
      supabase.from('channel_ad_rates').select('*').order('price', { ascending: false }),
      supabase.from('ad_purchases').select('*').order('created_at', { ascending: false }),
      supabase.from('ad_sales').select('*').order('created_at', { ascending: false }),
    ]);

    if (ratesRes.data) setRates(ratesRes.data as AdRate[]);
    if (purchasesRes.data) setPurchases(purchasesRes.data as AdPurchase[]);
    if (salesRes.data) setSales(salesRes.data as AdSale[]);
    
    setIsLoading(false);
  };

  // === RATES CRUD ===
  const handleAddRate = async () => {
    if (!rateForm.channel_id || rateForm.price <= 0) {
      toast({ title: 'Ошибка', description: 'Заполните обязательные поля', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('channel_ad_rates').insert({
      channel_id: rateForm.channel_id,
      format: rateForm.format,
      price: rateForm.price,
      duration_hours: rateForm.duration_hours,
      description: rateForm.description || null,
    });

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Тариф добавлен' });
      fetchData();
      setIsRateDialogOpen(false);
      setRateForm({ channel_id: '', format: 'post', price: 0, duration_hours: 24, description: '' });
    }
  };

  const handleDeleteRate = async (id: string) => {
    const { error } = await supabase.from('channel_ad_rates').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Тариф удалён' });
      fetchData();
    }
  };

  // === PURCHASES CRUD ===
  const handleAddPurchase = async () => {
    if (!purchaseForm.name || !purchaseForm.target_channel) {
      toast({ title: 'Ошибка', description: 'Заполните обязательные поля', variant: 'destructive' });
      return;
    }

    const trackingCode = `buy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { error } = await supabase.from('ad_purchases').insert({
      name: purchaseForm.name,
      target_channel: purchaseForm.target_channel,
      target_subscribers: purchaseForm.target_subscribers,
      our_channel_id: purchaseForm.our_channel_id || null,
      ad_link: purchaseForm.ad_link || null,
      tracking_code: trackingCode,
      cost: purchaseForm.cost,
      subscribers_before: purchaseForm.subscribers_before,
      start_date: purchaseForm.start_date || null,
      notes: purchaseForm.notes || null,
      status: 'planned',
    });

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Покупка рекламы добавлена' });
      fetchData();
      setIsPurchaseDialogOpen(false);
      setPurchaseForm({ name: '', target_channel: '', target_subscribers: 0, our_channel_id: '', ad_link: '', cost: 0, subscribers_before: 0, start_date: '', notes: '' });
    }
  };

  const handleUpdatePurchase = async (id: string, updates: Partial<AdPurchase>) => {
    const { error } = await supabase.from('ad_purchases').update(updates).eq('id', id);
    if (!error) {
      toast({ title: 'Данные обновлены' });
      fetchData();
    }
  };

  const handleDeletePurchase = async (id: string) => {
    const { error } = await supabase.from('ad_purchases').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Запись удалена' });
      fetchData();
    }
  };

  // === SALES CRUD ===
  const handleAddSale = async () => {
    if (!saleForm.channel_id || !saleForm.client_name) {
      toast({ title: 'Ошибка', description: 'Заполните обязательные поля', variant: 'destructive' });
      return;
    }

    const trackingCode = `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { error } = await supabase.from('ad_sales').insert({
      channel_id: saleForm.channel_id,
      rate_id: saleForm.rate_id || null,
      client_name: saleForm.client_name,
      client_contact: saleForm.client_contact || null,
      ad_link: saleForm.ad_link || null,
      tracking_code: trackingCode,
      price: saleForm.price,
      publish_date: saleForm.publish_date || null,
      notes: saleForm.notes || null,
      status: 'pending',
    });

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Продажа рекламы добавлена' });
      fetchData();
      setIsSaleDialogOpen(false);
      setSaleForm({ channel_id: '', rate_id: '', client_name: '', client_contact: '', ad_link: '', price: 0, publish_date: '', notes: '' });
    }
  };

  const handleUpdateSale = async (id: string, updates: Partial<AdSale>) => {
    const { error } = await supabase.from('ad_sales').update(updates).eq('id', id);
    if (!error) {
      toast({ title: 'Данные обновлены' });
      fetchData();
    }
  };

  const handleDeleteSale = async (id: string) => {
    const { error } = await supabase.from('ad_sales').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Запись удалена' });
      fetchData();
    }
  };

  // === CALCULATIONS ===
  const totalRevenue = sales.filter(s => s.is_paid).reduce((sum, s) => sum + s.price, 0);
  const pendingRevenue = sales.filter(s => !s.is_paid && s.status !== 'cancelled').reduce((sum, s) => sum + s.price, 0);
  const totalSpent = purchases.reduce((sum, p) => sum + p.cost, 0);
  const totalNewSubscribers = purchases.reduce((sum, p) => sum + p.new_subscribers, 0);
  const avgCostPerSubscriber = totalNewSubscribers > 0 ? totalSpent / totalNewSubscribers : 0;
  const profit = totalRevenue - totalSpent;

  const telegramChannels = channels.filter(c => c.platform === 'telegram');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/20">
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Доход (получено)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-500/20">
                <Receipt className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">{formatCurrency(pendingRevenue)}</p>
                <p className="text-xs text-muted-foreground">Ожидает оплаты</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-500/20">
                <ArrowDownRight className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(totalSpent)}</p>
                <p className="text-xs text-muted-foreground">Расходы на рекламу</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <UserPlus className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">{formatCurrency(avgCostPerSubscriber)}</p>
                <p className="text-xs text-muted-foreground">Стоимость подписчика</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${profit >= 0 ? 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30' : 'from-red-500/20 to-red-600/10 border-red-500/30'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${profit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                <DollarSign className={`h-5 w-5 ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                </p>
                <p className="text-xs text-muted-foreground">Чистая прибыль</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="analytics">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Аналитика
          </TabsTrigger>
          <TabsTrigger value="rates" className="gap-2">
            <Receipt className="h-4 w-4" />
            Тарифы
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Продажи
          </TabsTrigger>
          <TabsTrigger value="purchases" className="gap-2">
            <ArrowDownRight className="h-4 w-4" />
            Покупки
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4 mt-6">
          <RevenueAnalytics sales={sales as any} purchases={purchases as any} />
        </TabsContent>

        {/* RATES TAB */}
        <TabsContent value="rates" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Тарифы на рекламу</h3>
            <Button onClick={() => setIsRateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Добавить тариф
            </Button>
          </div>

          {telegramChannels.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="py-12 text-center">
                <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Добавьте Telegram каналы для установки тарифов</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {telegramChannels.map(channel => {
                const channelRates = rates.filter(r => r.channel_id === channel.id);
                return (
                  <Card key={channel.id} className="bg-card/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{channel.name}</CardTitle>
                          <CardDescription>{formatNumber(channel.subscribers)} подписчиков</CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setRateForm({ ...rateForm, channel_id: channel.id });
                            setIsRateDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Тариф
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {channelRates.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Нет тарифов</p>
                      ) : (
                        <div className="grid gap-2">
                          {channelRates.map(rate => (
                            <div key={rate.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">
                                  {adFormats.find(f => f.value === rate.format)?.label || rate.format}
                                </Badge>
                                <span className="font-semibold">{formatCurrency(rate.price)}</span>
                                <span className="text-sm text-muted-foreground">/ {rate.duration_hours}ч</span>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteRate(rate.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* SALES TAB */}
        <TabsContent value="sales" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Продажи рекламы</h3>
            <Button onClick={() => setIsSaleDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Добавить продажу
            </Button>
          </div>

          {sales.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="py-12 text-center">
                <ArrowUpRight className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Нет продаж рекламы</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sales.map(sale => {
                const channel = channels.find(c => c.id === sale.channel_id);
                return (
                  <Card key={sale.id} className="bg-card/50">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{sale.client_name}</h4>
                          <p className="text-sm text-muted-foreground">{channel?.name || 'Канал удалён'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[sale.status]}>
                            {statusLabels[sale.status]}
                          </Badge>
                          {sale.is_paid ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400">Оплачено</Badge>
                          ) : (
                            <Badge variant="outline">Не оплачено</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3 mb-3">
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-lg font-bold text-emerald-500">{formatCurrency(sale.price)}</p>
                          <p className="text-xs text-muted-foreground">Стоимость</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-lg font-bold">{formatNumber(sale.clicks)}</p>
                          <p className="text-xs text-muted-foreground">Клики</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-lg font-bold">{formatNumber(sale.impressions)}</p>
                          <p className="text-xs text-muted-foreground">Показы</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-lg font-bold">
                            {sale.impressions > 0 ? ((sale.clicks / sale.impressions) * 100).toFixed(1) : 0}%
                          </p>
                          <p className="text-xs text-muted-foreground">CTR</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {!sale.is_paid && sale.status !== 'cancelled' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateSale(sale.id, { is_paid: true, payment_date: new Date().toISOString() })}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Оплачено
                            </Button>
                          )}
                          {sale.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateSale(sale.id, { status: 'published' })}
                            >
                              Опубликовать
                            </Button>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSale(sale.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* PURCHASES TAB */}
        <TabsContent value="purchases" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Покупки рекламы</h3>
            <Button onClick={() => setIsPurchaseDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Добавить покупку
            </Button>
          </div>

          {purchases.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="py-12 text-center">
                <ArrowDownRight className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Нет покупок рекламы</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {purchases.map(purchase => {
                const costPerSub = purchase.new_subscribers > 0 
                  ? purchase.cost / purchase.new_subscribers 
                  : 0;
                const ourChannel = channels.find(c => c.id === purchase.our_channel_id);
                
                return (
                  <Card key={purchase.id} className="bg-card/50">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{purchase.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {purchase.target_channel} ({formatNumber(purchase.target_subscribers)} подписчиков)
                          </p>
                          {ourChannel && (
                            <p className="text-xs text-primary">→ {ourChannel.name}</p>
                          )}
                        </div>
                        <Badge className={statusColors[purchase.status]}>
                          {statusLabels[purchase.status]}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-3 mb-3">
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-lg font-bold text-red-500">{formatCurrency(purchase.cost)}</p>
                          <p className="text-xs text-muted-foreground">Стоимость</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-lg font-bold">{formatNumber(purchase.clicks)}</p>
                          <p className="text-xs text-muted-foreground">Клики</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-lg font-bold text-emerald-500">+{purchase.new_subscribers}</p>
                          <p className="text-xs text-muted-foreground">Подписчиков</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-lg font-bold text-blue-500">{formatCurrency(costPerSub)}</p>
                          <p className="text-xs text-muted-foreground">Цена лида</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <p className="text-lg font-bold">
                            {purchase.target_subscribers > 0 
                              ? ((purchase.new_subscribers / purchase.target_subscribers) * 100).toFixed(2) 
                              : 0}%
                          </p>
                          <p className="text-xs text-muted-foreground">Конверсия</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {purchase.status === 'planned' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdatePurchase(purchase.id, { status: 'active' })}
                            >
                              Запустить
                            </Button>
                          )}
                          {purchase.status === 'active' && (
                            <Dialog>
                              <Button size="sm" variant="outline" onClick={() => {
                                const newSubs = prompt('Новых подписчиков:');
                                if (newSubs) {
                                  handleUpdatePurchase(purchase.id, { 
                                    new_subscribers: parseInt(newSubs) || 0,
                                    status: 'completed'
                                  });
                                }
                              }}>
                                Завершить
                              </Button>
                            </Dialog>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePurchase(purchase.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Rate Dialog */}
      <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить тариф</DialogTitle>
            <DialogDescription>Установите цену на рекламу для канала</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Канал *</Label>
              <Select value={rateForm.channel_id} onValueChange={v => setRateForm({ ...rateForm, channel_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите канал" />
                </SelectTrigger>
                <SelectContent>
                  {telegramChannels.map(ch => (
                    <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Формат *</Label>
                <Select value={rateForm.format} onValueChange={v => setRateForm({ ...rateForm, format: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {adFormats.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Цена (₽) *</Label>
                <Input 
                  type="number" 
                  value={rateForm.price} 
                  onChange={e => setRateForm({ ...rateForm, price: parseFloat(e.target.value) || 0 })} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Длительность (часов)</Label>
              <Input 
                type="number" 
                value={rateForm.duration_hours} 
                onChange={e => setRateForm({ ...rateForm, duration_hours: parseInt(e.target.value) || 24 })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea 
                value={rateForm.description} 
                onChange={e => setRateForm({ ...rateForm, description: e.target.value })} 
                placeholder="Дополнительные условия..."
              />
            </div>
            <Button onClick={handleAddRate} className="w-full">Добавить тариф</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Покупка рекламы</DialogTitle>
            <DialogDescription>Добавьте информацию о покупке рекламы в другом канале</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Название кампании *</Label>
              <Input 
                value={purchaseForm.name} 
                onChange={e => setPurchaseForm({ ...purchaseForm, name: e.target.value })} 
                placeholder="Реклама в канале X"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Канал где покупаем *</Label>
                <Input 
                  value={purchaseForm.target_channel} 
                  onChange={e => setPurchaseForm({ ...purchaseForm, target_channel: e.target.value })} 
                  placeholder="@channel или ссылка"
                />
              </div>
              <div className="space-y-2">
                <Label>Подписчиков в канале</Label>
                <Input 
                  type="number"
                  value={purchaseForm.target_subscribers} 
                  onChange={e => setPurchaseForm({ ...purchaseForm, target_subscribers: parseInt(e.target.value) || 0 })} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Наш канал (который рекламируем)</Label>
              <Select value={purchaseForm.our_channel_id} onValueChange={v => setPurchaseForm({ ...purchaseForm, our_channel_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите канал" />
                </SelectTrigger>
                <SelectContent>
                  {telegramChannels.map(ch => (
                    <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Стоимость (₽) *</Label>
                <Input 
                  type="number"
                  value={purchaseForm.cost} 
                  onChange={e => setPurchaseForm({ ...purchaseForm, cost: parseFloat(e.target.value) || 0 })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Подписчиков до рекламы</Label>
                <Input 
                  type="number"
                  value={purchaseForm.subscribers_before} 
                  onChange={e => setPurchaseForm({ ...purchaseForm, subscribers_before: parseInt(e.target.value) || 0 })} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ссылка в рекламе</Label>
              <Input 
                value={purchaseForm.ad_link} 
                onChange={e => setPurchaseForm({ ...purchaseForm, ad_link: e.target.value })} 
                placeholder="https://t.me/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Дата размещения</Label>
              <Input 
                type="datetime-local"
                value={purchaseForm.start_date} 
                onChange={e => setPurchaseForm({ ...purchaseForm, start_date: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Заметки</Label>
              <Textarea 
                value={purchaseForm.notes} 
                onChange={e => setPurchaseForm({ ...purchaseForm, notes: e.target.value })} 
                placeholder="Дополнительная информация..."
              />
            </div>
            <Button onClick={handleAddPurchase} className="w-full">Добавить покупку</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sale Dialog */}
      <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Продажа рекламы</DialogTitle>
            <DialogDescription>Добавьте информацию о продаже рекламы в вашем канале</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Канал *</Label>
              <Select value={saleForm.channel_id} onValueChange={v => setSaleForm({ ...saleForm, channel_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите канал" />
                </SelectTrigger>
                <SelectContent>
                  {telegramChannels.map(ch => (
                    <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Клиент/Рекламодатель *</Label>
              <Input 
                value={saleForm.client_name} 
                onChange={e => setSaleForm({ ...saleForm, client_name: e.target.value })} 
                placeholder="Название компании/канала"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Контакт клиента</Label>
                <Input 
                  value={saleForm.client_contact} 
                  onChange={e => setSaleForm({ ...saleForm, client_contact: e.target.value })} 
                  placeholder="@username или email"
                />
              </div>
              <div className="space-y-2">
                <Label>Стоимость (₽) *</Label>
                <Input 
                  type="number"
                  value={saleForm.price} 
                  onChange={e => setSaleForm({ ...saleForm, price: parseFloat(e.target.value) || 0 })} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Тариф</Label>
              <Select value={saleForm.rate_id} onValueChange={v => {
                const rate = rates.find(r => r.id === v);
                setSaleForm({ 
                  ...saleForm, 
                  rate_id: v,
                  price: rate?.price || saleForm.price 
                });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тариф (опционально)" />
                </SelectTrigger>
                <SelectContent>
                  {rates.filter(r => r.channel_id === saleForm.channel_id).map(rate => (
                    <SelectItem key={rate.id} value={rate.id}>
                      {adFormats.find(f => f.value === rate.format)?.label} - {formatCurrency(rate.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ссылка рекламодателя</Label>
              <Input 
                value={saleForm.ad_link} 
                onChange={e => setSaleForm({ ...saleForm, ad_link: e.target.value })} 
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Дата публикации</Label>
              <Input 
                type="datetime-local"
                value={saleForm.publish_date} 
                onChange={e => setSaleForm({ ...saleForm, publish_date: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Заметки</Label>
              <Textarea 
                value={saleForm.notes} 
                onChange={e => setSaleForm({ ...saleForm, notes: e.target.value })} 
                placeholder="Дополнительная информация..."
              />
            </div>
            <Button onClick={handleAddSale} className="w-full">Добавить продажу</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
