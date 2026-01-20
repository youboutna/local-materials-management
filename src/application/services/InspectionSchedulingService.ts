/**
 * Inspection Scheduling Service - Hexagonal Architecture
 * Business logic for inspection scheduling operations
 */

import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { 
  IInspectionSchedulingRepository, 
  InspectionScheduleData, 
  InspectionType, 
  AssignableInspector 
} from '@/domain/repositories/IInspectionSchedulingRepository';

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
  private repository: IInspectionSchedulingRepository;

  constructor() {
    this.repository = RepositoryFactory.getInspectionSchedulingRepository();
  }
  
  /**
   * Schedule an inspection
   */
  async scheduleInspection(data: InspectionScheduleData): Promise<boolean> {
    try {
      console.log('Scheduling inspection:', data);
      return await this.repository.scheduleInspection(data);
    } catch (error) {
      console.error('Error scheduling inspection:', error);
      return false;
    }
  }

  /**
   * Get available inspectors for date range
   */
  async getAvailableInspectors(startDate: string, endDate: string): Promise<AssignableInspector[]> {
    try {
      console.log('Getting available inspectors for:', startDate, endDate);
      return await this.repository.getAvailableInspectors(startDate, endDate);
    } catch (error) {
      console.error('Error getting available inspectors:', error);
      return [];
    }
  }

  /**
   * Check inspector availability
   */
  async checkInspectorAvailability(inspectorId: string, date: string): Promise<boolean> {
    try {
      console.log('Checking availability for inspector:', inspectorId, date);
      return await this.repository.checkInspectorAvailability(inspectorId, date);
    } catch (error) {
      console.error('Error checking inspector availability:', error);
      return false;
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
  validateScheduleData(data: Partial<InspectionScheduleData>): {
    isValid: boolean;
    errors: string[];
  } {
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
