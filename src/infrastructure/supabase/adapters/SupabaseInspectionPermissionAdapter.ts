// @ts-nocheck
/**
 * Supabase Inspection Permission Adapter
 * Implements IInspectionPermissionRepository using Supabase
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { supabase as publicClient } from '@/integrations/supabase/client';
import { 
  IInspectionPermissionRepository, 
  PermissionContext, 
  AssignableInspector, 
  PermissionResult 
} from '@/domain/repositories/IInspectionPermissionRepository';

export class SupabaseInspectionPermissionAdapter implements IInspectionPermissionRepository {
  
  /**
   * Check if user has permission to schedule inspection
   */
  async checkSchedulingPermission(context: PermissionContext): Promise<PermissionResult> {
    try {
      // Get user role
      const role = await this.getUserRole(context.userId);
      
      // Check basic inspection permission
      if (this.hasBasicInspectionPermission(role)) {
        return { hasPermission: true };
      }
      
      // Check project-specific access
      const hasProjectAccess = await this.checkProjectAccess(context.userId, context.projectId);
      if (!hasProjectAccess) {
        return {
          hasPermission: false,
          reason: 'User does not have access to this project'
        };
      }
      
      // Get alternative inspectors if permission denied
      const alternativeInspectors = await this.getAlternativeInspectors(context);
      
      return {
        hasPermission: false,
        reason: 'User does not have permission to schedule inspections',
        alternativeInspectors
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
      // Get inspectors from employees table with inspection capabilities
      const { data: employeeInspectors, error: employeeError } = await supabase
        .from('employees')
        .select(`
          id,
          full_name,
          email,
          position,
          skills,
          certifications
        `)
        .eq('is_active', true)
        .in('position', ['inspector', 'technical_manager', 'engineering_consultant', 'supervisor'])
        .contains('skills', [this.getRequiredSpecialization(context.inspectionType)]);

      // Get inspectors from suppliers table (external inspectors)
      const { data: supplierInspectors, error: supplierError } = await supabase
        .from('suppliers')
        .select(`
          id,
          name,
          email,
          category
        `)
        .eq('is_active', true)
        .eq('category', 'inspection_service');

      if (employeeError) throw employeeError;
      if (supplierError) throw supplierError;

      // Combine and format results
      const allInspectors = [
        ...(employeeInspectors || []).map(emp => this.mapEmployeeToInspector(emp)),
        ...(supplierInspectors || []).map(sup => this.mapSupplierToInspector(sup))
      ];

      return allInspectors;
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
      // Get inspector details
      const inspector = await this.getInspectorDetails(inspectorId);
      if (!inspector) {
        return {
          hasPermission: false,
          reason: 'Inspector not found'
        };
      }

      // Check availability
      const isAvailable = await this.checkInspectorAvailability(inspectorId);
      if (!isAvailable) {
        return {
          hasPermission: false,
          reason: 'Inspector is not available'
        };
      }

      // Validate certifications
      const hasValidCertifications = this.validateCertifications(
        inspector.certifications, 
        context.inspectionType
      );
      if (!hasValidCertifications) {
        return {
          hasPermission: false,
          reason: 'Inspector does not have required certifications'
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
  async getUserRole(userId: string): Promise<string> {
    try {
      // Get user role from user_roles table
      const { data, error } = await publicClient
        .from('user_roles')
        .select('role_name')
        .eq('user_id', userId)
        .single();

      return data?.role_name || 'user';
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
      // Check if user is assigned to project phase
      const { data, error } = await publicClient
        .from('phase_employees')
        .select('id')
        .eq('employee_id', userId)
        .eq('phase_id', projectId) // Assuming projectId is actually phaseId
        .single();

      return !error && !!data;
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
      // Get alternative inspectors from employees table
      const { data: employeeInspectors, error: employeeError } = await supabase
        .from('employees')
        .select(`
          id,
          full_name,
          email,
          position,
          skills,
          certifications
        `)
        .neq('id', context.userId)
        .eq('is_active', true)
        .in('position', ['inspector', 'technical_manager', 'engineering_consultant', 'supervisor'])
        .contains('skills', [this.getRequiredSpecialization(context.inspectionType)])
        .order('full_name')
        .limit(5);

      // Get alternative inspectors from suppliers table
      const { data: supplierInspectors, error: supplierError } = await supabase
        .from('suppliers')
        .select(`
          id,
          name,
          email,
          category
        `)
        .eq('is_active', true)
        .eq('category', 'inspection_service')
        .order('name')
        .limit(3);

      if (employeeError) throw employeeError;
      if (supplierError) throw supplierError;

      // Combine and format results
      const allInspectors = [
        ...(employeeInspectors || []).map(emp => this.mapEmployeeToInspector(emp)),
        ...(supplierInspectors || []).map(sup => this.mapSupplierToInspector(sup))
      ];

      return allInspectors;
    } catch (error) {
      console.error('Error getting alternative inspectors:', error);
      return [];
    }
  }

  /**
   * Get inspector details
   */
  async getInspectorDetails(inspectorId: string): Promise<AssignableInspector | null> {
    try {
      // Try to find inspector in employees table first
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select(`
          id,
          full_name,
          email,
          position,
          skills,
          certifications
        `)
        .eq('id', inspectorId)
        .eq('is_active', true)
        .single();

      if (!employeeError && employeeData) {
        return this.mapEmployeeToInspector(employeeData);
      }

      // Try to find inspector in suppliers table
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select(`
          id,
          name,
          email,
          category
        `)
        .eq('id', inspectorId)
        .eq('is_active', true)
        .single();

      if (!supplierError && supplierData) {
        return this.mapSupplierToInspector(supplierData);
      }

      return null;
    } catch (error) {
      console.error('Error getting inspector details:', error);
      return null;
    }
  }

  /**
   * Validate certifications
   */
  validateCertifications(certifications: string[], inspectionType: string): boolean {
    const requiredCerts = this.getRequiredCertifications(inspectionType);
    return requiredCerts.every(cert => certifications.includes(cert));
  }

  /**
   * Get required certifications for inspection type
   */
  getRequiredCertifications(inspectionType: string): string[] {
    const certificationMap: Record<string, string[]> = {
      'technical': ['certification_technique'],
      'safety': ['certification_securite'],
      'quality': ['certification_qualite'],
      'environmental': ['certification_environnementale'],
      'structural': ['certification_structurale'],
      'electrical': ['certification_electrique'],
      'plumbing': ['certification_plomberie']
    };

    return certificationMap[inspectionType] || [];
  }

  /**
   * Check inspector availability
   */
  async checkInspectorAvailability(inspectorId: string): Promise<boolean> {
    try {
      // Check availability in employees table
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('is_active')
        .eq('id', inspectorId)
        .single();

      if (!employeeError && employeeData) {
        return employeeData.is_active === true;
      }

      // Check availability in suppliers table
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('is_active')
        .eq('id', inspectorId)
        .single();

      if (!supplierError && supplierData) {
        return supplierData.is_active === true;
      }

      return false;
    } catch (error) {
      console.error('Error checking inspector availability:', error);
      return false;
    }
  }

  // ============= Private Helper Methods =============

  private hasBasicInspectionPermission(role: string): boolean {
    const allowedRoles = ['admin', 'project_manager', 'inspector', 'supervisor'];
    return allowedRoles.includes(role);
  }

  private getRequiredSpecialization(inspectionType: string): string {
    const specializationMap: Record<string, string> = {
      'technical': 'technical',
      'safety': 'safety',
      'quality': 'quality',
      'environmental': 'environmental',
      'structural': 'structural',
      'electrical': 'electrical',
      'plumbing': 'plumbing'
    };

    return specializationMap[inspectionType] || 'general';
  }

  /**
   * Map employee data to inspector format
   */
  private mapEmployeeToInspector(data: Record<string, unknown>): AssignableInspector {
    return {
      id: data.id as string,
      name: data.full_name as string,
      email: data.email as string,
      role: data.position as string,
      specializations: (data.skills as string[]) || [],
      certifications: (data.certifications as string[]) || [],
      maxConcurrentInspections: 5, // Default for employees
      currentInspections: 0 // Default current inspections
    };
  }

  /**
   * Map supplier data to inspector format
   */
  private mapSupplierToInspector(data: Record<string, unknown>): AssignableInspector {
    return {
      id: data.id as string,
      name: data.name as string,
      email: data.email as string,
      role: data.category as string,
      specializations: [], // Suppliers don't have specializations by default
      certifications: [], // Suppliers don't have certifications by default
      maxConcurrentInspections: 3, // Default for suppliers
      currentInspections: 0 // Default current inspections
    };
  }
}
