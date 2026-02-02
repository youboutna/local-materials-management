/**
 * Domain Entities Index
 * Export all domain entities from a single entry point
 */

export { Project, type ProjectStatus, type ProjectCoordinates } from './Project';
export { Phase, type PhaseStatus, type PhaseStep, type PhaseTask } from './Phase';
export { 
  ProjectHierarchy, 
  type HierarchyMember, 
  type EscalationTarget, 
  type EscalationRoles,
  type EscalationLevel 
} from './Hierarchy';

// Exporter Task et ses types associés
export { Task } from './Task';
export type { TaskStatus, TaskPriority } from '../types/TaskTypes';

// Additional entities
export { Inspection, type InspectionStatus, type InspectionDocument } from './Inspection';
export { Payment, type PaymentStatus, type PaymentMethod, type PaymentDocument } from './Payment';
export { Material, type MaterialCategory } from './Material';
export { Employee } from './Employee';
export type { EmployeeRole, Department, Permission } from './Employee';
export { UserRole } from './UserRole';
export { Position, type PositionPermissions } from './Position';
export { Certification } from './Certification';
export { Risk } from './Risk';
export type { RiskStatus, RiskLevel, RiskCategory } from './RiskTypesExport';
export { Tender, type TenderStatus, type SelectionMode, type MarketType, type EvaluationCriteria } from './Tender';
export { Supplier, type SupplierStatus, type SupplierCategory, type SupplierContact, type SupplierRating } from './Supplier';
export { Document, type DocumentType, type DocumentStatus } from './Document';
