#!/bin/bash
# Fix CreationHub Services - Run this on the server

echo "🔧 Fixing CreationHub Services..."

# 1. Create services table if not exists
echo "📊 Creating services table..."
docker exec creationhub-postgres psql -U postgres -c "
CREATE TABLE IF NOT EXISTS public.services (
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS \"Allow public read access to services\" ON public.services;
DROP POLICY IF EXISTS \"Allow public insert access to services\" ON public.services;
DROP POLICY IF EXISTS \"Allow public update access to services\" ON public.services;
DROP POLICY IF EXISTS \"Allow public delete access to services\" ON public.services;

-- Create policies
CREATE POLICY \"Allow public read access to services\" ON public.services FOR SELECT USING (true);
CREATE POLICY \"Allow public insert access to services\" ON public.services FOR INSERT WITH CHECK (true);
CREATE POLICY \"Allow public update access to services\" ON public.services FOR UPDATE USING (true);
CREATE POLICY \"Allow public delete access to services\" ON public.services FOR DELETE USING (true);
"

# 2. Insert default services (only if table is empty)
echo "📝 Inserting default services..."
docker exec creationhub-postgres psql -U postgres -c "
INSERT INTO public.services (name, description, category, port, icon)
SELECT * FROM (VALUES
  ('Portainer', 'Docker management', 'admin', '9000', 'container'),
  ('Nginx Proxy Manager', 'Reverse proxy', 'admin', '81', 'shield'),
  ('Glances', 'System monitor', 'admin', '61208', 'activity'),
  ('WireGuard', 'VPN server', 'admin', '51820', 'key'),
  ('Adminer', 'Database management', 'admin', '8080', 'database'),
  ('Dozzle', 'Log viewer', 'admin', '8081', 'terminal'),
  ('n8n', 'Workflow automation', 'work', '5678', 'workflow'),
  ('Grafana', 'Analytics', 'data', '3000', 'bar-chart-3'),
  ('Nextcloud', 'Cloud storage', 'data', '8083', 'cloud'),
  ('File Browser', 'File manager', 'data', '8082', 'folder-open')
) AS t(name, description, category, port, icon)
WHERE NOT EXISTS (SELECT 1 FROM public.services LIMIT 1);
"

# 3. Reload PostgREST schema cache
echo "🔄 Reloading PostgREST..."
docker kill -s SIGUSR1 creationhub_api 2>/dev/null || docker restart creationhub_api

# 4. Verify
echo "✅ Checking services..."
docker exec creationhub-postgres psql -U postgres -c "SELECT name, category, port FROM services;"

echo ""
echo "🎉 Done! Refresh your dashboard."
