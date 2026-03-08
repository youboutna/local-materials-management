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
  type: 'employee' | 'stakeholder';
  isEngineeringConsultant: boolean;
  isTechnicalManager: boolean;
  isAvailable?: boolean;
  isDefault?: boolean;
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
   * Retourne uniquement l'équipe interne (employés) et les stakeholders du projet (pas tous les suppliers)
   */
  static async getAssignableInspectors(
    context: PermissionContext
  ): Promise<AssignableInspector[]> {
    try {
      const { userRole, projectId } = context;
      const allInspectors: AssignableInspector[] = [];

      // Fetch all active employees (équipe interne)
      const { data: employees } = await supabase
        .from('employees')
        .select('id, full_name, position, department')
        .eq('is_active', true)
        .order('full_name');

      // Fetch project stakeholders only (pas tous les suppliers)
      // Stakeholders sont les personnes assignées spécifiquement au projet
      const { data: stakeholders } = await supabase
        .from('project_stakeholders')
        .select(`
          id,
          supplier_id,
          employee_id,
          stakeholder_type,
          role_description,
          suppliers (id, name, contact_person, category)
        `)
        .eq('project_id', projectId);

      // Track if we found default inspector
      let defaultInspectorId: string | null = null;

      // Add employees (équipe interne)
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

        // Determine default inspector: priorité à l'ingénieur conseil
        if (isEngineeringConsultant && !defaultInspectorId) {
          defaultInspectorId = emp.id || '';
        } else if (isTechnicalManager && !defaultInspectorId) {
          defaultInspectorId = emp.id || '';
        }

        allInspectors.push({
          id: emp.id || '',
          name: emp.full_name || '',
          position: emp.position || undefined,
          department: emp.department || undefined,
          type: 'employee',
          isEngineeringConsultant,
          isTechnicalManager,
        });
      }

      // Add stakeholders du projet (personnes clés assignées, pas tous les suppliers)
      // Filtrer par rôles pertinents pour inspection
      const inspectionRoles = ['engineering_consultant', 'technical_manager', 'supervisor', 'inspector', 'quality_control'];
      
      for (const stakeholder of stakeholders || []) {
        const supplier = (stakeholder as any).suppliers;
        const roleDescription = stakeholder.role_description?.toLowerCase() || '';
        const stakeholderType = stakeholder.stakeholder_type?.toLowerCase() || '';
        
        // Inclure uniquement les stakeholders avec des rôles pertinents pour l'inspection
        const isRelevantRole = inspectionRoles.some(r => roleDescription.includes(r) || stakeholderType.includes(r)) ||
                               roleDescription.includes('ingénieur') ||
                               roleDescription.includes('responsable') ||
                               roleDescription.includes('contrôle') ||
                               roleDescription.includes('bureau') ||
                               stakeholderType.includes('engineering') ||
                               stakeholderType.includes('technical');
        
        if (supplier && isRelevantRole) {
          const isEngineeringConsultant = this.isEngineeringConsultantRole(stakeholder.role_description || stakeholder.stakeholder_type);
          const isTechnicalManager = this.isTechnicalManagerRole(stakeholder.role_description || stakeholder.stakeholder_type);
          
          // Déterminer l'inspecteur par défaut parmi les stakeholders
          if (isEngineeringConsultant && !defaultInspectorId) {
            defaultInspectorId = supplier.id;
          } else if (isTechnicalManager && !defaultInspectorId) {
            defaultInspectorId = supplier.id;
          }

          allInspectors.push({
            id: supplier.id,
            name: supplier.contact_person || supplier.name,
            position: stakeholder.role_description || `Stakeholder - ${supplier.name}`,
            department: supplier.category,
            type: 'stakeholder',
            isEngineeringConsultant,
            isTechnicalManager,
          });
        }
      }

      // Mark default inspector
      const sortedInspectors = allInspectors.map(inspector => ({
        ...inspector,
        isDefault: inspector.id === defaultInspectorId,
      }));

      // Sort: Default first, then engineering consultants, then technical managers, then others
      return sortedInspectors.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
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
   * Vérifie si un rôle de stakeholder est ingénieur conseil
   */
  private static isEngineeringConsultantRole(role?: string | null): boolean {
    if (!role) return false;
    const lower = role.toLowerCase();
    return lower.includes('engineering_consultant') || 
           lower.includes('ingénieur conseil') ||
           lower.includes('bureau d\'études') ||
           lower.includes('consultant');
  }

  /**
   * Vérifie si un rôle de stakeholder est responsable technique
   */
  private static isTechnicalManagerRole(role?: string | null): boolean {
    if (!role) return false;
    const lower = role.toLowerCase();
    return lower.includes('technical_manager') || 
           lower.includes('responsable technique') ||
           lower.includes('chef technique');
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

      return (phases?.map(p => p.id).filter(Boolean) as string[]) || [];
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
