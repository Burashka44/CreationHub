-- Create admins table for storing admin contacts and telegram info
CREATE TABLE public.admins (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    telegram_chat_id TEXT,
    telegram_username TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    receive_notifications BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- For now, allow public access (user should add auth later for security)
CREATE POLICY "Allow public read access to admins" 
ON public.admins 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to admins" 
ON public.admins 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to admins" 
ON public.admins 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to admins" 
ON public.admins 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admins_updated_at
BEFORE UPDATE ON public.admins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Create table for Telegram bots
CREATE TABLE public.telegram_bots (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    token TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_bots ENABLE ROW LEVEL SECURITY;

-- RLS policies for public access (admin panel without auth for now)
CREATE POLICY "Allow public read access to telegram_bots" 
ON public.telegram_bots FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to telegram_bots" 
ON public.telegram_bots FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to telegram_bots" 
ON public.telegram_bots FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to telegram_bots" 
ON public.telegram_bots FOR DELETE 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_telegram_bots_updated_at
BEFORE UPDATE ON public.telegram_bots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for media channels
CREATE TABLE public.media_channels (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'rutube', 'telegram', 'max', 'vk')),
    channel_url TEXT,
    subscribers INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    engagement DECIMAL(5,2) DEFAULT 0,
    growth DECIMAL(5,2) DEFAULT 0,
    videos_count INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_channels ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow public read access to media_channels" 
ON public.media_channels FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to media_channels" 
ON public.media_channels FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to media_channels" 
ON public.media_channels FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to media_channels" 
ON public.media_channels FOR DELETE 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_media_channels_updated_at
BEFORE UPDATE ON public.media_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Add channel identifiers for API integration
ALTER TABLE public.media_channels 
ADD COLUMN IF NOT EXISTS channel_id TEXT,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;-- Add YouTube monetization and detailed stats columns
ALTER TABLE public.media_channels 
ADD COLUMN IF NOT EXISTS is_monetized boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS watch_hours integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_view_duration integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ctr numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS revenue numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares integer DEFAULT 0;

-- Create table for Telegram ad campaigns
CREATE TABLE public.telegram_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.media_channels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ad_text TEXT,
  ad_link TEXT,
  tracking_code TEXT UNIQUE,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  budget NUMERIC DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for ad click tracking
CREATE TABLE public.ad_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID REFERENCES public.telegram_ads(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT
);

-- Enable RLS
ALTER TABLE public.telegram_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

-- RLS policies for telegram_ads
CREATE POLICY "Allow public read access to telegram_ads" ON public.telegram_ads FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to telegram_ads" ON public.telegram_ads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to telegram_ads" ON public.telegram_ads FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to telegram_ads" ON public.telegram_ads FOR DELETE USING (true);

-- RLS policies for ad_clicks
CREATE POLICY "Allow public read access to ad_clicks" ON public.ad_clicks FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to ad_clicks" ON public.ad_clicks FOR INSERT WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_telegram_ads_updated_at
BEFORE UPDATE ON public.telegram_ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Тарифы на рекламу для каждого канала (продажа рекламы)
CREATE TABLE public.channel_ad_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES public.media_channels(id) ON DELETE CASCADE NOT NULL,
    format TEXT NOT NULL DEFAULT 'post', -- post, story, repost, mention
    price NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'RUB',
    duration_hours INTEGER DEFAULT 24,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Покупка рекламы (в чужих каналах)
CREATE TABLE public.ad_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    target_channel TEXT NOT NULL, -- Название/ссылка канала где покупаем рекламу
    target_subscribers INTEGER DEFAULT 0, -- Подписчики канала на момент покупки
    our_channel_id UUID REFERENCES public.media_channels(id) ON DELETE SET NULL, -- Наш канал который рекламируем
    ad_link TEXT, -- Ссылка в рекламе
    tracking_code TEXT, -- Код для отслеживания
    cost NUMERIC NOT NULL DEFAULT 0, -- Стоимость рекламы
    currency TEXT DEFAULT 'RUB',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    subscribers_before INTEGER DEFAULT 0, -- Подписчики до рекламы
    subscribers_after INTEGER DEFAULT 0, -- Подписчики после рекламы
    new_subscribers INTEGER DEFAULT 0, -- Новых подписчиков от рекламы
    clicks INTEGER DEFAULT 0, -- Переходов по ссылке
    status TEXT DEFAULT 'planned', -- planned, active, completed, cancelled
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Продажа рекламы (в наших каналах)
CREATE TABLE public.ad_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES public.media_channels(id) ON DELETE CASCADE NOT NULL,
    rate_id UUID REFERENCES public.channel_ad_rates(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL, -- Название клиента/рекламодателя
    client_contact TEXT, -- Контакт клиента
    ad_link TEXT, -- Ссылка рекламодателя
    tracking_code TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'RUB',
    publish_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, published, completed, cancelled
    is_paid BOOLEAN DEFAULT false,
    payment_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- RLS для channel_ad_rates
ALTER TABLE public.channel_ad_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to channel_ad_rates"
ON public.channel_ad_rates FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to channel_ad_rates"
ON public.channel_ad_rates FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to channel_ad_rates"
ON public.channel_ad_rates FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to channel_ad_rates"
ON public.channel_ad_rates FOR DELETE USING (true);

-- RLS для ad_purchases
ALTER TABLE public.ad_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to ad_purchases"
ON public.ad_purchases FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to ad_purchases"
ON public.ad_purchases FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to ad_purchases"
ON public.ad_purchases FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to ad_purchases"
ON public.ad_purchases FOR DELETE USING (true);

-- RLS для ad_sales
ALTER TABLE public.ad_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to ad_sales"
ON public.ad_sales FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to ad_sales"
ON public.ad_sales FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to ad_sales"
ON public.ad_sales FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to ad_sales"
ON public.ad_sales FOR DELETE USING (true);

-- Триггеры для updated_at
CREATE TRIGGER update_channel_ad_rates_updated_at
BEFORE UPDATE ON public.channel_ad_rates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_purchases_updated_at
BEFORE UPDATE ON public.ad_purchases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_sales_updated_at
BEFORE UPDATE ON public.ad_sales
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();