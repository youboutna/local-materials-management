/**
 * Contract Domain Transformer - Enhanced with Calculations and Business Logic
 * Integrates contract management, validation, and UI-specific features
 * Following hexagonal architecture principles
 */

import { BaseEntityDTO, EntityToDTOMapper, ValidationResult } from '@/dtos/shared';

// Enhanced types for UI components
export interface ContractDTO extends BaseEntityDTO {
  projectId: string;
  contractNumber: string;
  title: string;
  description: string | null;
  contractType: 'fixed_price' | 'unit_price' | 'time_materials' | 'cost_plus' | 'lump_sum';
  clientId: string | null;
  clientName: string | null;
  clientContact: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  clientAddress: string | null;
  supplierId: string | null;
  supplierName: string | null;
  startDate: string;
  endDate: string;
  totalValue: number;
  currency: string;
  paymentTerms: string;
  deliveryTerms: string | null;
  scopeOfWork: string | null;
  deliverables: string[];
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
    completedAt?: string;
    actualCompletionDate?: string;
  }>;
  penalties: Array<{
    id: string;
    type: 'delay' | 'quality' | 'performance' | 'payment';
    description: string;
    amount: number;
    percentage: number;
    isApplied: boolean;
  waived: boolean;
  }>;
  documents: string[];
  signedAt?: string | null;
  signedBy?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  renewalDate?: string | null;
  autoRenewal: boolean;
  terminationClause: string | null;
  governingLaw: string | null;
  jurisdiction: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractResponseDto extends ContractDTO {
  // Enhanced fields for UI
  contractAnalytics?: {
    totalContracts: number;
    activeContracts: number;
    completedContracts: number;
    delayedContracts: number;
    totalValue: number;
    averageDuration: number;
    onTimeDeliveryRate: number;
    costVariance: number;
    performanceScore: number;
    riskAssessment?: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
      recommendations: string[];
    };
  };
  clientRelationshipMetrics?: {
    totalClients: number;
    activeClients: number;
    clientSatisfaction: number;
    averageContractValue: number;
    repeatBusinessRate: number;
    clientRetentionRate: number;
  };
  recommendations?: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    assignedTo?: string;
  }>;
  complianceStatus?: {
    legalCompliance: boolean;
    documentationComplete: boolean;
    auditReady: boolean;
    lastAuditDate?: string;
    issues: Array<{
      type: 'legal' | 'financial' | 'operational' | 'documentation';
      description: string;
      severity: 'low' | 'medium' | 'high';
      status: 'pending' | 'open' | 'resolved';
    }>;
  };
}

export interface CreateContractRequestDto extends Omit<ContractDTO, 'id' | 'createdAt' | 'updatedAt'> {
  // Additional validation fields
  priority?: 'low' | 'medium' | 'high' | 'critical';
  clientRequirements?: Array<{
    type: string;
    description: string;
    required: boolean;
  }>;
  supplierRequirements?: Array<{
    type: string;
    description: string;
    required: boolean;
  }>;
  paymentTerms?: {
    paymentSchedule: 'upfront' | 'milestone' | 'progress' | 'completion';
    retentionPeriod: number;
    gracePeriod: number;
    cancellationTerms: string;
    subrogationRights: string;
  };
  scopeOfWork?: string;
  deliverables?: string[];
  milestones?: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
    completedAt?: string;
    actualCompletionDate?: string;
  }>;
  documentRequirements?: Array<{
    type: string;
    description: string;
    required: boolean;
  }>;
  terminationClause?: string;
  governingLaw?: string;
  jurisdiction?: string;
}

