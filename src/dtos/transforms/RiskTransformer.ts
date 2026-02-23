/**
 * RiskTransformer - Transformer pour les entités Risk
 * Respecte l'architecture hexagonale : Entity ↔ DTO
 * Cache invalidation - v5 - Final solution
 */

import { Risk } from '@/domain/entities/Risk';
import { RiskStatus as DomainRiskStatus, RiskCategory as DomainRiskCategory, RISK_STATUS_VALUES, RISK_CATEGORY_VALUES } from '@/domain/entities/RiskTypesExport';
import { RiskDTO, CreateRiskDTO, UpdateRiskDTO, RiskStatus, RiskCategory, RiskLevel } from '@/dtos/entities/RiskDTO';

export class RiskTransformer {
  /**
   * Batch: Domain Entities → DTOs
   */
  static manyToDTO(risks: Risk[]): RiskDTO[] {
    return risks.map(risk => this.toDTO(risk));
  }

  /**
   * Transformer une entité Risk en DTO
   */
  static toDTO(entity: Risk): RiskDTO {
    return {
      id: entity.id,
      projectId: entity.project?.id,
      title: entity.title,
      description: entity.description || undefined,
      probability: entity.probability,
      impact: entity.impact,
      status: this.domainToDtoStatus(entity.status),
      category: this.domainToDtoCategory(entity.category),
      mitigationStrategy: entity.mitigationStrategy || undefined,
      owner: entity.identifiedBy?.id,
      identifiedDate: entity.identifiedDate || undefined,
      relatedRisks: entity.relatedTasks,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      // Additional fields with defaults
      riskScore: entity.probability * entity.impact,
      riskLevel: (this.calculateRiskLevel(entity.probability * entity.impact) as RiskLevel) || undefined,
      mitigationPlan: undefined,
      mitigationStatus: undefined,
      mitigationCost: undefined,
      mitigationOwner: undefined,
      assessmentDate: undefined,
      nextReviewDate: undefined,
      reviewDate: undefined,
      costs: undefined,
      timelineImpact: undefined,
      resolutionDate: undefined,
      phaseId: undefined,
      taskId: undefined,
      assignedTo: undefined,
      reviewer: undefined,
      documents: [],
      attachments: [],
      tags: [],
      notes: undefined,
      riskType: undefined,
      severity: (this.calculateRiskLevel(entity.probability * entity.impact) as RiskLevel) || undefined,
      affectedAreas: [],
      mitigationActions: [],
      contingencyPlan: undefined,
      monitoringPlan: undefined,
      reviewFrequency: undefined
    };
  }

  /**
   * Transformer un DTO en entité Risk
   */
  static toEntity(dto: RiskDTO): Risk {
    return new Risk(
      dto.id || crypto.randomUUID(),
      dto.projectId ? { id: dto.projectId, title: '' } : null,
      dto.title,
      dto.description || null,
      dto.probability,
      dto.impact,
      this.dtoToDomainStatus(dto.status),
      this.dtoToDomainCategory(dto.category),
      dto.mitigationStrategy || null,
      dto.owner ? { id: dto.owner, fullName: '' } : null,
      dto.identifiedDate || null,
      dto.relatedRisks || [],
      dto.createdAt || new Date().toISOString(),
      dto.updatedAt || new Date().toISOString()
    );
  }

  /**
   * Transformer CreateRiskDTO en entité Risk
   */
  static fromCreateRequestToEntity(request: CreateRiskDTO): Risk {
    return new Risk(
      crypto.randomUUID(),
      request.projectId ? { id: request.projectId, title: '' } : null,
      request.title,
      request.description || null,
      request.probability,
      request.impact,
      this.dtoToDomainStatus('identified' as RiskStatus), // Default status for new risks
      this.dtoToDomainCategory(request.category),
      request.mitigationStrategy || null,
      request.owner ? { id: request.owner, fullName: '' } : null,
      new Date().toISOString(),
      [],
      new Date().toISOString(),
      new Date().toISOString()
    );
  }

