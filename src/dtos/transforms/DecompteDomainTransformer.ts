/**
 * DecompteDomainTransformer
 * 
 * Transformer pour les décomptes entre entités de domaine et DTOs
 * Gère les transformations bidirectionnelles pour l'architecture hexagonale
 */

import { AutomaticDecompteDTO } from '@/dtos/entities/DecompteDTO';;
import { VerificationItemDTO } from '@/dtos/entities/MilestoneDTO';;

// Entités de domaine (à créer si nécessaire)
interface DecompteEntity {
  id: string;
  projectId: string;
  phaseId?: string;
  decompteNumber: number;
  status: string;
  totalAmount: number;
  retentionAmount: number;
  netAmount: number;
  progressAtDecompte: number;
  calculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface DecompteLineEntity {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  category: string;
  milestoneId?: string;
  checkpointId?: string;
  verificationStatus: string;
}

/**
 * Transformer pour les décomptes
 */
export class DecompteDomainTransformer {
  /**
   * Transforme une entité domaine en DTO
   */
  static toDTO(entity: DecompteEntity): AutomaticDecompteDTO {
    return {
      id: entity.id,
      project_id: entity.projectId,
      phase_id: entity.phaseId,
      decompte_number: entity.decompteNumber,
      decompte_type: 'progress', // Valeur par défaut
      contract_amount: entity.totalAmount,
      previous_cumulative: 0,
      current_period_amount: entity.totalAmount,
      cumulative_amount: entity.totalAmount,
      retention_rate: 10, // 10% par défaut en Mauritanie
      retention_amount: entity.retentionAmount,
      previous_retention_released: 0,
      retention_to_release: entity.retentionAmount,
      net_payable: entity.netAmount,
      verified_milestones: [], // À peupler depuis les jalons
      lines: [], // À peupler depuis les lignes
      progress_at_decompte: entity.progressAtDecompte,
      status: entity.status as any,
      calculated_at: entity.calculatedAt,
      approved_at: undefined,
      approved_by: undefined,
      paid_at: undefined,
      calculation_log: [{
        timestamp: new Date().toISOString(),
        action: 'transform',
        details: { source: 'domain_entity' }
      }]
    };
  }

  /**
   * Transforme un DTO en entité domaine
   */
  static toEntity(dto: AutomaticDecompteDTO): DecompteEntity {
    return {
      id: dto.id,
      projectId: dto.project_id,
      phaseId: dto.phase_id,
      decompteNumber: dto.decompte_number,
      status: dto.status,
      totalAmount: dto.current_period_amount,
      retentionAmount: dto.retention_amount,
      netAmount: dto.net_payable,
      progressAtDecompte: dto.progress_at_decompte,
      calculatedAt: dto.calculated_at,
      createdAt: dto.calculated_at,
      updatedAt: dto.calculated_at
    };
  }

  /**
   * Transforme une ligne d'entité en DTO
   */
  static lineToDTO(entity: DecompteLineEntity): DecompteLineDTO {
    return {
      id: entity.id,
      description: entity.description,
      quantity: entity.quantity,
      unit: entity.unit,
      unit_price: entity.unitPrice,
      total_amount: entity.totalAmount,
      category: entity.category as any,
      milestone_id: entity.milestoneId,
      checkpoint_id: entity.checkpointId,
      verification_status: entity.verificationStatus as any
    };
  }

  /**
   * Transforme une ligne DTO en entité domaine
   */
  static lineToEntity(dto: DecompteLineDTO): DecompteLineEntity {
    return {
      id: dto.id,
      description: dto.description,
      quantity: dto.quantity,
      unit: dto.unit,
      unitPrice: dto.unit_price,
      totalAmount: dto.total_amount,
      category: dto.category,
      milestoneId: dto.milestone_id,
      checkpointId: dto.checkpoint_id,
      verificationStatus: dto.verification_status
    };
  }

  /**
   * Transforme un tableau d'entités en DTOs
   */
  static linesToDTOs(entities: DecompteLineEntity[]): DecompteLineDTO[] {
    return entities.map(entity => this.lineToDTO(entity));
  }

  /**
   * Transforme un tableau de DTOs en entités
   */
  static linesToEntities(dtos: DecompteLineDTO[]): DecompteLineEntity[] {
    return dtos.map(dto => this.lineToEntity(dto));
  }
}
