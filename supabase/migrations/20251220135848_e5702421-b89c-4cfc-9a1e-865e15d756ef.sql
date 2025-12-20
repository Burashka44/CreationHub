-- Create ai_requests table for storing AI request history
CREATE TABLE public.ai_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_type TEXT NOT NULL,
  input_data JSONB NOT NULL DEFAULT '{}',
  output_data JSONB,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;

-- Create public access policies (no auth required for this admin dashboard)
CREATE POLICY "Allow public read access to ai_requests" 
ON public.ai_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to ai_requests" 
ON public.ai_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to ai_requests" 
ON public.ai_requests 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to ai_requests" 
ON public.ai_requests 
FOR DELETE 
USING (true);

-- Add index for faster queries
CREATE INDEX idx_ai_requests_created_at ON public.ai_requests(created_at DESC);
CREATE INDEX idx_ai_requests_type ON public.ai_requests(request_type);