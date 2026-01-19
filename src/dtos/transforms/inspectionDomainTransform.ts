/**
 * Inspection Domain Transformer - Enhanced with Calculations and Business Logic
 * Integrates inspection calculations, validation, and UI-specific features
 * Following hexagonal architecture principles
 */

import { Inspection, InspectionStatus, InspectionDocument } from '@/domain/entities/Inspection';
import { InspectionDTO, InspectionDetails, CreateInspectionDTO } from '@/dtos/entities/InspectionDTO';
import { BaseEntityDTO, EntityToDTOMapper, ValidationResult } from '@/dtos/shared';
import { ProgressAnalytics, TimelineAnalytics } from '@/types/calculations';
import { calculateEquivalentOpening } from '@/utils/btpCalculations';

// Enhanced types for UI components
export interface InspectionResponseDto extends InspectionDTO {
  // Enhanced fields for UI
  inspectionAnalytics?: {
    completionRate: number;
    qualityScore: number;
    complianceScore: number;
    timeEfficiency: number;
  };
  riskAssessment?: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    recommendations: string[];
  };
  nextActions?: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    deadline?: string;
    assignedTo?: string;
  }>;
}

export interface CreateInspectionRequestDto extends Omit<InspectionDTO, 'id' | 'createdAt' | 'updatedAt'> {
  // Additional validation fields
  inspectionType?: 'routine' | 'milestone' | 'final' | 'special';
  priority?: 'low' | 'medium' | 'high';
  requiredDocuments?: string[];
  checklist?: Array<{
    item: string;
    required: boolean;
    completed: boolean;
    notes?: string;
  }>;
}

export interface UpdateInspectionRequestDto extends Partial<CreateInspectionRequestDto> {
  // Update-specific fields
  statusChangeReason?: string;
  completionNotes?: string;
  approvalNotes?: string;
  rejectionReason?: string;
}

export class InspectionDomainTransformer implements EntityToDTOMapper<Inspection, InspectionDTO> {
  
  toDTO(entity: Inspection): InspectionDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      phaseId: entity.phaseId || undefined,
      date: entity.date,
      inspector: entity.inspector,
      status: entity.status,
      progressAtInspection: entity.progressAtInspection,
      comments: entity.comments,
      documents: entity.documents.reduce((acc, doc) => {
        acc[doc.id] = {
          id: doc.id,
          name: doc.name,
          url: doc.url,
          type: doc.type,
          uploadedAt: doc.uploadedAt
        };
        return acc;
      }, {} as Record<string, unknown>),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  fromDTO(dto: InspectionDTO): Inspection {
    return new Inspection(
      dto.id,
      dto.projectId,
      dto.phaseId || null,
      null, // stepId - not in DTO
      dto.inspector,
      dto.date,
      dto.status,
      dto.progressAtInspection,
      dto.comments || null,
      Object.values(dto.documents || {}).map(doc => ({
        id: (doc as any).id,
        type: (doc as any).type,
        name: (doc as any).name,
        url: (doc as any).url,
        uploadedAt: (doc as any).uploadedAt
      })),
      dto.createdAt,
      dto.updatedAt
    );
  }

  fromEntityToDTO(entity: Inspection): InspectionResponseDto {
    const baseDTO = this.toDTO(entity);
    
    // Add enhanced UI features
    return {
      ...baseDTO,
      inspectionAnalytics: this.calculateInspectionAnalytics(entity),
      riskAssessment: this.assessInspectionRisk(entity),
      nextActions: this.generateNextActions(entity)
    };
  }

  fromDtosToAdapter(dtos: InspectionDTO[]): InspectionResponseDto[] {
    return dtos.map(dto => this.fromEntityToDTO(this.fromDTO(dto)));
  }

  toResponseDto(entity: Inspection): InspectionResponseDto {
    return this.fromEntityToDTO(entity);
  }

  toRequestDto(dto: CreateInspectionRequestDto): InspectionDTO {
    return {
      ...dto,
      id: '', // Will be generated
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'requested' as InspectionStatus
    };
  }

  toUpdateDto(dto: UpdateInspectionRequestDto): Partial<InspectionDTO> {
    return {
      ...dto,
      updatedAt: new Date().toISOString()
    };
  }

  validate(dto: InspectionDTO): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Required fields validation
    if (!dto.projectId || dto.projectId.trim() === '') {
      errors.push('Project ID is required');
      fieldErrors.projectId = ['Project ID is required'];
    }

