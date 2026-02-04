/**
 * Types for Hexagonal Hooks
 * Centralized interface exports for all hexagonal hooks
 * Following hexagonal architecture principles
 */

import { UserResponseDto } from '@/dtos/entities/EmployeeDTO';
import { TaskAssignmentDTO } from '@/dtos/entities/TaskDTO';
import { DocumentResponseDto } from '@/dtos/entities/DocumentDTO';
import { ProjectResponseDto } from '@/dtos/entities/ProjectDTO';
import { MaterialResponseDto } from '@/dtos/entities/MaterialDTO';
import { InspectionResponseDto } from '@/dtos/entities/InspectionDTO';
import { AuthResponseDto } from '@/dtos/entities/AuthDTO';
import { StakeholderResponseDTO as SupplierResponseDto } from '@/dtos/entities/StakeholderDTO';

type UseQueryOptions<T> = {
  enabled?: boolean;
  retry?: boolean;
  staleTime?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
};

type UseMutationOptions<T, V> = {
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: Error, variables: V) => void;
};

export interface UseSuppliersHexResult {
  suppliers: SupplierResponseDto[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createSupplier: (userData: SupplierResponseDto) => Promise<SupplierResponseDto>;
  updateSupplier: (params: { id: string; updates: SupplierResponseDto }) => Promise<SupplierResponseDto>;
  deleteSupplier: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface UseUsersHexResult {
  users: UserResponseDto[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createUser: (userData: UserResponseDto) => Promise<UserResponseDto>;
  updateUser: (params: { id: string; updates: UserResponseDto }) => Promise<UserResponseDto>;
  toggleUserStatus: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isToggling: boolean;
}

export interface UseTaskAssignmentsHexResult {
  taskAssignments: TaskAssignmentDTO[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createTaskAssignment: (data: TaskAssignmentDTO) => Promise<TaskAssignmentDTO>;
  updateTaskAssignment: (params: { id: string; updates: TaskAssignmentDTO }) => Promise<TaskAssignmentDTO>;
  deleteTaskAssignment: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface UseDocumentsHexResult {
  documents: DocumentResponseDto[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createDocument: (data: DocumentResponseDto) => Promise<DocumentResponseDto>;
  updateDocument: (params: { id: string; updates: DocumentResponseDto }) => Promise<DocumentResponseDto>;
  deleteDocument: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface UseProjectsHexResult {
  projects: ProjectResponseDto[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createProject: (data: ProjectResponseDto) => Promise<ProjectResponseDto>;
  updateProject: (params: { id: string; updates: ProjectResponseDto }) => Promise<ProjectResponseDto>;
  deleteProject: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface UseMaterialsHexResult {
  materials: MaterialResponseDto[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createMaterial: (data: MaterialResponseDto) => Promise<MaterialResponseDto>;
  updateMaterial: (params: { id: string; updates: MaterialResponseDto }) => Promise<MaterialResponseDto>;
  deleteMaterial: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface UseInspectionsHexResult {
  inspections: InspectionResponseDto[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createInspection: (data: InspectionResponseDto) => Promise<InspectionResponseDto>;
  updateInspection: (params: { id: string; updates: InspectionResponseDto }) => Promise<InspectionResponseDto>;
  deleteInspection: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface UseAuthHexResult {
  user: AuthResponseDto['user'] | null;
  error: Error | null;
  login: (credentials: AuthResponseDto) => Promise<AuthResponseDto>;
  register: (userData: AuthResponseDto) => Promise<AuthResponseDto>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

// Common pagination and query results
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface QueryResult<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
  dataUpdatedAt: string;
}

// Common mutation results
export interface MutationResult<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
  isSuccess: boolean;
  reset: () => void;
}

// Error handling
export interface ApiError {
  message: string;
  code: string;
  details?: any;
  status: number;
}
