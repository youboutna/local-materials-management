/**
 * Payment Validation DTO - Hexagonal Architecture
 * Data transfer objects for payment validation operations
 */

import { BaseEntityDTO } from '@/dtos/entities/OrganizationDTO';;

// =================== VALIDATION DTOs ===================

export interface PaymentValidationResultDTO {
  isValid: boolean;
  message?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  allowedAmount: number;
  maxAllowedAmount: number;
  varianceAmount: number;
}

export interface PaymentRiskAssessmentDTO {
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendations: string[];
  score: nussessment?: PaymentRiskAssessmentDTO;
  validatedAt: string;
  validatedBy: string;
}

// =================== UTILITY DTOs ===================

export interface PaymentRuleConfigDTO {
  maxInitialPaymentPercentage: number;
  maxInitialPaymentAmount: uired: boolean;
  bankValidationRequired: boolean;
}

export interface PaymentValidationStatisticsDTO {
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
  averageValidationTime: number;
  mostCommonFailureReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  validationsByRiskLevel: Record<string, number>;
  validationsByPaymentMethod: Record<string, number>;
}

// =================== CONFIGURATION DTOs ===================

export interface PaymentValidationCon
    };
  };
}