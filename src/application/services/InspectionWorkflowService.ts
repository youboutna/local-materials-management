/**
 * Inspection Workflow Service - Hexagonal Architecture
 * Business logic for inspection workflow management
 * Handles transitions: request → schedule → execute → complete
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { InspectionService } from './InspectionService';
import { NotificationService } from './NotificationService';
import { DocumentService } from './DocumentService';
import {
  InspectionDTO,
  CreateInspectionDTO,
  UpdateInspectionDTO,
  InspectionStatus
} from '@/dtos/entities/InspectionDTO';

// Workflow status types
export type InspectionWorkflowStatus = 
  | 'requested'      // Demandé par chef de projet
  | 'scheduled'      // Programmé par responsable technique
  | 'in_progress'    // En cours de réalisation
  | 'completed'      // Terminé avec documents
  | 'approved'       // Validé par ingénieur conseil
  | 'rejected'       // Rejeté, nécessite reprise
  | 'requires_changes'; // Modifications requises

// Document types for inspections
export type InspectionDocumentType = 
  | 'pv_service_fait'
  | 'pv_main_levee'
  | 'photos'
  | 'geolocation'
  | 'rapport_final'
  | 'decompte'
  | 'attachement';

export interface RequiredDocument {
  type: InspectionDocumentType;
  label: string;
  required: boolean;
  minCount?: number;
  maxCount?: number;
  acceptedFormats?: string[];
}

export interface WorkflowTransition {
  from: InspectionWorkflowStatus;
  to: InspectionWorkflowStatus;
  requiredRole: string[];
  requiredDocuments?: InspectionDocumentType[];
  requiresApproval?: boolean;
}

export interface InspectionRequest {
  project_id: string;
  phase_id?: string;
  step_id?: string;
  inspection_type: string;
  requested_by: string;
  requested_date: string;
  proposed_dates?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

export interface InspectionSchedule {
  inspection_id: string;
  scheduled_date: string;
  scheduled_time: string;
  inspector_id: string;
  location?: string;
  notes?: string;
}

export interface InspectionExecution {
  inspection_id: string;
  started_at: string;
  completed_at?: string;
  findings?: string;
  recommendations?: string;
  non_conformities?: Array<{
    description: string;
    severity: 'minor' | 'major' | 'critical';
    action_required: string;
  }>;
}

export interface InspectionReview {
  inspection_id: string;
  reviewed_by: string;
  reviewed_at: string;
  decision: 'approved' | 'rejected' | 'requires_changes';
  comments?: string;
  required_changes?: string[];
}

export class InspectionWorkflowService {
  private inspectionService: InspectionService;
  private notificationService: NotificationService;
  private documentService: DocumentService;

  constructor(
    inspectionService?: InspectionService,
    notificationService?: NotificationService,
    documentService?: DocumentService
  ) {
    this.inspectionService = inspectionService || new InspectionService();
    this.notificationService = notificationService || new NotificationService();
    this.documentService = documentService || new DocumentService();
  }

  // Workflow transition rules
  private readonly workflowTransitions: WorkflowTransition[] = [
    {
      from: 'requested',
      to: 'scheduled',
      requiredRole: ['technical_manager', 'inspector'],
      requiresApproval: false
    },
    {
      from: 'scheduled',
      to: 'in_progress',
      requiredRole: ['inspector'],
      requiresApproval: false
    },
    {
      from: 'in_progress',
      to: 'completed',
      requiredRole: ['inspector'],
      requiredDocuments: ['photos', 'rapport_final'],
      requiresApproval: false
    },
    {
      from: 'completed',
      to: 'approved',
      requiredRole: ['engineer', 'technical_manager'],
      requiresApproval: true
    },
    {
      from: 'completed',
      to: 'rejected',
      requiredRole: ['engineer', 'technical_manager'],
      requiresApproval: true
    },
    {
      from: 'completed',
      to: 'requires_changes',
      requiredRole: ['engineer', 'technical_manager'],
      requiresApproval: true
    },
    {
      from: 'requires_changes',
      to: 'in_progress',
      requiredRole: ['inspector'],
      requiresApproval: false
    },
    {
      from: 'rejected',
      to: 'in_progress',
      requiredRole: ['inspector'],
      requiresApproval: false
    }
  ];

  // Required documents by inspection type
  private readonly requiredDocumentsByType: Record<string, RequiredDocument[]> = {
    'regular': [
      { type: 'photos', label: 'Photos de chantier', required: true, minCount: 5, maxCount: 20, acceptedFormats: ['jpg', 'jpeg', 'png'] },
      { type: 'rapport_final', label: 'Rapport d\'inspection', required: true, maxCount: 1, acceptedFormats: ['pdf', 'docx'] }
    ],
    'main_levee': [
      { type: 'pv_main_levee', label: 'PV de main levée', required: true, maxCount: 1, acceptedFormats: ['pdf'] },
      { type: 'photos', label: 'Photos de fin de travaux', required: true, minCount: 10, maxCount: 30, acceptedFormats: ['jpg', 'jpeg', 'png'] },
      { type: 'geolocation', label: 'Coordonnées GPS', required: false, maxCount: 1, acceptedFormats: ['gpx', 'kml'] }
    ],
    'decompte': [
      { type: 'decompte', label: 'Décompte de travaux', required: true, maxCount: 1, acceptedFormats: ['pdf', 'xlsx'] },
      { type: 'attachement', label: 'Attachements', required: true, minCount: 1, acceptedFormats: ['pdf'] },
      { type: 'photos', label: 'Photos des travaux', required: true, minCount: 5, maxCount: 15, acceptedFormats: ['jpg', 'jpeg', 'png'] }
    ]
  };

  /**
   * Create a new inspection request
   */
  async createInspectionRequest(request: InspectionRequest): Promise<InspectionDTO> {
    try {
      // Validate request data
      this.validateInspectionRequest(request);

      // Create inspection DTO
      const inspectionData: CreateInspectionDTO = {
        projectId: request.project_id,
        phaseId: request.phase_id,
        title: `Inspection - ${request.inspection_type}`,
        description: request.notes || '',
        inspector: request.requested_by,
        date: request.requested_date,
        status: 'requested' as InspectionStatus,
        priority: request.priority || 'medium',
        inspectionType: request.inspection_type,
        proposedDates: request.proposed_dates || []
      };

      // Create inspection
      const inspection = await this.inspectionService.createInspection(inspectionData);

      // Send notification to technical managers
      await this.notificationService.createNotification({
        recipient_id: 'system', // Will be resolved to actual technical managers
        title: 'Nouvelle demande d\'inspection',
        message: `Inspection ${request.inspection_type} demandée pour le projet ${request.project_id}`,
        type: 'inspection_request',
        related_id: inspection.id,
        metadata: {
          inspection_id: inspection.id,
          project_id: request.project_id,
          inspection_type: request.inspection_type,
          priority: request.priority || 'medium'
        }
      });

      return inspection;
    } catch (error) {
      console.error('Error creating inspection request:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la création de la demande d\'inspection'
      );
    }
  }

  /**
   * Schedule an inspection
   */
  async scheduleInspection(schedule: InspectionSchedule): Promise<InspectionDTO> {
    try {
      // Validate transition
      await this.validateWorkflowTransition(schedule.inspection_id, 'scheduled', ['technical_manager', 'inspector']);

      // Update inspection with schedule details
      const updateData: UpdateInspectionDTO = {
        id: schedule.inspection_id,
        date: schedule.scheduled_date,
        inspector: schedule.inspector_id,
        status: 'in_progress' as InspectionStatus,
        notes: schedule.notes || ''
      };

      const inspection = await this.inspectionService.updateInspection(schedule.inspection_id, updateData);

      if (!inspection) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Inspection non trouvée');
      }

      // Send notification to inspector
      await this.notificationService.createNotification({
        recipient_id: schedule.inspector_id,
        title: 'Inspection programmée',
        message: `Inspection programmée pour le ${schedule.scheduled_date}`,
        type: 'inspection_scheduled',
        related_id: schedule.inspection_id,
        metadata: {
          inspection_id: schedule.inspection_id,
          scheduled_date: schedule.scheduled_date,
          location: schedule.location
        }
      });

      return inspection;
    } catch (error) {
      console.error('Error scheduling inspection:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la programmation de l\'inspection'
      );
    }
  }

  /**
   * Execute an inspection
   */
  async executeInspection(execution: InspectionExecution): Promise<InspectionDTO> {
    try {
      // Validate transition
      await this.validateWorkflowTransition(execution.inspection_id, 'completed', ['inspector']);

      // Update inspection with execution details
      const updateData: UpdateInspectionDTO = {
        id: execution.inspection_id,
        status: 'completed' as InspectionStatus,
        notes: execution.findings || '',
        completedAt: execution.completed_at || new Date().toISOString()
      };

      const inspection = await this.inspectionService.updateInspection(execution.inspection_id, updateData);

      if (!inspection) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Inspection non trouvée');
      }

      // Send notification for review
      await this.notificationService.createNotification({
        recipient_id: 'system', // Will be resolved to engineers
        title: 'Inspection terminée - En attente de validation',
        message: `Inspection ${execution.inspection_id} terminée, en attente de validation`,
        type: 'inspection_completed',
        related_id: execution.inspection_id,
        metadata: {
          inspection_id: execution.inspection_id,
          completed_at: execution.completed_at,
          non_conformities: execution.non_conformities?.length || 0
        }
      });

      return inspection;
    } catch (error) {
      console.error('Error executing inspection:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de l\'exécution de l\'inspection'
      );
    }
  }

  /**
   * Review an inspection
   */
  async reviewInspection(review: InspectionReview): Promise<InspectionDTO> {
    try {
      // Validate transition
      await this.validateWorkflowTransition(review.inspection_id, review.decision, ['engineer', 'technical_manager']);

      // Update inspection with review decision
      const updateData: UpdateInspectionDTO = {
        id: review.inspection_id,
        status: review.decision as InspectionStatus,
        notes: review.comments || ''
      };

      const inspection = await this.inspectionService.updateInspection(review.inspection_id, updateData);

      if (!inspection) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Inspection non trouvée');
      }

      // Send notification based on decision
      const notificationTitle = review.decision === 'approved' ? 'Inspection approuvée' : 'Inspection requiert des modifications';
      const notificationMessage = review.decision === 'approved' 
        ? `Inspection ${review.inspection_id} a été approuvée`
        : `Inspection ${review.inspection_id} requiert des modifications: ${review.required_changes?.join(', ')}`;

      await this.notificationService.createNotification({
        recipient_id: 'system', // Will be resolved to inspector
        title: notificationTitle,
        message: notificationMessage,
        type: 'inspection_reviewed',
        related_id: review.inspection_id,
        metadata: {
          inspection_id: review.inspection_id,
          decision: review.decision,
          reviewed_by: review.reviewed_by,
          required_changes: review.required_changes
        }
      });

      return inspection;
    } catch (error) {
      console.error('Error reviewing inspection:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la révision de l\'inspection'
      );
    }
  }

  /**
   * Get required documents for inspection type
   */
  getRequiredDocuments(inspectionType: string): RequiredDocument[] {
    return this.requiredDocumentsByType[inspectionType] || this.requiredDocumentsByType['regular'];
  }

  /**
   * Get available transitions for current status
   */
  getAvailableTransitions(currentStatus: InspectionWorkflowStatus, userRole: string): WorkflowTransition[] {
    return this.workflowTransitions.filter(
      transition => transition.from === currentStatus && transition.requiredRole.includes(userRole)
    );
  }

  /**
   * Validate inspection request data
   */
  private validateInspectionRequest(request: InspectionRequest): void {
    if (!request.project_id) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'ID de projet requis');
    }

    if (!request.inspection_type) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Type d\'inspection requis');
    }

    if (!request.requested_by) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Demandeur requis');
    }

    if (!request.requested_date) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Date de demande requise');
    }
  }

  /**
   * Validate workflow transition
   */
  private async validateWorkflowTransition(
    inspectionId: string,
    targetStatus: InspectionWorkflowStatus,
    userRoles: string[]
  ): Promise<void> {
    // Get current inspection
    const inspection = await this.inspectionService.getInspectionById(inspectionId);
    
    if (!inspection) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Inspection non trouvée');
    }

    const currentStatus = inspection.status as InspectionWorkflowStatus;

    // Find valid transition
    const validTransition = this.workflowTransitions.find(
      transition => transition.from === currentStatus && 
                   transition.to === targetStatus &&
                   transition.requiredRole.some(role => userRoles.includes(role))
    );

    if (!validTransition) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Transition invalide de ${currentStatus} vers ${targetStatus} pour les rôles: ${userRoles.join(', ')}`
      );
    }

    // Check required documents if applicable
    if (validTransition.requiredDocuments) {
      // This would check if required documents are uploaded
      // Implementation depends on document service integration
      console.log(`Checking required documents: ${validTransition.requiredDocuments.join(', ')}`);
    }
  }

  // Factory function for getting service instance
  static getInspectionWorkflowService(): InspectionWorkflowService {
    return new InspectionWorkflowService();
  }
}

// Export types for consumers
export type {
  InspectionRequest,
  InspectionSchedule,
  InspectionExecution,
  InspectionReview,
  RequiredDocument,
  WorkflowTransition
};
