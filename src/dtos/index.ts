/**
 * Centralized DTOs Index
 * Single source of truth for all Data Transfer Objects
 * Promotes reusability and maintains consistency across the application
 */

// Primary export - New centralized DTOs
export * from './entities';

// Re-export shared DTOs and utilities
export * from './shared';

// Re-export transforms with explicit naming to avoid conflicts
export * as TransformUtils from './transforms';
export * as ValidationUtils from './utils';

// Export specific DTOs for easier imports (avoiding duplicates)
export { 
  PaymentBlockDTO,
  PaymentControlActionDTO,
  CreatePaymentBlockRequestDto,
  ResolvePaymentBlockRequestDto,
  CreatePaymentControlActionRequestDto,
  PaymentBlockStatsDto,
  PaymentEligibilityValidationDto,
  PaymentProcessingResultDto
} from './entities/PaymentBlockingDTO';

export {
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
