/**
 * Tender Domain Transformer - Enhanced with Calculations and Business Logic
 * Integrates tender calculations, validation, and UI-specific features
 * Following hexagonal architecture principles
 */

import { Tender, TenderStatus, SelectionMode, MarketType, EvaluationCriteria } from '@/domain/entities/Tender';
import { BaseEntityDTO, EntityToDTOMapper, ValidationResult } from '@/dtos/shared';

// Enhanced types for UI components
export interface TenderDTO extends BaseEntityDTO {
  projectId: string | null;
  title: string;
  description: string | null;
  tenderNumber: string | null;
  status: TenderStatus;
  selectionMode: SelectionMode | null;
  marketType: MarketType | null;
  financingSource: string | null;
  projectReference: string | null;
  publicationDate: string | null;
  deadlineDate: string | null;
  launchDate: string | null;
  attributionDate: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  evaluationCriteria: EvaluationCriteria[];
  eligibilityRequirements: string[];
  // Additional fields from full entity
  submissionDate?: string | null;
  evaluationStartDate?: string | null;
  evaluationEndDate?: string | null;
  awardedSupplierId?: string | null;
  contractValue?: number | null;
  selectedBidAmount?: number | null;
  competitionLevel?: 'low' | 'medium' | 'high';
}

export interface TenderResponseDto extends TenderDTO {
  // Enhanced fields for UI
  tenderAnalytics?: {
    competitionLevel: 'low' | 'medium' | 'high';
    timeToAward?: number;
    budgetEfficiency?: number;
    evaluationScore?: number;
  };
  marketAnalysis?: {
    supplierCount: number;
    averageBidAmount: number;
    winningBidPercentage: number;
    marketPosition?: string;
  };
  recommendations?: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    assignedTo?: string;
  }>;
  evaluationSummary?: {
    totalCriteria: number;
    weightedScore: number;
    ranking: number;
    strengths: string[];
    weaknesses: string[];
  };
}

export interface CreateTenderRequestDto extends Omit<TenderDTO, 'id' | 'createdAt' | 'updatedAt'> {
  // Additional validation fields
  submissionRequirements?: Array<{
    type: 'document' | 'financial' | 'technical' | 'legal';
    description: string;
    required: boolean;
    deadline?: string;
  }>;
  evaluationCommittee?: Array<{
    memberId: string;
    memberName: string;
    role: 'chair' | 'evaluator' | 'observer';
    expertise: string;
  }>;
  publicationPlan?: {
    channels: string[];
    targetRegions: string[];
    languages: string[];
    publicationDates: Array<{
      channel: string;
      date: string;
    }>;
  };
}

export interface UpdateTenderRequestDto extends Partial<CreateTenderRequestDto> {
  // Update-specific fields
  statusChangeReason?: string;
  extensionInfo?: {
    newDeadlineDate: string;
    extensionReason: string;
    approvedBy: string;
  };
  awardInfo?: {
    supplierId: string;
    contractValue: number;
    awardDate: string;
    justification?: string;
  };
  evaluationUpdate?: {
    criteriaScores: Array<{
      criteriaId: string;
      score: number;
      weight: number;
      evaluatorId: string;
    }>;
    overallScore: number;
    recommendation: string;
  };
}

export class TenderDomainTransformer implements EntityToDTOMapper<Tender, TenderDTO> {
  
  toDTO(entity: Tender): TenderDTO {
    return {
      id: '', // Tender entity doesn't have id
      projectId: entity.projectId,
      title: entity.title,
      description: entity.description,
      tenderNumber: entity.tenderNumber,
      status: entity.status,
      selectionMode: entity.selectionMode,
      marketType: entity.marketType,
      financingSource: entity.financingSource,
      projectReference: entity.projectReference,
      publicationDate: entity.publicationDate?.toISOString() || null,
      deadlineDate: entity.deadlineDate?.toISOString() || null,
      launchDate: entity.launchDate?.toISOString() || null,
      attributionDate: entity.attributionDate?.toISOString() || null,
      budgetMin: entity.budgetMin,
      budgetMax: entity.budgetMax,
      evaluationCriteria: entity.evaluationCriteria,
      eligibilityRequirements: entity.eligibilityRequirements,
      createdAt: new Date().toISOString(), // Tender entity doesn't have createdAt
      updatedAt: new Date().toISOString()  // Tender entity doesn't have updatedAt
    };
  }

