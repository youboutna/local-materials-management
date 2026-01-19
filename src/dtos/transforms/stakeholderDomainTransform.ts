/**
 * Stakeholder Domain Transformer - Enhanced with Calculations and Business Logic
 * Integrates stakeholder management, validation, and UI-specific features
 * Following hexagonal architecture principles
 */

import { ProjectStakeholder, StakeholderType, StakeholderEntityType } from '@/domain/entities/ProjectStakeholder';
import { BaseEntityDTO, EntityToDTOMapper, ValidationResult } from '@/dtos/shared';

// Enhanced types for UI components
export interface StakeholderDTO extends BaseEntityDTO {
  projectId: string;
  stakeholderType: StakeholderType;
  stakeholderEntityType: StakeholderEntityType;
  employeeId: string | null;
  supplierId: string | null;
  externalName: string | null;
  externalEmail: string | null;
  externalPhone: string | null;
  roleDescription?: string | null;
  responsibilities?: string[] | null;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  hourlyRate?: number | null;
  contractType?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StakeholderResponseDto extends StakeholderDTO {
  // Enhanced fields for UI
  stakeholderAnalytics?: {
    totalStakeholders: number;
    activeStakeholders: number;
    typeDistribution: { [key: string]: number };
    costAnalysis: {
      totalHourlyCost: number;
      totalContractValue: number;
      budgetUtilization: number;
    };
    engagementMetrics?: {
      averageEngagement: number;
      satisfactionScore: number;
      responseTime: number;
    };
    riskAssessment?: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
      recommendations: string[];
    };
    communicationHistory?: Array<{
      id: string;
      type: string;
      date: string;
      subject: string;
      status: string;
    }>;
    performanceMetrics?: {
      taskCompletionRate: number;
      qualityScore: number;
      deadlineAdherence: number;
      collaborationScore: number;
    };
  };
}

export interface CreateStakeholderRequestDto extends Omit<StakeholderDTO, 'id' | 'createdAt' | 'updatedAt'> {
  // Additional validation fields
  priority?: 'low' | 'medium' | 'high' | 'critical';
  escalationLevel?: 'team' | 'supervisor' | 'manager' | 'director';
  requiredSkills?: string[];
  availability?: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  communicationPreferences?: {
    preferredLanguage: string;
    preferredContactMethod: 'email' | 'phone' | 'sms';
    notificationFrequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  };
  contractDetails?: {
    duration: number;
    renewalTerms: string;
    terminationClause?: string;
  };
}

export interface UpdateStakeholderRequestDto extends Partial<CreateStakeholderRequestDto> {
  // Update-specific fields
  statusChangeReason?: string;
  performanceUpdate?: {
    taskCompletionRate: number;
    qualityScore: number;
    deadlineAdherence: number;
    collaborationScore: number;
    notes?: string;
  };
  contractUpdate?: {
    newHourlyRate?: number;
    renewalTerms?: string;
    terminationClause?: string;
    endDate?: string;
  };
  communicationUpdate?: {
    newContactMethod?: string;
    newNotificationFrequency?: string;
    notes?: string;
  };
}

export class StakeholderDomainTransformer implements EntityToDTOMapper<ProjectStakeholder, StakeholderDTO> {
  
  toDTO(entity: ProjectStakeholder): StakeholderDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      stakeholderType: entity.stakeholderType,
      stakeholderEntityType: entity.stakeholderEntityType,
      employeeId: entity.employeeId,
      supplierId: entity.supplierId,
      externalName: entity.externalName,
      externalEmail: entity.externalEmail,
      externalPhone: entity.externalPhone,
      roleDescription: entity.roleDescription,
      responsibilities: entity.responsibilities,
      isActive: entity.isActive,
      startDate: entity.startDate?.toISOString() || null,
      endDate: entity.endDate?.toISOString() || null,
      hourlyRate: entity.hourlyRate,
      contractType: entity.contractType,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  fromDTO(dto: StakeholderDTO): ProjectStakeholder {
    return new ProjectStakeholder(
      dto.id,
      dto.projectId,
      dto.stakeholderType,
      dto.stakeholderEntityType,
      dto.employeeId,
      dto.supplierId,
      dto.externalName,
      dto.externalEmail,
      dto.externalPhone,
      dto.roleDescription,
      dto.responsibilities,
      dto.isActive,
      dto.startDate ? new Date(dto.startDate) : null,
      dto.endDate ? new Date(dto.endDate) : null,
      dto.hourlyRate,
      dto.contractType,
      dto.notes,
      dto.createdAt,
      dto.updatedAt
    );
  }

