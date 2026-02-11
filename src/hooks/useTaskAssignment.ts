import { useState } from 'react';
import { useAuth } from '@/contexts/use-auth';
import { useNotifications } from '@/hooks/useNotifications';
import { TaskType, NotificationMetadata } from '@/dtos/entities/TaskDTO';
import { toast } from '@/hooks/use-toast';
import { TaskService } from '@/application/services/TaskService';
import { EmployeeService } from '@/application/services/EmployeeService';
import { SupplierService } from '@/application/services/SupplierService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { CreateTaskAssignmentDTO, TaskAssignmentDTO } from '@/dtos/entities/TaskAssignmentDTO';
import { EmployeeDTO } from '@/dtos/entities/EmployeeDTO';
import { SupplierDTO } from '@/dtos/entities/SupplierDTO';

export const useTaskAssignment = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { createNotification } = useNotifications();

  // Initialize services
  const taskService = new TaskService(RepositoryFactory.getTaskRepository());
  const employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());
  const supplierService = new SupplierService(RepositoryFactory.getSupplierRepository());

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
      const employeeData = await employeeService.getEmployeeById(assignedTo);
      
      if (employeeData) {
        assigneeName = employeeData.fullName || employeeData.name || 'Employé';
        assigneeEmail = employeeData.email || '';
        assigneeType = 'employee';
      } else {
        // Try suppliers
        const supplierData = await supplierService.getSupplierById(assignedTo);
        
        if (supplierData) {
          assigneeName = supplierData.contactPerson || supplierData.name || 'Fournisseur';
          assigneeEmail = supplierData.email || '';
          assigneeType = 'supplier';
        } else {
          // Default to user if no employee or supplier found
          assigneeName = user.user_metadata?.full_name || user.email || 'Utilisateur';
          assigneeType = 'user';
        }
      }

      // Create the task assignment using service
      const taskAssignmentDTO: CreateTaskAssignmentDTO = {
        title,
        description,
        assigneeType,
        assignedTo,
        priority,
        dueDate,
        projectId,
        assignedBy: user?.id || null,
        assigneeName,
        assigneeEmail,
        status: 'pending',
        taskType,
        relatedId,
      };

      const createdTask = await taskService.createTaskAssignment(taskAssignmentDTO);
      if (!createdTask) throw new Error('Failed to create task assignment');

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
        createdTask.id,
        metadata
      );

      toast({
        title: "Tâche créée",
        description: `La tâche "${title}" a été assignée à ${assigneeName}`,
      });

      return createdTask;
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
