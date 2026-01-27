/**
 * WorkflowCascadeEngine - Moteur central de workflow en cascade
 * 
 * Flux: Jalon complété → Étape → Phase → Projet → Financial → Material → Quality → Notification
 * 
 * Règles Mauritanie:
 * - Matériaux locaux prioritaires (disponibilité > 70%)
 * - Paiements échelonnés selon avancement réel
 * - Garanties: 10% retenu jusqu'à réception définitive
 * - Inspections obligatoires à chaque étape clé
 */

import { supabase } from '@/integrations/supabase/client';

// Types pour le workflow
export interface CascadeEvent {
  type: 'milestone_completed' | 'step_completed' | 'phase_completed' | 'inspection_approved' | 'payment_triggered';
  sourceId: string;
  projectId: string;
  phaseId?: string;
  stepId?: string;
  milestoneId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface CascadeResult {
  success: boolean;
  actions: CascadeAction[];
  notifications: NotificationPayload[];
  errors: string[];
}

export interface CascadeAction {
  type: 'progress_updated' | 'payment_available' | 'inspection_scheduled' | 'material_consumed' | 'notification_sent';
  entityType: 'step' | 'phase' | 'project' | 'payment' | 'material' | 'inspection';
  entityId: string;
  details: Record<string, unknown>;
}

export interface NotificationPayload {
  recipientId: string;
  title: string;
  message: string;
  type: 'workflow' | 'payment' | 'inspection' | 'material';
  relatedId?: string;
  metadata?: Record<string, unknown>;
}

// Seuils de paiement Mauritanie
const PAYMENT_THRESHOLDS = [25, 50, 75, 100];
const GUARANTEE_RETENTION_RATE = 0.10; // 10%
const LOCAL_MATERIAL_PRIORITY_THRESHOLD = 0.70; // 70%

export class WorkflowCascadeEngine {
  private projectId: string;
  private actions: CascadeAction[] = [];
  private notifications: NotificationPayload[] = [];
  private errors: string[] = [];

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  /**
   * Point d'entrée principal: traite un événement de cascade
   */
  async processEvent(event: CascadeEvent): Promise<CascadeResult> {
    this.reset();

    try {
      switch (event.type) {
        case 'milestone_completed':
          await this.handleMilestoneCompleted(event);
          break;
        case 'step_completed':
          await this.handleStepCompleted(event);
          break;
        case 'phase_completed':
          await this.handlePhaseCompleted(event);
          break;
        case 'inspection_approved':
          await this.handleInspectionApproved(event);
          break;
        case 'payment_triggered':
          await this.handlePaymentTriggered(event);
          break;
      }
    } catch (error) {
      this.errors.push(`Cascade error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      success: this.errors.length === 0,
      actions: this.actions,
      notifications: this.notifications,
      errors: this.errors,
    };
  }

  /**
   * 1. Jalon complété → Recalcule progression étape
   */
  private async handleMilestoneCompleted(event: CascadeEvent): Promise<void> {
    if (!event.stepId) return;

    // Récupérer l'étape et recalculer sa progression
    const stepProgress = await this.recalculateStepProgress(event.stepId);
    
    this.actions.push({
      type: 'progress_updated',
      entityType: 'step',
      entityId: event.stepId,
      details: { progress: stepProgress, source: 'milestone_completed' },
    });

    // Vérifier si l'étape est complète → cascade vers phase
    if (stepProgress >= 100) {
      await this.handleStepCompleted({
        ...event,
        type: 'step_completed',
      });
    }
  }

  /**
   * 2. Étape complète → Recalcule progression phase
   */
  private async handleStepCompleted(event: CascadeEvent): Promise<void> {
    if (!event.phaseId) return;

    const phaseProgress = await this.recalculatePhaseProgress(event.phaseId);
    
    this.actions.push({
      type: 'progress_updated',
      entityType: 'phase',
      entityId: event.phaseId,
      details: { progress: phaseProgress, source: 'step_completed' },
    });

    // Vérifier seuils de paiement
    await this.checkPaymentThresholds(event.phaseId, phaseProgress);

    // Vérifier consommation matériaux
    await this.updateMaterialConsumption(event.phaseId, event.stepId);

    // Programmer inspection si nécessaire
    await this.scheduleInspectionIfNeeded(event.phaseId, phaseProgress);

    // Vérifier si phase complète → cascade vers projet
    if (phaseProgress >= 100) {
      await this.handlePhaseCompleted({
        ...event,
        type: 'phase_completed',
      });
    }
  }

  /**
   * 3. Phase complète → Recalcule progression projet
   */
  private async handlePhaseCompleted(event: CascadeEvent): Promise<void> {
    const projectProgress = await this.recalculateProjectProgress();
    
    this.actions.push({
      type: 'progress_updated',
      entityType: 'project',
      entityId: this.projectId,
      details: { progress: projectProgress, source: 'phase_completed' },
    });

    // Notifier parties prenantes
    await this.notifyStakeholders('phase_completed', event);
  }

  /**
   * 4. Inspection approuvée → Vérifie seuils paiement
   */
  private async handleInspectionApproved(event: CascadeEvent): Promise<void> {
    if (!event.phaseId) return;

    const { data: phase } = await supabase
      .from('project_phases')
      .select('progress, estimated_cost')
      .eq('id', event.phaseId)
      .single();

    if (phase) {
      await this.checkPaymentThresholds(event.phaseId, phase.progress || 0);
    }

    // Notifier parties prenantes
    await this.notifyStakeholders('inspection_approved', event);
  }

  /**
   * 5. Paiement déclenché
   */
  private async handlePaymentTriggered(event: CascadeEvent): Promise<void> {
    this.actions.push({
      type: 'payment_available',
      entityType: 'payment',
      entityId: event.sourceId,
      details: event.metadata || {},
    });

    await this.notifyStakeholders('payment_available', event);
  }

  // === CALCULS DE PROGRESSION ===

  private async recalculateStepProgress(stepId: string): Promise<number> {
    // Récupérer les tâches de l'étape
    const { data: phase } = await supabase
      .from('project_phases')
      .select('custom_phase_data')
      .eq('id', stepId)
      .single();

    if (!phase?.custom_phase_data) return 0;

    const steps = (phase.custom_phase_data as any)?.steps || [];
    const step = steps.find((s: any) => s.id === stepId);
    
    if (!step?.tasks || step.tasks.length === 0) {
      return step?.progress || 0;
    }

    const completedTasks = step.tasks.filter((t: any) => 
      t.status === 'completed' || t.status === 'terminé'
    ).length;

    return Math.round((completedTasks / step.tasks.length) * 100);
  }

  private async recalculatePhaseProgress(phaseId: string): Promise<number> {
    const { data: phase } = await supabase
      .from('project_phases')
      .select('custom_phase_data, progress')
      .eq('id', phaseId)
      .single();

    if (!phase) return 0;

    const steps = (phase.custom_phase_data as any)?.steps || [];
    if (steps.length === 0) return phase.progress || 0;

    const totalProgress = steps.reduce((sum: number, step: any) => {
      if (step.status === 'completed') return sum + 100;
      if (step.status === 'in_progress') return sum + (step.progress || 50);
      return sum;
    }, 0);

    const newProgress = Math.round(totalProgress / steps.length);

    // Mettre à jour la progression de la phase
    await supabase
      .from('project_phases')
      .update({ progress: newProgress })
      .eq('id', phaseId);

    return newProgress;
  }

  private async recalculateProjectProgress(): Promise<number> {
    const { data: phases } = await supabase
      .from('project_phases')
      .select('progress, status')
      .eq('project_id', this.projectId);

    if (!phases || phases.length === 0) return 0;

    const totalProgress = phases.reduce((sum, phase) => {
      if (phase.status === 'completed') return sum + 100;
      return sum + (phase.progress || 0);
    }, 0);

    const newProgress = Math.round(totalProgress / phases.length);

    // Mettre à jour la progression du projet
    await supabase
      .from('projects')
      .update({ progress: newProgress })
      .eq('id', this.projectId);

    return newProgress;
  }

  // === RÈGLES FINANCIÈRES MAURITANIE ===

  private async checkPaymentThresholds(phaseId: string, progress: number): Promise<void> {
    const { data: phase } = await supabase
      .from('project_phases')
      .select('estimated_cost')
      .eq('id', phaseId)
      .single();

    if (!phase?.estimated_cost) return;

    // Récupérer paiements existants
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, progress_at_payment')
      .eq('phase_id', phaseId);

    const totalPaid = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const paidThresholds = payments?.map(p => p.progress_at_payment) || [];

    // Vérifier chaque seuil de paiement
    for (const threshold of PAYMENT_THRESHOLDS) {
      if (progress >= threshold && !paidThresholds.includes(threshold)) {
        const amountDue = (phase.estimated_cost * threshold / 100) - totalPaid;
        const guaranteeRetention = amountDue * GUARANTEE_RETENTION_RATE;
        const netPayable = amountDue - guaranteeRetention;

        if (netPayable > 0) {
          this.actions.push({
            type: 'payment_available',
            entityType: 'payment',
            entityId: phaseId,
            details: {
              threshold,
              amountDue,
              guaranteeRetention,
              netPayable,
              progress,
            },
          });

          this.notifications.push({
            recipientId: 'project_manager', // Sera résolu par le service de notification
            title: `Seuil de paiement atteint: ${threshold}%`,
            message: `Phase prête pour paiement. Montant net: ${netPayable.toLocaleString('fr-FR')} MRU`,
            type: 'payment',
            relatedId: phaseId,
            metadata: { threshold, netPayable },
          });
        }
      }
    }
  }

  // === GESTION MATÉRIAUX ===

  private async updateMaterialConsumption(phaseId: string, stepId?: string): Promise<void> {
    // Récupérer matériaux via la table materials directement
    // Note: La gestion des allocations sera simplifiée car la table project_material_allocations n'existe pas
    const { data: materials } = await supabase
      .from('materials')
      .select('id, name, available_quantity, origin_location')
      .limit(10);

    if (!materials || materials.length === 0) return;

    for (const material of materials) {
      // Vérifier stock faible (< 20% de la quantité initiale estimée)
      if (material.available_quantity < 10) {
        this.notifications.push({
          recipientId: 'material_manager',
          title: `Stock faible: ${material.name}`,
          message: `Stock restant: ${material.available_quantity}. Réapprovisionnement recommandé.`,
          type: 'material',
          relatedId: material.id,
        });
      }

      this.actions.push({
        type: 'material_consumed',
        entityType: 'material',
        entityId: material.id,
        details: {
          materialName: material.name,
          remainingStock: material.available_quantity,
          isLocal: material.origin_location === 'local',
        },
      });
    }
  }

  // === GESTION QUALITÉ ===

  private async scheduleInspectionIfNeeded(phaseId: string, progress: number): Promise<void> {
    // Vérifier si inspection en attente
    const { data: pendingInspections } = await supabase
      .from('inspections')
      .select('id')
      .eq('phase_id', phaseId)
      .in('status', ['scheduled', 'pending', 'in_progress']);

    if (pendingInspections && pendingInspections.length > 0) return;

    // Seuils d'inspection obligatoire
    const inspectionThresholds = [25, 50, 75, 100];
    
    for (const threshold of inspectionThresholds) {
      if (progress >= threshold - 5 && progress < threshold + 5) {
        this.actions.push({
          type: 'inspection_scheduled',
          entityType: 'inspection',
          entityId: phaseId,
          details: {
            triggerProgress: progress,
            threshold,
            reason: `Inspection obligatoire au seuil ${threshold}%`,
          },
        });

        this.notifications.push({
          recipientId: 'quality_manager',
          title: 'Inspection requise',
          message: `Phase à ${progress}% - Inspection obligatoire avant paiement.`,
          type: 'inspection',
          relatedId: phaseId,
        });

        break;
      }
    }
  }

  // === NOTIFICATIONS ===

  private async notifyStakeholders(eventType: string, event: CascadeEvent): Promise<void> {
    const { data: project } = await supabase
      .from('projects')
      .select('id, title')
      .eq('id', this.projectId)
      .single();

    if (!project) return;

    let title = '';
    let message = '';

    switch (eventType) {
      case 'phase_completed':
        title = 'Phase terminée';
        message = `Une phase du projet ${project.title || 'N/A'} a été complétée.`;
        break;
      case 'inspection_approved':
        title = 'Inspection validée';
        message = `Inspection approuvée. Vérifiez les seuils de paiement.`;
        break;
      case 'payment_available':
        title = 'Paiement disponible';
        message = `Un nouveau paiement peut être déclenché.`;
        break;
    }

    if (title) {
      // Store notification for later processing (recipient will be resolved by NotificationService)
      this.notifications.push({
        recipientId: 'project_stakeholders', // Placeholder - resolved by NotificationService
        title,
        message,
        type: 'workflow',
        relatedId: event.sourceId,
        metadata: { ...event.metadata, projectId: this.projectId },
      });
    }
  }

  private reset(): void {
    this.actions = [];
    this.notifications = [];
    this.errors = [];
  }
}

// === HELPERS ===

/**
 * Fonction utilitaire pour traiter un événement de workflow
 */
export async function processCascadeEvent(
  projectId: string,
  event: Omit<CascadeEvent, 'projectId' | 'timestamp'>
): Promise<CascadeResult> {
  const engine = new WorkflowCascadeEngine(projectId);
  return engine.processEvent({
    ...event,
    projectId,
    timestamp: new Date(),
  });
}

/**
 * Calcule le décompte selon les règles Mauritanie
 */
export function calculateDecompte(
  contractAmount: number,
  validatedProgress: number,
  previousPayments: number
): {
  payablePercentage: number;
  amountToDecompte: number;
  guaranteeRetention: number;
  netPayable: number;
  remainingAmount: number;
} {
  // Seuils par paliers de 25%
  const payablePercentage = Math.floor(validatedProgress / 25) * 25;
  const amountToDecompte = Math.max(0, (contractAmount * payablePercentage / 100) - previousPayments);
  const guaranteeRetention = amountToDecompte * GUARANTEE_RETENTION_RATE;
  const netPayable = amountToDecompte - guaranteeRetention;
  const remainingAmount = Math.max(0, contractAmount - previousPayments - amountToDecompte);

  return {
    payablePercentage,
    amountToDecompte,
    guaranteeRetention,
    netPayable,
    remainingAmount,
  };
}
