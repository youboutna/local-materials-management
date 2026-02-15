/**
 * Centralized DTOs Index
 * Single source of truth for all Data Transfer Objects
 * Promotes reusability and maintains consistency across the application
 */

// Primary export - New centralized DTOs
// Explicitly export BaseEntityDTO from shared first to resolve ambiguity
export type { BaseEntityDTO } from './shared';

// Then export entities (which may import BaseEntityDTO but shouldn't re-export it)
export * from './entities';

// Re-export remaining shared DTOs and utilities
export * from './shared';

// Re-export transforms with explicit naming to avoid conflicts
export * as TransformUtils from './transforms';
export * as ValidationUtils from './utils';

// Export specific DTOs for easier imports (avoiding duplicates)
export type { 
  PaymentBlockDTO,
  PaymentControlActionDTO,
  CreatePaymentBlockRequestDto,
  ResolvePaymentBlockRequestDto,
  CreatePaymentControlActionRequestDto,
  GetPaymentBlockStatsRequestDto,
  PaymentEligibilityValidationDto,
  PaymentProcessingResultDto
} from './entities/PaymentDTO';

export type {
  TenderEstimateDTO,
  TenderEstimateItemDTO,
  CreateTenderEstimateRequestDto,
  CreateTenderEstimateItemRequestDto,
  UpdateTenderEstimateRequestDto,
  UpdateTenderEstimateItemRequestDto,
  GetTenderEstimatesRequestDto,
  GetTenderEstimateItemsRequestDto,
  TenderEstimateStatsDto,
  TenderEstimateValidationDto,
  TenderEstimateComparisonDto
} from './entities/TenderEstimateDTO';

export type {
  NotificationDTO,
  CreateNotificationRequestDTO,
  UpdateNotificationRequestDTO,
  NotificationListDTO,
  NotificationStatsDTO
} from './entities/NotificationDTO';