export interface UpdateContractRequestDto extends Partial<CreateContractRequestDto> {
  // Update-specific fields
  statusChangeReason?: string;
  milestoneUpdate?: {
    milestoneId: string;
    status: string;
    actualCompletionDate?: string;
    notes?: string;
  };
  paymentUpdate?: {
    newPaymentSchedule?: string;
    newTotalValue?: number;
    renewalDate?: string;
    terminationClause?: string;
  };
  clientUpdate?: {
    newClientName?: string;
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

export class ContractDomainTransformer implements EntityToDTOMapper<any, ContractDTO> {
  
  toDTO(entity: any): ContractDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      contractNumber: entity.contractNumber,
      title: entity.title,
      description: entity.description,
      contractType: entity.contractType,
      clientId: entity.clientId,
      clientName: entity.clientName,
      clientContact: entity.clientContact,
      clientEmail: entity.clientEmail,
      clientPhone: entity.clientPhone,
      clientAddress: entity.clientAddress,
      supplierId: entity.supplierId,
      supplierName: entity.supplierName,
      startDate: entity.startDate?.toISOString() || '',
      endDate: entity.endDate?.toISOString() || '',
      totalValue: entity.totalValue,
      currency: entity.currency,
      paymentTerms: entity.paymentTerms,
      deliveryTerms: entity.deliveryTerms,
      scopeOfWork: entity.scopeOfWork,
      deliverables: entity.deliverables,
      milestones: entity.milestones,
      penalties: entity.penalties,
      documents: entity.documents,
      signedAt: entity.signedAt || '',
      signedBy: entity.signedBy || '',
      approvedBy: entity.approvedBy || '',
      approvedAt: entity.approvedAt || '',
      renewalDate: entity.renewalDate || '',
      autoRenewal: entity.autoRenewal,
      terminationClause: entity.terminationClause,
      governingLaw: entity.governingLaw,
      jurisdiction: entity.jurisdiction,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  fromDTO(dto: ContractDTO): any {
    return {
      id: dto.id,
      projectId: dto.projectId,
      contractNumber: dto.contractNumber,
      title: dto.title,
      description: dto.description,
      contractType: dto.contractType,
      clientId: dto.clientId,
      clientName: dto.clientName,
      clientContact: dto.clientContact,
      clientEmail: dto.clientEmail,
      clientPhone: dto.clientPhone,
      clientAddress: dto.clientAddress,
      supplierId: dto.supplierId,
      supplierName: dto.supplierName,
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalValue: dto.totalValue,
      currency: dto.currency,
      paymentTerms: dto.paymentTerms,
      deliveryTerms: dto.deliveryTerms,
      scopeOfWork: dto.scopeOfWork,
      deliverables: dto.deliverables,
      milestones: dto.milestones,
      penalties: dto.penalties,
      documents: dto.documents,
      signedAt: dto.signedAt,
      signedBy: dto.signedBy,
      approvedBy: dto.approvedBy,
      approvedAt: dto.approvedAt,
      renewalDate: dto.renewalDate,
      autoRenewal: dto.autoRenewal,
      terminationClause: dto.terminationClause,
      governingLaw: dto.governingLaw,
      jurisdiction: dto.jurisdiction,
      notes: dto.notes,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  fromEntityToDTO(entity: any): ContractResponseDto {
    const baseDTO = this.toDTO(entity);
    
    // Add enhanced UI features
    return {
      ...baseDTO,
      contractAnalytics: this.calculateContractAnalytics(entity),
      clientRelationshipMetrics: this.analyzeClientRelationship(entity),
      riskAssessment: this.assessContractRisk(entity),
      recommendations: this.generateContractRecommendations(entity),
      complianceStatus: this.checkComplianceStatus(entity)
    };
  }

  fromDtosToAdapter(dtos: ContractDTO[]): ContractResponseDto[] {
    return dtos.map(dto => this.fromEntityToDTO(this.fromDTO(dto)));
  }

  toResponseDto(entity: any): ContractResponseDto {
    return this.fromEntityToDTO(entity);
  }

  toRequestDto(dto: CreateContractRequestDto): ContractDTO {
    return {
      ...dto,
      id: '', // Will be generated
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  toUpdateDto(dto: UpdateContractRequestDto): Partial<ContractDTO> {
    return {
      ...dto,
      updatedAt: new Date().toISOString()
    };
  }

  validate(dto: ContractDTO): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Required fields validation
    if (!dto.projectId || dto.projectId.trim() === '') {
      errors.push('Project ID is required');
      fieldErrors.projectId = ['Project ID is required'];
    }

    if (!dto.title || dto.title.trim() === '') {
      errors.push('Contract title is required');
      fieldErrors.title = ['Contract title is required'];
    }

    if (!dto.contractType || dto.contractType.trim() === '') {
      errors.push('Contract type is required');
      fieldErrors.contractType = ['Contract type is required'];
    }

    if (!dto.totalValue || dto.totalValue <= 0) {
      errors.push('Total value must be greater than 0');
      fieldErrors.totalValue = ['Total value must be greater than 0'];
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
  static calculateContractAnalytics(contract: any): any {
    const totalDuration = contract.startDate && contract.endDate 
      ? Math.ceil((new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const totalValue = contract.totalValue;
    const progress = contract.milestones ? 
      contract.milestones.filter(m => m.status === 'completed').length / contract.milestones.length * 100 
      : 0;
    const completedMilestones = contract.milestones ? contract.milestones.filter(m => m.status === 'completed') : [];
    const completedWithDates = completedMilestones.filter(m => m.actualCompletionDate);
    const onTimeDeliveryRate = completedWithDates.length > 0 ? 
      (completedWithDates.filter(m => new Date(m.actualCompletionDate!) <= new Date(m.dueDate)).length / completedWithDates.length) * 100 : 0;
    const costVariance = contract.totalValue - (contract.totalValue * (progress / 100));
    const performanceScore = progress > 0 ? Math.min(100, progress) : 0;

    return {
      totalContracts: 1, // Simplified
      activeContracts: contract.status === 'active' ? 1 : 0,
      completedContracts: contract.status === 'completed' ? 1 : 0,
      delayedContracts: contract.status === 'delayed' ? 1 : 0,
      totalValue,
      averageDuration,
      onTimeDeliveryRate,
      costVariance,
      performanceScore,
      riskAssessment: this.assessContractRisk(contract)
    };
  }

  static analyzeClientRelationship(contract: any): any {
    const totalContracts = 1; // Simplified
    const activeContracts = contract.status === 'active' ? 1 : 0;
    const totalValue = contract.totalValue;
    const averageContractValue = totalValue; // Simplified

    return {
      totalClients: 1,
      activeClients: activeContracts,
      totalContractValue,
      averageContractValue,
      repeatBusinessRate: 85, // Simplified
      clientSatisfaction: 90, // Simplified
      clientRetentionRate: 95 // Simplified
    };
  }

  static assessContractRisk(contract: any): any {
    const riskFactors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    if (contract.status === 'cancelled') {
      riskFactors.push('Contract is cancelled');
      riskLevel = 'high';
    }

    if (contract.endDate && new Date(contract.endDate) < new Date()) {
      riskFactors.push('Contract is expired');
      riskLevel = 'high';
    }

    if (contract.penalties && contract.penalties.length > 3) {
      riskFactors.push('High penalty count');
      riskLevel = 'medium';
    }

    if (contract.totalValue > 1000000) {
      riskFactors.push('High contract value');
      riskLevel = 'medium';
    }

    return {
      level: riskLevel,
      factors: riskFactors,
      recommendations: riskLevel === 'high' 
        ? ['Immediate risk mitigation required', 'Review contract terms', 'Consider performance improvement']
        : riskLevel === 'medium'
        ? ['Monitor contract performance', 'Review penalty structure']
        : ['Maintain regular monitoring', 'Optimize contract terms']
    };
  }

  static checkComplianceStatus(contract: any): any {
    // Simplified compliance check
    return {
      legalCompliance: contract.status === 'active' && contract.governingLaw !== '',
      documentationComplete: contract.documents && contract.documents.length > 0,
      auditReady: true,
      lastAuditDate: new Date().toISOString(),
      issues: [] // Simplified
    };
  }

  static generateContractRecommendations(contract: any, analytics: any, risk: any): string[] {
    const recommendations: string[] = [];

    if (risk.level === 'high') {
      recommendations.push('Immediate risk mitigation required');
    }

    if (analytics.costVariance > 0) {
      recommendations.push('Review cost management');
    }

    if (analytics.onTimeDeliveryRate < 80) {
      recommendations.push('Improve delivery performance');
    }

    if (!contract.terminationClause) {
      recommendations.push('Add termination clause');
    }

    return recommendations;
  }

  static formatContractValue(amount: number, currency: string): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  static getContractStatusColor(status: string): string {
    switch (status) {
      case 'active': return '#10B981'; // Green
      case 'completed': return '#10B981'; // Green
      case 'delayed': return '#F59E0B'; // Amber
      case 'cancelled': return '#EF4444'; // Red
      default: return '#9CA3AF'; // Blue
    }
  }

  static validateContractWorkflow(contract: any, workflow: any): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    if (workflow.requiresClientApproval && !contract.clientId) {
      errors.push('Client approval required');
      fieldErrors.clientId = ['Client ID is required'];
    }

    if (workflow.requiresDocumentation && (!contract.documents || contract.documents.length === 0)) {
      errors.push('Contract documentation required');
      fieldErrors.documents = ['Contract documentation required'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  static calculateContractMetrics(contracts: any[]): any {
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const completedContracts = contracts.filter(c => c.status === 'completed').length;
    const totalValue = contracts.reduce((sum, c) => sum + (c.totalValue || 0), 0);
    const averageDuration = contracts.reduce((sum, c) => {
      if (c.startDate && c.endDate) {
        return Math.ceil((new Date(c.endDate).getTime() - new Date(c.startDate).getTime()) / (1000 * 60 * 60 * 24));
      }
      return 0;
    }, 0);

    return {
      totalContracts,
      activeContracts,
      completedContracts,
      totalValue,
      averageDuration,
      onTimeDeliveryRate: 85, // Simplified
      costVariance: totalValue - (totalValue * (progress / 100)),
      performanceScore: 90, // Simplified
      riskAssessment: this.assessContractRisk(c)
    };
  }
}