  fromDTO(dto: TenderDTO): Tender {
    return new Tender(
      dto.id,
      dto.projectId,
      dto.title,
      dto.description,
      dto.tenderNumber,
      dto.status,
      dto.selectionMode,
      dto.marketType,
      dto.financingSource,
      dto.projectReference,
      dto.publicationDate,
      dto.deadlineDate,
      dto.launchDate,
      dto.attributionDate,
      dto.budgetMin,
      dto.budgetMax,
      dto.evaluationCriteria,
      dto.eligibilityRequirements
    );
  }

  fromEntityToDTO(entity: Tender): TenderResponseDto {
    const baseDTO = this.toDTO(entity);
    
    // Add enhanced UI features
    return {
      ...baseDTO,
      tenderAnalytics: this.calculateTenderAnalytics(entity),
      marketAnalysis: this.analyzeMarketPosition(entity),
      recommendations: this.generateTenderRecommendations(entity),
      evaluationSummary: this.generateEvaluationSummary(entity)
    };
  }

  fromDtosToAdapter(dtos: TenderDTO[]): TenderResponseDto[] {
    return dtos.map(dto => this.fromEntityToDTO(this.fromDTO(dto)));
  }

  toResponseDto(entity: Tender): TenderResponseDto {
    return this.fromEntityToDTO(entity);
  }

  toRequestDto(dto: CreateTenderRequestDto): TenderDTO {
    return {
      ...dto,
      id: '', // Will be generated
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft' as TenderStatus
    };
  }

  toUpdateDto(dto: UpdateTenderRequestDto): Partial<TenderDTO> {
    return {
      ...dto,
      updatedAt: new Date().toISOString()
    };
  }

  validate(dto: TenderDTO): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Required fields validation
    if (!dto.title || dto.title.trim() === '') {
      errors.push('Tender title is required');
      fieldErrors.title = ['Tender title is required'];
    }

    // Status validation
    if (dto.status === 'awarded' && !dto.attributionDate) {
      errors.push('Attribution date is required for awarded tenders');
      fieldErrors.attributionDate = ['Attribution date is required for awarded tenders'];
    }

    if (dto.status === 'published' && !dto.deadlineDate) {
      errors.push('Deadline date is required for published tenders');
      fieldErrors.deadlineDate = ['Deadline date is required for published tenders'];
    }

    // Budget validation
    if (dto.budgetMin && dto.budgetMax && dto.budgetMin > dto.budgetMax) {
      errors.push('Minimum budget cannot be greater than maximum budget');
      fieldErrors.budgetMin = ['Minimum budget cannot be greater than maximum budget'];
      fieldErrors.budgetMax = ['Maximum budget cannot be less than minimum budget'];
    }

    // Date validation
    if (dto.publicationDate && dto.deadlineDate) {
      const publication = new Date(dto.publicationDate);
      const deadline = new Date(dto.deadlineDate);
      if (publication > deadline) {
        errors.push('Publication date cannot be after deadline date');
        fieldErrors.publicationDate = ['Publication date cannot be after deadline date'];
        fieldErrors.deadlineDate = ['Deadline date cannot be before publication date'];
      }
    }

