/**
 * Inspection Monitoring Service
 * Manages inspection workflows and monitoring
 * Aligned with hexagonal architecture
 */

import { Inspection } from '@/domain/entities/Inspection';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { NotificationService } from './NotificationService';

export type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'pending' | 'requested' | 'requires_changes' | 'cancelled';

export interface InspectionData {
  id?: string;
  projectId: string;
  inspectorId: string;
  inspectionType: string;
  status?: InspectionStatus;
  scheduledDate: string;
  completionDate?: string;
  location: string;
  findings?: {
    photos: string[];
    notes: string;
    defects: string[];
    complianceChecks: Array<{ item: string; status: 'pass' | 'fail'; standard?: string }>;
  };
}

export interface InspectionUpdates {
  status: InspectionStatus;
  completionDate?: string;
  notes?: string;
  inspectorId?: string;
  findings?: InspectionFinding[];
}

export interface InspectionFinding {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'resolved';
  createdAt: string;
  updatedAt?: string;
  photoUrls?: string[];
}

export const MANDATORY_INSPECTION_FIELDS: Record<string, string[]> = {
  structural: ['foundation_check', 'beam_alignment', 'load_capacity'],
  electrical: ['wiring_safety', 'grounding', 'circuit_load'],
  plumbing: ['pipe_integrity', 'water_pressure', 'drainage'],
  safety: ['fire_exits', 'equipment_check', 'signage'],
  general: ['site_cleanliness', 'documentation', 'progress_verification']
};

/**
 * Create a digital inspection - exported function for backward compatibility
 */
export async function createDigitalInspection(data: Omit<InspectionData, 'id' | 'status'>): Promise<InspectionData> {
  const service = new InspectionMonitoringService();
  return service.createDigitalInspection(data);
}

export class InspectionMonitoringService {
  private inspectionRepository: IInspectionRepository;
  private notificationService: NotificationService;

  constructor(notificationService?: NotificationService) {
    this.inspectionRepository = RepositoryFactory.getInspectionRepository();
    this.notificationService = notificationService || new NotificationService(RepositoryFactory.getNotificationRepository());
  }

  /**
   * Create a digital inspection
   */
  async createDigitalInspection(data: Omit<InspectionData, 'id' | 'status' | 'findings'>): Promise<InspectionData> {
    try {
      await this.notificationService.createNotification({
        recipient_id: data.inspectorId,
        title: 'New Inspection Scheduled',
        message: `Inspection scheduled for ${data.scheduledDate}`,
        type: 'info'
      });

      return {
        id: `insp-${Date.now()}`,
        ...data,
        status: 'scheduled',
        findings: {
          photos: [],
          notes: '',
          defects: [],
          complianceChecks: []
        }
      };
    } catch (error) {
      console.error('Error creating digital inspection:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create digital inspection');
    }
  }

  /**
   * Get inspections by project
   */
  async getProjectInspections(projectId: string): Promise<InspectionData[]> {
    try {
      const inspections = await this.inspectionRepository.findByProjectId(projectId);
      return inspections.map(inspection => ({
        id: inspection.id,
        projectId: inspection.projectId || projectId,
        inspectorId: inspection.inspector?.name || '',
        inspectionType: 'standard',
        status: inspection.status.toLowerCase() as InspectionStatus,
        scheduledDate: inspection.date,
        location: 'Project site',
        findings: {
          photos: [],
          notes: inspection.comments || '',
          defects: [],
          complianceChecks: []
        }
      }));
    } catch (error) {
      console.error('Error getting project inspections:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project inspections');
    }
  }

  /**
   * Update inspection status
   */
  async updateInspectionStatus(
    id: string, 
    status: InspectionStatus, 
    findings?: Partial<InspectionData['findings']>
  ): Promise<InspectionData> {
    try {
      const inspection = await this.inspectionRepository.findById(id);
      if (!inspection) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');
      }

      const domainStatus = Inspection.mapStringToStatus(status);
      const updates: Record<string, unknown> = { status: domainStatus };
      
      if (status === 'approved' || status === 'rejected' || status === 'completed') {
        updates.completedAt = new Date().toISOString();
      }
      
      if (findings?.notes) {
        updates.comments = findings.notes;
      }

      await this.inspectionRepository.update(id, updates as Partial<Inspection>);

      return {
        id: inspection.id,
        projectId: inspection.projectId || '',
        inspectorId: inspection.inspector?.name || '',
        inspectionType: 'standard',
        status: status,
        scheduledDate: inspection.date,
        location: 'Project site',
        findings: findings ? {
          photos: findings.photos || [],
          notes: findings.notes || '',
          defects: findings.defects || [],
          complianceChecks: findings.complianceChecks || []
        } : {
          photos: [],
          notes: '',
          defects: [],
          complianceChecks: []
        }
      };
    } catch (error) {
      console.error('Error updating inspection status:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update inspection status');
    }
  }
}

let inspectionMonitoringServiceInstance: InspectionMonitoringService | null = null;
export function getInspectionMonitoringService(): InspectionMonitoringService {
  if (!inspectionMonitoringServiceInstance) {
    inspectionMonitoringServiceInstance = new InspectionMonitoringService();
  }
  return inspectionMonitoringServiceInstance;
}
