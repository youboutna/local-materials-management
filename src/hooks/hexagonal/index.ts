/**
 * Hexagonal Hooks Index
 * Central export point for all hexagonal architecture hooks
 * 
 * This file exports all hexagonal hooks and their types.
 * New hooks are automatically available without manual export updates.
 */

// ==================== CORE HOOKS ====================
// Authentication
export { 
  useAuthHex,
  useLoginHex, 
  useRegisterHex 
} from './useAuthHex';
export { useAuthUserHex } from './useAuthUserHex';
export { useAuth } from './useAuthSimple';

// Configuration
export { 
  useConfiguration
} from './useConfigurationHex';
export { 
  useOAuthConfig
} from './useOAuthConfigHex';

// Projects
export { 
  useProjects, 
  useProjectsHex, 
  useProjectById, 
  useProjectsByStatus, 
  useProjectHex 
} from './useProjectsHex';

export { useProjectsFull } from './useProjectsFull';
export { 
  useProjectCalculations, 
  useProjectsEnhanced 
} from './useProjectsEnhanced';
export { useProjectEditHex } from './useProjectEditHex';
export { useProjectPhasesHex } from './useProjectPhasesHex';
export { useProjectMaterialsHex } from './useProjectMaterialsHex';

// Suppliers
export { 
  useSuppliersHex, 
  useSuppliersBySpecialization, 
  useSupplierHex 
} from './useSuppliersHex';
export { useActiveSuppliersHex } from './useActiveSuppliersHex';

// Materials
export { 
  useMaterialsHex, 
  useMaterialHex, 
  useMaterialsByCategory, 
  useMaterialById, 
  useLowStockMaterials,
  useAddMaterialToProjectHex 
} from './useMaterialsHex';
export { 
  useMaterialsEnhanced, 
  useMaterialCalculations 
} from './useMaterialsEnhanced';

// Workspaces
export { useWorkspacesHex, useWorkspaceById, useWorkspacesByStatus } from './useWorkspacesHex';

// Inspections
export { 
  useInspectionsHex, 
  useInspectionHex 
} from './useInspectionsHex';
export { useEnhancedInspectionCrudHex } from './useEnhancedInspectionCrudHex';
export { useInspectionExecutionHex } from './useInspectionExecutionHex';

// Real-time
export { 
  useRealtimeHex,
  type UseRealtimeOptions
} from './useRealtimeHex';

// Users
export { useUsersHex } from './useUsersHex';
export { useUserManagementHex } from './useUserManagementHex';
export { useCurrentUserHex } from './useSupplierSubmissionsHex';

// Tasks
export { 
  useTasksHex, 
  useTaskHex 
} from './useTasksHex';
export { useKanbanTasks } from './useKanbanBoardHex';
export { useTaskDependenciesHex } from './useTaskDependenciesHex';

// Documents
export { 
  useDocumentsHex, 
  useDocumentCreate, 
  useDocumentUpdate, 
  useDocumentDelete, 
  useDocumentsList, 
  useDocumentsByProject, 
  useDocumentById, 
  useTenderDocuments, 
  useWorkflowStepDocuments 
} from './useDocumentsHex';

// ==================== MANAGEMENT HOOKS ====================
// Task & Project Management
export { 
  useTaskAssignmentsHex, 
  useTaskAssignmentHex,
  type TaskAssignment
} from './useTaskAssignmentsHex';
export { 
  usePhaseHex, 
  usePhasesHex 
} from './usePhasesHex';
export { 
  useProjectTasks, 
  useCreateProjectTask, 
  useUpdateProjectTask, 
  useDeleteProjectTask,
  useProjectPhasesForTasks 
} from './useEnhancedTasksHex';

// Phase Management
export { 
  usePhasePayments, 
  useAddPhasePayment, 
  useDeletePhasePayment 
} from './usePhasePaymentsHex';
export { usePhaseInspectionsHex } from './usePhaseInspectionsHex';
export { usePhaseMonitoringSummaryHex } from './usePhaseMonitoringSummaryHex';
export { usePhaseDocuments } from './usePhaseDocumentsHex';

// Monitoring & Compliance
export { 
  useBankGuaranteesHex, 
  useInsurancesHex, 
  usePaymentBlocksHex 
} from './useMonitoringHex';
export { useComplianceHex } from './useComplianceHex';
export { useAlertsHex } from './useAlertsHex';
export { useInspectionMonitoringHex, type MonitoringInspection } from './useInspectionMonitoringHex';

