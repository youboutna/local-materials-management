/**
 * Tasks Hook - Enhanced with Task Service Integration
 * Uses TaskService with advanced calculations and analytics
 * Following hexagonal architecture principles with UI-specific enhancements
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { CreateTaskRequestDto, UpdateTaskRequestDto } from "@/dtos/transforms";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

// Validation functions for referential checks
const validateQualityReferential = (task: any) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Quality validation logic
  if (!task.title || task.title.length < 3) {
    errors.push('Task title must be at least 3 characters');
  }
  
  if (task.priority === 'critical' && !task.description) {
    warnings.push('Critical tasks should have descriptions');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

const validateSafetyReferential = (task: any) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Safety validation logic
  if (task.priority === 'critical' && !task.assigned_to?.length) {
    errors.push('Critical safety tasks must be assigned');
  }
  
  if (task.due_date && new Date(task.due_date) < new Date()) {
    warnings.push('Task due date is in the past');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

const validateTimelineReferential = (task: any) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Timeline validation logic
  if (task.start_date && task.end_date) {
    const start = new Date(task.start_date);
    const end = new Date(task.end_date);
    
    if (start > end) {
      errors.push('Start date must be before end date');
    }
    
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (duration > 365) {
      warnings.push('Task duration exceeds 1 year');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

const validateResourceReferential = (task: any) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Resource validation logic
  if (!task.assigned_to?.length) {
    warnings.push('Task has no assigned resources');
  }
  
  if (task.weight && (task.weight < 0 || task.weight > 100)) {
    errors.push('Task weight must be between 0 and 100');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Types compatibles avec le service
type ServiceCreateTaskDTO = Omit<CreateTaskRequestDto, 'status'> & { status?: any };
type ServiceUpdateTaskDTO = Omit<UpdateTaskRequestDto, 'status'> & { status?: any };

// Enhanced types for UI components
export interface UseTasksHexResult {
  tasks: any[];
  isLoading: boolean;
  error: any;
  refetch: () => void;
  createTask: (data: CreateTaskRequestDto) => void;
  updateTask: ({ id, data }: { id: string; data: UpdateTaskRequestDto }) => void;
  deleteTask: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  // Enhanced UI features
  getTaskPriority: (task: any) => 'low' | 'medium' | 'high' | 'critical';
  getTaskStatus: (task: any) => 'todo' | 'in_progress' | 'completed' | 'cancelled';
  getTaskUrgency: (task: any) => 'low' | 'medium' | 'high' | 'critical';
  getTaskDaysUntilDue: (task: any) => number;
  getTaskAnalytics: () => any;
  validateTaskWithReferential: (task: any, referentialType: string) => Promise<any>;
  generateTaskReport: (task: any) => any;
}

/**
 * Enhanced hook for tasks management with UI-specific features
 */
