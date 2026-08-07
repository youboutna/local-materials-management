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
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: string;
  projectId: string;
  notes?: string;
}

interface TaskUpdate {
  id?: string;
  title?: string;
  description?: string;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: string;
  projectId?: string;
  notes?: string;
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
  const transformedAssignments: TaskAssignment[] = (tasks || []).map((task) => ({
    id: task.id,
    title: task.title || '',
    description: task.description || '',
    assignedTo: task.assignedTo || task.assignedTo || '',
    priority: task.priority || 'medium',
    status: task.status || 'pending',
    dueDate: task.dueDate || task.dueDate || '',
    projectId: task.projectId || task.projectId || '',
    notes: task.notes || ''
  }));

  // Create assignment wrapper for legacy interface
  const createAssignment = {
    mutate: async (newAssignment: TaskUpdate) => {
      const updates = {
        title: newAssignment.title || '',
        description: newAssignment.description || '',
        assignedTo: newAssignment.assignedTo || '',
        priority: newAssignment.priority || 'medium',
        status: newAssignment.status || 'pending',
        dueDate: newAssignment.dueDate || '',
        projectId: newAssignment.projectId || '',
        notes: newAssignment.notes || ''
      };
      return createTask(updates);
    },
    mutateAsync: async (newAssignment: TaskUpdate) => {
      const updates = {
        title: newAssignment.title || '',
        description: newAssignment.description || '',
        assignedTo: newAssignment.assignedTo || '',
        priority: newAssignment.priority || 'medium',
        status: newAssignment.status || 'pending',
        dueDate: newAssignment.dueDate || '',
        projectId: newAssignment.projectId || '',
        notes: newAssignment.notes || ''
      };
      return createTask(updates);
    },
    isPending: isCreating
  };

  // Update assignment wrapper for legacy interface
  const updateAssignment = {
    mutate: async ({ id, updates }: { id: string; updates: TaskUpdate }) => {
      const newAssignment = {
        title: updates.title || '',
        description: updates.description || '',
        assignedTo: updates.assignedTo || '',
        priority: updates.priority || 'medium',
        status: updates.status || 'pending',
        dueDate: updates.dueDate || '',
        projectId: updates.projectId || '',
        notes: updates.notes || ''
      };
      return updateTask({ id, ...newAssignment });
    },
    mutateAsync: async ({ id, updates }: { id: string; updates: TaskUpdate }): Promise<any> => {
      const newAssignment = {
        title: updates.title || '',
        description: updates.description || '',
        assignedTo: updates.assignedTo || '',
        priority: updates.priority || 'medium',
        status: updates.status || 'pending',
        dueDate: updates.dueDate || '',
        projectId: updates.projectId || '',
        notes: updates.notes || ''
      };
      return updateTask({ id, ...newAssignment });
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