    if (!dto.inspector || dto.inspector.trim() === '') {
      errors.push('Inspector name is required');
      fieldErrors.inspector = ['Inspector name is required'];
    }

    if (!dto.date) {
      errors.push('Inspection date is required');
      fieldErrors.date = ['Inspection date is required'];
    }

    // Progress validation
    if (dto.progressAtInspection < 0 || dto.progressAtInspection > 100) {
      errors.push('Progress at inspection must be between 0 and 100');
      fieldErrors.progressAtInspection = ['Progress at inspection must be between 0 and 100'];
    }

    // Date validation
    const inspectionDate = new Date(dto.date);
    const today = new Date();
    if (inspectionDate > today) {
      errors.push('Inspection date cannot be in the future');
      fieldErrors.date = ['Inspection date cannot be in the future'];
    }

    // Status-specific validation
    if (dto.status === 'completed' && !dto.comments) {
      errors.push('Comments are required for completed inspections');
      fieldErrors.comments = ['Comments are required for completed inspections'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  // Enhanced utility methods with calculations
  static calculateInspectionAnalytics(inspection: Inspection): any {
    const qualityScore = InspectionDomainTransformer.calculateQualityScore(inspection);
    const complianceScore = InspectionDomainTransformer.calculateComplianceScore(inspection);
    const timeEfficiency = InspectionDomainTransformer.calculateTimeEfficiency(inspection);

    return {
      completionRate: inspection.progressAtInspection,
      qualityScore,
      complianceScore,
      timeEfficiency
    };
  }

  static assessInspectionRisk(inspection: Inspection): any {
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    let level: 'low' | 'medium' | 'high' = 'low';

    // Progress-based risk
    if (inspection.progressAtInspection < 25) {
      riskFactors.push('Very early inspection - potential issues');
      recommendations.push('Verify project readiness');
      level = 'medium';
    }

    // Status-based risk
    if (inspection.status === 'rejected' || inspection.status === 'requires_changes') {
      riskFactors.push('Inspection issues found');
      recommendations.push('Immediate corrective actions required');
      level = 'high';
    }

    // Document-based risk
    if (inspection.documents.length === 0) {
      riskFactors.push('No supporting documents');
      recommendations.push('Upload required documentation');
      level = 'medium';
    }

    return {
      level,
      factors: riskFactors,
      recommendations
    };
  }

  static generateNextActions(inspection: Inspection): any[] {
    const actions: any[] = [];

    switch (inspection.status) {
      case 'requested':
        actions.push({
          action: 'Schedule inspection',
          priority: 'high' as const,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          assignedTo: inspection.inspector
        });
        break;

      case 'scheduled':
        actions.push({
          action: 'Prepare inspection checklist',
          priority: 'medium' as const,
          assignedTo: inspection.inspector
        });
        break;

      case 'in_progress':
        actions.push({
          action: 'Complete inspection and submit report',
          priority: 'high' as const,
          deadline: inspection.date,
          assignedTo: inspection.inspector
        });
        break;

      case 'completed':
        actions.push({
          action: 'Review inspection report',
          priority: 'medium' as const
        });
        break;

      case 'rejected':
      case 'requires_changes':
        actions.push({
          action: 'Implement corrective actions',
          priority: 'high' as const,
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        });
        break;

      case 'approved':
        actions.push({
          action: 'Proceed to next phase',
          priority: 'low' as const
        });
        break;
    }

    return actions;
  }

  static calculateQualityScore(inspection: Inspection): number {
    let score = 50; // Base score

    // Status contribution (40%)
    switch (inspection.status) {
      case 'approved':
        score += 40;
        break;
      case 'completed':
        score += 30;
        break;
      case 'rejected':
        score -= 20;
        break;
      case 'requires_changes':
        score -= 10;
        break;
    }

    // Documentation contribution (30%)
    if (inspection.documents.length > 0) {
      score += Math.min(30, inspection.documents.length * 10);
    }

    // Comments contribution (30%)
    if (inspection.comments && inspection.comments.length > 50) {
      score += 30;
    } else if (inspection.comments && inspection.comments.length > 20) {
      score += 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  static calculateComplianceScore(inspection: Inspection): number {
    let score = 50; // Base score

    // Progress compliance
    if (inspection.progressAtInspection >= 50) {
      score += 25;
    } else if (inspection.progressAtInspection >= 25) {
      score += 15;
    }

    // Documentation compliance
    const requiredDocs = 3; // Assuming 3 required documents
    const docScore = Math.min(25, (inspection.documents.length / requiredDocs) * 25);
    score += docScore;

    // Timeline compliance
    const inspectionDate = new Date(inspection.date);
    const scheduledDate = new Date(inspection.createdAt);
    const daysDifference = Math.abs((inspectionDate.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference <= 1) {
      score += 25;
    } else if (daysDifference <= 3) {
      score += 15;
    } else if (daysDifference <= 7) {
      score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  static calculateTimeEfficiency(inspection: Inspection): number {
    const createdDate = new Date(inspection.createdAt);
    const inspectionDate = new Date(inspection.date);
    const actualDays = Math.abs((inspectionDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Expected days based on inspection type (simplified)
    const expectedDays = 7; // 1 week for normal inspection
    
    if (actualDays <= expectedDays) {
      return 100;
    }
    
    return Math.max(0, 100 - ((actualDays - expectedDays) * 10));
  }

  static generateInspectionReport(inspection: Inspection): any {
    const analytics = InspectionDomainTransformer.calculateInspectionAnalytics(inspection);
    const risk = InspectionDomainTransformer.assessInspectionRisk(inspection);
    const nextActions = InspectionDomainTransformer.generateNextActions(inspection);

    return {
      inspectionInfo: {
        id: inspection.id,
        projectId: inspection.projectId,
        inspector: inspection.inspector,
        date: inspection.date,
        status: inspection.status,
        progress: inspection.progressAtInspection
      },
      analytics,
      risk,
      nextActions,
      recommendations: InspectionDomainTransformer.generateInspectionRecommendations(inspection, analytics, risk),
      generatedAt: new Date().toISOString()
    };
  }

  static generateInspectionRecommendations(inspection: Inspection, analytics: any, risk: any): string[] {
    const recommendations: string[] = [];

    if (analytics.qualityScore < 70) {
      recommendations.push('Improve inspection quality standards');
    }

    if (analytics.complianceScore < 80) {
      recommendations.push('Ensure all compliance requirements are met');
    }

    if (risk.level === 'high') {
      recommendations.push('Implement risk mitigation strategies');
    }

    if (inspection.status === 'completed' && !inspection.comments) {
      recommendations.push('Add detailed comments to inspection report');
    }

    return recommendations;
  }

  static formatInspectionDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  static getInspectionStatusColor(status: InspectionStatus): string {
    switch (status) {
      case 'requested': return '#FFA500'; // Orange
      case 'scheduled': return '#4169E1'; // Royal Blue
      case 'in_progress': return '#FFD700'; // Gold
      case 'completed': return '#32CD32'; // Lime Green
      case 'approved': return '#228B22'; // Forest Green
      case 'rejected': return '#DC143C'; // Crimson
      case 'requires_changes': return '#FF8C00'; // Dark Orange
      case 'cancelled': return '#696969'; // Dim Gray
      default: return '#808080'; // Gray
    };
  }

  static validateInspectionWorkflow(inspection: Inspection, workflow: any): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    if (workflow.requiresPreInspection && inspection.progressAtInspection < 25) {
      errors.push('Pre-inspection required for this progress level');
      fieldErrors.progressAtInspection = ['Pre-inspection required'];
    }

    if (workflow.requiresSeniorInspector && !inspection.inspector.includes('Senior')) {
      errors.push('Senior inspector required for this type of inspection');
      fieldErrors.inspector = ['Senior inspector required'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  static calculateInspectionMetrics(inspections: Inspection[]): ProgressAnalytics {
    const totalInspections = inspections.length;
    const completedInspections = inspections.filter(i => i.status === 'completed' || i.status === 'approved').length;
    const inProgressInspections = inspections.filter(i => i.status === 'in_progress').length;
    const pendingInspections = inspections.filter(i => i.status === 'requested' || i.status === 'scheduled').length;

    const averageProgress = inspections.length > 0 
      ? inspections.reduce((sum, i) => sum + i.progressAtInspection, 0) / inspections.length 
      : 0;

    return {
      overallProgress: averageProgress,
      phaseProgress: {}, // Would group by phase
      taskProgress: {}, // Would group by task
      delayedTasksCount: pendingInspections,
      completedTasksCount: completedInspections,
      tasksInProgressCount: inProgressInspections,
      pendingTasksCount: pendingInspections
    };
  }
}
