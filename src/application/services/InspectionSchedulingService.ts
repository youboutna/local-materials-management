/**
 * Inspection Scheduling Service - Hexagonal Architecture
 * Business logic for inspection scheduling operations
 */

import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

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
    private inspectionRepository: IInspectionRepository = RepositoryFactory.getInspectionRepository(),
    private employeeRepository = RepositoryFactory.getEmployeeRepository()
  ) {}

  /**
   * Check inspector availability for a given date.
   * An inspector is unavailable if they already have an inspection assigned
   * on the same calendar day.
   */
  async checkInspectorAvailability(request: CheckInspectorAvailabilityRequestDto): Promise<boolean> {
    try {
      const existing = await this.inspectionRepository.findByInspector(request.inspectorId);
      const day = request.date.slice(0, 10);
      const conflict = (existing || []).some(insp => {
        const d = (insp as unknown as { date?: string }).date;
        return typeof d === 'string' && d.slice(0, 10) === day;
      });
      return !conflict;
    } catch (error) {
      console.error('Error checking inspector availability:', error);
      return false;
    }
  }

  /**
   * Schedule an inspection by updating it through the repository.
   */
  async scheduleInspection(request: ScheduleInspectionRequestDto): Promise<boolean> {
    const validation = this.validateScheduleData(request);
    if (!validation.isValid) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      const scheduledAt = `${request.scheduledDate}T${request.scheduledTime || '09:00'}:00`;
      await this.inspectionRepository.update(request.inspectionId, {
        date: scheduledAt,
        inspector: request.inspectorId,
        status: 'scheduled',
        comments: request.notes,
      } as unknown as Parameters<IInspectionRepository['update']>[1]);
      return true;
    } catch (error) {
      console.error('InspectionSchedulingService.scheduleInspection failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to schedule inspection');
    }
  }

  /**
   * Get inspectors available within the requested window.
   * Backed by EmployeeRepository.findInspectors().
   */
  async getAvailableInspectors(request: GetAvailableInspectorsRequestDto): Promise<AssignableInspector[]> {
    if (!request.startDate || !request.endDate) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Start date and end date are required');
    }

    try {
      const inspectors = await this.employeeRepository.findInspectors();
      return (inspectors || []).map((emp) => {
        const e = emp as unknown as Record<string, unknown>;
        return {
          id: String(e.id ?? ''),
          name: String(e.fullName ?? e.full_name ?? e.name ?? 'Inspecteur'),
          email: String(e.email ?? ''),
          role: String(e.role ?? 'inspector'),
          specializations: Array.isArray(e.specializations) ? (e.specializations as string[]) : [],
          availability: {
            startDate: request.startDate,
            endDate: request.endDate,
          },
        };
      });
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
