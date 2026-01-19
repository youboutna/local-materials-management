/**
 * Insurance Domain Transformer - Enhanced with Calculations and Business Logic
 * Integrates insurance management, validation, and UI-specific features
 * Following hexagonal architecture principles
 */

import { BaseEntityDTO, EntityToDTOMapper, ValidationResult } from '@/dtos/shared';

// Enhanced types for UI components
export interface InsurancePolicyDTO extends BaseEntityDTO {
  projectId: string;
  policyNumber: string;
  policyType: 'liability' | 'property' | 'professional_indemnity' | 'workers_compensation' | 'equipment' | 'environmental';
  providerName: string;
  providerContact: string;
  providerEmail: string;
  providerPhone: string;
  coverageAmount: number;
  coverageType: string;
  coverageDescription: string;
  premiumAmount: number;
  deductibleAmount: number;
  deductiblePercentage: number;
  policyLimits: {
    maxClaimAmount: number;
    coverageLimit: number;
    retentionPeriod: number;
    renewalDate?: string;
  };
  status: 'active' | 'expired' | 'cancelled' | 'suspended';
  claimHistory?: Array<{
    id: string;
    claimDate: string;
    amount: number;
    status: string;
    description: string;
    approvedAt?: string;
    processedAt?: string;
    paidAt?: string;
  }>;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsurancePolicyResponseDto extends InsurancePolicyDTO {
  // Enhanced fields for UI
  policyAnalytics?: {
    totalPolicies: number;
    activePolicies: number;
    expiredPolicies: number;
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
  complianceStatus?: {
    regulatoryCompliance: boolean;
    documentationComplete: boolean;
    auditReady: boolean;
    lastAuditDate?: string;
    issues: Array<{
      type: 'documentation' | 'financial' | 'operational' | 'legal';
      description: string;
      severity: 'low' | 'medium' | 'high';
      status: 'open' | 'resolved';
    }>;
  };
  recommendations?: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    assignedTo?: string;
  }>;
}

export interface CreateInsurancePolicyRequestDto extends Omit<InsurancePolicyDTO, 'id' | 'createdAt' | 'updatedAt'> {
  // Additional validation fields
  priority?: 'low' | 'medium' | 'high' | 'critical';
  coverageRequirements?: {
    minimumCoverage: number;
    requiredRisks: string[];
    excludedActivities: string[];
    excludedRegions: string[];
  };
  policyTerms?: {
    paymentSchedule: 'monthly' | 'quarterly' | 'annually';
    gracePeriod: number;
    cancellationTerms: string;
    subrogationRights: string;
  };
}

export interface UpdateInsurancePolicyRequestDto extends Partial<CreateInsurancePolicyRequestDto> {
  // Update-specific fields
  statusChangeReason?: string;
  coverageUpdate?: {
    newCoverageAmount: number;
    newDeductible?: number;
    newPremium?: number;
    newEndDate?: string;
  };
  providerUpdate?: {
    newProviderName?: string;
    newContactInfo?: {
      name: string;
      email: string;
      phone: string;
    };
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
}

export class InsuranceDomainTransformer implements EntityToDTOMapper<any, InsurancePolicyDTO> {
  
