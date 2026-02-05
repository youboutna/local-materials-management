import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/use-auth';
import { useNotifications } from '@/hooks/useNotifications';
import { TaskType, NotificationMetadata } from '@/dtos/entities/TaskDTO';
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
      // Determine assignee type and fetch details
      let assigneeName = 'Utilisateur';
      let assigneeEmail = '';
      let assigneeType: 'supplier' | 'employee' | 'user' = 'user';

      // Try employees first
      const { data: employeeData } = await supabase
        .from('employees')
        .select('full_name, email')
        .eq('id', assignedTo)
        .maybeSingle();
      
      if (employeeData) {
        assigneeName = employeeData.full_name;
        assigneeEmail = employeeData.email || '';
        assigneeType = 'employee';
      } else {
        // Try suppliers
        const { data: supplierData } = await supabase
          .from('suppliers')
          .select('name, email, contact_person')
          .eq('id', assignedTo)
          .maybeSingle();
        
        if (supplierData) {
          assigneeName = supplierData.contact_person || supplierData.name;
          assigneeEmail = supplierData.email || '';
          assigneeType = 'supplier';
        } else {
          // Try profiles (authenticated users)
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', assignedTo)
            .maybeSingle();
          
          if (profileData) {
            assigneeName = profileData.full_name || 'Utilisateur';
            assigneeType = 'user';
          }
        }
      }

      // Create the task assignment with assigned_to + assignee_type pattern
      interface TaskAssignmentData {
        title: string;
        description: string;
        assignee_type: string;
        assigned_to: string;
        priority: 'low' | 'medium' | 'high' | 'urgent';
        due_date?: string;
      }

      const insertData: TaskAssignmentData = {
        title,
        description,
        assignee_type: assigneeType,
        assigned_to: assignedTo,
        priority,
        due_date: dueDate,
        project_id: projectId,
        assigned_by: user?.id || null,
        assignee_name: assigneeName,
        assignee_email: assigneeEmail,
        status: 'pending',
      };

      const { data: taskData, error: taskError } = await supabase
        .from('task_assignments')
        .insert(insertData)
        .select()
        .single();

      if (taskError) throw taskError;

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
        taskData?.id,
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
