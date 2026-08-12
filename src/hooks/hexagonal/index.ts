/**
 * Hexagonal Hooks Index
 * Central export point for all hexagonal architecture hooks
 * 
 * This file exports all hexagonal hooks and their types.
 * New hooks are automatically available without manual export updates.
 */

import { getPaymentService } from '@/application/services/PaymentService';
import { useQuery } from '@tanstack/react-query';

// ==================== CORE HOOKS ====================
// Authentication
export {
    useAuthHex,
    useLoginHex,
    useRegisterHex
} from './useAuthHex';
export { useAuth } from './useAuthSimple';
export { useAuthUserHex } from './useAuthUserHex';

// Configuration
export {
    useConfiguration
} from './useConfigurationHex';
export {
    useOAuthConfig
} from './useOAuthConfigHex';

// Projects
export {
    useProjectById, useProjectHex, useProjects, useProjectsByStatus, useProjectsHex
} from './useProjectsHex';

export { useProjectEditHex } from './useProjectEditHex';
export { useProjectMaterialsHex } from './useProjectMaterialsHex';
export { useProjectPhasesHex } from './useProjectPhasesHex';
export {
    useProjectCalculations,
    useProjectsEnhanced
} from './useProjectsEnhanced';
export { useProjectsFull } from './useProjectsFull';

// Suppliers
export { useActiveSuppliersHex } from './useActiveSuppliersHex';
export {
    useSupplierHex, useSuppliersBySpecialization, useSuppliersHex
} from './useSuppliersHex';

// Materials
export {
    useMaterialCalculations, useMaterialsEnhanced
} from './useMaterialsEnhanced';
export {
    useAddMaterialToProjectHex, useLowStockMaterials, useMaterialById, useMaterialHex,
    useMaterialsByCategory, useMaterialsHex
} from './useMaterialsHex';

// Workspaces
export { useWorkspaceById, useWorkspacesByStatus, useWorkspacesHex } from './useWorkspacesHex';

// Inspections
export { useEnhancedInspectionCrudHex } from './useEnhancedInspectionCrudHex';
export { useInspectionExecutionHex } from './useInspectionExecutionHex';
export {
    useInspectionHex, useInspectionsHex
} from './useInspectionsHex';

// Real-time
export {
    useRealtimeHex,
    type UseRealtimeOptions
} from './useRealtimeHex';

// Users
export { useCurrentUserHex } from './useSupplierSubmissionsHex';
export { useUserManagementHex } from './useUserManagementHex';
export { useUsersHex } from './useUsersHex';

// Tasks
export { useKanbanTasks } from './useKanbanBoardHex';
export { useTaskDependenciesHex } from './useTaskDependenciesHex';
export {
    useTaskHex, useTasksHex
} from './useTasksHex';

// Documents
export {
    useDocumentById, useDocumentCreate, useDocumentDelete, useDocumentsByProject, useDocumentsHex, useDocumentsList, useDocumentUpdate, useTenderDocuments,
    useWorkflowStepDocuments
} from './useDocumentsHex';

// ==================== MANAGEMENT HOOKS ====================
// Task & Project Management
export {
    useCreateProjectTask, useDeleteProjectTask,
    useProjectPhasesForTasks, useProjectTasks, useUpdateProjectTask
} from './useEnhancedTasksHex';
export {
    usePhaseHex,
    usePhasesHex
} from './usePhasesHex';
export {
    useTaskAssignmentHex, useTaskAssignmentsHex, type TaskAssignment
} from './useTaskAssignmentsHex';

// Phase Management
export { usePhaseDocuments } from './usePhaseDocumentsHex';
export { usePhaseInspectionsHex } from './usePhaseInspectionsHex';
export { usePhaseMonitoringSummaryHex } from './usePhaseMonitoringSummaryHex';
export {
    useAddPhasePayment,
    useDeletePhasePayment, usePhasePayments
} from './usePhasePaymentsHex';

// Monitoring & Compliance
export { useAlertsHex } from './useAlertsHex';
export { useComplianceHex } from './useComplianceHex';
export { useInspectionMonitoringHex, type MonitoringInspection } from './useInspectionMonitoringHex';
export {
    useBankGuaranteesHex,
    useInsurancesHex,
    usePaymentBlocksHex
} from './useMonitoringHex';

