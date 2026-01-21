/**
 * Inspection Scheduling Repository Interface
 * Defines contract for inspection scheduling data operations
 */

export interface InspectionScheduleData {
  inspectionId?: string;
  projectId?: string;
  phaseId?: string;
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
  type: 'employee' | 'supplier';
  availability: {
    startDate: string;
    endDate: string;
  };
}

export interface IInspectionSchedulingRepository {
  /**
   * Schedule an inspection
   */
  scheduleInspection(data: InspectionScheduleData): Promise<boolean>;

  /**
   * Get available inspectors for date range
   */
  getAvailableInspectors(startDate: string, endDate: string): Promise<AssignableInspector[]>;

  /**
   * Check inspector availability
   */
  checkInspectorAvailability(inspectorId: string, date: string): Promise<boolean>;

  /**
   * Get inspection types
   */
  getInspectionTypes(): Promise<InspectionType[]>;

  /**
   * Validate inspection schedule data
   */
  validateScheduleData(data: Partial<InspectionScheduleData>): {
    isValid: boolean;
    errors: string[];
  };
}
