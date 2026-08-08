/**
 * Unified Workflow DTOs
 * Migrated from @/dtos/types/unified-workflow
 */

export type WorkflowMilestoneType =
  | 'point_controle'
  | 'reception_provisoire'
  | 'reception_definitive'
  | 'other';

export type WorkflowStatus = 'not_started' | 'in_progress' | 'validation_pending' | 'approved' | 'blocked';

export interface StepItem {
  id: string;
  type: 'step';
  name: string;
  description?: string;
  status: string;
  progress: number;
  order?: number;
  responsibleId?: string;
  metadata?: Record<string, unknown>;
}

export interface MilestoneItem {
  id: string;
  type: 'milestone';
  name: string;
  milestoneType: 'checkpoint' | 'provisional' | 'finalestoneToDecisionNode(milestone: any): DecisionNode {
  return {
    id: milestone.id,
    name: milestone.title || milestone.name || 'Jalon',
    type: milestone.type || 'point_controle',
    status: milestone.status || 'n: step.description,
    status: step.status || 'pending',
    progress: step.progress || 0,
    order: step.order_index || step.orderIndex || step.order,
    responsibleId: step.responsibleId || step.assigned_to,
    metadata: step.metadata || {},
  };
}