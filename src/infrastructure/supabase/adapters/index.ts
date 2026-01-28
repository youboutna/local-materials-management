/**
 * Supabase Adapters Index
 * Export all Supabase repository implementations
 */

// Core adapters
export { SupabaseMaterialAdapter } from './SupabaseMaterialAdapter';
export { SupabaseProjectAdapter } from './SupabaseProjectAdapter';
export { SupabasePhaseAdapter } from './SupabasePhaseAdapter';
export { SupabaseInspectionAdapter } from './SupabaseInspectionAdapter';
export { SupabasePaymentAdapter } from './SupabasePaymentAdapter';
export { SupabaseTaskAdapter } from './SupabaseTaskAdapter';
export { SupabaseEmployeeAdapter } from './SupabaseEmployeeAdapter';
export { SupabaseRiskAdapter } from './SupabaseRiskAdapter';
export { SupabaseTenderAdapter } from './SupabaseTenderAdapter';
export { SupabaseSupplierAdapter } from './SupabaseSupplierAdapter';
export { SupabaseDocumentAdapter } from './SupabaseDocumentAdapter';
export { SupabaseQuantityTakeoffAdapter } from './SupabaseQuantityTakeoffAdapter';
export { SupabaseInspectionExecutionAdapter } from './SupabaseInspectionExecutionAdapter';
export { SupabaseInspectionPaymentValidationAdapter } from './SupabaseInspectionPaymentValidationAdapter';
export { SupabaseLoadDataAdapter } from './SupabaseLoadDataAdapter';
export { SupabaseReportingAdapter } from './SupabaseReportingAdapter';
export { SupabaseReportDataTransformerAdapter } from './SupabaseReportDataTransformerAdapter';
export { SupabaseProjectFormAdapter } from './SupabaseProjectFormAdapter';
export { SupabaseHierarchyAdapter } from './SupabaseHierarchyAdapter';

// New adapters for hexagonal architecture
export { SupabaseUserAdapter } from './SupabaseUserAdapter';
export { SupabaseAuthAdapter } from './SupabaseAuthAdapter';
export { SupabaseStorageAdapter } from './SupabaseStorageAdapter';
export { TenderEstimateAdapter } from './TenderEstimateAdapter';
export { PaymentBlockingAdapter } from './PaymentBlockingAdapter';
export { TaskAssignmentAdapter } from './TaskAssignmentAdapter';
export { SupabaseNotificationAdapter } from './SupabaseNotificationAdapter';
export { SupabaseInsuranceAdapter } from './SupabaseInsuranceAdapter';

// Additional adapters
export { PVGeneratorAdapter } from './PVGeneratorAdapter';
export { BankGuaranteeAdapter } from './BankGuaranteeAdapter';
export { InspectionSchedulingAdapter } from './InspectionSchedulingAdapter';
export { SupabaseParsedInvoiceAdapter } from './SupabaseParsedInvoiceAdapter';
export { SupabaseInspectionPermissionAdapter } from './SupabaseInspectionPermissionAdapter';
export { SupabaseTenderDocumentAdapter } from './SupabaseTenderDocumentAdapter';
export { SupabaseAlertRepository } from './SupabaseAlertRepository';
export { SupabaseMilestoneAdapter } from './SupabaseMilestoneAdapter';
