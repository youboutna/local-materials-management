/**
 * Milestone DTOs
 * Data transfer objects for API/UI exchanges
 * NOT domain entities - just data structures
 */

export interface MilestoneDependencyDTO {
  id: string;
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  description: string;
  dependsOn: string; // Milestone ID
  lagDays?: number;
}

export interface MilestoneDeliverableDTO {
  id: string;
  name: string;
  description: string;
  type: 'document' | 'inspection' | 'payment' | 'approval';
  status: 'pending' | 'completed' | 'rejected';
  dueDate?: string;
  completedDate?: string;
  assignedTo?: string;
  documents?: string[]; // Document IDs only for DTO
}

export interface MilestoneConfigurationDTO {
  templateId?: string;
  phaseId?: string;
  isCustom: boolean;
  autoGenerateTasks: boolean;
  notificationSettings: {
    dueDateReminder: boolean;
    completionAlert: boolean;
    delayAlert: boolean;
  };
}

export interface MilestoneDTO {
  id: string;
  projectId: string;
  name: string;
  description: string;
  type: 'milestone' | 'checkpoint' | 'deliverable' | 'validation';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'overdue';
  progress: number;
  plannedDate: string;
  actualDate?: string;
  dueDate?: string;
  budget?: number;
  actualCost?: number;
  dependencies?: MilestoneDependencyDTO[];
  deliverables?: MilestoneDeliverableDTO[];
  configuration?: MilestoneConfigurationDTO;
  phases?: string[]; // Phase IDs only for DTO
  tasks?: string[]; // Task IDs only for DTO
  inspections?: string[]; // Inspection IDs only for DTO
  documents?: string[]; // Document IDs only for DTO
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMilestoneRequestDTO {
  projectId: string;
  name: string;
  description: string;
  type: 'milestone' | 'checkpoint' | 'deliverable' | 'validation';
  plannedDate: string;
  dueDate?: string;
  budget?: number;
  dependencies?: MilestoneDependencyDTO[];
  deliverables?: MilestoneDeliverableDTO[];
  configuration?: MilestoneConfigurationDTO;
}

export interface UpdateMilestoneRequestDTO {
  name?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'overdue';
  progress?: number;
  actualDate?: string;
  dueDate?: string;
  actualCost?: number;
  dependencies?: MilestoneDependencyDTO[];
  deliverables?: MilestoneDeliverableDTO[];
}
