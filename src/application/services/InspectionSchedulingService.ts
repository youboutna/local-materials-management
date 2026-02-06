/**
 * Inspection Scheduling Service - Hexagonal Architecture
 * Business logic for inspection scheduling operations
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface InspectionScheduleData {
  inspectionId: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedDuration: number;
  inspectorId: string;
  backupInspectorId?: string;
  requiredDocuments: string[];
  notes?: string;
}

export interface InspectionType {
  id: string;
  name: string;
  description: string;
  requiresDocuments: boolean;
  estimatedDuration: number;
}

export interface AssignableInspector {
  id: string;
  name: string;
  email: string;
  role: string;
  specializations: string[];
  availability: {
    startDate: string;
    endDate: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ScheduleInspectionRequestDto {
  inspectionId: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedDuration: number;
  inspectorId: string;
  backupInspectorId?: string;
  requiredDocuments: string[];
  notes?: string;
}

export interface GetAvailableInspectorsRequestDto {
  startDate: string;
  endDate: string;
}

export interface CheckInspectorAvailabilityRequestDto {
  inspectorId: string;
  date: string;
}

export const INSPECTION_TYPES = {
  TECHNICAL: {
    id: 'technical',
    name: 'Inspection Technique',
    description: 'Inspection technique des travaux',
    requiresDocuments: true,
    estimatedDuration: 2
  },
  SAFETY: {
    id: 'safety',
    name: 'Inspection Sécurité',
    description: 'Inspection sécurité du chantier',
    requiresDocuments: true,
    estimatedDuration: 1
  },
  QUALITY: {
    id: 'quality',
    name: 'Inspection Qualité',
    description: 'Inspection qualité des matériaux',
    requiresDocuments: false,
    estimatedDuration: 1.5
  }
} as const;

export class InspectionSchedulingService {
  constructor(
    private inspectionRepository: IInspectionRepository = RepositoryFactory.getInspectionRepository()
  ) {}

  /**
   * Check inspector availability
   */
  async checkInspectorAvailability(request: CheckInspectorAvailabilityRequestDto): Promise<boolean> {
    try {
      // Simple availability check - always return true for now
      console.log(`[InspectionSchedulingService] Checking availability for inspector ${request.inspectorId} on ${request.date}`);
      return true;
    } catch (error) {
      console.error('Error checking inspector availability:', error);
      return false;
    }
  }

  /**
   * Schedule an inspection
   */
  async scheduleInspection(request: ScheduleInspectionRequestDto): Promise<boolean> {
    try {
      // Validate request data
      const validation = this.validateScheduleData(request);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Validation failed: ${validation.errors.join(', ')}`);
      }

      // For now, simulate scheduling as inspection repository is not available
      // TODO: Implement proper inspection scheduling when inspection repository is available
      console.warn('InspectionSchedulingService.scheduleInspection: Inspection repository not available');
      console.log(`Scheduling inspection: ${request.inspectionId}`);
      
      return true;
    } catch (error) {
      console.error('InspectionSchedulingService.scheduleInspection failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to schedule inspection');
    }
  }

  /**
   * Get available inspectors for date range
   */
  async getAvailableInspectors(request: GetAvailableInspectorsRequestDto): Promise<AssignableInspector[]> {
    try {
      if (!request.startDate || !request.endDate) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Start date and end date are required');
      }

      // For now, return mock data as inspector repository is not available
      // TODO: Implement proper inspector retrieval when inspector repository is available
      console.warn('InspectionSchedulingService.getAvailableInspectors: Inspector repository not available');
      console.log(`Getting available inspectors for: ${request.startDate} to ${request.endDate}`);
      
      return [];
    } catch (error) {
      console.error('InspectionSchedulingService.getAvailableInspectors failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get available inspectors');
    }
  }

  /**
   * Get inspection types
   */
  getInspectionTypes(): InspectionType[] {
    return Object.values(INSPECTION_TYPES);
  }

  /**
   * Validate inspection schedule data
   */
  validateScheduleData(data: Partial<ScheduleInspectionRequestDto>): ValidationResult {
    const errors: string[] = [];

    if (!data.scheduledDate) {
      errors.push('La date de programmation est requise');
    }

    if (!data.inspectorId) {
      errors.push('L\'inspecteur est requis');
    }

    if (data.estimatedDuration && data.estimatedDuration <= 0) {
      errors.push('La durée estimée doit être positive');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
