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
  CheckpointDTO
} from '@/dtos/entities/CheckpointDTO';
import { CheckpointVerificationResultDTO } from '@/dtos/entities/CheckpointVerificationResultDTO';
import { VerificationItemDTO, VerificationStatus } from '@/dtos/entities/VerificationItemDTO';
import { CheckpointCategory } from '@/dtos/entities/CheckpointDTO';
import { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import { DEFAULT_MAURITANIA_RULES } from '@/dtos/entities/VerificationItemDTO';
import { VerifyCheckpointRequestDto, VerifyCheckpointResponseDto, VerifyInspectionsRequestDto, VerifyDocumentsRequestDto, VerifyApprovalsRequestDto, VerifyResourcesRequestDto, VerifyServiceFaitRequestDto } from '@/dtos/entities/CheckpointVerificationDTO';

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
   * Vérifie les inspections via le repository
   */
  private async verifyInspections(request: VerifyInspectionsRequestDto): Promise<VerificationItemDTO[]> {
    try {
      const items: VerificationItemDTO[] = [];

      // Get all project inspections from repository
      const inspections = await this.inspectionRepository.findByProjectId(request.projectId);
      
      // Filter approved inspections
      const approvedInspections = inspections.filter(insp => insp.status === 'approved');
      
      // Check if we have approved inspections for the required progress
      const hasRequiredInspection = approvedInspections.some(
        insp => insp.progressAtInspection >= request.triggerProgress
      );

      items.push({
        id: `inspection-${request.triggerProgress}`,
        category: 'inspection' as CheckpointCategory,
        title: `Inspection approuvée à ${request.triggerProgress}%`,
        description: hasRequiredInspection 
          ? `Inspection trouvée avec progression ≥ ${request.triggerProgress}%`
          : `Aucune inspection approuvée pour le seuil ${request.triggerProgress}%`,
        status: hasRequiredInspection ? 'verified' : 'pending' as VerificationStatus,
        required: true,
        weight: 0.3,
        reference_type: 'inspection'
      });

      // Also add individual required inspections if specified
      for (const inspectionId of request.requiredInspectionIds) {
        const inspection = inspections.find(i => i.id === inspectionId);
        
        items.push({
          id: inspectionId,
          category: 'inspection' as CheckpointCategory,
          title: inspection ? `Inspection: ${inspection.date}` : `Inspection: ${inspectionId}`,
          status: inspection?.status === 'approved' ? 'verified' : 'pending' as VerificationStatus,
          required: true,
          weight: 0.1,
          reference_id: inspectionId,
          reference_type: 'inspection'
        });
      }

      return items;
    } catch (error) {
      console.error('CheckpointVerificationEngine.verifyInspections failed:', error);
      // Return pending item on error
      return [{
        id: `inspection-error-${request.triggerProgress}`,
        category: 'inspection' as CheckpointCategory,
        title: `Inspection requise à ${request.triggerProgress}%`,
        description: 'Erreur lors de la vérification des inspections',
        status: 'pending' as VerificationStatus,
        required: true,
        weight: 0.3,
      }];
    }
  }

  /**
   * Vérifie les documents via le repository
   */
  private async verifyDocuments(request: VerifyDocumentsRequestDto): Promise<VerificationItemDTO[]> {
    try {
      if (!request.requiredDocumentIds || request.requiredDocumentIds.length === 0) {
        return [];
      }

      const items: VerificationItemDTO[] = [];
      
      // Get all project documents
      const allDocuments = await this.documentRepository.findAll();
      const projectDocuments = allDocuments.filter(doc => doc.projectId === request.projectId);

      for (const documentId of request.requiredDocumentIds) {
        const document = projectDocuments.find(d => d.id === documentId);
        const isVerified = document && document.status === 'approved';
        
        items.push({
          id: documentId,
          category: 'document' as CheckpointCategory,
          title: document?.title || `Document: ${documentId}`,
          description: document?.description || undefined,
          status: isVerified ? 'verified' : 'pending' as VerificationStatus,
          required: true,
          weight: 0.2 / request.requiredDocumentIds.length,
          reference_id: documentId,
          reference_type: 'document'
        });
      }

      return items;
    } catch (error) {
      console.error('CheckpointVerificationEngine.verifyDocuments failed:', error);
      return request.requiredDocumentIds.map(docId => ({
        id: docId,
        category: 'document' as CheckpointCategory,
        title: `Document requis: ${docId}`,
        description: 'Erreur lors de la vérification du document',
        status: 'pending' as VerificationStatus,
        required: true,
        weight: 0.2 / request.requiredDocumentIds.length,
      }));
    }
  }

  /**
   * Vérifie les approbations
   */
  private async verifyApprovals(request: VerifyApprovalsRequestDto): Promise<VerificationItemDTO[]> {
    if (!request.requiredApprovalIds || request.requiredApprovalIds.length === 0) {
      return [];
    }

    // Approvals are typically linked to inspections or documents
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
   * Vérifie les ressources/matériaux via le repository
   */
  private async verifyResources(request: VerifyResourcesRequestDto): Promise<VerificationItemDTO[]> {
    try {
      // Get materials for the project
      const materials = await this.materialRepository.findAll();
      const projectMaterials = materials.filter(m => {
        const material = m as unknown as {projectId?: string, project_id?: string};
        return material.projectId === request.projectId || 
               material.project_id === request.projectId;
      });
      
      const hasMaterials = projectMaterials.length > 0;

      return [{
        id: `materials-${request.stepId}`,
        category: 'resource' as CheckpointCategory,
        title: `Matériaux pour l'étape ${request.stepId}`,
        description: hasMaterials 
          ? `${projectMaterials.length} matériau(x) assigné(s)`
          : 'Aucun matériau assigné',
        status: hasMaterials ? 'verified' : 'pending' as VerificationStatus,
        required: false, // Materials are optional for checkpoint
        weight: 0.15,
      }];
    } catch (error) {
      console.error('CheckpointVerificationEngine.verifyResources failed:', error);
      return [{
        id: `materials-error-${request.stepId}`,
        category: 'resource' as CheckpointCategory,
        title: `Matériaux pour l'étape ${request.stepId}`,
        description: 'Erreur lors de la vérification des matériaux',
        status: 'pending' as VerificationStatus,
        required: false,
        weight: 0.15,
      }];
    }
  }

  /**
   * Vérifie le service fait via le repository
   */
  private async verifyServiceFait(request: VerifyServiceFaitRequestDto): Promise<VerificationItemDTO | null> {
    try {
      // Get all documents for the project
      const allDocuments = await this.documentRepository.findAll();
      
      // Find service_fait document for this project
      const serviceFaitDoc = allDocuments.find(doc => 
        doc.projectId === request.projectId && 
        (doc.documentType === 'other' || doc.title?.toLowerCase().includes('service fait'))
      );

      const isVerified = serviceFaitDoc && serviceFaitDoc.status === 'approved';

      return {
        id: `service-fait-${request.projectId}`,
        category: 'service_fait' as CheckpointCategory,
        title: 'Certificat de Service Fait',
        description: serviceFaitDoc 
          ? `Document: ${serviceFaitDoc.title}`
          : 'Document de service fait non trouvé',
        status: isVerified ? 'verified' : 'pending' as VerificationStatus,
        required: true,
        weight: 0.1,
        reference_id: serviceFaitDoc?.id,
        reference_type: 'document'
      };
    } catch (error) {
      console.error('CheckpointVerificationEngine.verifyServiceFait failed:', error);
      return {
        id: `service-fait-error-${request.projectId}`,
        category: 'service_fait' as CheckpointCategory,
        title: 'Certificat de Service Fait',
        description: 'Erreur lors de la vérification du service fait',
        status: 'pending' as VerificationStatus,
        required: true,
        weight: 0.1,
      };
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
      try {
        const phase = await this.phaseRepository.findById(checkpoint.phase_id);
        if (phase) {
          phaseBudget = phase.estimatedCost || phase.actualCost || 0;
        }
      } catch (error) {
        console.warn('Failed to get phase budget:', error);
      }
    }

    // Si pas de budget phase, utiliser le budget projet
    if (phaseBudget === 0) {
      try {
        const project = await this.projectRepository.findById(this.projectId);
        if (project) {
          phaseBudget = project.budget || 0;
        }
      } catch (error) {
        console.warn('Failed to get project budget:', error);
      }
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

  /**
   * Vérifie un checkpoint simplifié
   */
  private async verifyCheckpointSimple(checkpoint: CheckpointDTO): Promise<{
    isValid: boolean;
    issues: string[];
    timestamp: Date;
  }> {
    try {
      const projectId = this.projectId;

      const verificationItems: VerificationItemDTO[] = [];
      const blockingIssues: string[] = [];

      // 1. Vérifier les inspections
      const inspectionItems = await this.verifyInspections({
        requiredInspectionIds: checkpoint.required_inspections || [],
        triggerProgress: checkpoint.trigger_progress || 0,
        projectId
      });
      verificationItems.push(...inspectionItems);

      // 2. Vérifier les documents
      const documentItems = await this.verifyDocuments({
        requiredDocumentIds: checkpoint.required_documents || [],
        projectId
      });
      verificationItems.push(...documentItems);

      // 3. Vérifier les approbations
      const approvalItems = await this.verifyApprovals({
        requiredApprovalIds: checkpoint.required_approvals || [],
        projectId
      });
      verificationItems.push(...approvalItems);

      // 4. Vérifier les ressources/matériaux si applicable
      if (checkpoint.step_id) {
        const resourceItems = await this.verifyResources({
          stepId: checkpoint.step_id,
          projectId
        });
        verificationItems.push(...resourceItems);
      }

      // 5. Vérifier le service fait si c'est un gate
      if (checkpoint.checkpoint_type === 'gate') {
        const serviceFaitItem = await this.verifyServiceFait({
          checkpointId: checkpoint.id,
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

      // Déterminer le statut global
      const requiredFailed = requiredItems.filter(item => item.status === 'failed');

      if (requiredFailed.length > 0) {
        blockingIssues.push(...requiredFailed.map(item => `${item.title}: Vérification échouée`));
      }

      // Vérifier si peut procéder au paiement
      const canProceed = requiredFailed.length === 0;

      return {
        isValid: canProceed,
        issues: blockingIssues,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('CheckpointVerificationEngine.verifyCheckpointSimple failed:', error);
      const errorMessage = error instanceof AppError ? error.message : 'Failed to verify checkpoint';
      return {
        isValid: false,
        issues: [errorMessage],
        timestamp: new Date(),
      };
    }
  }

  /**
   * Vérifie si un paiement peut être déclenché
   */
  async validateCheckpoint(checkpoint: CheckpointDTO): Promise<{
    isValid: boolean;
    issues: string[];
    timestamp: Date;
  }> {
    try {
      const verifyResult = await this.verifyCheckpoint({ checkpoint, projectId: this.projectId });

      const isValid = verifyResult.result?.can_proceed ?? false;
      const issues = verifyResult.result?.blocking_issues ?? [];
      
      if (!isValid) {
        return { isValid, issues, timestamp: new Date() };
      }

      // Récupérer le budget de la phase via le repository
      let phaseBudget = 0;
      if (checkpoint.phase_id) {
        try {
          const phase = await this.phaseRepository.findById(checkpoint.phase_id);
          if (phase) {
            phaseBudget = phase.estimatedCost || phase.actualCost || 0;
          }
        } catch (error) {
          console.warn('Failed to get phase budget:', error);
        }
      }

      // Si pas de budget phase, utiliser le budget projet
      if (phaseBudget === 0) {
        try {
          const project = await this.projectRepository.findById(this.projectId);
          if (project) {
            phaseBudget = project.budget || 0;
          }
        } catch (error) {
          console.warn('Failed to get project budget:', error);
        }
      }

      // Calculer le montant max basé sur le poids financier
      const maxAmount = phaseBudget * checkpoint.financial_weight;
      const retentionRate = DEFAULT_MAURITANIA_RULES.guarantee_retention_rate;
      const netAmount = maxAmount * (1 - retentionRate);

      const result = {
        isValid: true,
        issues: [],
        timestamp: new Date(),
      };

      return result;
    } catch (error) {
      console.error('CheckpointVerificationEngine.validateCheckpoint failed:', error);
      const errorMessage = error instanceof AppError ? error.message : 'Failed to validate checkpoint';
      return {
        isValid: false,
        issues: [errorMessage],
        timestamp: new Date(),
      };
    }
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
