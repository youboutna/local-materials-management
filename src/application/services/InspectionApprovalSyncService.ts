/**
 * Inspection Approval Sync Service - Hexagonal Architecture
 * Service de synchronisation après approbation d'inspection
 * Gère la mise à jour en cascade du projet, phases, jalons et la mainlevée des garanties
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import { IMilestoneRepository } from '@/domain/repositories/IMilestoneRepository';
import { IBankGuaranteeRepository } from '@/domain/repositories/IBankGuaranteeRepository';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
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
  validationDate?: string;
  approvedBy?: string;
  notes?: string;
  checklistItems?: Array<{
    id: string;
    name: string;
    status: 'passed' | 'failed' | 'na';
  }>;
  nonConformities?: Array<{
    id: string;
    description: string;
    severity: string;
  }>;
  nextActions?: Array<{
    id: string;
    description: string;
    dueDate: string;
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

  constructor(
    private inspectionRepository: IInspectionRepository = RepositoryFactory.getInspectionRepository(),
    private projectRepository: IProjectRepository = RepositoryFactory.getProjectRepository(),
    private phaseRepository: IPhaseRepository = RepositoryFactory.getPhaseRepository(),
    private milestoneRepository: IPhaseRepository = RepositoryFactory.getPhaseRepository(), // Using phase repository as placeholder
    private bankGuaranteeRepository: IBankGuaranteeRepository = RepositoryFactory.getBankGuaranteeRepository(),
    private paymentRepository: IPaymentRepository = RepositoryFactory.getPaymentRepository()
  ) {
    this.bankGuaranteeService = new BankGuaranteeService();
  }

  /**
   * Synchronisation complète après approbation d'une inspection
   */
  async synchronizeOnApproval(context: InspectionApprovalContext): Promise<SyncResult> {
    try {
      if (!context.inspectionId || !context.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID and Project ID are required');
      }

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
      console.error('InspectionApprovalSyncService.synchronizeOnApproval failed:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to synchronize on approval');
    }
  }

  /**
   * Synchronize project progress
   */
  private async synchronizeProjectProgress(projectId: string): Promise<number> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // Get project and calculate progress based on phases and inspections
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }

      // Calculate progress based on project's business logic
      const progress = project.calculateProgressPercentage();
      
      // Update project with new progress
      project.progress = progress;
      await this.projectRepository.update(projectId, { progress });
      
      return progress;
    } catch (error) {
      console.error('InspectionApprovalSyncService.synchronizeProjectProgress failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to synchronize project progress');
    }
  }

  /**
   * Mettre à jour l'inspection avec documents de validation
   */
  private async updateInspectionWithValidation(context: InspectionApprovalContext): Promise<void> {
    try {
      if (!context.inspectionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      }

      // Update inspection status and validation documents
      const inspection = await this.inspectionRepository.findById(context.inspectionId);
      if (!inspection) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');
      }
      
      await this.inspectionRepository.update(context.inspectionId, {
        status: context.status as 'approved' | 'rejected' | 'requires_changes',
        inspector: context.inspector,
        progressAtInspection: context.progressAtInspection
      });
      
      console.log(`Inspection ${context.inspectionId} updated with validation documents`);
    } catch (error) {
      console.error('InspectionApprovalSyncService.updateInspectionWithValidation failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update inspection with validation');
    }
  }

  /**
   * Mettre à jour la progression de phase
   */
  private async updatePhaseProgress(phaseId: string, progress: number): Promise<number> {
    try {
      if (!phaseId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      // Get phase and update progress
      const phase = await this.phaseRepository.findById(phaseId);
      if (!phase) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Phase not found');
      }

      // Update phase progress using repository
      await this.phaseRepository.update(phaseId, { progress });
      
      console.log(`Phase ${phaseId} progress updated to: ${progress}%`);
      
      return progress;
    } catch (error) {
      console.error('InspectionApprovalSyncService.updatePhaseProgress failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update phase progress');
    }
  }

  /**
   * Mettre à jour les jalons liés à l'inspection
   */
  private async updateRelatedMilestones(context: InspectionApprovalContext): Promise<number> {
    try {
      if (!context.inspectionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      }

      // Get milestones related to the inspection's phase or project
      let updatedCount = 0;
      
      if (context.phaseId) {
        // Update milestones for the specific phase
        // Using phase repository as placeholder since milestone repository is not available
        const phases = await this.milestoneRepository.findByProjectId(context.projectId);
        const phaseMilestones = phases.filter(phase => phase.id === context.phaseId);
        
        for (const phase of phaseMilestones) {
          // Update milestone status based on inspection approval
          if (context.status === 'approved') {
            await this.milestoneRepository.update(phase.id, { 
              status: 'completed'
            });
            updatedCount++;
          }
        }
      }
      
      console.log(`Updated ${updatedCount} milestones for inspection: ${context.inspectionId}`);
      
      return updatedCount;
    } catch (error) {
      console.error('InspectionApprovalSyncService.updateRelatedMilestones failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update related milestones');
    }
  }

  /**
   * Mainlevée des garanties de phase
   */
  private async releasePhaseGuarantees(phaseId: string): Promise<void> {
    try {
      if (!phaseId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      await this.bankGuaranteeService.releasePhaseGuarantees(phaseId);
      console.log(`Phase guarantees released for phase: ${phaseId}`);
    } catch (error) {
      console.error('InspectionApprovalSyncService.releasePhaseGuarantees failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to release phase guarantees');
    }
  }

  /**
   * Mainlevée des garanties de projet
   */
  private async releaseProjectGuarantees(projectId: string): Promise<void> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      await this.bankGuaranteeService.releaseProjectGuarantees(projectId);
      console.log(`Project guarantees released for project: ${projectId}`);
    } catch (error) {
      console.error('InspectionApprovalSyncService.releaseProjectGuarantees failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to release project guarantees');
    }
  }

  /**
   * Calculer le montant de paiement automatique
   */
  private async calculatePaymentAmount(projectId: string): Promise<number> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // Get project and calculate payment amount based on progress and contracts
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }

      // Calculate payment amount based on project progress and budget
      const paymentAmount = project.progress * (project.budget * 0.1); // 10% of budget per 100% progress
      
      console.log(`Calculated payment amount for project: ${projectId} - ${paymentAmount}`);
      
      return paymentAmount;
    } catch (error) {
      console.error('InspectionApprovalSyncService.calculatePaymentAmount failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to calculate payment amount');
    }
  }
}
