export interface WorkspaceDTO {
  id: string;
  workspaceId: string;
  workspaceCode: string;
  name: string;
  location: {
    code: string;
    name: string;
    nameAr: string;
    type: 'region' | 'city' | 'port' | 'university';
    parentCode?: string;
    population?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  description?: string;
  capacity?: number;
  contact?: {
    manager: string;
    phone: string;
  };
  facilities?: string[];
  status?: 'active' | 'inactive' | 'closed';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWorkspaceRequestDTO {
  workspaceId: string;
  workspaceCode: string;
  name: string;
  location: {
    code: string;
    name: string;
    nameAr: string;
    type: 'region' | 'city' | 'port' | 'university';
    parentCode?: string;
    population?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  description?: string;
  capacity?: number;
  contact?: {
    manager: string;
    phone: string;
  };
  facilities?: string[];
  status?: 'active' | 'inactive' | 'closed';
}

export interface UpdateWorkspaceRequestDTO {
  workspaceId?: string;
  workspaceCode?: string;
  name?: string;
  location?: {
    code: string;
    name: string;
    nameAr: string;
    type: 'region' | 'city' | 'port' | 'university';
    parentCode?: string;
    population?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  description?: string;
  capacity?: number;
  contact?: {
    manager: string;
    phone: string;
  };
  facilities?: string[];
  status?: 'active' | 'inactive' | 'closed';
}
