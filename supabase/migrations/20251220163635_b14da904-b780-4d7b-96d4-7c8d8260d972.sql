-- Create table for managed services
CREATE TABLE public.services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'admin',
    port TEXT NOT NULL,
    url TEXT,
    icon TEXT DEFAULT 'server',
    is_active BOOLEAN NOT NULL DEFAULT true,
    status TEXT DEFAULT 'unknown',
    last_check_at TIMESTAMPTZ,
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Allow public access (services are not user-specific)
CREATE POLICY "Allow public read access to services" 
ON public.services 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to services" 
ON public.services 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to services" 
ON public.services 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to services" 
ON public.services 
FOR DELETE 
USING (true);

-- Create table for service uptime history
CREATE TABLE public.service_uptime (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    response_time_ms INTEGER,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_uptime ENABLE ROW LEVEL SECURITY;

-- Allow public access
CREATE POLICY "Allow public read access to service_uptime" 
ON public.service_uptime 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to service_uptime" 
ON public.service_uptime 
FOR INSERT 
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_service_uptime_service_id ON public.service_uptime(service_id);
CREATE INDEX idx_service_uptime_checked_at ON public.service_uptime(checked_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default services
INSERT INTO public.services (name, description, category, port, icon) VALUES
('Portainer', 'Docker management', 'admin', '9000', 'container'),
('Nginx Proxy Manager', 'Reverse proxy', 'admin', '81', 'shield'),
('Glances', 'System monitor', 'admin', '61208', 'activity'),
('WireGuard', 'VPN server', 'admin', '51820', 'key'),
('Adminer', 'Database management', 'admin', '8080', 'database'),
('Healthchecks', 'Uptime monitoring', 'admin', '8000', 'bell'),
('Dozzle', 'Log viewer', 'admin', '8081', 'terminal'),
('n8n', 'Workflow automation', 'work', '5678', 'workflow'),
('yt-dlp', 'Video downloader', 'work', '8080', 'youtube'),
('Whisper', 'Speech to text', 'work', '9000', 'mic'),
('Browserless', 'Headless Chrome', 'work', '3000', 'chrome'),
('RSSHub', 'RSS generator', 'work', '1200', 'rss'),
('LibreTranslate', 'Translation API', 'work', '5000', 'languages'),
('Grafana', 'Analytics', 'data', '3000', 'bar-chart-3'),
('Nextcloud', 'Cloud storage', 'data', '8083', 'cloud'),
('File Browser', 'File manager', 'data', '8082', 'folder-open');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;