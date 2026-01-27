/**
 * Tender Data Transfer Objects
 */

export interface TenderDTO {
  id: string;
  title: string;
  description: string;
  projectId?: string;
  launchDate?: string;
  attributionDate?: string;
  selectionMode?: string;
  marketType?: string;
  financingSource?: string;
  projectReference?: string;
  status: 'draft' | 'published' | 'closed' | 'awarded';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenderDTO {
  title: string;
  description: string;
  projectId?: string;
  launchDate?: string;
  attributionDate?: string;
  selectionMode?: string;
  marketType?: string;
  financingSource?: string;
  projectReference?: string;
}

export interface UpdateTenderDTO {
  title?: string;
  description?: string;
  launchDate?: string;
  attributionDate?: string;
  selectionMode?: string;
  marketType?: string;
  financingSource?: string;
  projectReference?: string;
  status?: 'draft' | 'published' | 'closed' | 'awarded';
}
