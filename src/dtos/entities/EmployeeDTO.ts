/**
 * Employee Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 * Following clean code principles: camelCase only, no business logic
 */

import { BaseEntityDTO, ContactInfoDTO } from '../shared';

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
  MANAGER = 'manager'
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
  SECURITY = 'security'
}

/**
 * Main Employee DTO
 * Core employee data structure
 */
export interface EmployeeDTO extends BaseEntityDTO {
  // Core identification
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email?: string;
  phone?: string;
  isActive?:boolean;
  nationalId?: string;
  userId?: string | null;

  // Organisation & organigramme
  organizationId?: string | null;
  organizationName?: string;
  managerId?: string | null;
  superiorId?: string | null;
  /** Intitulé du poste dans l'organigramme (btp.organizational_hierarchy) */
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

  // Skills and qualifications
  skills?: string[];
  certifications?: string[];
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

/**
 * Employee creation request interface
 * Input for creating new employees
 */
export interface CreateEmployeeDTO {
  firstName: string;
  lastName: string;
  fullName?: string;
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
  certifications?: string[];
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
}

/**
 * Employee update request interface
 * Input for updating existing employees
 */
export interface UpdateEmployeeDTO {
  firstName?: string;
  lastName?: string;
  fullName?: string;
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
  certifications?: string[];
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

  // Metadata
  updatedBy?: string;
  changeReason?: string;
}

/**
 * Employee summary interface (base)
 * Lightweight employee representation for lists
 */
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

/**
 * Employee statistics interface
 * Performance metrics for employee management
 */
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

/**
 * Employee skill interface
 * Employee skill tracking data
 */
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

/**
 * Employee project assignment interface
 * Project assignment tracking data
 */
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

/**
 * Employee filter interface
 * Filter criteria for employee queries
 */
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

/**
 * Employee details interface
 * Extended employee data structure
 */
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
  // Detailed documents with metadata (inherits basic documents from EmployeeDTO)
  documentDetails?: Array<{
    id: string;
    name: string;
    type: string;
    uploadedAt: string;
  }>;
}

// Add search-related interfaces
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

// Legacy compatibility types from transforms (avoid conflicts with enum)
export type EmployeeDepartmentLegacy = 'engineering' | 'construction' | 'quality' | 'administration' | 'finance' | 'procurement';

// Legacy request DTOs for backward compatibility
export interface CreateEmployeeRequestDTO {
  full_name: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  employee_id: string;
}

export interface UpdateEmployeeRequestDTO {
  full_name?: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
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
