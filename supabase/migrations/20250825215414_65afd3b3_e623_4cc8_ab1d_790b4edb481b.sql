-- Create scheduled_calls table for call scheduling  
/**CREATE TABLE IF NOT EXISTS btp.scheduled_calls (
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


-- Enable RLS on scheduled_calls table
ALTER TABLE btp.scheduled_calls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for scheduled_calls
CREATE POLICY "Users can view their own scheduled calls" 
ON btp.scheduled_calls 
FOR SELECT 
USING (recipient_id = auth.uid());

CREATE POLICY "Authenticated users can insert scheduled calls" 
ON btp.scheduled_calls 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own scheduled calls" 
ON btp.scheduled_calls 
FOR UPDATE 
USING (recipient_id = auth.uid());

-- Create trigger for automatic timestamp updates on scheduled_calls
CREATE TRIGGER update_scheduled_calls_updated_at
  BEFORE UPDATE ON btp.scheduled_calls
  FOR EACH ROW
  EXECUTE FUNCTION btp.update_updated_at_column();

  **/