  toDTO(entity: any): InsurancePolicyDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      policyNumber: entity.policyNumber,
      policyType: entity.policyType,
      providerName: entity.providerName,
      providerContact: entity.providerContact,
      providerEmail: entity.providerEmail,
      providerPhone: entity.providerPhone,
      coverageAmount: entity.coverageAmount,
      coverageType: entity.coverageType,
      coverageDescription: entity.coverageDescription,
      premiumAmount: entity.premiumAmount,
      deductibleAmount: entity.deductibleAmount,
      deductiblePercentage: entity.deductiblePercentage,
      policyLimits: entity.policyLimits,
      renewalDate: entity.renewalDate,
      status: entity.status,
      claimHistory: entity.claimHistory || [],
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  fromDTO(dto: InsurancePolicyDTO): any {
    return {
      id: dto.id,
      projectId: dto.projectId,
      policyNumber: dto.policyNumber,
      policyType: dto.policyType,
      providerName: dto.providerName,
      providerContact: dto.providerContact,
      providerEmail: dto.providerEmail,
      providerPhone: dto.providerPhone,
      coverageAmount: dto.coverageAmount,
      coverageType: dto.coverageType,
      coverageDescription: dto.coverageDescription,
      premiumAmount: dto.premiumAmount,
      deductibleAmount: dto.deductibleAmount,
      deductiblePercentage: dto.deductiblePercentage,
      policyLimits: dto.policyLimits,
      renewalDate: dto.renewalDate,
      status: dto.status,
      claimHistory: dto.claimHistory,
      notes: dto.notes,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  fromEntityToDTO(entity: any): InsurancePolicyResponseDto {
    const baseDTO = this.toDTO(entity);
    
    // Add enhanced UI features
    return {
      ...baseDTO,
      policyAnalytics: this.calculatePolicyAnalytics(entity),
      providerPerformance: this.analyzeProviderPerformance(entity),
      riskAssessment: this.assessPolicyRisk(entity),
      recommendations: this.generatePolicyRecommendations(entity),
      complianceStatus: this.checkComplianceStatus(entity)
    };
  }

  fromDtosToAdapter(dtos: InsurancePolicyDTO[]): InsurancePolicyResponseDto[] {
    return dtos.map(dto => this.fromEntityToDTO(this.fromDTO(dto)));
  }

  toResponseDto(entity: any): InsurancePolicyResponseDto {
    return this.fromEntityToDTO(entity);
  }

  toRequestDto(dto: CreateInsurancePolicyRequestDto): InsurancePolicyDTO {
    return {
      ...dto,
      id: '', // Will be generated
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  toUpdateDto(dto: UpdateInsurancePolicyRequestDto): Partial<InsurancePolicyDTO> {
    return {
      ...dto,
      updatedAt: new Date().toISOString()
    };
  }

  validate(dto: InsurancePolicyDTO): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Required fields validation
    if (!dto.projectId || dto.projectId.trim() === '') {
      errors.push('Project ID is required');
      fieldErrors.projectId = ['Project ID is required'];
    }

    if (!dto.policyNumber || dto.policyNumber.trim() === '') {
      errors.push('Policy number is required');
      fieldErrors.policyNumber = ['Policy number is required'];
    }

    if (!dto.providerName || dto.providerName.trim() === '') {
      errors.push('Provider name is required');
      fieldErrors.providerName = ['Provider name is required'];
    }

    if (!dto.coverageAmount || dto.coverageAmount <= 0) {
      errors.push('Coverage amount must be greater than 0');
      fieldErrors.coverageAmount = ['Coverage amount must be greater than 0'];
    }

    // Policy limits validation
    if (dto.policyLimits) {
      if (dto.policyLimits.maxClaimAmount && dto.coverageAmount > dto.policyLimits.maxClaimAmount) {
        errors.push(`Coverage amount exceeds maximum limit of ${dto.policyLimits.maxClaimAmount}`);
        fieldErrors.coverageAmount = [`Coverage amount cannot exceed ${dto.policyLimits.maxClaimAmount}`];
      }
      
      if (dto.policyLimits.coverageLimit && dto.coverageAmount > dto.policyLimits.coverageLimit) {
        errors.push(`Coverage amount exceeds limit of ${dto.policyLimits.coverageLimit}`);
        fieldErrors.coverageAmount = [`Coverage amount cannot exceed ${dto.policyLimits.coverageLimit}`];
      }
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
  static calculatePolicyAnalytics(policy: any): any {
    const totalCoverage = policy.coverageAmount;
    const totalPremium = policy.premiumAmount;
    const utilizationRate = totalCoverage > 0 ? (totalCoverage / policy.coverageAmount) * 100 : 0;
    const riskScore = this.assessPolicyRisk(policy).level === 'high' ? 75 : 90; // Simplified

    return {
      totalPolicies: 1, // Simplified
      activePolicies: policy.status === 'active' ? 1 : 0,
      totalCoverageAmount,
      totalPremiumAmount,
      utilizationRate,
      riskAssessment: this.assessPolicyRisk(policy)
    };
  }

  static analyzeProviderPerformance(policy: any): any {
    const claimHistory = policy.claimHistory || [];
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

  static assessPolicyRisk(policy: any): any {
    const riskFactors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    if (policy.status === 'expired') {
      riskFactors.push('Policy has expired');
      riskLevel = 'high';
    }

    if (policy.claimHistory && policy.claimHistory.length > 3) {
      riskFactors.push('High claim frequency');
      riskLevel = 'medium';
    }

    if (policy.deductiblePercentage > 50) {
      riskFactors.push('High deductible percentage');
      riskLevel = 'medium';
    }

    return {
      level: riskLevel,
      factors: riskFactors,
      recommendations: riskLevel === 'high' 
        ? ['Immediate renewal required', 'Review coverage terms', 'Monitor claims closely']
        : riskLevel === 'medium'
        ? ['Consider coverage review', 'Optimize deductible structure']
        : ['Maintain regular monitoring', 'Review provider performance']
    };
  }

  static checkComplianceStatus(policy: any): any {
    // Simplified compliance check
    return {
      regulatoryCompliance: policy.status === 'active' && policy.providerName !== '',
      documentationComplete: true, // Simplified
      auditReady: true, // Simplified
      lastAuditDate: new Date().toISOString(),
      issues: [] // Simplified
    };
  }

  static generatePolicyRecommendations(policy: any, analytics: any, risk: any): string[] {
    const recommendations: string[] = [];

    if (risk.level === 'high') {
      recommendations.push('Immediate policy renewal required');
    }

    if (analytics.utilizationRate < 70) {
      recommendations.push('Review coverage utilization');
    }

    if (!policy.providerName) {
      recommendations.push('Update provider information');
    }

    return recommendations;
  }

  static formatPolicyAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  static getPolicyStatusColor(status: string): string {
    switch (status) {
      case 'active': return '#10B981'; // Green
      case 'expired': return '#EF4444'; // Red
      case 'cancelled': return '#6B7280'; // Gray
      case 'suspended': return '#F59E0B'; // Amber
      default: return '#9CA3AF'; // Blue
    }
  }

  static validatePolicyWorkflow(policy: any, workflow: any): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    if (workflow.requiresDocumentation && !policy.claimHistory) {
      errors.push('Claim history documentation required');
      fieldErrors.claimHistory = ['Claim history documentation required'];
    }

    if (workflow.requiresProviderApproval && !policy.providerName) {
      errors.push('Provider approval required');
      fieldErrors.providerName = ['Provider approval required'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  static calculatePolicyMetrics(policies: any[]): any {
    const totalPolicies = policies.length;
    const activePolicies = policies.filter(p => p.status === 'active').length;
    const expiredPolicies = policies.filter(p => p.status === 'expired').length;
    const totalCoverageAmount = policies.reduce((sum, p) => sum + (p.coverageAmount || 0), 0);
    const totalPremiumAmount = policies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0);

    return {
      totalPolicies,
      activePolicies,
      expiredPolicies,
      totalCoverageAmount,
      totalPremiumAmount,
      averageUtilizationRate: totalCoverageAmount > 0 ? (totalCoverageAmount / totalPolicies) * 100 : 0,
    };
  }
}
