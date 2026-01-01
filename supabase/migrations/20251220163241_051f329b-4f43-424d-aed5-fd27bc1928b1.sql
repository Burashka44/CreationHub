-- Create table for system metrics history
CREATE TABLE public.system_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    cpu_percent NUMERIC(5,2),
    ram_percent NUMERIC(5,2),
    disk_percent NUMERIC(5,2),
    cpu_temp NUMERIC(5,2),
    gpu_temp NUMERIC(5,2),
    net_rx_bytes BIGINT DEFAULT 0,
    net_tx_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- Allow public read access (monitoring data is not sensitive)
CREATE POLICY "Allow public read access to system_metrics" 
ON public.system_metrics 
FOR SELECT 
USING (true);

-- Allow public insert (for stats recorder)
CREATE POLICY "Allow public insert access to system_metrics" 
ON public.system_metrics 
FOR INSERT 
WITH CHECK (true);

-- Create index for efficient time-based queries
CREATE INDEX idx_system_metrics_timestamp ON public.system_metrics(timestamp DESC);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_metrics;