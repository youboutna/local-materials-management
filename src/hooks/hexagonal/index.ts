/**
 * Export all hexagonal hooks
 * Ces hooks encapsulent l'architecture hexagonale pour une utilisation facile dans les composants React
 */

// Export types from centralized types file
export type {
  UseSuppliersHexResult,
  UseUsersHexResult,
  UseTaskAssignmentsHexResult,
  UseDocumentsHexResult,
  UseProjectsHexResult,
  UseMaterialsHexResult,
  UseInspectionsHexResult,
  UseAuthHexResult,
  SupplierResponseDto,
  UserResponseDto,
  TaskAssignmentResponseDto,
  DocumentResponseDto,
  ProjectResponseDto,
  MaterialResponseDto,
  InspectionResponseDto,
  AuthResponseDto,
  PaginatedResult,
  QueryResult,
  MutationResult,
  ApiError
} from '@/types/hooks';

// Projects
export { useProjectsHex, useProjectHex } from './useProjectsHex';

// Suppliers
export { useSuppliersHex, useSuppliersBySpecialization, useSupplierHex } from './useSuppliersHex';

// Materials
export { useMaterialsHex, useMaterialHex } from './useMaterialsHex';

// Documents
export { useDocumentsHex, useDocumentCreate, useDocumentUpdate, useDocumentDelete } from './useDocumentsHex';

// Inspections
export { useInspectionHex, useInspectionsHex } from './useInspectionsHex';

// Users
export { useUsersHex, useUserCreate, useUserUpdate, useUserToggleStatus } from './useUsersHex';

// Task Assignments
export { useTaskAssignmentsHex } from './useTaskAssignmentsHex';

// Phases
export { usePhaseHex, usePhasesHex } from './usePhasesHex';
export type { UsePhaseHexResult, UsePhasesHexResult } from './usePhasesHex';

// Monitoring
export { 
  useBankGuaranteesHex, 
  usePaymentBlocksHex, 
  useInsurancesHex, 
  useNotificationsHex 
} from './useMonitoringHex';
export type { 
  BankGuarantee, 
  PaymentBlock, 
  InsuranceCertificate, 
  Notification 
} from './useMonitoringHex';

// Workflows - Phase 4
export { useInspectionWorkflowHex } from './useInspectionWorkflowHex';
export type { UseInspectionWorkflowHexResult } from './useInspectionWorkflowHex';

export { usePaymentWorkflowHex } from './usePaymentWorkflowHex';
export type { UsePaymentWorkflowHexResult } from './usePaymentWorkflowHex';

// Employees - Phase 5
export { useEmployeesHex, useEmployeeHex } from './useEmployeesHex';

// Tasks - Phase 5
export { useTasksHex, useTaskHex } from './useTasksHex';

// Alerts - combines multiple sources
export { useAlertsHex } from './useAlertsHex';
export type { AlertData, AlertStats } from './useAlertsHex';

// Compliance
export { useComplianceHex } from './useComplianceHex';
export type { ComplianceItem } from './useComplianceHex';

// Milestones
export { useMilestonesHex } from './useMilestonesHex';
export type { Milestone } from './useMilestonesHex';

// Stakeholders
export { useStakeholdersHex } from './useStakeholdersHex';
export { usePaymentStatsHex } from './usePaymentStatsHex';
export { useProjectPhasesHex } from './useProjectPhasesHex';
export { useAuthUserHex } from './useAuthUserHex';
export { useAssigneeDetailsHex, useAssigneeDetails } from './useAssigneeDetailsHex';
export { useBankGuaranteeForProjectHex } from './useBankGuaranteeForProjectHex';

// Payment Validation
export { usePaymentValidationHex } from './usePaymentValidationHex';
export type { PaymentStats } from './usePaymentValidationHex';

// KPI Metrics
export { useKPIMetricsHex } from './useKPIMetricsHex';
export type { KPIMetrics, CriticalAlert } from './useKPIMetricsHex';

// Management Actions
export { useManagementActionsHex } from './useManagementActionsHex';
export type { ActionItem } from './useManagementActionsHex';

// Monitoring Stats
export { useMonitoringStatsHex } from './useMonitoringStatsHex';
export type { MonitoringStats } from './useMonitoringStatsHex';

// Project Materials
export { useProjectMaterialsHex } from './useProjectMaterialsHex';
export type { ProjectMaterial, SelectedMaterial } from './useProjectMaterialsHex';

// Project Edit
export { useProjectEditHex } from './useProjectEditHex';
export type { ProjectEditData } from './useProjectEditHex';

// Inspection CRUD
export { useInspectionCrudHex } from './useInspectionCrudHex';

