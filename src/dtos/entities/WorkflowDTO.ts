/**
 * Workflow DTOs
 * Data transfer objects for workflow operations
 * Following hexagonal architecture principles from PROMPTS.md
 * Rule #4: No DTOs in entities, proper type separation
 */

// AutomaticDecompteDTO type definition to avoid legacy imports

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
export interface TriggerPaymentRequestDTO {tring;
  contractorContact?: string;
}

/**
 * Payment trigger response DTO
 */
export interface TriggerPaymentResponseDTO {
  succeport interface CheckMilestoneThresholdsRequestDTO {
  phaseId: string;
  progress: number;
}

/**
 * Milestone threshold check response DTO
 */
export inte */
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
 * Work: number;
  totalMilestones: number;
  pendingPayment: number;
  blockedIssues: string[];
}

/**
 * Workflow state DTO
 */
export interface WorkflowStateDTO ed' | 'completed' | 'error';
  progress: number;
  lastUpdated: string;
  createdAt?: string;
  updatedAt?: string;
}