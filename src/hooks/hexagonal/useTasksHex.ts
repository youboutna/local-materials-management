/**
 * Tasks Hook - Enhanced with Task Service Integration
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { TaskService, TaskDTO, TaskStatus, TaskPriority, CreateTaskDTO, UpdateTaskDTO } from '@/application/services/TaskService';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
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
  status: string;
  progress: number;
  issues: string[];
}

export interface UseTasksHexResult {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createTask: (data: any) => void;
  updateTask: ({ id, data }: { id: string; data: any }) => void;
  deleteTask: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  getTaskPriority: (task: Task) => string;
  getTaskStatus: (task: Task) => string;
  getTaskUrgency: (task: Task) => string;
  getTaskDaysUntilDue: (task: Task) => number;
  getTaskAnalytics: () => TaskAnalytics;
  validateTaskWithReferential: (task: Task, referentialType: string) => Promise<ValidationResult>;
  generateTaskReport: (task: Task) => TaskReport;
}

export function useTasksHex(projectId?: string): UseTasksHexResult {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const taskService = new TaskService(RepositoryFactory.getTaskRepository());

  const {
    data: tasks = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async (): Promise<Task[]> => {
      const taskDTOs = projectId 
        ? await taskService.getProjectTasks(projectId)
        : await taskService.getAllTasks();
      return taskDTOs.map(dto => ({
        id: dto.id,
        title: dto.title,
        description: dto.description || null,
        status: String(dto.status),
        priority: String(dto.priority),
        dueDate: dto.dueDate,
        projectId: dto.projectId || '',
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
      }));
    },
    enabled: true
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      return await taskService.createTask({
        title: taskData.title,
        description: taskData.description,
        projectId: taskData.projectId || projectId,
        priority: taskData.priority as TaskPriority,
        status: taskData.status as TaskStatus,
        assignedTo: taskData.assignedTo,
        dueDate: taskData.dueDate,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success(`La tâche "${data.title}" a été créée avec succès.`);
      navigate('/tasks');
    },
    onError: () => {
      toast.error("Impossible de créer la tâche. Veuillez réessayer.");
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const updateData: UpdateTaskDTO = {
        title: data.title,
        description: data.description,
        status: data.status as TaskStatus,
        priority: data.priority as TaskPriority,
        projectId: data.projectId,
        assignedTo: data.assignedTo,
        dueDate: data.dueDate,
      };
      return await taskService.updateTask(id, updateData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success(`La tâche "${data.title}" a été mise à jour avec succès.`);
    },
    onError: () => {
      toast.error("Impossible de mettre à jour la tâche. Veuillez réessayer.");
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await taskService.deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success("La tâche a été supprimée avec succès.");
    },
    onError: () => {
      toast.error("Impossible de supprimer la tâche.");
    }
  });

  const getTaskPriority = (task: Task): string => {
    const priority = task.priority || 'medium';
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const now = new Date();
    const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;
    if (daysUntilDue < 0) return 'critical';
    if (daysUntilDue <= 3 && priority !== 'critical') return 'high';
    if (daysUntilDue <= 7 && priority === 'low') return 'medium';
    return priority;
  };

  const getTaskStatus = (task: Task): string => task.status || 'not_started';

  const getTaskUrgency = (task: Task): string => {
    const priority = getTaskPriority(task);
    const status = getTaskStatus(task);
    const daysUntilDue = getTaskDaysUntilDue(task);
    if (daysUntilDue < 0 || (priority === 'critical' && status !== 'completed')) return 'critical';
    if (priority === 'high' || daysUntilDue <= 3) return 'high';
    if (priority === 'medium' || daysUntilDue <= 7) return 'medium';
    return 'low';
  };

  const getTaskDaysUntilDue = (task: Task): number => {
    if (!task.dueDate) return -1;
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getTaskAnalytics = (): TaskAnalytics => {
    const totalTasks = tasks.length;
    const overdueTasks = tasks.filter(t => getTaskDaysUntilDue(t) < 0).length;
    const highPriorityTasks = tasks.filter(t => {
      const p = getTaskPriority(t);
      return p === 'high' || p === 'critical';
    }).length;
    return {
      completionRate: totalTasks > 0 ? Math.round((tasks.filter(t => getTaskStatus(t) === 'completed').length / totalTasks) * 100) : 0,
      overdueCount: overdueTasks,
      highPriorityCount: highPriorityTasks
    };
  };

  const validateTaskWithReferential = async (task: Task, referentialType: string): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!task.title || task.title.length < 3) errors.push('Task title must be at least 3 characters');
    if (task.dueDate && new Date(task.dueDate) < new Date()) warnings.push('Task due date is in the past');
    
    return { isValid: errors.length === 0, errors, warnings };
  };

  const generateTaskReport = (task: Task): TaskReport => {
    const status = getTaskStatus(task);
    const progress = task.completionRate || 0;
    const issues: string[] = [];
    if (getTaskUrgency(task) === 'critical') issues.push('Task is critical');
    if (getTaskDaysUntilDue(task) < 0) issues.push('Task is overdue');
    return { status, progress, issues };
  };

  return {
    tasks,
    isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
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
}

export const useTaskHex = useTasksHex;
