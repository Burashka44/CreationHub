-- Add YouTube monetization and detailed stats columns
ALTER TABLE public.media_channels 
ADD COLUMN IF NOT EXISTS is_monetized boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS watch_hours integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_view_duration integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ctr numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS revenue numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares integer DEFAULT 0;

-- Create table for Telegram ad campaigns
CREATE TABLE public.telegram_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.media_channels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ad_text TEXT,
  ad_link TEXT,
  tracking_code TEXT UNIQUE,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  budget NUMERIC DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for ad click tracking
CREATE TABLE public.ad_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID REFERENCES public.telegram_ads(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT
);

-- Enable RLS
ALTER TABLE public.telegram_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

-- RLS policies for telegram_ads
CREATE POLICY "Allow public read access to telegram_ads" ON public.telegram_ads FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to telegram_ads" ON public.telegram_ads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to telegram_ads" ON public.telegram_ads FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to telegram_ads" ON public.telegram_ads FOR DELETE USING (true);

-- RLS policies for ad_clicks
CREATE POLICY "Allow public read access to ad_clicks" ON public.ad_clicks FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to ad_clicks" ON public.ad_clicks FOR INSERT WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_telegram_ads_updated_at
BEFORE UPDATE ON public.telegram_ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();