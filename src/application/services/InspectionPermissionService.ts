/**
 * Inspection Permission Service - Hexagonal Architecture
 * Business logic for inspection permission management
 */

import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { 
  IInspectionPermissionRepository,
  PermissionContext,
  PermissionResult,
  AssignableInspector
} from '@/domain/repositories/IInspectionPermissionRepository';

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

export class InspectionPermissionService {
  private repository: IInspectionPermissionRepository;

  constructor() {
    this.repository = RepositoryFactory.getInspectionPermissionRepository();
  }
  
  /**
   * Check if user has permission to schedule inspection
   */
  async checkSchedulingPermission(context: PermissionContext): Promise<PermissionResult> {
    try {
      console.log('Checking scheduling permission for:', context);
      return await this.repository.checkSchedulingPermission(context);
    } catch (error) {
      console.error('Error checking permission:', error);
      return {
        hasPermission: false,
        reason: 'Erreur lors de la vérification des permissions'
      };
    }
  }

  /**
   * Get assignable inspectors for inspection
   */
  async getAssignableInspectors(context: PermissionContext): Promise<AssignableInspector[]> {
    try {
      console.log('Getting assignable inspectors for:', context);
      return await this.repository.getAssignableInspectors(context);
    } catch (error) {
      console.error('Error getting assignable inspectors:', error);
      return [];
    }
  }

  /**
   * Validate inspector assignment
   */
  async validateInspectorAssignment(
    inspectorId: string, 
    context: PermissionContext
  ): Promise<PermissionResult> {
    try {
      console.log('Validating inspector assignment:', inspectorId, context);
      return await this.repository.validateInspectorAssignment(inspectorId, context);
    } catch (error) {
      console.error('Error validating inspector assignment:', error);
      return {
        hasPermission: false,
        reason: 'Erreur lors de la validation de l\'assignation'
      };
    }
  }

  /**
   * Get user role
   */
  private async getUserRole(userId: string): Promise<string> {
    try {
      return await this.repository.getUserRole(userId);
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'user';
    }
  }

  /**
   * Check basic inspection permission
   */
  private hasBasicInspectionPermission(role: string): boolean {
    const allowedRoles = ['inspector', 'supervisor', 'project_manager'];
    return allowedRoles.includes(role);
  }

  /**
   * Check project access
   */
  private async checkProjectAccess(userId: string, projectId: string): Promise<boolean> {
    try {
      return await this.repository.checkProjectAccess(userId, projectId);
    } catch (error) {
      console.error('Error checking project access:', error);
      return false;
    }
  }

  /**
   * Get alternative inspectors
   */
  private async getAlternativeInspectors(context: PermissionContext): Promise<AssignableInspector[]> {
    try {
      return await this.repository.getAlternativeInspectors(context);
    } catch (error) {
      console.error('Error getting alternative inspectors:', error);
      return [];
    }
  }

  /**
   * Get inspector details
   */
  private async getInspectorDetails(inspectorId: string): Promise<AssignableInspector | null> {
    try {
      return await this.repository.getInspectorDetails(inspectorId);
    } catch (error) {
      console.error('Error getting inspector details:', error);
      return null;
    }
  }

  /**
   * Validate certifications
   */
  private validateCertifications(
    certifications: string[], 
    inspectionType: string
  ): boolean {
    const requiredCerts = this.getRequiredCertifications(inspectionType);
    return requiredCerts.every(cert => certifications.includes(cert));
  }

  /**
   * Get required certifications for inspection type
   */
  private getRequiredCertifications(inspectionType: string): string[] {
    switch (inspectionType) {
      case 'technical':
        return ['certification_technique', 'safety_certification'];
      case 'safety':
        return ['safety_certification', 'first_aid_certification'];
      case 'quality':
        return ['quality_certification', 'iso_9001'];
      default:
        return [];
    }
  }

  /**
   * Check inspector availability
   */
  private async checkInspectorAvailability(inspectorId: string): Promise<boolean> {
    try {
      return await this.repository.checkInspectorAvailability(inspectorId);
    } catch (error) {
      console.error('Error checking inspector availability:', error);
      return false;
    }
  }

  /**
   * Static method for backward compatibility
   */
  static async canScheduleInspection(context: PermissionContext): Promise<PermissionResult> {
    const service = new InspectionPermissionService();
    return service.checkSchedulingPermission(context);
  }

  /**
   * Static method for backward compatibility
   */
  static async getAssignableInspectors(context: PermissionContext): Promise<AssignableInspector[]> {
    const service = new InspectionPermissionService();
    return service.getAssignableInspectors(context);
  }
}
