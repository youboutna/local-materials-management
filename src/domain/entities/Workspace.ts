export interface Workspace {
  id: string;
  name: string;
  location: string;
  status: string;
  contactManager?: string;
  contactPhone?: string;
  facilities?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectAlert {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  type: string;
  severity: string;
  source?: string;
  escalationLevel?: number;
  acknowledged?: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  assignedActions?: string[];
  actionProofs?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Action {
  id: string;
  actionType: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaskAssignment {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  assignedTo?: string;
  assignedBy?: string;
  assigneeType?: "supplier" | "employee" | "user";
  assigneeName?: string;
  assigneeEmail?: string;
  dueDate?: Date;
  completedAt?: Date;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Class implementation for TaskAssignment
export class TaskAssignment implements ITaskAssignment {
  constructor(
    public id: string,
    public title: string,
    public description?: string,
    public projectId?: string,
    public assignedTo?: string,
    public assignedBy?: string,
    public assigneeType?: "supplier" | "employee" | "user",
    public assigneeName?: string,
    public assigneeEmail?: string,
    public status: "pending" | "in_progress" | "completed" | "cancelled" = "pending",
    public priority: "low" | "medium" | "high" | "urgent" = "medium",
    public dueDate?: Date,
    public completedAt?: Date,
    public notes?: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {
    // Validation in constructor
    if (!id || id.trim().length === 0) {
      throw new Error('Task ID is required');
    }
    if (!title || title.trim().length === 0) {
      throw new Error('Task title is required');
    }
  }

  // Business logic methods
  assignTo(assigneeId: string, assigneeType: "supplier" | "employee" | "user", assigneeName?: string, assigneeEmail?: string): void {
    this.assignedTo = assigneeId;
    this.assigneeType = assigneeType;
    this.assigneeName = assigneeName;
    this.assigneeEmail = assigneeEmail;
    this.updatedAt = new Date();
  }

  updateStatus(newStatus: "pending" | "in_progress" | "completed" | "cancelled"): void {
    this.status = newStatus;
    if (newStatus === "completed") {
      this.completedAt = new Date();
    }
    this.updatedAt = new Date();
  }

  setPriority(newPriority: "low" | "medium" | "high" | "urgent"): void {
    this.priority = newPriority;
    this.updatedAt = new Date();
  }

  isOverdue(): boolean {
    if (!this.dueDate) return false;
    return new Date() > this.dueDate && this.status !== 'completed' && this.status !== 'cancelled';
  }

  getDaysUntilDue(): number | null {
    if (!this.dueDate) return null;
    const diffTime = this.dueDate.getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getFormattedPriority(): string {
    const priorityMap = {
      low: '🟢 Basse',
      medium: '🟡 Moyenne',
      high: '🟠 Haute',
      urgent: '🔴 Urgente'
    };
    return priorityMap[this.priority];
  }

  getFormattedStatus(): string {
    const statusMap = {
      pending: '⏳ En attente',
      in_progress: '🔄 En cours',
      completed: '✅ Terminée',
      cancelled: '❌ Annulée'
    };
    return statusMap[this.status];
  }
}

// Default export for TaskAssignment class
export default TaskAssignment;
