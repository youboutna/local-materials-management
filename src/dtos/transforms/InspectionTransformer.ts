/**
 * Inspection Transformer - Hexagonal Architecture
 * Transforms between Inspection entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 * Includes functionality from InspectionDomainTransformer
 */

import { Inspection, InspectionStatus as DomainInspectionStatus } from '@/domain/entities/Inspection';
import { InspectionDTO, CreateInspectionDTO, UpdateInspectionDTO, InspectionType, InspectionPriority, InspectionStatus } from '@/dtos/entities/InspectionDTO';
import { DocumentTransformer } from '@/dtos/transforms/DocumentTransformer';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';

export class InspectionTransformer {
  /**
   * Batch: DTOs → Domain Entities
   */
  static manyFromDTO(dtos: InspectionDTO[]): Inspection[] {
    return dtos.map(dto => this.toEntity(dto));
  }

  /**
   * Batch: Domain Entities → DTOs
   */
  static manyToDTO(inspections: Inspection[]): InspectionDTO[] {
    return inspections.map(inspection => this.toDTO(inspection));
  }

  /**
   * Transform Inspection entity to InspectionDTO (Domain Entity → DTO)
   * Converts domain entity to data transfer object for UI layer
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toDTO(entity: Inspection): InspectionDTO {
    // Map domain entity status to DTO enum values
    const statusMapping: Record<string, InspectionStatus> = {
      'Approved': InspectionStatus.APPROVED,
      'RequiresChanges': InspectionStatus.REQUIRES_CHANGES,
      'Rejected': InspectionStatus.REJECTED,
      'Pending': InspectionStatus.PENDING,
      'Completed': InspectionStatus.COMPLETED,
      'InProgress': InspectionStatus.IN_PROGRESS,
      'Scheduled': InspectionStatus.SCHEDULED,
      'Cancelled': InspectionStatus.CANCELLED,
      'Requested': InspectionStatus.PENDING, // Map to pending
    };

    return {
      id: entity.id,
      title: `Inspection ${entity.id}`, // Default title since entity doesn't have one
      description: entity.comments, // Use comments as description
      type: InspectionType.ROUTINE, // Use proper enum value
      status: statusMapping[entity.status] || InspectionStatus.PENDING,
      priority: InspectionPriority.MEDIUM, // Use proper enum value
      inspector: entity.inspector?.id,
      inspectorName: entity.inspector?.name,
      inspectorRole: entity.inspector?.type,
      scheduledDate: undefined, // Not available in entity
      actualDate: entity.date, // No toISOString needed - already string
      duration: undefined, // Not available in entity
      startTime: undefined, // Not available in entity
      endTime: undefined, // Not available in entity
      progress: entity.progress || entity.progressAtInspection || 0,
      progressAtInspection: entity.progressAtInspection,
      location: undefined, // Not available in entity
      siteConditions: undefined, // Not available in entity
      weatherConditions: undefined, // Not available in entity
      projectId: entity.projectId,
      phaseId: entity.phaseId,
      taskId: entity.stepId, // Map stepId to taskId
      recommendations: [], // Not available in entity
      actionItems: [], // Not available in entity
      complianceStatus: undefined, // Not available in entity
      qualityRating: undefined, // Not available in entity
      documents: entity.documents?.map(doc => doc.id) || [], // DTO expects string[] of document IDs
      attachments: [], // Not available in entity
      createdAt: entity.createdAt.toISOString(), // Convert Date to string
      updatedAt: entity.updatedAt.toISOString(), // Convert Date to string
    };
  }

  /**
   * Transform InspectionDTO to Inspection entity (DTO → Domain Entity)
   * Converts data transfer object to domain entity
   * Following hexagonal architecture: Presentation → Application → Domain
   */
  static toEntity(dto: InspectionDTO): Inspection {
    // Map DTO status to domain status
    const dtoToDomainStatus: Record<string, DomainInspectionStatus> = {
      'approved': DomainInspectionStatus.Approved,
      'requires_changes': DomainInspectionStatus.RequiresChanges,
      'rejected': DomainInspectionStatus.Rejected,
      'pending': DomainInspectionStatus.Pending,
      'completed': DomainInspectionStatus.Completed,
      'in_progress': DomainInspectionStatus.InProgress,
      'scheduled': DomainInspectionStatus.Scheduled,
      'cancelled': DomainInspectionStatus.Cancelled
    };

    const domainStatus = dtoToDomainStatus[dto.status] || DomainInspectionStatus.Pending;

    return Inspection.create({
      id: dto.id,
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      date: dto.actualDate || dto.date || '',
      inspector: dto.inspector ? {
        id: dto.inspector,
        name: dto.inspectorName || '',
        agency: '', // Required field, default empty
        type: (dto.inspectorRole as 'employee' | 'supplier' | 'external') || 'employee'
      } : { // Provide default inspector instead of undefined
        id: 'unknown',
        name: 'Unknown Inspector',
        agency: '',
        type: 'employee' as const
      },
      status: domainStatus,
      progressAtInspection: dto.progressAtInspection || 0,
      comments: dto.description || dto.comments || '',
      completedAt: dto.actualDate || dto.date,
      completedBy: dto.inspector || 'system'
    });
  }

