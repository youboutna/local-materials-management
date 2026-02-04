/**
 * Project Workflow DTOs
 * DTOs for project workflow operations following hexagonal architecture
 */

export interface ProjectWorkflowData {
  projectId?: string;
  currentStep: number;
  isDraft: boolean;
  isComplete: boolean;
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

// Re-export from ProjectEditWorkflowService for consistency
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
  
  // 🎨 UI/Presentation layer properties (PROMPTS.md Rule #5)
  project_reference?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  technical_manager_id?: string;
  project_manager_id?: string;
  supervisor_id?: string;
  client_name?: string;
  // 🏢 Contractors and suppliers (optional fields)
  contractors?: {
    engineeringConsultant?: string;
    generalContractor?: string;
    specializedSubcontractors?: string;
    mainSuppliers?: string;
  };
  project_type?: string;
  sector?: string;
  permit_number?: string;
  payment_mode?: string;
  payment_frequency?: string;
  initial_advance?: number;
  retention_percentage?: number;
  currency?: string;
  funding_source?: string;
  market_type?: string;
  selection_mode?: string;
  main_contractor?: string;
  estimatedDuration?: string;
  reception_status?: string;
  closure_notes?: string;
  shapeData?: Record<string, unknown>; // 🎨 UI state for map data (Rule #4 compliant)
}

export interface PhaseData{
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

// 🔄 Specialized Workflow DTOs for Complex Multi-Step Processes
// Following hexagonal architecture with proper object injection and flow

export interface WorkflowStepDTO {
  stepNumber: number;
  title: string;
  description: string;
  isRequired: boolean;
  isCompleted: boolean;
  validationRules: string[];
  relatedEntities: ('stakeholders' | 'phases' | 'risks' | 'materials' | 'documents' | 'inspections')[];
  estimatedDuration?: number; // in minutes
  dependencies?: number[]; // step numbers that must be completed first
}

export interface WorkflowStateDTO {
  currentStep: number;
  totalSteps: number;
  isDraft: boolean;
  isComplete: boolean;
  canProceed: boolean;
  canGoBack: boolean;
  progressPercentage: number;
  lastSavedAt?: string;
  estimatedCompletionTime?: string;
}

export interface WorkflowValidationDTO {
  stepNumber: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
  validationTimestamp: string;
}

export interface WorkflowSaveContextDTO {
  saveType: 'step_only' | 'save_and_next' | 'save_all' | 'complete_workflow';
  currentStep: number;
  totalSteps: number;
  isDraft: boolean;
  isComplete: boolean;
  lastSavedAt: string;
  userId?: string;
  sessionId?: string;
}

export interface WorkflowTransitionDTO {
  fromStep: number;
  toStep: number;
  transitionType: 'forward' | 'backward' | 'jump';
  reason?: string;
  timestamp: string;
  userId?: string;
}

export interface WorkflowAuditLogDTO {
  id: string;
  workflowId: string;
  action: 'step_completed' | 'step_skipped' | 'data_saved' | 'workflow_completed' | 'error_occurred';
  stepNumber?: number;
  details: Record<string, unknown>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
}

export interface WorkflowMetricsDTO {
  totalSteps: number;
  completedSteps: number;
  averageTimePerStep: number; // in minutes
  totalElapsedTime: number; // in minutes
  validationErrors: number;
  saveOperations: number;
  userInteractions: number;
  completionRate: number;
  abandonmentRate?: number;
}

export interface WorkflowTemplateDTO {
  id: string;
  name: string;
  description: string;
  category: 'project_creation' | 'project_edit' | 'procurement' | 'inspection' | 'compliance';
  steps: WorkflowStepDTO[];
  defaultSettings: {
    allowSkipSteps: boolean;
    requireValidation: boolean;
    autoSave: boolean;
    maxRetries: number;
  };
  isActive: boolean;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowSessionDTO {
  sessionId: string;
  workflowId: string;
  templateId: string;
  userId?: string;
  startTime: string;
  lastActivityTime: string;
  currentState: WorkflowStateDTO;
  completedSteps: number[];
  skippedSteps: number[];
  auditLog: WorkflowAuditLogDTO[];
  metrics: WorkflowMetricsDTO;
  isActive: boolean;
  expiresAt?: string;
}

// 🔄 Specialized DTOs for Project Creation Workflow
export interface ProjectCreationWorkflowDTO extends ProjectFormDataDTO {
  // Workflow-specific state
  workflowState: WorkflowStateDTO;
  validationResults: WorkflowValidationDTO[];
  saveContext: WorkflowSaveContextDTO;
  transitions: WorkflowTransitionDTO[];
  
