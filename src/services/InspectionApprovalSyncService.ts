/**
 * Service de synchronisation après approbation d'inspection
 * Gère la mise à jour en cascade du projet, phases, jalons et la mainlevée des garanties
 * Migré vers l'architecture hexagonale
 */
import { supabase } from '@/integrations/supabase/client';
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

export const SYNC_THRESHOLDS = {
  MILESTONE_COMPLETION: 100,
  PHASE_RELEASE: 100,
  PROJECT_RELEASE: 100,
  PAYMENT_TRIGGER: 25,
  PHASE_COMPLETION: 95,
};

export class InspectionApprovalSyncService {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService(RepositoryFactory.getProjectRepository());
  }

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
      await this.updateInspectionWithValidation(context);
      result.actions.push(`Inspection ${context.inspectionId} mise à jour avec statut: ${context.status}`);

      const updatedProject = await this.projectService.updateProject(context.projectId, {
        progress: context.progressAtInspection
      });
      result.projectProgressUpdated = updatedProject.progress;
      result.actions.push(`Progression projet synchronisée: ${updatedProject.progress}%`);

      let phaseProgress = 0;
      if (context.phaseId) {
        phaseProgress = await this.updatePhaseProgress(context.phaseId, context.progressAtInspection);
        result.phaseProgressUpdated = phaseProgress;
        result.actions.push(`Progression phase mise à jour: ${phaseProgress}%`);
      }

      const milestonesUpdated = await this.updateRelatedMilestones(context);
      result.milestonesUpdated = milestonesUpdated;
      if (milestonesUpdated > 0) {
        result.actions.push(`${milestonesUpdated} jalon(s) mis à jour`);
      }

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

      if (context.status === 'approved' && context.progressAtInspection >= SYNC_THRESHOLDS.PAYMENT_TRIGGER) {
        const paymentResult = await this.triggerAutomaticPayment(context);
        result.paymentTriggered = paymentResult.triggered;
        result.paymentAmount = paymentResult.amount;
        if (paymentResult.triggered) {
          result.actions.push(`Demande de paiement automatique: ${paymentResult.amount?.toLocaleString()} MRU`);
        }
      }

      await this.createSyncNotification(context, result);
      result.success = true;
    } catch (error: unknown) {
      console.error('Error in synchronization:', error);
      result.errors.push(error instanceof Error ? error.message : 'Erreur de synchronisation');
    }

    return result;
  }

  private async checkAllPhasesComplete(projectId: string): Promise<boolean> {
    const phaseService = new PhaseService(RepositoryFactory.getPhaseRepository());
    const phases = await phaseService.getPhasesByProject(projectId);
    return phases.every(phase => (phase.progress || 0) >= SYNC_THRESHOLDS.PROJECT_RELEASE || phase.status === 'completed');
  }

  private async updateInspectionWithValidation(context: InspectionApprovalContext): Promise<void> {
    const updateData: Record<string, unknown> = {
      status: context.status,
      progress_at_inspection: context.progressAtInspection,
      updated_at: new Date().toISOString(),
    };

    if (context.validationDocuments && context.validationDocuments.length > 0) {
      const { data: existing } = await supabase
        .from('inspections')
        .select('documents')
        .eq('id', context.inspectionId)
        .single();

      const existingDocs = existing?.documents && typeof existing.documents === 'object' ? existing.documents : {};
      updateData.documents = {
        ...(existingDocs as Record<string, unknown>),
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

  private async updateRelatedMilestones(context: InspectionApprovalContext): Promise<number> {
    const { data: milestones, error: fetchError } = await supabase
      .from('enhanced_project_milestones')
      .select('*')
      .eq('project_id', context.projectId)
      .eq('status', 'in_progress');

    if (fetchError || !milestones) return 0;

    let updatedCount = 0;

    for (const milestone of milestones) {
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

  private async processGuaranteeRelease(
    projectId: string, 
    level: ReleaseLevel, 
    phaseId?: string
  ): Promise<number> {
    const statusFilter = level === 'phase' 
      ? ['active']
      : ['active', 'phase_released'];

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

  private async processInsuranceRelease(
    projectId: string, 
    level: ReleaseLevel, 
    phaseId?: string
  ): Promise<number> {
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

  private async triggerAutomaticPayment(context: InspectionApprovalContext): Promise<{
    triggered: boolean;
    amount?: number;
  }> {
    try {
      const { data: project } = await supabase
        .from('projects')
        .select('budget, title')
        .eq('id', context.projectId)
        .single();

      if (!project) return { triggered: false };

      const progressPaymentRatio = context.progressAtInspection / 100;
      const totalBudget = project.budget || 0;
      
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
          project_id: context.projectId,
          phase_id: context.phaseId,
          actions: result.actions,
          errors: result.errors,
        },
      }]);
    } catch (error) {
      console.error('Error creating sync notification:', error);
    }
  }
}

export const inspectionApprovalSyncService = new InspectionApprovalSyncService();
export const getInspectionApprovalSyncService = () => inspectionApprovalSyncService;
