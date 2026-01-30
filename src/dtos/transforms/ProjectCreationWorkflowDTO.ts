/**
 * Project Creation Workflow DTOs - Hexagonal Architecture
 * DTOs for project creation workflow data exchange
 */

// DTO pour les données de création de projet
export interface ProjectCreationRequestDTO {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  budget: number;
  address: string;
  latitude: number;
  longitude: number;
  project_manager_id: string;
  client_id: string;
  status: string;
  priority: string;
  estimated_duration_days: number;
  project_reference: string;
  currency: string;
  project_type: string;
  financing_source: string;
  market_type: string;
  reception_status: string;
  closure_notes: string;
  progress: number;
}

// DTO pour les données de parties prenantes
export interface StakeholderDTO {
  id: string;
  type: 'employee' | 'supplier' | 'subcontractor' | 'consultant' | 'contractor' | 'freelancer' | 'client' | 'partner';
  role: 'project_manager' | 'technical_manager' | 'site_manager' | 'quality_inspector' | 'safety_inspector' | 'engineer' | 'architect' | 'consultant' | 'supplier' | 'subcontractor' | 'contractor' | 'client' | 'partner' | 'observer';
  organizationId: string | null;
  employeeId: string | null;
  isPrimary: boolean;
  isInternal: boolean;
  contact: {
    name: string;
    email: string;
    phone?: string;
    position?: string;
  };
  organization: {
    id: string;
    name: string;
    type: string;
    category?: string;
    address?: string;
    phone?: string;
    email?: string;
    nif?: string;
    registrationNumber?: string;
  } | null;
  responsibilities: string[];
  accessLevel: 'read' | 'write' | 'admin' | 'full';
  startDate: string | null;
  endDate: string | null;
  hourlyRate: number | null;
  contractType: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// DTO pour les données de délégation
export interface DelegationDTO {
  projectManager: string;
  technicalManager: string;
  supervisor: string;
  client: string;
}

// DTO pour les données de phases
export interface PhaseDTO {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  progress: number;
}

// DTO pour les données de risques
export interface RiskDTO {
  id: string;
  title: string;
  description: string;
  probability: string;
  impact: string;
  mitigation: string;
}

// DTO pour les données de conformité
export interface ComplianceDTO {
  id: string;
  standard: string;
  requirement: string;
  status: string;
  documents: string[];
}

// DTO pour les données géométriques
export interface ShapeDTO {
  type: string;
  coordinates: number[][];
  area: number;
  perimeter: number;
}

// DTO pour les données de matériaux
export interface MaterialDTO {
  materialId: string;
  quantity: number;
}

// DTO pour les données complètes du workflow
export interface ProjectWorkflowDataDTO {
  currentStep: number;
  isDraft: boolean;
  isComplete: boolean;
  projectData: ProjectCreationRequestDTO;
  relatedData: {
    stakeholders: StakeholderDTO[];
    delegation: DelegationDTO;
    phases: PhaseDTO[];
    materials: MaterialDTO[];
    risks: RiskDTO[];
    compliance: ComplianceDTO[];
    shapeData: ShapeDTO | null;
  };
}

// DTO pour l'état UI du workflow
export interface ProjectWorkflowUIState {
  currentStep: number;
  isStepCompleted: boolean[];
  canProceedToNext: boolean;
  isSaving: boolean;
  workflowProgress: number;
  validationErrors: Record<string, string>;
}

// DTO pour la réponse du workflow
export interface ProjectWorkflowResponseDTO {
  success: boolean;
  message: string;
  data?: ProjectCreationRequestDTO;
  errors?: Record<string, string>;
}
