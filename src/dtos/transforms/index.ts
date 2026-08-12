/**
 * DTOs Transforms Index - Centralized Transformers Only
 * Following hexagonal architecture principles from PROMPTS.md
 * Rule #4: No DTOs in entities, proper type separation
 * DTOs are now centralized in /dtos/entities/
 */

// Core transformers (PascalCase - correct naming convention)
export { AuthDomainTransformer } from './AuthDomainTransformer';
export { DocumentTransformer } from './DocumentTransformer';
export { EmployeeTransformer } from './EmployeeTransformer';
export { InspectionTransformer } from './InspectionTransformer';
export { MaterialTransformer } from './MaterialTransformer';
export { PaymentTransformer } from './PaymentTransformer';
export { ProjectTransformer } from './ProjectTransformer';
export { SupplierTransformer } from './SupplierTransformer';
// Case conversion transformers (Rule #2 & Rule #9 compliance)
export {
  camelToSnakeCase, InspectionTransformer as CaseInspectionTransformer,
  ProjectTransformer as CaseProjectTransformer,
  GenericTransformer, snakeToCamelCase, transformKeysToCamelCase,
  transformKeysToSnakeCase
} from './CaseTransformers';

// Additional transformers
export { AdvancedTenderEstimateTransformer } from './AdvancedTenderEstimateTransformer';
export { CheckpointDomainTransformer } from './CheckpointDomainTransformer';
export { DecompteDomainTransformer } from './DecompteDomainTransformer';
export { HierarchyMappingTransformer } from './HierarchyMappingTransformer';
export { InspectionPermissionDomainTransformer } from './InspectionPermissionDomainTransformer';
export { NotificationTransformer } from './NotificationTransformer';
export { PaymentBlockingTransformer } from './PaymentBlockingTransformer';
export { PerformanceMonitoringDomainTransformer } from './PerformanceMonitoringDomainTransformer';
export { PhaseTransformer } from './PhaseTransformer';
export { RiskTransformer } from './RiskTransformer';
export { StakeholderTransformer } from './StakeholderTransformer';
export { TenderDocumentTransformer } from './TenderDocumentTransformer';
export { TenderDomainTransformer } from './TenderDomainTransformer';
export { TenderEstimateItemTransformer } from './TenderEstimateItemTransformer';
export { TenderEstimateTransformer } from './TenderEstimateTransformer';
export { WorkspaceDomainTransformer } from './WorkspaceDomainTransformer';

// Workflow transformers
export { alertTransformer } from './AlertTransformer';
export { ProjectWorkflowTransforms } from './ProjectWorkflowTransforms';
export { WorkflowTransformer } from './WorkflowTransformer';
// Shared utilities
export * from './shared';

