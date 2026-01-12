// Domain Entity: Task
// Pure business logic without infrastructure concerns

export type TaskStatus = 
  | 'not_started' 
  | 'in_progress' 
  | 'completed' 
  | 'delayed' 
  | 'blocked' 
  | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export class Task {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly phaseId: string | null,
    public readonly stepId: string | null,
    public readonly title: string,
    public readonly description: string | null,
    public readonly status: TaskStatus,
    public readonly priority: TaskPriority,
    public readonly progress: number,
    public readonly assignedTo: string[],
    public readonly assignedBy: string | null,
    public readonly startDate: string | null,
    public readonly endDate: string | null,
    public readonly dueDate: string | null,
    public readonly completionDate: string | null,
    public readonly estimatedDuration: number | null,
    public readonly actualDuration: number | null,
    public readonly dependencies: string[],
    public readonly notes: string | null,
    public readonly createdAt: string,
    public readonly updatedAt: string
  ) {}

  // Business logic
  canStart(): boolean {
    return this.status === 'not_started' && this.areDependenciesMet();
  }

  canComplete(): boolean {
    return this.status === 'in_progress';
  }

  isOverdue(): boolean {
    if (!this.dueDate || this.status === 'completed') return false;
    return new Date() > new Date(this.dueDate);
  }

  isActive(): boolean {
    return ['in_progress', 'delayed'].includes(this.status);
  }

  isBlocked(): boolean {
    return this.status === 'blocked';
  }

  getDaysRemaining(): number | null {
    if (!this.dueDate) return null;
    const diff = new Date(this.dueDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getCompletionPercentage(): number {
    if (this.status === 'completed') return 100;
    if (this.status === 'not_started') return 0;
    return this.progress;
  }

  // Check if dependencies are met (should be overridden with actual logic)
  private areDependenciesMet(): boolean {
    // In real implementation, this would check against actual task statuses
    return this.dependencies.length === 0;
  }

  // Factory method
  static create(params: {
    id: string;
    projectId: string;
    phaseId?: string;
    stepId?: string;
    title: string;
    description?: string;
    priority?: TaskPriority;
    assignedTo?: string[];
    dueDate?: string;
    estimatedDuration?: number;
  }): Task {
    return new Task(
      params.id,
      params.projectId,
      params.phaseId || null,
      params.stepId || null,
      params.title,
      params.description || null,
      'not_started',
      params.priority || 'medium',
      0,
      params.assignedTo || [],
      null,
      null,
      null,
      params.dueDate || null,
      null,
      params.estimatedDuration || null,
      null,
      [],
      null,
      new Date().toISOString(),
      new Date().toISOString()
    );
  }
}
