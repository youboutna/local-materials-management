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
