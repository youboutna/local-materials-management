-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION btp.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled_calls table for call scheduling  
CREATE TABLE IF NOT EXISTS btp.scheduled_calls (
  id text PRIMARY KEY,
  recipient_id uuid NOT NULL,
  recipient_phone text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  scheduled_for timestamp with time zone NOT NULL,
  action_type text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'failed')),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
