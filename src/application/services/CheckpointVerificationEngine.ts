/**
 * CheckpointVerificationEngine - Hexagonal Architecture
 * 
 * Moteur de vérification des checkpoints
 * Vérifie: Inspections + Ressources + Documents + Service Fait → Validation Jalon
 * 
 * Architecture: UI → Service → Engine → Repository → Database
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { IMaterialRepository } from '@/domain/repositories/IMaterialRepository';
import { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import {
  CheckpointDTO,
  CheckpointVerificationResultDTO,
  VerificationItemDTO,
  VerificationStatus,
  CheckpointCategory,
  DEFAULT_MAURITANIA_RULES,
} from '@/types/checkpoint-dto';

// Service DTOs for data exchange
export interface VerifyCheckpointRequestDto {
  checkpoint: CheckpointDTO;
  projectId?: string;
  phaseId?: string;
}

export interface VerifyCheckpointResponseDto {
  result: CheckpointVerificationResultDTO;
  errors?: string[];
}

export interface VerifyInspectionsRequestDto {
  requiredInspectionIds: string[];
  triggerProgress: number;
  projectId: string;
}

export interface VerifyDocumentsRequestDto {
  requiredDocumentIds: string[];
  projectId: string;
}

export interface VerifyApprovalsRequestDto {
  requiredApprovalIds: string[];
  projectId: string;
}

export interface VerifyResourcesRequestDto {
  stepId: string;
  projectId: string;
}

export interface VerifyServiceFaitRequestDto {
  checkpointId: string;
  projectId: string;
}

// ============= ENGINE =============

export class CheckpointVerificationEngine {
  private projectId: string;
  private phaseId?: string;
  private inspectionRepository: IInspectionRepository;
  private documentRepository: IDocumentRepository;
  private materialRepository: IMaterialRepository;
  private phaseRepository: IPhaseRepository;
  private projectRepository: IProjectRepository;

  constructor(projectId: string, phaseId?: string) {
    if (!projectId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
    }
    
    this.projectId = projectId;
    this.phaseId = phaseId;
    this.inspectionRepository = RepositoryFactory.getInspectionRepository();
    this.documentRepository = RepositoryFactory.getDocumentRepository();
    this.materialRepository = RepositoryFactory.getMaterialRepository();
    this.phaseRepository = RepositoryFactory.getPhaseRepository();
    this.projectRepository = RepositoryFactory.getProjectRepository();
  }

  /**
   * Vérifie un checkpoint complet
   */
  async verifyCheckpoint(request: VerifyCheckpointRequestDto): Promise<VerifyCheckpointResponseDto> {
    try {
      if (!request.checkpoint) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Checkpoint is required');
      }

      const projectId = request.projectId || this.projectId;

      const verificationItems: VerificationItemDTO[] = [];
      const blockingIssues: string[] = [];
      const warnings: string[] = [];

      // 1. Vérifier les inspections
      const inspectionItems = await this.verifyInspections({
        requiredInspectionIds: request.checkpoint.required_inspections || [],
        triggerProgress: request.checkpoint.trigger_progress || 0,
        projectId
      });
      verificationItems.push(...inspectionItems);

      // 2. Vérifier les documents
      const documentItems = await this.verifyDocuments({
        requiredDocumentIds: request.checkpoint.required_documents || [],
        projectId
      });
      verificationItems.push(...documentItems);

      // 3. Vérifier les approbations
      const approvalItems = await this.verifyApprovals({
        requiredApprovalIds: request.checkpoint.required_approvals || [],
        projectId
      });
      verificationItems.push(...approvalItems);

      // 4. Vérifier les ressources/matériaux si applicable
      if (request.checkpoint.step_id) {
        const resourceItems = await this.verifyResources({
          stepId: request.checkpoint.step_id,
          projectId
        });
        verificationItems.push(...resourceItems);
      }

      // 5. Vérifier le service fait si c'est un gate
      if (request.checkpoint.checkpoint_type === 'gate') {
        const serviceFaitItem = await this.verifyServiceFait({
          checkpointId: request.checkpoint.id,
          projectId
        });
        if (serviceFaitItem) {
          verificationItems.push(serviceFaitItem);
        }
      }

      // Calculer le score et le statut global
      const requiredItems = verificationItems.filter(item => item.required);
      const verifiedItems = verificationItems.filter(item => item.status === 'verified');
      const failedItems = verificationItems.filter(item => item.status === 'failed');

      // Calculer le score pondéré
      const totalWeight = verificationItems.reduce((sum, item) => sum + item.weight, 0);
      const verifiedWeight = verifiedItems.reduce((sum, item) => sum + item.weight, 0);
      const verificationScore = totalWeight > 0 ? Math.round((verifiedWeight / totalWeight) * 100) : 0;

      // Déterminer le statut global
      let overallStatus: VerificationStatus = 'pending';
      const requiredFailed = requiredItems.filter(item => item.status === 'failed');
      const requiredVerified = requiredItems.filter(item => item.status === 'verified');

      if (requiredFailed.length > 0) {
        overallStatus = 'failed';
        blockingIssues.push(...requiredFailed.map(item => `${item.title}: Vérification échouée`));
      } else if (requiredVerified.length === requiredItems.length) {
        overallStatus = 'verified';
      } else if (verifiedItems.length > 0) {
        overallStatus = 'in_progress';
      }

      // Ajouter des avertissements pour les items non-requis échoués
      const optionalFailed = failedItems.filter(item => !item.required);
      if (optionalFailed.length > 0) {
        warnings.push(...optionalFailed.map(item => `${item.title}: Vérification optionnelle échouée`));
      }

      // Vérifier si peut procéder au paiement
      const canProceed = overallStatus === 'verified' && blockingIssues.length === 0;

      const result: CheckpointVerificationResultDTO = {
        checkpoint_id: request.checkpoint.id,
        milestone_id: request.checkpoint.milestone_id,
        overall_status: overallStatus,
        verification_score: verificationScore,
        verification_items: verificationItems,
        required_items_count: requiredItems.length,
        verified_items_count: verifiedItems.length,
        failed_items_count: failedItems.length,
        blocking_issues: blockingIssues,
        warnings,
        can_proceed: canProceed,
        verified_at: overallStatus === 'verified' ? new Date().toISOString() : undefined,
      };

      return { result };
    } catch (error) {
      console.error('CheckpointVerificationEngine.verifyCheckpoint failed:', error);
      const errorMessage = error instanceof AppError ? error.message : 'Failed to verify checkpoint';
      return {
        result: {} as CheckpointVerificationResultDTO,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Vérifie les inspections
   */
  private async verifyInspections(request: VerifyInspectionsRequestDto): Promise<VerificationItemDTO[]> {
    try {
      const inspections = await this.inspectionRepository.getApprovedInspections(this.projectId);
      if (!inspections || inspections.length === 0) {
        return [{
          id: `inspection-required-${request.triggerProgress}`,
          category: 'inspection' as CheckpointCategory,
          title: `Inspection requise à ${request.triggerProgress}%`,
          description: `Aucune inspection approuvée trouvée pour le seuil ${request.triggerProgress}%`,
          status: 'pending' as VerificationStatus,
          required: true,
          weight: 0.3,
        }];
      }

      return [{
        id: inspections[0].id,
        category: 'inspection' as CheckpointCategory,
        title: `Inspection à ${inspections[0].progress_at_inspection}%`,
        description: `Inspecteur: ${inspections[0].inspector}`,
        status: 'verified' as VerificationStatus,
        required: true,
        weight: 0.3,
        reference_id: inspections[0].id,
      }];
    } catch (error) {
      console.error('CheckpointVerificationEngine.verifyInspections failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to verify inspections');
    }
  }

  /**
   * Vérifie les documents
   */
  private async verifyDocuments(request: VerifyDocumentsRequestDto): Promise<VerificationItemDTO[]> {
    try {
      if (!request.requiredDocumentIds || request.requiredDocumentIds.length === 0) {
        return [];
      }

      const items: VerificationItemDTO[] = [];
      for (const documentId of request.requiredDocumentIds) {
        const document = await this.documentRepository.getDocument(documentId);
        if (!document) {
          items.push({
            id: documentId,
            category: 'document' as CheckpointCategory,
            title: 'Document requis',
            status: 'pending' as VerificationStatus,
            required: true,
            weight: 0.2 / request.requiredDocumentIds.length,
          });
          continue;
        }

        const docStatus = document.status;
        const isVerified = docStatus === 'pending_review' || docStatus === 'archived';
        const isFailed = docStatus === 'rejected';

        items.push({
          id: document.id,
          category: 'document' as CheckpointCategory,
          title: document.title,
          description: document.description || undefined,
          status: isVerified ? 'verified' : isFailed ? 'failed' : 'in_progress' as VerificationStatus,
          required: true,
          weight: 0.2 / request.requiredDocumentIds.length,
          reference_id: document.id,
          reference_type: 'document',
          evidence_urls: document.file_url ? [document.file_url] : undefined,
        });
      }

      return items;
    } catch (error) {
      console.error('CheckpointVerificationEngine.verifyDocuments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to verify documents');
    }
  }

  /**
   * Vérifie les approbations
   */
  private async verifyApprovals(request: VerifyApprovalsRequestDto): Promise<VerificationItemDTO[]> {
    if (!request.requiredApprovalIds || request.requiredApprovalIds.length === 0) {
      return [];
    }

    // Placeholder - approvals verification logic
    return request.requiredApprovalIds.map(approvalId => ({
      id: approvalId,
      category: 'approval' as CheckpointCategory,
      title: 'Approbation requise',
      status: 'pending' as VerificationStatus,
      required: true,
      weight: 0.2 / request.requiredApprovalIds.length,
    }));
  }

  /**
   * Vérifie les ressources/matériaux pour une étape
   */
  private async verifyResources(request: VerifyResourcesRequestDto): Promise<VerificationItemDTO[]> {
    try {
      const materials = await this.materialRepository.getMaterialsForStep(request.stepId, this.projectId);
      if (!materials || materials.length === 0) {
        return [];
      }

      return [{
        id: `resources-${request.stepId}`,
        category: 'resource' as CheckpointCategory,
        title: 'Vérification des ressources',
        description: `${materials.length} matériaux disponibles`,
        status: 'verified' as VerificationStatus,
        required: false,
        weight: 0.1,
      }];
    } catch (error) {
      console.error('CheckpointVerificationEngine.verifyResources failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to verify resources');
    }
  }

  /**
   * Vérifie le service fait
   */
  private async verifyServiceFait(request: VerifyServiceFaitRequestDto): Promise<VerificationItemDTO | null> {
    try {
      const pvDocuments = await this.documentRepository.findByProjectAndType(request.projectId, 'pv');
      
      if (!pvDocuments || pvDocuments.length === 0) {
        return {
          id: `service-fait-${request.checkpointId}`,
          category: 'service_fait' as CheckpointCategory,
          title: 'PV de service fait',
          description: 'Document de réception requis',
          status: 'pending' as VerificationStatus,
          required: true,
          weight: 0.2,
        };
      }

      const pv = pvDocuments[0];
      const pvStatus = pv.status;
      const isVerified = pvStatus === 'archived' || pvStatus === 'pending_review';
      
      return {
        id: pv.id,
        category: 'service_fait' as CheckpointCategory,
        title: 'PV de service fait',
        description: pv.title,
        status: isVerified ? 'verified' : 'in_progress' as VerificationStatus,
        required: true,
        weight: 0.2,
        reference_id: pv.id,
        reference_type: 'pv',
        evidence_urls: pv.file_url ? [pv.file_url] : undefined,
      };
    } catch (error) {
      console.error('CheckpointVerificationEngine.verifyServiceFait failed:', error);
      return null;
    }
  }

  /**
   * Vérifie si un paiement peut être déclenché
   */
  async canTriggerPayment(checkpoint: CheckpointDTO): Promise<{
    allowed: boolean;
    reason: string;
    maxAmount: number;
  }> {
    if (!checkpoint.triggers_payment) {
      return {
        allowed: false,
        reason: 'Ce checkpoint ne déclenche pas de paiement',
        maxAmount: 0,
      };
    }

    const verifyResult = await this.verifyCheckpoint({ checkpoint, projectId: this.projectId });

    if (!verifyResult.result.can_proceed) {
      return {
        allowed: false,
        reason: verifyResult.result.blocking_issues?.join(', ') || 'Vérifications incomplètes',
        maxAmount: 0,
      };
    }

    // Récupérer le budget de la phase via le repository
    let phaseBudget = 0;
    if (checkpoint.phase_id) {
      const phase = await this.phaseRepository.getPhaseById(checkpoint.phase_id);
      phaseBudget = phase?.estimated_cost || 0;
    }

    // Calculer le montant max basé sur le poids financier
    const maxAmount = phaseBudget * checkpoint.financial_weight;
    const retentionRate = DEFAULT_MAURITANIA_RULES.guarantee_retention_rate;
    const netAmount = maxAmount * (1 - retentionRate);

    return {
      allowed: true,
      reason: 'Toutes les vérifications sont passées',
      maxAmount: netAmount,
    };
  }
}

// ============= FACTORY =============

let engineInstance: CheckpointVerificationEngine | null = null;

export function getCheckpointVerificationEngine(
  projectId: string,
  phaseId?: string
): CheckpointVerificationEngine {
  if (!engineInstance || engineInstance['projectId'] !== projectId) {
    engineInstance = new CheckpointVerificationEngine(projectId, phaseId);
  }
  return engineInstance;
}
