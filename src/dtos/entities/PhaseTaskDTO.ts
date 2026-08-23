/**
 * Phase Task Data Transfer Objects
 * Specific DTOs for phase task management
 */

import { BaseEntityDTO } from '../shared';

export interface PhaseTaskDTO extends BaseEntityDTO {
  title: string;
  description?: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  progress?: number;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  phaseId: string;
  projectId?: string;
  notes?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  assigneeType?: string;
}

export interface CreatePhaseTaskDTO {
  title: string;
  description?: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  progress?: number;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  phaseId: string;
  projectId?: string;
  notes?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  assigneeType?: string;
}

export type UpdatePhaseTaskDTO = Partial<CreatePhaseTaskDTO>;

export interface PhaseTaskFormData {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  startDate?: string;
  assignedTo?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  assigneeType?: string;
  notes?: string;
}
