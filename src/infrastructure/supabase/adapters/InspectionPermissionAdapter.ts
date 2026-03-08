// @ts-nocheck
/**
 * Inspection Permission Adapter - Supabase Implementation
 * Implements IInspectionPermissionRepository using Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  IInspectionPermissionRepository,
  PermissionContext,
  PermissionResult,
  AssignableInspector
} from '@/domain/repositories/IInspectionPermissionRepository';

export class InspectionPermissionAdapter implements IInspectionPermissionRepository {
  
  /**
   * Check if user has permission to schedule inspection
   */
  async checkSchedulingPermission(context: PermissionContext): Promise<PermissionResult> {
    try {
      // Get user role and project access
      const [userRole, projectAccess] = await Promise.all([
        this.getUserRole(context.userId),
        this.checkProjectAccess(context.userId, context.projectId)
      ]);

      const hasBasicPermission = this.hasBasicInspectionPermission(userRole);
      const hasPermission = hasBasicPermission && projectAccess;
      
      return {
        hasPermission,
        reason: hasPermission ? undefined : 'Permission refusée: rôle ou accès projet insuffisant',
        alternativeInspectors: hasPermission ? undefined : await this.getAlternativeInspectors(context)
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
      const { data, error } = await supabase
        .from('inspectors')
        .select('*')
        .eq('status', 'active')
        .in('specializations', context.inspectionType);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting assignable inspectors:', error);
      throw error;
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
      const inspector = await this.getInspectorDetails(inspectorId);
      if (!inspector) {
        return {
          hasPermission: false,
          reason: 'Inspecteur non trouvé'
        };
      }

      const hasRequiredCertifications = this.validateCertifications(
        inspector.certifications, 
        context.inspectionType
      );
      
      const isAvailable = await this.checkInspectorAvailability(inspectorId);
      
      const hasPermission = hasRequiredCertifications && isAvailable;
      
      return {
        hasPermission,
        reason: hasPermission ? undefined : 'Inspecteur non disponible ou certifications manquantes'
      };
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
  async getUserRole(userId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data?.role || 'user';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'user';
    }
  }

  /**
   * Check project access
   */
  async checkProjectAccess(userId: string, projectId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select('access_level')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .single();

      if (error) throw error;
      return (data?.access_level || 0) > 0;
    } catch (error) {
      console.error('Error checking project access:', error);
      return false;
    }
  }

  /**
   * Get alternative inspectors
   */
  async getAlternativeInspectors(context: PermissionContext): Promise<AssignableInspector[]> {
    try {
      const { data, error } = await supabase
        .from('inspectors')
        .select('*')
        .eq('status', 'active')
        .in('specializations', context.inspectionType)
        .neq('id', context.userId); // Exclude current user

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting alternative inspectors:', error);
      throw error;
    }
  }

  /**
   * Get inspector details
   */
  async getInspectorDetails(inspectorId: string): Promise<AssignableInspector | null> {
    try {
      const { data, error } = await supabase
        .from('inspectors')
        .select('*')
        .eq('id', inspectorId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting inspector details:', error);
      throw error;
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
      const { data, error } = await supabase
        .from('inspector_availability')
        .select('is_available')
        .eq('inspector_id', inspectorId)
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

      if (error) throw error;
      return data?.is_available || false;
    } catch (error) {
      console.error('Error checking inspector availability:', error);
      return false;
    }
  }
}
