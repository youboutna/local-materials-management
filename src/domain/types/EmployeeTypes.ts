/**
 * Employee Types
 * Domain types for Employee entity
 * Pure types without business logic
 */

export type Permission = 
  | 'approve_projects'
  | 'approve_payments'
  | 'schedule_inspections'
  | 'execute_inspections'
  | 'manage_team'
  | 'manage_users'
  | 'manage_system';

export type Department = 
  | 'engineering'
  | 'construction'
  | 'quality'
  | 'administration'
  | 'finance'
  | 'procurement';

export type EmployeeRole = 
  | 'admin'
  | 'director'
  | 'project_manager'
  | 'technical_manager'
  | 'engineering_consultant'
  | 'supervisor'
  | 'inspector'
  | 'finance_manager'
  | 'legal'
  | 'worker'
  | 'supplier';

// Interface for data structure
export interface EmployeeData {
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
