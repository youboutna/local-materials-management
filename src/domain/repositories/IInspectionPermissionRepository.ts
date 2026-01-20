/**
 * Inspection Permission Repository Interface
 * Defines contract for inspection permission management operations
 */

export interface PermissionContext {
  userId: string;
  projectId: string;
  phaseId?: string;
  inspectionType: string;
}

export interface AssignableInspector {
  id: string;
  name: string;
  email: string;
  role: string;
  specializations: string[];
  certifications: string[];
  maxConcurrentInspections: number;
  currentInspections: number;
}

export interface PermissionResult {
  hasPermission: boolean;
  reason?: string;
  alternativeInspectors?: AssignableInspector[];
}

export interface IInspectionPermissionRepository {
  /**
   * Check if user has permission to schedule inspection
   */
  checkSchedulingPermission(context: PermissionContext): Promise<PermissionResult>;

  /**
   * Get assignable inspectors for inspection
   */
  getAssignableInspectors(context: PermissionContext): Promise<AssignableInspector[]>;

  /**
   * Validate inspector assignment
   */
  validateInspectorAssignment(
    inspectorId: string, 
    context: PermissionContext
  ): Promise<PermissionResult>;

  /**
   * Get user role
   */
  getUserRole(userId: string): Promise<string>;

  /**
   * Check project access
   */
  checkProjectAccess(userId: string, projectId: string): Promise<boolean>;

  /**
   * Get alternative inspectors
   */
  getAlternativeInspectors(context: PermissionContext): Promise<AssignableInspector[]>;

  /**
   * Get inspector details
   */
  getInspectorDetails(inspectorId: string): Promise<AssignableInspector | null>;

  /**
   * Validate certifications
   */
  validateCertifications(
    certifications: string[], 
    inspectionType: string
  ): boolean;

  /**
   * Get required certifications for inspection type
   */
  getRequiredCertifications(inspectionType: string): string[];

  /**
   * Check inspector availability
   */
  checkInspectorAvailability(inspectorId: string): Promise<boolean>;
}
