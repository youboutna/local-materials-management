/**
 * Task Assignment Data Transfer Objects
 * Centralized for hexagonal architecture
 */

export interface TaskAssignmentDTO {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  assignedTo?: string;
  assignedBy?: string;
  assigneeType?: string;
  status: string;
  priority: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskAssignmentRequestDTO {
  title: string;
  description?: string;
  projectId?: string;
  assignedTo?: string;
  assignedBy?: string;
  assigneeType?: string;
  priority?: string;
  dueDate?: string;
}

export interface UpdateTaskAssignmentRequestDTO {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
}

export interface TaskAssignmentFiltersDTO {
  projectId?: string;
  assignedTo?: string;
  assignedBy?: string;
  status?: string;
  priority?: string;
  assigneeType?: string;
}

export interface CreateTaskAssignmentWithAssignerRequestDTO {
  taskData: CreateTaskAssignmentRequestDTO;
  assignedBy?: string;
}

export interface GetTaskAssignmentByIdRequestDTO {
  id: string;
}

export interface UpdateTaskAssignmentWithIdRequestDTO {
  id: string;
  updates: UpdateTaskAssignmentRequestDTO;
}

export interface DeleteTaskAssignmentRequestDTO {
  id: string;
}

export interface GetTaskAssignmentsWithFiltersRequestDTO {
  filters?: TaskAssignmentFiltersDTO;
}

export interface GetTaskAssignmentsByProjectRequestDTO {
  projectId: string;
}

export interface GetTaskAssignmentsAssignedToRequestDTO {
  userId: string;
}

export interface GetTaskAssignmentsAssignedByRequestDTO {
  userId: string;
}

export interface GetTaskAssignmentsDueSoonRequestDTO {
  days?: number;
}

export interface SearchTaskAssignmentsRequestDTO {
  searchTerm: string;
}

export interface GetTaskAssignmentsByStatusRequestDTO {
  status: string;
}

export interface GetTaskAssignmentsByPriorityRequestDTO {
  priority: string;
}

export interface GetTaskAssignmentsByAssigneeTypeRequestDTO {
  assigneeType: string;
}

export interface TaskAssignmentStatsDTO {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byAssigneeType: Record<string, number>;
  overdue: number;
  dueSoon: number;
}

export interface TaskAssignmentValidationResultDTO {
  isValid: boolean;
  errors: string[];
}
