/**
 * HierarchyDTO - Data Transfer Objects for project hierarchy operations
 * Follows hexagonal architecture with proper camelCase naming
 */

import { BaseEntityDTO } from './BaseEntityDTO';

export interface HierarchyNode extends BaseEntityDTO {
  projectId: string;
  name: string;
  type: 'project' | 'phase' | 'task' | 'subtask' | 'milestone' | 'deliverable';
  parentId?: string;
  orderIndex?: number;
  level: number;
  path: string; // Computed path like "project.phase.task"
  metadata?: {
    description?: string;
    startDate?: string;
    endDate?: string;
    assignedTo?: string;
    status?: 'active' | 'completed' | 'pending' | 'cancelled';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    estimatedHours?: number;
    actualHours?: number;
    budget?: number;
    actualCost?: number;
    tags?: string[];
    customFields?: Record<string, unknown>;
  };
  children?: HierarchyNode[];
  statistics?: {
    totalTasks?: number;
    completedTasks?: number;
    totalBudget?: number;
    actualCost?: number;
    progress?: number;
  };
}

export interface CreateHierarchyNodeDTO {
  projectId: string;
  name: string;
  type: HierarchyNode['type'];
  parentId?: string;
  orderIndex?: number;
  metadata?: Omit<HierarchyNode['metadata'], 'customFields'> & {
    customFields?: Record<string, string | number | boolean>;
  };
}

export interface UpdateHierarchyNodeDTO {
  name?: string;
  type?: HierarchyNode['type'];
  parentId?: string;
  orderIndex?: number;
  metadata?: Partial<HierarchyNode['metadata']>;
}

export interface HierarchyStatisticsDTO {
  projectId: string;
  totalNodes: number;
  maxDepth: number;
  nodeTypes: Record<string, number>;
  totalTasks: number;
  completedTasks: number;
  totalBudget: number;
  actualCost: number;
  overallProgress: number;
  criticalPath?: string[];
  riskAssessment?: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    recommendations: string[];
  };
}

export interface HierarchyPathDTO {
  nodeId: string;
  path: string;
  depth: number;
  breadcrumb: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export interface HierarchyMoveDTO {
  nodeId: string;
  newParentId?: string;
  newOrderIndex?: number;
  reason?: string;
}

export interface HierarchyBulkOperationDTO {
  operations: Array<{
    type: 'create' | 'update' | 'delete' | 'move';
    nodeId?: string;
    data?: CreateHierarchyNodeDTO | UpdateHierarchyNodeDTO | HierarchyMoveDTO;
  }>;
  validateIntegrity?: boolean;
  rollbackOnError?: boolean;
}

export interface HierarchyValidationDTO {
  isValid: boolean;
  errors: Array<{
    nodeId: string;
    type: 'circular_reference' | 'invalid_parent' | 'duplicate_order' | 'missing_required';
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    nodeId: string;
    type: 'orphaned_node' | 'deep_nesting' | 'inconsistent_types';
    message: string;
  }>;
}

export interface HierarchySearchCriteriaDTO {
  projectId: string;
  nodeType?: HierarchyNode['type'];
  status?: HierarchyNode['metadata']['status'];
  assignedTo?: string;
  priority?: HierarchyNode['metadata']['priority'];
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  searchText?: string;
  tags?: string[];
  includeChildren?: boolean;
  maxDepth?: number;
}

export interface HierarchySearchResultDTO {
  nodes: HierarchyNode[];
  totalCount: number;
  facets: {
    nodeTypes: Record<string, number>;
    statuses: Record<string, number>;
    priorities: Record<string, number>;
    assignees: Record<string, number>;
  };
  suggestions?: Array<{
    type: 'correction' | 'expansion' | 'refinement';
    text: string;
    reason: string;
  }>;
}
