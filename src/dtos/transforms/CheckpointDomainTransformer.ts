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
      project_id: entity.projectId,
      phase_id: entity.phaseId,
      step_id: entity.stepId,
      milestone_id: entity.milestoneId,
      title: entity.title,
      description: entity.description,
      checkpoint_type: entity.checkpointType as any,
      trigger_progress: entity.triggerProgress,
      financial_weight: entity.financialWeight,
      status: entity.status as any,
      progress: entity.progress,
      required_inspections: entity.requiredInspections,
      required_documents: entity.requiredDocuments,
      required_approvals: entity.requiredApprovals,
      verification_result: entity.verificationResult,
      triggers_payment: entity.triggersPayment,
      payment_amount: entity.paymentAmount,
      triggers_notification: entity.triggersNotification,
      notification_recipients: entity.notificationRecipients,
      target_date: entity.targetDate,
      completion_date: entity.completionDate,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt
    };
  }

  /**
   * Transforme un DTO en entité domaine
   */
  static toEntity(dto: CheckpointDTO): CheckpointEntity {
    return {
      id: dto.id,
      projectId: dto.project_id,
      phaseId: dto.phase_id,
      stepId: dto.step_id,
      milestoneId: dto.milestone_id,
      title: dto.title,
      description: dto.description,
      checkpointType: dto.checkpoint_type,
      triggerProgress: dto.trigger_progress,
      financialWeight: dto.financial_weight,
      status: dto.status,
      progress: dto.progress,
      requiredInspections: dto.required_inspections,
      requiredDocuments: dto.required_documents,
      requiredApprovals: dto.required_approvals,
      verificationResult: dto.verification_result,
      triggersPayment: dto.triggers_payment,
      paymentAmount: dto.payment_amount,
      triggersNotification: dto.triggers_notification,
      notificationRecipients: dto.notification_recipients,
      targetDate: dto.target_date,
      completionDate: dto.completion_date,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at
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
