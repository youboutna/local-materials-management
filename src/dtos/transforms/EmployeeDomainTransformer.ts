/**
 * Employee Domain Transformer
 * Transforms between domain entities and DTOs for employees
 * Following hexagonal architecture principles
 */

import { Employee } from '@/domain/entities/Employee';
import { EmployeeDTO, CreateEmployeeRequestDto, UpdateEmployeeRequestDto } from '@/dtos/entities';

export class EmployeeDomainTransformer {
  /**
   * Transform domain entity to DTO
   */
  static toDTO(employee: Employee): EmployeeDTO {
    return {
      id: employee.id,
      user_id: employee.userId,
      full_name: employee.fullName,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      department: employee.department,
      hire_date: employee.hireDate,
      salary: employee.salary,
      is_active: employee.isActive,
      created_at: employee.createdAt,
      updated_at: employee.updatedAt
    };
  }

  /**
   * Transform DTO to domain entity
   */
  static toEntity(dto: EmployeeDTO): Employee {
    return {
      id: dto.id,
      userId: dto.user_id,
      fullName: dto.full_name,
      email: dto.email,
      phone: dto.phone,
      position: dto.position,
      department: dto.department,
      hireDate: dto.hire_date,
      salary: dto.salary,
      isActive: dto.is_active,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at
    };
  }

  /**
   * Transform CreateEmployeeRequestDto to domain entity
   */
  static toEntityFromCreateDto(dto: CreateEmployeeRequestDto): Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      userId: dto.user_id,
      fullName: dto.full_name,
      email: dto.email,
      phone: dto.phone,
      position: dto.position,
      department: dto.department,
      hireDate: dto.hire_date,
      salary: dto.salary,
      isActive: true
    };
  }

  /**
   * Transform UpdateEmployeeRequestDto to partial domain entity
   */
  static toEntityFromUpdateDto(dto: UpdateEmployeeRequestDto): Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>> {
    return {
      userId: dto.user_id,
      fullName: dto.full_name,
      email: dto.email,
      phone: dto.phone,
      position: dto.position,
      department: dto.department,
      hireDate: dto.hire_date,
      salary: dto.salary,
      isActive: dto.is_active
    };
  }

  /**
   * Transform domain entity to database row
   */
  static toDatabaseRow(employee: Employee): any {
    return {
      id: employee.id,
      user_id: employee.userId,
      full_name: employee.fullName,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      department: employee.department,
      hire_date: employee.hireDate,
      salary: employee.salary,
      is_active: employee.isActive,
      created_at: employee.createdAt,
      updated_at: employee.updatedAt
    };
  }

  /**
   * Transform database row to domain entity
   */
  static toEntityFromDatabaseRow(row: any): Employee {
    return {
      id: row.id,
      userId: row.user_id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      position: row.position,
      department: row.department,
      hireDate: row.hire_date,
      salary: row.salary || 0,
      isActive: row.is_active ?? true,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Transform array of domain entities to DTOs
   */
  static toDTOs(employees: Employee[]): EmployeeDTO[] {
    return employees.map(employee => this.toDTO(employee));
  }

  /**
   * Transform array of DTOs to domain entities
   */
  static toEntities(dtos: EmployeeDTO[]): Employee[] {
    return dtos.map(dto => this.toEntity(dto));
  }
}
