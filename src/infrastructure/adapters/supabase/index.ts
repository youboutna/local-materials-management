/**
 * Supabase Adapters Index
 * Export all Supabase repository implementations
 */

// Core adapters
export { SupabaseDocumentAdapter } from './SupabaseDocumentAdapter';
export { SupabaseEmployeeAdapter } from './SupabaseEmployeeAdapter';
export { SupabaseHierarchyAdapter } from './SupabaseHierarchyAdapter';
export { SupabaseInspectionAdapter } from './SupabaseInspectionAdapter';
export { SupabaseInspectionExecutionAdapter } from './SupabaseInspectionExecutionAdapter';
export { SupabaseInspectionPaymentValidationAdapter } from './SupabaseInspectionPaymentValidationAdapter';
export { SupabaseLoadDataAdapter } from './SupabaseLoadDataAdapter';
export { SupabaseMaterialAdapter } from './SupabaseMaterialAdapter';
export { SupabasePaymentAdapter } from './SupabasePaymentAdapter';
export { SupabasePaymentBlockAdapter } from './SupabasePaymentBlockAdapter';
export { SupabasePaymentControlActionAdapter } from './SupabasePaymentControlActionAdapter';
export { SupabasePhaseAdapter } from './SupabasePhaseAdapter';
export { SupabaseProjectAdapter } from './SupabaseProjectAdapter';
export { SupabaseProjectFormAdapter } from './SupabaseProjectFormAdapter';
export { SupabaseQuantityTakeoffAdapter } from './SupabaseQuantityTakeoffAdapter';
export { SupabaseReportDataTransformerAdapter } from './SupabaseReportDataTransformerAdapter';
export { SupabaseReportingAdapter } from './SupabaseReportingAdapter';
export { SupabaseRiskAdapter } from './SupabaseRiskAdapter';
export { SupabaseRiskTaskRelationAdapter } from './SupabaseRiskTaskRelationAdapter';
export { SupabaseSupplierAdapter } from './SupabaseSupplierAdapter';
export { SupabaseTenderAdapter } from './SupabaseTenderAdapter';

// New adapters for hexagonal architecture
export { PaymentBlockingAdapter } from './PaymentBlockingAdapter';
export { SupabaseAuthAdapter } from './SupabaseAuthAdapter';
export { SupabaseComplianceAdapter } from './SupabaseComplianceAdapter';
export { SupabaseInsuranceAdapter } from './SupabaseInsuranceAdapter';
export { SupabaseMonitoringAdapter } from './SupabaseMonitoringAdapter';
export { SupabaseNotificationAdapter } from './SupabaseNotificationAdapter';
export { SupabaseStorageAdapter } from './SupabaseStorageAdapter';
export { SupabaseUserAdapter } from './SupabaseUserAdapter';
export { TaskAssignmentAdapter } from './TaskAssignmentAdapter';
export { TenderEstimateAdapter } from './TenderEstimateAdapter';

// Additional adapters
export { BankGuaranteeAdapter } from './BankGuaranteeAdapter';
export { InspectionSchedulingAdapter } from './InspectionSchedulingAdapter';
export { PVGeneratorAdapter } from './PVGeneratorAdapter';
export { SupabaseAlertAdapter } from './SupabaseAlertAdapter';
export { SupabaseContactMessageAdapter } from './SupabaseContactMessageAdapter';
export { SupabaseInspectionPermissionAdapter } from './SupabaseInspectionPermissionAdapter';
export { SupabaseMilestoneAdapter } from './SupabaseMilestoneAdapter';
export { SupabaseMonitoringAlertAdapter } from './SupabaseMonitoringAlertAdapter';
export { SupabaseParsedInvoiceAdapter } from './SupabaseParsedInvoiceAdapter';
export { SupabaseProjectStakeholderAdapter } from './SupabaseProjectStakeholderAdapter';
export { SupabaseStakeholderAdapter } from './SupabaseStakeholderAdapter';
export { SupabaseSupplierPaymentAdapter } from './SupabaseSupplierPaymentAdapter';
export { SupabaseTenderDocumentAdapter } from './SupabaseTenderDocumentAdapter';

// Strategic linkage adapters
export { SupabaseProjectBudgetLinkAdapter } from './SupabaseProjectBudgetLinkAdapter';
export { SupabaseProjectStrategyLinkAdapter } from './SupabaseProjectStrategyLinkAdapter';

// Missing adapters
export { LocationRepository } from './LocationRepository';
export { SupabaseTenderSharingAdapter } from './SupabaseTenderSharingAdapter';
export { SupabaseWorkspaceAdapter } from './SupabaseWorkspaceAdapter';

// Auth adapters (multi-provider support)
