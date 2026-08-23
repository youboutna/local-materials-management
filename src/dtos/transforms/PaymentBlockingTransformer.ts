/**
 * Payment Blocking Transformer - Hexagonal Architecture
 * Converts between Domain Entities and DTOs
 */

import { PaymentBlock, PaymentControlAction } from '@/domain/repositories/IPaymentBlockingRepository';
import { 
  PaymentBlockDTO, 
  PaymentControlActionDTO,
  GetPaymentBlockStatsRequestDto,
  PaymentEligibilityValidationDto,
  PaymentWarningReasonDto,
  PaymentBlockingReasonDto
} from '@/dtos/entities/PaymentDTO';

export class PaymentBlockingTransformer {
  /**
   * Transform Domain Entity to DTO
   */
  static toPaymentBlockDTO(entity: PaymentBlock): PaymentBlockDTO {
    return {
      id: entity.id,
      paymentRequestId: entity.paymentRequestId,
      blockReason: entity.blockReason,
      blockType: entity.blockType,
      status: entity.status,
      blockedAmount: entity.blockedAmount,
      resolutionNotes: entity.resolutionNotes,
      resolvedBy: entity.resolvedBy,
      resolvedAt: entity.resolvedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Transform DTO to Domain Entity
   */
  static toPaymentBlockEntity(dto: PaymentBlockDTO): PaymentBlock {
    return {
      id: dto.id,
      paymentRequestId: dto.paymentRequestId,
      blockReason: dto.blockReason,
      blockType: dto.blockType,
      status: dto.status,
      blockedAmount: dto.blockedAmount,
      resolutionNotes: dto.resolutionNotes,
      resolvedBy: dto.resolvedBy,
      resolvedAt: dto.resolvedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  /**
   * Transform Domain Entity to DTO
   */
  static toPaymentControlActionDTO(entity: PaymentControlAction): PaymentControlActionDTO {
    return {
      id: entity.id,
      paymentBlockId: entity.paymentBlockId,
      actionType: entity.actionType,
      description: entity.description,
      assignedTo: entity.assignedTo,
      dueDate: entity.dueDate,
      status: entity.status,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      completedAt: entity.completedAt
    };
  }

  /**
   * Transform DTO to Domain Entity
   */
  static toPaymentControlActionEntity(dto: PaymentControlActionDTO): PaymentControlAction {
    return {
      id: dto.id,
      paymentBlockId: dto.paymentBlockId,
      actionType: dto.actionType,
      description: dto.description,
      assignedTo: dto.assignedTo,
      dueDate: dto.dueDate,
      status: dto.status,
      createdBy: dto.createdBy,
      createdAt: dto.createdAt,
      completedAt: dto.completedAt
    };
  }

  /**
   * Transform Domain Entities array to DTOs array
   */
  static toPaymentBlockDTOs(entities: PaymentBlock[]): PaymentBlockDTO[] {
    return entities.map(entity => this.toPaymentBlockDTO(entity));
  }

  /**
   * Transform DTOs array to Domain Entities array
   */
  static toPaymentBlockEntities(dtos: PaymentBlockDTO[]): PaymentBlock[] {
    return dtos.map(dto => this.toPaymentBlockEntity(dto));
  }

  /**
   * Transform Domain Entities array to DTOs array
   */
  static toPaymentControlActionDTOs(entities: PaymentControlAction[]): PaymentControlActionDTO[] {
    return entities.map(entity => this.toPaymentControlActionDTO(entity));
  }

  /**
   * Transform DTOs array to Domain Entities array
   */
  static toPaymentControlActionEntities(dtos: PaymentControlActionDTO[]): PaymentControlAction[] {
    return dtos.map(dto => this.toPaymentControlActionEntity(dto));
  }

  /**
   * Transform stats data to DTO
   */
  static toGetPaymentBlockStatsRequestDto(stats: {
    totalBlocks: number;
    activeBlocks: number;
    resolvedBlocks: number;
    cancelledBlocks: number;
    totalBlockedAmount: number;
    blocksByType: Record<string, number>;
  }): GetPaymentBlockStatsRequestDto {
    return {
      total: stats.totalBlocks,
      active: stats.activeBlocks,
      resolved: stats.resolvedBlocks,
      cancelled: stats.cancelledBlocks,
      totalBlockedAmount: stats.totalBlockedAmount,
      blocksByType: stats.blocksByType
    };
  }

  /**
   * Transform eligibility validation to DTO
   */
  static toPaymentEligibilityValidationDTO(validation: {
    canProceed: boolean;
    warningReasons?: PaymentWarningReasonDto[];
    blockingReasons?: PaymentBlockingReasonDto[];
  }): PaymentEligibilityValidationDto {
    return {
      canProceed: validation.canProceed,
      warningReasons: validation.warningReasons,
      blockingReasons: validation.blockingReasons
    };
  }
}