// Tenders & Documents
export {
    useDeleteTender, useDeleteTenderSecret, useProjectsForTenders, useRevokeTenderSecret, useTenderMutation, useTenders, useTenderSharingSecrets
} from './useTenderCrudHex';
export {
    useTenderDocumentsList, useUploadTenderDocument, useWorkflowStepDocumentsList
} from './useTenderDocumentsHex';
export { useTenderEvaluationHex } from './useTenderEvaluationHex';
export {
    useProjectPhasesForLots, useProjectPhasesForTender, useSaveSubmissionEvaluation, useSubmissionDocuments, useTenderHex, useTendersHex, useTenderSubmission
} from './useTendersHex';

// ==================== ENHANCED FEATURES ====================
// Analytics & KPIs
export { useKPIMetricsHex } from './useKPIMetricsHex';
export { useMonitoringStatsHex } from './useMonitoringStatsHex';
export {
    useProjectAnalytics, useProjectCompliance, useProjectKPIs
} from './useProjectAnalyticsHex';

// Payment Management
export { useInspectionPaymentValidationHex } from './useInspectionPaymentValidationHex';
export { usePaymentActionsHex } from './usePaymentActionsHex';
export { usePaymentCrud, type Payment, type PaymentFormData } from './usePaymentCrudHex';
export {
    usePaymentRequests, usePaymentRequestsByProject, usePaymentRequestsBySupplier
} from './usePaymentRequestsHexNew';
export { usePaymentsHex } from './usePaymentsHex';
export { usePaymentStatsHex } from './usePaymentStatsHex';
export { usePaymentValidationHex } from './usePaymentValidationHex';
export { usePaymentWorkflowHex } from './usePaymentWorkflowHex';

// Quantity Takeoff
export {
    useCreateQuantityTakeoff, useMaterialsForTakeoff
} from './useQuantityTakeoffHex';
export { useQuantityTakeoffsHex } from './useQuantityTakeoffsHex';

// Inspection Management
export {
    useCreateInspection, useDeleteInspection, useInspectionsList,
    useInspectionsList as useInspectionsListCrud, useUpdateInspection, type InspectionFormData,
    type InspectionRow
} from './useInspectionsCrudHex';
export { useInspectionsListHex } from './useInspectionsListHex';
export { useInspectionWorkflowHex } from './useInspectionWorkflowHex';

// Re-export Inspection types for components
export type { InspectionRow as Inspection } from './useInspectionsCrudHex';

// ==================== SUPPLIER PORTAL ====================
export {
    useAddTaskCommentHex,
    useMarkTaskCompletedHex, useSupplierAuthHex, useSupplierDocumentsHex, useSupplierNotificationsHex, useSupplierParsedInvoicesHex, useSupplierPaymentRequestsHex, useSupplierProfileHex, useSupplierSharedDocumentsHex,
    useSupplierTasksHex, useUploadSupplierDocumentHex
} from './useSupplierPortalCompleteHex';
export { useSupplierPortalHex } from './useSupplierPortalHex';
// Legacy SupplierDashboard hooks removed — page deleted (use UnifiedSupplierPortal).
export { useSupplierInfo } from './usePhasePaymentsHex';
export {
    useSubmissionActivityLogs, useSubmissionDocumentsHex,
    useSubmissionDocumentsList, useSubmissionStatsHex, useSupplierSubmissionsHex
} from './useSupplierSubmissionsHex';

// Unified Supplier Portal
export {
    useCreateTaskCommentHex as useAddSupplierTaskCommentHex, useFetchSupplierProfileHex,
    useSupplierLoginHex, useSupplierLogoutHex, useSupplierPortalAuthHex, useSupplierPortalDocumentsHex,
    useSupplierNotificationsHex as useSupplierPortalNotificationsHex, useSupplierPortalPaymentRequestsHex, useSupplierSignUpHex
} from './useUnifiedSupplierPortalHex';

// ==================== UTILITY & SELECTORS ====================
export {
    useEmployeesSelector,
    useInspectorsSelector, useMaterialsSelector, useProjectsSelector, useProjectTenders, useSuppliersSelector,
    useUsersSelector
} from './useSelectorsHex';

// Employees
export { useActiveEmployeesHex } from './useActiveEmployeesHex';
export {
    useCreateEmployee, useDeleteEmployee, useEmployeesList, useUpdateEmployee
} from './useEmployeeManagementHex';
export { useEmployeesHex } from './useEmployeesHex';

// Stakeholders
export { useStakeholdersHex } from './useStakeholdersHex';

