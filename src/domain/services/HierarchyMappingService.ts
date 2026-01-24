// Domain Service: Hierarchy Mapping
// Decoupled mapping between hierarchy templates and employee roles

import { Employee, EmployeeRole, Permission } from '../entities/Employee';
import { HierarchyMember } from '../entities/Hierarchy';

// Template permissions (from OrganizationalHierarchyManager)
export interface TemplatePermissions {
  can_approve_projects: boolean;
  can_approve_payments: boolean;
  can_escalate_to_director: boolean;
}

// Position definition from template
export interface PositionTemplate {
  title: string;
  department: string;
  category: string;
  level: number;
  parent?: string;
  permissions: TemplatePermissions;
}

// Mapping result - no direct coupling
export interface RoleMapping {
  suggestedRole: EmployeeRole;
  confidence: number; // 0-1
  matchedPermissions: Permission[];
  missingPermissions: Permission[];
  extraPermissions: Permission[];
}

export class HierarchyMappingService {
  // Private mapping configuration - decoupled from external systems
  private static readonly POSITION_TO_ROLE_MAP: Record<string, EmployeeRole> = {
    'directeur général': 'admin',
    'directeur': 'director',
    'chef de projet': 'project_manager',
    'directeur des études et des travaux': 'technical_manager',
    'directeur de la production et de la commercialisation': 'project_manager',
    'directeur financier': 'finance_manager',
    'conseiller juridique': 'legal',
    'chef chantier': 'supervisor',
    'ingénieur études': 'engineering_consultant',
    'comptable': 'finance_manager',
    'supervisor': 'supervisor',
    'inspector': 'inspector',
    'manager': 'project_manager',
    'consultant': 'engineering_consultant'
  };

  private static readonly CATEGORY_PERMISSIONS: Record<string, Permission[]> = {
    'décisionnel': ['manage_system', 'manage_users', 'manage_team'],
    'technique': ['schedule_inspections', 'execute_inspections'],
    'opérationnel': ['execute_inspections'],
    'budgétaire': ['approve_payments'],
    'comptable': ['approve_payments'],
    'contractuel': [],
    'communication': [],
    'performance': ['manage_team']
  };

  // Convert template permissions to domain permissions
  static templateToDomainPermissions(template: TemplatePermissions): Permission[] {
    const permissions: Permission[] = [];
    
    if (template.can_approve_projects) permissions.push('approve_projects');
    if (template.can_approve_payments) permissions.push('approve_payments');
    // can_escalate_to_director is not a domain permission - it's organizational logic
    
    return permissions;
  }

  // Suggest employee role based on position template
  static suggestRoleForPosition(position: PositionTemplate): RoleMapping {
    const normalizedTitle = position.title.toLowerCase().trim();
    
    // Find best matching role
    let suggestedRole: EmployeeRole = 'worker'; // default
    let confidence = 0.1;
    
    // Exact match
    for (const [titlePattern, role] of Object.entries(this.POSITION_TO_ROLE_MAP)) {
      if (normalizedTitle === titlePattern) {
        suggestedRole = role;
        confidence = 1.0;
        break;
      }
    }
    
    // Partial match
    if (confidence < 0.8) {
      for (const [titlePattern, role] of Object.entries(this.POSITION_TO_ROLE_MAP)) {
        if (normalizedTitle.includes(titlePattern) || titlePattern.includes(normalizedTitle)) {
          suggestedRole = role;
          confidence = 0.7;
          break;
        }
      }
    }
    
    // Category-based suggestion
    if (confidence < 0.5) {
      const categoryPerms = this.CATEGORY_PERMISSIONS[position.category] || [];
      if (categoryPerms.includes('manage_system')) {
        suggestedRole = 'admin';
        confidence = 0.6;
      } else if (categoryPerms.includes('manage_team')) {
        suggestedRole = 'director';
        confidence = 0.5;
      }
    }
    
    // Calculate permission matches
    const templatePerms = this.templateToDomainPermissions(position.permissions);
    const rolePerms = Employee['ROLE_PERMISSIONS'][suggestedRole] || [];
    
    const matchedPermissions = templatePerms.filter(p => rolePerms.includes(p));
    const missingPermissions = templatePerms.filter(p => !rolePerms.includes(p));
    const extraPermissions = rolePerms.filter(p => !templatePerms.includes(p));
    
    return {
      suggestedRole,
      confidence,
      matchedPermissions,
      missingPermissions,
      extraPermissions
    };
  }

  // Create hierarchy member from employee and position (decoupled)
  static createHierarchyMember(
    employee: Employee,
    position: PositionTemplate,
    hierarchyId: string,
    organizationName: string
  ): HierarchyMember {
    // Use employee's actual permissions, not template permissions
    // This maintains the single source of truth principle
    
    return {
      hierarchyId,
      employeeId: employee.id,
      employeeName: employee.fullName,
      positionTitle: position.title,
      department: position.department,
      level: position.level,
      parentId: null, // Will be set by hierarchy building logic
      organizationName,
      canApproveProjects: employee.canApproveProjects(), // From employee role
      canApprovePayments: employee.canApprovePayments(),   // From employee role
      employeeEmail: employee.email || '',
      employeePhone: employee.phone || ''
    };
  }

  // Validate role assignment consistency
  static validateRoleAssignment(
    employee: Employee,
    position: PositionTemplate
  ): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const mapping = this.suggestRoleForPosition(position);
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Check if current role matches suggestion
    if (employee.role.name !== mapping.suggestedRole) {
      if (mapping.confidence > 0.8) {
        warnings.push(
          `Rôle suggéré pour "${position.title}": ${mapping.suggestedRole} (actuel: ${employee.role.name})`
        );
      }
    }
    
    // Check permission gaps
    if (mapping.missingPermissions.length > 0) {
      suggestions.push(
        `Permissions manquantes pour le rôle: ${mapping.missingPermissions.join(', ')}`
      );
    }
    
    // Check permission excess
    if (mapping.extraPermissions.length > 0) {
      suggestions.push(
        `Permissions supplémentaires non requises: ${mapping.extraPermissions.join(', ')}`
      );
    }
    
    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions
    };
  }

  // Get all compatible roles for a position
  static getCompatibleRoles(position: PositionTemplate): Array<{
    role: EmployeeRole;
    compatibility: number;
    reason: string;
  }> {
    const templatePerms = this.templateToDomainPermissions(position.permissions);
    const results: Array<{
      role: EmployeeRole;
      compatibility: number;
      reason: string;
    }> = [];
    
    for (const role of Object.keys(Employee['ROLE_PERMISSIONS']) as EmployeeRole[]) {
      const rolePerms = Employee['ROLE_PERMISSIONS'][role];
      const matchedPerms = templatePerms.filter(p => rolePerms.includes(p));
      const compatibility = templatePerms.length > 0 ? matchedPerms.length / templatePerms.length : 0;
      
      let reason = '';
      if (compatibility === 1) reason = 'Parfaitement compatible';
      else if (compatibility >= 0.7) reason = 'Bon match';
      else if (compatibility >= 0.5) reason = 'Partiellement compatible';
      else reason = 'Incompatible';
      
      results.push({ role, compatibility, reason });
    }
    
    return results.sort((a, b) => b.compatibility - a.compatibility);
  }
}