  /**
   * Transform CreateInspectionDTO to Inspection entity
   */
  static fromCreateDTOToEntity(dto: CreateInspectionDTO): Inspection {
    return Inspection.create({
      id: dto.id || crypto.randomUUID(),
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      date: dto.date || '',
      inspector: dto.inspector ? { 
        id: dto.inspector, 
        name: '', // No name available in create DTO
        agency: '', // Required field, default empty
        type: 'employee' as const // Default type for create
      } : { 
        id: '', 
        name: 'Unknown Inspector', 
        agency: '', 
        type: 'employee' as const 
      }, // Provide default inspector instead of undefined
      status: dto.status ? Inspection.mapStringToStatus(dto.status) : DomainInspectionStatus.Scheduled,
      progressAtInspection: dto.progressAtInspection || 0,
      comments: dto.comments || '',
      completedAt: dto.date, // Use date as completed date for now
      completedBy: 'system' // Default value since createdBy doesn't exist in CreateInspectionDTO
    });
  }

  /**
   * Transform UpdateInspectionDTO to update object for domain entity
   * Returns an object with properties to update, not a partial entity
   */
  static fromUpdateDTOToEntity(dto: UpdateInspectionDTO): Record<string, unknown> {
    const updateData: Record<string, unknown> = {};

    if (dto.projectId !== undefined) updateData.projectId = dto.projectId;
    if (dto.phaseId !== undefined) updateData.phaseId = dto.phaseId;
    if (dto.date !== undefined) updateData.date = dto.date;

    // Handle inspector - can be string or Inspector object
    if (dto.inspector !== undefined) {
      if (typeof dto.inspector === 'string') {
        // If inspector is a string, create Inspector object
        updateData.inspector = {
          id: dto.inspector,
          name: dto.title || 'Unknown Inspector', // Use title or default
          agency: '', // Required field, default empty
          type: (dto.inspectorRole as 'employee' | 'supplier' | 'external') || 'employee'
        };
      } else {
        // If inspector is already an object, use it
        updateData.inspector = dto.inspector;
      }
    }

    if (dto.status !== undefined) {
      // Map DTO status to domain status
      const dtoToDomainStatus: Record<string, DomainInspectionStatus> = {
        'approved': DomainInspectionStatus.Approved,
        'requires_changes': DomainInspectionStatus.RequiresChanges,
        'rejected': DomainInspectionStatus.Rejected,
        'pending': DomainInspectionStatus.Pending,
        'completed': DomainInspectionStatus.Completed,
        'in_progress': DomainInspectionStatus.InProgress,
        'scheduled': DomainInspectionStatus.Scheduled,
        'cancelled': DomainInspectionStatus.Cancelled
      };
      updateData.status = dtoToDomainStatus[dto.status] || DomainInspectionStatus.Pending;
    }

    if (dto.progressAtInspection !== undefined) updateData.progressAtInspection = dto.progressAtInspection;
    if (dto.comments !== undefined) updateData.comments = dto.comments;

    if (dto.documents !== undefined) {
      // Document IDs are stored separately; not directly on the Inspection entity
      updateData.documentIds = dto.documents || [];
    }

    // Always update the timestamp
    updateData.updatedAt = new Date().toISOString();

    return updateData;
  }

