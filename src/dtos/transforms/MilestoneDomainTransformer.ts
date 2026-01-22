/**
 * MilestoneDomainTransformer
 * 
 * Transformer pour les jalons entre entités de domaine et DTOs
 * Gère les transformations bidirectionnelles pour l'architecture hexagonale
 */

import { MilestoneDTO } from '@/dtos/entities';

// Entités de domaine (à créer si nécessaire)
interface MilestoneEntity {
  id: string;
  title: string;
  description?: string;
  targetDate: string;
  status: string;
  completedDate?: string;
  phaseId: string;
  progress: number;
  weight: number;
  priority: string;
  type: string;
  predecessorIds?: string[];
  successorIds?: string[];
  deliverables?: string[];
  approvalRequirements?: string[];
  requiresInspection?: boolean;
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transformer pour les jalons
 */
export class MilestoneDomainTransformer {
  /**
   * Transforme une entité domaine en DTO
   */
  static toDTO(entity: MilestoneEntity): MilestoneDTO {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      targetDate: entity.targetDate,
      status: entity.status as any,
      completedDate: entity.completedDate,
      phaseId: entity.phaseId,
      progress: entity.progress,
      weight: entity.weight,
      priority: entity.priority as any,
      type: entity.type as any,
      predecessorIds: entity.predecessorIds,
      successorIds: entity.successorIds,
      deliverables: entity.deliverables,
      approvalRequirements: entity.approvalRequirements,
      requiresInspection: entity.requiresInspection,
      tags: entity.tags,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Transforme un DTO en entité domaine
   */
  static toEntity(dto: MilestoneDTO): MilestoneEntity {
    return {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      targetDate: dto.targetDate,
      status: dto.status,
      completedDate: dto.completedDate,
      phaseId: dto.phaseId,
      progress: dto.progress,
      weight: dto.weight,
      priority: dto.priority,
      type: dto.type,
      predecessorIds: dto.predecessorIds,
      successorIds: dto.successorIds,
      deliverables: dto.deliverables,
      approvalRequirements: dto.approvalRequirements,
      requiresInspection: dto.requiresInspection,
      tags: dto.tags,
      notes: dto.notes,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  /**
   * Transforme un tableau d'entités en DTOs
   */
  static toDTOs(entities: MilestoneEntity[]): MilestoneDTO[] {
    return entities.map(entity => this.toDTO(entity));
  }

  /**
   * Transforme un tableau de DTOs en entités
   */
  static toEntities(dtos: MilestoneDTO[]): MilestoneEntity[] {
    return dtos.map(dto => this.toEntity(dto));
  }
}
