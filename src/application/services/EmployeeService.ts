/**
 * Employee Service
 * Implements business logic for employee management
 */

import { Employee } from '@/domain/entities/Employee';
import { IEmployeeRepository } from '@/domain/repositories/IEmployeeRepository';
import {
    CreateEmployeeDTO,
    EmployeeDepartment,
    EmployeeDTO,
    EmployeeRole,
    EmployeeStatus,
    EmployeeType,
    SearchEmployeesOptions,
    SearchEmployeesResult,
    UpdateEmployeeDTO
} from '@/dtos/entities/EmployeeDTO';
import { EmployeeTransformer } from '@/dtos/transforms/EmployeeTransformer';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export class EmployeeService {
  constructor(private employeeRepository: IEmployeeRepository = RepositoryFactory.getEmployeeRepository()) {}

  /**
   * Get employees by phase ID
   */
  async getEmployeesByPhase(phaseId: string): Promise<EmployeeDTO[]> {
    try {
      if (!phaseId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      // Get all employees and filter by their current assignments
      const allEmployees = await this.employeeRepository.findAll();
      
      // For now, return employees that could be assigned to phases
      // In a real implementation, this would query phase_assignments table
      const activeEmployees = allEmployees.filter(employee => employee.isActive);
      
      return activeEmployees.map(employee => this.employeeToDTO(employee));
    } catch (error) {
      console.error('EmployeeService.getEmployeesByPhase failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get employees by phase');
    }
  }

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

      const employeeDTOs = employees.map(emp => this.employeeToDTO(emp));
      return { employees: employeeDTOs, total: employees.length };
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

  async getAllEmployees(): Promise<EmployeeDTO[]> {
    try {
      const employees = await this.employeeRepository.findAll();
      return employees.map(emp => this.employeeToDTO(emp));
    } catch (error) {
      console.error('EmployeeService.getAllEmployees failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get all employees');
    }
  }

  /**
   * Create a new employee
   */
  async createEmployee(employeeData: CreateEmployeeDTO): Promise<EmployeeDTO> {
    try {
      const employee = new Employee(
        this.generateId(),
        this.generateEmployeeId(),
        employeeData.fullName || `${employeeData.firstName} ${employeeData.lastName}`,
        employeeData.email || null,
        employeeData.phone || null,
        employeeData.position || null,
        employeeData.department as any || null,
        employeeData.role as any || { name: 'employee', permissions: [] },
        employeeData.startDate || null,
        employeeData.salary || null,
        employeeData.status !== EmployeeStatus.INACTIVE,
        null, // user
        null, // manager
        null, // superior
        [], // directReports
        [], // managedProjects
        [], // teamMembers
        employeeData.skills || [],
        (employeeData.certifications || []).map(c => ({ 
        id: '',
        name: c, 
        issuedBy: 'system',
        expiryDate: new Date().toISOString(),
        employeeId: this.generateId()
      } as any)),
        new Date().toISOString(), // createdAt
        new Date().toISOString()  // updatedAt
      );
      
      await this.employeeRepository.save(employee);
      
      return EmployeeTransformer.toDTO(employee);
    } catch (error) {
      console.error('EmployeeService.createEmployee failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create employee');
    }
  }

  /**
   * Update an existing employee
   */
  async updateEmployee(id: string, updates: UpdateEmployeeDTO): Promise<EmployeeDTO> {
    try {
      const existingEmployee = await this.employeeRepository.findById(id);
      if (!existingEmployee) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Employee not found');
      }

      // Convert UpdateEmployeeDTO to Partial<Employee>
      const employeeUpdates: Partial<Employee> = {
        fullName: updates.fullName,
        email: updates.email,
        phone: updates.phone,
        position: updates.position,
        department: updates.department as unknown as Employee['department'] || null,
        isActive: updates.status ? updates.status !== EmployeeStatus.INACTIVE : undefined,
        skills: updates.skills
      };

      await this.employeeRepository.update(id, employeeUpdates);
      
      // Return updated employee - convert to DTO
      const updatedEmployee = await this.employeeRepository.findById(id);
      if (!updatedEmployee) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to retrieve updated employee');
      }
      
      return this.employeeToDTO(updatedEmployee);
    } catch (error) {
      console.error('EmployeeService.updateEmployee failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update employee');
    }
  }

  /**
   * Delete an employee
   */
  async deleteEmployee(id: string): Promise<void> {
    try {
      const existingEmployee = await this.employeeRepository.findById(id);
      if (!existingEmployee) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Employee not found');
      }

      await this.employeeRepository.delete(id);
    } catch (error) {
      console.error('EmployeeService.deleteEmployee failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete employee');
    }
  }

  /**
   * Convert Employee entity to EmployeeDTO
   */
  private employeeToDTO(employee: Employee): EmployeeDTO {
    return {
      id: employee.id,
      employeeId: employee.employeeId,
      firstName: employee.fullName?.split(' ')[0] || '',
      lastName: employee.fullName?.split(' ').slice(1).join(' ') || '',
      fullName: employee.fullName,
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position || '',
      department: ((employee.department as string) || 'engineering') as EmployeeDepartment,
      role: ((employee.role?.name as string) || 'employee') as EmployeeRole,
      type: EmployeeType.FULL_TIME,
      status: employee.isActive ? EmployeeStatus.ACTIVE : EmployeeStatus.INACTIVE,
      salary: employee.salary || 0,
      skills: employee.skills || [],
      certifications: (employee.certifications || []).map(c => typeof c === 'string' ? c : c.name || ''),
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt
    };
  }

  /**
   * Helper method to generate ID
   */
  private generateId(): string {
    return `emp_${Date.now()}_${crypto.randomUUID().slice(0, 9)}`;
  }

  /**
   * Helper method to generate employee ID
   */
  private generateEmployeeId(): string {
    return `EMP${Date.now().toString().slice(-6)}`;
  }
}
