-- Create activity_logs table for dashboard activity log
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_key TEXT NOT NULL,
    target TEXT,
    user_name TEXT DEFAULT 'System',
    activity_type TEXT DEFAULT 'server', -- user, server, database, security, settings
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to activity_logs" ON public.activity_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to activity_logs" ON public.activity_logs FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Insert some initial activity entries so the log isn't empty
INSERT INTO public.activity_logs (action_key, target, user_name, activity_type) VALUES
('serviceStarted', 'PostgREST', 'System', 'server'),
('configUpdated', 'Docker Network', 'Admin', 'settings'),
('databaseMigration', '9 tables created', 'System', 'database'),
('serviceStarted', 'Stats Recorder', 'System', 'server');

-- Create disk_snapshots table for persistent disk data
CREATE TABLE IF NOT EXISTS public.disk_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mount_point TEXT NOT NULL,
    used_bytes BIGINT,
    total_bytes BIGINT,
    percent NUMERIC,
    fs_type TEXT,
    recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.disk_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to disk_snapshots" ON public.disk_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to disk_snapshots" ON public.disk_snapshots FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_disk_snapshots_recorded_at ON public.disk_snapshots(recorded_at DESC);

-- Add service status cache column to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS last_status_update TIMESTAMPTZ;

-- Create function to clean up old data (older than 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete system_metrics older than 7 days
    DELETE FROM public.system_metrics WHERE timestamp < NOW() - INTERVAL '7 days';
    
    -- Delete activity_logs older than 30 days
    DELETE FROM public.activity_logs WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete disk_snapshots older than 7 days
    DELETE FROM public.disk_snapshots WHERE recorded_at < NOW() - INTERVAL '7 days';
    
    -- Delete network_traffic older than 7 days
    DELETE FROM public.network_traffic WHERE recorded_at < NOW() - INTERVAL '7 days';
    
    -- Delete service_uptime older than 7 days
    DELETE FROM public.service_uptime WHERE checked_at < NOW() - INTERVAL '7 days';
    
    -- Delete host_check_history older than 7 days
    DELETE FROM public.host_check_history WHERE checked_at < NOW() - INTERVAL '7 days';
END;
$$;
