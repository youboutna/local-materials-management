/**
 * DTOs Transforms Index
 * Centralized exports for all domain transformers
 * Following hexagonal architecture with proper DTO mapping
 */

// Core transformers (PascalCase - correct naming convention)
export { ProjectTransformer } from './ProjectTransformer'; // Unified transformer (includes ProjectDomainTransformer functionality)
export { InspectionTransformer } from './InspectionTransformer'; // Consolidated transformer (includes InspectionDomainTransformer functionality)
export { MaterialTransformer } from './MaterialTransformer'; // Consolidated transformer (includes MaterialDomainTransformer functionality)
export { PaymentTransformer } from './PaymentTransformer'; // Consolidated transformer (includes PaymentDomainTransformer functionality)
export { SupplierTransformer } from './SupplierTransformer'; // Consolidated transformer (includes SupplierDomainTransformer functionality)
export { EmployeeTransformer } from './EmployeeTransformer'; // Consolidated transformer (includes EmployeeDomainTransformer functionality)
export { AuthDomainTransformer } from './AuthDomainTransformer';
export { DocumentTransformer } from './DocumentTransformer'; // Consolidated transformer (includes DocumentDomainTransformer functionality)

// Additional transformers
export { CheckpointDomainTransformer } from './CheckpointDomainTransformer';
export { DecompteDomainTransformer } from './DecompteDomainTransformer';
export { MilestoneDomainTransformer } from './MilestoneDomainTransformer';
export { PerformanceMonitoringDomainTransformer } from './PerformanceMonitoringDomainTransformer';
export { PhaseTransformer } from './PhaseTransformer'; // Consolidated transformer (includes PhaseDomainTransformer functionality)
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