  fromEntityToDTO(entity: ProjectStakeholder): StakeholderResponseDto {
    const baseDTO = this.toDTO(entity);
    
    // Add enhanced UI features
    return {
      ...baseDTO,
      stakeholderAnalytics: this.calculateStakeholderAnalytics(entity),
      costAnalysis: this.analyzeStakeholderCosts(entity),
      engagementMetrics: this.calculateEngagementMetrics(entity),
      riskAssessment: this.assessStakeholderRisk(entity),
      communicationHistory: [], // Would fetch from communication service
      performanceMetrics: this.calculatePerformanceMetrics(entity)
    };
  }

  fromDtosToAdapter(dtos: StakeholderDTO[]): StakeholderResponseDto[] {
    return dtos.map(dto => this.fromEntityToDTO(this.fromDTO(dto)));
  }

  toResponseDto(entity: ProjectStakeholder): StakeholderResponseDto {
    return this.fromEntityToDTO(entity);
  }

  toRequestDto(dto: CreateStakeholderRequestDto): StakeholderDTO {
    return {
      ...dto,
      id: '', // Will be generated
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  toUpdateDto(dto: UpdateStakeholderRequestDto): Partial<StakeholderDTO> {
    return {
      ...dto,
      updatedAt: new Date().toISOString()
    };
  }

  validate(dto: StakeholderDTO): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Required fields validation
    if (!dto.projectId || dto.projectId.trim() === '') {
      errors.push('Project ID is required');
      fieldErrors.projectId = ['Project ID is required'];
    }

    if (!dto.stakeholderType || dto.stakeholderType.trim() === '') {
      errors.push('Stakeholder type is required');
      fieldErrors.stakeholderType = ['Stakeholder type is required'];
    }

    if (!dto.roleDescription || dto.roleDescription.trim() === '') {
      errors.push('Role description is required');
      fieldErrors.roleDescription = ['Role description is required'];
    }

    // Email validation
    if (dto.externalEmail && !this.isValidEmail(dto.externalEmail)) {
      errors.push('Invalid email format');
      fieldErrors.externalEmail = ['Invalid email format'];
    }

    // Phone validation
    if (dto.externalPhone && !this.isValidPhone(dto.externalPhone)) {
      errors.push('Invalid phone format');
      fieldErrors.externalPhone = ['Invalid phone format'];
    }

    // Hourly rate validation
    if (dto.hourlyRate && dto.hourlyRate < 0) {
      errors.push('Hourly rate must be greater than 0');
      fieldErrors.hourlyRate = ['Hourly rate must be greater than 0'];
    }

    // Date validation
    if (dto.startDate && dto.endDate) {
      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);
      if (start > end) {
        errors.push('Start date cannot be after end date');
        fieldErrors.startDate = ['Start date cannot be after end date'];
        fieldErrors.endDate = ['End date cannot be before start date'];
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  // Enhanced utility methods with calculations
  static calculateStakeholderAnalytics(stakeholder: ProjectStakeholder): any {
    const totalHourlyCost = stakeholder.hourlyRate ? stakeholder.hourlyRate * 40 * 4 : 0; // 40h/week * 4 weeks
    const contractValue = totalHourlyCost * 12; // 12 months contract
    
    return {
      totalStakeholders: 1, // Simplified
      activeStakeholders: stakeholder.isActive ? 1 : 0,
      typeDistribution: {
        [stakeholder.stakeholderType]: 1
      },
      costAnalysis: {
        totalHourlyCost,
        totalContractValue: contractValue,
        budgetUtilization: 85 // Simplified
      },
      engagementMetrics: {
        averageEngagement: 80, // Simplified
        satisfactionScore: 75, // Simplified
        responseTime: 24 // Simplified hours
      }
    };
  }

  static analyzeStakeholderCosts(stakeholder: ProjectStakeholder): any {
    const hourlyCost = stakeholder.hourlyRate || 0;
    const monthlyCost = hourlyCost * 160; // 160 hours/month
    const annualCost = monthlyCost * 12;
    
    return {
      hourlyCost,
      monthlyCost,
      annualCost,
      costEfficiency: hourlyCost > 0 ? 100 : 0
    };
  }

  static calculateEngagementMetrics(stakeholder: ProjectStakeholder): any {
    return {
      taskCompletionRate: 85, // Simplified
      qualityScore: 80, // Simplified
      deadlineAdherence: 90, // Simplified
      collaborationScore: 75 // Simplified
    };
  }

  static assessStakeholderRisk(stakeholder: ProjectStakeholder): any {
    const riskFactors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    if (!stakeholder.isActive) {
      riskFactors.push('Stakeholder is inactive');
      riskLevel = 'medium';
    }

    if (!stakeholder.contractType) {
      riskFactors.push('No contract type specified');
      riskLevel = 'medium';
    }

    if (stakeholder.hourlyRate && stakeholder.hourlyRate > 500) {
      riskFactors.push('High hourly rate may impact budget');
      riskLevel = 'high';
    }

    if (!stakeholder.responsibilities || stakeholder.responsibilities.length === 0) {
      riskFactors.push('No responsibilities defined');
      riskLevel = 'medium';
    }

    return {
      level: riskLevel,
      factors: riskFactors,
      recommendations: riskLevel === 'high' 
        ? ['Review contract terms', 'Define clear responsibilities', 'Monitor performance']
        : riskLevel === 'medium'
        ? ['Clarify contract details', 'Define responsibilities', 'Improve communication']
        : ['Maintain regular contact', 'Monitor satisfaction']
    };
  }

  static calculatePerformanceMetrics(stakeholder: ProjectStakeholder): any {
    return {
      taskCompletionRate: 90, // Simplified
      qualityScore: 85, // Simplified
      deadlineAdherence: 95, // Simplified
      collaborationScore: 80 // Simplified
    };
  }

  static generateStakeholderReport(stakeholder: ProjectStakeholder): any {
    const analytics = StakeholderDomainTransformer.calculateStakeholderAnalytics(stakeholder);
    const costs = StakeholderDomainTransformer.analyzeStakeholderCosts(stakeholder);
    const engagement = StakeholderDomainTransformer.calculateEngagementMetrics(stakeholder);
    const risk = StakeholderDomainTransformer.assessStakeholderRisk(stakeholder);
    const performance = StakeholderDomainTransformer.calculatePerformanceMetrics(stakeholder);

    return {
      stakeholderInfo: {
        id: stakeholder.id,
        type: stakeholder.stakeholderType,
        name: stakeholder.externalName || 'Internal',
        status: stakeholder.isActive ? 'Active' : 'Inactive'
      },
      analytics,
      costs,
      engagement,
      risk,
      performance,
      recommendations: StakeholderDomainTransformer.generateStakeholderRecommendations(stakeholder, analytics, risk),
      generatedAt: new Date().toISOString()
    };
  }

  static generateStakeholderRecommendations(stakeholder: ProjectStakeholder, analytics: any, risk: any): string[] {
    const recommendations: string[] = [];

    if (risk.level === 'high') {
      recommendations.push('Immediate risk mitigation required');
    }

    if (analytics.engagementMetrics.averageEngagement < 70) {
      recommendations.push('Improve stakeholder engagement');
    }

    if (analytics.costAnalysis.budgetUtilization < 80) {
      recommendations.push('Monitor budget utilization');
    }

    if (!stakeholder.responsibilities || stakeholder.responsibilities.length === 0) {
      recommendations.push('Define clear responsibilities');
    }

    return recommendations;
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)\-]?[\s]?[0-9]{1,4}[)\-]?[\s]?[0-9]{1,4}]*$/;
    return phoneRegex.test(phone);
  }

  static formatStakeholderCost(cost: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(cost);
  }

  static getStakeholderTypeColor(type: StakeholderType): string {
    switch (type) {
      case 'client': return '#3B82F6'; // Blue
      case 'consultant': return '#10B981'; // Green
      case 'contractor': return '#F59E0B'; // Amber
      case 'supplier': return '#8B5CF6'; // Purple
      case 'inspector': return '#EF4444'; // Red
      case 'manager': return '#6366F1'; // Orange
      case 'engineer': return '#8B5CF6'; // Light Blue
      case 'architect': return '#6B7280'; // Teal
      case 'other': return '#6B7280'; // Gray
      default: return '#9CA3AF'; // Indigo
    }
  }

  static validateStakeholderWorkflow(stakeholder: ProjectStakeholder, workflow: any): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    if (workflow.requiresContract && !stakeholder.contractType) {
      errors.push('Contract type is required');
      fieldErrors.contractType = ['Contract type is required'];
    }

    if (workflow.requiresSkills && (!stakeholder.requiredSkills || stakeholder.requiredSkills.length === 0)) {
      errors.push('Required skills not specified');
      fieldErrors.requiredSkills = ['Required skills are required'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  static calculateStakeholderMetrics(stakeholders: ProjectStakeholder[]): any {
    const totalStakeholders = stakeholders.length;
    const activeStakeholders = stakeholders.filter(s => s.isActive).length;
    const typeDistribution = stakeholders.reduce((acc, s) => {
      acc[s.stakeholderType] = (acc[s.stakeholderType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalHourlyCost = stakeholders.reduce((sum, s) => sum + (s.hourlyRate || 0), 0);
    const totalContractValue = stakeholders.reduce((sum, s) => sum + (s.hourlyRate || 0) * 40 * 4 * 12, 0);

    return {
      totalStakeholders,
      activeStakeholders,
      typeDistribution,
      totalHourlyCost,
      totalContractValue,
      averageHourlyRate: totalStakeholders > 0 ? totalHourlyCost / totalStakeholders : 0,
      budgetUtilization: 85 // Simplified
    };
  }
}
