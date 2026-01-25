-- Enable pgcrypto for UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. ADMINS & AUTH
-- ============================================
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- For local auth
    name TEXT NOT NULL,
    phone TEXT,
    telegram_chat_id TEXT,
    telegram_username TEXT,
    role TEXT DEFAULT 'admin', -- admin, superadmin
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    receive_notifications BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to admins" ON public.admins FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to admins" ON public.admins FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to admins" ON public.admins FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to admins" ON public.admins FOR DELETE USING (true);

-- ============================================
-- 2. TELEGRAM BOTS & ADS
-- ============================================
CREATE TABLE IF NOT EXISTS public.telegram_bots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    token TEXT NOT NULL,
    username TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.telegram_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID REFERENCES telegram_bots(id), -- Optional connection to bot
    channel_id UUID, -- Will define foreign key later if needed
    name TEXT NOT NULL,
    title TEXT,
    content TEXT, -- Ad text
    ad_link TEXT,
    image_url TEXT, 
    tracking_code TEXT UNIQUE,
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    budget NUMERIC DEFAULT 0,
    spent NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'draft',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ad_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID REFERENCES public.telegram_ads(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    clicked_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.telegram_bots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all bots" ON public.telegram_bots FOR ALL USING (true);

ALTER TABLE public.telegram_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all ads" ON public.telegram_ads FOR ALL USING (true);

ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all clicks" ON public.ad_clicks FOR ALL USING (true);

-- ============================================
-- 3. MEDIA CHANNELS & PLATFORM ANALYTICS
-- ============================================
CREATE TABLE IF NOT EXISTS public.media_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'rutube', 'telegram', 'max', 'vk')),
    channel_id TEXT, -- External ID (e.g. UC...)
    username TEXT, -- @username
    channel_url TEXT,
    
    -- Stats
    subscribers INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    engagement DECIMAL(5,2) DEFAULT 0,
    growth DECIMAL(5,2) DEFAULT 0,
    videos_count INTEGER DEFAULT 0,
    
    -- Monetization
    is_monetized BOOLEAN DEFAULT false,
    watch_hours INTEGER DEFAULT 0,
    avg_view_duration INTEGER DEFAULT 0,
    ctr NUMERIC DEFAULT 0,
    revenue NUMERIC DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Link telegram_ads to media_channels if needed
ALTER TABLE public.telegram_ads 
ADD CONSTRAINT fk_telegram_ads_channel 
FOREIGN KEY (channel_id) REFERENCES public.media_channels(id) ON DELETE CASCADE;

-- RLS
ALTER TABLE public.media_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all channels" ON public.media_channels FOR ALL USING (true);

