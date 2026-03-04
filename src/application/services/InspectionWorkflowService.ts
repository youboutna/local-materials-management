/**
 * Inspection Workflow Service - Hexagonal Architecture
 * Business logic for inspection workflow management
 * Handles transitions: request → schedule → execute → complete
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { InspectionService } from './InspectionService';
import { NotificationService } from './NotificationService';
import { DocumentService } from './DocumentService';
import {
  CreateInspectionDTO,
  UpdateInspectionDTO,
  InspectionStatus,
  InspectionPriority
} from '@/dtos/entities/InspectionDTO';

// Workflow status types
export type InspectionWorkflowStatus = 
  | 'requested'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'approved'
  | 'rejected'
  | 'requires_changes';

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

  // Workflow transitions configuration
  private workflowTransitions: WorkflowTransition[] = [
    {
      from: 'requested',
      to: 'scheduled',
      requiredRole: ['technical_manager', 'inspector']
    },
    {
      from: 'scheduled',
      to: 'in_progress',
      requiredRole: ['inspector']
    },
    {
      from: 'in_progress',
      to: 'completed',
      requiredRole: ['inspector']
    },
    {
      from: 'completed',
      to: 'approved',
      requiredRole: ['technical_manager', 'project_manager'],
      requiresApproval: true
    },
    {
      from: 'completed',
      to: 'rejected',
      requiredRole: ['technical_manager', 'project_manager'],
      requiresApproval: true
    },
    {
      from: 'completed',
      to: 'requires_changes',
      requiredRole: ['technical_manager', 'project_manager']
    }
  ];

  // Required documents by inspection type
  private requiredDocumentsByType: Record<string, RequiredDocument[]> = {
    'regular': [
      { type: 'pv_service_fait', label: 'PV de service fait', required: true, maxCount: 1, acceptedFormats: ['pdf'] },
      { type: 'photos', label: 'Photos de fin de travaux', required: true, minCount: 5, maxCount: 20, acceptedFormats: ['jpg', 'jpeg', 'png'] }
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

  async createInspectionRequest(request: InspectionRequest): Promise<CreateInspectionDTO> {
    try {
      this.validateInspectionRequest(request);

      const inspectionData = {
        projectId: request.project_id,
        phaseId: request.phase_id,
        title: `Inspection - ${request.inspection_type}`,
        description: request.notes || '',
        inspector: request.requested_by,
        date: request.requested_date,
        status: InspectionStatus.PENDING as string,
        priority: request.priority as InspectionPriority || 'medium'
      };

      const inspection = await this.inspectionService.createInspection(inspectionData as any);
      
      // Send notifications
      await this.notificationService.createNotification({
        recipient_id: 'technical_manager',
        title: 'Nouvelle demande d\'inspection',
        message: `Une inspection a été demandée pour le projet ${request.project_id}`,
        type: 'info'
      });
      
      return inspectionData as CreateInspectionDTO;
    } catch (error) {
      console.error('Error creating inspection request:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, "Erreur lors de la création de la demande d'inspection");
    }
  }

  async scheduleInspection(schedule: InspectionSchedule): Promise<UpdateInspectionDTO> {
    try {
      await this.validateWorkflowTransition(schedule.inspection_id, 'scheduled', ['technical_manager', 'inspector']);

      const updateData: UpdateInspectionDTO = {
        id: schedule.inspection_id,
        date: schedule.scheduled_date,
        inspector: schedule.inspector_id,
        status: InspectionStatus.IN_PROGRESS,
        notes: schedule.notes || ''
      };

      const inspection = await this.inspectionService.updateInspection(schedule.inspection_id, {
        id: schedule.inspection_id,
        date: schedule.scheduled_date,
        inspector: schedule.inspector_id,
        status: InspectionStatus.IN_PROGRESS as string,
        comments: schedule.notes || '',
        documents: []
      } as any);
      
      // Send notifications
      await this.notificationService.createNotification({
        recipient_id: 'technical_manager',
        title: 'Inspection planifiée',
        message: `L'inspection ${schedule.inspection_id} a été planifiée pour le ${schedule.scheduled_date}`,
        type: 'info'
      });

      return updateData;
    } catch (error) {
      console.error('Error scheduling inspection:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, "Erreur lors de la planification de l'inspection");
    }
  }

  async executeInspection(execution: InspectionExecution): Promise<UpdateInspectionDTO> {
    try {
      await this.validateWorkflowTransition(execution.inspection_id, 'in_progress', ['inspector']);

      const updateData: UpdateInspectionDTO = {
        id: execution.inspection_id,
        status: InspectionStatus.COMPLETED,
        notes: execution.findings || ''
      };

      const inspection = await this.inspectionService.updateInspection(execution.inspection_id, updateData as any);
      
      // Upload documents if provided
      if (execution.non_conformities && execution.non_conformities.length > 0) {
        // TODO: Implement document upload for non-conformities
        console.log('Non-conformities to document:', execution.non_conformities);
      }

      // Send notifications
      await this.notificationService.createNotification({
        recipient_id: 'technical_manager',
        title: 'Inspection terminée',
        message: `L'inspection ${execution.inspection_id} a été terminée`,
        type: 'info'
      });

      return updateData;
    } catch (error) {
      console.error('Error executing inspection:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, "Erreur lors de l'exécution de l'inspection");
    }
  }

  async reviewInspection(review: InspectionReview): Promise<UpdateInspectionDTO> {
    try {
      const targetStatus = review.decision === 'approved' ? 'approved' : 
                        review.decision === 'rejected' ? 'rejected' : 'requires_changes';
      
      await this.validateWorkflowTransition(review.inspection_id, targetStatus, ['technical_manager', 'project_manager']);

      const updateData: UpdateInspectionDTO = {
        id: review.inspection_id,
        status: review.decision === 'approved' ? InspectionStatus.APPROVED :
               review.decision === 'rejected' ? InspectionStatus.REJECTED :
               InspectionStatus.REQUIRES_CHANGES,
        notes: review.comments || ''
      };

      const inspection = await this.inspectionService.updateInspection(review.inspection_id, {
        id: review.inspection_id,
        status: review.decision === 'approved' ? InspectionStatus.APPROVED :
               review.decision === 'rejected' ? InspectionStatus.REJECTED :
               InspectionStatus.REQUIRES_CHANGES,
        comments: review.comments || '',
        documents: []
      });
      
      // Prepare notification data
      const notificationTitle = review.decision === 'approved' ? 'Inspection approuvée' :
                              review.decision === 'rejected' ? 'Inspection rejetée' :
                              'Inspection requiert des modifications';
      
      const notificationMessage = review.decision === 'approved' ? 
        `L'inspection ${review.inspection_id} a été approuvée` :
        review.decision === 'rejected' ?
        `L'inspection ${review.inspection_id} a été rejetée` :
        `L'inspection ${review.inspection_id} requiert des modifications`;

      // Send notifications
      await this.notificationService.createNotification({
        recipient_id: 'technical_manager',
        title: notificationTitle,
        message: notificationMessage,
        type: 'info'
      });

      return updateData;
    } catch (error) {
      console.error('Error reviewing inspection:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, "Erreur lors de la révision de l'inspection");
    }
  }

  getRequiredDocuments(inspectionType: string): RequiredDocument[] {
    return this.requiredDocumentsByType[inspectionType] || this.requiredDocumentsByType['regular'];
  }

  // Static methods for backward compatibility
  static getRequiredDocuments(inspectionType: string): RequiredDocument[] {
    const service = new InspectionWorkflowService();
    return service.getRequiredDocuments(inspectionType);
  }

  static async createInspectionRequest(request: InspectionRequest): Promise<CreateInspectionDTO> {
    const service = new InspectionWorkflowService();
    return service.createInspectionRequest(request);
  }

  static async scheduleInspection(schedule: InspectionSchedule): Promise<UpdateInspectionDTO> {
    const service = new InspectionWorkflowService();
    return service.scheduleInspection(schedule);
  }

  getAvailableTransitions(currentStatus: InspectionWorkflowStatus, userRole: string): WorkflowTransition[] {
    return this.workflowTransitions.filter(
      transition => transition.from === currentStatus && transition.requiredRole.includes(userRole)
    );
  }

  private validateInspectionRequest(request: InspectionRequest): void {
    if (!request.project_id) throw new AppError(ErrorCode.VALIDATION_ERROR, 'ID de projet requis');
    if (!request.inspection_type) throw new AppError(ErrorCode.VALIDATION_ERROR, "Type d'inspection requis");
    if (!request.requested_by) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Demandeur requis');
    if (!request.requested_date) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Date de demande requise');
  }

  private async validateWorkflowTransition(
    inspectionId: string, 
    targetStatus: string, 
    userRoles: string[]
  ): Promise<void> {
    const inspection = await this.inspectionService.getInspectionById(inspectionId);
    if (!inspection) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Inspection non trouvée');
    }

    const currentStatus = inspection.status;
    const validTransition = this.workflowTransitions.find(
      t => t.from === currentStatus as string && t.to === targetStatus
    );

    if (!validTransition) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Transition de workflow non valide');
    }

    const hasRequiredRole = userRoles.some(role => validTransition.requiredRole.includes(role));
    if (!hasRequiredRole) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Rôle requis pour cette transition');
    }
  }
}
