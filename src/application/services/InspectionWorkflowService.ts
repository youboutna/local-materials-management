/**
 * Inspection Workflow Service - Hexagonal Architecture
 * Business logic for inspection workflow management
 * Handles transitions: request → schedule → execute → complete
 * 
 * ✅ Utilise les DTOs pour les données
 * ✅ Injection de dépendances via constructeur
 * ✅ Gestion des erreurs avec AppError
 * ✅ Pas de supabase direct
 * ✅ Séparation des responsabilités
 */

import {
  CreateInspectionDTO,
  InspectionPriority,
  InspectionStatus,
  UpdateInspectionDTO
} from '@/dtos/entities/InspectionDTO';
import { InspectionType } from '@/dtos/entities/InspectionDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { DocumentService } from './DocumentService';
import { InspectionService } from './InspectionService';
import { NotificationService } from './NotificationService';
import { getEmployeeService } from './EmployeeService';
import { INSPECTION_WORKFLOW_TRANSITIONS, INSPECTION_REQUIRED_DOCUMENTS } from '@/config/referentials/inspections/inspection-workflow.referential';

// ============================================================================
// TYPES
// ============================================================================

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
  projectId: string;
  phaseId?: string;
  stepId?: string;
  inspectionType: string;
  requestedBy: string;
  requestedDate: string;
  proposedDates?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

export interface InspectionSchedule {
  inspectionId: string;
  scheduledDate: string;
  scheduledTime: string;
  inspectorId: string;
  location?: string;
  notes?: string;
}

export interface InspectionExecution {
  inspectionId: string;
  startedAt: string;
  completedAt?: string;
  findings?: string;
  recommendations?: string;
  nonConformities?: Array<{
    description: string;
    severity: 'minor' | 'major' | 'critical';
    actionRequired: string;
  }>;
}

export interface InspectionReview {
  inspectionId: string;
  reviewedBy: string;
  reviewedAt: string;
  decision: 'approved' | 'rejected' | 'requires_changes';
  comments?: string;
  requiredChanges?: string[];
}

// ============================================================================
// SERVICE
// ============================================================================

export class InspectionWorkflowService {
  private inspectionService: InspectionService;
  private notificationService: NotificationService;
  private documentService: DocumentService;

  constructor(
    inspectionService?: InspectionService,
    notificationService?: NotificationService,
    documentService?: DocumentService
  ) {
    this.inspectionService = inspectionService || new InspectionService(
      RepositoryFactory.getInspectionRepository()
    );
    this.notificationService = notificationService || new NotificationService(
      RepositoryFactory.getNotificationRepository()
    );
    this.documentService = documentService || new DocumentService(
      RepositoryFactory.getDocumentRepository()
    );
  }

  // ============================================================================
  // WORKFLOW TRANSITIONS CONFIGURATION
  // ============================================================================

  private workflowTransitions = INSPECTION_WORKFLOW_TRANSITIONS;
  private requiredDocumentsByType = INSPECTION_REQUIRED_DOCUMENTS;

  // ============================================================================
  // WORKFLOW OPERATIONS
  // ============================================================================

  /**
   * Create an inspection request
   */
  async createInspectionRequest(request: InspectionRequest): Promise<CreateInspectionDTO> {
    try {
      this.validateInspectionRequest(request);

      const inspectionData: CreateInspectionDTO = {
        projectId: request.projectId,
        phaseId: request.phaseId,
        stepId: request.stepId,
        title: `Inspection - ${request.inspectionType}`,
        description: request.notes || '',
        inspector: request.requestedBy,
        date: request.requestedDate,
        status: InspectionStatus.PENDING,
        priority: request.priority as InspectionPriority || InspectionPriority.MEDIUM,
        type: request.inspectionType as InspectionType
      };

      const inspection = await this.inspectionService.createInspection(inspectionData as never);
      
      // Send notifications
      await this.sendWorkflowNotification(
        'Nouvelle demande d\'inspection',
        `Une inspection a été demandée pour le projet ${request.projectId}`,
        'info', inspection
      );
      
      return { ...inspectionData, id: inspection.id };
    } catch (error) {
      console.error('Error creating inspection request:', error);
      throw error instanceof AppError ? error : new AppError(
        ErrorCode.DATABASE_ERROR,
        "Erreur lors de la création de la demande d'inspection"
      );
    }
  }

