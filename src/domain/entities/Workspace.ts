import { GeographicUnit } from '@/utils/mauritania';

export enum OperationalStatus {
  active = "active",
  inactive = "inactive",
  closed = "closed",
}

export interface Workspace {
  id: string;
  workspaceId: string;
  workspaceCode: string;
  name: string;
  location: string; // Simple string location instead of GeographicUnit
  description?: string;
  capacity?: number;
  contact?: {
    manager: string;
    phone: string; // Mauritania format
  };
  facilities?: string[]; // ["warehouse", "dormitory"]
  status?: OperationalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeLine {
  start: Date; // Auto-set to Mauritania timezone
  end: Date;
  estimatedDuration?: number; // In days
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
  actionProofs?: Record<string, {
    documentId?: string;
    timestamp?: string;
    userId?: string;
    notes?: string;
  }>;
  metadata?: Record<string, unknown>;
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
