/**
 * Stakeholder Transformer
 * Handles UI data conversion following hexagonal architecture
 * Following PROMPTS.md Rule #4: Transformer Methods
 */

import { StakeholderDTO, CreateStakeholderDTO, UpdateStakeholderDTO, StakeholderType, StakeholderRole, StakeholderEntityType } from '@/dtos/entities/StakeholderDTO';
import { EmployeeDTO, CreateEmployeeDTO, EmployeeType, EmployeeDepartment, EmployeeStatus } from '@/dtos/entities/EmployeeDTO';

/**
 * UI-specific interfaces for form data
 * Following PROMPTS.md Rule #4: No type redefinition in components
 */
export interface StakeholderFormData {
  name: string;
  stakeholderType: StakeholderType;
  role: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  organizationId?: string;
  organization?: string;
  position?: string;
  responsibilities?: string[];
  accessLevel?: 'read' | 'write' | 'admin';
  startDate?: string;
  endDate?: string;
  hourlyRate?: number;
  contractType?: string;
  notes?: string;
  isActive?: boolean;
}

export interface TeamMemberFormData {
  firstName: string;
  lastName: string;
  employeeId?: string;
  position: string;
  department?: string;
  email?: string;
  phone?: string;
  startDate?: string;
  salary?: number;
}

/**
 * Transformer for stakeholder UI data
 * Following PROMPTS.md Rule #4: Standard transformer methods
 */
export class StakeholderUITransformer {
  
  /**
   * Convert form data to CreateStakeholderDTO
   * Following PROMPTS.md Rule #4: formToCreateRequest pattern
   */
  static formToCreateRequest(formData: StakeholderFormData): CreateStakeholderDTO {
    return {
      name: formData.name,
      stakeholderType: formData.stakeholderType,
      entityType: formData.stakeholderType === StakeholderType.EMPLOYEE ? StakeholderEntityType.PERSON : StakeholderEntityType.ORGANIZATION,
      role: formData.role as StakeholderRole, // Convert string to enum
      projectId: '', // Will be set by component
      organizationId: formData.organizationId,
      employeeId: formData.employeeId,
      isPrimary: false,
      contact: {
        name: formData.name,
        email: formData.email || '',
        phone: formData.phone,
        position: formData.position,
      },
      organization: formData.organization,
      responsibilities: formData.responsibilities || [],
      accessLevel: formData.accessLevel || 'read',
      startDate: formData.startDate,
      endDate: formData.endDate,
      hourlyRate: formData.hourlyRate,
      contractType: formData.contractType,
      notes: formData.notes,
      isActive: formData.isActive !== false,
    };
  }

  /**
   * Convert form data to UpdateStakeholderDTO
   */
  static formToUpdateRequest(formData: Partial<StakeholderFormData>): UpdateStakeholderDTO {
    const updateData: Partial<UpdateStakeholderDTO> = {};
    
    if (formData.name !== undefined) updateData.name = formData.name;
    if (formData.email !== undefined) updateData.email = formData.email;
    if (formData.phone !== undefined) updateData.phone = formData.phone;
    if (formData.role !== undefined) updateData.role = formData.role as StakeholderRole;
    if (formData.organizationId !== undefined) updateData.organizationId = formData.organizationId;
    if (formData.employeeId !== undefined) updateData.employeeId = formData.employeeId;
    if (formData.organization !== undefined) updateData.organization = formData.organization;
    if (formData.position !== undefined) updateData.position = formData.position;
    if (formData.responsibilities !== undefined) updateData.responsibilities = formData.responsibilities;
    if (formData.accessLevel !== undefined) updateData.accessLevel = formData.accessLevel;
    if (formData.startDate !== undefined) updateData.startDate = formData.startDate;
    if (formData.endDate !== undefined) updateData.endDate = formData.endDate;
    if (formData.hourlyRate !== undefined) updateData.hourlyRate = formData.hourlyRate;
    if (formData.contractType !== undefined) updateData.contractType = formData.contractType;
    if (formData.notes !== undefined) updateData.notes = formData.notes;
    if (formData.isActive !== undefined) updateData.isActive = formData.isActive;
    
    return updateData as UpdateStakeholderDTO;
  }