  /**
   * Schedule an inspection
   */
  async scheduleInspection(schedule: InspectionSchedule): Promise<UpdateInspectionDTO> {
    try {
      if (!schedule.inspectionId || !schedule.inspectorId || !Number.isFinite(Date.parse(schedule.scheduledDate))) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection, inspector and valid date are required');
      }
      await this.validateWorkflowTransition(schedule.inspectionId, 'scheduled', ['technical_manager', 'inspector']);

      const updateData: UpdateInspectionDTO = {
        id: schedule.inspectionId,
        date: schedule.scheduledDate,
        inspector: schedule.inspectorId,
        status: InspectionStatus.SCHEDULED,
        comments: schedule.notes || ''
      };

      const inspection = await this.inspectionService.updateInspection(schedule.inspectionId, updateData as never);
      
      await this.sendWorkflowNotification(
        'Inspection planifiée',
        `L'inspection ${schedule.inspectionId} a été planifiée pour le ${schedule.scheduledDate}`,
        'info', inspection
      );

      return updateData;
    } catch (error) {
      console.error('Error scheduling inspection:', error);
      throw error instanceof AppError ? error : new AppError(
        ErrorCode.DATABASE_ERROR,
        "Erreur lors de la planification de l'inspection"
      );
    }
  }

  /**
   * Execute an inspection
   */
  async executeInspection(execution: InspectionExecution): Promise<UpdateInspectionDTO> {
    try {
      await this.validateWorkflowTransition(execution.inspectionId, 'in_progress', ['inspector']);

      // Non-conformities have no dedicated table/columns in the schema, so
      // they are persisted as structured text appended to the inspection's
      // comments field (the only writable free-text field available on the
      // inspection) to keep the information queryable via existing adapters.
      const nonConformitiesText = execution.nonConformities && execution.nonConformities.length > 0
        ? '\n\nNon-conformités:\n' + execution.nonConformities
            .map(nc => `- [${nc.severity}] ${nc.description} (Action requise: ${nc.actionRequired})`)
            .join('\n')
        : '';

      const updateData: UpdateInspectionDTO = {
        id: execution.inspectionId,
        status: InspectionStatus.COMPLETED,
        comments: (execution.findings || '') + nonConformitiesText,
        progressAtInspection: 100
      };

      const inspection = await this.inspectionService.updateInspection(execution.inspectionId, updateData as never);

      await this.sendWorkflowNotification(
        'Inspection terminée',
        `L'inspection ${execution.inspectionId} a été terminée`,
        'info', inspection
      );

      return updateData;
    } catch (error) {
      console.error('Error executing inspection:', error);
      throw error instanceof AppError ? error : new AppError(
        ErrorCode.DATABASE_ERROR,
        "Erreur lors de l'exécution de l'inspection"
      );
    }
  }

  /**
   * Review an inspection
   */
  async reviewInspection(review: InspectionReview): Promise<UpdateInspectionDTO> {
    try {
      const targetStatus = review.decision === 'approved' ? 'approved' : 
                        review.decision === 'rejected' ? 'rejected' : 'requires_changes';
      
      await this.validateWorkflowTransition(review.inspectionId, targetStatus, ['technical_manager', 'project_manager']);

      const updateData: UpdateInspectionDTO = {
        id: review.inspectionId,
        status: review.decision === 'approved' ? InspectionStatus.APPROVED :
               review.decision === 'rejected' ? InspectionStatus.REJECTED :
               InspectionStatus.REQUIRES_CHANGES,
        comments: review.comments || ''
      };

      const inspection = await this.inspectionService.updateInspection(review.inspectionId, updateData as never);
      
      const notificationTitle = review.decision === 'approved' ? 'Inspection approuvée' :
                              review.decision === 'rejected' ? 'Inspection rejetée' :
                              'Inspection requiert des modifications';
      
      const notificationMessage = review.decision === 'approved' ? 
        `L'inspection ${review.inspectionId} a été approuvée` :
        review.decision === 'rejected' ?
        `L'inspection ${review.inspectionId} a été rejetée` :
        `L'inspection ${review.inspectionId} requiert des modifications`;

      await this.sendWorkflowNotification(notificationTitle, notificationMessage, 'info', inspection);

      return updateData;
    } catch (error) {
      console.error('Error reviewing inspection:', error);
      throw error instanceof AppError ? error : new AppError(
        ErrorCode.DATABASE_ERROR,
        "Erreur lors de la révision de l'inspection"
      );
    }
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Get required documents for an inspection type
   */
  getRequiredDocuments(inspectionType: string): RequiredDocument[] {
    return this.requiredDocumentsByType[inspectionType] || this.requiredDocumentsByType['regular'];
  }

  /**
   * Get available transitions for a status and user role
   */
  getAvailableTransitions(
    currentStatus: InspectionWorkflowStatus,
    userRole: string
  ): WorkflowTransition[] {
    return this.workflowTransitions.filter(
      transition => transition.from === currentStatus && transition.requiredRole.includes(userRole)
    );
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Validate inspection request
   */
  private validateInspectionRequest(request: InspectionRequest): void {
    if (!request.projectId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'ID de projet requis');
    }
    if (!request.inspectionType) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Type d'inspection requis");
    }
    if (!request.requestedBy) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Demandeur requis');
    }
    if (!request.requestedDate) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Date de demande requise');
    }
  }

  /**
   * Validate workflow transition
   */
  private async validateWorkflowTransition(
    inspectionId: string, 
    targetStatus: string, 
    userRoles: string[]
  ): Promise<void> {
    const inspection = await this.inspectionService.getInspectionById(inspectionId);
    if (!inspection) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Inspection non trouvée');
    }

    const currentStatus = String(inspection.status).replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    const validTransition = this.workflowTransitions.find(
      t => t.from === currentStatus && t.to === targetStatus
    );

    if (!validTransition) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Transition de workflow non valide: ${currentStatus} -> ${targetStatus}`
      );
    }

    const hasRequiredRole = userRoles.some(role => validTransition.requiredRole.includes(role));
    if (!hasRequiredRole) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Rôle requis pour cette transition: ${validTransition.requiredRole.join(', ')}`
      );
    }
  }

  /**
   * Send workflow notification
   */
  private async sendWorkflowNotification(
    title: string,
    message: string,
    type: 'info' | 'warning' | 'success' | 'error',
    inspection: import('@/domain/entities/Inspection').Inspection
  ): Promise<void> {
    try {
      const inspectorId = inspection.inspector.employeeId ?? inspection.inspector.id ?? inspection.inspector.name;
      const employee = inspectorId ? await getEmployeeService().getEmployeeById(inspectorId) : null;
      const recipientId = employee?.userId;
      if (!recipientId) {
        console.warn('Inspection notification has no linked user', { inspectionId: inspection.id });
        return;
      }
      await this.notificationService.createNotification({
        recipientId,
        projectId: inspection.projectId,
        phaseId: inspection.phaseId,
        title,
        message,
        type: type as any,
        metadata: {
          source: 'InspectionWorkflowService'
        }
      });
    } catch (error) {
      console.error('Error sending workflow notification:', error);
      // Don't throw - notification failure shouldn't block workflow
    }
  }

  // ============================================================================
  // STATIC METHODS FOR BACKWARD COMPATIBILITY
  // ============================================================================

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

  static async executeInspection(execution: InspectionExecution): Promise<UpdateInspectionDTO> {
    const service = new InspectionWorkflowService();
    return service.executeInspection(execution);
  }

  static async reviewInspection(review: InspectionReview): Promise<UpdateInspectionDTO> {
    const service = new InspectionWorkflowService();
    return service.reviewInspection(review);
  }

  static getAvailableTransitions(
    currentStatus: InspectionWorkflowStatus,
    userRole: string
  ): WorkflowTransition[] {
    const service = new InspectionWorkflowService();
    return service.getAvailableTransitions(currentStatus, userRole);
  }
}

export default InspectionWorkflowService;

let inspectionWorkflowServiceInstance: InspectionWorkflowService | null = null;
export function getInspectionWorkflowService(): InspectionWorkflowService {
  if (!inspectionWorkflowServiceInstance) {
    inspectionWorkflowServiceInstance = new InspectionWorkflowService();
  }
  return inspectionWorkflowServiceInstance;
}
