export interface WorkspaceDTO {
  id: string;
  name: string;
  location: string;
  description?: string;
  capacity?: number;
  contactPhone?: string;
  contactEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWorkspaceRequestDTO {
  name: string;
  location: string;
  description?: string;
  capacity?: number;
  contactPhone?: string;
  contactEmail?: string;
}

export interface UpdateWorkspaceRequestDTO {
  name?: string;
  location?: string;
  description?: string;
  capacity?: number;
  contactPhone?: string;
  contactEmail?: string;
}
