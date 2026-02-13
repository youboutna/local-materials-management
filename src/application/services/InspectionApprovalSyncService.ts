/**
 * Inspection Approval Sync Service - Hexagonal Architecture
 * Service de synchronisation après approbation d'inspection
 * Gère la mise à jour en cascade du projet, phases, jalons et la mainlevée des garanties
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { Inspection, InspectionStatus } from '@/domain/entities/Inspection';
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
    private milestoneRepository: IPhaseRepository = RepositoryFactory.getPhaseRepository(),
    private bankGuaranteeRepository: IBankGuaranteeRepository = RepositoryFactory.getBankGuaranteeRepository(),
    private paymentRepository: IPaymentRepository = RepositoryFactory.getPaymentRepository()
  ) {
    this.bankGuaranteeService = new BankGuaranteeService();
  }

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

      await this.updateInspectionWithValidation(context);
      result.actions.push(`Inspection ${context.inspectionId} mise à jour avec statut: ${context.status}`);

      const newProgress = await this.synchronizeProjectProgress(context.projectId);
      result.projectProgressUpdated = newProgress;
      result.actions.push(`Progression projet synchronisée: ${newProgress}%`);

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
        await this.releasePhaseGuarantees(context.phaseId);
        result.phaseGuaranteesReleased = 1;
        result.actions.push('Mainlevée des garanties de phase');
      }

      if (phaseProgress >= SYNC_THRESHOLDS.PROJECT_RELEASE) {
        await this.releaseProjectGuarantees(context.projectId);
        result.projectGuaranteesReleased = 1;
        result.projectInsurancesReleased = 1;
        result.actions.push('Mainlevée des garanties de projet');
      }

      if (newProgress >= SYNC_THRESHOLDS.PAYMENT_TRIGGER) {
        result.paymentTriggered = true;
        result.paymentAmount = await this.calculatePaymentAmount(context.projectId);
        result.actions.push('Paiement déclenché automatiquement');
      }

      result.success = true;
      return result;
    } catch (error) {
      console.error('InspectionApprovalSyncService.synchronizeOnApproval failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to synchronize on approval');
    }
  }

  private async synchronizeProjectProgress(projectId: string): Promise<number> {
    try {
      const project = await this.projectRepository.findById(projectId);
      if (!project) throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      const progress = project.calculateProgressPercentage();
      project.progress = progress;
      await this.projectRepository.update(projectId, { progress });
      return progress;
    } catch (error) {
      console.error('InspectionApprovalSyncService.synchronizeProjectProgress failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to synchronize project progress');
    }
  }

  private async updateInspectionWithValidation(context: InspectionApprovalContext): Promise<void> {
    try {
      const inspection = await this.inspectionRepository.findById(context.inspectionId);
      if (!inspection) throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');

      const domainStatus = Inspection.mapStringToStatus(context.status);
      await this.inspectionRepository.update(context.inspectionId, {
        status: domainStatus,
        inspector: { name: context.inspector, agency: '' },
        progressAtInspection: context.progressAtInspection
      } as Partial<Inspection>);
    } catch (error) {
      console.error('InspectionApprovalSyncService.updateInspectionWithValidation failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update inspection with validation');
    }
  }

  private async updatePhaseProgress(phaseId: string, progress: number): Promise<number> {
    try {
      const phase = await this.phaseRepository.findById(phaseId);
      if (!phase) throw new AppError(ErrorCode.NOT_FOUND, 'Phase not found');
      await this.phaseRepository.update(phaseId, { progress });
      return progress;
    } catch (error) {
      console.error('InspectionApprovalSyncService.updatePhaseProgress failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update phase progress');
    }
  }

  private async updateRelatedMilestones(context: InspectionApprovalContext): Promise<number> {
    try {
      let updatedCount = 0;
      if (context.phaseId) {
        const phases = await this.milestoneRepository.findByProjectId(context.projectId);
        const phaseMilestones = phases.filter(phase => phase.id === context.phaseId);
        const domainStatus = Inspection.mapStringToStatus(context.status);
        
        for (const phase of phaseMilestones) {
          if (domainStatus === InspectionStatus.Approved) {
            await this.milestoneRepository.update(phase.id, { status: 'completed' });
            updatedCount++;
          }
        }
      }
      return updatedCount;
    } catch (error) {
      console.error('InspectionApprovalSyncService.updateRelatedMilestones failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update related milestones');
    }
  }

  private async releasePhaseGuarantees(phaseId: string): Promise<void> {
    try {
      await this.bankGuaranteeService.releasePhaseGuarantees(phaseId);
    } catch (error) {
      console.error('InspectionApprovalSyncService.releasePhaseGuarantees failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to release phase guarantees');
    }
  }

  private async releaseProjectGuarantees(projectId: string): Promise<void> {
    try {
      await this.bankGuaranteeService.releaseProjectGuarantees(projectId);
    } catch (error) {
      console.error('InspectionApprovalSyncService.releaseProjectGuarantees failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to release project guarantees');
    }
  }

  private async calculatePaymentAmount(projectId: string): Promise<number> {
    try {
      const project = await this.projectRepository.findById(projectId);
      if (!project) throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      return project.progress * (project.budget * 0.1);
    } catch (error) {
      console.error('InspectionApprovalSyncService.calculatePaymentAmount failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to calculate payment amount');
    }
  }
}
