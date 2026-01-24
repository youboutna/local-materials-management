/**
 * DTOs Transforms Index
 * Centralized exports for all domain transformers
 * Following hexagonal architecture with proper DTO mapping
 */

// Core transformers (PascalCase - correct naming convention)
export { ProjectDomainTransformer } from './ProjectDomainTransformer';
export { InspectionDomainTransformer } from './InspectionDomainTransformer';
export { MaterialDomainTransformer } from './MaterialDomainTransformer';
export { PaymentDomainTransformer } from './PaymentDomainTransformer';
export { SupplierDomainTransformer } from './SupplierDomainTransformer';
export { EmployeeDomainTransformer } from './EmployeeDomainTransformer';
export { AuthDomainTransformer } from './AuthDomainTransformer';
export { DocumentDomainTransformer } from './DocumentDomainTransformer';

// Additional transformers
export { CheckpointDomainTransformer } from './CheckpointDomainTransformer';
export { DecompteDomainTransformer } from './DecompteDomainTransformer';
export { MilestoneDomainTransformer } from './MilestoneDomainTransformer';
export { PerformanceMonitoringDomainTransformer } from './PerformanceMonitoringDomainTransformer';
export { PhaseDomainTransformer } from './PhaseDomainTransformer';
export { TaskAssignmentDomainTransformer } from './TaskAssignmentDomainTransformer';
export { WorkspaceDomainTransformer } from './WorkspaceDomainTransformer';

// DTOs exports
export type { EmployeeDTO, EmployeeDepartment, EmployeePosition } from './EmployeeDTO';
export type { PhaseDTO, PhaseStepDTO, PhaseTaskDTO, PhaseResourcesDTO } from './PhaseDTO';
export type { MilestoneDTO, MilestoneDependencyDTO, MilestoneDeliverableDTO, MilestoneConfigurationDTO } from './MilestoneDTO';
export type { TenderDTO, EvaluationCriteriaDTO } from './TenderDTO';
export type { InspectionDTO, InspectionDocumentDTO } from './InspectionDTO';
export type { PaymentDTO, PaymentDocumentDTO } from './PaymentDTO';

// Shared utilities
export * from './shared';
