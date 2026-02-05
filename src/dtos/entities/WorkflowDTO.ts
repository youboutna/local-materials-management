/**
 * Workflow DTOs
 * Data transfer objects for workflow operations
 * Following hexagonal architecture principles from PROMPTS.md
 * Rule #4: No DTOs in entities, proper type separation
 */

import type { AutomaticDecompteDTO } from '@/types/checkpoint-dto';

// WorkflowEvent type definition to avoid circular dependencies
export type WorkflowEvent = 
  | { type: 'MILESTONE_VERIFIED'; payload: { milestoneId: string; phaseId: string } }
  | { type: 'PROGRESS_UPDATED'; payload: { phaseId: string; progress: number } }
  | { type: 'DECOMPTE_CALCULATED'; payload: { decompte: AutomaticDecompteDTO } }
  | { type: 'PAYMENT_CREATED'; payload: { paymentId: string; amount: number } }
  | { type: 'BUDGET_UPDATED'; payload: { remaining: number } }
  | { type: 'VERIFICATION_FAILED'; payload: { reason: string; issues: string[] } };

/**
 * Progress update request DTO
 */
export interface OnProgressUpdatedRequestDTO {
  phaseId: string;
  newProgress: number;
}

/**
 * Progress update response DTO
 */
export interface OnProgressUpdatedResponseDTO {
  success: boolean;
  events: WorkflowEvent[];
  error?: string;
}

/**
 * Payment trigger request DTO
 */
export interface TriggerPaymentRequestDTO {
  phaseId: string;
  amount: number;
  contractorId?: string;
  contractorName?: string;
  contractorContact?: string;
}

/**
 * Payment trigger response DTO
 */
export interface TriggerPaymentResponseDTO {
  success: boolean;
  paymentId?: string;
  error?: string;
}

/**
 * Milestone threshold check request DTO
 */
export interface CheckMilestoneThresholdsRequestDTO {
  phaseId: string;
  progress: number;
}

/**
 * Milestone threshold check response DTO
 */
export interface CheckMilestoneThresholdsResponseDTO {
  milestones: Array<{
    id: string;
    title: string;
    weight: number;
  }>;
}

/**
 * Workflow status DTO
 */
export interface WorkflowStatusDTO {
  isProcessing: boolean;
  lastEvent: WorkflowEvent | null;
  canProceed: boolean;
  nextAction: string;
  metrics: {
    pendingPayment: number;
  };
}

/**
 * Workflow metrics DTO
 */
export interface WorkflowMetricsDTO {
  progress: number;
  verifiedMilestones: number;
  totalMilestones: number;
  pendingPayment: number;
  blockedIssues: string[];
}

/**
 * Workflow state DTO
 */
export interface WorkflowStateDTO {
  id: string;
  projectId: string;
  currentPhase: string;
  status: 'active' | 'paused' | 'completed' | 'error';
  progress: number;
  lastUpdated: string;
  createdAt?: string;
  updatedAt?: string;
}
