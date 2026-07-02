// Data Transfer Objects for Inspections
export interface InspectionDTO {
  id: string;
  project_id: string;
  date: string;
  status: 'scheduled' | 'in_progress' | 'approved' | 'rejected' | 'requires_changes';
  inspector: string;
  comments?: string | null;
  progress_at_inspection?: number | null;
  documents?: any;
  phase_id?: string | null;
  created_at: string;
  updated_at: string;
  projects?: {
    title: string;
    status: string;
  } | null;
}

export interface CreateInspectionDTO {
  project_id: string;
  date: string;
  inspector: string;
  status?: string;
  comments?: string;
  progress_at_inspection?: number;
  phase_id?: string;
}

export interface UpdateInspectionDTO {
  date?: string;
  status?: string;
  inspector?: string;
  comments?: string;
  progress_at_inspection?: number;
  documents?: any;
}
