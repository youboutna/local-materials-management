/**
 * Project Workflow DTOs
 * DTOs for project workflow operations following hexagonal architecture
 */

export interface ProjectWorkflowData {
  currentStep: number;
  isDraft?: boolean;
  isComplete?: boolean;
  projectData: ProjectFormDataDTO;
  relatedData?: StepRelatedDataDTO;
  metadata: WorkflowMetadataDTO;
}

export interface WorkflowMetadataDTO {
  lastSavedAt: string;
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
  stepName?: string;
}

export interface StepRelatedDataDTO {
  phases?: PhaseFormDataDTO[];
  risks?: RiskFormDataDTO[];
  materials?: MaterialFormDataDTO[];
  stakeholders?: EmployeeFormDataDTO[];
  compliance?: ComplianceDataDTO;
  tasks?: TaskFormDataDTO[];
  inspections?: InspectionFormDataDTO[];
}

export interface ComplianceDataDTO {
  regulations: string[];
  certifications: string[];
  standards: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  documents: DocumentFormDataDTO[];
}

export interface TaskFormDataDTO {
  id?: string;
  name: string;
  description: string;
  assignedTo?: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
}

export interface InspectionFormDataDTO {
  id?: string;
  type: 'quality' | 'safety' | 'environmental' | 'technical';
  title: string;
  description: string;
  scheduledDate: string;
  inspectorId?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
  result?: 'passed' | 'failed' | 'pending';
  score?: number;
  notes?: string;
}

// Re-export from ProjectFormService for consistency
export interface ProjectFormDataDTO {
  title: string;
  description: string;
  location: string;
  status: string;
  progress: number;
  budget: number;
  start_date: string;
  end_date: string;
  team_size: number;
  // Related data - Using specific types instead of unknown
  phases?: PhaseFormDataDTO[];
  materials?: MaterialFormDataDTO[];
  risks?: RiskFormDataDTO[];
  bankGuarantees?: BankGuaranteeFormDataDTO[];
  insurances?: InsuranceFormDataDTO[];
  documents?: DocumentFormDataDTO[];
  employees?: EmployeeFormDataDTO[];
  suppliers?: SupplierFormDataDTO[];
  // Additional workflow-specific fields
  tasks?: TaskFormDataDTO[];
  inspections?: InspectionFormDataDTO[];
  compliance?: ComplianceDataDTO;
  estimatedBudget?: number;
}

export interface PhaseFormDataDTO {
  id?: string;
  name: string;
  description: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  progress?: number;
}

export interface MaterialFormDataDTO {
  id?: string;
  name: string;
  type: 'raw' | 'equipment' | 'consumable' | 'service';
  unit: string;
  quantity: number;
  unit_price: number;
  supplier_id?: string;
  specifications?: Record<string, string | number | boolean>;
}

export interface RiskFormDataDTO {
  id?: string;
  title: string;
  description: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  status: 'identified' | 'mitigated' | 'accepted';
}

export interface BankGuaranteeFormDataDTO {
  id?: string;
  type: 'performance' | 'payment' | 'advance_payment' | 'retention';
  amount: number;
  currency: string;
  bank_name: string;
  guarantee_number: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'cancelled';
}

export interface InsuranceFormDataDTO {
  id?: string;
  type: 'liability' | 'property' | 'professional_indemnity' | 'workers_compensation';
  provider: string;
  policy_number: string;
  coverage_amount: number;
  premium: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
}

export interface DocumentFormDataDTO {
  id?: string;
  title: string;
  type: 'contract' | 'technical' | 'financial' | 'legal' | 'other';
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  upload_date?: string;
  status: 'uploaded' | 'processing' | 'approved' | 'rejected';
}

export interface EmployeeFormDataDTO {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  role: 'admin' | 'manager' | 'employee' | 'contractor';
  status: 'active' | 'inactive' | 'on_leave';
  hire_date?: string;
}

export interface SupplierFormDataDTO {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  category: 'material' | 'service' | 'consultant' | 'contractor';
  status: 'active' | 'inactive' | 'blacklisted';
  rating?: {
    score: number;
    reviews_count: number;
    last_review_date: string;
  };
  certifications?: Array<{
    name: string;
    issuer: string;
    issue_date: string;
    expiry_date: string;
    status: 'valid' | 'expired';
  }>;
}

export interface SaveContextDTO {
  currentStep: number;
  totalSteps: number;
  isDraft?: boolean;
  isComplete?: boolean;
  saveType?: string;
  lastSavedAt?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SaveResult {
  success: boolean;
  projectId: string | null;
  error?: string;
  warnings?: string[];
}

export interface StepProgressDTO {
  stepNumber: number;
  stepName: string;
  isCompleted: boolean;
  progress: number;
  hasErrors: boolean;
  lastSavedAt?: string;
}
