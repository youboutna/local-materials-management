/**
 * Payment Blocking Transformer - Hexagonal Architecture
 * Converts between Domain Entities and DTOs
 */

import { PaymentBlock, PaymentControlAction } from '@/domain/repositories/IPaymentBlockingRepository';
import { 
  PaymentBlockDTO, 
  PaymentControlActionDTO,
  PaymentBlockStatsDto,
  PaymentEligibilityValidationDto,
  PaymentWarningReasonDto,
  PaymentBlockingReasonDto
} from '@/dtos/entities/PaymentBlockingDTO';

export class PaymentBlockingTransformer {
  /**
   * Transform Domain Entity to DTO
   */
  static toPaymentBlockDTO(entity: PaymentBlock): PaymentBlockDTO {
    return {
      id: entity.id,
      payment_request_id: entity.payment_request_id,
      block_reason: entity.block_reason,
      block_type: entity.block_type,
      status: entity.status,
      blocked_amount: entity.blocked_amount,
      resolution_notes: entity.resolution_notes,
      resolved_by: entity.resolved_by,
      resolved_at: entity.resolved_at,
      created_at: entity.created_at,
      updated_at: entity.updated_at
    };
  }

  /**
   * Transform DTO to Domain Entity
   */
  static toPaymentBlockEntity(dto: PaymentBlockDTO): PaymentBlock {
    return {
      id: dto.id,
      payment_request_id: dto.payment_request_id,
      block_reason: dto.block_reason,
      block_type: dto.block_type,
      status: dto.status,
      blocked_amount: dto.blocked_amount,
      resolution_notes: dto.resolution_notes,
      resolved_by: dto.resolved_by,
      resolved_at: dto.resolved_at,
      created_at: dto.created_at,
      updated_at: dto.updated_at
    };
  }

  /**
   * Transform Domain Entity to DTO
   */
  static toPaymentControlActionDTO(entity: PaymentControlAction): PaymentControlActionDTO {
    return {
      id: entity.id,
      payment_block_id: entity.payment_block_id,
      action_type: entity.action_type,
      description: entity.description,
      assigned_to: entity.assigned_to,
      due_date: entity.due_date,
      status: entity.status,
      created_by: entity.created_by,
      created_at: entity.created_at,
      completed_at: entity.completed_at
    };
  }

  /**
   * Transform DTO to Domain Entity
   */
  static toPaymentControlActionEntity(dto: PaymentControlActionDTO): PaymentControlAction {
    return {
      id: dto.id,
      payment_block_id: dto.payment_block_id,
      action_type: dto.action_type,
      description: dto.description,
      assigned_to: dto.assigned_to,
      due_date: dto.due_date,
      status: dto.status,
      created_by: dto.created_by,
      created_at: dto.created_at,
      completed_at: dto.completed_at
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
  static toPaymentBlockStatsDTO(stats: {
    totalBlocks: number;
    activeBlocks: number;
    resolvedBlocks: number;
    cancelledBlocks: number;
    totalBlockedAmount: number;
    blocksByType: Record<string, number>;
  }): PaymentBlockStatsDto {
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
