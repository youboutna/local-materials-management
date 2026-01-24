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
  project_id: string;
  phase_id: string | null;
  step_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  assigned_to: string[];
  assigned_by: string | null;
  start_date: string | null;
  end_date: string | null;
  due_date: string | null;
  completion_date: string | null;
  estimated_duration: number | null;
  actual_duration: number | null;
  dependencies: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}
