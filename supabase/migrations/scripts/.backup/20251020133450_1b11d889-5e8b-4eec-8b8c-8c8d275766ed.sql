-- Allow users to update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications"
ON btp.notifications
FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- Allow users to view tasks assigned to them
CREATE POLICY "Users can view tasks assigned to them"
ON btp.task_assignments
FOR SELECT
TO authenticated
USING (assigned_to = auth.uid());

-- Allow users to update tasks assigned to them (e.g., update status, notes)
CREATE POLICY "Users can update tasks assigned to them"
ON btp.task_assignments
FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());

-- Allow users to view tasks they created
CREATE POLICY "Users can view tasks they created"
ON btp.task_assignments
FOR SELECT
TO authenticated
USING (assigned_by = auth.uid());