// Payment Requests
export { usePaymentRequestsHex } from './usePaymentRequestsHex';

// Phase Materials
export { usePhaseMaterialsHex, useAvailableMaterials } from './usePhaseMaterialsHex';
export type { PhaseMaterial, MaterialDetails, AvailableMaterial } from './usePhaseMaterialsHex';

// Phase Tasks
export { usePhaseTasksHex } from './usePhaseTasksHex';

// Phase Employees
export { usePhaseEmployeesHex } from './usePhaseEmployeesHex';

// Phase Monitoring Summary
export {
  usePhaseMonitoringSummaryHex,
  useTasksSummaryHex,
  useInspectionsSummaryHex,
  usePaymentsSummaryHex
} from './usePhaseMonitoringSummaryHex';

// Task List
export { useTaskListHex } from './useTaskListHex';

// Tender Evaluation
export { useTenderEvaluationHex } from './useTenderEvaluationHex';

// Progress Invoice
export { useProgressInvoiceHex } from './useProgressInvoiceHex';

// Phase Inspections
export { usePhaseInspectionsHex } from './usePhaseInspectionsHex';

// Supplier Portal
export { useSupplierPortalHex } from './useSupplierPortalHex';
export type { 
  TasksSummary, 
  InspectionsSummary, 
  PaymentsSummary, 
  PhaseMonitoringSummary 
} from './usePhaseMonitoringSummaryHex';

// Inspection Monitoring
export { useInspectionMonitoringHex } from './useInspectionMonitoringHex';
export type { MonitoringInspection, MonitoringProject } from './useInspectionMonitoringHex';

// Payment Actions
export { usePaymentActionsHex } from './usePaymentActionsHex';

// Insurance Certificates
export { useInsuranceCertificatesHex } from './useInsuranceCertificatesHex';
export type { InsuranceCertificateData } from './useInsuranceCertificatesHex';

// User Management
export { useUserManagementHex } from './useUserManagementHex';

// Storage Operations
export { useStorageHex } from './useStorageHex';

// Selectors (UserSelector, ProjectSelector, SupplierSelector, MaterialSelector)
export { 
  useUsersSelector, 
  useProjectsSelector, 
  useSuppliersSelector, 
  useMaterialsSelector,
  useEmployeesSelector,
  useInspectorsSelector,
  useProjectTenders
} from './useSelectorsHex';
export type { 
  UserProfile, 
  ProjectOption, 
  SupplierOption, 
  MaterialOption,
  EmployeeOption,
  Inspector,
  TenderOption
} from './useSelectorsHex';

// Payments (PaymentScheduleTimeline, PaymentControlActions)
export { usePaymentSchedule, useEscalationTargets } from './usePaymentsHex';
export type { PaymentMilestone, PaymentScheduleData } from './usePaymentsHex';

// Tender Submissions & Evaluation (SubmissionEvaluationPanel, TenderProjectPhases, TenderLotBuilder)
export { 
  useTenderSubmission, 
  useSubmissionDocuments, 
  useSaveSubmissionEvaluation, 
  useProjectPhasesForTender, 
  useProjectPhasesForLots 
} from './useTendersHex';
export type { 
  TenderSubmission, 
  TenderSubmissionDocument, 
  ProjectPhaseForTender, 
  ProjectStepForTender 
} from './useTendersHex';

// Task Assignments (TaskAssignments component)
export type { SupplierFormData as SupplierMgmtFormData } from './useSuppliersManagementHex';

// Bank Guarantees CRUD
export {
  useBankGuaranteesList,
  useCreateBankGuarantee,
  useUpdateBankGuarantee,
  useDeleteBankGuarantee
} from './useBankGuaranteesHex';
export type { BankGuaranteeFormData, BankGuaranteeRow } from './useBankGuaranteesHex';

// Inspections CRUD
export {
  useInspectionsList as useInspectionsCrud,
  useCreateInspection,
  useUpdateInspection,
  useDeleteInspection
} from './useInspectionsCrudHex';
export type { InspectionFormData, InspectionRow } from './useInspectionsCrudHex';

// Enhanced Tasks (project-scoped)
export {
  useProjectPhasesForTasks,
  useProjectTasks,
  useCreateProjectTask,
  useUpdateProjectTask,
  useDeleteProjectTask
} from './useEnhancedTasksHex';
export type { ProjectTaskFormData, ProjectTask, ProjectPhase } from './useEnhancedTasksHex';

// Employee Management CRUD
export {
  useEmployeesList,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee
} from './useEmployeeManagementHex';
export type { EmployeeFormData } from './useEmployeeManagementHex';

