-- Create system_settings table for configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  configuration JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category, key)
);

-- Create processing_logs table for tracking batch processing
CREATE TABLE IF NOT EXISTS public.processing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  process_type TEXT NOT NULL,
  summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for system_settings
CREATE POLICY "Admins can manage system settings"
ON public.system_settings
FOR ALL
USING (is_current_user_admin());

-- RLS policies for processing_logs
CREATE POLICY "Admins can view processing logs"
ON public.processing_logs
FOR SELECT
USING (is_current_user_admin());

CREATE POLICY "System can insert processing logs"
ON public.processing_logs
FOR INSERT
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default alerts processor configuration
INSERT INTO public.system_settings (category, key, configuration)
VALUES (
  'alerts_processor',
  'configuration',
  '{
    "enabled": false,
    "batchSize": 10,
    "intervalMinutes": 60,
    "maxRetries": 3
  }'::jsonb
)
ON CONFLICT (category, key) DO NOTHING;