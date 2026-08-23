/**
 * Task Types
 * Domain types for Task entity
 * Pure types without business logic
 */

export type TaskStatus = 
  | 'not_started' 
  | 'in_progress' 
  | 'completed' 
  | 'delayed' 
  | 'blocked' 
  | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskData {
  id: string;
  projectId: string;
  phaseId: string | null;
  stepId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  assignedTo: string[];
  assignedBy: string | null;
  startDate: string | null;
  endDate: string | null;
  dueDate: string | null;
  completionDate: string | null;
  estimatedDuration: number | null;
  actualDuration: number | null;
  dependencies: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
