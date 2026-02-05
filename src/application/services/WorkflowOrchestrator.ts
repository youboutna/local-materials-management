/**
 * WorkflowOrchestrator - Hexagonal Architecture
 * Coordonne tous les workflows:
 * Jalon vérifié → Progression → Décompte → Paiement → Budget
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { IMilestoneRepository } from '@/domain/repositories/IMilestoneRepository';
import { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import { getCheckpointVerificationEngine } from './CheckpointVerificationEngine';
import { AutomaticDecompteCalculator } from './AutomaticDecompteCalculator';
import type { CheckpointDTO, AutomaticDecompteDTO } from '@/types/checkpoint-dto';
import type { CalculatePhaseDecompteRequestDto } from '@/dtos/entities/DecompteDTO';
import { WorkflowTransformer } from '@/dtos/transforms/WorkflowTransformer';
import { MilestoneTransformer } from '@/dtos/transforms/MilestoneTransformer';
import { PaymentTransformer } from '@/dtos/transforms/PaymentTransformer';
import { ProjectWorkflowData } from '@/dtos/workflows/ProjectWorkflowDTOs';
import { Milestone } from '@/domain/entities/Milestone';
import { Phase } from '@/domain/entities/Phase';
import { MilestoneDTO } from '@/dtos/entities/MilestoneDTO';
import { PaymentService } from '@/application/services/PaymentService';
import {
  OnProgressUpdatedRequestDTO,
  OnProgressUpdatedResponseDTO,
  TriggerPaymentRequestDTO,
  TriggerPaymentResponseDTO,
  CheckMilestoneThresholdsRequestDTO,
  CheckMilestoneThresholdsResponseDTO,
  WorkflowStatusDTO
} from '@/dtos/entities/WorkflowDTO';

// Domain entities following Rule #4 - Pure business objects
interface WorkflowState {
  isProcessing: boolean;
  lastEvent: WorkflowEvent | null;
  canProceed: boolean;
  nextAction: string;
  metrics: {
    pendingPayment: number;
  };
}

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  canProceed: boolean;
}

interface MilestoneThresholdResult {
  triggeredMilestones: Milestone[];
  newlyVerified: Milestone[];
  progressPercentage: number;
}

// ============= EVENTS =============

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
  private milestoneRepository: IMilestoneRepository;
  private phaseRepository: IPhaseRepository;
  private paymentService: PaymentService;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.verificationEngine = getCheckpointVerificationEngine(projectId);
    this.decompteCalculator = new AutomaticDecompteCalculator(projectId);
    this.paymentRepository = RepositoryFactory.getPaymentRepository();
    this.projectRepository = RepositoryFactory.getProjectRepository();
    this.milestoneRepository = RepositoryFactory.getMilestoneRepository();
    this.phaseRepository = RepositoryFactory.getPhaseRepository();
    this.paymentService = new PaymentService();
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
  async onProgressUpdated(request: OnProgressUpdatedRequestDTO): Promise<OnProgressUpdatedResponseDTO> {
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

      // 2. Check milestone thresholds
      const milestoneResult = await this.checkMilestoneThresholds(request.phaseId, request.newProgress);
      
      // Emit events for newly verified milestones
      for (const milestone of milestoneResult.newlyVerified) {
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
        const decompteRequest: CalculatePhaseDecompteRequestDto = {
          projectId: this.projectId,
          phaseId: request.phaseId
        };
        const decompte = await this.decompteCalculator.calculatePhaseDecompte(decompteRequest);
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
   * Rule #3: Uses repository pattern for real payment creation
   */
  async triggerPayment(request: TriggerPaymentRequestDTO): Promise<TriggerPaymentResponseDTO> {
    try {
      if (!request.phaseId || request.amount <= 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid phase ID or amount');
      }

      // 1. Vérifier que le décompte est valide
      const decompteRequest: CalculatePhaseDecompteRequestDto = {
        projectId: this.projectId,
        phaseId: request.phaseId
      };
      const decompte = await this.decompteCalculator.calculatePhaseDecompte(decompteRequest);
      
      if (decompte.net_payable <= 0) {
        return { success: false, error: 'Aucun montant payable' };
      }

      // 2. Créer le paiement - real implementation using repository
      const actualAmount = Math.min(request.amount, decompte.net_payable);
      
      // Create payment entity and save to repository
      // TODO: Implement proper payment entity creation when Payment entity is available
      // For now, use repository directly with DTO
      const paymentData = {
        projectId: this.projectId,
        phaseId: request.phaseId,
        amount: actualAmount,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        paymentMethod: 'bank_transfer',
        paymentDate: new Date().toISOString(),
        transactionId: `txn_${Date.now()}`,
        progressAtPayment: request.amount // Use amount as progress percentage for now
      };
      
      const paymentDTO = await this.paymentService.createPayment(paymentData);
      const paymentId = paymentDTO.id;

      // 3. Émettre l'événement de paiement
      const paymentEvent: WorkflowEvent = {
        type: 'PAYMENT_CREATED',
        payload: { paymentId, amount: request.amount },
      };
      this.emit(paymentEvent);

      // 4. Mettre à jour le budget restant
      const remainingBudget = decompte.contract_amount - decompte.cumulative_amount;
      const budgetEvent: WorkflowEvent = {
        type: 'BUDGET_UPDATED',
        payload: { remaining: remainingBudget },
      };
      this.emit(budgetEvent);

      return { success: true, paymentId };

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
   * Rule #3: Uses repository pattern - UI Layer -> DTOs -> Application Layer -> Domain Model -> Infrastructure Layer -> DB
              ↑                                      ↓
              └─────────── DTOs ←──────────────┘
   */
  private async checkMilestoneThresholds(phaseId: string, progress: number): Promise<MilestoneThresholdResult> {
    try {
      // Get all milestones for the project
      const milestoneDTOs = await this.milestoneRepository.findByProjectId(this.projectId);
      const allMilestones = MilestoneTransformer.fromDTOs(milestoneDTOs);
      
      // Filter milestones for this phase
      const phaseMilestones = allMilestones.filter(milestone => 
        milestone.configuration.templateId && this.isMilestoneForPhase(milestone, phaseId)
      );
      
      // Check which milestones should be triggered at this progress level
      const triggeredMilestones: Milestone[] = [];
      const newlyVerified: Milestone[] = [];
      
      for (const milestone of phaseMilestones) {
        const milestoneProgress = this.calculateMilestoneProgress(milestone, progress);
        
        // Check if milestone should be triggered based on progress threshold
        if (this.shouldTriggerMilestone(milestone, milestoneProgress)) {
          triggeredMilestones.push(milestone);
          
          // If milestone is newly triggered and not already completed, mark as verified
          if (!milestone.isCompleted()) {
            const verifiedMilestone = this.markMilestoneAsVerified(milestone);
            newlyVerified.push(verifiedMilestone);
            
            // Update the milestone in the repository
            await this.updateMilestoneInRepository(verifiedMilestone);
          }
        }
      }
      
      return {
        triggeredMilestones,
        newlyVerified,
        progressPercentage: progress
      };
      
    } catch (error) {
      console.error('WorkflowOrchestrator.checkMilestoneThresholds failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to check milestone thresholds');
    }
  }

  /**
   * Check if a milestone belongs to a specific phase
   * Rule #4: Domain logic for phase-milestone relationships
   */
  private isMilestoneForPhase(milestone: Milestone, phaseId: string): boolean {
    // Use phase-milestone relationships from domain entities
    // Phase entities have direct milestone relationships
    return milestone.getTags().includes(phaseId) || 
           milestone.title.toLowerCase().includes(phaseId.toLowerCase());
  }

  /**
   * Calculate milestone progress based on overall phase progress
   */
  private calculateMilestoneProgress(milestone: Milestone, phaseProgress: number): number {
    // Use milestone weight to calculate relative progress
    const milestoneWeight = milestone.getWeight();
    const adjustedProgress = Math.min(phaseProgress / milestoneWeight, 100);
    return Math.round(adjustedProgress);
  }

  /**
   * Determine if a milestone should be triggered at current progress
   */
  private shouldTriggerMilestone(milestone: Milestone, milestoneProgress: number): boolean {
    // Milestone triggers when progress reaches or exceeds its weight threshold
    return milestoneProgress >= 100 && !milestone.isCompleted();
  }

  /**
   * Mark a milestone as verified (business logic)
   */
  private markMilestoneAsVerified(milestone: Milestone): Milestone {
    if (milestone.canBeCompleted()) {
      return milestone.markAsCompleted();
    }
    
    // If not ready for completion, update status to in_progress
    return new Milestone(
      milestone.id,
      milestone.projectId,
      milestone.title,
      milestone.description,
      milestone.targetDate,
      milestone.completionDate,
      'in_progress' as const,
      milestone.priority,
      milestone.getProgress(),
      milestone.dependencies,
      milestone.deliverables,
      milestone.assignedTo,
      milestone.createdBy,
      milestone.createdAt,
      new Date().toISOString(),
      milestone.configuration
    );
  }

  /**
   * Update milestone in repository using proper transformer pattern
   */
  private async updateMilestoneInRepository(milestone: Milestone): Promise<void> {
    try {
      const milestoneDTO = MilestoneTransformer.toDTO(milestone);
      await this.milestoneRepository.update(milestone.id, {
        status: milestone.status as string,
        completed_date: milestone.completionDate || undefined
      });
    } catch (error) {
      console.error('Failed to update milestone in repository:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update milestone');
    }
  }

  /**
   * Nettoie les abonnements
   */
  dispose(): void {
    this.handlers = [];
  }

  /**
   * Rollback en cas d'échec de vérification
   * Rule #3: Uses repository pattern for real phase updates
   */
  async rollbackProgress(phaseId: string, previousProgress: number): Promise<void> {
    try {
      // Use repository to update phase progress - real implementation
      await this.phaseRepository.updateProgress(phaseId, previousProgress);
      
      // Emit rollback event for tracking
      const rollbackEvent: WorkflowEvent = {
        type: 'VERIFICATION_FAILED',
        payload: {
          reason: `Rollback triggered for phase ${phaseId}`,
          issues: [`Progress rolled back from current to ${previousProgress}%`]
        }
      };
      this.emit(rollbackEvent);
      
      console.log(`Phase ${phaseId} rolled back to progress ${previousProgress}%`);
    } catch (error) {
      console.error('WorkflowOrchestrator.rollbackProgress failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to rollback progress');
    }
  }

  /**
   * Get current workflow status
   * Rule #5: Returns UI state with calculated display values
   */
  async getWorkflowStatus(phaseId?: string): Promise<WorkflowStatusDTO> {
    try {
      if (phaseId) {
        // Get detailed status for specific phase - real implementation
        const [canGenerate, phase] = await Promise.all([
          this.decompteCalculator.canGenerateDecompte(),
          this.phaseRepository.findById(phaseId)
        ]);
        
        const blockingIssues: string[] = [];
        let nextAction = 'Continuer les travaux';

        if (!canGenerate.allowed) {
          blockingIssues.push(canGenerate.reason);
          nextAction = 'Résoudre les problèmes bloquants';
        } else {
          nextAction = 'Demander le paiement';
        }

        // Calculate comprehensive metrics - Rule #5: UI calculations
        const progress = phase?.progress || 0;
        const pendingPayment = canGenerate.suggestedAmount || 0;
        
        // Create workflow state following Rule #4
        const workflowState: WorkflowState = {
          isProcessing: this.handlers.length > 0,
          lastEvent: null,
          canProceed: blockingIssues.length === 0,
          nextAction,
          metrics: {
            pendingPayment,
          },
        };
        
        return this.convertWorkflowStateToDTO(workflowState);
      } else {
        // General workflow status for the entire project
        const overallStatus = await this.getProjectWorkflowStatus();
        return overallStatus;
      }
    } catch (error) {
      console.error('WorkflowOrchestrator.getWorkflowStatus failed:', error);
      return this.getErrorWorkflowStatus();
    }
  }

  /**
   * Convert workflow state to DTO - Rule #3: Entity to DTO
   */
  private convertWorkflowStateToDTO(state: WorkflowState): WorkflowStatusDTO {
    return {
      isProcessing: state.isProcessing,
      lastEvent: state.lastEvent,
      canProceed: state.canProceed,
      nextAction: state.nextAction,
      metrics: {
        pendingPayment: state.metrics.pendingPayment,
      },
    };
  }

  /**
   * Get error workflow status - Rule #5: Error handling
   */
  private getErrorWorkflowStatus(): WorkflowStatusDTO {
    return {
      isProcessing: false,
      lastEvent: null,
      canProceed: false,
      nextAction: 'error',
      metrics: {
        pendingPayment: 0,
      },
    };
  }

  /**
   * Get project-wide workflow status
   * Rule #4: Domain logic for project-wide calculations
   */
  private async getProjectWorkflowStatus(): Promise<WorkflowStatusDTO> {
    try {
      // Get all project phases for real project status calculation
      const phases = await this.phaseRepository.getPhasesByProjectId(this.projectId);
      
      // Calculate project-wide metrics
      const totalPhases = phases.length;
      const completedPhases = phases.filter(p => p.status === 'completed').length;
      const overallProgress = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;
      
      // Check if any phase is currently processing
      const isProcessing = phases.some(p => p.status === 'in_progress') || this.handlers.length > 0;
      
      // Determine next action based on project state
      let nextAction = 'continue';
      if (overallProgress === 0) {
        nextAction = 'start';
      } else if (overallProgress < 100) {
        nextAction = 'continue';
      } else {
        nextAction = 'complete';
      }
      
      return {
        isProcessing,
        lastEvent: null,
        canProceed: overallProgress < 100,
        nextAction,
        metrics: {
          pendingPayment: 0, // Calculate from payment repository if needed
        },
      };
    } catch (error) {
      console.error('WorkflowOrchestrator.getProjectWorkflowStatus failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project workflow status');
    }
  }

  /**
   * Validate workflow state before proceeding
   * Rule #4: Domain validation logic with real data
   */
  async validateWorkflowState(phaseId: string): Promise<ValidationResult> {
    try {
      const issues: string[] = [];
      
      // Check if decompte can be generated
      const canGenerate = await this.decompteCalculator.canGenerateDecompte();
      if (!canGenerate.allowed) {
        issues.push(canGenerate.reason);
      }
      
      // Validate phase exists and is accessible
      const phase = await this.phaseRepository.findById(phaseId);
      if (!phase) {
        issues.push(`Phase ${phaseId} not found`);
      }
      
      // Validate phase status allows workflow progression
      if (phase && !['in_progress', 'pending'].includes(phase.status)) {
        issues.push(`Phase ${phaseId} has status ${phase.status} which may not allow workflow progression`);
      }
      
      // Validate milestone completion prerequisites
      const milestoneDTOs = await this.milestoneRepository.findByProjectId(this.projectId);
      const milestones = MilestoneTransformer.fromDTOs(milestoneDTOs);
      const incompleteMilestones = milestones.filter(m => !m.isCompleted() && m.configuration.isCritical);
      if (incompleteMilestones.length > 0) {
        issues.push(`${incompleteMilestones.length} critical milestones are not completed`);
      }
      
      return {
        isValid: issues.length === 0,
        issues,
        canProceed: issues.length === 0
      };
    } catch (error) {
      console.error('WorkflowOrchestrator.validateWorkflowState failed:', error);
      return {
        isValid: false,
        issues: ['Validation failed due to system error'],
        canProceed: false
      };
    }
  }

  /**
   * Get workflow history and events
   * Rule #5: Returns UI-formatted data with real event tracking
   */
  async getWorkflowHistory(phaseId?: string): Promise<{
    events: WorkflowEvent[];
    summary: {
      totalEvents: number;
      completedMilestones: number;
      paymentsProcessed: number;
      lastUpdated: string;
    };
  }> {
    try {
      // Get real data from repositories
      const [milestoneDTOs, paymentDTOs] = await Promise.all([
        this.milestoneRepository.findByProjectId(this.projectId),
        this.paymentRepository.findByProjectId(this.projectId)
      ]);
      
      // Transform DTOs to domain entities
      const milestones = MilestoneTransformer.fromDTOs(milestoneDTOs);
      const payments = paymentDTOs.map(paymentDTO => PaymentTransformer.toDomain(paymentDTO));
      
      // Calculate real metrics
      const completedMilestones = milestones.filter(m => m.isCompleted()).length;
      const paymentsProcessed = payments.filter(p => p.status === 'paid').length;
      
      // Get phase-specific data if requested
      let phaseMilestones = milestones;
      let phasePayments = payments;
      
      if (phaseId) {
        phaseMilestones = milestones.filter(m => this.isMilestoneForPhase(m, phaseId));
        phasePayments = payments.filter(p => p.phaseId === phaseId);
      }
      
      // Create synthetic events from real data
      const events: WorkflowEvent[] = [];
      
      // Add milestone events
      phaseMilestones
        .filter(m => m.isCompleted())
        .forEach(milestone => {
          events.push({
            type: 'MILESTONE_VERIFIED',
            payload: { 
              milestoneId: milestone.id, 
              phaseId: phaseId || 'unknown' 
            }
          });
        });
      
      // Add payment events
      phasePayments.forEach(payment => {
        events.push({
          type: 'PAYMENT_CREATED',
          payload: { 
            paymentId: payment.id, 
            amount: payment.amount 
          }
        });
      });
      
      return {
        events,
        summary: {
          totalEvents: events.length,
          completedMilestones,
          paymentsProcessed,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('WorkflowOrchestrator.getWorkflowHistory failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get workflow history');
    }
  }
}