  /**
   * Transformer UpdateRiskDTO en mises à jour partielles pour l'entité
   */
  static fromUpdateRequestToUpdates(request: UpdateRiskDTO): Partial<Risk> {
    const updates: Partial<Risk> = {};

    if (request.title !== undefined) updates.title = request.title;
    if (request.description !== undefined) updates.description = request.description;
    if (request.probability !== undefined) updates.probability = request.probability;
    if (request.impact !== undefined) updates.impact = request.impact;
    if (request.status !== undefined) updates.status = this.dtoToDomainStatus(request.status);
    if (request.category !== undefined) updates.category = this.dtoToDomainCategory(request.category);
    if (request.mitigationStrategy !== undefined) updates.mitigationStrategy = request.mitigationStrategy;
    if (request.relatedRisks !== undefined) updates.relatedTasks = request.relatedRisks;

    return updates;
  }

  /**
   * Batch: DTOs → Domain Entities
   */
  static manyFromDTO(dtos: RiskDTO[]): Risk[] {
    return dtos.map(dto => this.toEntity(dto));
  }

  /**
   * Transformer un tableau de DTOs en tableau d'entités
   */
  static toEntityList(dtos: RiskDTO[]): Risk[] {
    return dtos.map(dto => this.toEntity(dto));
  }

  /**
   * Transformer DTO vers format base de données Supabase (snake_case)
   * Enhanced version with proper type safety
   */
  static toSupabase(dto: RiskDTO): Record<string, unknown> {
    return {
      id: dto.id,
      title: dto.title,
      description: dto.description || null,
      category: dto.category,
      status: dto.status,
      probability: dto.probability,
      impact: dto.impact,
      risk_score: dto.riskScore || (dto.probability * dto.impact),
      risk_level: dto.riskLevel || this.calculateRiskLevel(dto.probability * dto.impact),
      mitigation_strategy: dto.mitigationStrategy || null,
      mitigation_plan: dto.mitigationPlan || null,
      mitigation_status: dto.mitigationStatus || null,
      mitigation_cost: dto.mitigationCost || null,
      mitigation_owner: dto.mitigationOwner || null,
      identified_date: dto.identifiedDate || null,
      assessment_date: dto.assessmentDate || null,
      next_review_date: dto.nextReviewDate || null,
      review_date: dto.reviewDate || null,
      costs: dto.costs || null,
      timeline_impact: dto.timelineImpact || null,
      resolution_date: dto.resolutionDate || null,
      project_id: dto.projectId || null,
      phase_id: dto.phaseId || null,
      task_id: dto.taskId || null,
      related_risks: dto.relatedRisks || [],
      assigned_to: dto.assignedTo || null,
      reviewer: dto.reviewer || null,
      owner: dto.owner || null,
      documents: dto.documents || [],
      attachments: dto.attachments || [],
      tags: dto.tags || [],
      notes: dto.notes || null,
      created_at: dto.createdAt,
      updated_at: dto.updatedAt,
      // Additional UI fields
      risk_type: dto.riskType || null,
      severity: dto.severity || null,
      affected_areas: dto.affectedAreas || [],
      mitigation_actions: dto.mitigationActions || [],
      contingency_plan: dto.contingencyPlan || null,
      monitoring_plan: dto.monitoringPlan || null,
      review_frequency: dto.reviewFrequency || null
    };
  }

