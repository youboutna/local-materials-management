/**
 * Supabase Inspection Permission Adapter
 * Implements IInspectionPermissionRepository using Supabase
 *
 * ⚠️ Un utilisateur peut avoir PLUSIEURS rôles.
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { supabase as publicClient } from '@/integrations/supabase/client';
import {
  IInspectionPermissionRepository,
  PermissionContext,
  AssignableInspector,
  PermissionResult,
} from '@/domain/repositories/IInspectionPermissionRepository';

const ROLE_PRIORITY: string[] = [
  'admin',
  'super_admin',
  'director',
  'manager',
  'inspector',
  'supervisor',
  'project_manager',
  'project',
  'project_project',
  'supplier',
  'consultant',
  'public',
  'user',
];

export class SupabaseInspectionPermissionAdapter implements IInspectionPermissionRepository {
  async checkSchedulingPermission(context: PermissionContext): Promise<PermissionResult> {
    try {
      const roles = await this.getUserRolesList(context.userId);

      if (this.hasBasicInspectionPermission(roles)) {
        return { hasPermission: true };
      }

      const hasProjectAccess = await this.checkProjectAccess(
        context.userId,
        context.projectId
      );
      if (!hasProjectAccess) {
        return { hasPermission: false, reason: 'User does not have access to this project' };
      }

      const alternativeInspectors = await this.getAlternativeInspectors(context);

      return {
        hasPermission: false,
        reason: 'User does not have permission to schedule inspections',
        alternativeInspectors,
      };
    } catch (error) {
      console.error('Error checking permission:', error);
      return {
        hasPermission: false,
        reason: 'Erreur lors de la vérification des permissions',
      };
    }
  }

  async getAssignableInspectors(
    context: PermissionContext
  ): Promise<AssignableInspector[]> {
    try {
      const { data: employeeInspectors, error: employeeError } = await supabase
        .from('employees')
        .select(`id, full_name, email, position, skills, certifications`)
        .eq('is_active', true)
        .in('position', [
          'inspector',
          'technical_manager',
          'engineering_consultant',
          'supervisor',
        ])
        .contains('skills', [this.getRequiredSpecialization(context.inspectionType)]);

      const { data: supplierInspectors, error: supplierError } = await supabase
        .from('suppliers')
        .select(`id, name, email, category`)
        .eq('is_active', true)
        .eq('category', 'inspection_service');

      if (employeeError) throw employeeError;
      if (supplierError) throw supplierError;

      return [
        ...(employeeInspectors || []).map((emp) => this.mapEmployeeToInspector(emp)),
        ...(supplierInspectors || []).map((sup) => this.mapSupplierToInspector(sup)),
      ];
    } catch (error) {
      console.error('Error getting assignable inspectors:', error);
      return [];
    }
  }

  async validateInspectorAssignment(
    inspectorId: string,
    context: PermissionContext
  ): Promise<PermissionResult> {
    try {
      const inspector = await this.getInspectorDetails(inspectorId);
      if (!inspector) return { hasPermission: false, reason: 'Inspector not found' };

      const isAvailable = await this.checkInspectorAvailability(inspectorId);
      if (!isAvailable) return { hasPermission: false, reason: 'Inspector is not available' };

      const hasValidCertifications = this.validateCertifications(
        inspector.certifications,
        context.inspectionType
      );
      if (!hasValidCertifications) {
        return {
          hasPermission: false,
          reason: 'Inspector does not have required certifications',
        };
      }

      return { hasPermission: true };
    } catch (error) {
      console.error('Error validating inspector assignment:', error);
      return {
        hasPermission: false,
        reason: "Erreur lors de la validation de l'assignation",
      };
    }
  }

  /**
   * ✅ Retourne TOUS les rôles actifs (multi-rôles).
   */
  async getUserRolesList(userId: string): Promise<string[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await publicClient
        .from('user_roles')
        .select('role_name, status, expires_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .or(`expires_at.is.null,expires_at.gt.${now}`);

      if (error) {
        console.error('[SupabaseInspectionPermissionAdapter.getUserRolesList]', error);
        return [];
      }
      return (data ?? []).map((r) => r.role_name);
    } catch (error) {
      console.error('[SupabaseInspectionPermissionAdapter.getUserRolesList]', error);
      return [];
    }
  }

  /**
   * Retourne le rôle principal (le plus prioritaire).
   */
  async getUserRole(userId: string): Promise<string> {
    const roles = await this.getUserRolesList(userId);
    if (roles.length === 0) return 'user';
    for (const p of ROLE_PRIORITY) if (roles.includes(p)) return p;
    return roles[0];
  }

  async checkProjectAccess(userId: string, projectId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('phase_employees')
        .select('id')
        .eq('employee_id', userId)
        .eq('phase_id', projectId)
        .maybeSingle();

      return !error && !!data;
    } catch (error) {
      console.error('Error checking project access:', error);
      return false;
    }
  }

  async getAlternativeInspectors(
    context: PermissionContext
  ): Promise<AssignableInspector[]> {
    try {
      const { data: employeeInspectors, error: employeeError } = await supabase
        .from('employees')
        .select(`id, full_name, email, position, skills, certifications`)
        .neq('id', context.userId)
        .eq('is_active', true)
        .in('position', [
          'inspector',
          'technical_manager',
          'engineering_consultant',
          'supervisor',
        ])
        .contains('skills', [this.getRequiredSpecialization(context.inspectionType)])
        .order('full_name')
        .limit(5);

      const { data: supplierInspectors, error: supplierError } = await supabase
        .from('suppliers')
        .select(`id, name, email, category`)
        .eq('is_active', true)
        .eq('category', 'inspection_service')
        .order('name')
        .limit(3);

      if (employeeError) throw employeeError;
      if (supplierError) throw supplierError;

      return [
        ...(employeeInspectors || []).map((emp) => this.mapEmployeeToInspector(emp)),
        ...(supplierInspectors || []).map((sup) => this.mapSupplierToInspector(sup)),
      ];
    } catch (error) {
      console.error('Error getting alternative inspectors:', error);
      return [];
    }
  }

  async getInspectorDetails(inspectorId: string): Promise<AssignableInspector | null> {
    try {
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select(`id, full_name, email, position, skills, certifications`)
        .eq('id', inspectorId)
        .eq('is_active', true)
        .maybeSingle();

      if (!employeeError && employeeData) {
        return this.mapEmployeeToInspector(employeeData);
      }

      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select(`id, name, email, category`)
        .eq('id', inspectorId)
        .eq('is_active', true)
        .maybeSingle();

      if (!supplierError && supplierData) {
        return this.mapSupplierToInspector(supplierData);
      }

      return null;
    } catch (error) {
      console.error('Error getting inspector details:', error);
      return null;
    }
  }

  validateCertifications(certifications: string[], inspectionType: string): boolean {
    const requiredCerts = this.getRequiredCertifications(inspectionType);
    return requiredCerts.every((cert) => certifications.includes(cert));
  }

  getRequiredCertifications(inspectionType: string): string[] {
    const certificationMap: Record<string, string[]> = {
      technical: ['certification_technique'],
      safety: ['certification_securite'],
      quality: ['certification_qualite'],
      environmental: ['certification_environnementale'],
      structural: ['certification_structurale'],
      electrical: ['certification_electrique'],
      plumbing: ['certification_plomberie'],
    };
    return certificationMap[inspectionType] || [];
  }

  async checkInspectorAvailability(inspectorId: string): Promise<boolean> {
    try {
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('is_active')
        .eq('id', inspectorId)
        .maybeSingle();

      if (!employeeError && employeeData) return employeeData.is_active === true;

      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('is_active')
        .eq('id', inspectorId)
        .maybeSingle();

      if (!supplierError && supplierData) return supplierData.is_active === true;

      return false;
    } catch (error) {
      console.error('Error checking inspector availability:', error);
      return false;
    }
  }

  // ============= Private Helpers =============

  /**
   * ✅ Vérifie si AU MOINS UN rôle autorise.
   */
  private hasBasicInspectionPermission(roles: string[]): boolean {
    const allowedRoles = [
      'admin',
      'super_admin',
      'director',
      'project_manager',
      'inspector',
      'supervisor',
    ];
    return roles.some((role) => allowedRoles.includes(role));
  }

  private getRequiredSpecialization(inspectionType: string): string {
    const specializationMap: Record<string, string> = {
      technical: 'technical',
      safety: 'safety',
      quality: 'quality',
      environmental: 'environmental',
      structural: 'structural',
      electrical: 'electrical',
      plumbing: 'plumbing',
    };
    return specializationMap[inspectionType] || 'general';
  }

  private mapEmployeeToInspector(data: Record<string, unknown>): AssignableInspector {
    return {
      id: data.id as string,
      name: data.full_name as string,
      email: data.email as string,
      role: data.position as string,
      specializations: (data.skills as string[]) || [],
      certifications: (data.certifications as string[]) || [],
      maxConcurrentInspections: 5,
      currentInspections: 0,
    };
  }

  private mapSupplierToInspector(data: Record<string, unknown>): AssignableInspector {
    return {
      id: data.id as string,
      name: data.name as string,
      email: data.email as string,
      role: data.category as string,
      specializations: [],
      certifications: [],
      maxConcurrentInspections: 3,
      currentInspections: 0,
    };
  }
}