    // Evaluation criteria validation
    if (dto.evaluationCriteria && dto.evaluationCriteria.length > 0) {
      const totalWeight = dto.evaluationCriteria.reduce((sum, criteria) => sum + criteria.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.1) {
        errors.push('Total evaluation criteria weight must equal 100');
        fieldErrors.evaluationCriteria = ['Total evaluation criteria weight must equal 100'];
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  // Enhanced utility methods with calculations
  static calculateTenderAnalytics(tender: Tender): any {
    const competitionLevel = TenderDomainTransformer.calculateCompetitionLevel(tender);
    const timeToAward = TenderDomainTransformer.calculateTimeToAward(tender);
    const budgetEfficiency = TenderDomainTransformer.calculateBudgetEfficiency(tender);

    return {
      competitionLevel,
      timeToAward,
      budgetEfficiency,
      evaluationScore: 0 // Would calculate from evaluation data
    };
  }

  static analyzeMarketPosition(tender: Tender): any {
    // Simplified market analysis - would need market data
    return {
      supplierCount: 0, // Would fetch from submissions
      averageBidAmount: tender.budgetMin || 0,
      winningBidPercentage: 0, // Would calculate from award data
      marketPosition: 'Competitive' // Default position
    };
  }

  static generateTenderRecommendations(tender: Tender): any[] {
    const recommendations: any[] = [];

    // Status-based recommendations
    if (tender.status === 'draft') {
      recommendations.push({
        action: 'Review and publish tender',
        priority: 'high' as const,
        dueDate: tender.publicationDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    if (Tender.status === 'published' && tender.deadlineDate) {
      const today = new Date();
      const deadline = new Date(tender.deadlineDate);
      const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDeadline <= 7) {
        recommendations.push({
          action: 'Monitor submissions and prepare evaluation',
          priority: 'high' as const,
          dueDate: tender.deadlineDate
        });
      }
    }

    if (tender.status === 'under_evaluation') {
      recommendations.push({
        action: 'Complete evaluation process',
        priority: 'medium' as const,
        dueDate: tender.launchDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    return recommendations;
  }

  static generateEvaluationSummary(tender: Tender): any {
    // Simplified evaluation summary - would need actual evaluation data
    return {
      totalCriteria: tender.evaluationCriteria.length,
      weightedScore: 0, // Would calculate from evaluations
      ranking: 0, // Would calculate from competition
      strengths: [],
      weaknesses: []
    };
  }

  static calculateCompetitionLevel(tender: Tender): 'low' | 'medium' | 'high' {
    // Simplified - would analyze market conditions and supplier interest
    if (tender.marketType === 'intellectual_services') return 'low';
    if (Tender.selectionMode === 'restricted') return 'low';
    if (Tender.financingSource === 'international') return 'high';
    return 'medium';
  }

  static calculateTimeToAward(tender: Tender): number | undefined {
    if (!tender.publicationDate || !Tender.attributionDate) {
      return undefined;
    }

    const publication = new Date(Tender.publicationDate);
    const attribution = new Date(Tender.attributionDate);
    return Math.ceil((attribution.getTime() - publication.getTime()) / (1000 * 60 * 60 * 24));
  }

  static calculateBudgetEfficiency(tender: Tender): number {
    if (!tender.budgetMin || !Tender.budgetMax) {
      return 100; // Default efficiency
    }

    // Simplified - would use actual awarded amount
    return 85; // Default efficiency score
  }

  static generateTenderReport(tender: Tender): any {
    const analytics = TenderDomainTransformer.calculateTenderAnalytics(tender);
    const marketAnalysis = TenderDomainTransformer.analyzeMarketPosition(tender);
    const recommendations = TenderDomainTransformer.generateTenderRecommendations(tender);

    return {
      tenderInfo: {
        id: tender.id,
        title: tender.title,
        status: tender.status,
        selectionMode: tender.selectionMode,
        marketType: tender.marketType
      },
      analytics,
      marketAnalysis,
      recommendations,
      generatedAt: new Date().toISOString()
    };
  }

  static formatTenderBudget(min: number | null, max: number | null): string {
    if (!min && !max) return 'N/A';
    if (!max) return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(min || 0);
    if (!min) return `Jusqu'à ${new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(max || 0)}`;
    return `${new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(min || 0)} - ${new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(max || 0)}`;
  }

  static getTenderStatusColor(status: TenderStatus): string {
    switch (status) {
      case 'draft': return '#6B7280'; // Gray
      case 'published': return '#3B82F6'; // Blue
      case 'open': return '#10B981'; // Green
      case 'under_evaluation': return '#F59E0B'; // Amber
      case 'awarded': return '#10B981'; // Green
      case 'cancelled': return '#EF4444'; // Red
      case 'closed': return '#6B7280'; // Gray
      default: return '#9CA3AF'; // Medium Gray
    }
  }

  static validateTenderWorkflow(tender: Tender, workflow: any): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    if (workflow.requiresEvaluationCommittee && tender.evaluationCriteria.length === 0) {
      errors.push('Tender requires evaluation criteria');
      fieldErrors.evaluationCriteria = ['Evaluation criteria required'];
    }

    if (workflow.requiresPublicationPlan && !tender.publicationDate) {
      errors.push('Tender requires publication plan');
      fieldErrors.publicationDate = ['Publication plan required'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  static calculateTenderMetrics(tenders: Tender[]): any {
    const totalTenders = tenders.length;
    const publishedTenders = tenders.filter(t => t.status === 'published').length;
    const awardedTenders = tenders.filter(t => t.status === 'awarded').length;
    const underEvaluationTenders = tenders.filter(t => t.status === 'under_evaluation').length;

    const averageTimeToAward = tenders
      .filter(t => t.status === 'awarded' && t.publicationDate && t.attributionDate)
      .reduce((sum, t) => sum + TenderDomainTransformer.calculateTimeToAward(tender) || 0, 0) / 
      (awardedTenders || 1);

    return {
      totalTenders,
      publishedTenders,
      awardedTenders,
      underEvaluationTenders,
      averageTimeToAward,
      successRate: totalTenders > 0 ? (awardedTenders / totalTenders) * 100 : 0
    };
  }
}
