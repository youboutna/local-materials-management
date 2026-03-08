/**
 * RiskTransformer - Transformer pour les entités Risk
 * Respecte l'architecture hexagonale : Entity ↔ DTO
 * Cache invalidation - v5 - Final solution
 */

import { Risk } from '@/domain/entities/Risk';
import { RiskStatus as DomainRiskStatus, RiskLevel, RiskCategory as DomainRiskCategory, RISK_STATUS_VALUES, RISK_CATEGORY_VALUES } from '@/domain/entities/RiskTypesExport';
import { RiskDTO, CreateRiskDTO, UpdateRiskDTO, RiskStatus, RiskCategory } from '@/dtos/entities/RiskDTO';

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
      owner: (entity as any).identifiedBy?.id,
      identifiedDate: (entity as any).identifiedDate || undefined,
      relatedRisks: entity.relatedTasks,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
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
      (dto as any).identifiedBy ? { id: (dto as any).identifiedBy, fullName: '' } : null,
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
   * Transformer DTO vers format base de données (snake_case)
   */
  static toDatabaseFormat(dto: RiskDTO): any {
    return {
      ...dto,
      // Convert camelCase to snake_case for database
      review_date: dto.reviewDate,
      timeline_impact: dto.timelineImpact,
      // Keep existing fields as is
      owner_id: dto.owner,
      project_id: dto.projectId,
      created_at: dto.createdAt,
      updated_at: dto.updatedAt
    };
  }

  /**
   * Transformer format base de données vers DTO (snake_case ↔ camelCase)
   */
  static fromDatabaseFormat(dbRow: any): RiskDTO {
    return {
      ...dbRow,
      // Convert snake_case to camelCase for DTO
      reviewDate: dbRow.review_date,
      timelineImpact: dbRow.timeline_impact,
      // Keep existing fields as is
      projectId: dbRow.project_id,
      owner: dbRow.owner_id,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Convert DTO status to domain status
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
      case 'accepted': return RiskStatus.ACCEPTED;
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
   * Valider et nettoyer les données d'un DTO
   */
  static validateAndCleanDTO(dto: Partial<RiskDTO>): RiskDTO {
    const cleaned: RiskDTO = {
      id: dto.id || '',
      projectId: dto.projectId,
      title: dto.title || '',
      description: dto.description,
      probability: Math.max(0, Math.min(1, dto.probability || 0)),
      impact: Math.max(0, Math.min(1, dto.impact || 0)),
      status: dto.status || RiskStatus.IDENTIFIED,
      category: dto.category || RiskCategory.OPERATIONAL,
      mitigationStrategy: dto.mitigationStrategy,
      identifiedBy: (dto as any).identifiedBy,
      identifiedDate: dto.identifiedDate,
      relatedRisks: dto.relatedRisks || [],
      createdAt: dto.createdAt || new Date().toISOString(),
      updatedAt: dto.updatedAt || new Date().toISOString()
    };

    // Validation des types
    if (!Object.values(RiskStatus).includes(cleaned.status)) {
      cleaned.status = RiskStatus.IDENTIFIED;
    }

    if (!Object.values(RiskCategory).includes(cleaned.category)) {
      cleaned.category = RiskCategory.OPERATIONAL;
    }

    return cleaned;
  }
}
