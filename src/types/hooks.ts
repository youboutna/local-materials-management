/**
 * Types for Hexagonal Hooks
 * Centralized interface exports for all hexagonal hooks
 * Following hexagonal architecture principles
 */

// Suppliers
export interface SupplierResponseDto {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  nif?: string;
  category: string;
  status: string;
  rating?: number;
  contacts: any[];
  isVerified: boolean;
  verifiedAt?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseSuppliersHexResult {
  suppliers: SupplierResponseDto[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createSupplier: (userData: any) => Promise<SupplierResponseDto>;
  updateSupplier: (params: { id: string; updates: any }) => Promise<SupplierResponseDto>;
  deleteSupplier: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

// Users
export interface UserResponseDto {
  id: string;
  fullName: string | null;
  phone: string | null;
  nationalId: string | null;
  avatarUrl: string | null;
  email: string | null;
  roles: string[];
  primaryRole: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UseUsersHexResult {
  users: UserResponseDto[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createUser: (userData: any) => Promise<UserResponseDto>;
  updateUser: (params: { id: string; updates: any }) => Promise<UserResponseDto>;
  toggleUserStatus: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isToggling: boolean;
}

// Task Assignments
export interface TaskAssignmentResponseDto {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  projectId: string;
  projectName: string;
  taskId: string;
  taskTitle: string;
  status: string;
  priority: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseTaskAssignmentsHexResult {
  taskAssignments: TaskAssignmentResponseDto[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createTaskAssignment: (data: any) => Promise<TaskAssignmentResponseDto>;
  updateTaskAssignment: (params: { id: string; updates: any }) => Promise<TaskAssignmentResponseDto>;
  deleteTaskAssignment: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

// Documents
export interface DocumentResponseDto {
  id: string;
  title: string;
  description: string;
  documentType: string;
  projectId: string | null;
  status: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseDocumentsHexResult {
  documents: DocumentResponseDto[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createDocument: (data: any) => Promise<DocumentResponseDto>;
  updateDocument: (params: { id: string; updates: any }) => Promise<DocumentResponseDto>;
  deleteDocument: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

// Projects
export interface ProjectResponseDto {
  id: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface UseProjectsHexResult {
  projects: ProjectResponseDto[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createProject: (data: any) => Promise<ProjectResponseDto>;
  updateProject: (params: { id: string; updates: any }) => Promise<ProjectResponseDto>;
  deleteProject: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

// Materials
export interface MaterialResponseDto {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  unitPrice: number;
  stock: number;
  minStock: number;
  projectId: string | null;
  supplierId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UseMaterialsHexResult {
  materials: MaterialResponseDto[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createMaterial: (data: any) => Promise<MaterialResponseDto>;
  updateMaterial: (params: { id: string; updates: any }) => Promise<MaterialResponseDto>;
  deleteMaterial: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

// Inspections
export interface InspectionResponseDto {
  id: string;
  title: string;
  description: string;
  projectId: string;
  inspectionDate: string;
  inspectorId: string;
  status: string;
  findings: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UseInspectionsHexResult {
  inspections: InspectionResponseDto[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createInspection: (data: any) => Promise<InspectionResponseDto>;
  updateInspection: (params: { id: string; updates: any }) => Promise<InspectionResponseDto>;
  deleteInspection: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

// Auth
export interface AuthResponseDto {
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name: string;
      avatar_url: string;
    };
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: string;
    user: any;
  };
}

export interface UseAuthHexResult {
  user: AuthResponseDto['user'] | null;
  error: Error | null;
  login: (credentials: any) => Promise<AuthResponseDto>;
  register: (userData: any) => Promise<AuthResponseDto>;
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
