-- Create table for Telegram bots
CREATE TABLE public.telegram_bots (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    token TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_bots ENABLE ROW LEVEL SECURITY;

-- RLS policies for public access (admin panel without auth for now)
CREATE POLICY "Allow public read access to telegram_bots" 
ON public.telegram_bots FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to telegram_bots" 
ON public.telegram_bots FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to telegram_bots" 
ON public.telegram_bots FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to telegram_bots" 
ON public.telegram_bots FOR DELETE 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_telegram_bots_updated_at
BEFORE UPDATE ON public.telegram_bots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for media channels
CREATE TABLE public.media_channels (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'rutube', 'telegram', 'max', 'vk')),
    channel_url TEXT,
    subscribers INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    engagement DECIMAL(5,2) DEFAULT 0,
    growth DECIMAL(5,2) DEFAULT 0,
    videos_count INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_channels ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow public read access to media_channels" 
ON public.media_channels FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to media_channels" 
ON public.media_channels FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to media_channels" 
ON public.media_channels FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to media_channels" 
ON public.media_channels FOR DELETE 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_media_channels_updated_at
BEFORE UPDATE ON public.media_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();