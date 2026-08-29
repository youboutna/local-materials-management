// src/dtos/entities/EmployeeDTO.ts
// VERSION CORRIGÉE v2.0 - Support pour l'import
// 
// Modifications:
// 1. Ajout du champ externalRef pour support des références externes
// 2. Ajout du champ employeeId comme alias pour l'ID employé
// 3. Ajout des champs manquants pour l'import (fullName, firstName, lastName)
// 4. Extension du champ skills pour support des compétences
// 5. Ajout des champs certifications avec structure complète
// 6. Ajout des DTOs d'import spécifiques

/**
 * EmployeeDTO.ts
 * Employee Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 * Following clean code principles: camelCase only, no business logic
 */

import { ENUM_LABELS, type EnumLabel } from '@/config/referentials/i18n/enum-labels.referential';
import { BaseEntityDTO, ContactInfoDTO } from '../shared';

// =============================================================================
// Enums (inchangés)
// =============================================================================

/**
 * Employee status enumeration
 * Current employment status
 */
export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
  SUSPENDED = 'suspended'
}

/**
 * Employee type enumeration
 * Classification of employee types
 */
export enum EmployeeType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERN = 'intern',
  CONSULTANT = 'consultant'
}

/**
 * Employee role enumeration
 * Common employee roles
 */
export enum EmployeeRole {
  PROJECT_MANAGER = 'project_manager',
  TEAM_LEAD = 'team_lead',
  DEVELOPER = 'developer',
  DESIGNER = 'designer',
  ANALYST = 'analyst',
  TESTER = 'tester',
  ARCHITECT = 'architect',
  CONSULTANT = 'consultant',
  SPECIALIST = 'specialist',
  COORDINATOR = 'coordinator',
  SUPERVISOR = 'supervisor',
  MANAGER = 'manager',
  // NOUVEAUX rôles 
  EXPERT = 'expert',
  ENGINEER = 'engineer',
  TECHNICIAN = 'technician'
}

/**
 * Employee department enumeration
 * Organizational departments
 */
export enum EmployeeDepartment {
  ENGINEERING = 'engineering',
  DESIGN = 'design',
  PROJECT_MANAGEMENT = 'project_management',
  QUALITY_ASSURANCE = 'quality_assurance',
  OPERATIONS = 'operations',
  FINANCE = 'finance',
  HUMAN_RESOURCES = 'human_resources',
  MARKETING = 'marketing',
  SALES = 'sales',
  ADMINISTRATION = 'administration',
  LEGAL = 'legal',
  PROCUREMENT = 'procurement',
  MAINTENANCE = 'maintenance',
  SECURITY = 'security',
  // NOUVEAUX départements pour 
  DIRECTION = 'direction',
  EXPLOITATION = 'exploitation',
  SUIVI = 'suivi',
  CONTROLE = 'controle',
  SIG = 'sig',
  TERRAIN = 'terrain',
  JURIDIQUE = 'juridique'
}

// =============================================================================
// Main Employee DTO - AVEC CHAMPS COMPLETS
// =============================================================================

export interface EmployeeDTO extends BaseEntityDTO {
  // Core identification
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  nationalId?: string;
  userId?: string | null;

  // NOUVEAU - Référence externe pour l'import
  externalRef?: string;

  // Organisation & organigramme
  organizationId?: string | null;
  organizationName?: string;
  managerId?: string | null;
  superiorId?: string | null;
  positionTitle?: string;
  hierarchyLevel?: number;

  // Classification
  type: EmployeeType;
  role: EmployeeRole;
  department: EmployeeDepartment;
  status: EmployeeStatus;

  // Employment details
  employeeId?: string;
  position?: string;
  level?: string;
  startDate?: string;
  endDate?: string;
  probationEndDate?: string;

  // Financial
  salary?: number;
  hourlyRate?: number;
  currency?: string;
  bonus?: number;
  benefits?: string[];

  // Skills and qualifications - AVEC STRUCTURE COMPLÈTE
  skills?: string[];
  certifications?: CertificationDTO[];
  education?: Array<{
    degree: string;
    institution: string;
    year: number;
    field: string;
  }>;
  experience?: Array<{
    company: string;
    position: string;
    duration: number; // in months
    description?: string;
    isActive?: boolean;
  }>;

