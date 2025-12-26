-- Missing tables for CreationHub Dashboard - Complete Schema Fix
-- Run: docker exec -i creationhub-postgres psql -U postgres < fix_missing_tables.sql

-- ============================================
-- ADMINS
-- ============================================
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'admin',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TELEGRAM
-- ============================================
CREATE TABLE IF NOT EXISTS public.telegram_bots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    token TEXT,
    username TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.telegram_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID REFERENCES telegram_bots(id),
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'draft',
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- MEDIA
-- ============================================
CREATE TABLE IF NOT EXISTS public.media_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    platform TEXT DEFAULT 'youtube',
    channel_id TEXT,
    subscribers INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.channel_ad_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES media_channels(id),
    ad_type TEXT,
    price DECIMAL(10,2),
    duration_days INTEGER DEFAULT 7,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- AD SYSTEM
-- ============================================
CREATE TABLE IF NOT EXISTS public.ad_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID,
    buyer_name TEXT,
    amount DECIMAL(10,2),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ad_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID,
    seller_name TEXT,
    amount DECIMAL(10,2),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ad_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID,
    ip_address TEXT,
    user_agent TEXT,
    clicked_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- AI REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model TEXT DEFAULT 'gpt-4',
    prompt TEXT,
    response TEXT,
    tokens_used INTEGER DEFAULT 0,
    cost DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SERVICE UPTIME
-- ============================================
CREATE TABLE IF NOT EXISTS public.service_uptime (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id),
    status TEXT DEFAULT 'unknown',
    response_time_ms INTEGER,
    checked_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ENABLE RLS FOR ALL NEW TABLES
-- ============================================
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'admins', 'telegram_bots', 'telegram_ads', 'media_channels',
        'channel_ad_rates', 'ad_sales', 'ad_purchases', 'ad_clicks',
        'ai_requests', 'service_uptime'
    ])
    LOOP
        EXECUTE format('ALTER TABLE public.%s ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_%s" ON public.%s', tbl, tbl);
        EXECUTE format('CREATE POLICY "allow_all_%s" ON public.%s FOR ALL USING (true) WITH CHECK (true)', tbl, tbl);
    END LOOP;
END $$;

SELECT 'All 10 missing tables created successfully!' as result;