  /**
   * Validate inspection data for business rules
   */
  static validateInspectionData(inspection: Partial<Inspection>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!inspection.projectId || (typeof inspection.projectId === 'string' && inspection.projectId.trim() === '')) {
      errors.push('Project ID is required');
    }

    if (!inspection.inspector) {
      errors.push('Inspector is required');
    } else if (inspection.inspector && (!inspection.inspector.id || inspection.inspector.id.trim() === '')) {
      errors.push('Inspector ID is required');
    }

    if (!inspection.date) {
      errors.push('Inspection date is required');
    } else if (new Date(inspection.date) > new Date()) {
      errors.push('Inspection date cannot be in the future');
    }

    if (inspection.progressAtInspection !== undefined && (inspection.progressAtInspection < 0 || inspection.progressAtInspection > 100)) {
      errors.push('Progress at inspection must be between 0 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if inspection is overdue
   */
  static isOverdue(inspection: Inspection): boolean {
    const inspectionDate = new Date(inspection.date);
    const now = new Date();
    return inspectionDate < now && inspection.status === DomainInspectionStatus.Scheduled;
  }

  /**
   * Get inspection priority based on status and date
   */
  static getPriority(inspection: Inspection): 'high' | 'medium' | 'low' {
    if (inspection.status === DomainInspectionStatus.RequiresChanges || inspection.status === DomainInspectionStatus.Rejected) {
      return 'high';
    }
    
    if (InspectionTransformer.isOverdue(inspection)) {
      return 'high';
    }
    
    if (inspection.status === DomainInspectionStatus.InProgress) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Calculate inspection score based on results
   */
  static calculateScore(inspection: Inspection): number {
    let score = 100; // Start with perfect score
    
    // Deduct points based on status
    switch (inspection.status) {
      case DomainInspectionStatus.Rejected:
        score -= 50;
        break;
      case DomainInspectionStatus.RequiresChanges:
        score -= 30;
        break;
      case DomainInspectionStatus.Cancelled:
        score -= 20;
        break;
      case DomainInspectionStatus.Completed:
        // No deduction for completed
        break;
      case DomainInspectionStatus.Approved:
        score += 10; // Bonus for approval
        break;
    }
    
    // Deduct points for overdue inspections
    if (InspectionTransformer.isOverdue(inspection)) {
      score -= 20;
    }
    
    // Deduct points for missing comments when required
    if (inspection.status === DomainInspectionStatus.RequiresChanges && !inspection.comments) {
      score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  // EntityToDTOMapper interface implementation
  toDTO(entity: Inspection): InspectionDTO {
    return InspectionTransformer.toDTO(entity);
  }

  fromDTO(dto: InspectionDTO): Inspection {
    return InspectionTransformer.toEntity(dto);
  }

  fromEntityToDTO(entity: Inspection): InspectionDTO {
    return InspectionTransformer.toDTO(entity);
  }

  fromDtosToAdapter(dtos: InspectionDTO[]): InspectionDTO[] {
    return dtos;
  }

  toResponseDto(entity: Inspection): InspectionDTO {
    return InspectionTransformer.toDTO(entity);
  }

  toRequestDto(dto: InspectionDTO): InspectionDTO {
    return dto;
  }

  toUpdateDto(dto: InspectionDTO): Partial<InspectionDTO> {
    return {
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      date: dto.date,
      inspector: dto.inspector,
      status: dto.status,
      progressAtInspection: dto.progressAtInspection,
      comments: dto.comments,
      documents: dto.documents
    };
  }

  validate(dto: InspectionDTO): ValidationResult {
    const inspection = InspectionTransformer.toEntity(dto);
    const validation = InspectionTransformer.validateInspectionData(inspection);
    return {
      isValid: validation.isValid,
      errors: validation.errors
    };
  }

  toDTOs(entities: Inspection[]): InspectionDTO[] {
    return entities.map(entity => InspectionTransformer.toDTO(entity));
  }

  /**
   * Status Workflow Management
   * Validates and manages inspection status transitions
   */
  static validateStatusTransition(currentStatus: InspectionStatus, newStatus: InspectionStatus): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Define allowed transitions
    const allowedTransitions: Record<InspectionStatus, InspectionStatus[]> = {
      [InspectionStatus.SCHEDULED]: [InspectionStatus.IN_PROGRESS, InspectionStatus.CANCELLED],
      [InspectionStatus.PENDING]: [InspectionStatus.IN_PROGRESS, InspectionStatus.CANCELLED],
      [InspectionStatus.PLANNED]: [InspectionStatus.IN_PROGRESS, InspectionStatus.CANCELLED],
      [InspectionStatus.IN_PROGRESS]: [InspectionStatus.COMPLETED, InspectionStatus.REQUIRES_CHANGES, InspectionStatus.CANCELLED],
      [InspectionStatus.COMPLETED]: [InspectionStatus.APPROVED, InspectionStatus.REQUIRES_CHANGES],
      [InspectionStatus.REQUIRES_REVIEW]: [InspectionStatus.APPROVED, InspectionStatus.REQUIRES_CHANGES, InspectionStatus.REJECTED],
      [InspectionStatus.REQUIRES_CHANGES]: [InspectionStatus.IN_PROGRESS, InspectionStatus.CANCELLED],
      [InspectionStatus.APPROVED]: [], // Final state
      [InspectionStatus.REJECTED]: [], // Final state
      [InspectionStatus.CANCELLED]: [] // Final state
    };

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      errors.push(`Transition de ${currentStatus} vers ${newStatus} n'est pas autorisée`);
    }

    // Business rule warnings
    if (currentStatus === InspectionStatus.REQUIRES_CHANGES && newStatus === InspectionStatus.APPROVED) {
      warnings.push('Approbation directe après modifications requises - vérifier la conformité');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Progress Tracking Enhancement
   * Calculates and validates progress updates with business rules
   */
  static calculateProgressUpdate(dto: Partial<InspectionDTO>): {
    progress: number;
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    let progress = dto.progress || dto.progressAtInspection || 0;

    // Business rules for progress updates
    if (dto.status === InspectionStatus.SCHEDULED && progress > 0) {
      errors.push('Une inspection planifiée ne peut pas avoir de progression');
      progress = 0;
    }

    if (dto.status === InspectionStatus.IN_PROGRESS && progress === 0) {
      suggestions.push('Une inspection en cours devrait avoir une progression > 0');
    }

    if (dto.status === InspectionStatus.COMPLETED && progress !== 100) {
      suggestions.push('Une inspection terminée devrait avoir 100% de progression');
      progress = 100;
    }

    if (dto.status === InspectionStatus.APPROVED && progress < 100) {
      errors.push('Une inspection approuvée doit avoir 100% de progression');
      progress = 100;
    }

    if (progress < 0 || progress > 100) {
      errors.push('La progression doit être comprise entre 0 et 100');
      progress = Math.max(0, Math.min(100, progress));
    }

    return {
      progress,
      isValid: errors.length === 0,
      errors,
      suggestions
    };
  }

  /**
   * Document Management for Inspections
   * Processes inspection documents with type classification
   */
  static processInspectionDocuments(documents: string[] | undefined): Array<{
    id: string;
    type: 'certificate' | 'checklist' | 'photo' | 'report' | 'scan';
    name: string;
    url: string;
    uploadedAt: string;
    required: boolean;
  }> {
    if (!documents || documents.length === 0) return [];

    const documentTypes = ['certificate', 'checklist', 'photo', 'report', 'scan'] as const;
    const requiredTypes = ['pv_service_fait', 'photos', 'geolocation', 'rapport_inspection'];

    return documents.map((docId, index) => {
      // Classify document type based on naming convention or index
      let type: typeof documentTypes[number] = 'other';
      let name = `Document ${docId}`;

      if (docId.includes('certificate') || docId.includes('certificat')) {
        type = 'certificate';
        name = 'Certificat de conformité';
      } else if (docId.includes('checklist') || docId.includes('liste')) {
        type = 'checklist';
        name = 'Liste de contrôle';
      } else if (docId.includes('photo') || docId.includes('image')) {
        type = 'photo';
        name = 'Photo d\'inspection';
      } else if (docId.includes('report') || docId.includes('rapport')) {
        type = 'report';
        name = 'Rapport d\'inspection';
      } else if (docId.includes('scan')) {
        type = 'scan';
        name = 'Document scanné';
      }

      return {
        id: docId,
        type,
        name,
        url: `/api/documents/${docId}`,
        uploadedAt: new Date().toISOString(),
        required: requiredTypes.some(required => docId.includes(required))
      };
    });
  }

  /**
   * Inspection Workflow Enhancement
   * Manages complete inspection workflow with validation
   */
  static processInspectionWorkflow(dto: CreateInspectionDTO): {
    inspection: Inspection;
    workflowValidation: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
      suggestions: string[];
    };
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate required fields
    if (!dto.projectId) {
      errors.push('L\'ID du projet est obligatoire');
    }

    if (!dto.date) {
      errors.push('La date d\'inspection est obligatoire');
    } else {
      const inspectionDate = new Date(dto.date);
      const now = new Date();
      if (inspectionDate < now && dto.status !== InspectionStatus.COMPLETED) {
        warnings.push('La date d\'inspection est dans le passé');
      }
    }

    // Status-specific validations
    if (dto.status === InspectionStatus.COMPLETED && (!dto.progress || dto.progress < 100)) {
      suggestions.push('Une inspection terminée devrait avoir 100% de progression');
    }

    // Document validation for completed inspections
    if (dto.status === InspectionStatus.COMPLETED && (!dto.documents || dto.documents.length === 0)) {
      warnings.push('Une inspection terminée devrait avoir des documents attachés');
    }

    // Create inspection entity
    const inspection = InspectionTransformer.fromCreateDTOToEntity(dto);

    return {
      inspection,
      workflowValidation: {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions
      }
    };
  }

  /**
   * Batch Inspection Processing
   * Processes multiple inspections with workflow validation
   */
  static processBulkInspections(dtos: CreateInspectionDTO[]): {
    inspections: Inspection[];
    results: Array<{
      index: number;
      success: boolean;
      errors: string[];
      warnings: string[];
      suggestions: string[];
    }>;
  } {
    const inspections: Inspection[] = [];
    const results: Array<{
      index: number;
      success: boolean;
      errors: string[];
      warnings: string[];
      suggestions: string[];
    }> = [];

    dtos.forEach((dto, index) => {
      try {
        const { inspection, workflowValidation } = InspectionTransformer.processInspectionWorkflow(dto);

        if (workflowValidation.isValid) {
          inspections.push(inspection);
          results.push({
            index,
            success: true,
            errors: [],
            warnings: workflowValidation.warnings,
            suggestions: workflowValidation.suggestions
          });
        } else {
          results.push({
            index,
            success: false,
            errors: workflowValidation.errors,
            warnings: workflowValidation.warnings,
            suggestions: workflowValidation.suggestions
          });
        }
      } catch (error) {
        results.push({
          index,
          success: false,
          errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
          warnings: [],
          suggestions: []
        });
      }
    });

    return { inspections, results };
  }

  /**
   * Inspection Analytics Generation
   * Generates analytics data for inspection performance
   */
  static generateInspectionAnalytics(inspections: InspectionDTO[]): {
    totalInspections: number;
    completedRate: number;
    averageDuration: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    overdueCount: number;
    qualityScore: number;
  } {
    const totalInspections = inspections.length;
    const completedInspections = inspections.filter(i => i.status === InspectionStatus.COMPLETED || i.status === InspectionStatus.APPROVED);
    const completedRate = totalInspections > 0 ? (completedInspections.length / totalInspections) * 100 : 0;

    // Calculate average duration (mock implementation)
    const averageDuration = 2.5; // hours

    // Status distribution
    const byStatus = inspections.reduce((acc, inspection) => {
      acc[inspection.status] = (acc[inspection.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Type distribution
    const byType = inspections.reduce((acc, inspection) => {
      acc[inspection.type] = (acc[inspection.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Overdue count
    const overdueCount = inspections.filter(inspection =>
      inspection.scheduledDate &&
      new Date(inspection.scheduledDate) < new Date() &&
      inspection.status !== InspectionStatus.COMPLETED &&
      inspection.status !== InspectionStatus.APPROVED
    ).length;

    // Quality score based on approved vs total completed
    const approvedCount = inspections.filter(i => i.status === InspectionStatus.APPROVED).length;
    const qualityScore = completedInspections.length > 0 ? (approvedCount / completedInspections.length) * 100 : 0;

    return {
      totalInspections,
      completedRate,
      averageDuration,
      byStatus,
      byType,
      overdueCount,
      qualityScore
    };
  }
}
