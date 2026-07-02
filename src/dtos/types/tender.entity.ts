// Tender database entity types
export interface TenderEntity {
  id: string;
  title: string;
  description: string;
  projectId?: string | null; // ✅ CAMELCASE: Instead of project_id
  launchDate?: string | null; // ✅ CAMELCASE: Instead of launch_date
  attributionDate?: string | null; // ✅ CAMELCASE: Instead of attribution_date
  selectionMode?: string | null; // ✅ CAMELCASE: Instead of selection_mode
  marketType?: string | null; // ✅ CAMELCASE: Instead of market_type
  financingSource?: string | null; // ✅ CAMELCASE: Instead of financing_source
  projectReference?: string | null; // ✅ CAMELCASE: Instead of project_reference
  status: 'draft' | 'published' | 'closed' | 'awarded';
  tenderNumber?: string | null; // ✅ CAMELCASE: Instead of tender_number
  publicationDate?: string | null; // ✅ CAMELCASE: Instead of publication_date
  deadlineDate?: string | null; // ✅ CAMELCASE: Instead of deadline_date
  budgetMin?: number | null; // ✅ CAMELCASE: Instead of budget_min
  budgetMax?: number | null; // ✅ CAMELCASE: Instead of budget_max
  evaluationCriteria?: any; // ✅ CAMELCASE: Instead of evaluation_criteria
  eligibilityRequirements?: any; // ✅ CAMELCASE: Instead of eligibility_requirements
  createdAt?: string; // ✅ CAMELCASE: Instead of created_at
  updatedAt?: string; // ✅ CAMELCASE: Instead of updated_at
  
  // Legacy snake_case for backward compatibility
  project_id?: string | null; // Legacy snake_case for backward compatibility
  launch_date?: string | null; // Legacy snake_case for backward compatibility
  attribution_date?: string | null; // Legacy snake_case for backward compatibility
  selection_mode?: string | null; // Legacy snake_case for backward compatibility
  market_type?: string | null; // Legacy snake_case for backward compatibility
  financing_source?: string | null; // Legacy snake_case for backward compatibility
  project_reference?: string | null; // Legacy snake_case for backward compatibility
  tender_number?: string | null; // Legacy snake_case for backward compatibility
  publication_date?: string | null; // Legacy snake_case for backward compatibility
  deadline_date?: string | null; // Legacy snake_case for backward compatibility
  budget_min?: number | null; // Legacy snake_case for backward compatibility
  budget_max?: number | null; // Legacy snake_case for backward compatibility
  evaluation_criteria?: any; // Legacy snake_case for backward compatibility
  eligibility_requirements?: any; // Legacy snake_case for backward compatibility
  created_at?: string; // Legacy snake_case for backward compatibility
  updated_at?: string; // Legacy snake_case for backward compatibility
}

export interface TenderSubmissionEntity {
  id: string;
  tenderId: string; // ✅ CAMELCASE: Instead of tender_id
  supplierId?: string | null; // ✅ CAMELCASE: Instead of supplier_id
  supplierName: string; // ✅ CAMELCASE: Instead of supplier_name
  submissionDate: string; // ✅ CAMELCASE: Instead of submission_date
  status: string;
  totalAmount?: number | null; // ✅ CAMELCASE: Instead of total_amount
  secretCode?: string | null; // ✅ CAMELCASE: Instead of secret_code
  secretExpiresAt?: string | null; // ✅ CAMELCASE: Instead of secret_expires_at
  isSecretActive?: boolean; // ✅ CAMELCASE: Instead of is_secret_active
  secretAccessCount?: number; // ✅ CAMELCASE: Instead of secret_access_count
  maxSecretAccess?: number; // ✅ CAMELCASE: Instead of max_secret_access
  createdAt?: string; // ✅ CAMELCASE: Instead of created_at
  updatedAt?: string; // ✅ CAMELCASE: Instead of updated_at
  
  // Legacy snake_case for backward compatibility
  tender_id?: string; // Legacy snake_case for backward compatibility
  supplier_id?: string | null; // Legacy snake_case for backward compatibility
  supplier_name?: string; // Legacy snake_case for backward compatibility
  submission_date?: string; // Legacy snake_case for backward compatibility
  total_amount?: number | null; // Legacy snake_case for backward compatibility
  secret_code?: string | null; // Legacy snake_case for backward compatibility
  secret_expires_at?: string | null; // Legacy snake_case for backward compatibility
  is_secret_active?: boolean; // Legacy snake_case for backward compatibility
  secret_access_count?: number; // Legacy snake_case for backward compatibility
  max_secret_access?: number; // Legacy snake_case for backward compatibility
  created_at?: string; // Legacy snake_case for backward compatibility
  updated_at?: string; // Legacy snake_case for backward compatibility
}
