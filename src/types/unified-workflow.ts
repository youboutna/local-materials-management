export type MilestoneType =
  | 'point_controle'
  | 'reception_provisoire'
  | 'reception_definitive'
  | 'other';

export type WorkflowStatus = 'not_started' | 'in_progress' | 'validation_pending' | 'approved' | 'blocked';

export interface DecisionNode {
  id: string;
  name: string;
  type?: MilestoneType | string;
  status?: WorkflowStatus | string;
  description?: string;
  documents?: Array<{ id?: string; title?: string; file_url?: string }>;
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
}

export type ItemType = 'step' | 'milestone';

export interface UnifiedWorkflowState {
  workflowItems: Array<StepItem | MilestoneItem>;
  selectedItemId: string | null;
  selectedItemType: ItemType | null;
  pendingValidations: Array<{
    itemId: string;
    type: string;
    validators: Array<{ role: string; status: string }>;
  }>;
  pendingCalculations: Array<{
    sourceItemId: string;
    amount: number;
    type: 'payment' | 'guarantee_release';
  }>;
}

export interface Decompte {
  id?: string;
  phaseId: string;
  projectId: string;
  payablePercentage: number;
  amountToDecompte: number;
  guaranteeRetention: number;
  netPayable: number;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export const mapMilestoneToDecisionNode = (m: any): DecisionNode => ({
  id: m.id || m.code || `${m.name || m.title}`,
  name: m.name || m.title || m.label || 'Jalon',
  type: (m.type || m.milestoneType || 'other') as MilestoneType,
  status: m.status || 'not_started',
  description: m.description || m.summary || m.note,
  documents: Array.isArray(m.documents) ? m.documents.map((d: any) => ({ id: d.id, title: d.title || d.file_name, file_url: d.file_url || d.url })) : [],
  suggestedActions: m.suggestedActions || [],
  metadata: m.metadata || {},
});

export const mapStepToStepItem = (s: any): StepItem => ({
  id: s.id,
  type: 'step',
  name: s.name || s.step_name || 'Étape',
  description: s.description,
  status: s.status || 'not_started',
  progress: s.progress || 0,
  order: s.order_index || s.order || 0,
  metadata: s.metadata || {},
});
