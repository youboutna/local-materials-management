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