  /**
   * Transformer format base de données Supabase vers DTO (snake_case ↔ camelCase)
   * Enhanced version with proper type safety
   */
  static fromSupabase(dbRow: Record<string, unknown>): RiskDTO {
    return {
      id: dbRow.id as string,
      title: dbRow.title as string,
      description: (dbRow.description as string) || undefined,
      category: (dbRow.category as RiskCategory) || RiskCategory.OPERATIONAL,
      status: (dbRow.status as RiskStatus) || RiskStatus.IDENTIFIED,
      probability: (dbRow.probability as number) || 0,
      impact: (dbRow.impact as number) || 0,
      riskScore: (dbRow.risk_score as number) || undefined,
      riskLevel: (dbRow.risk_level as RiskLevel) || undefined,
      mitigationStrategy: (dbRow.mitigation_strategy as string) || undefined,
      mitigationPlan: (dbRow.mitigation_plan as string) || undefined,
      mitigationStatus: (dbRow.mitigation_status as 'not_started' | 'in_progress' | 'completed') || undefined,
      mitigationCost: (dbRow.mitigation_cost as number) || undefined,
      mitigationOwner: (dbRow.mitigation_owner as string) || undefined,
      identifiedDate: (dbRow.identified_date as string) || undefined,
      assessmentDate: (dbRow.assessment_date as string) || undefined,
      nextReviewDate: (dbRow.next_review_date as string) || undefined,
      reviewDate: (dbRow.review_date as string) || undefined,
      costs: (dbRow.costs as number) || undefined,
      timelineImpact: (dbRow.timeline_impact as number) || undefined,
      resolutionDate: (dbRow.resolution_date as string) || undefined,
      projectId: (dbRow.project_id as string) || undefined,
      phaseId: (dbRow.phase_id as string) || undefined,
      taskId: (dbRow.task_id as string) || undefined,
      relatedRisks: (dbRow.related_risks as string[]) || [],
      assignedTo: (dbRow.assigned_to as string) || undefined,
      reviewer: (dbRow.reviewer as string) || undefined,
      owner: (dbRow.owner as string) || undefined,
      documents: (dbRow.documents as string[]) || [],
      attachments: (dbRow.attachments as string[]) || [],
      tags: (dbRow.tags as string[]) || [],
      notes: (dbRow.notes as string) || undefined,
      createdAt: (dbRow.created_at as string) || new Date().toISOString(),
      updatedAt: (dbRow.updated_at as string) || new Date().toISOString(),
      // Additional UI fields
      riskType: (dbRow.risk_type as string) || undefined,
      severity: (dbRow.severity as RiskLevel | undefined),
      affectedAreas: (dbRow.affected_areas as string[]) || [],
      mitigationActions: (dbRow.mitigation_actions as string[]) || [],
      contingencyPlan: (dbRow.contingency_plan as string) || undefined,
      monitoringPlan: (dbRow.monitoring_plan as string) || undefined,
      reviewFrequency: (dbRow.review_frequency as string) || undefined
    };
  }

  /**
   * Convert domain status to DTO status
   */
  private static dtoToDomainStatus(dtoStatus: RiskStatus): DomainRiskStatus {
    switch (dtoStatus) {
      case RiskStatus.IDENTIFIED: return 'identified';
      case RiskStatus.MONITORED: return 'monitored';
      case RiskStatus.MITIGATED: return 'mitigated';
      case RiskStatus.RESOLVED: return 'resolved';
      default: return 'identified';
    }
  }

  /**
   * Convert domain status to DTO status
   */
  private static domainToDtoStatus(domainStatus: DomainRiskStatus): RiskStatus {
    switch (domainStatus as string) {
      case 'identified': return RiskStatus.IDENTIFIED;
      case 'monitored': return RiskStatus.MONITORED;
      case 'mitigated': return RiskStatus.MITIGATED;
      case 'resolved': return RiskStatus.RESOLVED;
      case 'accepted': return RiskStatus.IDENTIFIED;
      default: return RiskStatus.IDENTIFIED;
    }
  }

  /**
   * Convert DTO category to domain category
   */
  private static dtoToDomainCategory(dtoCategory: RiskCategory): DomainRiskCategory {
    switch (dtoCategory) {
      case RiskCategory.TECHNICAL: return 'technical';
      case RiskCategory.FINANCIAL: return 'financial';
      case RiskCategory.OPERATIONAL: return 'operational';
      case RiskCategory.STRATEGIC: return 'strategic';
      case RiskCategory.COMPLIANCE: return 'compliance';
      case RiskCategory.SAFETY: return 'safety';
      default: return 'operational';
    }
  }

  /**
   * Convert domain category to DTO category
   */
  private static domainToDtoCategory(domainCategory: DomainRiskCategory): RiskCategory {
    switch (domainCategory) {
      case 'technical': return RiskCategory.TECHNICAL;
      case 'financial': return RiskCategory.FINANCIAL;
      case 'operational': return RiskCategory.OPERATIONAL;
      case 'strategic': return RiskCategory.STRATEGIC;
      case 'compliance': return RiskCategory.COMPLIANCE;
      case 'safety': return RiskCategory.SAFETY;
      default: return RiskCategory.OPERATIONAL;
    }
  }

