import { EmployeeService } from '@/application/services/EmployeeService';
import { SupplierService } from '@/application/services/SupplierService';
import { CreateTaskAssignmentRequestDto, TaskService } from '@/application/services/TaskService';
import { useAuth } from '@/contexts/use-auth';
import { toast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useState } from 'react';

type TaskTypeLocal = 'general' | 'inspection' | 'document' | 'payment' | 'material';

export const useTaskAssignment = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { createNotification } = useNotifications();

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
    taskType: TaskTypeLocal = 'general',
    relatedId?: string
  ) => {
    if (!user?.id) return null;

    setLoading(true);
    try {
      let assigneeName = 'Utilisateur';
      let assigneeEmail = '';
      let assigneeType: 'employee' | 'supplier' = 'employee';

      const employeeData = await employeeService.getEmployeeById(assignedTo);
      
      if (employeeData) {
        assigneeName = employeeData.fullName || 'Employé';
        assigneeEmail = employeeData.email || '';
        assigneeType = 'employee';
      } else {
        const supplierData = await supplierService.getSupplierById(assignedTo);
        
        if (supplierData) {
          assigneeName = supplierData.name || 'Fournisseur';
          assigneeEmail = supplierData.email || '';
          assigneeType = 'supplier';
        } else {
          assigneeName = user.user_metadata?.full_name || user.email || 'Utilisateur';
          assigneeType = 'employee';
        }
      }

      const taskAssignmentRequest: CreateTaskAssignmentRequestDto = {
        title,
        description,
        assigneeType,
        assignedTo,
        assignedBy: user?.id,
        assigneeEmail,
        priority: priority === 'urgent' ? undefined : priority as any,
        dueDate,
        projectId,
      };

      const createdTask = await taskService.assignTask(taskAssignmentRequest);
      if (!createdTask) throw new Error('Failed to create task assignment');

      const metadata: Record<string, unknown> = {
        task_type: taskType,
        priority,
        due_date: dueDate,
        assignee_name: assigneeName,
        assigner_name: user.user_metadata?.full_name || user.email || 'Directeur'
      };

      if (projectId) metadata.related_project_id = projectId;
      if (relatedId) {
        metadata.related_id = relatedId;
        metadata.related_type = taskType;
      }

      await createNotification(
        assignedTo,
        `Nouvelle tâche assignée: ${title}`,
        `Vous avez été assigné(e) à une nouvelle tâche${priority === 'urgent' ? ' URGENTE' : priority === 'high' ? ' prioritaire' : ''}. ${description ? description.substring(0, 100) + '...' : ''}`,
        'info',
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
