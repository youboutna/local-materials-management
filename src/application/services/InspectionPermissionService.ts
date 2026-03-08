/**
 * Inspection Permission Service - Hexagonal Architecture
 * Business logic for inspection permission management
 */

import { 
  IInspectionPermissionRepository, 
  PermissionContext, 
  AssignableInspector, 
  PermissionResult 
} from '@/domain/repositories/IInspectionPermissionRepository';
import {
  PermissionContextDTO,
  AssignableInspectorDTO,
  PermissionResultDTO
} from '@/dtos/entities/InspectionPermissionDTO';

export class InspectionPermissionService {
  constructor(
    private inspectionPermissionRepository: IInspectionPermissionRepository
  ) {}
  
  /**
   * Check if user has permission to schedule inspection
   */
  async checkSchedulingPermission(params: { context: PermissionContextDTO }): Promise<PermissionResultDTO> {
    const repositoryContext = this.toRepositoryContext(params.context);
    const result = await this.inspectionPermissionRepository.checkSchedulingPermission(repositoryContext);
    return this.toPermissionResultDTO(result);
  }

  /**
   * Get assignable inspectors for inspection
   */
  async getAssignableInspectors(params: { context: PermissionContextDTO }): Promise<AssignableInspectorDTO[]> {
    const repositoryContext = this.toRepositoryContext(params.context);
    const inspectors = await this.inspectionPermissionRepository.getAssignableInspectors(repositoryContext);
    return inspectors.map(inspector => this.toAssignableInspectorDTO(inspector));
  }

  /**
   * Validate inspector assignment
   */
  async validateInspectorAssignment(params: { 
    inspectorId: string; 
    context: PermissionContextDTO 
  }): Promise<PermissionResultDTO> {
    const repositoryContext = this.toRepositoryContext(params.context);
    const result = await this.inspectionPermissionRepository.validateInspectorAssignment(params.inspectorId, repositoryContext);
    return this.toPermissionResultDTO(result);
  }

  /**
   * Transform DTO context to repository context
   */
  private toRepositoryContext(dto: PermissionContextDTO): PermissionContext {
    return {
      userId: dto.userId,
      userRole: dto.userRole,
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      inspectionId: dto.inspectionId,
      action: dto.action
    };
  }

  /**
   * Transform repository result to DTO
   */
  private toPermissionResultDTO(result: PermissionResult): PermissionResultDTO {
    return {
      hasPermission: result.hasPermission,
      reason: result.reason,
      requiredRole: result.requiredRole,
      availableActions: result.availableActions
    };
  }

  /**
   * Transform assignable inspector to DTO
   */
  private toAssignableInspectorDTO(inspector: AssignableInspector): AssignableInspectorDTO {
    return {
      id: inspector.id,
      name: inspector.name,
      role: inspector.role,
      department: inspector.department,
      availability: inspector.availability,
      currentWorkload: inspector.currentWorkload,
      skills: inspector.skills
    };
  }
}