// Tenders & Documents
export { 
  useTendersHex, 
  useTenderHex, 
  useTenderSubmission, 
  useSubmissionDocuments, 
  useSaveSubmissionEvaluation, 
  useProjectPhasesForTender, 
  useProjectPhasesForLots 
} from './useTendersHex';
export { 
  useTenders, 
  useProjectsForTenders, 
  useTenderMutation, 
  useDeleteTender 
} from './useTenderCrudHex';
export { 
  useTenderDocumentsList, 
  useWorkflowStepDocumentsList, 
  useUploadTenderDocument 
} from './useTenderDocumentsHex';
export { useTenderEvaluationHex } from './useTenderEvaluationHex';

// ==================== ENHANCED FEATURES ====================
// Analytics & KPIs
export { 
  useProjectAnalytics, 
  useProjectKPIs, 
  useProjectCompliance 
} from './useProjectAnalyticsHex';
export { useKPIMetricsHex } from './useKPIMetricsHex';
export { useMonitoringStatsHex } from './useMonitoringStatsHex';

// Payment Management
export { 
  usePaymentRequests, 
  usePaymentRequestsBySupplier, 
  usePaymentRequestsByProject 
} from './usePaymentRequestsHexNew';
export { usePaymentsHex } from './usePaymentsHex';
export { usePaymentCrud, type Payment, type PaymentFormData } from './usePaymentCrudHex';
export { usePaymentActionsHex } from './usePaymentActionsHex';
export { useInspectionPaymentValidationHex } from './useInspectionPaymentValidationHex';
export { usePaymentValidationHex } from './usePaymentValidationHex';
export { usePaymentWorkflowHex } from './usePaymentWorkflowHex';
export { usePaymentStatsHex } from './usePaymentStatsHex';

// Quantity Takeoff
export { 
  useMaterialsForTakeoff, 
  useCreateQuantityTakeoff 
} from './useQuantityTakeoffHex';
export { useQuantityTakeoffsHex } from './useQuantityTakeoffsHex';

// Inspection Management
export { 
  useInspectionsList, 
  useInspectionsList as useInspectionsListCrud,
  useCreateInspection, 
  useUpdateInspection, 
  useDeleteInspection,
  type InspectionFormData,
  type InspectionRow
} from './useInspectionsCrudHex';
export { useInspectionsListHex } from './useInspectionsListHex';
export { useInspectionWorkflowHex } from './useInspectionWorkflowHex';

// Re-export Inspection types for components
export type { InspectionRow as Inspection } from './useInspectionsCrudHex';

// ==================== SUPPLIER PORTAL ====================
export { useSupplierPortalHex } from './useSupplierPortalHex';
export { 
  useSupplierAuthHex, 
  useSupplierProfileHex, 
  useSupplierDocumentsHex, 
  useSupplierSharedDocumentsHex, 
  useSupplierTasksHex, 
  useSupplierNotificationsHex, 
  useSupplierPaymentRequestsHex, 
  useSupplierParsedInvoicesHex, 
  useUploadSupplierDocumentHex, 
  useAddTaskCommentHex, 
  useMarkTaskCompletedHex 
} from './useSupplierPortalCompleteHex';
export { 
  useSupplierAuthHex as useSupplierDashboardAuthHex,
  useSupplierProfileHex as useSupplierDashboardProfileHex,
  useSupplierNotificationsHex as useSupplierDashboardNotificationsHex,
  useSupplierPaymentsHex,
  useSupplierDocumentsHex as useSupplierDashboardDocumentsHex
} from './useSupplierDashboardHex';
export { 
  useSupplierSubmissionsHex, 
  useSubmissionDocumentsHex,
  useSubmissionDocumentsList,
  useSubmissionActivityLogs,
  useSubmissionStatsHex 
} from './useSupplierSubmissionsHex';
export { useSupplierInfo } from './usePhasePaymentsHex';

// Unified Supplier Portal
export { 
  useSupplierPortalAuthHex, 
  useFetchSupplierProfileHex, 
  useSupplierLoginHex, 
  useSupplierSignUpHex, 
  useSupplierLogoutHex,
  useSupplierPortalPaymentRequestsHex,
  useSupplierPortalDocumentsHex,
  useSupplierNotificationsHex as useSupplierPortalNotificationsHex,
  useCreateTaskCommentHex as useAddSupplierTaskCommentHex
} from './useUnifiedSupplierPortalHex';

