/**
 * Service de synchronisation après approbation d'inspection
 * Gère la mise à jour en cascade du projet, phases, jalons et la mainlevée des garanties
 * Migré vers l'architecture hexagonale
 */
import { InspectionService } from '@/application/services/InspectionService';
import { ProjectService } from '@/application/services/ProjectService';
import { PhaseService } from '@/application/services/PhaseService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

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
  // Mainlevée niveau phase
  phaseGuaranteesReleased: number;
  phaseInsurancesReleased: number;
  // Mainlevée niveau projet (toutes phases à 100%)
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
  MILESTONE_COMPLETION: 100,       // % pour marquer un jalon terminé
  PHASE_RELEASE: 100,              // % phase pour mainlevée niveau phase
  PROJECT_RELEASE: 100,            // % projet pour mainlevée niveau projet
  PAYMENT_TRIGGER: 25,             // % minimum pour déclencher paiement
  PHASE_COMPLETION: 95,            // % pour marquer phase terminée
};

export class InspectionApprovalSyncService {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService(RepositoryFactory.getProjectRepository());
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
      const updatedProject = await this.projectService.updateProject(context.projectId, {
        progress: context.progressAtInspection
      });
      result.projectProgressUpdated = updatedProject.progress;
      result.actions.push(`Progression projet synchronisée: ${updatedProject.progress}%`);

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
        const phaseGuarantees = await this.processGuaranteeRelease(context.projectId, 'phase', context.phaseId);
        result.phaseGuaranteesReleased = phaseGuarantees;
        if (phaseGuarantees > 0) {
          result.actions.push(`[PHASE] ${phaseGuarantees} garantie(s) bancaire(s) - mainlevée phase initiée`);
        }

