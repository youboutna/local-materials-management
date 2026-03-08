/**
 * Employee Transformer - Hexagonal Architecture
 * Transforms between Employee entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 */

import { Employee } from '@/domain/entities/Employee';
import { EmployeeDTO, CreateEmployeeDTO, UpdateEmployeeDTO, EmployeeDepartment, EmployeeRole, EmployeeType, EmployeeStatus } from '@/dtos/entities/EmployeeDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';
import { Department } from '@/domain/types';

export class EmployeeTransformer implements EntityToDTOMapper<Employee, EmployeeDTO> {
  /**
   * Transform Employee entity to EmployeeDTO (Domain Entity → DTO)
   */
  static toDTO(entity: Employee): EmployeeDTO {
    return {
      id: entity.id,
      firstName: entity.fullName?.split(' ')[0] || '',
      lastName: entity.fullName?.split(' ').slice(1).join(' ') || '',
      fullName: entity.fullName,
      email: entity.email ?? undefined,
      phone: entity.phone ?? undefined,
      position: entity.position ?? undefined,
      department: this.toDTODepartment(entity.department),
      type: EmployeeType.FULL_TIME,
      role: EmployeeRole.SPECIALIST,
      status: entity.isActive ? EmployeeStatus.ACTIVE : EmployeeStatus.INACTIVE,
      employeeId: entity.employeeId,
      startDate: entity.hireDate ?? undefined,
      salary: entity.salary ?? undefined,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Transform EmployeeDTO to Employee entity (DTO → Domain Entity)
   */
  static toEntity(dto: EmployeeDTO): Employee {
    return new Employee(
      dto.id,
      dto.employeeId || dto.id,
      dto.fullName || `${dto.firstName} ${dto.lastName}`.trim(),
      dto.email ?? null,
      dto.phone ?? null,
      dto.position ?? null,
      this.toDomainDepartment(dto.department),
      { name: 'employee', level: 1 } as any,
      dto.startDate ?? null,
      dto.salary ?? null,
      dto.isActive !== undefined ? dto.isActive : dto.status === EmployeeStatus.ACTIVE,
      null,
      null,
      null,
      [],
      [],
      [],
      dto.skills || [],
      [],
      dto.createdAt || new Date().toISOString(),
      dto.updatedAt || new Date().toISOString()
    );
  }

  /**
   * Transform CreateEmployeeDTO to Employee entity
   */
  static fromCreateDTOToEntity(dto: CreateEmployeeDTO): Employee {
    const now = new Date().toISOString();
    return new Employee(
      crypto.randomUUID(),
      dto.employeeId || crypto.randomUUID(),
      dto.fullName || `${dto.firstName} ${dto.lastName}`.trim(),
      dto.email ?? null,
      dto.phone ?? null,
      dto.position ?? null,
      this.toDomainDepartment(dto.department),
      { name: 'employee', level: 1 } as any,
      dto.startDate ?? null,
      dto.salary ?? null,
      dto.status === EmployeeStatus.ACTIVE,
      null,
      null,
      null,
      [],
      [],
      [],
      dto.skills || [],
      [],
      now,
      now
    );
  }

  /**
   * Transform UpdateEmployeeDTO to partial Employee entity
   */
  static fromUpdateDTOToEntity(dto: UpdateEmployeeDTO): Partial<Employee> {
    const result: Record<string, unknown> = {
      updatedAt: new Date().toISOString()
    };

    if (dto.fullName !== undefined) result.fullName = dto.fullName;
    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      result.fullName = `${dto.firstName || ''} ${dto.lastName || ''}`.trim();
    }
    if (dto.email !== undefined) result.email = dto.email;
    if (dto.phone !== undefined) result.phone = dto.phone;
    if (dto.position !== undefined) result.position = dto.position;
    if (dto.department !== undefined) result.department = this.toDomainDepartment(dto.department);
    if (dto.salary !== undefined) result.salary = dto.salary;
    if (dto.status !== undefined) result.isActive = dto.status === EmployeeStatus.ACTIVE;
    if (dto.skills !== undefined) result.skills = dto.skills;
    if (dto.certifications !== undefined) result.certifications = dto.certifications;

    return result as Partial<Employee>;
  }

  /**
   * Convert DTO department to domain Department type
   */
  private static toDomainDepartment(dept?: EmployeeDepartment): Department | null {
    if (!dept) return null;
    
    const mapping: Record<EmployeeDepartment, Department> = {
      [EmployeeDepartment.ENGINEERING]: 'engineering',
      [EmployeeDepartment.DESIGN]: 'engineering',
      [EmployeeDepartment.PROJECT_MANAGEMENT]: 'administration',
      [EmployeeDepartment.QUALITY_ASSURANCE]: 'quality',
      [EmployeeDepartment.OPERATIONS]: 'construction',
      [EmployeeDepartment.FINANCE]: 'finance',
      [EmployeeDepartment.HUMAN_RESOURCES]: 'administration',
      [EmployeeDepartment.MARKETING]: 'administration',
      [EmployeeDepartment.SALES]: 'administration',
      [EmployeeDepartment.ADMINISTRATION]: 'administration',
      [EmployeeDepartment.LEGAL]: 'administration',
      [EmployeeDepartment.PROCUREMENT]: 'procurement',
      [EmployeeDepartment.MAINTENANCE]: 'construction',
      [EmployeeDepartment.SECURITY]: 'administration'
    };
    
    return mapping[dept] || 'administration';
  }

  /**
   * Convert domain Department to DTO EmployeeDepartment
   */
  private static toDTODepartment(dept: Department | null): EmployeeDepartment {
    if (!dept) return EmployeeDepartment.ENGINEERING;
    
    const mapping: Record<Department, EmployeeDepartment> = {
      'engineering': EmployeeDepartment.ENGINEERING,
      'construction': EmployeeDepartment.OPERATIONS,
      'quality': EmployeeDepartment.QUALITY_ASSURANCE,
      'administration': EmployeeDepartment.ADMINISTRATION,
      'finance': EmployeeDepartment.FINANCE,
      'procurement': EmployeeDepartment.PROCUREMENT
    };
    
    return mapping[dept] || EmployeeDepartment.ENGINEERING;
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
    
    if (employee.salary !== undefined && employee.salary !== null && employee.salary < 0) {
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
      startDate: dto.startDate,
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
    const deptStr = row.department as string | null;
    const domainDept: Department | null = deptStr as Department | null;
    
    return new Employee(
      row.id as string,
      (row.employee_id as string) || (row.id as string),
      (row.full_name as string) || '',
      (row.email ?? null) as string | null,
      (row.phone ?? null) as string | null,
      (row.position ?? null) as string | null,
      domainDept,
      { name: 'employee', level: 1 } as any,
      (row.hire_date ?? row.start_date ?? null) as string | null,
      row.salary !== undefined ? Number(row.salary) : null,
      row.is_active !== undefined ? Boolean(row.is_active) : true,
      null,
      null,
      null,
      [],
      [],
      [],
      (row.skills as string[]) || [],
      [],
      (row.created_at as string) || new Date().toISOString(),
      (row.updated_at as string) || new Date().toISOString()
    );
  }
}
