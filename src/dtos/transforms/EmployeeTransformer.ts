/**
 * Employee Transformer - Hexagonal Architecture
 * Transforms between Employee entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 * Includes functionality from EmployeeDomainTransformer
 */

import { Employee } from '@/domain/entities/Employee';
import { EmployeeDTO, CreateEmployeeDTO, UpdateEmployeeDTO } from '@/dtos/entities/EmployeeDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';

export class EmployeeTransformer implements EntityToDTOMapper<Employee, EmployeeDTO> {
  /**
   * Transform Employee entity to EmployeeDTO (Domain Entity → DTO)
   * Converts domain entity to data transfer object for UI layer
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toDTO(entity: Employee): EmployeeDTO {
    return {
      id: entity.id,
      userId: entity.userId,
      fullName: entity.fullName,
      email: entity.email,
      phone: entity.phone,
      position: entity.position,
      department: entity.department,
      hireDate: entity.hireDate,
      salary: entity.salary,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Transform EmployeeDTO to Employee entity (DTO → Domain Entity)
   * Converts data transfer object to domain entity
   * Following hexagonal architecture: Presentation → Application → Domain
   */
  static toEntity(dto: EmployeeDTO): Employee {
    return {
      id: dto.id,
      userId: dto.userId,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      position: dto.position,
      department: dto.department,
      hireDate: dto.hireDate,
      salary: dto.salary,
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  /**
   * Transform CreateEmployeeDTO to Employee entity
   */
  static fromCreateDTOToEntity(dto: CreateEmployeeDTO): Employee {
    return {
      id: dto.id || crypto.randomUUID(),
      userId: dto.userId || '',
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone || null,
      position: dto.position || '',
      department: dto.department || '',
      hireDate: dto.hireDate || null,
      salary: dto.salary || 0,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      createdAt: dto.createdAt || new Date().toISOString(),
      updatedAt: dto.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Transform UpdateEmployeeDTO to partial Employee entity
   */
  static fromUpdateDTOToEntity(dto: UpdateEmployeeDTO): Partial<Employee> {
    return {
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      position: dto.position,
      department: dto.department,
      hireDate: dto.hireDate,
      salary: dto.salary,
      isActive: dto.isActive,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Validate employee data for business rules
   */
  static validateEmployeeData(employee: Partial<Employee>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!employee.fullName || employee.fullName.trim() === '') {
      errors.push('Employee full name is required');
    }
    
    if (!employee.email || employee.email.trim() === '') {
      errors.push('Employee email is required');
    } else if (!employee.email.includes('@')) {
      errors.push('Invalid email format');
    }
    
    if (employee.salary !== undefined && employee.salary < 0) {
      errors.push('Salary cannot be negative');
    }
    
    if (employee.position && employee.position.trim() === '') {
      errors.push('Position cannot be empty');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // EntityToDTOMapper interface implementation
  toDTO(entity: Employee): EmployeeDTO {
    return EmployeeTransformer.toDTO(entity);
  }

  fromDTO(dto: EmployeeDTO): Employee {
    return EmployeeTransformer.toEntity(dto);
  }

  fromEntityToDTO(entity: Employee): EmployeeDTO {
    return EmployeeTransformer.toDTO(entity);
  }

  fromDtosToAdapter(dtos: EmployeeDTO[]): EmployeeDTO[] {
    return dtos;
  }

  toResponseDto(entity: Employee): EmployeeDTO {
    return EmployeeTransformer.toDTO(entity);
  }

  toRequestDto(dto: EmployeeDTO): EmployeeDTO {
    return dto;
  }

  toUpdateDto(dto: EmployeeDTO): Partial<EmployeeDTO> {
    return {
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      position: dto.position,
      department: dto.department,
      hireDate: dto.hireDate,
      salary: dto.salary,
      isActive: dto.isActive
    };
  }

  validate(dto: EmployeeDTO): ValidationResult {
    const employee = EmployeeTransformer.toEntity(dto);
    const validation = EmployeeTransformer.validateEmployeeData(employee);
    return {
      isValid: validation.isValid,
      errors: validation.errors
    };
  }

  toDTOs(entities: Employee[]): EmployeeDTO[] {
    return entities.map(entity => EmployeeTransformer.toDTO(entity));
  }

  toEntities(dtos: EmployeeDTO[]): Employee[] {
    return dtos.map(dto => EmployeeTransformer.toEntity(dto));
  }

  toEntitiesFromDatabaseRows(rows: Record<string, unknown>[]): Employee[] {
    return rows.map(row => EmployeeTransformer.toEntityFromDatabaseRow(row));
  }

  static toEntityFromDatabaseRow(row: Record<string, unknown>): Employee {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      fullName: row.full_name as string,
      email: row.email as string,
      phone: row.phone as string || null,
      position: row.position as string,
      department: row.department as string,
      hireDate: row.hire_date as string || null,
      salary: Number(row.salary) || 0,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    };
  }
}
