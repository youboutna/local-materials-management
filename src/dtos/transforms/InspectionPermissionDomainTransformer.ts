/**
 * Inspection Permission Domain Transformer
 * Handles conversion between DTOs and Repository types
 * Following hexagonal architecture principles
 */

import { 
  PermissionContext, 
  AssignableInspector, 
  PermissionResult 
} from '@/domain/repositories/IInspectionPermissionRepository';
import {
  PermissionContextDTO,
  AssignableInspectorDTO,
  PermissionResultDTO
} from '@/dtos/entities/InspectionPermissionDTO';

export class InspectionPermissionDomainTransformer {
  
  /**
   * Convert DTO to repository context
   */
  static toRepositoryContext(dto: PermissionContextDTO): PermissionContext {
    return {
      userId: dto.userId,
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      inspectionType: dto.inspectionType
    };
  }

  /**
   * Convert repository context to DTO
   */
  static toPermissionContextDTO(context: PermissionContext): PermissionContextDTO {
    return {
      userId: context.userId,
      projectId: context.projectId,
      phaseId: context.phaseId,
      inspectionType: context.inspectionType
    };
  }

  /**
   * Convert repository result to DTO
   */
  static toPermissionResultDTO(result: PermissionResult): PermissionResultDTO {
    return {
      hasPermission: result.hasPermission,
      reason: result.reason,
      alternativeInspectors: result.alternativeInspectors?.map(inspector => 
        this.toAssignableInspectorDTO(inspector)
      ),
      suggestedActions: this.generateSuggestedActions(result),
      requiresApproval: this.determineApprovalRequirement(result),
      approvalRequiredFrom: this.getApprovalRoles(result)
    };
  }

  /**
   * Convert repository inspector to DTO
   */
  static toAssignableInspectorDTO(inspector: AssignableInspector): AssignableInspectorDTO {
    return {
      id: inspector.id,
      name: inspector.name,
      email: inspector.email,
      role: inspector.role,
      specializations: inspector.specializations,
      certifications: inspector.certifications,
      maxConcurrentInspections: inspector.maxConcurrentInspections,
      currentInspections: inspector.currentInspections,
      availabilityStatus: this.determineAvailabilityStatus(inspector),
      lastInspectionDate: this.generateLastInspectionDate(inspector),
      averageRating: this.generateAverageRating(inspector),
      inspectionCount: inspector.currentInspections,
      isDefault: this.determineDefaultInspector(inspector),
      isEngineeringConsultant: this.determineEngineeringConsultant(inspector),
      isTechnicalManager: this.determineTechnicalManager(inspector)
    };
  }

  /**
   * Convert DTO to repository inspector (if needed)
   */
  static toAssignableInspector(dto: AssignableInspectorDTO): AssignableInspector {
    return {
      id: dto.id,
      name: dto.name,
      email: dto.email,
      role: dto.role,
      specializations: dto.specializations,
      certifications: dto.certifications,
      maxConcurrentInspections: dto.maxConcurrentInspections,
      currentInspections: dto.currentInspections
    };
  }

  // ============= Private Helper Methods =============

  /**
   * Generate suggested actions based on permission result
   */
  private static generateSuggestedActions(result: PermissionResult): string[] {
    const actions: string[] = [];
    
    if (!result.hasPermission) {
      if (result.reason?.includes('permission')) {
        actions.push('Contact project manager for permission');
        actions.push('Request temporary access rights');
      }
      if (result.reason?.includes('certification')) {
        actions.push('Update inspector certifications');
        actions.push('Schedule certification renewal');
      }
      if (result.reason?.includes('availability')) {
        actions.push('Choose alternative inspector');
        actions.push('Schedule for later date');
      }
    }
    
    return actions;
  }

  /**
   * Determine if approval is required
   */
  private static determineApprovalRequirement(result: PermissionResult): boolean {
    return !result.hasPermission && 
           (result.reason?.includes('high_value') || 
            result.reason?.includes('critical') ||
            result.reason?.includes('special'));
  }

  /**
   * Get roles that need to approve
   */
  private static getApprovalRoles(result: PermissionResult): string[] {
    const roles: string[] = [];
    
    if (result.reason?.includes('project')) {
      roles.push('project_manager');
    }
    if (result.reason?.includes('technical')) {
      roles.push('technical_manager');
    }
    if (result.reason?.includes('high_value')) {
      roles.push('director');
    }
    
    return roles;
  }

  /**
   * Determine availability status based on current assignments
   */
  private static determineAvailabilityStatus(inspector: AssignableInspector): 'available' | 'busy' | 'unavailable' {
    const ratio = inspector.currentInspections / inspector.maxConcurrentInspections;
    
    if (ratio >= 1) return 'unavailable';
    if (ratio >= 0.8) return 'busy';
    return 'available';
  }

  /**
   * Generate last inspection date (mock for now)
   */
  private static generateLastInspectionDate(inspector: AssignableInspector): string {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  }

  /**
   * Generate average rating (mock for now)
   */
  private static generateAverageRating(inspector: AssignableInspector): number {
    // Base rating on experience (current inspections)
    const baseRating = 3.5;
    const experienceBonus = Math.min(inspector.currentInspections * 0.1, 1.5);
    return Math.min(baseRating + experienceBonus, 5.0);
  }

  /**
   * Determine if inspector is default
   */
  private static determineDefaultInspector(inspector: AssignableInspector): boolean {
    // Default inspector has high rating and availability
    return inspector.currentInspections > 5 && 
           inspector.currentInspections < inspector.maxConcurrentInspections;
  }

  /**
   * Determine if inspector is engineering consultant
   */
  private static determineEngineeringConsultant(inspector: AssignableInspector): boolean {
    return inspector.role === 'engineering_consultant' || 
           inspector.specializations.includes('technical');
  }

  /**
   * Determine if inspector is technical manager
   */
  private static determineTechnicalManager(inspector: AssignableInspector): boolean {
    return inspector.role === 'technical_manager' || 
           inspector.specializations.includes('management');
  }
}
