/**
 * Domain Repositories Index
 * Export all repository interfaces and implementations
 */

// Repository Interfaces
export * from './IProjectRepository';
export * from './IPhaseRepository';
export * from './IHierarchyRepository';
export * from './IInspectionRepository';
export * from './IPaymentRepository';
export * from './ITaskRepository';
export * from './ITaskAssignmentRepository';
export * from './IMaterialRepository';
export * from './IEmployeeRepository';
export * from './IRiskRepository';
export * from './ITenderRepository';
export * from './ITenderEstimateRepository';
export * from './ITenderDocumentRepository';
export * from './ISupplierRepository';
export * from './IDocumentRepository';
export * from './IQuantityTakeoffRepository';
export * from './IInspectionExecutionRepository';
export * from './IInspectionPaymentValidationRepository';
export type {
  IInspectionPermissionRepository,
  PermissionContext,
  PermissionResult,
  AssignableInspector as InspectionPermissionAssignableInspector
} from './IInspectionPermissionRepository';
export type {
  IInspectionSchedulingRepository,
  InspectionScheduleData,
  InspectionType,
  AssignableInspector as InspectionSchedulingAssignableInspector
} from './IInspectionSchedulingRepository';
export * from './IReportDataTransformerRepository';
export * from './IProjectFormRepository';
export * from './ILoadDataRepository';
export * from './IPerformanceMonitoringRepository';
export * from './IReportingRepository';
export * from './IUserRepository';
export * from './IProjectStakeholderRepository';
export * from './IProjectAlertRepository';
export * from './IParsedInvoiceRepository';
export * from './IDecompteRepository';
export * from './IPVGeneratorRepository';
export * from './IBankGuaranteeRepository';
export * from './IMilestoneRepository';
export type { IInsuranceRepository } from './IInsuranceRepository';
export * from './IWorkspaceRepository';
export { InsuranceRepository } from './InsuranceRepository';
export type { IAuthRepository } from './IAuthRepository';
export type { IStorageRepository } from './IStorageRepository';
export type { INotificationRepository } from './INotificationRepository';

// Repository Implementations (migrated from services)
export * from './MaterialRepository';
export * from './TenderRepository';
export * from './SupplierPaymentRepository';
