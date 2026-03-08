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
  
  async checkSchedulingPermission(params: { context: PermissionContextDTO }): Promise<PermissionResultDTO> {
    const repositoryContext: PermissionContext = {
      userId: params.context.userId,
      projectId: params.context.projectId,
      phaseId: params.context.phaseId,
      inspectionType: params.context.inspectionType
    };
    const result = await this.inspectionPermissionRepository.checkSchedulingPermission(repositoryContext);
    return {
      hasPermission: result.hasPermission,
      reason: result.reason
    };
  }

  async getAssignableInspectors(params: { context: PermissionContextDTO }): Promise<AssignableInspectorDTO[]> {
    const repositoryContext: PermissionContext = {
      userId: params.context.userId,
      projectId: params.context.projectId,
      phaseId: params.context.phaseId,
      inspectionType: params.context.inspectionType
    };
    const inspectors = await this.inspectionPermissionRepository.getAssignableInspectors(repositoryContext);
    return inspectors.map(inspector => ({
      id: inspector.id,
      name: inspector.name,
      email: inspector.email,
      role: inspector.role,
      specializations: inspector.specializations,
      certifications: inspector.certifications,
      maxConcurrentInspections: inspector.maxConcurrentInspections,
      currentInspections: inspector.currentInspections
    }));
  }

  async validateInspectorAssignment(params: { 
    inspectorId: string; 
    context: PermissionContextDTO 
  }): Promise<PermissionResultDTO> {
    const repositoryContext: PermissionContext = {
      userId: params.context.userId,
      projectId: params.context.projectId,
      phaseId: params.context.phaseId,
      inspectionType: params.context.inspectionType
    };
    const result = await this.inspectionPermissionRepository.validateInspectorAssignment(params.inspectorId, repositoryContext);
    return {
      hasPermission: result.hasPermission,
      reason: result.reason
    };
  }
}
