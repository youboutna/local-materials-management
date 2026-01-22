/**
 * Employee Service
 * Implements business logic for employee management
 */

import { IEmployeeRepository } from '@/domain/repositories/IEmployeeRepository';
import { Employee } from '@/domain/entities/Employee';
import { AppError, ErrorCode } from '@/utils/errorHandling';

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
      let employees: Employee[];
      
      if (options.isActive === true) {
        employees = await this.employeeRepository.findActive();
      } else if (options.searchTerm) {
        employees = await this.employeeRepository.search(options.searchTerm);
      } else {
        employees = await this.employeeRepository.findAll();
      }

      if (options.limit) {
        employees = employees.slice(0, options.limit);
      }

      return { employees, total: employees.length };
    } catch (error) {
      console.error('EmployeeService.searchEmployees failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to search employees');
    }
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      return await this.employeeRepository.findById(id);
    } catch (error) {
      console.error('EmployeeService.getEmployeeById failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get employee');
    }
  }

  async getActiveEmployees(): Promise<Employee[]> {
    try {
      return await this.employeeRepository.findActive();
    } catch (error) {
      console.error('EmployeeService.getActiveEmployees failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get active employees');
    }
  }

  async getInspectors(): Promise<Employee[]> {
    try {
      return await this.employeeRepository.findInspectors();
    } catch (error) {
      console.error('EmployeeService.getInspectors failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get inspectors');
    }
  }

  async getProjectManagers(): Promise<Employee[]> {
    try {
      return await this.employeeRepository.findProjectManagers();
    } catch (error) {
      console.error('EmployeeService.getProjectManagers failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project managers');
    }
  }

  async getAllEmployees(): Promise<Employee[]> {
    try {
      return await this.employeeRepository.findAll();
    } catch (error) {
      console.error('EmployeeService.getAllEmployees failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get all employees');
    }
  }
}