  // Project assignments
  currentProjects?: string[]; // Project IDs only for DTO
  currentTasks?: string[]; // Task IDs only for DTO
  assignedProjects?: string[]; // Project IDs only for DTO
  availability?: string;

  // Contact information
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };

  // Performance
  performanceRating?: number; // 1-5
  lastReviewDate?: string;
  nextReviewDate?: string;
  goals?: string[];
  achievements?: string[];

  // Documentation
  documents?: string[]; // Document IDs only for DTO
  avatar?: string;

  // Metadata
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Certification DTO - NOUVEAU
// =============================================================================

export interface CertificationDTO {
  id?: string;
  name: string;
  issuer?: string;
  date?: string;
  expiryDate?: string;
  certificateId?: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Employee Import DTO - NOUVEAU pour l'import
// =============================================================================

/**
 * Employee import interface
 * Input for importing employees from external sources
 */
export interface EmployeeImportDTO {
  // Identifiants
  id: string;
  employeeId?: string;
  externalRef?: string;

  // Identité
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;

  // Contact
  phone?: string;

  // Poste
  position?: string;
  department?: string;
  role?: string;
  type?: string;

  // Compétences
  skills?: string[];
  certifications?: CertificationImportDTO[];

  // Statut
  isActive?: boolean;
  status?: string;

  // Image
  avatar?: string;
}

// =============================================================================
// Certification Import DTO - NOUVEAU
// =============================================================================

export interface CertificationImportDTO {
  name: string;
  issuer?: string;
  date?: string;
  expiryDate?: string;
  certificateId?: string;
}

// =============================================================================
// Employee Creation DTO (inchangé avec ajouts)
// =============================================================================

export interface CreateEmployeeDTO {
  firstName: string;
  lastName: string;
  fullName?: string;
  nationalId?: string;
  userId?: string | null;
  organizationId?: string | null;
  managerId?: string | null;
  superiorId?: string | null;
  positionTitle?: string;
  hierarchyLevel?: number;
  email?: string;
  phone?: string;
  type: EmployeeType;
  role: EmployeeRole;
  department: EmployeeDepartment;
  status: EmployeeStatus;
  employeeId?: string;
  position?: string;
  level?: string;
  startDate?: string;
  endDate?: string;
  probationEndDate?: string;
  salary?: number;
  hourlyRate?: number;
  currency?: string;
  bonus?: number;
  benefits?: string[];
  skills?: string[];
  certifications?: CertificationDTO[];
  education?: Array<{
    degree: string;
    institution: string;
    year: number;
    field: string;
  }>;
  experience?: Array<{
    company: string;
    position: string;
    duration: number; // in months
    description?: string;
  }>;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  currentProjects?: string[]; // Project IDs only for DTO
  availability?: string;
  performanceRating?: number; // 1-5
  lastReviewDate?: string;
  nextReviewDate?: string;
  goals?: string[];
  achievements?: string[];
  documents?: string[]; // Document IDs only for DTO
  avatar?: string;
  tags?: string[];
  notes?: string;
  // NOUVEAU
  externalRef?: string;
  isActive?: boolean;
}

// =============================================================================
// Employee Update DTO (inchangé avec ajouts)
// =============================================================================

export interface UpdateEmployeeDTO {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  nationalId?: string;
  userId?: string | null;
  organizationId?: string | null;
  managerId?: string | null;
  superiorId?: string | null;
  positionTitle?: string;
  hierarchyLevel?: number;
  isActive?: boolean;
  employeeId?: string;
  startDate?: string;
  hireDate?: string;
  email?: string;
  phone?: string;
  type?: EmployeeType;
  role?: EmployeeRole;
  department?: EmployeeDepartment;
  status?: EmployeeStatus;
  position?: string;
  level?: string;
  endDate?: string;
  probationEndDate?: string;
  salary?: number;
  hourlyRate?: number;
  currency?: string;
  bonus?: number;
  benefits?: string[];
  skills?: string[];
  certifications?: CertificationDTO[];
  education?: Array<{
    degree: string;
    institution: string;
    year: number;
    field: string;
  }>;
  experience?: Array<{
    company: string;
    position: string;
    duration: number; // in months
    description?: string;
  }>;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  currentProjects?: string[]; // Project IDs only for DTO
  availability?: string;
  performanceRating?: number; // 1-5
  lastReviewDate?: string;
  nextReviewDate?: string;
  goals?: string[];
  achievements?: string[];
  documents?: string[]; // Document IDs only for DTO
  avatar?: string;
  tags?: string[];
  notes?: string;
  // NOUVEAU
  externalRef?: string;

