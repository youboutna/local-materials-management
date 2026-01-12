/**
 * Phase Domain Entity
 * Represents a construction phase with business logic
 */

export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'delayed';

export interface PhaseStep {
  id: string;
  name: string;
  description: string;
  status: PhaseStatus;
  progress: number;
  orderIndex: number;
  tasks: PhaseTask[];
  estimatedDurationDays?: number;
  requiresInspection?: boolean;
  requiresEngineerApproval?: boolean;
}

export interface PhaseTask {
  id: string;
  name: string;
  description: string;
  status: PhaseStatus;
  progress: number;
  orderIndex: number;
  assignedTo?: string[];
  requiresInspection?: boolean;
  requiresEngineerApproval?: boolean;
}

export class Phase {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly status: PhaseStatus,
    public readonly progress: number,
    public readonly orderIndex: number,
    public readonly startDate: Date | null,
    public readonly endDate: Date | null,
    public readonly estimatedCost: number,
    public readonly actualCost: number,
    public readonly constructionPhase?: string,
    public readonly constructionStage?: string,
    public readonly steps: PhaseStep[] = []
  ) {}

  // ============= Business Logic =============

  isActive(): boolean {
    return this.status === 'in_progress';
  }

  isCompleted(): boolean {
    return this.status === 'completed';
  }

  isBlocked(): boolean {
    return this.status === 'blocked';
  }

  canStart(): boolean {
    return this.status === 'pending';
  }

  isCritical(): boolean {
    return this.status === 'blocked' || this.status === 'delayed';
  }

  hasSteps(): boolean {
    return this.steps.length > 0;
  }

  getCompletedStepsCount(): number {
    return this.steps.filter(s => s.status === 'completed').length;
  }

  getStepsProgress(): number {
    if (this.steps.length === 0) return this.progress;
    return (this.getCompletedStepsCount() / this.steps.length) * 100;
  }

  getBudgetVariance(): number {
    return this.estimatedCost - this.actualCost;
  }

  isBudgetOverrun(): boolean {
    return this.actualCost > this.estimatedCost;
  }

  getDaysRemaining(): number {
    if (!this.endDate) return 0;
    const now = new Date();
    const diffTime = this.endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  requiresInspection(): boolean {
    return this.steps.some(step => 
      step.requiresInspection || 
      step.tasks.some(task => task.requiresInspection)
    );
  }

  requiresEngineerApproval(): boolean {
    return this.steps.some(step => 
      step.requiresEngineerApproval || 
      step.tasks.some(task => task.requiresEngineerApproval)
    );
  }

  // ============= Factory Methods =============

  static create(data: Partial<Phase>): Phase {
    return new Phase(
      data.id || crypto.randomUUID(),
      data.projectId || '',
      data.name || '',
      data.description || '',
      data.status || 'pending',
      data.progress || 0,
      data.orderIndex || 0,
      data.startDate || null,
      data.endDate || null,
      data.estimatedCost || 0,
      data.actualCost || 0,
      data.constructionPhase,
      data.constructionStage,
      data.steps || []
    );
  }

  // ============= Immutable Updates =============

  withStatus(status: PhaseStatus): Phase {
    return new Phase(
      this.id,
      this.projectId,
      this.name,
      this.description,
      status,
      this.progress,
      this.orderIndex,
      this.startDate,
      this.endDate,
      this.estimatedCost,
      this.actualCost,
      this.constructionPhase,
      this.constructionStage,
      this.steps
    );
  }

  withProgress(progress: number): Phase {
    return new Phase(
      this.id,
      this.projectId,
      this.name,
      this.description,
      this.status,
      Math.max(0, Math.min(100, progress)),
      this.orderIndex,
      this.startDate,
      this.endDate,
      this.estimatedCost,
      this.actualCost,
      this.constructionPhase,
      this.constructionStage,
      this.steps
    );
  }

  // ============= Serialization =============

  toJSON() {
    return {
      id: this.id,
      projectId: this.projectId,
      name: this.name,
      description: this.description,
      status: this.status,
      progress: this.progress,
      orderIndex: this.orderIndex,
      startDate: this.startDate?.toISOString() || null,
      endDate: this.endDate?.toISOString() || null,
      estimatedCost: this.estimatedCost,
      actualCost: this.actualCost,
      constructionPhase: this.constructionPhase,
      constructionStage: this.constructionStage,
      steps: this.steps,
    };
  }
}
