
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

      // Create the task assignment with proper assignee information
      // Map to the correct foreign key columns to avoid FK violations
      const insertData: any = {
        title,
        description,
        assignee_type: assigneeType,
        assignee_name: assigneeName,
        assignee_email: assigneeEmail,
        priority,
        status: 'pending',
        due_date: dueDate,
        project_id: projectId,
        // Avoid assigned_by FK violation (references employees.id); set null unless you map user to an employee
        assigned_by: null,
      };

      if (assigneeType === 'employee') {
        insertData.assigned_employee_id = assignedTo;
        // Keep legacy column for compatibility; points to employees.id
        insertData.assigned_to = assignedTo;
      } else if (assigneeType === 'supplier') {
        insertData.assigned_supplier_id = assignedTo;
      } else if (assigneeType === 'user') {
        insertData.assigned_profile_id = assignedTo;
      }

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
