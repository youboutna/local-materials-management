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
import { InspectionPermissionDomainTransformer } from '@/dtos/transforms/InspectionPermissionDomainTransformer';

export class InspectionPermissionService {
  constructor(
    private inspectionPermissionRepository: IInspectionPermissionRepository
  ) {}
  
  /**
   * Check if user has permission to schedule inspection
   */
  async checkSchedulingPermission(params: { context: PermissionContextDTO }): Promise<PermissionResultDTO> {
    const repositoryContext = InspectionPermissionDomainTransformer.toRepositoryContext(params.context);
    const result = await this.inspectionPermissionRepository.checkSchedulingPermission(repositoryContext);
    return InspectionPermissionDomainTransformer.toPermissionResultDTO(result);
  }

  /**
   * Get assignable inspectors for inspection
   */
  async getAssignableInspectors(params: { context: PermissionContextDTO }): Promise<AssignableInspectorDTO[]> {
    const repositoryContext = InspectionPermissionDomainTransformer.toRepositoryContext(params.context);
    const inspectors = await this.inspectionPermissionRepository.getAssignableInspectors(repositoryContext);
    return inspectors.map(inspector => InspectionPermissionDomainTransformer.toAssignableInspectorDTO(inspector));
  }

  /**
   * Validate inspector assignment
   */
  async validateInspectorAssignment(params: { 
    inspectorId: string; 
    context: PermissionContextDTO 
  }): Promise<PermissionResultDTO> {
    const repositoryContext = InspectionPermissionDomainTransformer.toRepositoryContext(params.context);
    const result = await this.inspectionPermissionRepository.validateInspectorAssignment(params.inspectorId, repositoryContext);
    return InspectionPermissionDomainTransformer.toPermissionResultDTO(result);
  }

  /**
   * Static method for backward compatibility
   */
  static async canScheduleInspection(context: PermissionContext): Promise<PermissionResult> {
    // This method needs repository injection - will be updated when RepositoryFactory is ready
    throw new Error('Static method deprecated - use RepositoryFactory to get service instance');
  }


}
