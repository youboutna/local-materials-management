/**
 * Project Data Transfer Objects
 */

export interface ProjectDTO {
  id: string;
  title: string;
  description: string;
  status: string;
  location: string;
  budget: number;
  progress: number;
  teamSize: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  phases?: PhaseDTO[];
}

export interface PhaseDTO {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  progress: number;
  status: string;
  orderIndex: number;
}

export interface CreateProjectDTO {
  title: string;
  description: string;
  status?: string;
  location: string;
  budget: number;
  teamSize?: number;
  startDate?: string;
  endDate?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface UpdateProjectDTO {
  title?: string;
  description?: string;
  status?: string;
  location?: string;
  budget?: number;
  progress?: number;
  teamSize?: number;
  startDate?: string;
  endDate?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}
