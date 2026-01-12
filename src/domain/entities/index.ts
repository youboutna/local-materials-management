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

// Additional entities
export { Inspection, type InspectionStatus, type InspectionDocument } from './Inspection';
export { Payment, type PaymentStatus, type PaymentMethod, type PaymentDocument } from './Payment';
export { Task, type TaskStatus, type TaskPriority } from './Task';
export { Material, type MaterialCategory } from './Material';
export { Employee, type EmployeeRole, type Department, type Certification } from './Employee';
export { Risk, type RiskStatus, type RiskLevel } from './Risk';
export { Tender, type TenderStatus, type SelectionMode, type MarketType, type EvaluationCriteria } from './Tender';
export { Supplier, type SupplierStatus, type SupplierCategory, type SupplierContact, type SupplierRating } from './Supplier';
export { Document, type DocumentType, type DocumentStatus } from './Document';