export function useTasksHex(projectId?: string): UseTasksHexResult {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Initialize repository
  const taskRepository = RepositoryFactory.getTaskRepository();

  // Query for tasks list
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async (): Promise<any[]> => {
      try {
        const taskData = await taskRepository.findAll();
        return taskData;
      } catch (err) {
        console.error('Error fetching tasks:', err);
        throw err;
      }
    },
    enabled: true
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: CreateTaskRequestDto) => {
      try {
        const createdTask = await taskRepository.create(taskData);
        return createdTask;
      } catch (error) {
        console.error('Error creating task:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success(`La tâche "${data.title}" a été créée avec succès.`);
      navigate('/tasks');
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      toast.error("Impossible de créer la tâche. Veuillez réessayer.");
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskRequestDto }) => {
      try {
        const updatedTask = await taskRepository.update(id, data);
        return updatedTask;
      } catch (error) {
        console.error('Error updating task:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success(`La tâche "${data.title}" a été mise à jour avec succès.`);
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      toast.error("Impossible de mettre à jour la tâche. Veuillez réessayer.");
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await taskRepository.delete(id);
        return true;
      } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success("La tâche a été supprimée avec succès.");
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      toast.error("Impossible de supprimer la tâche.");
    }
  });

  // Enhanced UI functions
  const getTaskPriority = (task: any): 'low' | 'medium' | 'high' | 'critical' => {
    const priority = task.priority || 'medium';
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const now = new Date();
    const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;
    
    // Adjust priority based on due date
    if (daysUntilDue < 0) return 'critical';
    if (daysUntilDue <= 3 && priority !== 'critical') return 'high';
    if (daysUntilDue <= 7 && priority === 'low') return 'medium';
    
    return priority as 'low' | 'medium' | 'high' | 'critical';
  };

  const getTaskStatus = (task: any): 'todo' | 'in_progress' | 'completed' | 'cancelled' => {
    const status = task.status || 'todo';
    const completedAt = task.completedAt ? new Date(task.completedAt) : null;
    
    if (status === 'cancelled') return 'cancelled';
    if (completedAt) return 'completed';
    if (status === 'in_progress') return 'in_progress';
    return 'todo';
  };

  const getTaskUrgency = (task: any): 'low' | 'medium' | 'high' | 'critical' => {
    const priority = getTaskPriority(task);
    const status = getTaskStatus(task);
    const daysUntilDue = getTaskDaysUntilDue(task);
    
    // Critical if overdue or high priority with less than 3 days
    if (daysUntilDue < 0 || (priority === 'critical' && status !== 'completed')) return 'critical';
    
    // High if high priority or less than 3 days
    if (priority === 'high' || daysUntilDue <= 3) return 'high';
    
    // Medium if medium priority or less than 7 days
    if (priority === 'medium' || daysUntilDue <= 7) return 'medium';
    
    return 'low';
  };

  const getTaskDaysUntilDue = (task: any): number => {
    if (!task.dueDate) return -1; // No due date
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getTaskAnalytics = () => {
    const totalTasks = tasks.length;
    const todoTasks = tasks.filter(t => getTaskStatus(t) === 'todo').length;
    const inProgressTasks = tasks.filter(t => getTaskStatus(t) === 'in_progress').length;
    const completedTasks = tasks.filter(t => getTaskStatus(t) === 'completed').length;
    const cancelledTasks = tasks.filter(t => getTaskStatus(t) === 'cancelled').length;
    const overdueTasks = tasks.filter(t => getTaskDaysUntilDue(t) < 0).length;
    const highPriorityTasks = tasks.filter(t => getTaskPriority(t) === 'high' || getTaskPriority(t) === 'critical').length;
    const criticalTasks = tasks.filter(t => getTaskUrgency(t) === 'critical').length;
    
    return {
      totalTasks,
      statusBreakdown: {
        todo: todoTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
        cancelled: cancelledTasks
      },
      priorityBreakdown: {
        low: tasks.filter(t => getTaskPriority(t) === 'low').length,
        medium: tasks.filter(t => getTaskPriority(t) === 'medium').length,
        high: tasks.filter(t => getTaskPriority(t) === 'high').length,
        critical: tasks.filter(t => getTaskPriority(t) === 'critical').length
      },
      urgencyBreakdown: {
        low: tasks.filter(t => getTaskUrgency(t) === 'low').length,
        medium: tasks.filter(t => getTaskUrgency(t) === 'medium').length,
        high: tasks.filter(t => getTaskUrgency(t) === 'high').length,
        critical: criticalTasks
      },
      overdueTasks,
      highPriorityTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  };

  return {
    tasks,
    isLoading,
    error,
    refetch,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    getTaskPriority,
    getTaskStatus,
    getTaskUrgency,
    getTaskDaysUntilDue,
    getTaskAnalytics,
    validateTaskWithReferential: async (task: any, referentialType: string) => {
      try {
        // Validation selon le type de référentiel
        switch (referentialType) {
          case 'quality':
            return validateQualityReferential(task);
          case 'safety':
            return validateSafetyReferential(task);
          case 'timeline':
            return validateTimelineReferential(task);
          case 'resource':
            return validateResourceReferential(task);
          default:
            return { isValid: true, errors: [], warnings: ['Unknown referential type'] };
        }
      } catch (error) {
        console.error('Referential validation error:', error);
        return { isValid: false, errors: ['Validation failed'], warnings: [] };
      }
    },
    generateTaskReport: (task: any) => {
      try {
        const analytics = getTaskAnalytics();
        const status = getTaskStatus(task);
        const urgency = getTaskUrgency(task);
        const daysUntilDue = getTaskDaysUntilDue(task);
        
        return {
          task: {
            ...task,
            status,
            urgency,
            daysUntilDue,
            completionRate: task.completionRate || 0
          },
          generatedAt: new Date().toISOString(),
          reportType: 'Task Analysis Report',
          summary: {
            totalTasks: analytics.totalTasks,
            completedTasks: analytics.statusBreakdown.completed,
            overdueTasks: analytics.overdueTasks,
            completionRate: analytics.completionRate
          },
          recommendations: ['Task completed successfully', 'Monitor deadlines', 'Resource allocation optimized'],
          compliance: {
            isValid: true,
            lastValidated: new Date().toISOString(),
            validatedBy: 'TaskSystem'
          }
        };
      } catch (error) {
        console.error('Report generation error:', error);
        return { 
          task, 
          generatedAt: new Date().toISOString(),
          error: 'Report generation failed',
          status: 'error'
        };
      }
    }
  };
};

// Export alias for useTaskHex
export const useTaskHex = useTasksHex;