// Tender Documents
export {
  useTenderDocumentsList,
  useWorkflowStepDocumentsList,
  useUploadTenderDocument
} from './useTenderDocumentsHex';

// Supplier Submissions Dashboard
export {
  useCurrentAuthUser,
  useSupplierSubmissions,
  useSubmissionDocumentsList,
  useSubmissionActivityLogs
} from './useSupplierSubmissionsHex';
export type { Submission, SubmissionDocument, ActivityLog } from './useSupplierSubmissionsHex';

// Phase Payments
export {
  usePhasePayments,
  useAddPhasePayment,
  useDeletePhasePayment,
  useSupplierInfo
} from './usePhasePaymentsHex';
export type { PhasePaymentFormData } from './usePhasePaymentsHex';

// Kanban Board
export { useKanbanTasks } from './useKanbanBoardHex';
export type { KanbanTask } from './useKanbanBoardHex';

// Tender CRUD
export {
  useTenders,
  useProjectsForTenders,
  useTenderMutation,
  useDeleteTender
} from './useTenderCrudHex';
export type { Tender, TenderFormData } from './useTenderCrudHex';

// Payment CRUD
export { usePaymentCrud } from './usePaymentCrudHex';
export type { Payment, PaymentFormData as PaymentCrudFormData } from './usePaymentCrudHex';

// Document Share
export {
  useTenderDocumentsForShare,
  useShareDocuments
} from './useDocumentShareHex';
export type { SharedDocument } from './useDocumentShareHex';

// Quantity Takeoff
export {
  useMaterialsForTakeoff,
  useCreateQuantityTakeoff
} from './useQuantityTakeoffHex';

// Inspection Dialog
export {
  useCreateInspectionHex,
  useUpdateProjectStatusHex
} from './useInspectionDialogHex';
export type { CreateInspectionData } from './useInspectionDialogHex';

// Inspections List
export { useInspectionsListHex } from './useInspectionsListHex';
export type { InspectionData } from './useInspectionsListHex';

// Project Importer
export { useImportProjectsHex } from './useProjectImporterHex';
export type { ProjectImportData } from './useProjectImporterHex';

// User Management Dialog
export {
  useCreateUserHex,
  useUpdateUserProfileHex
} from './useUserManagementDialogHex';
export type { CreateUserData, UpdateUserData } from './useUserManagementDialogHex';

// Alerts Processor
export { useRunAlertsProcessorHex } from './useAlertsProcessorHex';
export type { ProcessorResult } from './useAlertsProcessorHex';

// Tender Estimate
export {
  useTenderEstimatesHex,
  useEstimateItemsHex,
  useMaterialsForEstimateHex,
  useParsedInvoicesHex,
  useCreateTenderEstimateHex,
  useAddEstimateItemHex,
  useCreateInvoiceHex
} from './useTenderEstimateHex';
export type { TenderEstimate, EstimateItem } from './useTenderEstimateHex';

// Project Structure
export { useProjectStructureHex } from './useProjectStructureHex';
export type { ProjectDetails, Phase as ProjectPhaseDetails, Step as PhaseStep } from './useProjectStructureHex';

// Tender Document Upload
export { useUploadTenderDocumentHex } from './useTenderDocumentUploadHex';
export type { TenderDocumentUploadData, TenderCategory, TenderSubcategory } from './useTenderDocumentUploadHex';

// Auth (Login/Register/Logout)
export { useAuthHex, useLoginHex, useRegisterHex, useLogoutHex } from './useAuthHex';
export type { LoginData, RegisterData } from './useAuthHex';

// Contact Form
export { useSubmitContactFormHex } from './useContactFormHex';
export type { ContactFormData } from './useContactFormHex';

// Dashboard Access Control
export { useDashboardAccessHex, useCheckAuthHex } from './useDashboardAccessHex';
export type { DashboardAccess } from './useDashboardAccessHex';

// Users Admin
export { useUserProfilesHex, useToggleUserStatusHex } from './useUsersAdminHex';
export type { UserProfile as AdminUserProfile } from './useUsersAdminHex';

// Unified Supplier Portal
export {
  useSupplierPortalAuthHex,
  useFetchSupplierProfileHex,
  useSupplierLoginHex,
  useSupplierSignUpHex,
  useSupplierLogoutHex,
  useSupplierPortalNotificationsHex,
  useSupplierPortalPaymentRequestsHex,
  useSupplierPortalDocumentsHex,
  useUploadSupplierDocumentHex,
  useAddSupplierTaskCommentHex,
  useMarkTaskCompletedHex
} from './useUnifiedSupplierPortalHex';
export type { Supplier as SupplierPortal } from './useUnifiedSupplierPortalHex';
