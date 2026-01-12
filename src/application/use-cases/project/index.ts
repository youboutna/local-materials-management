/**
 * Project Use Cases Index
 * Export all project-related use cases
 */

export { GetProjectHierarchyUseCase, type GetProjectHierarchyResult } from './GetProjectHierarchyUseCase';
export { GetBreadcrumbDataUseCase, type BreadcrumbData, type GetBreadcrumbDataResult } from './GetBreadcrumbDataUseCase';
export { GetPhaseDetailsUseCase, type GetPhaseDetailsResult } from './GetPhaseDetailsUseCase';
export { GetEscalationTargetsUseCase, type GetEscalationTargetsResult } from './GetEscalationTargetsUseCase';
export { 
  GetProjectsListUseCase, 
  GetProjectByIdUseCase,
  CreateProjectUseCase,
  UpdateProjectUseCase,
  DeleteProjectUseCase,
  type GetProjectsListResult,
  type GetProjectByIdResult,
  type CreateProjectInput,
  type CreateProjectResult,
  type UpdateProjectInput,
  type UpdateProjectResult,
  type DeleteProjectResult
} from './ProjectCrudUseCases';
