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
      salary: row.salary !== undefined && row.salary !== null ? Number(row.salary) : null,
      isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
      userId: (row.user_id as string) ?? null,
      managerId: (row.manager_id as string) ?? null,
      superiorId: (row.superior_id as string) ?? null,
      skills: (row.skills as string[]) || [],
      certifications: (row.certifications as unknown[]) || [],
      createdAt: (row.created_at as string) || new Date().toISOString(),
      updatedAt: (row.updated_at as string) || new Date().toISOString(),
      extras: {
        organizationId: (row.organization_id as string) ?? null,
        employeeType: (row.employee_type as string) ?? null,
        roleName: (row.role as string) ?? null,
        status: (row.status as string) ?? null,
        level: (row.level as string) ?? null,
        endDate: (row.end_date as string) ?? null,
        probationEndDate: (row.probation_end_date as string) ?? null,
        hourlyRate: row.hourly_rate !== undefined && row.hourly_rate !== null ? Number(row.hourly_rate) : null,
        currency: (row.currency as string) ?? null,
        availability: (row.availability as string) ?? null,
        address: (row.address as string) ?? null,
        city: (row.city as string) ?? null,
        country: (row.country as string) ?? null,
        performanceRating: row.performance_rating !== undefined && row.performance_rating !== null ? Number(row.performance_rating) : null,
        avatarUrl: (row.avatar_url as string) ?? null,
        tags: (row.tags as string[]) ?? null,
        notes: (row.notes as string) ?? null,
        nationalId: (row.national_id as string) ?? null,
      },
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
    const x = entity.extras || {};
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
      organization_id: x.organizationId ?? null,
      employee_type: x.employeeType ?? null,
      role: x.roleName ?? null,
      status: x.status ?? null,
      level: x.level ?? null,
      end_date: x.endDate ?? null,
      probation_end_date: x.probationEndDate ?? null,
      hourly_rate: x.hourlyRate ?? null,
      currency: x.currency ?? null,
      availability: x.availability ?? null,
      address: x.address ?? null,
      city: x.city ?? null,
      country: x.country ?? null,
      performance_rating: x.performanceRating ?? null,
      avatar_url: x.avatarUrl ?? null,
      tags: x.tags ?? null,
      notes: x.notes ?? null,
      national_id: x.nationalId ?? null,
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
    const x = entity.extras || {};
    return {
      id: entity.id,
      firstName: entity.fullName?.split(' ')[0] || '',
      lastName: entity.fullName?.split(' ').slice(1).join(' ') || '',
      fullName: entity.fullName,
      email: entity.email ?? undefined,
      phone: entity.phone ?? undefined,
      position: entity.position ?? undefined,
      department: this.toDTODepartment(entity.department),
      type: (x.employeeType as EmployeeType) || EmployeeType.FULL_TIME,
      role: (x.roleName as EmployeeRole) || EmployeeRole.SPECIALIST,
      status: (x.status as EmployeeStatus) || (entity.isActive ? EmployeeStatus.ACTIVE : EmployeeStatus.INACTIVE),
      employeeId: entity.employeeId,
      startDate: entity.hireDate ?? undefined,
      endDate: x.endDate ?? undefined,
      salary: entity.salary ?? undefined,
      hourlyRate: x.hourlyRate ?? undefined,
      currency: x.currency ?? undefined,
      availability: x.availability as EmployeeDTO['availability'],
      address: x.address ?? undefined,
      city: x.city ?? undefined,
      country: x.country ?? undefined,
      performanceRating: x.performanceRating ?? undefined,
      avatar: x.avatarUrl ?? undefined,
      tags: x.tags ?? undefined,
      notes: x.notes ?? undefined,
      nationalId: x.nationalId ?? undefined,
      organizationId: x.organizationId ?? null,
      managerId: entity.managerId,
      superiorId: entity.superiorId,
      userId: entity.userId,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    } as EmployeeDTO;
  }

  /**
   * Extract the extended (RH / organigramme) attributes from a DTO
   */
  private static extrasFromDTO(dto: Partial<EmployeeDTO> & Partial<CreateEmployeeDTO>) {
    return {
      organizationId: dto.organizationId ?? null,
      employeeType: (dto.type as string) ?? null,
      roleName: (dto.role as string) ?? null,
      status: (dto.status as string) ?? null,
      endDate: dto.endDate ?? null,
      hourlyRate: dto.hourlyRate ?? null,
      currency: dto.currency ?? null,
      availability: (dto.availability as string) ?? null,
      address: dto.address ?? null,
      city: dto.city ?? null,
      country: dto.country ?? null,
      performanceRating: dto.performanceRating ?? null,
      avatarUrl: dto.avatar ?? null,
      tags: dto.tags ?? null,
      notes: dto.notes ?? null,
      nationalId: dto.nationalId ?? null,
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
      userId: dto.userId ?? null,
      managerId: dto.managerId ?? null,
      superiorId: dto.superiorId ?? null,
      extras: this.extrasFromDTO(dto),
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
      isActive: dto.status ? dto.status === EmployeeStatus.ACTIVE : true,
      skills: dto.skills || [],
      userId: dto.userId ?? null,
      managerId: dto.managerId ?? null,
      superiorId: dto.superiorId ?? null,
      extras: this.extrasFromDTO(dto),
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
    if (dto.employeeId !== undefined) result.employeeId = dto.employeeId;
    if (dto.email !== undefined) result.email = dto.email;
    if (dto.phone !== undefined) result.phone = dto.phone;
    if (dto.position !== undefined) result.position = dto.position;
    if (dto.department !== undefined) result.department = this.toDomainDepartment(dto.department);
    if (dto.salary !== undefined) result.salary = dto.salary;
    if (dto.startDate !== undefined || dto.hireDate !== undefined) result.hireDate = dto.startDate ?? dto.hireDate;
    if (dto.isActive !== undefined) result.isActive = dto.isActive;
    else if (dto.status !== undefined) result.isActive = dto.status === EmployeeStatus.ACTIVE;
    if (dto.skills !== undefined) result.skills = dto.skills;
    if (dto.certifications !== undefined) result.certifications = dto.certifications;
    if (dto.userId !== undefined) result.userId = dto.userId;
    if (dto.managerId !== undefined) result.managerId = dto.managerId;
    if (dto.superiorId !== undefined) result.superiorId = dto.superiorId;

    // Extended RH / organigramme attributes
    const extras: Record<string, unknown> = {};
    if (dto.organizationId !== undefined) extras.organizationId = dto.organizationId;
    if (dto.type !== undefined) extras.employeeType = dto.type;
    if (dto.role !== undefined) extras.roleName = dto.role;
    if (dto.status !== undefined) extras.status = dto.status;
    if (dto.endDate !== undefined) extras.endDate = dto.endDate;
    if (dto.hourlyRate !== undefined) extras.hourlyRate = dto.hourlyRate;
    if (dto.currency !== undefined) extras.currency = dto.currency;
    if (dto.availability !== undefined) extras.availability = dto.availability;
    if (dto.address !== undefined) extras.address = dto.address;
    if (dto.city !== undefined) extras.city = dto.city;
    if (dto.country !== undefined) extras.country = dto.country;
    if (dto.performanceRating !== undefined) extras.performanceRating = dto.performanceRating;
    if (dto.avatar !== undefined) extras.avatarUrl = dto.avatar;
    if (dto.tags !== undefined) extras.tags = dto.tags;
    if (dto.notes !== undefined) extras.notes = dto.notes;
    if (dto.nationalId !== undefined) extras.nationalId = dto.nationalId;
    if (Object.keys(extras).length > 0) result.extras = extras;

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