// ==================== UTILITY & SELECTORS ====================
export { 
  useMaterialsSelector, 
  useSuppliersSelector, 
  useUsersSelector, 
  useProjectsSelector, 
  useEmployeesSelector, 
  useInspectorsSelector, 
  useProjectTenders 
} from './useSelectorsHex';

// Employees
export { useEmployeesHex } from './useEmployeesHex';
export { useActiveEmployeesHex } from './useActiveEmployeesHex';
export { 
  useEmployeesList, 
  useCreateEmployee, 
  useUpdateEmployee, 
  useDeleteEmployee 
} from './useEmployeeManagementHex';

// Stakeholders
export { useStakeholdersHex } from './useStakeholdersHex';

// Storage
export { useStorageHex } from './useStorageHex';

// Dashboard
export { useDashboardHex } from './useDashboardHex';

// ==================== DEV & TESTING ====================
export { 
  useDevModeData, 
  useDevModeCreate, 
  useDevModeUpdate, 
  useDevModeDelete, 
  useDevModeManagement 
} from './useDevModeHex';
export { useLoadDataButtonHex } from './useLoadDataButtonHex';

// ==================== SPECIALIZED HOOKS ====================
// Bank Guarantees
export { 
  useBankGuaranteesList, 
  useCreateBankGuarantee, 
  useUpdateBankGuarantee, 
  useDeleteBankGuarantee 
} from './useBankGuaranteesHex';
export { useBankGuaranteeForProjectHex } from './useBankGuaranteeForProjectHex';

// Insurance
export { useInsuranceCertificatesHex } from './useInsuranceCertificatesHex';

// Milestones
export { useMilestones } from './useMilestoneHexFixed';
export { useMilestonesHex } from './useMilestonesHex';

// Project Structure & Details
export { useProjectStructureHex } from './useProjectStructureHex';
export { 
  useProjectDetail, 
  useProjectAnalytics as useProjectDetailAnalytics, 
  useMilestones as useProjectDetailMilestones, 
  useToastNotifications 
} from './useProjectDetailHex';

// Progress & Invoices
export { useProgressInvoiceHex } from './useProgressInvoiceHex';

// Task List
export { useTaskListHex } from './useTaskListHex';

// User Management Dialog
export { 
  useCreateUserHex as useUserCreate,
  useCreateUserHex, 
  useUpdateUserProfileHex as useUserUpdate,
  useUpdateUserProfileHex 
} from './useUserManagementDialogHex';
// Tender Estimate
export { 
  useTenderEstimatesHex, 
  useEstimateItemsHex, 
  useMaterialsForEstimateHex, 
  useParsedInvoicesHex, 
  useAddEstimateItemHex, 
  useCreateInvoiceHex 
} from './useTenderEstimateHex';
export { useTenderQuantitativeEstimateHex } from './useTenderQuantitativeEstimateHex';

// Document Sharing
export { 
  useTenderDocumentsForShare, 
  useShareDocuments 
} from './useDocumentShareHex';

// Tender Document Upload
export { useUploadTenderDocumentHex } from './useTenderDocumentUploadHex';

// Contact Form
export { useSubmitContactFormHex } from './useContactFormHex';

// Users Admin
export { 
  useUserProfilesHex, 
  useToggleUserStatusHex as useUserToggleStatus,
  useToggleUserStatusHex 
} from './useUsersAdminHex';

// Assignee Details
export { 
  useAssigneeDetailsHex,
  useAssigneeDetailsHex as useAssigneeDetails
} from './useAssigneeDetailsHex';

// Phase Materials
export { 
  usePhaseMaterialsHex,
  useAvailableMaterials
} from './usePhaseMaterialsHex';

// Management Actions
export { useManagementActionsHex } from './useManagementActionsHex';

// Alerts Processor
export { useRunAlertsProcessorHex } from './useAlertsProcessorHex';

// Phase Monitoring Summary Components
export { 
  useTasksSummaryHex, 
  useInspectionsSummaryHex, 
  usePaymentsSummaryHex 
} from './usePhaseMonitoringSummaryHex';

