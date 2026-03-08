// @ts-nocheck
/**
 * WorkflowOrchestrator - Phase 6
 * 
 * Coordonne tous les workflows:
 * Jalon vérifié → Progression → Décompte → Paiement → Budget
 */

import { supabase } from '@/integrations/supabase/client';
import { getCheckpointVerificationEngine } from './CheckpointVerificationEngine';
import { AutomaticDecompteCalculator } from './AutomaticDecompteCalculator';
import type { CheckpointDTO, AutomaticDecompteDTO } from '@/types/checkpoint-dto';

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

  constructor(projectId: string) {
    this.projectId = projectId;
    this.verificationEngine = getCheckpointVerificationEngine(projectId);
    this.decompteCalculator = new AutomaticDecompteCalculator(projectId);
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
  async onProgressUpdated(phaseId: string, newProgress: number): Promise<{
    success: boolean;
    events: WorkflowEvent[];
    error?: string;
  }> {
    const events: WorkflowEvent[] = [];

    try {
      // 1. Emit progress update
      const progressEvent: WorkflowEvent = {
        type: 'PROGRESS_UPDATED',
        payload: { phaseId, progress: newProgress },
      };
      events.push(progressEvent);
      this.emit(progressEvent);

      // 2. Check for milestones at this progress threshold
      const triggeredMilestones = await this.checkMilestoneThresholds(phaseId, newProgress);
      
      for (const milestone of triggeredMilestones) {
        const milestoneEvent: WorkflowEvent = {
          type: 'MILESTONE_VERIFIED',
          payload: { milestoneId: milestone.id, phaseId },
        };
        events.push(milestoneEvent);
        this.emit(milestoneEvent);
      }

      // 3. Check if decompte can be generated
      const canGenerate = await this.decompteCalculator.canGenerateDecompte();
      
      if (canGenerate.allowed) {
        const decompte = await this.decompteCalculator.calculatePhaseDecompte(phaseId);
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
  async triggerPayment(phaseId: string, amount: number): Promise<{
    success: boolean;
    paymentId?: string;
    error?: string;
  }> {
    try {
      // 1. Vérifier que le décompte est valide
      const decompte = await this.decompteCalculator.calculatePhaseDecompte(phaseId);
      
      if (decompte.net_payable <= 0) {
        return { success: false, error: 'Aucun montant payable' };
      }

      // 2. Créer le paiement
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          project_id: this.projectId,
          phase_id: phaseId,
          amount: Math.min(amount, decompte.net_payable),
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'bank_transfer',
          transaction_id: `PAY-${Date.now()}`,
          contractor_name: 'Entrepreneur',
          contractor_contact: '',
          progress_at_payment: decompte.progress_at_decompte,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // 3. Emit payment event
      const paymentEvent: WorkflowEvent = {
        type: 'PAYMENT_CREATED',
        payload: { paymentId: payment.id, amount: payment.amount },
      };
      this.emit(paymentEvent);

      // 4. Update budget
      const budgetInfo = await this.decompteCalculator.recalculateBudget();
      const budgetEvent: WorkflowEvent = {
        type: 'BUDGET_UPDATED',
        payload: { remaining: budgetInfo.remainingBudget },
      };
      this.emit(budgetEvent);

      return { success: true, paymentId: payment.id };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }

  /**
   * Vérifie les jalons atteints pour un seuil de progression
   */
  private async checkMilestoneThresholds(phaseId: string, progress: number): Promise<{
    id: string;
    title: string;
    weight: number;
  }[]> {
    const { data: milestones } = await supabase
      .from('enhanced_project_milestones')
      .select('id, title, weight, status')
      .eq('phase_id', phaseId)
      .neq('status', 'completed');

    // Milestones are triggered at specific progress thresholds based on weight
    const thresholds = [25, 50, 75, 100];
    const currentThreshold = thresholds.find(t => progress >= t && progress < t + 25) || 0;

    return (milestones || [])
      .filter(m => {
        const weight = m.weight || 0.25;
        const milestoneThreshold = weight * 100;
        return progress >= milestoneThreshold;
      })
      .map(m => ({ id: m.id, title: m.title, weight: m.weight || 0.25 }));
  }

  /**
   * Rollback en cas d'échec de vérification
   */
  async rollbackProgress(phaseId: string, previousProgress: number): Promise<void> {
    await supabase
      .from('project_phases')
      .update({ progress: previousProgress })
      .eq('id', phaseId);
  }

  /**
   * Vérifie l'état complet du workflow pour une phase
   */
  async getWorkflowStatus(phaseId: string): Promise<{
    canProceed: boolean;
    blockingIssues: string[];
    nextAction: string;
    metrics: {
      progress: number;
      verifiedMilestones: number;
      totalMilestones: number;
      pendingPayment: number;
    };
  }> {
    const [phase, milestones, canGenerate] = await Promise.all([
      supabase.from('project_phases').select('progress').eq('id', phaseId).single(),
      supabase.from('enhanced_project_milestones')
        .select('id, status')
        .eq('phase_id', phaseId),
      this.decompteCalculator.canGenerateDecompte(),
    ]);

    const progress = phase.data?.progress || 0;
    const total = milestones.data?.length || 0;
    const verified = milestones.data?.filter(m => m.status === 'completed').length || 0;
    
    const blockingIssues: string[] = [];
    let nextAction = 'Continuer les travaux';

    if (!canGenerate.allowed) {
      blockingIssues.push(canGenerate.reason);
    } else {
      nextAction = 'Demander le paiement';
    }

    return {
      canProceed: blockingIssues.length === 0,
      blockingIssues,
      nextAction,
      metrics: {
        progress,
        verifiedMilestones: verified,
        totalMilestones: total,
        pendingPayment: canGenerate.suggestedAmount,
      },
    };
  }
}

// ============= FACTORY =============

const orchestrators = new Map<string, WorkflowOrchestrator>();

export function getWorkflowOrchestrator(projectId: string): WorkflowOrchestrator {
  if (!orchestrators.has(projectId)) {
    orchestrators.set(projectId, new WorkflowOrchestrator(projectId));
  }
  return orchestrators.get(projectId)!;
}
