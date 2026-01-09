/**
 * InspectionPermissionService - Service de gestion des permissions d'inspection
 * Détermine qui peut programmer des inspections et assigner des inspecteurs
 */

import { supabase } from '@/integrations/supabase/client';

export type UserRole = 
  | 'admin'
  | 'project_manager'
  | 'engineering_consultant'
  | 'technical_manager'
  | 'supervisor'
  | 'inspector'
  | 'client'
  | 'viewer';

export interface PermissionContext {
  userId: string;
  userRole: UserRole;
  projectId: string;
  phaseId?: string;
}

export interface PermissionResult {
  canSchedule: boolean;
  canAssignAnyInspector: boolean;
  canSetHighPriority: boolean;
  requiresApproval: boolean;
  restrictedToPhases?: string[];
  message?: string;
}

export interface AssignableInspector {
  id: string;
  name: string;
  position?: string;
  department?: string;
  type: 'employee' | 'supplier';
  isEngineeringConsultant: boolean;
  isTechnicalManager: boolean;
  isAvailable?: boolean;
}

export class InspectionPermissionService {
  
  /**
   * Vérifie si l'utilisateur peut programmer une inspection
   */
  static async canScheduleInspection(context: PermissionContext): Promise<PermissionResult> {
    const { userRole, projectId, phaseId } = context;

    // Admin peut tout faire
    if (userRole === 'admin') {
      return {
        canSchedule: true,
        canAssignAnyInspector: true,
        canSetHighPriority: true,
        requiresApproval: false,
      };
    }

    // Chef de projet
    if (userRole === 'project_manager') {
      // Vérifier si l'utilisateur est assigné à ce projet
      const isAssigned = await this.isUserAssignedToProject(context.userId, projectId);
      
      return {
        canSchedule: isAssigned,
        canAssignAnyInspector: true,
        canSetHighPriority: true,
        requiresApproval: false,
        message: isAssigned ? undefined : 'Vous n\'êtes pas assigné à ce projet',
      };
    }

    // Ingénieur conseil
    if (userRole === 'engineering_consultant') {
      // Vérifier les phases assignées
      const assignedPhases = await this.getUserAssignedPhases(context.userId, projectId);
      const canScheduleThisPhase = !phaseId || assignedPhases.includes(phaseId);
      
      return {
        canSchedule: canScheduleThisPhase,
        canAssignAnyInspector: false, // Peut seulement assigner soi-même ou responsables techniques
        canSetHighPriority: false, // Priorité haute nécessite approbation chef projet
        requiresApproval: false, // Pas d'approbation pour programmation normale
        restrictedToPhases: assignedPhases,
        message: canScheduleThisPhase ? undefined : 'Vous pouvez uniquement programmer des inspections pour vos phases assignées',
      };
    }

    // Responsable technique
    if (userRole === 'technical_manager') {
      const assignedPhases = await this.getUserAssignedPhases(context.userId, projectId);
      const canScheduleThisPhase = !phaseId || assignedPhases.includes(phaseId);
      
      return {
        canSchedule: canScheduleThisPhase,
        canAssignAnyInspector: false,
        canSetHighPriority: false,
        requiresApproval: true, // Nécessite approbation
        restrictedToPhases: assignedPhases,
      };
    }

    // Autres rôles ne peuvent pas programmer
    return {
      canSchedule: false,
      canAssignAnyInspector: false,
      canSetHighPriority: false,
      requiresApproval: true,
      message: 'Vous n\'avez pas les permissions pour programmer des inspections',
    };
  }

