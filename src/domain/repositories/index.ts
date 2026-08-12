/**
 * Domain Repositories Index
 * Central export point for all repository interfaces
 * Following hexagonal architecture principles
 */

// ============================================================================
// CORE REPOSITORIES
// ============================================================================

export type { IDocumentRepository } from './IDocumentRepository';
export type { IEmployeeRepository } from './IEmployeeRepository';
export type { IMaterialRepository } from './IMaterialRepository';
export type { IPhaseRepository } from './IPhaseRepository';
export type { IProjectRepository } from './IProjectRepository';
export type { ISupplierRepository } from './ISupplierRepository';
export type { ITaskAssignmentRepository } from './ITaskAssignmentRepository';
export type { IUserRepository } from './IUserRepository';

// ============================================================================
// INSPECTION & QUALITY
// ============================================================================

export type { IInspectionExecutionRepository } from './IInspectionExecutionRepository';
export type { IInspectionPaymentValidationRepository } from './IInspectionPaymentValidationRepository';
export type { IInspectionPermissionRepository } from './IInspectionPermissionRepository';
export type { IInspectionRepository } from './IInspectionRepository';
export type { IInspectionSchedulingRepository } from './IInspectionSchedulingRepository';

// ============================================================================
// FINANCIAL REPOSITORIES
// ============================================================================

export type { IBankGuaranteeRepository } from './IBankGuaranteeRepository';
export type { IInsuranceRepository } from './IInsuranceRepository';
export type { IParsedInvoiceRepository } from './IParsedInvoiceRepository';
export type { IPaymentBlockingRepository } from './IPaymentBlockingRepository';
export type { IPaymentRepository } from './IPaymentRepository';

// ============================================================================
// TENDER & PROCUREMENT
// ============================================================================

export type { ITenderDocumentRepository } from './ITenderDocumentRepository';
export type { ITenderEstimateRepository } from './ITenderEstimateRepository';
export type { ITenderRepository } from './ITenderRepository';
export type { ITenderSharingRepository } from './ITenderSharingRepository';

// ============================================================================
// PROJECT MANAGEMENT
// ============================================================================

export type { IProjectBudgetLinkRepository, IProjectBudgetLinkRepository as IProjectBudgetLinkRepositoryAlias, IProjectBudgetLinkRepository as IProjectBudgetLinkRepositoryType } from './IProjectBudgetLinkRepository';
export type { IProjectFormRepository } from './IProjectFormRepository';
export type { IProjectStakeholderRepository } from './IProjectStakeholderRepository';
export type { IProjectStrategyLinkRepository } from './IProjectStrategyLinkRepository';

// ============================================================================
// NOTIFICATIONS & ALERTS
// ============================================================================

export type { IAlertRepository } from './IAlertRepository';
export type { IContactMessageRepository } from './IContactMessageRepository';
export type { INotificationRepository } from './INotificationRepository';

// ============================================================================
// AUTH & SECURITY
// ============================================================================

export type { IAuthRepository } from './IAuthRepository';
export type { IOAuthProviderRepository } from './IOAuthProviderRepository';

// ============================================================================
// STORAGE & HIERARCHY
// ============================================================================

export type { IHierarchyRepository } from './IHierarchyRepository';
export type { IOrganizationHierarchyRepository } from './IOrganizationHierarchyRepository';
export type { IOrganizationRepository } from './IOrganizationRepository';
export type { IStorageRepository } from './IStorageRepository';
export type { IWorkspaceRepository } from './IWorkspaceRepository';
export type { ILocationRepository } from './LocationRepository';

// ============================================================================
// MONITORING & REPORTS
// ============================================================================

export type { ILoadDataRepository } from './ILoadDataRepository';
export type { IMonitoringRepository } from './IMonitoringRepository';
export type { IQuantityTakeoffRepository } from './IQuantityTakeoffRepository';
export type { IReportDataTransformerRepository } from './IReportDataTransformerRepository';
export type { IReportingRepository } from './IReportingRepository';

// ============================================================================
// HR & STAKEHOLDERS
// ============================================================================

export type { IComplianceRepository } from './IComplianceRepository';
export type { IMissionExpenseRepository } from './IMissionExpenseRepository';
export type { IStakeholderRepository } from './IStakeholderRepository';

// ============================================================================
// PROJECT PLANNING
// ============================================================================

export type { IMilestoneRepository } from './IMilestoneRepository';
export type { IRiskRepository } from './IRiskRepository';

// ============================================================================
// EXPORTS DES IMPLÉMENTATIONS
// ============================================================================

export * from './IProjectAlertRepository';
