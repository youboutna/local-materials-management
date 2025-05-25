
import { supabase } from '@/integrations/supabase/client';

export interface NotificationData {
  recipient_id: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'task_updated' | 'task_completed';
  related_id?: string;
  metadata?: Record<string, any>;
}

export const sendNotification = async (notification: NotificationData) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        ...notification,
        created_at: new Date().toISOString(),
        read: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error sending notification:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send notification:', error);
    throw error;
  }
};

export const sendTaskAssignmentNotifications = async (taskData: {
  id: string;
  title: string;
  assigned_to: string;
  assigned_by: string;
  project_id?: string;
}) => {
  const notifications: NotificationData[] = [];

  // Notification to the assigned person
  notifications.push({
    recipient_id: taskData.assigned_to,
    title: 'Nouvelle tâche assignée',
    message: `Une nouvelle tâche "${taskData.title}" vous a été assignée.`,
    type: 'task_assigned',
    related_id: taskData.id,
    metadata: {
      task_id: taskData.id,
      project_id: taskData.project_id
    }
  });

  // Get the superior of the assigned person if they exist
  try {
    const { data: assignedEmployee, error: employeeError } = await supabase
      .from('employees')
      .select('superior_id')
      .eq('id', taskData.assigned_to)
      .single();

    if (!employeeError && assignedEmployee?.superior_id) {
      notifications.push({
        recipient_id: assignedEmployee.superior_id,
        title: 'Tâche assignée à votre équipe',
        message: `Une tâche "${taskData.title}" a été assignée à un membre de votre équipe.`,
        type: 'task_assigned',
        related_id: taskData.id,
        metadata: {
          task_id: taskData.id,
          assigned_to: taskData.assigned_to,
          project_id: taskData.project_id
        }
      });
    }
  } catch (error) {
    console.error('Error fetching superior information:', error);
  }

  // Send all notifications
  const results = await Promise.allSettled(
    notifications.map(notification => sendNotification(notification))
  );

  const successful = results.filter(result => result.status === 'fulfilled').length;
  const failed = results.filter(result => result.status === 'rejected').length;

  console.log(`Notifications sent: ${successful} successful, ${failed} failed`);

  return { successful, failed };
};