  /**
   * Convert StakeholderDTO to form data
   * Following PROMPTS.md Rule #4: toUI pattern
   */
  static toUI(stakeholder: StakeholderDTO): StakeholderFormData {
    return {
      name: stakeholder.name,
      stakeholderType: stakeholder.stakeholderType,
      role: stakeholder.role,
      email: stakeholder.email,
      phone: stakeholder.phone,
      employeeId: stakeholder.employeeId,
      organizationId: stakeholder.organizationId,
      organization: stakeholder.organization,
      position: stakeholder.position,
      responsibilities: stakeholder.responsibilities,
      accessLevel: stakeholder.accessLevel,
      startDate: stakeholder.startDate,
      endDate: stakeholder.endDate,
      hourlyRate: stakeholder.hourlyRate,
      contractType: stakeholder.contractType,
      notes: stakeholder.notes,
      isActive: stakeholder.isActive,
    };
  }

  /**
   * Convert team member form data to CreateEmployeeDTO
   */
  static teamMemberFormToCreateRequest(formData: TeamMemberFormData): CreateEmployeeDTO {
    return {
      firstName: formData.firstName,
      lastName: formData.lastName,
      fullName: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      type: EmployeeType.FULL_TIME, // Default value
      role: StakeholderRole.CONSULTANT, // Default value
      department: formData.department ? formData.department as EmployeeDepartment : EmployeeDepartment.PROJECT_MANAGEMENT,
      status: EmployeeStatus.ACTIVE,
      employeeId: formData.employeeId,
      position: formData.position,
      level: 'junior', // Default value
      startDate: formData.startDate || new Date().toISOString(),
      salary: formData.salary || 0,
      hourlyRate: 0,
      currency: 'MRO', // Default currency
      skills: [],
      certifications: [],
      education: [],
      experience: [],
      address: '', // Simplified address as string
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
      },
      currentProjects: [],
      availability: 'full_time',
      performanceRating: 3,
      lastReviewDate: '',
      nextReviewDate: '',
      goals: [],
      achievements: [],
      documents: [],
      avatar: '',
      tags: [],
      notes: '',
    };
  }

  /**
   * Convert EmployeeDTO to team member form data
   */
  static employeeToTeamMemberForm(employee: EmployeeDTO): TeamMemberFormData {
    return {
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      employeeId: employee.employeeId,
      position: employee.position || '',
      department: employee.department || '',
      email: employee.email,
      phone: employee.phone,
      startDate: employee.startDate,
      salary: employee.salary,
    };
  }

  /**
   * Validate stakeholder form data
   * Following PROMPTS.md Rule #5: UI Layer validation
   */
  static validateStakeholderForm(formData: StakeholderFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!formData.name?.trim()) {
      errors.push("Le nom est requis");
    }

    if (!formData.stakeholderType) {
      errors.push("Le type de partie prenante est requis");
    }

    if (!formData.role?.trim()) {
      errors.push("Le rôle est requis");
    }

    if (formData.stakeholderType === StakeholderType.EMPLOYEE && !formData.employeeId) {
      errors.push("L'ID de l'employé est requis pour les employés");
    }

    if (formData.stakeholderType !== StakeholderType.EMPLOYEE && !formData.organizationId) {
      errors.push("L'ID de l'organisation est requis pour les parties externes");
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("L'email n'est pas valide");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate team member form data
   */
  static validateTeamMemberForm(formData: TeamMemberFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!formData.firstName?.trim()) {
      errors.push("Le prénom est requis");
    }

    if (!formData.lastName?.trim()) {
      errors.push("Le nom de famille est requis");
    }

    if (!formData.position?.trim()) {
      errors.push("La position est requise");
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("L'email n'est pas valide");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
