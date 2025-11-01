// Tender database entity types
export interface TenderEntity {
  id: string;
  title: string;
  description: string;
  project_id?: string | null;
  launch_date?: string | null;
  attribution_date?: string | null;
  selection_mode?: string | null;
  market_type?: string | null;
  financing_source?: string | null;
  project_reference?: string | null;
  status: 'draft' | 'published' | 'closed' | 'awarded';
  tender_number?: string | null;
  publication_date?: string | null;
  deadline_date?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  evaluation_criteria?: any;
  eligibility_requirements?: any;
  created_at: string;
  updated_at: string;
}

export interface TenderSubmissionEntity {
  id: string;
  tender_id: string;
  supplier_id?: string | null;
  supplier_name: string;
  submission_date: string;
  status: string;
  total_amount?: number | null;
  secret_code?: string | null;
  secret_expires_at?: string | null;
  is_secret_active?: boolean;
  secret_access_count?: number;
  max_secret_access?: number;
  created_at: string;
  updated_at: string;
}