        const phaseInsurances = await this.processInsuranceRelease(context.projectId, 'phase', context.phaseId);
        result.phaseInsurancesReleased = phaseInsurances;
        if (phaseInsurances > 0) {
          result.actions.push(`[PHASE] ${phaseInsurances} certificat(s) d'assurance - libération phase initiée`);
        }
      }

      // 6. MAINLEVÉE NIVEAU PROJET : si TOUTES les phases sont à 100%
      const allPhasesComplete = await this.checkAllPhasesComplete(context.projectId);
      if (allPhasesComplete) {
        const projectGuarantees = await this.processGuaranteeRelease(context.projectId, 'project');
        result.projectGuaranteesReleased = projectGuarantees;
        if (projectGuarantees > 0) {
          result.actions.push(`[PROJET] ${projectGuarantees} garantie(s) bancaire(s) - mainlevée projet initiée`);
        }

        const projectInsurances = await this.processInsuranceRelease(context.projectId, 'project');
        result.projectInsurancesReleased = projectInsurances;
        if (projectInsurances > 0) {
          result.actions.push(`[PROJET] ${projectInsurances} certificat(s) d'assurance - libération projet initiée`);
        }
      }

      // 7. Déclencher paiement automatique si seuil atteint et inspection approuvée
      if (context.status === 'approved' && context.progressAtInspection >= SYNC_THRESHOLDS.PAYMENT_TRIGGER) {
        const paymentResult = await this.triggerAutomaticPayment(context);
        result.paymentTriggered = paymentResult.triggered;
        result.paymentAmount = paymentResult.amount;
        if (paymentResult.triggered) {
          result.actions.push(`Demande de paiement automatique: ${paymentResult.amount?.toLocaleString()} MRU`);
        }
      }

      // 8. Créer notification de synthèse
      await this.createSyncNotification(context, result);

      result.success = true;
    } catch (error: any) {
      console.error('Error in synchronization:', error);
      result.errors.push(error.message || 'Erreur de synchronisation');
    }

    return result;
  }

  /**
   * Vérifier si TOUTES les phases du projet sont complètes (100%)
   */
  private async checkAllPhasesComplete(projectId: string): Promise<boolean> {
    const phaseService = new PhaseService(RepositoryFactory.getPhaseRepository());
    const phases = await phaseService.getPhasesByProject(projectId);
    
    return phases.every(phase => (phase.progress || 0) >= SYNC_THRESHOLDS.PROJECT_RELEASE || phase.status === 'completed');
  }
  }

  /**
   * Mettre à jour l'inspection avec les documents de validation
   */
  private async updateInspectionWithValidation(context: InspectionApprovalContext): Promise<void> {
    const updateData: any = {
      status: context.status,
      progress_at_inspection: context.progressAtInspection,
      updated_at: new Date().toISOString(),
    };

    if (context.validationDocuments && context.validationDocuments.length > 0) {
      // Récupérer les documents existants
      const { data: existing } = await supabase
        .from('inspections')
        .select('documents')
        .eq('id', context.inspectionId)
        .single();

      const existingDocs = existing?.documents && typeof existing.documents === 'object' ? existing.documents : {};
      updateData.documents = {
        ...existingDocs,
        validation_documents: context.validationDocuments,
        approved_at: new Date().toISOString(),
        approved_by: context.inspector,
      };
    }

    const { error } = await supabase
      .from('inspections')
      .update(updateData)
      .eq('id', context.inspectionId);

    if (error) throw error;
  }

  /**
   * Mettre à jour la progression de la phase
   */
  private async updatePhaseProgress(phaseId: string, progress: number): Promise<number> {
    const { error } = await supabase
      .from('project_phases')
      .update({
        progress,
        status: progress >= SYNC_THRESHOLDS.PHASE_COMPLETION ? 'completed' : 'in_progress',
        actual_end_date: progress >= SYNC_THRESHOLDS.PHASE_COMPLETION ? new Date().toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', phaseId);

    if (error) {
      console.error('Error updating phase progress:', error);
    }

    return progress;
  }

  /**
   * Mettre à jour les jalons liés à l'inspection
   */
  private async updateRelatedMilestones(context: InspectionApprovalContext): Promise<number> {
    // Trouver les jalons liés à la phase ou au projet
    const { data: milestones, error: fetchError } = await supabase
      .from('enhanced_project_milestones')
      .select('*')
      .eq('project_id', context.projectId)
      .eq('status', 'in_progress');

    if (fetchError || !milestones) return 0;

    let updatedCount = 0;

    for (const milestone of milestones) {
      // Si le jalon est lié à la phase de l'inspection
      if (milestone.phase_id === context.phaseId || !milestone.phase_id) {
        const newStatus = context.progressAtInspection >= SYNC_THRESHOLDS.MILESTONE_COMPLETION 
          ? 'completed' 
          : 'in_progress';

        const { error: updateError } = await supabase
          .from('enhanced_project_milestones')
          .update({
            status: newStatus,
            completed_date: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : null,
            notes: `Mis à jour suite à inspection approuvée (${context.progressAtInspection}%)`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', milestone.id);

        if (!updateError) {
          updatedCount++;
        }
      }
    }

    return updatedCount;
  }

  /**
   * Traiter la mainlevée des garanties bancaires
   * @param level - 'phase' pour mainlevée phase, 'project' pour mainlevée projet global
   * @param phaseId - requis si level='phase'
   */
  private async processGuaranteeRelease(
    projectId: string, 
    level: ReleaseLevel, 
    phaseId?: string
  ): Promise<number> {
    // Récupérer les garanties actives ou partiellement libérées
    const statusFilter = level === 'phase' 
      ? ['active'] // Phase: seulement les actives
      : ['active', 'phase_released']; // Projet: actives + déjà libérées au niveau phase

    const { data: guarantees, error: fetchError } = await supabase
      .from('bank_guarantees')
      .select('*')
      .eq('project_id', projectId)
      .in('status', statusFilter);

    if (fetchError || !guarantees) return 0;

    let releasedCount = 0;
    const newStatus = level === 'phase' ? 'phase_released' : 'project_released';
    const levelLabel = level === 'phase' ? 'phase' : 'projet complet';

    for (const guarantee of guarantees) {
      const { error: updateError } = await supabase
        .from('bank_guarantees')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', guarantee.id);

      if (!updateError) {
        releasedCount++;

        // Créer une notification pour la mainlevée
        await supabase.from('notifications').insert({
          recipient_id: guarantee.contractor_id,
          title: `Mainlevée ${level === 'phase' ? 'Phase' : 'Projet'} - Garantie bancaire`,
          message: `La garantie bancaire de ${guarantee.guarantee_amount.toLocaleString()} MRU peut être libérée suite à la validation du ${levelLabel}.`,
          type: 'guarantee_release',
          related_id: guarantee.id,
          metadata: {
            guarantee_type: guarantee.guarantee_type,
            bank_name: guarantee.bank_name,
            amount: guarantee.guarantee_amount,
            release_level: level,
            phase_id: phaseId,
          },
        });
      }
    }

    return releasedCount;
  }

  /**
   * Traiter la libération des certificats d'assurance
   * @param level - 'phase' pour libération phase, 'project' pour libération projet global
   * @param phaseId - requis si level='phase'
   */
  private async processInsuranceRelease(
    projectId: string, 
    level: ReleaseLevel, 
    phaseId?: string
  ): Promise<number> {
    // Récupérer les assurances actives ou partiellement libérées
    const statusFilter = level === 'phase' 
      ? ['active'] 
      : ['active', 'phase_released'];

    const { data: insurances, error: fetchError } = await supabase
      .from('insurance_certificates')
      .select('*')
      .eq('project_id', projectId)
      .in('status', statusFilter);

    if (fetchError || !insurances) return 0;

    let releasedCount = 0;
    const newStatus = level === 'phase' ? 'phase_released' : 'project_released';
    const levelLabel = level === 'phase' ? 'phase' : 'projet complet';

    for (const insurance of insurances) {
      const { error: updateError } = await supabase
        .from('insurance_certificates')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', insurance.id);

      if (!updateError) {
        releasedCount++;

        // Créer une notification pour la libération
        await supabase.from('notifications').insert({
          recipient_id: insurance.contractor_id,
          title: `Libération ${level === 'phase' ? 'Phase' : 'Projet'} - Assurance`,
          message: `Le certificat d'assurance (${insurance.coverage_type}) peut être libéré suite à la validation du ${levelLabel}.`,
          type: 'insurance_release',
          related_id: insurance.id,
          metadata: {
            coverage_type: insurance.coverage_type,
            insurance_company: insurance.insurance_company,
            coverage_amount: insurance.coverage_amount,
            release_level: level,
            phase_id: phaseId,
          },
        });
      }
    }

    return releasedCount;
  }

  /**
   * Déclencher un paiement automatique
   */
  private async triggerAutomaticPayment(context: InspectionApprovalContext): Promise<{
    triggered: boolean;
    amount?: number;
  }> {
    try {
      // Récupérer les informations du projet et du dernier paiement
      const { data: project } = await supabase
        .from('projects')
        .select('budget, title')
        .eq('id', context.projectId)
        .single();

      if (!project) return { triggered: false };

      // Calculer le montant basé sur la progression
      const progressPaymentRatio = context.progressAtInspection / 100;
      const totalBudget = project.budget || 0;
      
      // Récupérer le total déjà payé
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('project_id', context.projectId);

      const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const expectedPayment = totalBudget * progressPaymentRatio;
      const remainingToPay = Math.max(0, expectedPayment - totalPaid);

      if (remainingToPay <= 0) {
        return { triggered: false };
      }

      // Créer une demande de paiement (pas un paiement effectif)
      const { error: paymentError } = await supabase
        .from('payment_blocks')
        .insert({
          project_id: context.projectId,
          contractor_id: 'pending-assignment',
          amount: remainingToPay,
          blocking_reasons: {
            type: 'auto_payment_request',
            inspection_id: context.inspectionId,
            progress: context.progressAtInspection,
            requires_approval: true,
          },
          notes: `Demande de paiement automatique suite à inspection approuvée (${context.progressAtInspection}%)`,
          blocked_at: new Date().toISOString(),
        });

      if (paymentError) {
        console.error('Error creating payment request:', paymentError);
        return { triggered: false };
      }

      return { triggered: true, amount: remainingToPay };
    } catch (error) {
      console.error('Error triggering automatic payment:', error);
      return { triggered: false };
    }
  }

  /**
   * Créer une notification de synthèse
   */
  private async createSyncNotification(context: InspectionApprovalContext, result: SyncResult): Promise<void> {
    try {
      const { data: project } = await supabase
        .from('projects')
        .select('title')
        .eq('id', context.projectId)
        .single();

      const totalGuarantees = result.phaseGuaranteesReleased + result.projectGuaranteesReleased;
      const totalInsurances = result.phaseInsurancesReleased + result.projectInsurancesReleased;

      await supabase.from('notifications').insert([{
        recipient_id: context.inspector,
        title: 'Synchronisation complète - Inspection approuvée',
        message: `Projet "${project?.title}": Progression ${result.projectProgressUpdated}%, ${result.milestonesUpdated} jalon(s), ${totalGuarantees} garantie(s), ${totalInsurances} assurance(s)`,
        type: 'inspection_sync',
        related_id: context.inspectionId,
        metadata: {
          projectProgressUpdated: result.projectProgressUpdated,
          phaseProgressUpdated: result.phaseProgressUpdated,
          milestonesUpdated: result.milestonesUpdated,
          phaseGuaranteesReleased: result.phaseGuaranteesReleased,
          projectGuaranteesReleased: result.projectGuaranteesReleased,
          phaseInsurancesReleased: result.phaseInsurancesReleased,
          projectInsurancesReleased: result.projectInsurancesReleased,
          paymentTriggered: result.paymentTriggered,
          inspectionId: context.inspectionId,
        },
      }]);
    } catch (error) {
      console.error('Error creating sync notification:', error);
    }
  }

  /**
   * Obtenir le résumé de synchronisation pour un projet
   */
  async getSyncStatus(projectId: string): Promise<{
    lastInspection?: {
      id: string;
      status: string;
      progress: number;
      date: string;
    };
    guaranteeStatus: {
      active: number;
      phaseReleased: number;
      projectReleased: number;
    };
    insuranceStatus: {
      active: number;
      phaseReleased: number;
      projectReleased: number;
    };
    pendingPayments: number;
  }> {
    // Dernière inspection
    const { data: lastInspection } = await supabase
      .from('inspections')
      .select('id, status, progress_at_inspection, date')
      .eq('project_id', projectId)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Statut garanties
    const { data: guarantees } = await supabase
      .from('bank_guarantees')
      .select('status')
      .eq('project_id', projectId);

    const guaranteeStatus = {
      active: guarantees?.filter(g => g.status === 'active').length || 0,
      phaseReleased: guarantees?.filter(g => g.status === 'phase_released').length || 0,
      projectReleased: guarantees?.filter(g => g.status === 'project_released').length || 0,
    };

    // Statut assurances
    const { data: insurances } = await supabase
      .from('insurance_certificates')
      .select('status')
      .eq('project_id', projectId);

    const insuranceStatus = {
      active: insurances?.filter(i => i.status === 'active').length || 0,
      phaseReleased: insurances?.filter(i => i.status === 'phase_released').length || 0,
      projectReleased: insurances?.filter(i => i.status === 'project_released').length || 0,
    };

    // Paiements en attente
    const { data: pendingPayments } = await supabase
      .from('payment_blocks')
      .select('id')
      .eq('project_id', projectId)
      .is('resolved_at', null);

    return {
      lastInspection: lastInspection ? {
        id: lastInspection.id,
        status: lastInspection.status,
        progress: lastInspection.progress_at_inspection,
        date: lastInspection.date,
      } : undefined,
      guaranteeStatus,
      insuranceStatus,
      pendingPayments: pendingPayments?.length || 0,
    };
  }
}

// Singleton instance
let serviceInstance: InspectionApprovalSyncService | null = null;

export function getInspectionApprovalSyncService(): InspectionApprovalSyncService {
  if (!serviceInstance) {
    serviceInstance = new InspectionApprovalSyncService();
  }
  return serviceInstance;
}
