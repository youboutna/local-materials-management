/**
 * Payment Blocking DTOs - Centralized Data Transfer Objects
 * Following hexagonal architecture principles
 */

export interface PaymentBlockDTO {
  id: string;
  payment_request_id: string;
  block_reason: string;
  block_type: 'financial' | 'document' | 'compliance' | 'technical';
  status: 'active' | 'resolved' | 'cancelled';
  blocked_amount: number;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentControlActionDTO {
  id: string;
  payment_block_id: string;
  action_type: 'review' | 'approve' | 'reject' | 'request_document' | 'escalate';
  description: string;
  assigned_to?: string;
  due_date?: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  completed_at?: string;
}

// Service Request DTOs
export interface CreatePaymentBlockRequestDto {
  payment_request_id: string;
  block_reason: string;
  block_type: 'financial' | 'document' | 'compliance' | 'technical';
  blocked_amount: number;
}

export interface ResolvePaymentBlockRequestDto {
  block_id: string;
  resolution_notes: string;
  resolved_by: string;
}

export interface CreatePaymentControlActionRequestDto {
  payment_block_id: string;
  action_type: 'review' | 'approve' | 'reject' | 'request_document' | 'escalate';
  description: string;
  assigned_to?: string;
  due_date?: string;
  created_by?: string;
}

// Response DTOs
export interface PaymentBlockStatsDto {
  total: number;
  active: number;
  resolved: number;
  cancelled: number;
  totalBlockedAmount: number;
  blocksByType: Record<string, number>;
}

export interface PaymentEligibilityValidationDto {
  canProceed: boolean;
  warningReasons?: PaymentWarningReasonDto[];
  blockingReasons?: PaymentBlockingReasonDto[];
}

export interface PaymentWarningReasonDto {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendedAction?: string;
}

export interface PaymentBlockingReasonDto {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionRequired?: string;
}

export interface PaymentProcessingResultDto {
  success: boolean;
  message: string;
  blockReasons?: string[];
}

// Query DTOs
export interface GetPaymentBlocksRequestDto {
  payment_request_id?: string;
  status?: string;
  block_type?: string;
}

export interface GetPaymentControlActionsRequestDto {
  payment_block_id: string;
  status?: string;
}

export interface GetPaymentBlockStatsRequestDto {
  // No parameters needed for global stats
}
