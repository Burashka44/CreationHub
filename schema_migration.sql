-- Migrate Admins
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS telegram_username TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS receive_notifications BOOLEAN DEFAULT true;

-- Ensure constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admins_email_key') THEN
        ALTER TABLE public.admins ADD CONSTRAINT admins_email_key UNIQUE (email);
    END IF;
END $$;

-- Fix Media Channels
ALTER TABLE public.media_channels ADD COLUMN IF NOT EXISTS channel_id TEXT;
ALTER TABLE public.media_channels ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.media_channels ADD COLUMN IF NOT EXISTS is_monetized BOOLEAN DEFAULT false;
ALTER TABLE public.media_channels ADD COLUMN IF NOT EXISTS watch_hours INTEGER DEFAULT 0;
ALTER TABLE public.media_channels ADD COLUMN IF NOT EXISTS revenue NUMERIC DEFAULT 0;

-- Fix Services (port type mismatch fix: text vs integer)
ALTER TABLE public.services ALTER COLUMN port TYPE TEXT;

-- Enable pgcrypto if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
