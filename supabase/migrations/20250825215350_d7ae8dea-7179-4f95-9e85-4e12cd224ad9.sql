-- Create scheduled_calls table for call scheduling
CREATE TABLE IF NOT EXISTS public.scheduled_calls (
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

-- Create task_assignments table for task management
CREATE TABLE IF NOT EXISTS public.task_assignments (
  id text PRIMARY KEY,
  assignee_id uuid NOT NULL,
  assignee_name text NOT NULL,
  assignee_email text,
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date timestamp with time zone,
  project_id uuid,
  related_id uuid,
  action_type text NOT NULL,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.scheduled_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for scheduled_calls
CREATE POLICY "Users can view their own scheduled calls" 
ON public.scheduled_calls 
FOR SELECT 
USING (recipient_id = auth.uid());

CREATE POLICY "Authenticated users can insert scheduled calls" 
ON public.scheduled_calls 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own scheduled calls" 
ON public.scheduled_calls 
FOR UPDATE 
USING (recipient_id = auth.uid());

-- Create RLS policies for task_assignments
CREATE POLICY "Users can view their own task assignments" 
ON public.task_assignments 
FOR SELECT 
USING (assignee_id = auth.uid());

CREATE POLICY "Authenticated users can insert task assignments" 
ON public.task_assignments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own task assignments" 
ON public.task_assignments 
FOR UPDATE 
USING (assignee_id = auth.uid());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_scheduled_calls_updated_at
  BEFORE UPDATE ON public.scheduled_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_assignments_updated_at
  BEFORE UPDATE ON public.task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();