  /**
   * Récupère les inspecteurs disponibles selon le contexte
   */
  static async getAssignableInspectors(
    context: PermissionContext
  ): Promise<AssignableInspector[]> {
    try {
      const { userRole, projectId } = context;
      const allInspectors: AssignableInspector[] = [];

      // Fetch all employees
      const { data: employees } = await supabase
        .from('employees')
        .select('id, full_name, position, department')
        .eq('is_active', true)
        .order('full_name');

      // Fetch project stakeholders (suppliers)
      const { data: stakeholders } = await supabase
        .from('project_stakeholders')
        .select(`
          supplier_id,
          role,
          suppliers (id, name, contact_person, category)
        `)
        .eq('project_id', projectId);

      // Add employees
      for (const emp of employees || []) {
        const isEngineeringConsultant = this.isEngineeringConsultantPosition(emp.position);
        const isTechnicalManager = this.isTechnicalManagerPosition(emp.position);
        const isInspectorRole = this.isInspectorPosition(emp.position);

        // For engineering consultants, only show relevant people
        if (userRole === 'engineering_consultant') {
          if (!isEngineeringConsultant && !isTechnicalManager && !isInspectorRole) {
            continue;
          }
        }

        allInspectors.push({
          id: emp.id,
          name: emp.full_name,
          position: emp.position || undefined,
          department: emp.department || undefined,
          type: 'employee',
          isEngineeringConsultant,
          isTechnicalManager,
        });
      }

      // Add supplier contacts for project managers
      if (userRole === 'project_manager' || userRole === 'admin') {
        for (const stakeholder of stakeholders || []) {
          const supplier = (stakeholder as any).suppliers;
          if (supplier) {
            allInspectors.push({
              id: supplier.id,
              name: supplier.contact_person || supplier.name,
              position: `Responsable - ${supplier.name}`,
              department: supplier.category,
              type: 'supplier',
              isEngineeringConsultant: false,
              isTechnicalManager: false,
            });
          }
        }
      }

      // Sort: Engineering consultants first, then technical managers, then others
      return allInspectors.sort((a, b) => {
        if (a.isEngineeringConsultant && !b.isEngineeringConsultant) return -1;
        if (!a.isEngineeringConsultant && b.isEngineeringConsultant) return 1;
        if (a.isTechnicalManager && !b.isTechnicalManager) return -1;
        if (!a.isTechnicalManager && b.isTechnicalManager) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('[InspectionPermissionService] Error getting assignable inspectors:', error);
      return [];
    }
  }

  /**
   * Vérifie si l'utilisateur est assigné au projet
   */
  private static async isUserAssignedToProject(userId: string, projectId: string): Promise<boolean> {
    try {
      // Check if user is project responsable
      const { data: project } = await supabase
        .from('projects')
        .select('project_responsable_id')
        .eq('id', projectId)
        .single();

      if (project?.project_responsable_id === userId) {
        return true;
      }

      // Check if user is in project team via employees
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (employee) {
        // Could check project team assignments here
        return true; // For now, assume all employees can access projects
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Récupère les phases assignées à l'utilisateur
   */
  private static async getUserAssignedPhases(userId: string, projectId: string): Promise<string[]> {
    try {
      // Get all phases for the project (simplified - in real implementation, check assignments)
      const { data: phases } = await supabase
        .from('project_phases')
        .select('id')
        .eq('project_id', projectId);

      return phases?.map(p => p.id) || [];
    } catch {
      return [];
    }
  }

  /**
   * Vérifie si une position est ingénieur conseil
   */
  private static isEngineeringConsultantPosition(position?: string | null): boolean {
    if (!position) return false;
    const lower = position.toLowerCase();
    return lower.includes('consultant') || 
           lower.includes('ingénieur') || 
           lower.includes('engineer') ||
           lower.includes('bureau d\'études');
  }

  /**
   * Vérifie si une position est responsable technique
   */
  private static isTechnicalManagerPosition(position?: string | null): boolean {
    if (!position) return false;
    const lower = position.toLowerCase();
    return lower.includes('responsable technique') || 
           lower.includes('technical manager') ||
           lower.includes('chef technique');
  }

  /**
   * Vérifie si une position est inspecteur
   */
  private static isInspectorPosition(position?: string | null): boolean {
    if (!position) return false;
    const lower = position.toLowerCase();
    return lower.includes('inspector') || 
           lower.includes('inspecteur') ||
           lower.includes('contrôle') ||
           lower.includes('qualité');
  }

  /**
   * Récupère le rôle de l'utilisateur courant
   */
  static async getCurrentUserRole(): Promise<{ userId: string; role: UserRole } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check profiles for user existence
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      // Default to project_manager if user exists (simplified for now)
      // In production, this should query actual role assignments
      return { userId: user.id, role: profile ? 'project_manager' : 'viewer' };
    } catch {
      return null;
    }
  }
}
