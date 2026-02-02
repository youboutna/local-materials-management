/**
 * Inspection Monitoring Service
 * Manages inspection workflows and monitoring
 * Aligned with hexagonal architecture
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { NotificationService } from './NotificationService';

export type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'pending';

export interface InspectionData {
  id?: string;
  projectId: string;
  inspectorId: string;
  inspectionType: string;
  status?: InspectionStatus;
  scheduledDate: string;
  completedDate?: string;
  location: string;
  findings?: {
    photos: string[];
    notes: string;
    defects: string[];
    complianceChecks: Array<{ item: string; status: 'pass' | 'fail' }>;
  };
}

export interface InspectionUpdates {
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  completedDate?: string;
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

export interface InspectionUpdateData {
  status: InspectionStatus;
  completedDate?: string;
  comments?: string;
}

export const MANDATORY_INSPECTION_FIELDS = {
  projectId: 'Project ID is required',
  inspectorId: 'Inspector ID is required',
  inspectionType: 'Inspection type is required',
  scheduledDate: 'Scheduled date is required',
  location: 'Location is required'
};

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
      // Send notification
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
        projectId: inspection.projectId,
        inspectorId: inspection.inspector,
        inspectionType: 'standard',
        status: inspection.status as InspectionStatus,
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

      const updates: InspectionUpdateData = { status };
      
      if (status === 'approved' || status === 'rejected' || status === 'completed') {
        updates.completedDate = new Date().toISOString();
      }
      
      if (findings) {
        updates.comments = findings.notes;
      }

      await this.inspectionRepository.update(id, updates);

      return {
        id: inspection.id,
        projectId: inspection.projectId,
        inspectorId: inspection.inspector,
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
