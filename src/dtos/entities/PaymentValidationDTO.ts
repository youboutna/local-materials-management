/**
 * Payment Validation DTO - Hexagonal Architecture
 * Data transfer objects for payment validation operations
 */

import { BaseEntityDTO } from './BaseEntityDTO';

// =================== VALIDATION DTOs ===================

export interface PaymentValidationRequestDTO {
  projectId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  contractorId?: string;
  contractorName?: string;
  contractorContact: string;
  
  // Method-specific fields
  bankName?: string;
  accountNumber?: string;
  checkNumber?: string;
  mobileNumber?: string;
  mobileOperator?: string;
  receiverName?: string;
}

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
  score: number;
}

// =================== MAIN VALIDATION DTO ===================

export interface PaymentValidationDTO extends BaseEntityDTO {
  projectId: string;
  request: PaymentValidationRequestDTO;
  result: PaymentValidationResultDTO;
  riskAssessment?: PaymentRiskAssessmentDTO;
  validatedAt: string;
  validatedBy: string;
}

// =================== UTILITY DTOs ===================

export interface PaymentRuleConfigDTO {
  maxInitialPaymentPercentage: number;
  maxInitialPaymentAmount: number;
  requireInspectionForProgressThreshold: number;
  allowedPaymentMethods: string[];
  paymentDateValidationDays: number;
  contractorValidationRequired: boolean;
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

export interface PaymentValidationConfigDTO {
  rules: PaymentRuleConfigDTO;
  notifications: {
    successEmail?: string;
    failureEmail?: string;
    escalationEmail?: string;
  };
  integration: {
    accountingSystem?: string;
    erpSystem?: string;
    bankApi?: {
      enabled: boolean;
      endpoint: string;
      apiKey: string;
    };
  };
}