// Inspection Dialog
export { 
  useCreateInspectionHex, 
  useUpdateProjectStatusHex 
} from './useInspectionDialogHex';
export { useProjectWithPaymentsHex } from './useProjectWithPaymentsHex';

// Import & Export
export { useImportProjectsHex } from './useProjectImporterHex';

// Dashboard Access
export { 
  useDashboardAccessHex, 
  useCheckAuthHex 
} from './useDashboardAccessHex';

// Risk Management
export { useEnhancedRiskManagerHex } from './useEnhancedRiskManagerHex';

// Payment Control
export { 
  usePaymentControlActionsHex,
  actionFormSchema,
  type PaymentControlActionsProps
} from './usePaymentControlActionsHex';
export { usePaymentControlHex } from './usePaymentControlHex';

// Notifications
export { useNotificationsHex } from './useNotificationsHex';

export type { 
  ActionFormData,
  ActionMetadata
} from '@/application/services/PaymentControlActionsService';

// Phase Employees
export { usePhaseEmployeesHex } from './usePhaseEmployeesHex';

// Phase Tasks
export { usePhaseTasksHex } from './usePhaseTasksHex';

// Progress Invoice Form
export { useProgressInvoiceFormHex } from './useProgressInvoiceFormHex';
export type { InvoiceFormData, WorkflowRequirements } from './useProgressInvoiceFormHex';

// ==================== TYPE EXPORTS ====================
// Export commonly used types
export type {
  UseSuppliersHexResult,
  UseUsersHexResult,
  UseTaskAssignmentsHexResult,
  UseDocumentsHexResult,
  UseProjectsHexResult,
  UseMaterialsHexResult,
  UseInspectionsHexResult,
  UseAuthHexResult,
  PaginatedResult,
  QueryResult,
  MutationResult,
  ApiError
} from '@/types/hooks';

// Export commonly used DTOs
export type {
  BaseEntityDTO,
  MaterialDTO,
  MaterialFormDataDTO,
  CreateMaterialDTO,
  UpdateMaterialDTO,
  InspectionDTO,
  ProjectDTO,
  PhaseDTO,
  TaskDTO,
  EmployeeDTO
} from '@/dtos/entities';

// Export commonly used DTOs
export type {
  CreateProjectRequestDTO as CreateProjectRequestDto,
  CreatePaymentRequestDTO as CreatePaymentRequestDto,
  UpdatePaymentRequestDTO as UpdatePaymentRequestDto,
  CreateEmployeeRequestDTO as CreateEmployeeRequestDto,
  UpdateEmployeeRequestDTO as UpdateEmployeeRequestDto,
  CreateStakeholderRequestDTO as CreateStakeholderRequestDto,
  UpdateStakeholderRequestDTO as UpdateStakeholderRequestDto,
  CreateInsuranceRequestDTO as CreateInsuranceRequestDto,
  UpdateInsuranceRequestDTO as UpdateInsuranceRequestDto,
} from '@/dtos/entities';

export type {
  UserResponseDto,
  DocumentResponseDTO as DocumentResponseDto,
  AuthResponse as AuthResponseDto
} from '@/dtos/entities';

// Specialized type exports
export type { CreateInspectionDTO, UpdateProjectStatusDTO } from './useInspectionDialogHex';
export type { ProjectImportData } from './useProjectImporterHex';
export type { CreateUserData, UpdateUserData } from './useUserManagementDialogHex';
export type { EstimateItem } from './useTenderEstimateHex';
export type { EstimateItem as QuantitativeEstimateItem } from './useTenderQuantitativeEstimateHex';
export type { UsePhaseDocumentsResult } from './usePhaseDocumentsHex';
export type { ProjectDetails, Phase as ProjectPhaseDetails, Step as PhaseStep } from './useProjectStructureHex';
export type { TenderDocumentUploadData, TenderCategory, TenderSubcategory } from './useTenderDocumentUploadHex';
export type { LoginData, RegisterData } from './useAuthHex';
export type { ContactFormData } from './useContactFormHex';
export type { UserProfile as AdminUserProfile } from './useUsersAdminHex';
export type { Supplier as SupplierPortal } from './useUnifiedSupplierPortalHex';
export type { Supplier, SupplierDocument, SupplierTask, SupplierNotification, PaymentRequest, ParsedInvoice } from './useSupplierPortalCompleteHex';
export type { Submission, SubmissionDocument, ActivityLog } from './useSupplierSubmissionsHex';
export type { Milestone } from './useMilestonesHex';
export type { PhasePaymentFormData } from './usePhasePaymentsHex';

