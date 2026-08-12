// @ts-nocheck
/**
 * Supabase Employee Adapter
 * Implements IEmployeeRepository using Supabase
 */

import { IEmployeeRepository, SearchEmployeesOptions, SearchEmployeesResult } from '@/domain/repositories/IEmployeeRepository';
import { Employee } from '@/domain/entities/EmployeeEntity';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { AppError, ErrorLogger } from '@/utils/errorHandling';

export class SupabaseEmployeeAdapter implements IEmployeeRepository {
  
  async findById(id: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        ErrorLogger.log('error', 'SupabaseEmployeeAdapter.findById failed', { id, error });
        throw new AppError(error.message, 'EMPLOYEE_FIND_ERROR');
      }

      return data ? this.mapToEmployee(data) : null;
    } catch (error) {
      ErrorLogger.log('error', 'SupabaseEmployeeAdapter.findById unexpected error', { id, error });
      throw new AppError('Failed to find employee', 'EMPLOYEE_FIND_ERROR');
    }
  }

  async searchEmployees(options: SearchEmployeesOptions = {}): Promise<SearchEmployeesResult> {
    try {
      let query = supabase
        .from('employees')
        .select('id, full_name, position, department, email, phone, employee_id, is_active, created_at, updated_at')
        .order('full_name', { ascending: true });

      // Apply search filter
      if (options.searchTerm) {
        query = query.or(
          `full_name.ilike.%${options.searchTerm}%,position.ilike.%${options.searchTerm}%,department.ilike.%${options.searchTerm}%,employee_id.ilike.%${options.searchTerm}%`
        );
      }

      // Apply department filter
      if (options.departmentFilter?.length) {
        query = query.in('department', options.departmentFilter as any);
      }

      // Apply position filter
      if (options.positionFilter?.length) {
        query = query.in('position', options.positionFilter as any);
      }

      // Apply active filter
      if (options.isActive !== undefined) {
        query = query.eq('is_active', options.isActive);
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        ErrorLogger.log('error', 'SupabaseEmployeeAdapter.searchEmployees failed', { options, error });
        throw new AppError(error.message, 'EMPLOYEE_SEARCH_ERROR');
      }

      const employees = data ? data.map(this.mapToEmployee) : [];

      return {
        employees,
        total: employees.length
      };
    } catch (error) {
      ErrorLogger.log('error', 'SupabaseEmployeeAdapter.searchEmployees unexpected error', { options, error });
      throw new AppError('Failed to search employees', 'EMPLOYEE_SEARCH_ERROR');
    }
  }

  async findAll(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) {
        ErrorLogger.log('error', 'SupabaseEmployeeAdapter.findAll failed', { error });
        throw new AppError(error.message, 'EMPLOYEE_FIND_ALL_ERROR');
      }

      return data ? data.map(this.mapToEmployee) : [];
    } catch (error) {
      ErrorLogger.log('error', 'SupabaseEmployeeAdapter.findAll unexpected error', { error });
      throw new AppError('Failed to get all employees', 'EMPLOYEE_FIND_ALL_ERROR');
    }
  }

  async create(employeeData: Omit<Employee, 'id'>): Promise<Employee> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert(employeeData)
        .select()
        .single();

      if (error) {
        ErrorLogger.log('error', 'SupabaseEmployeeAdapter.create failed', { employeeData, error });
        throw new AppError(error.message, 'EMPLOYEE_CREATE_ERROR');
      }

      if (!data) {
        throw new AppError('Failed to create employee', 'EMPLOYEE_CREATE_ERROR');
      }

      return this.mapToEmployee(data);
    } catch (error) {
      ErrorLogger.log('error', 'SupabaseEmployeeAdapter.create unexpected error', { employeeData, error });
      throw new AppError('Failed to create employee', 'EMPLOYEE_CREATE_ERROR');
    }
  }

  async update(id: string, employeeData: Partial<Employee>): Promise<Employee> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(employeeData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        ErrorLogger.log('error', 'SupabaseEmployeeAdapter.update failed', { id, employeeData, error });
        throw new AppError(error.message, 'EMPLOYEE_UPDATE_ERROR');
      }

      if (!data) {
        throw new AppError('Failed to update employee', 'EMPLOYEE_UPDATE_ERROR');
      }

      return this.mapToEmployee(data);
    } catch (error) {
      ErrorLogger.log('error', 'SupabaseEmployeeAdapter.update unexpected error', { id, employeeData, error });
      throw new AppError('Failed to update employee', 'EMPLOYEE_UPDATE_ERROR');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) {
        ErrorLogger.log('error', 'SupabaseEmployeeAdapter.delete failed', { id, error });
        throw new AppError(error.message, 'EMPLOYEE_DELETE_ERROR');
      }
    } catch (error) {
      ErrorLogger.log('error', 'SupabaseEmployeeAdapter.delete unexpected error', { id, error });
      throw new AppError('Failed to delete employee', 'EMPLOYEE_DELETE_ERROR');
    }
  }

  async findByDepartment(department: string): Promise<Employee[]> {
    return this.searchEmployees({ departmentFilter: [department] }).then(result => result.employees);
  }

  async findByPosition(position: string): Promise<Employee[]> {
    return this.searchEmployees({ positionFilter: [position] }).then(result => result.employees);
  }

  async findActive(): Promise<Employee[]> {
    return this.searchEmployees({ isActive: true }).then(result => result.employees);
  }

  private mapToEmployee(data: any): Employee {
    return {
      id: data.id,
      full_name: data.full_name,
      position: data.position,
      department: data.department,
      email: data.email,
      phone: data.phone,
      employee_id: data.employee_id,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }
}
