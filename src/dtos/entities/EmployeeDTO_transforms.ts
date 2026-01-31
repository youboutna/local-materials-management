/**
 * Employee DTOs
 * Data transfer objects for API/UI exchanges
 * NOT domain entities - just data structures
 */

export interface EmployeeDTO {
  id: string;
  full_name: string;
  position?: string | null;
  department?: string | null;
  email?: string | null;
  phone?: string | null;
  employee_id: string;
  is_active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

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

export type EmployeeDepartment = 'engineering' | 'construction' | 'quality' | 'administration' | 'finance' | 'procurement';
export type EmployeePosition = 'engineer' | 'technician' | 'manager' | 'supervisor' | 'inspector' | 'analyst';