// Additional type exports for components - aligned with useBankGuaranteesHex
export type { MaterialDTO as MaterialOption } from '@/dtos/entities';

// Missing types for components
export type { InspectionDTO as InspectionData } from '@/dtos/entities/InspectionDTO';
export type { PhaseDTO as ProjectPhase } from '@/dtos/entities';
export type { TaskDTO as ProjectTask } from '@/dtos/entities';
export type { EmployeeDTO as Employee } from '@/dtos/entities';

// Selector option types for components
export interface EmployeeOption {
  id: string;
  label: string;
  value: string;
  fullName?: string;
  email?: string;
  department?: string;
  position?: string;
}

export interface ProjectOption {
  id: string;
  label: string;
  value: string;
  title?: string;
  status?: string;
  progress?: number;
}

export interface Inspector {
  id: string;
  name: string;
  email?: string;
  role?: string;
  department?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  role?: string;
  avatar?: string;
  createdAt?: string;
}

// Form data types
export interface ProjectTaskFormData {
  title: string;
  description?: string;
  phase_id?: string;
  assigned_to?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  estimated_hours?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface RiskFormData {
  title: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  category: string;
  mitigation?: string;
  status?: 'active' | 'mitigated' | 'closed';
}

export interface ProjectRisk {
  id: string;
  title: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  category: string;
  mitigation?: string;
  status: 'active' | 'mitigated' | 'closed';
  project_id: string;
  created_at: string;
  updated_at: string;
}

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  phase_id?: string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMilestone {
  id: string;
  title: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'completed' | 'overdue';
  project_id: string;
  phase_id?: string;
}

// Payment schedule hook (alias for usePaymentsHex)
export const usePaymentSchedule = () => {
  // This would be implemented in a separate hook file
  // For now, provide a placeholder that matches the expected interface
  throw new Error('usePaymentSchedule hook not implemented yet');
};

// Re-export types from useBankGuaranteesHex to ensure consistency
export type { 
  BankGuaranteeFormData, 
  BankGuaranteeRow 
} from './useBankGuaranteesHex';

// Alert types for dashboard - re-export from hooks
export type { CriticalAlert } from './useKPIMetricsHex';

// Action item for management actions - re-export from hooks
export type { ActionItem } from './useManagementActionsHex';

// Employee form data
export interface EmployeeFormData {
  employee_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  hire_date?: string;
  is_active?: boolean;
  skills?: string[];
  salary?: number;
}

// Supplier management types
export { 
  useSuppliersList, 
  useCreateSupplier, 
  useUpdateSupplier, 
  useDeleteSupplier,
  type SupplierMgmtFormData
} from './useSuppliersCrudHex';

// Infrastructure adapters - re-export for accessibility
export { 
  SupabaseAlertRepository,
  SupabaseMilestoneAdapter,
  SupabaseSupplierPaymentAdapter
} from '@/infrastructure/supabase/adapters';

// Application services - re-export for accessibility
export { 
  ProjectAnalyticsService
} from '@/application/services/ProjectAnalyticsService';
export { 
  MilestoneService
} from '@/application/services/MilestoneService';

// Re-export Tender types for TenderCrud component
export type { TenderDTO as Tender } from '@/dtos/entities/TenderDTO';
export type { ProjectDTO as Project } from '@/dtos/entities/ProjectDTO';

// Tender form data type for compatibility
export interface TenderFormData {
  title: string;
  description: string;
  project_id: string;
  launch_date: string;
  attribution_date: string;
  deadline_date: string;
  submission_deadline: string;
  evaluation_deadline: string;
  selection_mode: string;
  market_type: string;
  financing_source: string;
  project_reference: string;
  current_phase: string;
  current_stage: string;
  procurement_type: string;
  estimated_value: string;
  status: 'draft' | 'published' | 'closed' | 'awarded';
}

// Project phase type for tender
export interface ProjectPhaseForTender {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  budget?: number;
  teamSize?: number;
  steps: Array<{
    id: string;
    name: string;
    order: number;
    status: string;
  }>;
}