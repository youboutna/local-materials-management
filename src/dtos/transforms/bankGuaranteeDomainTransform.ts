/**
 * Bank Guarantee Domain Transformer - Enhanced with Calculations and Business Logic
 * Integrates bank guarantee management, validation, and UI-specific features
 * Following hexagonal architecture principles
 */

import { BaseEntityDTO, EntityToDTOMapper, ValidationResult } from '@/dtos/shared';

// Enhanced types for UI components
export interface BankGuaranteeDTO extends BaseEntityDTO {
  projectId: string;
  guaranteeNumber: string;
  guaranteeType: 'performance' | 'payment' | 'advance_payment' | 'retention';
  providerName: string;
  providerContact: string;
  providerEmail: string;
  providerPhone: string;
  guaranteeAmount: number;
  guaranteeCurrency: string;
  startDate: string;
  endDate: string;
  coverageDescription: string | null;
  coverageAmount: number;
  coveragePercentage: number;
  deductibleAmount: number;
  deductiblePercentage: number;
  premiumAmount: number;
  premiumPercentage: number;
  status: 'active' | 'expired' | 'claimed' | 'cancelled';
  claimHistory?: Array<{
    id: string;
    claimDate: string;
    amount: number;
    status: string;
    description: string;
    approvedAt?: string;
    processedAt?: string;
  }>;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BankGuaranteeResponseDto extends BankGuaranteeDTO {
  // Enhanced fields for UI
  guaranteeAnalytics?: {
    totalGuarantees: number;
    activeGuarantees: number;
    expiredGuarantees: number;
    claimedGuarantees: number;
    totalCoverageAmount: number;
    totalPremiumAmount: number;
    utilizationRate: number;
    riskAssessment?: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
      recommendations: string[];
    };
  };
  providerPerformance?: {
    rating: number;
    responseTime: number;
    claimProcessingTime: number;
    approvalRate: number;
    customerSatisfaction: number;
  };
  recommendations?: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    assignedTo?: string;
  }>;
  complianceStatus?: {
    regulatoryCompliance: boolean;
    documentationComplete: boolean;
    auditReady: boolean;
    lastAuditDate?: string;
    issues: Array<{
      type: 'documentation' | 'financial' | 'operational';
      description: string;
      severity: 'low' | 'medium' | 'high';
      status: 'open' | 'resolved';
    }>;
  };
}

export interface CreateBankGuaranteeRequestDto extends Omit<BankGuaranteeDTO, 'id' | 'createdAt' | 'updatedAt'> {
  // Additional validation fields
  priority?: 'low' | 'medium' | 'high' | 'critical';
  providerRequirements?: Array<{
    type: string;
    description: string;
    required: boolean;
  }>;
  coverageRequirements?: {
    minimumCoverage: number;
    requiredRegions: string[];
    excludedRisks: string[];
  };
  claimProcess?: {
    requiredDocuments: string[];
    approvalWorkflow: string;
    processingTime: number;
    appealProcess: string;
  };
  paymentTerms?: {
    paymentSchedule: 'upfront' | 'milestone' | 'progress' | 'completion';
    retentionPeriod: number;
  };
}

export interface UpdateBankGuaranteeRequestDto extends Partial<CreateBankGuaranteeRequestDto> {
  // Update-specific fields
  statusChangeReason?: string;
  claimUpdate?: {
    claimId: string;
    status: string;
    amount: number;
    resolution?: string;
    notes?: string;
  };
  coverageUpdate?: {
    newCoverageAmount: number;
    newEndDate?: string;
    newDeductible?: number;
    newPremium?: number;
  };
  providerUpdate?: {
    newProviderName?: string;
    newContactInfo?: {
      name: string;
      email: string;
      phone: string;
    };
    complianceUpdate?: {
      newDocumentation?: string[];
      auditDate?: string;
      issues?: Array<{
        type: string;
        description: string;
        severity: string;
        status: string;
      }>;
    };
  };
}

export class BankGuaranteeDomainTransformer implements EntityToDTOMapper<any, BankGuaranteeDTO> {
  
