/**
 * Inspection Monitoring Service - Hexagonal Architecture
 * Service for monitoring inspection operations and digital inspections
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { NotificationService } from './NotificationService';

// Service DTOs for data exchange
export interface InspectionData {
  id?: string;
  projectId: string;
  inspectorId: string;
  inspectionType: 'daily' | 'weekly' | 'milestone' | 'safety' | 'quality';
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'failed';
  scheduledDate: string;
  completedDate?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  findings: {
    photos: string[];
    notes: string;
    defects: Array<{
      category: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      correctionRequired: boolean;
    }>;
    complianceChecks: Array<{
      standard: string;
      passed: boolean;
      notes?: string;
    }>;
  };
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

  constructor() {
    this.inspectionRepository = RepositoryFactory.getInspectionRepository();
    this.notificationService = new NotificationService();
  }

  /**
   * Create a digital inspection
   */
  async createDigitalInspection(data: Omit<InspectionData, 'id' | 'status' | 'findings'>): Promise<InspectionData> {
    try {
      const inspectionData: InspectionData = {
        ...data,
        status: 'scheduled',
        findings: {
          photos: [],
          notes: '',
          defects: [],
          complianceChecks: []
        }
      };

      // Use the inspection repository to create the inspection
      const createdInspection = await this.inspectionRepository.create({
        projectId: inspectionData.projectId,
        inspectorId: inspectionData.inspectorId,
        inspectionType: inspectionData.inspectionType,
        status: 'scheduled',
        scheduledDate: inspectionData.scheduledDate,
        location: inspectionData.location,
        findings: inspectionData.findings
      });

      // Send notification if needed
      await this.notificationService.createNotification({
        recipient_id: inspectionData.inspectorId,
        title: 'New Inspection Scheduled',
        message: `Inspection scheduled for ${inspectionData.scheduledDate}`,
        type: 'info',
        read: false
      });

      return {
        ...createdInspection,
        findings: inspectionData.findings
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
      const inspections = await this.inspectionRepository.getByProjectId(projectId);
      return inspections.map(inspection => ({
        ...inspection,
        findings: {
          photos: [],
          notes: '',
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
  async updateInspectionStatus(id: string, status: InspectionData['status'], findings?: Partial<InspectionData['findings']>): Promise<InspectionData> {
    try {
      const updatedInspection = await this.inspectionRepository.update(id, {
        status,
        completedDate: status === 'completed' ? new Date().toISOString() : undefined,
        findings: findings ? JSON.stringify(findings) : undefined
      });

      return {
        ...updatedInspection,
        findings: findings ? JSON.parse(updatedInspection.findings || '{}') : {
          photos: [],
          notes: '',
          defects: [],
          complianceChecks: []
        }
      };
    } catch (error) {
      console.error('Error updating inspection status:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update inspection status');
    }
  }
}
