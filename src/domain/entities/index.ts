/**
 * Domain Entities Index
 * Central export point for all domain entities and interfaces
 * Following hexagonal architecture principles
 */

// ============================================================================
// CORE PROJECT ENTITIES
// ============================================================================

export { Project, type ProjectStatus, type ProjectCoordinates, type ProjectStakeholder } from './Project';
export { Phase, type PhaseStatus, type PhaseStep, type PhaseTask, type PhaseResources } from './Phase';
// SUPPRIMÉ: export { Task } from './Task';
// Les tâches sont maintenant gérées via TaskAssignment
// SUPPRIMÉ: export type { TaskStatus, TaskPriority } from '../types/TaskTypes';
export { Milestone, type MaterialUsage, type MilestoneDependency, type MilestoneDeliverable, type MilestoneConfiguration } from './Milestone';

// ============================================================================
// ORGANIZATIONAL ENTITIES
// ============================================================================

export { Employee } from './Employee';
export type { EmployeeRole, Department, Permission, EmployeeProps } from './Employee';
export { User, type UserRoleType, type AuthSession, type UserProfile } from './User';
export { UserRole } from './UserRole';
export { Position, type PositionPermissions } from './Position';
export { 
  ProjectHierarchy, 
  type HierarchyMember, 
  type EscalationTarget, 
  type EscalationRoles,
  type EscalationLevel 
} from './Hierarchy';
export { Stakeholder, type StakeholderType, type StakeholderContact, type StakeholderOrganization } from './Stakeholder';
export { ProjectStakeholderEntity as DomainProjectStakeholder, type StakeholderType as DomainStakeholderType } from './ProjectStakeholder';

// ============================================================================
// BUSINESS ENTITIES
// ============================================================================

export { Tender, type EvaluationCriteria } from './Tender';
export type { TenderStatus, SelectionMode, MarketType } from './Tender';
export { TenderEstimate, type ITenderEstimateItem as TenderEstimateItemInterface, type TenderEstimateRisk, type TenderEstimateMetrics, type CurrencyCode } from './TenderEstimate';
export { TenderEstimateItem as TenderEstimateItemEntity, type TenderEstimateItemData } from './TenderEstimateItem';
export { TenderSubmission } from './TenderSubmission';
export { Supplier, type SupplierStatus, type SupplierCategory, type SupplierContact, type SupplierRating, type SupplierProps } from './Supplier';
export { Material, type MaterialCategory } from './Material';
export { Risk } from './Risk';
export type { RiskStatus, RiskLevel, RiskCategory } from './RiskTypesExport';
export type { IProject, IEmployee } from './Risk';

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

export { Payment, type PaymentStatus, type PaymentMethod } from './Payment';
export { ParsedInvoiceEntity as ParsedInvoice, type InvoiceType } from './ParsedInvoice';
export { Document, type DocumentType, type DocumentStatus } from './Document';
export { Certification } from './Certification';

// ============================================================================
// INSPECTION & QUALITY ENTITIES
// ============================================================================

export { Inspection, type InspectionStatus } from './Inspection';
export type { InspectionParticipant } from './Inspection';
export type { PaymentDocument as PaymentDocumentType } from './Payment';

// ============================================================================
// TEMPLATES & WORKFLOW ENTITIES
// ============================================================================

export { TemplatePhase } from './Template';
export type { TemplateMetadata, ValidationResult } from './Template';
export { SubmissionSecret } from './SubmissionSecret';

// ============================================================================
// MONITORING & PERFORMANCE ENTITIES
// ============================================================================

export type { DatabaseMetrics, PerformanceMetrics } from './PerformanceMonitoring';
export type { Workspace, ProjectAlert, Action } from './Workspace';
export { TaskAssignment } from './TaskAssignment';
export type { TaskAssignmentProps } from './TaskAssignment';

// ============================================================================
// LEGACY COMPATIBILITY EXPORTS
// ============================================================================

// Re-export for backward compatibility
export type { ProjectCoordinates as Coordinates } from './Project';
export type { PhaseResources as Resources } from './Phase';