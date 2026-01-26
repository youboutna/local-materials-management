/**
 * Inspection Domain Transformer
 * Implements hexagonal architecture principles
 * Flow: UI => Service => Entity => DTO => UI
 */

import { Inspection } from '@/domain/entities/Inspection';
import { InspectionDTO } from '@/dtos/entities/InspectionDTO';

export class InspectionDomainTransformer {
  /**
   * Transform Inspection entity to InspectionDTO
   */
  static toResponseDto(inspection: Inspection): InspectionDTO {
    return {
      id: inspection.id,
      projectId: inspection.projectId,
      phaseId: inspection.phaseId || undefined,
      date: inspection.date,
      inspector: inspection.inspector,
      status: inspection.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'requires_changes' | 'pending',
      progressAtInspection: inspection.progressAtInspection,
      comments: inspection.comments || undefined,
      documents: inspection.documents.length > 0 ? { documents: inspection.documents } : undefined,
      createdAt: inspection.createdAt,
      updatedAt: inspection.updatedAt
    };
  }
}
