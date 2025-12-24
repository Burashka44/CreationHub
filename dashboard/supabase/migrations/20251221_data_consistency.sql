-- Create backups table for BackupStatus component
CREATE TABLE IF NOT EXISTS public.backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_key TEXT NOT NULL,
    backup_type TEXT DEFAULT 'local', -- local, cloud
    size_bytes BIGINT DEFAULT 0,
    status TEXT DEFAULT 'completed', -- completed, in-progress, failed
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to backups" ON public.backups FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to backups" ON public.backups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to backups" ON public.backups FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to backups" ON public.backups FOR DELETE USING (true);

-- Insert sample backup entries
INSERT INTO public.backups (name_key, backup_type, size_bytes, status, completed_at) VALUES
('fullSystemBackup', 'local', 13312000000, 'completed', NOW()),
('databaseBackup', 'local', 2252000000, 'completed', NOW()),
('mediaFiles', 'cloud', 9344000000, 'in-progress', NULL),
('configBackup', 'local', 163577856, 'completed', NOW() - INTERVAL '1 day');

-- Create security_settings table for SecurityStatus persistence
CREATE TABLE IF NOT EXISTS public.security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to security_settings" ON public.security_settings FOR ALL USING (true);

-- Insert default security settings
INSERT INTO public.security_settings (setting_key, setting_value) VALUES
('checks', '{"firewallActive": "ok", "sslCertificate": "unknown", "ddosProtection": "ok", "malwareScan": "ok", "failedLoginAttempts": "ok", "twoFactorAuth": "unknown"}'),
('score', '{"value": 75}')
ON CONFLICT (setting_key) DO NOTHING;

-- Add online status tracking to admins
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS online_status TEXT DEFAULT 'offline';