// Storage
export { useStorageHex } from './useStorageHex';

// Dashboard
export { useDashboardHex } from './useDashboardHex';

// ==================== DEV & TESTING ====================
export {
    useDevModeCreate, useDevModeData, useDevModeDelete,
    useDevModeManagement, useDevModeUpdate
} from './useDevModeHex';
export { useLoadDataButtonHex } from './useLoadDataButtonHex';

// ==================== SPECIALIZED HOOKS ====================
// Bank Guarantees
export { useBankGuaranteeForProjectHex } from './useBankGuaranteeForProjectHex';
export {
    useBankGuaranteesList,
    useCreateBankGuarantee, useDeleteBankGuarantee, useUpdateBankGuarantee
} from './useBankGuaranteesHex';

// Insurance
export { useInsuranceCertificatesHex } from './useInsuranceCertificatesHex';

// Milestones
export { useMilestones } from './useMilestoneHexFixed';
export { useMilestonesHex } from './useMilestonesHex';

// Project Structure & Details
export {
    useProjectDetail,
    useProjectAnalytics as useProjectDetailAnalytics,
    useMilestones as useProjectDetailMilestones,
    useToastNotifications
} from './useProjectDetailHex';
export { useProjectStructureHex } from './useProjectStructureHex';

// Progress & Invoices
export { useProgressInvoiceHex } from './useProgressInvoiceHex';

// Task List
export { useTaskListHex } from './useTaskListHex';

// User Management Dialog
export {
    useCreateUserHex, useUpdateUserProfileHex, useCreateUserHex as useUserCreate, useUpdateUserProfileHex as useUserUpdate
} from './useUserManagementDialogHex';
// Tender Estimate
export {
    useAddEstimateItemHex,
    useCreateInvoiceHex, useEstimateItemsHex,
    useMaterialsForEstimateHex,
    useParsedInvoicesHex, useTenderEstimatesHex
} from './useTenderEstimateHex';


// Document Sharing
export {
    useShareDocuments, useTenderDocumentsForShare
} from './useDocumentShareHex';

// Tender Document Upload
export { useUploadTenderDocumentHex } from './useTenderDocumentUploadHex';

// Contact Form
export { useSubmitContactFormHex } from './useContactFormHex';
export {
    useContactMessageActionsHex, useContactMessagesHex,
    useContactMessageStatsHex,
    useSubmitContactMessageHex
} from './useContactMessagesHex';

// Users Admin
export {
    useToggleUserStatusHex, useUserProfilesHex,
    useToggleUserStatusHex as useUserToggleStatus
} from './useUsersAdminHex';

// Assignee Details
export {
    useAssigneeDetailsHex as useAssigneeDetails, useAssigneeDetailsHex
} from './useAssigneeDetailsHex';

// Phase Materials
export {
    useAvailableMaterials, usePhaseMaterialsHex
} from './usePhaseMaterialsHex';

// Management Actions
export { useManagementActionsHex } from './useManagementActionsHex';

// Alerts Processor
export { useRunAlertsProcessorHex } from './useAlertsProcessorHex';

// Phase Monitoring Summary Components
export {
    useInspectionsSummaryHex,
    usePaymentsSummaryHex, useTasksSummaryHex
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
    useCheckAuthHex, useDashboardAccessHex
} from './useDashboardAccessHex';

// Risk Management
export { useEnhancedRiskManagerHex } from './useEnhancedRiskManagerHex';

// Payment Control
export {
    actionFormSchema, usePaymentControlActionsHex, type PaymentControlActionsProps
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
    ApiError, MutationResult, PaginatedResult,
    QueryResult, UseAuthHexResult, UseDocumentsHexResult, UseInspectionsHexResult, UseMaterialsHexResult, UseProjectsHexResult, UseSuppliersHexResult, UseTaskAssignmentsHexResult, UseUsersHexResult
} from '@/dtos/types/hooks';

// Export commonly used DTOs
export type {
    CreateMaterialDTO, EmployeeDTO, InspectionDTO, MaterialDTO,
    MaterialFormDataDTO, PhaseDTO, ProjectDTO, UpdateMaterialDTO
} from '@/dtos/entities';
export type { BaseEntityDTO } from '@/dtos/entities/BaseEntityDTO';

