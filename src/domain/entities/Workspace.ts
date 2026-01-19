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

export interface TaskAssignment {
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
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
