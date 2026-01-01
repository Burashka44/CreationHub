-- Migration: Create remaining missing tables
-- Tables defined in types.ts but not yet in database

-- 1. DNS Configs
CREATE TABLE IF NOT EXISTS public.dns_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    primary_dns TEXT NOT NULL,
    secondary_dns TEXT,
    dns_type TEXT DEFAULT 'standard',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.dns_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to dns_configs" ON public.dns_configs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to dns_configs" ON public.dns_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to dns_configs" ON public.dns_configs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to dns_configs" ON public.dns_configs FOR DELETE USING (true);

-- 2. VPN Profiles
CREATE TABLE IF NOT EXISTS public.vpn_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    endpoint TEXT,
    dns TEXT,
    allowed_ips TEXT,
    private_key TEXT,
    public_key TEXT,
    config_content TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.vpn_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to vpn_profiles" ON public.vpn_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to vpn_profiles" ON public.vpn_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to vpn_profiles" ON public.vpn_profiles FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to vpn_profiles" ON public.vpn_profiles FOR DELETE USING (true);

-- 3. Monitored Hosts
CREATE TABLE IF NOT EXISTS public.monitored_hosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    check_type TEXT DEFAULT 'ping',
    is_active BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'unknown',
    last_check_at TIMESTAMPTZ,
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.monitored_hosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to monitored_hosts" ON public.monitored_hosts FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to monitored_hosts" ON public.monitored_hosts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to monitored_hosts" ON public.monitored_hosts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to monitored_hosts" ON public.monitored_hosts FOR DELETE USING (true);

-- 4. Host Check History
CREATE TABLE IF NOT EXISTS public.host_check_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES public.monitored_hosts(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    response_time_ms INTEGER,
    packet_loss NUMERIC,
    checked_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.host_check_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to host_check_history" ON public.host_check_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to host_check_history" ON public.host_check_history FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_host_check_history_host_id ON public.host_check_history(host_id);
CREATE INDEX IF NOT EXISTS idx_host_check_history_checked_at ON public.host_check_history(checked_at DESC);

-- 5. Network Traffic (for TrafficStats)
CREATE TABLE IF NOT EXISTS public.network_traffic (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interface_name TEXT,
    rx_bytes BIGINT,
    tx_bytes BIGINT,
    rx_rate BIGINT,
    tx_rate BIGINT,
    recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.network_traffic ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to network_traffic" ON public.network_traffic FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to network_traffic" ON public.network_traffic FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_network_traffic_recorded_at ON public.network_traffic(recorded_at DESC);

-- 6. App Settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to app_settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to app_settings" ON public.app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to app_settings" ON public.app_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to app_settings" ON public.app_settings FOR DELETE USING (true);

-- 7. AI Requests
CREATE TABLE IF NOT EXISTS public.ai_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type TEXT NOT NULL,
    input_data JSONB DEFAULT '{}',
    output_data JSONB,
    model TEXT,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    completed_at TIMESTAMPTZ
);

ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to ai_requests" ON public.ai_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to ai_requests" ON public.ai_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to ai_requests" ON public.ai_requests FOR UPDATE USING (true);
