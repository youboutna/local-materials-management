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

export interface DecisionNode {
  id: string;
  name: string;
  type?: WorkflowMilestoneType | string;
  status?: WorkflowStatus | string;
  description?: string;
  documents?: Array<{ id?: string; title?: string; fileUrl?: string }>;
  suggestedActions?: Array<{ id: string; label: string; action?: string }>;
  metadata?: Record<string, unknown>;
}

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
  milestoneType: 'checkpoint' | 'provisional' | 'final';
  dueDate?: string;
  status: string;
  relatedStepId?: string;
  financialImpact?: number;
  metadata?: Record<string, unknown>;
}

export type TimelineItem = StepItem | MilestoneItem;

export function mapMilestoneToDecisionNode(milestone: any): DecisionNode {
  return {
    id: milestone.id,
    name: milestone.title || milestone.name || 'Jalon',
    type: milestone.type || 'point_controle',
    status: milestone.status || 'not_started',
    description: milestone.description,
    metadata: milestone.metadata || {},
  };
}

export function mapStepToStepItem(step: any): StepItem {
  return {
    id: step.id,
    type: 'step',
    name: step.name || step.title || 'Étape',
    description: step.description,
    status: step.status || 'pending',
    progress: step.progress || 0,
    order: step.order_index || step.orderIndex || step.order,
    responsibleId: step.responsibleId || step.assigned_to,
    metadata: step.metadata || {},
  };
}
