/**
 * Employee Transformer - Hexagonal Architecture
 * Transforms between Employee entities and DTOs
 * 
 * KEY RULE: Never call `new Employee()` — always use `Employee.create(props)`
 * This ensures domain entities are decoupled from infrastructure
 */

import { Employee, EmployeeProps } from '@/domain/entities/Employee';
import { EmployeeDTO, CreateEmployeeDTO, UpdateEmployeeDTO, EmployeeDepartment, EmployeeRole, EmployeeType, EmployeeStatus } from '@/dtos/entities/EmployeeDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';
import { Department } from '@/domain/types';

export class EmployeeTransformer implements EntityToDTOMapper<Employee, EmployeeDTO> {

  // =================== DATABASE ↔ DOMAIN ===================

  /**
   * Supabase Row (snake_case) → Domain Entity via Props
   * This is the ONLY method adapters should use
   */
  static fromDatabaseRow(row: Record<string, unknown>): Employee {
    const props: EmployeeProps = {
      id: row.id as string,
      employeeId: (row.employee_id as string) || (row.id as string),
      fullName: (row.full_name as string) || '',
      email: (row.email as string) ?? null,
      phone: (row.phone as string) ?? null,
      position: (row.position as string) ?? null,
      department: (row.department as Department) ?? null,
      hireDate: (row.hire_date as string) ?? (row.start_date as string) ?? null,
      salary: row.salary !== undefined ? Number(row.salary) : null,
      isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
      userId: (row.user_id as string) ?? null,
      managerId: (row.manager_id as string) ?? null,
      superiorId: (row.superior_id as string) ?? null,
      skills: (row.skills as string[]) || [],
      certifications: (row.certifications as unknown[]) || [],
      createdAt: (row.created_at as string) || new Date().toISOString(),
      updatedAt: (row.updated_at as string) || new Date().toISOString(),
    };
    return Employee.create(props);
  }

  /**
   * Batch: Supabase Rows → Domain Entities
   */
  static manyFromDatabaseRows(rows: Record<string, unknown>[]): Employee[] {
    return rows.map(row => this.fromDatabaseRow(row));
  }

  /**
   * Domain Entity → Supabase Insert/Update Object (snake_case)
   */
  static toSupabase(entity: Employee): Record<string, unknown> {
    return {
      id: entity.id,
      employee_id: entity.employeeId,
      full_name: entity.fullName,
      email: entity.email,
      phone: entity.phone,
      position: entity.position,
      department: entity.department,
      manager_id: entity.managerId,
      superior_id: entity.superiorId,
      is_active: entity.isActive,
      hire_date: entity.hireDate,
      salary: entity.salary,
      user_id: entity.userId,
      skills: entity.skills,
      certifications: entity.certifications,
    };
  }

  // Legacy alias for backward compat
  static toEntityFromDatabaseRow(row: Record<string, unknown>): Employee {
    return this.fromDatabaseRow(row);
  }

  // =================== DOMAIN ↔ DTO ===================

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
   * Uses Employee.create() — never `new Employee()`
   */
  static toEntity(dto: EmployeeDTO): Employee {
    return Employee.create({
      id: dto.id,
      employeeId: dto.employeeId || dto.id,
      fullName: dto.fullName || `${dto.firstName} ${dto.lastName}`.trim(),
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      position: dto.position ?? null,
      department: this.toDomainDepartment(dto.department),
      hireDate: dto.startDate ?? null,
      salary: dto.salary ?? null,
      isActive: dto.isActive !== undefined ? dto.isActive : dto.status === EmployeeStatus.ACTIVE,
      skills: dto.skills || [],
      createdAt: dto.createdAt || new Date().toISOString(),
      updatedAt: dto.updatedAt || new Date().toISOString()
    });
  }

  /**
   * Transform CreateEmployeeDTO to Employee entity
   */
  static fromCreateDTOToEntity(dto: CreateEmployeeDTO): Employee {
    return Employee.create({
      id: crypto.randomUUID(),
      employeeId: dto.employeeId || crypto.randomUUID(),
      fullName: dto.fullName || `${dto.firstName} ${dto.lastName}`.trim(),
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      position: dto.position ?? null,
      department: this.toDomainDepartment(dto.department),
      hireDate: dto.startDate ?? null,
      salary: dto.salary ?? null,
      isActive: dto.status === EmployeeStatus.ACTIVE,
      skills: dto.skills || [],
    });
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
    if (!employee.fullName || employee.fullName.trim() === '') errors.push('Employee full name is required');
    if (!employee.email || employee.email.trim() === '') errors.push('Employee email is required');
    else if (!employee.email.includes('@')) errors.push('Invalid email format');
    if (employee.salary !== undefined && employee.salary !== null && employee.salary < 0) errors.push('Salary cannot be negative');
    if (employee.position && employee.position.trim() === '') errors.push('Position cannot be empty');
    return { isValid: errors.length === 0, errors };
  }

  // EntityToDTOMapper interface implementation
  toDTO(entity: Employee): EmployeeDTO { return EmployeeTransformer.toDTO(entity); }
  fromDTO(dto: EmployeeDTO): Employee { return EmployeeTransformer.toEntity(dto); }
  fromEntityToDTO(entity: Employee): EmployeeDTO { return EmployeeTransformer.toDTO(entity); }
  fromDtosToAdapter(dtos: EmployeeDTO[]): EmployeeDTO[] { return dtos; }
  toResponseDto(entity: Employee): EmployeeDTO { return EmployeeTransformer.toDTO(entity); }
  toRequestDto(dto: EmployeeDTO): EmployeeDTO { return dto; }
  toUpdateDto(dto: EmployeeDTO): Partial<EmployeeDTO> {
    return { fullName: dto.fullName, email: dto.email, phone: dto.phone, position: dto.position, department: dto.department, startDate: dto.startDate, salary: dto.salary, isActive: dto.isActive };
  }
  validate(dto: EmployeeDTO): ValidationResult {
    const employee = EmployeeTransformer.toEntity(dto);
    const validation = EmployeeTransformer.validateEmployeeData(employee);
    return { isValid: validation.isValid, errors: validation.errors };
  }
  toDTOs(entities: Employee[]): EmployeeDTO[] { return entities.map(entity => EmployeeTransformer.toDTO(entity)); }
  toEntities(dtos: EmployeeDTO[]): Employee[] { return dtos.map(dto => EmployeeTransformer.toEntity(dto)); }
  toEntitiesFromDatabaseRows(rows: Record<string, unknown>[]): Employee[] { return rows.map(row => EmployeeTransformer.fromDatabaseRow(row)); }
}
