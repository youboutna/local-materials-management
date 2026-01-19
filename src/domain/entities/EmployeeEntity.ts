/**
 * Employee Entity
 * Represents an employee in the domain
 */

export interface Employee {
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

export type EmployeeDepartment = 'engineering' | 'construction' | 'quality' | 'administration' | 'finance' | 'procurement';
export type EmployeePosition = 'engineer' | 'technician' | 'manager' | 'supervisor' | 'inspector' | 'analyst';
