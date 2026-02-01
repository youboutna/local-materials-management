/**
 * DTOs Transforms Index - Centralized Transformers Only
 * Following hexagonal architecture principles from PROMPTS.md
 * Rule #4: No DTOs in entities, proper type separation
 * DTOs are now centralized in /dtos/entities/
 */

// Core transformers (PascalCase - correct naming convention)
export { ProjectTransformer } from './ProjectTransformer';
export { InspectionTransformer } from './InspectionTransformer';
export { MaterialTransformer } from './MaterialTransformer';
export { PaymentTransformer } from './PaymentTransformer';
export { SupplierTransformer } from './SupplierTransformer';
export { EmployeeTransformer } from './EmployeeTransformer';
export { AuthDomainTransformer } from './AuthDomainTransformer';
export { DocumentTransformer } from './DocumentTransformer';

// Additional transformers
export { CheckpointDomainTransformer } from './CheckpointDomainTransformer';
export { DecompteDomainTransformer } from './DecompteDomainTransformer';
export { MilestoneDomainTransformer } from './MilestoneDomainTransformer';
export { PerformanceMonitoringDomainTransformer } from './PerformanceMonitoringDomainTransformer';
export { PhaseTransformer } from './PhaseTransformer';
export { TaskAssignmentDomainTransformer } from './TaskAssignmentDomainTransformer';
export { WorkspaceDomainTransformer } from './WorkspaceDomainTransformer';
export { HierarchyMappingTransformer } from './HierarchyMappingTransformer';
export { NotificationTransformer } from './NotificationTransformer';
export { PaymentBlockingTransformer } from './PaymentBlockingTransformer';
export { RiskTransformer } from './RiskTransformer';
export { StakeholderTransformer } from './StakeholderTransformer';
export { TenderDocumentTransformer } from './TenderDocumentTransformer';
export { TenderDomainTransformer } from './TenderDomainTransformer';
export { TenderEstimateItemTransformer } from './TenderEstimateItemTransformer';
export { TenderEstimateTransformer } from './TenderEstimateTransformer';
export { AdvancedTenderEstimateTransformer } from './AdvancedTenderEstimateTransformer';
export { InspectionPermissionDomainTransformer } from './InspectionPermissionDomainTransformer';

// Shared utilities
export * from './shared';
