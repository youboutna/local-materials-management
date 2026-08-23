/**
 * DecompteDomainTransformer
 * 
 * Transformer pour les décomptes entre entités de domaine et DTOs
 * Gère les transformations bidirectionnelles pour l'architecture hexagonale
 */

import { AutomaticDecompteDTO, DecompteLineDTO } from '@/dtos/entities/AutomaticDecompteDTO';
import { VerificationItemDTO } from '@/dtos/entities/VerificationItemDTO';

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
      projectId: entity.projectId,
      phaseId: entity.phaseId,
      decompteNumber: entity.decompteNumber,
      decompteType: 'progress', // Valeur par défaut
      contractAmount: entity.totalAmount,
      previousCumulative: 0,
      currentPeriodAmount: entity.totalAmount,
      cumulativeAmount: entity.totalAmount,
      retentionRate: 10, // 10% par défaut en Mauritanie
      retentionAmount: entity.retentionAmount,
      previousRetentionReleased: 0,
      retentionToRelease: entity.retentionAmount,
      netPayable: entity.netAmount,
      verifiedMilestones: [], // À peupler depuis les jalons
      lines: [], // À peupler depuis les lignes
      progressAtDecompte: entity.progressAtDecompte,
      status: entity.status as any,
      calculatedAt: entity.calculatedAt,
      approvedAt: undefined,
      approvedBy: undefined,
      paidAt: undefined,
      calculationLog: [{
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
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      decompteNumber: dto.decompteNumber,
      status: dto.status,
      totalAmount: dto.currentPeriodAmount,
      retentionAmount: dto.retentionAmount,
      netAmount: dto.netPayable,
      progressAtDecompte: dto.progressAtDecompte,
      calculatedAt: dto.calculatedAt,
      createdAt: dto.calculatedAt,
      updatedAt: dto.calculatedAt
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
      unitPrice: entity.unitPrice,
      totalAmount: entity.totalAmount,
      category: entity.category as any,
      milestoneId: entity.milestoneId,
      checkpointId: entity.checkpointId,
      verificationStatus: entity.verificationStatus as any
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
      unitPrice: dto.unitPrice,
      totalAmount: dto.totalAmount,
      category: dto.category,
      milestoneId: dto.milestoneId,
      checkpointId: dto.checkpointId,
      verificationStatus: dto.verificationStatus
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
