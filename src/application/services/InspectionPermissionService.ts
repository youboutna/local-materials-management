/**
 * Inspection Permission Service - Hexagonal Architecture
 * Business logic for inspection permission management
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

export class InspectionPermissionService {
  /**
   * Check if user has permission to schedule inspection
   */
  async checkSchedulingPermission(context: PermissionContext): Promise<PermissionResult> {
    try {
      console.log('Checking scheduling permission for:', context);
      
      // For now, allow all users with basic check
      const role = await this.getUserRole(context.userId);
      
      if (this.hasBasicInspectionPermission(role)) {
        return { hasPermission: true };
      }
      
      return {
        hasPermission: false,
        reason: 'User does not have permission to schedule inspections'
      };
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
      // Return mock data for now
      return [
        {
          id: 'inspector-1',
          name: 'Inspector 1',
          email: 'inspector1@example.com',
          role: 'inspector',
          specializations: ['technical'],
          certifications: ['certification_technique'],
          maxConcurrentInspections: 5,
          currentInspections: 2
        }
      ];
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
      
      const inspector = await this.getInspectorDetails(inspectorId);
      if (!inspector) {
        return {
          hasPermission: false,
          reason: 'Inspecteur non trouvé'
        };
      }

      if (inspector.currentInspections >= inspector.maxConcurrentInspections) {
        return {
          hasPermission: false,
          reason: 'Inspecteur a atteint le nombre maximum d\'inspections simultanées',
          alternativeInspectors: await this.getAssignableInspectors(context)
        };
      }

      return { hasPermission: true };
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
      // Mock implementation
      console.log('Getting role for user:', userId);
      return 'inspector';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'user';
    }
  }

  /**
   * Check basic inspection permission
   */
  private hasBasicInspectionPermission(role: string): boolean {
    const allowedRoles = ['inspector', 'supervisor', 'project_manager', 'admin'];
    return allowedRoles.includes(role);
  }

  /**
   * Get inspector details
   */
  private async getInspectorDetails(inspectorId: string): Promise<AssignableInspector | null> {
    try {
      // Mock implementation
      return {
        id: inspectorId,
        name: 'Inspector',
        email: 'inspector@example.com',
        role: 'inspector',
        specializations: ['technical'],
        certifications: ['certification_technique'],
        maxConcurrentInspections: 5,
        currentInspections: 2
      };
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
