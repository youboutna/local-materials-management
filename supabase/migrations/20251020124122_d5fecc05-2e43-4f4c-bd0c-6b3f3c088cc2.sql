-- Add assignee_type column to task_assignments to track whether it's a supplier, employee, or user
ALTER TABLE public.task_assignments 
ADD COLUMN IF NOT EXISTS assignee_type TEXT CHECK (assignee_type IN ('supplier', 'employee', 'user'));

-- Add assignee_name column to store the name directly (avoiding JOIN issues)
ALTER TABLE public.task_assignments 
ADD COLUMN IF NOT EXISTS assignee_name TEXT;

-- Add assignee_email column to store email for notifications
ALTER TABLE public.task_assignments 
ADD COLUMN IF NOT EXISTS assignee_email TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_task_assignments_assignee ON public.task_assignments(assigned_to, assignee_type);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Suppliers can view their assigned tasks" ON public.task_assignments;
DROP POLICY IF EXISTS "Employees can view their assigned tasks" ON public.task_assignments;
DROP POLICY IF EXISTS "Authenticated users can create task assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Authenticated users can update task assignments" ON public.task_assignments;

-- Update RLS policies to allow suppliers to view their assigned tasks
CREATE POLICY "Suppliers can view their assigned tasks"
ON public.task_assignments
FOR SELECT
USING (
  assignee_type = 'supplier' AND 
  assigned_to IN (SELECT id FROM public.suppliers)
);

-- Allow employees to view their assigned tasks
CREATE POLICY "Employees can view their assigned tasks"
ON public.task_assignments
FOR SELECT
USING (
  assignee_type = 'employee' AND 
  assigned_to IN (SELECT id FROM public.employees)
);

-- Allow authenticated users to insert task assignments
CREATE POLICY "Authenticated users can create task assignments"
ON public.task_assignments
FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to update task assignments
CREATE POLICY "Authenticated users can update task assignments"
ON public.task_assignments
FOR UPDATE
USING (true);