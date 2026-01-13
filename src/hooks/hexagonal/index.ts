/**
 * Export all hexagonal hooks
 * Ces hooks encapsulent l'architecture hexagonale pour une utilisation facile dans les composants React
 */

// Projects
export { useProjectsHex, useProjectHex } from './useProjectsHex';
export type { UseProjectsHexResult, UseProjectHexResult } from './useProjectsHex';

// Materials
export { useMaterialsHex, useMaterialHex } from './useMaterialsHex';
export type { UseMaterialsHexResult, UseMaterialHexResult } from './useMaterialsHex';

// Suppliers
export { useSuppliersHex, useSupplierHex } from './useSuppliersHex';
export type { UseSuppliersHexResult, UseSupplierHexResult, SupplierFormData } from './useSuppliersHex';

// Documents
export { useDocumentsHex, useProjectDocumentsHex } from './useDocumentsHex';
export type { UseDocumentsHexResult, UseProjectDocumentsHexResult } from './useDocumentsHex';

// Tenders
export { useTendersHex, useTenderHex } from './useTendersHex';
export type { UseTendersHexResult, UseTenderHexResult } from './useTendersHex';

// Dashboard
export { useDashboardHex } from './useDashboardHex';
export type { UseDashboardHexResult, DashboardStats } from './useDashboardHex';

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
export type { Employee } from './useEmployeesHex';

// Tasks - Phase 5
export { useTasksHex, useTaskHex } from './useTasksHex';
export type { Task } from './useTasksHex';

// Task Assignments
export { useTaskAssignmentsHex, useTaskAssignmentHex } from './useTaskAssignmentsHex';
export type { TaskAssignment } from './useTaskAssignmentsHex';

// Users
export { useUsersHex, useUserHex } from './useUsersHex';
export type { User } from './useUsersHex';

// Inspections - Phase 5
export { useInspectionsHex, useInspectionHex } from './useInspectionsHex';
export type { Inspection } from './useInspectionsHex';

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
export { useAssigneeDetailsHex } from './useAssigneeDetailsHex';
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
export { usePhaseMaterialsHex } from './usePhaseMaterialsHex';

// Phase Tasks
export { usePhaseTasksHex } from './usePhaseTasksHex';

// Phase Employees
export { usePhaseEmployeesHex } from './usePhaseEmployeesHex';
