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
import { TaskStatus } from '@/domain/entities/Task'; 
import { TaskDTO } from '@/domain/entities/TaskDTO'; 

// Validation functions for referential checks
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string | null;
  projectId: string;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt: string;
  completionRate?: number;
  assignedEmployees?: any[];
  getProgressPercentage?: () => number;
  startDate?: string;
  endDate?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  phaseId?: string;
  notes?: string;
}

const validateQualityReferential = (task: Task) => {
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

const validateSafetyReferential = (task: Task) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Safety validation logic
  if (task.priority === 'critical' && !task.assigneeId) {
    errors.push('Critical safety tasks must be assigned');
  }
  
  if (task.dueDate && new Date(task.dueDate) < new Date()) {
    warnings.push('Task due date is in the past');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

const validateTimelineReferential = (task: Task) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Timeline validation logic
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      errors.push('Task due date is in the past');
    }
    
    if (daysUntilDue > 365) {
      warnings.push('Task duration exceeds 1 year');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

const validateResourceReferential = (task: Task) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Resource validation logic
  if (!task.assigneeId) {
    warnings.push('Task has no assigned resources');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Types compatibles avec le service
type ServiceCreateTaskDTO = Omit<CreateTaskRequestDto, 'status'> & { status?: TaskStatus };
type ServiceUpdateTaskDTO = Omit<UpdateTaskRequestDto, 'status'> & { status?: TaskStatus };

// Fonction de conversion complète
const taskToDTO = (task: Task): TaskDTO => {
  if (!task) throw new Error('Invalid task data');
  
  return {
    id: task.id,
    title: task.title,
    description: task.description || '',
    assignedTo: task.assignedEmployees?.map(e => e.id),
    status: task.status as 'not_started' | 'in_progress' | 'completed' | 'delayed',
    progress: task.getProgressPercentage?.() || 0,
    startDate: task.startDate || '',
    endDate: task.endDate || '',
    estimatedDuration: task.estimatedDuration || 0,
    actualDuration: task.actualDuration || 0,
    costEstimate: 0, // Valeur par défaut
    actualCost: 0, // Valeur par défaut
    priority: (task.priority === 'critical' ? 'urgent' : task.priority) as 'low' | 'medium' | 'high' | 'urgent',
    projectId: task.projectId,
    phaseId: task.phaseId || undefined,
    assigneeName: '', // Valeur par défaut
    projectTitle: '', // Valeur par défaut
    dueDate: task.dueDate || undefined,
    completedAt: undefined,
    notes: task.notes || undefined
  };
};

// Enhanced types for UI components
export interface UseTasksHexResult {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createTask: (data: CreateTaskRequestDto) => void;
  updateTask: ({ id, data }: { id: string; data: UpdateTaskRequestDto }) => void;
  deleteTask: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  getTaskPriority: (task: Task) => 'low' | 'medium' | 'high' | 'critical';
  getTaskStatus: (task: Task) => TaskStatus;
  getTaskUrgency: (task: Task) => 'low' | 'medium' | 'high' | 'critical';
  getTaskDaysUntilDue: (task: Task) => number;
  getTaskAnalytics: () => TaskAnalytics;
  validateTaskWithReferential: (task: Task, referentialType: string) => Promise<ValidationResult>;
  generateTaskReport: (task: Task) => TaskReport;
}

interface TaskAnalytics {
  completionRate: number;
  overdueCount: number;
  highPriorityCount: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface TaskReport {
  status: TaskStatus;
  progress: number;
  issues: string[];
}

interface TaskFilterOptions {
  status?: TaskStatus;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;
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
    queryFn: async (): Promise<Task[]> => {
      try {
        const taskData: TaskDTO[] = await taskRepository.findAll();
        return taskData as Task[];
      } catch (error) {
        throw new Error('Failed to fetch tasks');
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
        const updateData: ServiceUpdateTaskDTO = {
          ...data,
          status: data.status as TaskStatus,
          priority: (data.priority === 'critical' ? 'urgent' : data.priority) as 'low' | 'medium' | 'high' | 'urgent'
        };
        const updatedTask = await taskRepository.update(id, updateData);
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
  const getTaskPriority = (task: Task): 'low' | 'medium' | 'high' | 'critical' => {
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

  const getTaskStatus = (task: Task): TaskStatus => {
    return task.status || 'not_started';
  };

  const getTaskUrgency = (task: Task): 'low' | 'medium' | 'high' | 'critical' => {
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

  const getTaskDaysUntilDue = (task: Task): number => {
    if (!task.dueDate) return -1; // No due date
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getTaskAnalytics = (): TaskAnalytics => {
    const totalTasks = tasks.length;
    const overdueTasks = tasks.filter(t => getTaskDaysUntilDue(t) < 0).length;
    const highPriorityTasks = tasks.filter(t => getTaskPriority(t) === 'high' || getTaskPriority(t) === 'critical').length;
    
    return {
      completionRate: totalTasks > 0 ? Math.round((tasks.filter(t => getTaskStatus(t) === 'completed').length / totalTasks) * 100) : 0,
      overdueCount: overdueTasks,
      highPriorityCount: highPriorityTasks
    };
  };

  const validateTaskWithReferential = async (task: Task, referentialType: string): Promise<ValidationResult> => {
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
  };

  const generateTaskReport = (task: Task): TaskReport => {
    try {
      const status = getTaskStatus(task);
      const progress = task.completionRate || 0;
      const issues = [];
      
      if (getTaskUrgency(task) === 'critical') {
        issues.push('Task is critical');
      }
      
      if (getTaskDaysUntilDue(task) < 0) {
        issues.push('Task is overdue');
      }
      
      return {
        status,
        progress,
        issues
      };
    } catch (error) {
      console.error('Report generation error:', error);
      return { 
        status: 'error',
        progress: 0,
        issues: ['Report generation failed']
      };
    }
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
    validateTaskWithReferential,
    generateTaskReport
  };
};

// Export alias for useTaskHex
export const useTaskHex = useTasksHex;
