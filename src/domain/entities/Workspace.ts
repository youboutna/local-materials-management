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