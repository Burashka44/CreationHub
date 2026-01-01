-- Missing tables for CreationHub Dashboard
-- Run this on creationhub-postgres to fix all pages

-- ============================================
-- SECURITY TABLES
-- ============================================

-- Security settings (realtime data from system)
CREATE TABLE IF NOT EXISTS public.security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Firewall rules
CREATE TABLE IF NOT EXISTS public.firewall_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port TEXT NOT NULL,
    protocol TEXT DEFAULT 'tcp',
    action TEXT DEFAULT 'ALLOW',
    from_ip TEXT DEFAULT 'Anywhere',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- NETWORK TABLES
-- ============================================

-- VPN profiles (WireGuard)
CREATE TABLE IF NOT EXISTS public.vpn_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    server TEXT,
    private_key TEXT,
    public_key TEXT,
    address TEXT,
    dns TEXT,
    endpoint TEXT,
    allowed_ips TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- DNS configurations
CREATE TABLE IF NOT EXISTS public.dns_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nameserver TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Monitored hosts
CREATE TABLE IF NOT EXISTS public.monitored_hosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ip TEXT NOT NULL,
    port INTEGER DEFAULT 80,
    description TEXT,
    status TEXT DEFAULT 'unknown',
    last_check_at TIMESTAMPTZ,
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Network traffic history
CREATE TABLE IF NOT EXISTS public.network_traffic (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interface TEXT,
    rx_bytes BIGINT,
    tx_bytes BIGINT,
    rx_speed REAL,
    tx_speed REAL,
    recorded_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SYSTEM METRICS (for performance history)
-- ============================================

CREATE TABLE IF NOT EXISTS public.system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpu_percent REAL,
    memory_percent REAL,
    disk_percent REAL,
    network_rx BIGINT,
    network_tx BIGINT,
    temperature REAL,
    recorded_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS POLICIES (allow public access)
-- ============================================

ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firewall_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vpn_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dns_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitored_hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_traffic ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for all tables
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'security_settings', 'firewall_rules', 'activity_logs',
        'vpn_profiles', 'dns_configs', 'monitored_hosts', 'network_traffic',
        'app_settings', 'system_metrics'
    ])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_select_%s" ON public.%s', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_insert_%s" ON public.%s', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_update_%s" ON public.%s', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_delete_%s" ON public.%s', tbl, tbl);
        
        EXECUTE format('CREATE POLICY "allow_all_select_%s" ON public.%s FOR SELECT USING (true)', tbl, tbl);
        EXECUTE format('CREATE POLICY "allow_all_insert_%s" ON public.%s FOR INSERT WITH CHECK (true)', tbl, tbl);
        EXECUTE format('CREATE POLICY "allow_all_update_%s" ON public.%s FOR UPDATE USING (true)', tbl, tbl);
        EXECUTE format('CREATE POLICY "allow_all_delete_%s" ON public.%s FOR DELETE USING (true)', tbl, tbl);
    END LOOP;
END $$;

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default app settings
INSERT INTO public.app_settings (key, value) VALUES
('security', '{"twoFactor": false, "autoLock": 5, "ipWhitelist": []}'::jsonb),
('notifications', '{"email": true, "telegram": false, "slack": false}'::jsonb),
('appearance', '{"theme": "dark", "language": "ru"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Insert sample security settings
INSERT INTO public.security_settings (setting_key, setting_value) VALUES
('realtime', '{"ufw": {"status": "active", "rules": 15}, "fail2ban": {"status": "active", "jails": 3, "banned": 0}, "updates": 0}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert sample DNS configs
INSERT INTO public.dns_configs (name, nameserver, is_active) VALUES
('Google DNS', '8.8.8.8', false),
('Cloudflare DNS', '1.1.1.1', false),
('Local DNS', '192.168.1.1', true)
ON CONFLICT DO NOTHING;

SELECT 'All tables created successfully!' as result;