  /**
   * Calculate risk level based on risk score
   */
  private static calculateRiskLevel(riskScore: number): RiskLevel {
    const riskScoreValue = riskScore as number;
    if (riskScoreValue >= 0.8) return RiskLevel.CRITICAL;
    if (riskScoreValue >= 0.6) return RiskLevel.HIGH;
    if (riskScoreValue >= 0.4) return RiskLevel.MEDIUM;
    if (riskScoreValue >= 0.2) return RiskLevel.LOW;
    return RiskLevel.LOW;
  }

  /**
   * Validate and clean DTO with enhanced type safety
   */
  static validateAndCleanDTO(dto: Partial<RiskDTO>): RiskDTO {
    const cleaned: RiskDTO = {
      id: dto.id || crypto.randomUUID(),
      title: dto.title || '',
      description: dto.description,
      category: dto.category || RiskCategory.OPERATIONAL,
      status: dto.status || RiskStatus.IDENTIFIED,
      probability: Math.max(0, Math.min(1, dto.probability || 0)),
      impact: Math.max(0, Math.min(1, dto.impact || 0)),
      riskScore: dto.riskScore || (dto.probability || 0) * (dto.impact || 0),
      riskLevel: dto.riskLevel || this.calculateRiskLevel((dto.probability || 0) * (dto.impact || 0)),
      mitigationStrategy: dto.mitigationStrategy,
      mitigationPlan: dto.mitigationPlan,
      mitigationStatus: dto.mitigationStatus,
      mitigationCost: dto.mitigationCost,
      mitigationOwner: dto.mitigationOwner,
      identifiedDate: dto.identifiedDate,
      assessmentDate: dto.assessmentDate,
      nextReviewDate: dto.nextReviewDate,
      reviewDate: dto.reviewDate,
      costs: dto.costs,
      timelineImpact: dto.timelineImpact,
      resolutionDate: dto.resolutionDate,
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      taskId: dto.taskId,
      relatedRisks: dto.relatedRisks || [],
      assignedTo: dto.assignedTo,
      reviewer: dto.reviewer,
      owner: dto.owner,
      documents: dto.documents || [],
      attachments: dto.attachments || [],
      tags: dto.tags || [],
      notes: dto.notes,
      createdAt: dto.createdAt || new Date().toISOString(),
      updatedAt: dto.updatedAt || new Date().toISOString(),
      // Additional UI fields
      riskType: dto.riskType,
      severity: (dto.severity || dto.riskLevel || this.calculateRiskLevel((dto.probability || 0) * (dto.impact || 0))) as RiskLevel | undefined,
      affectedAreas: dto.affectedAreas || [],
      mitigationActions: dto.mitigationActions || [],
      contingencyPlan: dto.contingencyPlan,
      monitoringPlan: dto.monitoringPlan,
      reviewFrequency: dto.reviewFrequency
    };

    // Enhanced validation
    if (!Object.values(RiskStatus).includes(cleaned.status)) {
      cleaned.status = RiskStatus.IDENTIFIED;
    }

    if (!Object.values(RiskCategory).includes(cleaned.category)) {
      cleaned.category = RiskCategory.OPERATIONAL;
    }

    if (cleaned.probability < 0 || cleaned.probability > 1) {
      cleaned.probability = Math.max(0, Math.min(1, cleaned.probability));
    }

    if (cleaned.impact < 0 || cleaned.impact > 1) {
      cleaned.impact = Math.max(0, Math.min(1, cleaned.impact));
    }

    // Auto-calculate risk score and level if not provided
    if (!cleaned.riskScore) {
      cleaned.riskScore = cleaned.probability * cleaned.impact;
    }

    if (!cleaned.riskLevel) {
      cleaned.riskLevel = this.calculateRiskLevel(cleaned.riskScore);
    }

    return cleaned;
  }
}