  // Metadata
  updatedBy?: string;
  changeReason?: string;
}

// =============================================================================
// Employee Summary (inchangé)
// =============================================================================

export interface EmployeeSummaryDTOBase extends BaseEntityDTO {
  id: string;
  type: EmployeeType;
  role: EmployeeRole;
  department: EmployeeDepartment;
  status: EmployeeStatus;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

// =============================================================================
// Employee Statistics (inchangé)
// =============================================================================

export interface EmployeeStatisticsDTO {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  byDepartment: Record<string, number>;
  byRole: Record<string, number>;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  averageHourlyRate?: number;
  averagePerformanceRating?: number;
  totalProjects?: number;
  averageProjectsPerEmployee?: number;
  lastUpdated?: string;
}

// =============================================================================
// Employee Skill (inchangé)
// =============================================================================

export interface EmployeeSkillDTO {
  id: string;
  employeeId: string;
  skill: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsExperience?: number;
  certifications?: string[];
  lastUsed?: string;
  proficiency?: number; // 1-10
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Employee Project Assignment (inchangé)
// =============================================================================

export interface EmployeeProjectAssignmentDTO {
  id: string;
  employeeId: string;
  projectId: string;
  role: string;
  startDate?: string;
  endDate?: string;
  allocationPercentage?: number; // 0-100
  isPrimary?: boolean;
  hourlyRate?: number;
  budget?: number;
  actualCost?: number;
  performanceRating?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Employee Filter (inchangé)
// =============================================================================

export interface EmployeeFilterDTO {
  department?: EmployeeDepartment;
  role?: EmployeeRole;
  status?: EmployeeStatus;
  type?: EmployeeType;
  skill?: string;
  availability?: string;
  searchQuery?: string;
  isActive?: boolean;
  hasProjects?: boolean;
  performanceRatingRange?: {
    min: number;
    max: number;
  };
  hourlyRateRange?: {
    min: number;
    max: number;
  };
}

// =============================================================================
// Employee Details (inchangé)
// =============================================================================

export interface EmployeeDetailsDTO extends EmployeeDTO {
  contactInfo?: ContactInfoDTO;
  managerDetails?: {
    id: string;
    fullName: string;
    position: string;
  };
  teamMembers?: EmployeeDTO[];
  projects?: Array<{
    id: string;
    title: string;
    role: string;
  }>;
  performanceMetrics?: {
    tasksCompleted: number;
    averageCompletionTime: number;
    qualityScore: number;
  };
  documentDetails?: Array<{
    id: string;
    name: string;
    type: string;
    uploadedAt: string;
  }>;
}

// =============================================================================
// Search Interfaces (inchangé)
// =============================================================================

export interface SearchEmployeesOptions {
  searchTerm?: string;
  departmentFilter?: string[];
  positionFilter?: string[];
  skillsFilter?: string[];
  isActive?: boolean;
  limit?: number;
}

export interface SearchEmployeesResult {
  employees: EmployeeDTO[];
  total: number;
}

// =============================================================================
// Legacy Compatibility (inchangé)
// =============================================================================

export type EmployeeDepartmentLegacy = 'engineering' | 'construction' | 'quality' | 'administration' | 'finance' | 'procurement';

export interface CreateEmployeeRequestDTO {
  fullName: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  employeeId: string;
}

export interface UpdateEmployeeRequestDTO {
  fullName?: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export interface UserResponseDto {
  id: string;
  fullName: string | null;
  phone: string | null;
  nationalId: string | null;
  avatarUrl: string | null;
  email: string | null;
  roles: string[];
  primaryRole: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Libellés multilingues (inchangé)
// =============================================================================

export const EMPLOYEE_STATUS_LABELS: Readonly<Record<EmployeeStatus, EnumLabel>> =
    ENUM_LABELS.EmployeeStatus as Readonly<Record<EmployeeStatus, EnumLabel>>;

export const EMPLOYEE_TYPE_LABELS: Readonly<Record<EmployeeType, EnumLabel>> =
    ENUM_LABELS.EmployeeType as Readonly<Record<EmployeeType, EnumLabel>>;

export const EMPLOYEE_ROLE_LABELS: Readonly<Record<EmployeeRole, EnumLabel>> =
    ENUM_LABELS.EmployeeRole as Readonly<Record<EmployeeRole, EnumLabel>>;

export const EMPLOYEE_DEPARTMENT_LABELS: Readonly<Record<EmployeeDepartment, EnumLabel>> =
    ENUM_LABELS.EmployeeDepartment as Readonly<Record<EmployeeDepartment, EnumLabel>>;

// =============================================================================
// NOUVEAU - Transformateur pour l'import
// =============================================================================

export class EmployeeImportTransformer {
  /**
   * Normalise un email
   */
  static normalizeEmail(email?: string): string | undefined {
    if (!email) return undefined;
    return email.trim().toLowerCase();
  }

  /**
   * Normalise un nom complet
   */
  static normalizeFullName(fullName?: string): string | undefined {
    if (!fullName) return undefined;
    return fullName.trim();
  }

  /**
   * Normalise un prénom
   */
  static normalizeFirstName(firstName?: string): string | undefined {
    if (!firstName) return undefined;
    return firstName.trim();
  }

  /**
   * Normalise un nom de famille
   */
  static normalizeLastName(lastName?: string): string | undefined {
    if (!lastName) return undefined;
    return lastName.trim();
  }

  /**
   * Normalise un département
   */
  static normalizeDepartment(department?: string): EmployeeDepartment | undefined {
    if (!department) return undefined;
    const normalized = department.toLowerCase().trim();
    const mapping: Record<string, EmployeeDepartment> = {
      'engineering': EmployeeDepartment.ENGINEERING,
      'construction': EmployeeDepartment.ENGINEERING,
      'qualite': EmployeeDepartment.QUALITY_ASSURANCE,
      'quality': EmployeeDepartment.QUALITY_ASSURANCE,
      'administration': EmployeeDepartment.ADMINISTRATION,
      'finance': EmployeeDepartment.FINANCE,
      'comptabilite': EmployeeDepartment.FINANCE,
      'achat': EmployeeDepartment.PROCUREMENT,
      'procurement': EmployeeDepartment.PROCUREMENT,
      'exploitation': EmployeeDepartment.EXPLOITATION,
      'suivi': EmployeeDepartment.SUIVI,
      'controle': EmployeeDepartment.CONTROLE,
      'sig': EmployeeDepartment.SIG,
      'terrain': EmployeeDepartment.TERRAIN,
      'juridique': EmployeeDepartment.JURIDIQUE,
      'direction': EmployeeDepartment.DIRECTION,
      'hr': EmployeeDepartment.HUMAN_RESOURCES,
      'rh': EmployeeDepartment.HUMAN_RESOURCES,
    };
    return mapping[normalized] || EmployeeDepartment.ADMINISTRATION;
  }

  /**
   * Normalise un rôle
   */
  static normalizeRole(role?: string): EmployeeRole | undefined {
    if (!role) return undefined;
    const normalized = role.toLowerCase().trim();
    const mapping: Record<string, EmployeeRole> = {
      'project_manager': EmployeeRole.PROJECT_MANAGER,
      'project manager': EmployeeRole.PROJECT_MANAGER,
      'chef de projet': EmployeeRole.PROJECT_MANAGER,
      'expert': EmployeeRole.EXPERT,
      'ingenieur': EmployeeRole.ENGINEER,
      'engineer': EmployeeRole.ENGINEER,
      'technicien': EmployeeRole.TECHNICIAN,
      'technician': EmployeeRole.TECHNICIAN,
      'supervisor': EmployeeRole.SUPERVISOR,
      'superviseur': EmployeeRole.SUPERVISOR,
      'consultant': EmployeeRole.CONSULTANT,
      'specialiste': EmployeeRole.SPECIALIST,
      'specialist': EmployeeRole.SPECIALIST,
      'manager': EmployeeRole.MANAGER,
      'coordinateur': EmployeeRole.COORDINATOR,
      'coordinator': EmployeeRole.COORDINATOR,
    };
    return mapping[normalized] || EmployeeRole.EMPLOYEE;
  }

  /**
   * Transforme un EmployeeImportDTO en CreateEmployeeDTO
   */
  static toCreateEmployeeDTO(importDTO: EmployeeImportDTO): CreateEmployeeDTO {
    const fullName = importDTO.fullName || `${importDTO.firstName || ''} ${importDTO.lastName || ''}`.trim();
    const firstName = importDTO.firstName || fullName.split(' ')[0] || '';
    const lastName = importDTO.lastName || fullName.split(' ').slice(1).join(' ') || '';

    return {
      employeeId: importDTO.employeeId || importDTO.id || `EMP-${Date.now().toString().slice(-6)}`,
      email: this.normalizeEmail(importDTO.email) || '',
      fullName: fullName || importDTO.email || '',
      firstName: firstName || '',
      lastName: lastName || '',
      phone: importDTO.phone,
      position: importDTO.position,
      department: this.normalizeDepartment(importDTO.department) || EmployeeDepartment.ADMINISTRATION,
      role: this.normalizeRole(importDTO.role) || EmployeeRole.EMPLOYEE,
      type: EmployeeType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      skills: importDTO.skills || [],
      certifications: importDTO.certifications?.map(c => ({
        name: c.name,
        issuer: c.issuer,
        date: c.date,
        expiryDate: c.expiryDate,
        certificateId: c.certificateId,
      })) || [],
      isActive: importDTO.isActive !== false,
      externalRef: importDTO.externalRef || importDTO.id,
      avatar: importDTO.avatar,
    };
  }

  /**
   * Transforme un EmployeeImportDTO en UpdateEmployeeDTO
   */
  static toUpdateEmployeeDTO(importDTO: EmployeeImportDTO): UpdateEmployeeDTO {
    const updates: UpdateEmployeeDTO = {};

    if (importDTO.fullName) updates.fullName = importDTO.fullName;
    if (importDTO.firstName) updates.firstName = importDTO.firstName;
    if (importDTO.lastName) updates.lastName = importDTO.lastName;
    if (importDTO.email) updates.email = this.normalizeEmail(importDTO.email);
    if (importDTO.phone) updates.phone = importDTO.phone;
    if (importDTO.position) updates.position = importDTO.position;
    if (importDTO.department) updates.department = this.normalizeDepartment(importDTO.department);
    if (importDTO.role) updates.role = this.normalizeRole(importDTO.role);
    if (importDTO.skills) updates.skills = importDTO.skills;
    if (importDTO.certifications) {
      updates.certifications = importDTO.certifications.map(c => ({
        name: c.name,
        issuer: c.issuer,
        date: c.date,
        expiryDate: c.expiryDate,
        certificateId: c.certificateId,
      }));
    }
    if (importDTO.isActive !== undefined) updates.isActive = importDTO.isActive;
    if (importDTO.externalRef) updates.externalRef = importDTO.externalRef;
    if (importDTO.avatar) updates.avatar = importDTO.avatar;

    return updates;
  }

  /**
   * Trouve un employé existant par email ou référence externe
   */
  static findExisting(
    importDTO: EmployeeImportDTO,
    existingEmployees: EmployeeDTO[]
  ): EmployeeDTO | null {
    const email = this.normalizeEmail(importDTO.email);
    const externalRef = importDTO.externalRef || importDTO.id;

    return existingEmployees.find(emp =>
      (email && emp.email?.toLowerCase() === email) ||
      (externalRef && emp.externalRef === externalRef) ||
      (importDTO.employeeId && emp.employeeId === importDTO.employeeId)
    ) || null;
  }
}