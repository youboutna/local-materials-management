/**
 * CheckpointDomainTransformer
 * 
 * Transformer pour les checkpoints entre entités de domaine et DTOs
 * Gère les transformations bidirectionnelles pour l'architecture hexagonale
 */

import { CheckpointDTO, CheckpointVerificationResultDTO } from '@/dtos/entities';

// Entités de domaine (à créer si nécessaire)
interface CheckpointEntity {
  id: string;
  projectId: string;
  phaseId?: string;
  stepId?: string;
  milestoneId: string;
  title: string;
  description?: string;
  checkpointType: string;
  triggerProgress: number;
  financialWeight: number;
  status: string;
  progress: number;
  requiredInspections: string[];
  requiredDocuments: string[];
  requiredApprovals: string[];
  verificationResult?: CheckpointVerificationResultDTO;
  triggersPayment: boolean;
  paymentAmount?: number;
  triggersNotification: boolean;
  notificationRecipients?: string[];
  targetDate?: string;
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transformer pour les checkpoints
 */
export class CheckpointDomainTransformer {
  /**
   * Transforme une entité domaine en DTO
   */
  static toDTO(entity: CheckpointEntity): CheckpointDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      phaseId: entity.phaseId,
      stepId: entity.stepId,
      milestoneId: entity.milestoneId,
      title: entity.title,
      description: entity.description,
      checkpointType: entity.checkpointType as any,
      triggerProgress: entity.triggerProgress,
      financialWeight: entity.financialWeight,
      status: entity.status as any,
      progress: entity.progress,
      requiredInspections: entity.requiredInspections,
      requiredDocuments: entity.requiredDocuments,
      requiredApprovals: entity.requiredApprovals,
      verificationResult: entity.verificationResult,
      triggersPayment: entity.triggersPayment,
      paymentAmount: entity.paymentAmount,
      triggersNotification: entity.triggersNotification,
      notificationRecipients: entity.notificationRecipients,
      targetDate: entity.targetDate,
      completionDate: entity.completionDate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Transforme un DTO en entité domaine
   */
  static toEntity(dto: CheckpointDTO): CheckpointEntity {
    return {
      id: dto.id,
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      stepId: dto.stepId,
      milestoneId: dto.milestoneId,
      title: dto.title,
      description: dto.description,
      checkpointType: dto.checkpointType,
      triggerProgress: dto.triggerProgress,
      financialWeight: dto.financialWeight,
      status: dto.status,
      progress: dto.progress,
      requiredInspections: dto.requiredInspections,
      requiredDocuments: dto.requiredDocuments,
      requiredApprovals: dto.requiredApprovals,
      verificationResult: dto.verificationResult,
      triggersPayment: dto.triggersPayment,
      paymentAmount: dto.paymentAmount,
      triggersNotification: dto.triggersNotification,
      notificationRecipients: dto.notificationRecipients,
      targetDate: dto.targetDate,
      completionDate: dto.completionDate,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  /**
   * Transforme un tableau d'entités en DTOs
   */
  static toDTOs(entities: CheckpointEntity[]): CheckpointDTO[] {
    return entities.map(entity => this.toDTO(entity));
  }

  /**
   * Transforme un tableau de DTOs en entités
   */
  static toEntities(dtos: CheckpointDTO[]): CheckpointEntity[] {
    return dtos.map(dto => this.toEntity(dto));
  }
}
