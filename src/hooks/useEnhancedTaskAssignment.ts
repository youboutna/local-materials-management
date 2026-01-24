/**
 * Enhanced Task Assignment Hook - Hexagonal Architecture
 * Delegates to useTaskAssignmentsHex for all operations
 * Legacy interface maintained for backward compatibility
 */

import { useTaskAssignmentsHex } from '@/hooks/hexagonal/useTaskAssignmentsHex';

interface TaskAssignment {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  assigned_to: string;
  assigned_by: string;
  project_id: string;
  completion_token: string;
  completion_url: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export const useEnhancedTaskAssignment = () => {
  const {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    isCreating,
    isUpdating
  } = useTaskAssignmentsHex();

  // Transform hexagonal tasks to legacy format
  const transformedAssignments: TaskAssignment[] = (tasks || []).map((task: any) => ({
    id: task.id,
    title: task.title || '',
    description: task.description || '',
    status: task.status || 'pending',
    priority: task.priority || 'medium',
    due_date: task.dueDate || task.due_date || '',
    assigned_to: task.assignedTo || task.assigned_to || '',
    assigned_by: task.assignedBy || task.assigned_by || '',
    project_id: task.projectId || task.project_id || '',
    completion_token: task.completionToken || task.completion_token || '',
    completion_url: task.completionUrl || task.completion_url || '',
    notes: task.notes || '',
    created_at: task.createdAt || task.created_at || '',
    updated_at: task.updatedAt || task.updated_at || ''
  }));

  // Create assignment wrapper for legacy interface
  const createAssignment = {
    mutate: async (newAssignment: Partial<TaskAssignment>) => {
      return createTask({
        title: newAssignment.title || '',
        description: newAssignment.description,
        assignedTo: newAssignment.assigned_to || '',
        priority: (newAssignment.priority as any) || 'medium',
        status: (newAssignment.status as any) || 'pending',
        dueDate: newAssignment.due_date,
        projectId: newAssignment.project_id,
        notes: newAssignment.notes,
      });
    },
    mutateAsync: async (newAssignment: Partial<TaskAssignment>) => {
      return createTask({
        title: newAssignment.title || '',
        description: newAssignment.description,
        assignedTo: newAssignment.assigned_to || '',
        priority: (newAssignment.priority as any) || 'medium',
        status: (newAssignment.status as any) || 'pending',
        dueDate: newAssignment.due_date,
        projectId: newAssignment.project_id,
        notes: newAssignment.notes,
      });
    },
    isPending: isCreating
  };

  // Update assignment wrapper for legacy interface
  const updateAssignment = {
    mutate: async ({ id, updates }: { id: string; updates: Partial<TaskAssignment> }) => {
      return updateTask({
        id,
        title: updates.title,
        description: updates.description,
        assignedTo: updates.assigned_to,
        priority: updates.priority as any,
        status: updates.status as any,
        dueDate: updates.due_date,
        projectId: updates.project_id,
        notes: updates.notes,
      });
    },
    mutateAsync: async ({ id, updates }: { id: string; updates: Partial<TaskAssignment> }) => {
      return updateTask({
        id,
        title: updates.title,
        description: updates.description,
        assignedTo: updates.assigned_to,
        priority: updates.priority as any,
        status: updates.status as any,
        dueDate: updates.due_date,
        projectId: updates.project_id,
        notes: updates.notes,
      });
    },
    isPending: isUpdating
  };

  return {
    assignments: transformedAssignments,
    isLoading,
    error,
    createAssignment,
    updateAssignment
  };
};