  toDTO(entity: any): BankGuaranteeDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      guaranteeNumber: entity.guaranteeNumber,
      guaranteeType: entity.guaranteeType,
      providerName: entity.providerName,
      providerContact: entity.providerContact,
      providerEmail: entity.providerEmail,
      providerPhone: entity.providerPhone,
      guaranteeAmount: entity.guaranteeAmount,
      guaranteeCurrency: entity.guaranteeCurrency,
      startDate: entity.startDate?.toISOString() || '',
      endDate: entity.endDate?.toISOString() || '',
      coverageDescription: entity.coverageDescription,
      coverageAmount: entity.coverageAmount,
      coveragePercentage: entity.coveragePercentage,
      deductibleAmount: entity.deductibleAmount,
      deductiblePercentage: entity.deductiblePercentage,
      premiumAmount: entity.premiumAmount,
      premiumPercentage: entity.premiumPercentage,
      status: entity.status,
      claimHistory: entity.claimHistory || [],
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  fromDTO(dto: BankGuaranteeDTO): any {
    return {
      id: dto.id,
      projectId: dto.projectId,
      guaranteeNumber: dto.guaranteeNumber,
      guaranteeType: dto.guaranteeType,
      providerName: dto.providerName,
      providerContact: dto.providerContact,
      providerEmail: dto.providerEmail,
      providerPhone: dto.providerPhone,
      guaranteeAmount: dto.guaranteeAmount,
      guaranteeCurrency: dto.guaranteeCurrency,
      startDate: dto.startDate,
      endDate: dto.endDate,
      coverageDescription: dto.coverageDescription,
      coverageAmount: dto.coverageAmount,
      coveragePercentage: dto.coveragePercentage,
      deductibleAmount: dto.deductibleAmount,
      deductiblePercentage: dto.deductiblePercentage,
      premiumAmount: dto.premiumAmount,
      premiumPercentage: dto.premiumPercentage,
      status: dto.status,
      claimHistory: dto.claimHistory,
      notes: dto.notes,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  fromEntityToDTO(entity: any): BankGuaranteeResponseDto {
    const baseDTO = this.toDTO(entity);
    
    // Add enhanced UI features
    return {
      ...baseDTO,
      guaranteeAnalytics: this.calculateGuaranteeAnalytics(entity),
      providerPerformance: this.analyzeProviderPerformance(entity),
      riskAssessment: this.assessGuaranteeRisk(entity),
      recommendations: this.generateGuaranteeRecommendations(entity),
      complianceStatus: this.checkComplianceStatus(entity)
    };
  }

  fromDtosToAdapter(dtos: BankGuaranteeDTO[]): BankGuaranteeResponseDto[] {
    return dtos.map(dto => this.fromEntityToDTO(this.fromDTO(dto)));
  }

  toResponseDto(entity: any): BankGuaranteeResponseDto {
    return this.fromEntityToDTO(entity);
  }

  toRequestDto(dto: CreateBankGuaranteeRequestDto): BankGuaranteeDTO {
    return {
      ...dto,
      id: '', // Will be generated
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  toUpdateDto(dto: UpdateBankGuaranteeRequestDto): Partial<BankGuaranteeDTO> {
    return {
      ...dto,
      updatedAt: new Date().toISOString()
    };
  }

  validate(dto: BankGuaranteeDTO): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Required fields validation
    if (!dto.projectId || dto.projectId.trim() === '') {
      errors.push('Project ID is required');
      fieldErrors.projectId = ['Project ID is required'];
    }

    if (!dto.guaranteeNumber || dto.guaranteeNumber.trim() === '') {
      errors.push('Guarantee number is required');
      fieldErrors.guaranteeNumber = ['Guarantee number is required'];
    }

    if (!dto.providerName || dto.providerName.trim() === '') {
      errors.push('Provider name is required');
      fieldErrors.providerName = ['Provider name is required'];
    }

    if (!dto.guaranteeAmount || dto.guaranteeAmount <= 0) {
      errors.push('Guarantee amount must be greater than 0');
      fieldErrors.guaranteeAmount = ['Guarantee amount must be greater than 0'];
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

    // Coverage validation
    if (dto.coveragePercentage && (dto.coveragePercentage < 0 || dto.coveragePercentage > 100)) {
      errors.push('Coverage percentage must be between 0 and 100');
      fieldErrors.coveragePercentage = ['Coverage percentage must be between 0 and 100'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  // Enhanced utility methods with calculations
  static calculateGuaranteeAnalytics(guarantee: any): any {
    const totalCoverage = guarantee.guaranteeAmount * (guarantee.coveragePercentage / 100);
    const totalPremium = guarantee.premiumAmount;
    const utilizationRate = totalCoverage > 0 ? (totalCoverage / guarantee.guaranteeAmount) * 100 : 0;

    return {
      totalGuarantees: 1, // Simplified
      activeGuarantees: guarantee.status === 'active' ? 1 : 0,
      expiredGuarantees: guarantee.status === 'expired' ? 1 : 0,
      claimedGuarantees: guarantee.claimHistory?.filter(claim => claim.status === 'claimed').length || 0,
      totalCoverageAmount,
      totalPremiumAmount,
      utilizationRate,
      riskAssessment: this.assessGuaranteeRisk(guarantee)
    };
  }

  static analyzeProviderPerformance(guarantee: any): any {
    const claimHistory = guarantee.claimHistory || [];
    const totalClaims = claimHistory.length;
    const approvedClaims = claimHistory.filter(claim => claim.status === 'approved').length;
    const totalClaimAmount = claimHistory.reduce((sum, claim) => sum + (claim.amount || 0), 0);
    const approvalRate = totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0;
    const averageProcessingTime = claimHistory.reduce((sum, claim) => {
      const processed = claim.processedAt ? new Date(claim.processedAt) : new Date(claim.createdAt);
      const created = new Date(claim.createdAt);
      return sum + (processed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);

    return {
      rating: 85, // Simplified
      responseTime: 24, // Simplified hours
      claimProcessingTime: averageProcessingTime,
      approvalRate,
      customerSatisfaction: 80 // Simplified
    };
  }

  static assessGuaranteeRisk(guarantee: any): any {
    const riskFactors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    if (guarantee.status === 'expired') {
      riskFactors.push('Guarantee has expired');
      riskLevel = 'high';
    }

    if (guarantee.claimHistory && guarantee.claimHistory.length > 5) {
      riskFactors.push('High claim frequency');
      riskLevel = 'medium';
    }

    if (guarantee.coveragePercentage < 50) {
      riskFactors.push('Low coverage amount');
      riskLevel = 'medium';
    }

    return {
      level: riskLevel,
      factors: riskFactors,
      recommendations: riskLevel === 'high' 
        ? ['Immediate renewal required', 'Review coverage terms', 'Monitor claims closely']
        : riskLevel === 'medium'
        ? ['Consider coverage increase', 'Review claim process']
        : ['Maintain regular monitoring', 'Review provider performance']
    };
  }

  static checkComplianceStatus(guarantee: any): any {
    // Simplified compliance check
    return {
      regulatoryCompliance: guarantee.status === 'active' && guarantee.providerName !== '',
      documentationComplete: true, // Simplified
      auditReady: true, // Simplified
      lastAuditDate: new Date().toISOString(),
      issues: [] // Simplified
    };
  }

  static generateGuaranteeRecommendations(guarantee: any, analytics: any, risk: any): string[] {
    const recommendations: string[] = [];

    if (risk.level === 'high') {
      recommendations.push('Immediate action required on guarantee');
    }

    if (analytics.utilizationRate < 70) {
      recommendations.push('Review guarantee utilization');
    }

    if (!guarantee.providerName) {
      recommendations.push('Update provider information');
    }

    return recommendations;
  }

  static formatGuaranteeAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  static getGuaranteeStatusColor(status: string): string {
    switch (status) {
      case 'active': return '#10B981'; // Green
      case 'expired': return '#EF4444'; // Red
      case 'claimed': return '#F59E0B'; // Amber
      case 'cancelled': return '#6B7280'; // Gray
      default: return '#9CA3AF'; // Blue
    }
  }

  static validateGuaranteeWorkflow(guarantee: any, workflow: any): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    if (workflow.requiresDocumentation && !guarantee.claimHistory) {
      errors.push('Claim history documentation required');
      fieldErrors.claimHistory = ['Claim history documentation required'];
    }

    if (workflow.requiresProviderApproval && !guarantee.providerName) {
      errors.push('Provider approval required');
      fieldErrors.providerName = ['Provider approval required'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  static calculateGuaranteeMetrics(guarantees: any[]): any {
    const totalGuarantees = guarantees.length;
    const activeGuarantees = guarantees.filter(g => g.status === 'active').length;
    const expiredGuarantees = guarantees.filter(g => g.status === 'expired').length;
    const claimedGuarantees = guarantees.reduce((sum, g) => sum + (g.claimHistory?.length || 0), 0);
    const totalCoverageAmount = guarantees.reduce((sum, g) => sum + (g.guaranteeAmount || 0), 0);
    const totalPremiumAmount = guarantees.reduce((sum, g) => sum + (g.premiumAmount || 0), 0);

    return {
      totalGuarantees,
      activeGuarantees,
      expiredGuarantees,
      claimedGuarantees,
      totalCoverageAmount,
      totalPremiumAmount,
      averageUtilizationRate: totalCoverageAmount > 0 ? (totalCoverageAmount / totalGuarantees) * 100 : 0
    };
  }
}