-- ============================================
-- 4. AD MARKETPLACE (Sales & Purchases)
-- ============================================
CREATE TABLE IF NOT EXISTS public.channel_ad_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES public.media_channels(id) ON DELETE CASCADE,
    format TEXT DEFAULT 'post', -- post, story, repost
    price NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'RUB',
    duration_hours INTEGER DEFAULT 24,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ad_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES public.media_channels(id) ON DELETE CASCADE,
    rate_id UUID REFERENCES public.channel_ad_rates(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_contact TEXT,
    ad_link TEXT,
    tracking_code TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'RUB',
    publish_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    is_paid BOOLEAN DEFAULT false,
    payment_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ad_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    target_channel TEXT NOT NULL,
    target_subscribers INTEGER DEFAULT 0,
    our_channel_id UUID REFERENCES public.media_channels(id) ON DELETE SET NULL,
    ad_link TEXT,
    tracking_code TEXT,
    cost NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'RUB',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    subscribers_before INTEGER DEFAULT 0,
    subscribers_after INTEGER DEFAULT 0,
    new_subscribers INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    status TEXT DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.channel_ad_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all rates" ON public.channel_ad_rates FOR ALL USING (true);

ALTER TABLE public.ad_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all sales" ON public.ad_sales FOR ALL USING (true);

ALTER TABLE public.ad_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all purchases" ON public.ad_purchases FOR ALL USING (true);

-- ============================================
-- 5. INFRASTRUCTURE & SERVICES
-- ============================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'admin',
    port TEXT NOT NULL,
    url TEXT,
    icon TEXT DEFAULT 'server',
    is_active BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'unknown',
    last_check_at TIMESTAMPTZ,
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_uptime (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    response_time_ms INTEGER,
    checked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_uptime_service_id ON public.service_uptime(service_id);
CREATE INDEX IF NOT EXISTS idx_service_uptime_checked_at ON public.service_uptime(checked_at DESC);

-- RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all services" ON public.services FOR ALL USING (true);

ALTER TABLE public.service_uptime ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all uptime" ON public.service_uptime FOR ALL USING (true);

-- ============================================
-- 6. SYSTEM METRICS (Glances history)
-- ============================================
CREATE TABLE IF NOT EXISTS public.system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpu_percent REAL,
    ram_percent REAL,
    net_rx_bytes BIGINT,
    net_tx_bytes BIGINT,
    timestamp TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON public.system_metrics(timestamp DESC);

ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all metrics" ON public.system_metrics FOR ALL USING (true);

-- ============================================
-- 7. APP SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all app_settings" ON public.app_settings FOR ALL USING (true);

-- ============================================
-- 8. FIREWALL RULES
-- ============================================
CREATE TABLE IF NOT EXISTS public.firewall_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port TEXT NOT NULL,
    from_ip TEXT DEFAULT 'LAN',
    protocol TEXT DEFAULT 'tcp',
    comment TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.firewall_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all firewall_rules" ON public.firewall_rules FOR ALL USING (true);

-- ============================================
-- 9. NETWORK TRAFFIC
-- ============================================
CREATE TABLE IF NOT EXISTS public.network_traffic (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interface TEXT,
    rx_bytes BIGINT,
    tx_bytes BIGINT,
    recorded_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_network_traffic_recorded_at ON public.network_traffic(recorded_at DESC);

ALTER TABLE public.network_traffic ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all network_traffic" ON public.network_traffic FOR ALL USING (true);

-- ============================================
-- 10. BACKUPS
-- ============================================
CREATE TABLE IF NOT EXISTS public.backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    size_bytes BIGINT,
    path TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all backups" ON public.backups FOR ALL USING (true);

-- ============================================
-- 11. SECURITY SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ufw_status TEXT DEFAULT 'unknown',
    fail2ban_status TEXT DEFAULT 'unknown',
    ssh_port INTEGER DEFAULT 22,
    last_check_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all security_settings" ON public.security_settings FOR ALL USING (true);

-- ============================================
-- 12. VPN PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS public.vpn_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    config TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.vpn_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all vpn_profiles" ON public.vpn_profiles FOR ALL USING (true);

-- ============================================
-- 13. DNS CONFIGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.dns_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    primary_dns TEXT,
    secondary_dns TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dns_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all dns_configs" ON public.dns_configs FOR ALL USING (true);

-- ============================================
-- 7. AI REQUESTS LOG
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

-- RLS
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all ai_requests" ON public.ai_requests FOR ALL USING (true);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'admins', 'telegram_bots', 'telegram_ads', 'media_channels',
        'channel_ad_rates', 'ad_sales', 'ad_purchases', 'services',
        'app_settings', 'firewall_rules', 'security_settings', 'vpn_profiles', 'dns_configs'
    ])
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%s', tbl, tbl);
        EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', tbl, tbl);
    END LOOP;
END $$;

-- ============================================
-- DEFAULT DATA
-- ============================================
-- Services
INSERT INTO public.services (name, description, category, port, icon) 
VALUES
('Portainer', 'Docker management', 'admin', '9000', 'container'),
('Nginx Proxy Manager', 'Reverse proxy', 'admin', '81', 'shield'),
('Glances', 'System monitor', 'admin', '61208', 'activity'),
('WireGuard', 'VPN server', 'admin', '51820', 'key'),
('Adminer', 'Database management', 'admin', '8083', 'database'),
('Dozzle', 'Log viewer', 'admin', '8888', 'terminal'),
('n8n', 'Workflow automation', 'work', '5678', 'workflow'),
('yt-dlp', 'Video downloader', 'work', '8084', 'youtube'),
('AI Translate', 'LibreTranslate API', 'AI Studio', '5000', 'languages'),
('IOPaint', 'AI Inpainting', 'AI Studio', '8585', 'eraser'),
('SAM 2', 'Segment Anything', 'AI Studio', '8787', 'scan'),
('Video Processor', 'FFmpeg Pipeline', 'AI Studio', '8686', 'video')
ON CONFLICT DO NOTHING;

-- Default Admin (password: admin) - This requires application logic to hash 'admin'
-- Or we insert a pre-hashed password if we know the algorithm.
-- For now, we leave password_hash empty and let the user set it via UI/API.
INSERT INTO public.admins (email, name, role)
VALUES ('admin@example.com', 'Admin User', 'superadmin')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 14. ACTIVITY LOGS (Missing from previous dumps)
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_key TEXT,
    target TEXT,
    user_name TEXT,
    activity_type TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    description TEXT,
    metadata JSONB
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated logs" ON public.activity_logs TO authenticated USING (true);
CREATE POLICY "anon_select_logs" ON public.activity_logs FOR SELECT TO anon USING (true);

-- ============================================
-- 15. MAINTENANCE FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    DELETE FROM system_metrics WHERE timestamp < now() - interval '7 days';
    DELETE FROM network_traffic WHERE recorded_at < now() - interval '7 days';
    DELETE FROM disk_snapshots WHERE timestamp < now() - interval '7 days';
END;
$function$;
