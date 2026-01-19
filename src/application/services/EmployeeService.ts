/**
 * Employee Service
 * Implements business logic for employee management
 */

import { IEmployeeRepository } from '@/domain/repositories/IEmployeeRepository';
import { Employee } from '@/domain/entities/Employee';
import { AppError, ErrorLogger } from '@/utils/errorHandling';

export interface SearchEmployeesOptions {
  searchTerm?: string;
  departmentFilter?: string[];
  positionFilter?: string[];
  isActive?: boolean;
  limit?: number;
}

export interface SearchEmployeesResult {
  employees: Employee[];
  total: number;
}

export class EmployeeService {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async searchEmployees(options: SearchEmployeesOptions = {}): Promise<SearchEmployeesResult> {
    try {
      const result = await this.employeeRepository.searchEmployees(options);
      
      ErrorLogger.log('info', 'Employees searched successfully', {
        searchTerm: options.searchTerm,
        departmentFilter: options.departmentFilter,
        resultCount: result.employees.length
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search employees';
      ErrorLogger.log('error', 'EmployeeService.searchEmployees failed', { 
        options, 
        error: errorMessage 
      });
      
      throw new AppError(errorMessage, 'EMPLOYEE_SEARCH_ERROR');
    }
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const employee = await this.employeeRepository.findById(id);
      
      if (!employee) {
        ErrorLogger.log('warning', 'Employee not found', { employeeId: id });
        return null;
      }

      return employee;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get employee';
      ErrorLogger.log('error', 'EmployeeService.getEmployeeById failed', { 
        employeeId: id, 
        error: errorMessage 
      });
      
      throw new AppError(errorMessage, 'EMPLOYEE_GET_ERROR');
    }
  }

  async getActiveEmployees(): Promise<Employee[]> {
    try {
      const result = await this.employeeRepository.searchEmployees({ 
        isActive: true,
        limit: 100 
      });
      
      return result.employees;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get active employees';
      ErrorLogger.log('error', 'EmployeeService.getActiveEmployees failed', { 
        error: errorMessage 
      });
      
      throw new AppError(errorMessage, 'ACTIVE_EMPLOYEES_ERROR');
    }
  }

  async createEmployee(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    try {
      const newEmployee = new Employee(
        crypto.randomUUID(),
        employeeData.department || null,
        employeeData.position || null,
        employeeData.salary || null,
        employeeData.hireDate || null,
        employeeData.managerId || null,
        employeeData.fullName || '',
        employeeData.email || '',
        employeeData.phone || null,
        employeeData.address || null,
        employeeData.skills || [],
        employeeData.isActive !== undefined ? employeeData.isActive : true
      );

      await this.employeeRepository.save(newEmployee);
      ErrorLogger.log('info', 'Employee created successfully', { 
        employeeId: newEmployee.id 
      });

      return newEmployee;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create employee';
      ErrorLogger.log('error', 'EmployeeService.createEmployee failed', { 
        employeeData, 
        error: errorMessage 
      });
      
      throw new AppError(errorMessage, 'EMPLOYEE_CREATE_ERROR');
    }
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    try {
      const existingEmployee = await this.employeeRepository.findById(id);
      if (!existingEmployee) {
        throw new AppError('Employee not found', 'EMPLOYEE_NOT_FOUND_ERROR');
      }

      const updatedEmployee = { ...existingEmployee, ...updates } as Employee;
      const result = await this.employeeRepository.save(updatedEmployee);
      
      ErrorLogger.log('info', 'Employee updated successfully', { 
        employeeId: id,
        updates: Object.keys(updates)
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update employee';
      ErrorLogger.log('error', 'EmployeeService.updateEmployee failed', { 
        id, 
        updates, 
        error: errorMessage 
      });
      
      throw new AppError(errorMessage, 'EMPLOYEE_UPDATE_ERROR');
    }
  }
}
