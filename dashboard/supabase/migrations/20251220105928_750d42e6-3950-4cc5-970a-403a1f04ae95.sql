-- Create admins table for storing admin contacts and telegram info
CREATE TABLE public.admins (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    telegram_chat_id TEXT,
    telegram_username TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    receive_notifications BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- For now, allow public access (user should add auth later for security)
CREATE POLICY "Allow public read access to admins" 
ON public.admins 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to admins" 
ON public.admins 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to admins" 
ON public.admins 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to admins" 
ON public.admins 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admins_updated_at
BEFORE UPDATE ON public.admins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();