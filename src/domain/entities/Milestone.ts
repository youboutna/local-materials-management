/**
 * Domain Entity: Milestone
 * Pure business logic for project milestone management
 * Integrated with milestones.referential.ts configuration system
 */

import {
  DEFAULT_PROJECT_MILESTONES,
  getMilestoneTemplatesWithDefaults
} from '@/config/referentials/milestones.referential';
import { MilestonePriority, MilestoneTemplateDTO, MilestoneType } from '@/dtos/entities/MilestoneDTO';

export type MilestoneStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'completed' 
  | 'delayed' 
  | 'blocked' 
  | 'overdue';

export interface MilestoneDependency {
  id: string;
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  description: string;
}

export interface MilestoneDeliverable {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'completed' | 'rejected';
  dueDate: string;
  assignedTo?: string;
}

export interface MaterialUsage {
  materialId: string;
  plannedQuantity: number;
  usedQuantity: number;
  unitCost?: number;
}

export interface MilestoneConfiguration {
  /** Template source (referential or custom) */
  templateId?: string;
  /** Construction phase this milestone belongs to */
  constructionPhase?: string;
  /** Phase ID this milestone belongs to */
  phaseId?: string;
  /** Stage type for categorization */
  stageType?: string;
  /** Operational notes attached to the milestone */
  notes?: string;
  /** Weight for progress calculation (0.1 - 1.0) */
  weight: number;
  /** If true, this milestone is critical for phase completion (CPM) */
  isCritical: boolean;
  /** Type of milestone according to PM standards */
  type: MilestoneType;
  /** Priority level for scheduling */
  priority: MilestonePriority;
  /** Tags/categories for filtering */
  tags: string[];
  /** Predecessor milestone IDs (for PERT/CPM dependency tracking) */
  predecessorIds: string[];
  /** Expected deliverables at this milestone */
  expectedDeliverables: string[];
  /** Approval requirements for gate milestones */
  approvalRequirements: string[];
  /** Relative offset in days from phase start */
  relativeOffsetDays: number;
}

