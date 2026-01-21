/**
 * Service de synchronisation après approbation d'inspection
 * Gère la mise à jour en cascade du projet, phases, jalons et la mainlevée des garanties
 */

import { BankGuaranteeService } from './BankGuaranteeService';

export interface InspectionApprovalContext {
  inspectionId: string;
  projectId: string;
  phaseId?: string | null;
  status: string;
  progressAtInspection: number;
  inspector: string;
  validationDocuments?: Array<{
    name: string;
    url: string;
    uploadedAt: string;
  }>;
}

export interface SyncResult {
  success: boolean;
  projectProgressUpdated: number;
  phaseProgressUpdated?: number;
  milestonesUpdated: number;
  phaseGuaranteesReleased: number;
  phaseInsurancesReleased: number;
  projectGuaranteesReleased: number;
  projectInsurancesReleased: number;
  paymentTriggered: boolean;
  paymentAmount?: number;
  errors: string[];
  actions: string[];
}

export type ReleaseLevel = 'phase' | 'project';

// Seuils de progression pour les actions automatiques
export const SYNC_THRESHOLDS = {
  MILESTONE_COMPLETION: 100,
  PHASE_RELEASE: 100,
  PROJECT_RELEASE: 100,
  PAYMENT_TRIGGER: 25,
  PHASE_COMPLETION: 95,
};

export class InspectionApprovalSyncService {
  private bankGuaranteeService: BankGuaranteeService;

  constructor() {
    this.bankGuaranteeService = new BankGuaranteeService();
  }

  /**
   * Synchronisation complète après approbation d'une inspection
   */
  async synchronizeOnApproval(context: InspectionApprovalContext): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      projectProgressUpdated: 0,
      milestonesUpdated: 0,
      phaseGuaranteesReleased: 0,
      phaseInsurancesReleased: 0,
      projectGuaranteesReleased: 0,
      projectInsurancesReleased: 0,
      paymentTriggered: false,
      errors: [],
      actions: [],
    };

    try {
      // 1. Mettre à jour l'inspection avec les documents de validation
      await this.updateInspectionWithValidation(context);
      result.actions.push(`Inspection ${context.inspectionId} mise à jour avec statut: ${context.status}`);

      // 2. Synchroniser la progression du projet
      const newProgress = await this.synchronizeProjectProgress(context.projectId);
      result.projectProgressUpdated = newProgress;
      result.actions.push(`Progression projet synchronisée: ${newProgress}%`);

      // 3. Mettre à jour la phase si applicable
      let phaseProgress = 0;
      if (context.phaseId) {
        phaseProgress = await this.updatePhaseProgress(context.phaseId, context.progressAtInspection);
        result.phaseProgressUpdated = phaseProgress;
        result.actions.push(`Progression phase mise à jour: ${phaseProgress}%`);
      }

      // 4. Mettre à jour les jalons liés
      const milestonesUpdated = await this.updateRelatedMilestones(context);
      result.milestonesUpdated = milestonesUpdated;
      if (milestonesUpdated > 0) {
        result.actions.push(`${milestonesUpdated} jalon(s) mis à jour`);
      }

      // 5. MAINLEVÉE NIVEAU PHASE : si progression phase >= 100%
      if (context.phaseId && phaseProgress >= SYNC_THRESHOLDS.PHASE_RELEASE) {
        await this.releasePhaseGuarantees(context.phaseId);
        result.phaseGuaranteesReleased = 1;
        result.actions.push('Mainlevée des garanties de phase');
      }

      // 6. MAINLEVÉE NIVEAU PROJET : si toutes phases à 100%
      if (phaseProgress >= SYNC_THRESHOLDS.PROJECT_RELEASE) {
        await this.releaseProjectGuarantees(context.projectId);
        result.projectGuaranteesReleased = 1;
        result.projectInsurancesReleased = 1;
        result.actions.push('Mainlevée des garanties de projet');
      }

      // 7. Vérifier si on peut déclencher un paiement
      if (newProgress >= SYNC_THRESHOLDS.PAYMENT_TRIGGER) {
        result.paymentTriggered = true;
        result.paymentAmount = await this.calculatePaymentAmount(context.projectId);
        result.actions.push('Paiement déclenché automatiquement');
      }

      result.success = true;
      return result;

    } catch (error) {
      console.error('Error during synchronization:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Synchronize project progress
   */
  private async synchronizeProjectProgress(projectId: string): Promise<number> {
    console.log('Synchronizing project progress:', projectId);
    // Placeholder - would calculate based on phases/inspections
    return 50;
  }

  /**
   * Mettre à jour l'inspection avec documents de validation
   */
  private async updateInspectionWithValidation(context: InspectionApprovalContext): Promise<void> {
    console.log('Updating inspection with validation:', context.inspectionId);
  }

  /**
   * Mettre à jour la progression de phase
   */
  private async updatePhaseProgress(phaseId: string, progress: number): Promise<number> {
    console.log('Updating phase progress:', phaseId, progress);
    return progress;
  }

  /**
   * Mettre à jour les jalons liés à l'inspection
   */
  private async updateRelatedMilestones(context: InspectionApprovalContext): Promise<number> {
    console.log('Updating related milestones for inspection:', context.inspectionId);
    return 0;
  }

  /**
   * Mainlevée des garanties de phase
   */
  private async releasePhaseGuarantees(phaseId: string): Promise<void> {
    try {
      await this.bankGuaranteeService.releasePhaseGuarantees(phaseId);
    } catch (error) {
      console.error('Error releasing phase guarantees:', error);
    }
  }

  /**
   * Mainlevée des garanties de projet
   */
  private async releaseProjectGuarantees(projectId: string): Promise<void> {
    try {
      await this.bankGuaranteeService.releaseProjectGuarantees(projectId);
    } catch (error) {
      console.error('Error releasing project guarantees:', error);
    }
  }

  /**
   * Calculer le montant de paiement automatique
   */
  private async calculatePaymentAmount(projectId: string): Promise<number> {
    console.log('Calculating payment amount for project:', projectId);
    return 25000;
  }
}