// Export commonly used DTOs
export type {
    CreateEmployeeRequestDTO as CreateEmployeeRequestDto, CreateInsuranceRequestDTO as CreateInsuranceRequestDto, CreatePaymentRequestDTO as CreatePaymentRequestDto, CreateProjectRequestDTO as CreateProjectRequestDto, CreateStakeholderRequestDTO as CreateStakeholderRequestDto, UpdateEmployeeRequestDTO as UpdateEmployeeRequestDto, UpdateInsuranceRequestDTO as UpdateInsuranceRequestDto, UpdatePaymentRequestDTO as UpdatePaymentRequestDto, UpdateStakeholderRequestDTO as UpdateStakeholderRequestDto
} from '@/dtos/entities';

export type {
    AuthResponse as AuthResponseDto, DocumentResponseDTO as DocumentResponseDto, UserResponseDto
} from '@/dtos/entities';

// Specialized type exports
export type { CreateInspectionDTO, UpdateProjectStatusDTO } from './useInspectionDialogHex';
export type { ProjectImportData } from './useProjectImporterHex';
export type { EstimateItem } from './useTenderEstimateHex';
export type { CreateUserData, UpdateUserData } from './useUserManagementDialogHex';

export type { LoginData, RegisterData } from './useAuthHex';
export type { ContactFormData } from './useContactFormHex';
export type { Milestone } from './useMilestonesHex';
export type { UsePhaseDocumentsResult } from './usePhaseDocumentsHex';
export type { PhasePaymentFormData } from './usePhasePaymentsHex';
export type { Step as PhaseStep, ProjectDetails, Phase as ProjectPhaseDetails } from './useProjectStructureHex';
export type { ParsedInvoice, PaymentRequest, Supplier, SupplierDocument, SupplierNotification, SupplierTask } from './useSupplierPortalCompleteHex';
export type { ActivityLog, Submission, SubmissionDocument } from './useSupplierSubmissionsHex';
export type { TenderCategory, TenderDocumentUploadData, TenderSubcategory } from './useTenderDocumentUploadHex';
export type { Supplier as SupplierPortal } from './useUnifiedSupplierPortalHex';
export type { UserProfile as AdminUserProfile } from './useUsersAdminHex';

// Additional type exports for components - aligned with useBankGuaranteesHex
export type { MaterialDTO as MaterialOption } from '@/dtos/entities';

// Missing types for components
export type { EmployeeDTO as Employee, PhaseDTO as ProjectPhase, TaskAssignmentDTO as ProjectTask } from '@/dtos/entities';
export type { InspectionDTO as InspectionData } from '@/dtos/entities/InspectionDTO';

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

// Payment schedule hook - builds a payment milestone schedule for a project
export const usePaymentSchedule = (projectId: string) => {
  const {
    data: schedule = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['payment-schedule', projectId],
    queryFn: async (): Promise<PaymentMilestone[]> => {
      const paymentService = getPaymentService();
      const payments = await paymentService.getPaymentsByProject(projectId);
      return payments.map((payment): PaymentMilestone => {
        const status: PaymentMilestone['status'] =
          payment.status === 'completed' || payment.status === 'paid'
            ? 'completed'
            : payment.status === 'blocked' || payment.status === 'rejected'
              ? 'overdue'
              : 'pending';

        return {
          id: payment.id,
          title: payment.contractorName
            ? `Paiement ${payment.contractorName}`
            : `Paiement ${payment.id.slice(0, 8)}`,
          amount: payment.amount,
          due_date: payment.paymentDate,
          status,
          project_id: payment.projectId,
          phase_id: payment.phaseId
        };
      });
    },
    enabled: !!projectId,
    retry: 3,
    retryDelay: 1000
  });

  return {
    schedule,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch
  };
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
    useCreateSupplier, useDeleteSupplier, useSuppliersList, useUpdateSupplier, type SupplierMgmtFormData
} from './useSuppliersCrudHex';

// Infrastructure adapters - re-export for accessibility
export {
    SupabaseAlertRepository,
    SupabaseMilestoneAdapter,
    SupabaseSupplierPaymentAdapter
} from '@/infrastructure/adapters/supabase';

// Application services - re-export for accessibility
export {
    MilestoneService
} from '@/application/services/MilestoneService';
export {
    ProjectAnalyticsService
} from '@/application/services/ProjectAnalyticsService';

// Re-export Tender types for TenderCrud component
export type { ProjectDTO as Project } from '@/dtos/entities/ProjectDTO';
export type { TenderDTO as Tender } from '@/dtos/entities/TenderDTO';

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