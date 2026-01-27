/**
 * Hexagonal hooks for Enhanced Task List (project-scoped tasks)
 * Centralizes all project task operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import { TaskService } from '@/application/services/TaskService';
import { EntityToDTOMapper } from '@/dtos/transforms';

export interface ProjectTaskFormData {
  title: string;
  description?: string;
  phase_id?: string;
  assigned_to?: string;
  due_date?: string;
  priority: string;
  status: string;
  notes?: string;
}

export interface ProjectTask {
  id: string;
  title: string | null;
  description: string | null;
  project_id: string | null;
  phase_id: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  completion_date: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProjectPhase {
  id: string;
  phase_name: string;
  status: string;
}

// Hook: Fetch project phases
export function useProjectPhasesForTasks(projectId: string) {
  return useQuery({
    queryKey: ['project-phases-for-tasks', projectId],
    queryFn: async (): Promise<ProjectPhase[]> => {
      const taskRepository = RepositoryFactory.getTaskRepository();
      const taskService = new TaskService(taskRepository, TaskDomainTransformer);
      const phases = await taskService.getProjectPhases(projectId);
      return phases;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!projectId
  });
}

// Hook: Fetch project tasks
export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async (): Promise<ProjectTask[]> => {
      const taskRepository = RepositoryFactory.getTaskRepository();
      const taskService = new TaskService(taskRepository, TaskDomainTransformer);
      const tasks = await taskService.getProjectTasks(projectId);
      return tasks;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!projectId
  });
}

// Hook: Create project task
export function useCreateProjectTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: ProjectTaskFormData) => {
      const taskRepository = RepositoryFactory.getTaskRepository();
      const taskService = new TaskService(taskRepository, TaskDomainTransformer);
      const { data: { user } } = await taskService.createTask(taskData);
      if (!user) throw new Error('User not authenticated');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
    }
  });
}

// Hook: Update project task
export function useUpdateProjectTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProjectTaskFormData> }) => {
      const taskRepository = RepositoryFactory.getTaskRepository();
      const taskService = new TaskService(taskRepository, TaskDomainTransformer);
      const updatedTask = await taskService.updateTask(id, data);
      return updatedTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
    }
  });
}

// Hook: Delete project task
export function useDeleteProjectTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const taskRepository = RepositoryFactory.getTaskRepository();
      const taskService = new TaskService(taskRepository, TaskDomainTransformer);
      const deletedTask = await taskService.deleteTask(id);
      return deletedTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
    }
  });
}
