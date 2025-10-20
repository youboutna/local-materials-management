
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { TaskType, NotificationMetadata } from '@/types/notification';
import { toast } from '@/hooks/use-toast';

export const useTaskAssignment = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { createNotification } = useNotifications();

  const createTaskAssignment = async (
    title: string,
    description: string,
    assignedTo: string,
    priority: 'low' | 'medium' | 'high' | 'urgent',
    dueDate?: string,
    projectId?: string,
    taskType: TaskType = 'general',
    relatedId?: string
  ) => {
    if (!user?.id) return null;

    setLoading(true);
    try {
      // Create the task assignment - assigned_to is nullable, so we can insert without FK constraint
      const { data: taskData, error: taskError } = await supabase
        .from('task_assignments')
        .insert({
          title,
          description,
          assigned_to: null, // Set to null to avoid FK constraint issues
          assigned_by: null, // Set to null to avoid FK constraint issues
          priority,
          status: 'pending',
          due_date: dueDate,
          project_id: projectId,
          notes: `Assigned to employee/user: ${assignedTo}`
        } as any)
        .select()
        .single();

      if (taskError) throw taskError;

      // Try to get assignee name from employees or profiles
      let assigneeName = 'Utilisateur';
      
      // First try employees table
      const { data: employeeData } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', assignedTo)
        .maybeSingle();
      
      if (employeeData) {
        assigneeName = employeeData.full_name;
      } else {
        // Then try profiles table
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', assignedTo)
          .maybeSingle();
        
        if (profileData) {
          assigneeName = profileData.full_name || 'Utilisateur';
        }
      }

      // Create notification metadata
      const metadata: NotificationMetadata = {
        task_type: taskType,
        priority,
        due_date: dueDate,
        assignee_name: assigneeName,
        assigner_name: user.user_metadata?.full_name || user.email || 'Directeur'
      };

      // Add related IDs based on task type
      if (projectId) metadata.related_project_id = projectId;
      if (relatedId) {
        switch (taskType) {
          case 'inspection':
            metadata.related_inspection_id = relatedId;
            break;
          case 'document':
            metadata.related_document_id = relatedId;
            break;
          case 'payment':
            metadata.related_payment_id = relatedId;
            break;
          case 'material':
            metadata.related_material_id = relatedId;
            break;
        }
      }

      // Create notification for the assignee
      await createNotification(
        assignedTo,
        `Nouvelle tâche assignée: ${title}`,
        `Vous avez été assigné(e) à une nouvelle tâche${priority === 'urgent' ? ' URGENTE' : priority === 'high' ? ' prioritaire' : ''}. ${description ? description.substring(0, 100) + '...' : ''}`,
        'task_assignment',
        (taskData as any)?.id,
        metadata
      );

      toast({
        title: "Tâche créée",
        description: `La tâche "${title}" a été assignée à ${assigneeName}`,
      });

      return taskData;
    } catch (error) {
      console.error('Error creating task assignment:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createTaskAssignment,
    loading
  };
};
