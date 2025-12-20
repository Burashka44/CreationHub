-- Тарифы на рекламу для каждого канала (продажа рекламы)
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