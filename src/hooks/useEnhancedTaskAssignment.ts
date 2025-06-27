
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { sendSupplierNotification } from '@/services/supplierNotificationService';

export const useEnhancedTaskAssignment = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const createTaskAssignment = async (
    title: string,
    description: string,
    assignedTo: string,
    priority: 'low' | 'medium' | 'high' | 'urgent',
    dueDate?: string,
    projectId?: string
  ) => {
    if (!user?.id) return null;

    setLoading(true);
    try {
      // Create the task assignment
      const { data: taskData, error: taskError } = await supabase
        .from('task_assignments')
        .insert({
          title,
          description,
          assigned_to: assignedTo,
          assigned_by: user.id,
          priority,
          status: 'pending',
          due_date: dueDate,
          project_id: projectId
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Get assignee information (check if it's a supplier or internal user)
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('email, name, user_id')
        .eq('user_id', assignedTo)
        .single();

      if (supplierData) {
        // Send notification to supplier
        await sendSupplierNotification({
          type: 'task_assignment',
          email: supplierData.email,
          supplier_name: supplierData.name,
          task_id: taskData.id,
          task_title: title
        });

        toast({
          title: "Tâche créée",
          description: `La tâche "${title}" a été assignée au fournisseur ${supplierData.name} et un email de notification a été envoyé.`,
        });
      } else {
        // Regular internal notification
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', assignedTo)
          .single();

        const assigneeName = profileData?.full_name || 'Utilisateur';

        // Create internal notification
        await supabase
          .from('notifications')
          .insert({
            recipient_id: assignedTo,
            title: `Nouvelle tâche assignée: ${title}`,
            message: `Vous avez été assigné(e) à une nouvelle tâche${priority === 'urgent' ? ' URGENTE' : priority === 'high' ? ' prioritaire' : ''}. ${description ? description.substring(0, 100) + '...' : ''}`,
            type: 'task_assignment',
            related_id: taskData.id,
            metadata: {
              task_type: 'general',
              priority,
              due_date: dueDate,
              assignee_name: assigneeName,
              assigner_name: user.user_metadata?.full_name || user.email || 'Directeur'
            }
          });

        toast({
          title: "Tâche créée",
          description: `La tâche "${title}" a été assignée à ${assigneeName}`,
        });
      }

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
