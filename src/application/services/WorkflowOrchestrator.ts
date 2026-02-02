/**
 * WorkflowOrchestrator - Hexagonal Architecture
 * Coordonne tous les workflows:
 * Jalon vérifié → Progression → Décompte → Paiement → Budget
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { getCheckpointVerificationEngine } from './CheckpointVerificationEngine';
import { AutomaticDecompteCalculator } from './AutomaticDecompteCalculator';
import type { CheckpointDTO, AutomaticDecompteDTO } from '@/types/checkpoint-dto';

// Service DTOs for data exchange
export interface OnProgressUpdatedRequestDto {
  phaseId: string;
  newProgress: number;
}

export interface OnProgressUpdatedResponseDto {
  success: boolean;
  events: WorkflowEvent[];
  error?: string;
}

export interface TriggerPaymentRequestDto {
  phaseId: string;
  amount: number;
}

export interface TriggerPaymentResponseDto {
  success: boolean;
  paymentId?: string;
  error?: string;
}

export interface MilestoneData {
  id: string;
  phase_id: string;
  trigger_progress: number;
  status: string;
}

export interface CheckMilestoneThresholdsRequestDto {
  phaseId: string;
  progress: number;
}

export interface CheckMilestoneThresholdsResponseDto {
  milestones: MilestoneData[];
}

export interface WorkflowStatusDto {
  isProcessing: boolean;
  lastEvent: WorkflowEvent | null;
  canProceed: boolean;
  nextAction: string;
  metrics: {
    pendingPayment: number;
  };
}

export type WorkflowEvent = 
  | { type: 'MILESTONE_VERIFIED'; payload: { milestoneId: string; phaseId: string } }
  | { type: 'PROGRESS_UPDATED'; payload: { phaseId: string; progress: number } }
  | { type: 'DECOMPTE_CALCULATED'; payload: { decompte: AutomaticDecompteDTO } }
  | { type: 'PAYMENT_CREATED'; payload: { paymentId: string; amount: number } }
  | { type: 'BUDGET_UPDATED'; payload: { remaining: number } }
  | { type: 'VERIFICATION_FAILED'; payload: { reason: string; issues: string[] } };

export type WorkflowEventHandler = (event: WorkflowEvent) => void;

// ============= ORCHESTRATOR =============

export class WorkflowOrchestrator {
  private projectId: string;
  private handlers: WorkflowEventHandler[] = [];
  private verificationEngine: ReturnType<typeof getCheckpointVerificationEngine>;
  private decompteCalculator: AutomaticDecompteCalculator;
  private paymentRepository: IPaymentRepository;
  private projectRepository: IProjectRepository;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.verificationEngine = getCheckpointVerificationEngine(projectId);
    this.decompteCalculator = new AutomaticDecompteCalculator(projectId);
    this.paymentRepository = RepositoryFactory.getPaymentRepository();
    this.projectRepository = RepositoryFactory.getProjectRepository();
  }

  /**
   * Subscribe to workflow events
   */
  subscribe(handler: WorkflowEventHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  private emit(event: WorkflowEvent) {
    this.handlers.forEach(h => h(event));
  }

  /**
   * Workflow principal: Progression mise à jour → Vérification → Décompte → Paiement
   */
  async onProgressUpdated(request: OnProgressUpdatedRequestDto): Promise<OnProgressUpdatedResponseDto> {
    const events: WorkflowEvent[] = [];

    try {
      if (!request.phaseId || request.newProgress < 0 || request.newProgress > 100) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid phase ID or progress value');
      }

      // 1. Emit progress update
      const progressEvent: WorkflowEvent = {
        type: 'PROGRESS_UPDATED',
        payload: { phaseId: request.phaseId, progress: request.newProgress },
      };
      events.push(progressEvent);
      this.emit(progressEvent);

      // 2. Check for milestones at this progress threshold
      const triggeredMilestones = await this.checkMilestoneThresholds({
        phaseId: request.phaseId,
        progress: request.newProgress
      });
      
      for (const milestone of triggeredMilestones) {
        const milestoneEvent: WorkflowEvent = {
          type: 'MILESTONE_VERIFIED',
          payload: { milestoneId: milestone.id, phaseId: request.phaseId },
        };
        events.push(milestoneEvent);
        this.emit(milestoneEvent);
      }

      // 3. Check if decompte can be generated
      const canGenerate = await this.decompteCalculator.canGenerateDecompte();
      
      if (canGenerate.allowed) {
        const decompte = await this.decompteCalculator.calculatePhaseDecompte({
          projectId: '', // Will be determined by the calculator
          phaseId: request.phaseId
        });
        const decompteEvent: WorkflowEvent = {
          type: 'DECOMPTE_CALCULATED',
          payload: { decompte },
        };
        events.push(decompteEvent);
        this.emit(decompteEvent);
      }

      return { success: true, events };

    } catch (error) {
      const failEvent: WorkflowEvent = {
        type: 'VERIFICATION_FAILED',
        payload: { 
          reason: error instanceof Error ? error.message : 'Unknown error',
          issues: [],
        },
      };
      events.push(failEvent);
      this.emit(failEvent);
      
      return { 
        success: false, 
        events, 
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Déclenche le paiement après vérification
   */
  async triggerPayment(request: TriggerPaymentRequestDto): Promise<TriggerPaymentResponseDto> {
    try {
      if (!request.phaseId || request.amount <= 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid phase ID or amount');
      }

      // 1. Vérifier que le décompte est valide
      const decompte = await this.decompteCalculator.calculatePhaseDecompte({
        projectId: '', // Will be determined by the calculator
        phaseId: request.phaseId
      });
      
      if (decompte.net_payable <= 0) {
        return { success: false, error: 'Aucun montant payable' };
      }

      // 2. Créer le paiement
      // For now, return mock data as payment repository methods are not available
      // TODO: Implement proper payment creation when repository supports it
      console.warn('WorkflowOrchestrator.triggerPayment: Payment repository methods not available');
      
      const mockPaymentId = `payment_${Date.now()}`;
      const actualAmount = Math.min(request.amount, decompte.net_payable);

      // 3. Émettre l'événement de paiement
      const paymentEvent: WorkflowEvent = {
        type: 'PAYMENT_CREATED',
        payload: { paymentId: mockPaymentId, amount: actualAmount },
      };
      this.emit(paymentEvent);

      // 4. Mettre à jour le budget restant
      const remainingBudget = decompte.contract_amount - decompte.cumulative_amount;
      const budgetEvent: WorkflowEvent = {
        type: 'BUDGET_UPDATED',
        payload: { remaining: remainingBudget },
      };
      this.emit(budgetEvent);

      return { success: true, paymentId: mockPaymentId };

    } catch (error) {
      const errorMessage = error instanceof AppError ? error.message : 'Unknown error';
      return { 
        success: false, 
        error: errorMessage,
      };
    }
  }

  /**
   * Vérifie les jalons déclenchés par un seuil de progression
   */
  private async checkMilestoneThresholds(request: CheckMilestoneThresholdsRequestDto): Promise<MilestoneData[]> {
    try {
      // For now, return mock data as milestone repository methods are not available
      // TODO: Implement proper milestone retrieval when repository supports it
      console.warn('WorkflowOrchestrator.checkMilestoneThresholds: Milestone repository methods not available');
      
      return [];
    } catch (error) {
      console.error('WorkflowOrchestrator.checkMilestoneThresholds failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to check milestone thresholds');
    }
  }

  /**
   * Nettoie les abonnements
   */
  dispose(): void {
    this.handlers = [];
  }

  /**
   * Get current workflow status
   */
  getWorkflowStatus(): WorkflowStatusDto {
    return {
      isProcessing: this.handlers.length > 0,
      lastEvent: null, // Could track last event if needed
      canProceed: true, // Business logic for proceeding
      nextAction: 'continue', // Default action
      metrics: {
        pendingPayment: 0, // Default value
      },
    };
  }
}

// Factory function
export function getWorkflowOrchestrator(projectId: string): WorkflowOrchestrator {
  return new WorkflowOrchestrator(projectId);
}
