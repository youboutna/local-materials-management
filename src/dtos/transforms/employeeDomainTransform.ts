/**
 * Employee Domain Transformer - Consolidated & Unified
 * Implements EntityToDTOMapper interface for Employee domain entity
 * Centralizes all employee transformation logic following hexagonal architecture
 */

import { Employee, EmployeeRole, Department, Certification } from '@/domain/entities/Employee';
import { EmployeeDTO, CreateEmployeeDTO, UpdateEmployeeDTO } from '@/dtos/entities/EmployeeDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms';

// API Request/Response DTOs for UI and Supabase integration
export class EmployeeResponseDto {
  constructor(
    public id: string,
    public employeeId: string,
    public fullName: string,
    public email: string,
    public phone: string,
    public position: string,
    public department: Department | null,
    public role: EmployeeRole,
    public hireDate: string | null,
    public salary: number | null,
    public isActive: boolean,
    public userId: string | null,
    public managerId: string | null,
    public superiorId: string | null,
    public skills: string[],
    public certifications: Certification[],
    public createdAt?: string,
    public updatedAt?: string
  ) {}
}

export class CreateEmployeeRequestDto {
  constructor(
    public employeeId: string,
    public fullName: string,
    public email: string,
    public phone: string,
    public position: string,
    public department: Department | null,
    public role: EmployeeRole,
    public hireDate?: string,
    public salary?: number,
    public isActive?: boolean,
    public userId?: string,
    public managerId?: string,
    public superiorId?: string,
    public skills?: string[],
    public certifications?: Certification[]
  ) {}
}

export class UpdateEmployeeRequestDto {
  constructor(
    public fullName?: string,
    public email?: string,
    public phone?: string,
    public position?: string,
    public department?: Department,
    public role?: EmployeeRole,
    public hireDate?: string,
    public salary?: number,
    public isActive?: boolean,
    public userId?: string,
    public managerId?: string,
    public superiorId?: string,
    public skills?: string[],
    public certifications?: Certification[]
  ) {}
}

export class EmployeeDomainTransformer implements EntityToDTOMapper<Employee, EmployeeDTO> {
  
