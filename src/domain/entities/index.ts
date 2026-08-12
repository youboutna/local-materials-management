/**
 * Domain Entities Index
 * Central export point for all domain entities and interfaces
 * Following hexagonal architecture principles
 */

// ============================================================================
// CORE PROJECT ENTITIES
// ============================================================================

export { Phase, type PhaseResources, type PhaseStatus, type PhaseStep, type PhaseTask } from './Phase';
export { Project, type ProjectCoordinates, type ProjectStakeholder, type ProjectStatus } from './Project';
// SUPPRIMÉ: export { Task } from './Task';
// Les tâches sont maintenant gérées via TaskAssignment
// SUPPRIMÉ: export type { TaskStatus, TaskPriority } from '../types/TaskTypes';
export { Milestone, type MaterialUsage, type MilestoneConfiguration, type MilestoneDeliverable, type MilestoneDependency } from './Milestone';

// ============================================================================
// ORGANIZATIONAL ENTITIES
// ============================================================================

export { Employee } from './Employee';
export type { Department, EmployeeProps, EmployeeRole, Permission } from './Employee';
export {
    ProjectHierarchy, type EscalationLevel, type EscalationRoles, type EscalationTarget, type HierarchyMember
} from './Hierarchy';
export { Position, type PositionPermissions } from './Position';
export { ProjectStakeholderEntity as DomainProjectStakeholder, type StakeholderType as DomainStakeholderType } from './ProjectStakeholder';
export { Stakeholder, type StakeholderContact, type StakeholderOrganization, type StakeholderType } from './Stakeholder';
export { User, type AuthSession, type UserProfile, type UserRoleType } from './User';
export { UserRole } from './UserRole';

// ============================================================================
// BUSINESS ENTITIES
// ============================================================================

export { Material, type MaterialCategory } from './Material';
export { Risk } from './Risk';
export type { IEmployee, IProject } from './Risk';
export type { RiskCategory, RiskLevel, RiskStatus } from './RiskTypesExport';
export { Supplier, type SupplierCategory, type SupplierContact, type SupplierProps, type SupplierRating, type SupplierStatus } from './Supplier';
export { Tender, type EvaluationCriteria } from './Tender';
export type { MarketType, SelectionMode, TenderStatus } from './Tender';
export { TenderEstimate, type CurrencyCode, type ITenderEstimateItem as TenderEstimateItemInterface, type TenderEstimateMetrics, type TenderEstimateRisk } from './TenderEstimate';
export { TenderEstimateItem as TenderEstimateItemEntity, type TenderEstimateItemData } from './TenderEstimateItem';
export { TenderSubmission } from './TenderSubmission';

// ============================================================================
// PROJECT MANAGEMENT INTERFACES
// ============================================================================

export interface GanttChartData {
  tasks: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    progress: number;
    dependencies: string[];
    assignee?: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  }>;
  milestones: Array<{
    id: string;
    name: string;
    date: string;
    status: 'pending' | 'completed' | 'overdue';
    progress?: number;
  }>;
  phases: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    progress: number;
    status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  }>;
  criticalPath: string[];
  baselineStartDate: string;
  baselineEndDate: string;
  actualStartDate: string;
  actualEndDate: string;
}

export interface PERTAnalysis {
  projectId: string;
  activities: Array<{
    id: string;
    name: string;
    duration: number;
    earliestStart: number;
    latestFinish: number;
    slack: number;
    predecessors: string[];
    successors: string[];
    critical: boolean;
  }>;
  expectedDuration: number;
  variance: number;
  standardDeviation: number;
  confidenceLevel: number;
  riskAssessment: 'low' | 'medium' | 'high';
  lastCalculated: string;
}

// ============================================================================
// FINANCIAL & DOCUMENT ENTITIES
// ============================================================================

export { Certification } from './Certification';
export { Document, type DocumentStatus, type DocumentType } from './Document';
export { ParsedInvoiceEntity as ParsedInvoice, type InvoiceType } from './ParsedInvoice';
export { Payment, type PaymentMethod, type PaymentStatus } from './Payment';

// ============================================================================
// INSPECTION & QUALITY ENTITIES
// ============================================================================

export { Inspection, type InspectionStatus } from './Inspection';
export type { InspectionParticipant } from './Inspection';
export type { PaymentDocument as PaymentDocumentType } from './Payment';

// ============================================================================
// TEMPLATES & WORKFLOW ENTITIES
// ============================================================================

export { SubmissionSecret } from './SubmissionSecret';
export { TemplatePhase } from './Template';
export type { TemplateMetadata, ValidationResult } from './Template';

// ============================================================================
// MONITORING & PERFORMANCE ENTITIES
// ============================================================================

export type { DatabaseMetrics, PerformanceMetrics } from './PerformanceMonitoring';
export { TaskAssignment } from './TaskAssignment';
export type { TaskAssignmentProps } from './TaskAssignment';
export type { Workspace } from './Workspace';

// ============================================================================
// LEGACY COMPATIBILITY EXPORTS
// ============================================================================

// Re-export for backward compatibility
export * from './Alert';
export type { PhaseResources as Resources } from './Phase';
export type { ProjectCoordinates as Coordinates } from './Project';