export class Milestone {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly targetDate: string | null,
    public readonly completionDate: string | null,
    public readonly status: MilestoneStatus,
    public readonly priority: MilestonePriority,
    public readonly progressPercentage: number | null,
    public readonly dependencies: MilestoneDependency[],
    public readonly deliverables: MilestoneDeliverable[],
    public readonly assignedTo: string | null,
    public readonly createdBy: string | null,
    public readonly createdAt: string | null,
    public readonly updatedAt: string | null,
    public readonly configuration: MilestoneConfiguration,
    public readonly materialUsage: MaterialUsage[] = [],
    public readonly materialCostEstimate: number | null = null,
    public readonly actualMaterialCost: number | null = null
  ) {}

  // ============= Static Factory Methods =============

  /**
   * Create milestone from template (referential system)
   */
  static fromTemplate(
    template: MilestoneTemplateDTO,
    projectId: string,
    phaseStartDate: Date,
    overrides?: Partial<Milestone>
  ): Milestone {
    // Calculate target date based on relative offset
    const targetDate = new Date(phaseStartDate);
    targetDate.setDate(targetDate.getDate() + template.relative_offset_days);

    return new Milestone(
      template.id,
      projectId,
      template.name,
      template.description || null,
      targetDate.toISOString(),
      null,
      'pending',
      template.priority,
      null,
      template.predecessor_ids?.map(id => ({
        id,
        type: 'finish_to_start' as const,
        description: `Dependency on ${id}`
      })) || [],
      template.deliverables?.map(name => ({
        id: `${template.id}_${name}`,
        name,
        description: `Deliverable: ${name}`,
        status: 'pending' as const,
        dueDate: targetDate.toISOString()
      })) || [],
      null,
      null,
      new Date().toISOString(),
      new Date().toISOString(),
      {
        templateId: template.id,
        stageType: template.type,
        weight: template.weight,
        isCritical: template.is_critical,
        type: template.type,
        priority: template.priority,
        tags: template.tags || [],
        predecessorIds: template.predecessor_ids || [],
        expectedDeliverables: template.deliverables || [],
        approvalRequirements: template.approval_requirements || [],
        relativeOffsetDays: template.relative_offset_days
      }
    );
  }

  /**
   * Create default project milestones
   */
  static createDefaultProjectMilestones(projectId: string, projectStartDate: Date): Milestone[] {
    return DEFAULT_PROJECT_MILESTONES.map(template => 
      this.fromTemplate(template, projectId, projectStartDate)
    );
  }

  /**
   * Create phase milestones from referential
   */
  static createPhaseMilestones(
    constructionPhase: string, 
    projectId: string, 
    phaseStartDate: Date
  ): Milestone[] {
    const templates = getMilestoneTemplatesWithDefaults(constructionPhase);
    return templates.map(template => 
      this.fromTemplate(template, projectId, phaseStartDate)
    );
  }

  /**
   * Create custom milestone
   */
  static create(params: {
    id: string;
    projectId: string;
    title: string;
    description?: string;
    targetDate?: string;
    priority?: MilestonePriority;
    assignedTo?: string;
    createdBy?: string;
    configuration?: Partial<MilestoneConfiguration>;
  }): Milestone {
    return new Milestone(
      params.id,
      params.projectId,
      params.title,
      params.description || null,
      params.targetDate || null,
      null,
      'pending',
      params.priority || 'normal',
      null,
      [],
      [],
      params.assignedTo || null,
      params.createdBy || null,
      new Date().toISOString(),
      new Date().toISOString(),
      {
        templateId: undefined,
        stageType: undefined,
        weight: 0.5,
        isCritical: false,
        type: 'checkpoint',
        priority: params.priority || 'normal',
        tags: [],
        predecessorIds: [],
        expectedDeliverables: [],
        approvalRequirements: [],
        relativeOffsetDays: 0,
        ...params.configuration
      }
    );
  }

  // ============= Business Logic Methods =============

  isCompleted(): boolean {
    return this.status === 'completed';
  }

  isOverdue(): boolean {
    if (!this.targetDate) return false;
    return new Date() > new Date(this.targetDate) && !this.isCompleted();
  }

  getDaysUntilTarget(): number | null {
    if (!this.targetDate) return null;
    const diff = new Date(this.targetDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getDaysSinceTarget(): number | null {
    if (!this.targetDate) return null;
    const diff = new Date().getTime() - new Date(this.targetDate).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  requiresImmediateAttention(): boolean {
    return this.priority === 'critical' || this.isOverdue();
  }

  canStart(): boolean {
    if (this.isCompleted()) return false;
    
    // Check if all dependencies are completed
    return this.dependencies.every(dep => {
      // In a real implementation, we would check the actual dependency status
      // For now, we assume dependencies are satisfied
      return true;
    });
  }

  getProgress(): number {
    if (this.progressPercentage !== null) {
      return this.progressPercentage;
    }
    
    // Calculate progress based on deliverables
    if (this.deliverables.length === 0) return 0;
    
    const completedDeliverables = this.deliverables.filter(d => d.status === 'completed').length;
    return Math.round((completedDeliverables / this.deliverables.length) * 100);
  }

  updateStatus(): MilestoneStatus {
    const progress = this.getProgress();
    
    if (progress === 100) {
      return 'completed';
    }
    
    if (this.isOverdue()) {
      return 'overdue';
    }
    
    if (progress > 0) {
      return 'in_progress';
    }
    
    return 'pending';
  }

  getCriticalPath(): boolean {
    return this.priority === 'critical' || this.dependencies.length > 0;
  }

  getEstimatedCompletionDate(): string | null {
    if (this.isCompleted()) return this.completionDate;
    if (this.targetDate && !this.isOverdue()) return this.targetDate;
    
    // Calculate based on current progress
    if (this.progressPercentage === null || this.progressPercentage === 0) {
      return null;
    }
    
    // Simple estimation: if we're X% complete, estimate remaining time
    const startDate = this.createdAt || new Date().toISOString();
    const elapsed = new Date().getTime() - new Date(startDate).getTime();
    const estimatedTotal = elapsed / (this.progressPercentage / 100);
    const estimatedCompletion = new Date(startDate).getTime() + estimatedTotal;
    
    return new Date(estimatedCompletion).toISOString();
  }

  // ============= Configuration-Based Methods =============

  /**
   * Check if this milestone is a gate (requires approval)
   */
  isGate(): boolean {
    return this.configuration.type === 'gate';
  }

  /**
   * Check if this milestone is a deliverable (tangible output)
   */
  isDeliverable(): boolean {
    return this.configuration.type === 'deliverable';
  }

  /**
   * Check if this milestone is a checkpoint (progress verification)
   */
  isCheckpoint(): boolean {
    return this.configuration.type === 'checkpoint';
  }

  /**
   * Check if this milestone is an event (key project event)
   */
  isEvent(): boolean {
    return this.configuration.type === 'event';
  }

  /**
   * Get milestone weight for progress calculation
   */
  getWeight(): number {
    return this.configuration.weight;
  }

  /**
   * Check if milestone is on critical path
   */
  isOnCriticalPath(): boolean {
    return this.configuration.isCritical;
  }

  /**
   * Get milestone tags for filtering
   */
  getTags(): string[] {
    return this.configuration.tags;
  }

  /**
   * Get expected deliverables
   */
  getExpectedDeliverables(): string[] {
    return this.configuration.expectedDeliverables;
  }

  /**
   * Get approval requirements (for gates)
   */
  getApprovalRequirements(): string[] {
    return this.configuration.approvalRequirements;
  }

  /**
   * Check if all deliverables are completed
   */
  areAllDeliverablesCompleted(): boolean {
    if (this.deliverables.length === 0) return true;
    return this.deliverables.every(d => d.status === 'completed');
  }

  /**
   * Check if all approval requirements are met
   */
  areApprovalRequirementsMet(): boolean {
    if (!this.isGate()) return true;
    // In a real implementation, check actual approval status
    return this.getProgress() >= 100;
  }

  /**
   * Get milestone score (combination of weight and progress)
   */
  getScore(): number {
    return Math.round(this.configuration.weight * this.getProgress());
  }

  /**
   * Update milestone based on configuration and current state
   */
  updateFromConfiguration(): Milestone {
    const newStatus = this.updateStatus();
    const newProgress = this.getProgress();
    
    return new Milestone(
      this.id,
      this.projectId,
      this.title,
      this.description,
      this.targetDate,
      this.completionDate,
      newStatus,
      this.priority,
      newProgress,
      this.dependencies,
      this.deliverables,
      this.assignedTo,
      this.createdBy,
      this.createdAt,
      new Date().toISOString(),
      this.configuration
    );
  }

  // ============= Utility Methods =============

  /**
   * Get milestone summary for reporting
   */
  getSummary(): {
    id: string;
    title: string;
    status: MilestoneStatus;
    progress: number;
    targetDate: string | null;
    isOverdue: boolean;
    isCritical: boolean;
    type: MilestoneType;
    weight: number;
    score: number;
  } {
    return {
      id: this.id,
      title: this.title,
      status: this.status,
      progress: this.getProgress(),
      targetDate: this.targetDate,
      isOverdue: this.isOverdue(),
      isCritical: this.configuration.isCritical,
      type: this.configuration.type,
      weight: this.configuration.weight,
      score: this.getScore()
    };
  }

  /**
   * Check if milestone can be marked as completed
   */
  canBeCompleted(): boolean {
    return !this.isCompleted() && 
           this.areAllDeliverablesCompleted() && 
           (this.isGate() ? this.areApprovalRequirementsMet() : true);
  }

  /**
   * Mark milestone as completed
   */
  markAsCompleted(): Milestone {
    return new Milestone(
      this.id,
      this.projectId,
      this.title,
      this.description,
      this.targetDate,
      new Date().toISOString(),
      'completed',
      this.priority,
      100,
      this.dependencies,
      this.deliverables.map(d => ({
        ...d,
        status: d.status === 'rejected' ? 'rejected' : 'completed'
      })),
      this.assignedTo,
      this.createdBy,
      this.createdAt,
      new Date().toISOString(),
      this.configuration
    );
  }
}