  /**
   * Transform Employee domain entity to EmployeeDTO
   */
  toDTO(entity: Employee): EmployeeDTO {
    return {
      id: entity.id,
      employeeId: entity.employeeId,
      fullName: entity.fullName,
      email: entity.email || null,
      phone: entity.phone || null,
      position: entity.position || null,
      department: entity.department,
      hireDate: entity.hireDate,
      salary: entity.salary,
      isActive: entity.isActive,
      skills: entity.skills,
      certifications: entity.certifications ? Object.fromEntries(
        entity.certifications.map(cert => [cert.name, {
          issuedBy: cert.issuedBy,
          issuedDate: cert.issuedDate,
          expiryDate: cert.expiryDate
        }])
      ) : null,
      userId: entity.userId,
      managerId: entity.managerId,
      superiorId: entity.superiorId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Transform EmployeeDTO to partial Employee domain entity
   */
  fromDTO(dto: Partial<EmployeeDTO>): Partial<Employee> {
    return {
      id: dto.id,
      employeeId: dto.employeeId,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      position: dto.position,
      department: dto.department ? dto.department as Department : null,
      hireDate: dto.hireDate,
      salary: dto.salary,
      skills: dto.skills || [],
      certifications: dto.certifications ? Object.entries(dto.certifications).map(([name, data]: [string, any]) => ({
        name,
        issuedBy: data.issuedBy,
        issuedDate: data.issuedDate,
        expiryDate: data.expiryDate
      })) : [],
      createdAt: dto.createdAt ? new Date(dto.createdAt).toISOString() : undefined,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt).toISOString() : undefined
    };
  }

  /**
   * Transform array of EmployeeDTOs to array of EmployeeResponseDTOs (for UI/API)
   */
  fromDtosToAdapter(dtos: EmployeeDTO[]): EmployeeResponseDto[] {
    return dtos.map(dto => this.toResponseDto(dto));
  }

  /**
   * Transform single EmployeeDTO to EmployeeResponseDto (for UI/API)
   */
  toResponseDto(dto: EmployeeDTO): EmployeeResponseDto {
    return new EmployeeResponseDto(
      dto.id,
      dto.employeeId,
      dto.fullName,
      dto.email || '',
      dto.phone || '',
      dto.position || '',
      dto.department,
      dto.hireDate,
      dto.salary,
      dto.isActive,
      dto.userId,
      dto.managerId,
      dto.superiorId,
      dto.skills || [],
      dto.certifications || [],
      dto.createdAt,
      dto.updatedAt
    );
  }

  /**
   * Transform CreateEmployeeRequestDto to EmployeeDTO
   */
  toRequestDto(requestDto: CreateEmployeeRequestDto): EmployeeDTO {
    return {
      id: crypto.randomUUID(),
      employeeId: requestDto.employeeId,
      fullName: requestDto.fullName,
      email: requestDto.email || null,
      phone: requestDto.phone || null,
      position: requestDto.position || null,
      department: requestDto.department,
      hireDate: requestDto.hireDate || null,
      salary: requestDto.salary || null,
      isActive: requestDto.isActive !== undefined ? requestDto.isActive : true,
      userId: requestDto.userId || null,
      managerId: requestDto.managerId || null,
      superiorId: requestDto.superiorId || null,
      skills: requestDto.skills || [],
      certifications: requestDto.certifications ? Object.fromEntries(
        requestDto.certifications.map(cert => [cert.name, {
          issuedBy: cert.issuedBy,
          issuedDate: cert.issuedDate,
          expiryDate: cert.expiryDate
        }])
      ) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Transform UpdateEmployeeRequestDto to partial EmployeeDTO
   */
  toUpdateDto(requestDto: UpdateEmployeeRequestDto): Partial<EmployeeDTO> {
    return {
      fullName: requestDto.fullName,
      email: requestDto.email,
      phone: requestDto.phone,
      position: requestDto.position,
      department: requestDto.department,
      hireDate: requestDto.hireDate,
      salary: requestDto.salary,
      isActive: requestDto.isActive,
      userId: requestDto.userId,
      managerId: requestDto.managerId,
      superiorId: requestDto.superiorId,
      skills: requestDto.skills,
      certifications: requestDto.certifications ? Object.fromEntries(
        requestDto.certifications.map(cert => [cert.name, {
          issuedBy: cert.issuedBy,
          issuedDate: cert.issuedDate,
          expiryDate: cert.expiryDate
        }])
      ) : undefined,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Transform Employee domain entity to EmployeeResponseDto (direct path)
   */
  fromDomainToResponseDto(entity: Employee): EmployeeResponseDto {
    const dto = this.toDTO(entity);
    return this.toResponseDto(dto);
  }

  /**
   * Validate EmployeeDTO data
   */
  validate(dto: Partial<EmployeeDTO>): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Employee ID validation
    if (!dto.employeeId || dto.employeeId.trim() === '') {
      errors.push('Employee ID is required');
      fieldErrors.employeeId = ['Employee ID is required'];
    }

    // Full name validation
    if (!dto.fullName || dto.fullName.trim() === '') {
      errors.push('Employee full name is required');
      fieldErrors.fullName = ['Employee full name is required'];
    }

    // Email validation
    if (dto.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
      errors.push('Invalid email format');
      fieldErrors.email = ['Invalid email format'];
    }

    // Department validation
    const validDepartments = ['management', 'engineering', 'construction', 'finance', 'legal', 'hr', 'logistics', 'quality'];
    if (dto.department && !validDepartments.includes(dto.department)) {
      errors.push('Invalid department');
      fieldErrors.department = ['Invalid department'];
    }

    // Salary validation
    if (dto.salary !== undefined && dto.salary !== null && dto.salary < 0) {
      errors.push('Salary cannot be negative');
      fieldErrors.salary = ['Salary cannot be negative'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  // Utility methods for employee operations
  static getEmployeeStatus(employee: EmployeeDTO): 'active' | 'inactive' | 'on_leave' | 'terminated' {
    if (!employee.isActive) return 'inactive';
    // For regular employees, you could add leave logic here
    return 'active';
  }

  static canApproveProjects(employee: EmployeeDTO): boolean {
    const approvingPositions = ['admin', 'director', 'project_manager'];
    return approvingPositions.includes(employee.position || '') && employee.isActive;
  }

  static canManageEmployees(employee: EmployeeDTO): boolean {
    const managementPositions = ['admin', 'director', 'project_manager', 'technical_manager'];
    return managementPositions.includes(employee.position || '') && employee.isActive;
  }

  static getDepartmentColor(department: Department | null): string {
    const colors = {
      management: 'blue',
      engineering: 'green',
      construction: 'orange',
      finance: 'purple',
      legal: 'red',
      hr: 'pink',
      logistics: 'yellow',
      quality: 'indigo'
    };
    return department ? colors[department] || 'gray' : 'gray';
  }

  static getRoleBadgeColor(role: EmployeeRole): string {
    const colors = {
      admin: 'red',
      director: 'purple',
      project_manager: 'blue',
      technical_manager: 'green',
      engineering_consultant: 'teal',
      supervisor: 'orange',
      inspector: 'yellow',
      finance_manager: 'purple',
      legal: 'red',
      worker: 'gray',
      supplier: 'cyan'
    };
    return colors[role] || 'gray';
  }
}
