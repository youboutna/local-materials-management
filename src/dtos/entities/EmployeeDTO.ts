/**
 * Employee Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO, ContactInfoDTO } from '../shared';

export interface EmployeeDTO extends BaseEntityDTO {
  employeeId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  hireDate: string | null;
  isActive: boolean;
  salary: number | null;
  skills: string[] | null;
  certifications: Record<string, unknown> | null;
  managerId: string | null;
  superiorId: string | null;
  userId: string | null;
}

export interface EmployeeDetailsDTO extends EmployeeDTO {
  contactInfo?: ContactInfoDTO;
  managerDetails?: {
    id: string;
    fullName: string;
    position: string;
  };
  teamMembers?: EmployeeDTO[];
  projects?: Array<{
    id: string;
    title: string;
    role: string;
  }>;
  performanceMetrics?: {
    tasksCompleted: number;
    averageCompletionTime: number;
    qualityScore: number;
  };
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    uploadedAt: string;
  }>;
}

export interface EmployeeSummaryDTO {
  id: string;
  employeeId: string;
  fullName: string;
  position?: string;
  department?: string;
  isActive: boolean;
  projectCount?: number;
  taskCount?: number;
  averagePerformance?: number;
}

export interface CreateEmployeeDTO {
  employeeId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  hireDate: string | null;
  isActive: boolean;
  salary: number | null;
  skills: string[] | null;
  certifications: Record<string, unknown> | null;
  managerId: string | null;
  superiorId: string | null;
  userId: string | null;
}

export interface UpdateEmployeeDTO extends Partial<CreateEmployeeDTO> {
  isActive?: boolean;
}

export interface EmployeeFilterDTO {
  department?: string;
  position?: string;
  isActive?: boolean;
  skills?: string[];
  managerId?: string;
  searchQuery?: string;
}

// Legacy compatibility types from transforms
export type EmployeeDepartment = 'engineering' | 'construction' | 'quality' | 'administration' | 'finance' | 'procurement';
export type EmployeePosition = 'engineer' | 'technician' | 'manager' | 'supervisor' | 'inspector' | 'analyst';

// Legacy request DTOs for backward compatibility
export interface CreateEmployeeRequestDTO {
  full_name: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  employee_id: string;
}

export interface UpdateEmployeeRequestDTO {
  full_name?: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
}