  // Step-specific data containers
  stepData: {
    step1: ProjectBasicInfoDTO;
    step2: ProjectStakeholdersDTO;
    step3: ProjectLocationDTO;
    step4: ProjectPlanningDTO;
    step5: ProjectRisksDTO;
    step6: ProjectComplianceDTO;
    step7: ProjectValidationDTO;
  };
  
  // Workflow metadata
  templateId: string;
  sessionId: string;
  startedAt: string;
  completedAt?: string;
}

export interface ProjectBasicInfoDTO {
  title: string;
  description: string;
  budget: number;
  currency: string;
  estimatedDuration: string;
  project_type: string;
  sector: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ProjectStakeholdersDTO {
  project_manager_id: string;
  technical_manager_id: string;
  supervisor_id: string;
  client_name: string;
  contractors: {
    engineeringConsultant?: string;
    generalContractor?: string;
    specializedSubcontractors?: string;
    mainSuppliers?: string;
  };
  stakeholders: StakeholderDTO[];
}

export interface ProjectLocationDTO {
  address: string;
  latitude: number;
  longitude: number;
  area_sqm?: number;
  site_details?: string;
  geographic_zone?: string;
  shapeData?: Record<string, unknown>;
  coordinates?: {
    lat: number;
    lng: number;
  }[];
}

export interface ProjectPlanningDTO {
  phases: PhaseFormDataDTO[];
  milestones: {
    id: string;
    name: string;
    description: string;
    dueDate: string;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    deliverables: string[];
  }[];
  materials: MaterialFormDataDTO[];
  tasks: TaskFormDataDTO[];
  estimatedBudget?: number;
}

export interface ProjectRisksDTO {
  risks: RiskFormDataDTO[];
  riskAssessment: {
    overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    mitigationPlan: string;
    contingencyPlan: string;
  };
  insuranceRequirements: {
    required: boolean;
    types: string[];
    minimumCoverage: number;
  };
}

export interface ProjectComplianceDTO {
  compliance: ComplianceDataDTO;
  regulations: {
    name: string;
    authority: string;
    required: boolean;
    status: 'pending' | 'in_progress' | 'compliant' | 'non_compliant';
    documents: string[];
  }[];
  certifications: {
    name: string;
    issuer: string;
    required: boolean;
    status: 'pending' | 'in_progress' | 'obtained' | 'expired';
    expiryDate?: string;
  }[];
  standards: {
    name: string;
    category: 'quality' | 'safety' | 'environmental' | 'technical';
    complianceLevel: 'basic' | 'standard' | 'advanced';
    evidence: string[];
  }[];
}

export interface ProjectValidationDTO {
  reception_status: 'pending' | 'provisional' | 'definitive';
  closure_notes: string;
  finalInspection: {
    date: string;
    inspector: string;
    result: 'passed' | 'failed' | 'pending';
    score?: number;
    notes?: string;
  };
  clientAcceptance: {
    accepted: boolean;
    date?: string;
    representative?: string;
    notes?: string;
  };
  handoverDocumentation: DocumentFormDataDTO[];
}

export interface StepProgressDTO {
  stepNumber: number;
  stepName: string;
  isCompleted: boolean;
  progress: number;
  hasErrors: boolean;
  lastSavedAt?: string;
}
