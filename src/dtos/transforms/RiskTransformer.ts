/**
 * RiskTransformer - Transformer pour les entités Risk
 * Respecte l'architecture hexagonale : Entity ↔ DTO
 */

import { Risk, RiskStatus, RiskLevel, RiskCategory } from '@/domain/entities/Risk';
import { RiskDTO, CreateRiskRequest, UpdateRiskRequest } from '@/application/services/RiskService';

export class RiskTransformer {
  /**
   * Transformer une entité Risk en DTO
   */
  static toDTO(entity: Risk): RiskDTO {
    return {
      id: entity.id,
      project_id: entity.project?.id,
      title: entity.title,
      description: entity.description,
      probability: entity.probability,
      impact: entity.impact,
      status: entity.status,
      category: entity.category,
      mitigation_strategy: entity.mitigationStrategy,
      identified_by: entity.identifiedBy?.id,
      identified_date: entity.identifiedDate,
      related_tasks: entity.relatedTasks,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt
    };
  }

  /**
   * Transformer un DTO en entité Risk
   */
  static toEntity(dto: RiskDTO): Risk {
    return new Risk(
      dto.id || crypto.randomUUID(),
      dto.project_id ? { id: dto.project_id, title: '' } : null,
      dto.title,
      dto.description || null,
      dto.probability,
      dto.impact,
      dto.status,
      dto.category,
      dto.mitigation_strategy || null,
      dto.identified_by ? { id: dto.identified_by, fullName: '' } : null,
      dto.identified_date || null,
      dto.related_tasks || [],
      dto.created_at || new Date().toISOString(),
      dto.updated_at || new Date().toISOString()
    );
  }

  /**
   * Transformer CreateRiskRequest en entité Risk
   */
  static fromCreateRequestToEntity(request: CreateRiskRequest): Risk {
    return new Risk(
      crypto.randomUUID(),
      { id: request.project_id, title: '' },
      request.title,
      request.description || null,
      request.probability,
      request.impact,
      'identified', // Status par défaut pour les nouveaux risques
      request.category,
      request.mitigation_strategy || null,
      request.identified_by ? { id: request.identified_by, fullName: '' } : null,
      new Date().toISOString(),
      [],
      new Date().toISOString(),
      new Date().toISOString()
    );
  }

  /**
   * Transformer UpdateRiskRequest en mises à jour partielles pour l'entité
   */
  static fromUpdateRequestToUpdates(request: UpdateRiskRequest): Partial<Risk> {
    const updates: Partial<Risk> = {};

    if (request.title !== undefined) updates.title = request.title;
    if (request.description !== undefined) updates.description = request.description;
    if (request.probability !== undefined) updates.probability = request.probability;
    if (request.impact !== undefined) updates.impact = request.impact;
    if (request.status !== undefined) updates.status = request.status;
    if (request.category !== undefined) updates.category = request.category;
    if (request.mitigation_strategy !== undefined) updates.mitigationStrategy = request.mitigation_strategy;
    if (request.related_tasks !== undefined) updates.relatedTasks = request.related_tasks;

    return updates;
  }

  /**
   * Transformer un tableau d'entités en tableau de DTOs
   */
  static toDTOList(entities: Risk[]): RiskDTO[] {
    return entities.map(entity => this.toDTO(entity));
  }

  /**
   * Transformer un tableau de DTOs en tableau d'entités
   */
  static toEntityList(dtos: RiskDTO[]): Risk[] {
    return dtos.map(dto => this.toEntity(dto));
  }

  /**
   * Calculer le niveau de risque basé sur la probabilité et l'impact
   */
  static calculateRiskLevel(probability: number, impact: number): RiskLevel {
    const score = probability * impact;
    
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.3) return 'medium';
    return 'low';
  }

  /**
   * Valider et nettoyer les données d'un DTO
   */
  static validateAndCleanDTO(dto: Partial<RiskDTO>): RiskDTO {
    const cleaned: RiskDTO = {
      id: dto.id,
      project_id: dto.project_id,
      title: dto.title || '',
      description: dto.description,
      probability: Math.max(0, Math.min(1, dto.probability || 0)),
      impact: Math.max(0, Math.min(1, dto.impact || 0)),
      status: dto.status || 'identified',
      category: dto.category || 'operational',
      mitigation_strategy: dto.mitigation_strategy,
      identified_by: dto.identified_by,
      identified_date: dto.identified_date,
      related_tasks: dto.related_tasks || [],
      created_at: dto.created_at || new Date().toISOString(),
      updated_at: dto.updated_at || new Date().toISOString()
    };

    // Validation des types
    if (!Object.values(RiskStatus).includes(cleaned.status)) {
      cleaned.status = 'identified';
    }

    if (!Object.values(RiskCategory).includes(cleaned.category)) {
      cleaned.category = 'operational';
    }

    return cleaned;
  }
}
