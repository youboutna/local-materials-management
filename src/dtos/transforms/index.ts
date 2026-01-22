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

// Shared utilities
export * from './shared';
