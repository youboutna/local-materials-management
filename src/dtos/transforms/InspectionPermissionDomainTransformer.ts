/**
 * Inspection Permission Domain Transformer
 * Handles permission-based transformations for inspection workflows
 */

import { InspectionDTO, InspectionStatus } from '@/dtos/entities/InspectionDTO';

// Permission result interface
interface PermissionResult {
  hasPermission: boolean;
  reason?: string;
  requiredRole?: string;
  availableActions?: string[];
}

// Permission request interface
interface PermissionRequest {
  userId: string;
  userRole: string;
  inspectionId: string;
  action: string;
  inspectionStatus?: InspectionStatus;
}

// Permission action DTO
interface PermissionActionDTO {
  action: string;
  allowed: boolean;
  reason?: string;
  requiresApproval: boolean;
  approvalRoles?: string[];
}

export class InspectionPermissionDomainTransformer {
  /**
   * Check if user has permission for inspection action
   */
  static checkPermission(request: PermissionRequest): PermissionResult {
    const { userRole, action, inspectionStatus } = request;

    // Admin has all permissions
    if (userRole === 'admin' || userRole === 'director') {
      return { hasPermission: true };
    }

    // Define action permissions by role
    const rolePermissions: Record<string, string[]> = {
      inspector: ['view', 'update', 'submit', 'add_comment', 'upload_document'],
      supervisor: ['view', 'update', 'submit', 'approve', 'reject', 'add_comment', 'upload_document', 'assign'],
      project_manager: ['view', 'approve', 'reject', 'add_comment', 'reassign'],
      viewer: ['view']
    };

    const allowedActions = rolePermissions[userRole] || [];
    const hasPermission = allowedActions.includes(action);

    if (!hasPermission) {
      return {
        hasPermission: false,
        reason: `Role '${userRole}' does not have permission for action '${action}'`,
        requiredRole: this.getRequiredRole(action)
      };
    }

    // Status-based restrictions
    if (inspectionStatus) {
      const statusRestrictions = this.getStatusRestrictions(inspectionStatus);
      if (!statusRestrictions.allowedActions.includes(action)) {
        return {
          hasPermission: false,
          reason: `Action '${action}' not allowed when inspection status is '${inspectionStatus}'`,
          availableActions: statusRestrictions.allowedActions
        };
      }
    }

    return { hasPermission: true };
  }

  /**
   * Get required role for an action
   */
  private static getRequiredRole(action: string): string {
    const actionRoles: Record<string, string> = {
      approve: 'supervisor',
      reject: 'supervisor',
      assign: 'supervisor',
      reassign: 'project_manager',
      delete: 'admin'
    };
    return actionRoles[action] || 'inspector';
  }

  /**
   * Get status restrictions
   */
  private static getStatusRestrictions(status: InspectionStatus): { allowedActions: string[] } {
    const restrictions: Record<InspectionStatus, string[]> = {
      [InspectionStatus.SCHEDULED]: ['view', 'update', 'cancel', 'add_comment'],
      [InspectionStatus.PENDING]: ['view', 'update', 'submit', 'add_comment', 'upload_document'],
      [InspectionStatus.PLANNED]: ['view', 'update', 'submit', 'add_comment'],
      [InspectionStatus.IN_PROGRESS]: ['view', 'update', 'submit', 'add_comment', 'upload_document'],
      [InspectionStatus.COMPLETED]: ['view', 'approve', 'reject', 'add_comment'],
      [InspectionStatus.REQUIRES_REVIEW]: ['view', 'approve', 'reject', 'add_comment'],
      [InspectionStatus.REQUIRES_CHANGES]: ['view', 'update', 'submit', 'add_comment'],
      [InspectionStatus.APPROVED]: ['view', 'add_comment'],
      [InspectionStatus.REJECTED]: ['view', 'add_comment', 'resubmit'],
      [InspectionStatus.CANCELLED]: ['view']
    };
    return { allowedActions: restrictions[status] || ['view'] };
  }

  /**
   * Transform permission result to action DTOs
   */
  static toPermissionActions(result: PermissionResult, availableActions: string[]): PermissionActionDTO[] {
    return availableActions.map(action => ({
      action,
      allowed: result.hasPermission || (result.availableActions?.includes(action) ?? false),
      reason: result.hasPermission ? undefined : result.reason,
      requiresApproval: this.determineApprovalRequirement(result, action),
      approvalRoles: this.getApprovalRoles(result, action)
    }));
  }

  /**
   * Determine if approval is required
   */
  private static determineApprovalRequirement(result: PermissionResult, _action: string): boolean {
    return !result.hasPermission && 
           (result.reason?.includes('high_value') || 
            result.reason?.includes('critical') ||
            result.reason?.includes('special')) || false;
  }

  /**
   * Get roles that need to approve
   */
  private static getApprovalRoles(result: PermissionResult, action: string): string[] {
    const roles: string[] = [];
    
    if (action === 'approve' || action === 'reject') {
      roles.push('supervisor', 'project_manager');
    }
    
    if (result.requiredRole) {
      roles.push(result.requiredRole);
    }
    
    return [...new Set(roles)];
  }

  /**
   * Get available actions for inspection based on status and user role
   */
  static getAvailableActions(inspection: InspectionDTO, userRole: string): string[] {
    const request: PermissionRequest = {
      userId: '',
      userRole,
      inspectionId: inspection.id,
      action: 'view',
      inspectionStatus: inspection.status
    };

    const allActions = ['view', 'update', 'submit', 'approve', 'reject', 'add_comment', 'upload_document', 'assign', 'cancel'];
    
    return allActions.filter(action => {
      const result = this.checkPermission({ ...request, action });
      return result.hasPermission;
    });
  }

  /**
   * Validate bulk permission check
   */
  static checkBulkPermissions(requests: PermissionRequest[]): Map<string, PermissionResult> {
    const results = new Map<string, PermissionResult>();
    
    for (const request of requests) {
      const key = `${request.inspectionId}:${request.action}`;
      results.set(key, this.checkPermission(request));
    }
    
    return results;
  }
}
