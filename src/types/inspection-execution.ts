// Types for Inspection Execution & PV Generation

export type InspectionStatus = 
  | 'scheduled' 
  | 'in_progress' 
  | 'completed' 
  | 'approved' 
  | 'rejected' 
  | 'requires_changes';

export type ObservationType = 'technical' | 'safety' | 'quality' | 'non_conformity';
export type SeverityLevel = 'minor' | 'major' | 'critical';
export type ConformityStatus = 'conform' | 'non_conform' | 'partial';

// Observation structure
export interface InspectionObservation {
  id: string;
  type: ObservationType;
  category: string;
  description: string;
  location?: string;
  severity?: SeverityLevel;
  conformity: ConformityStatus;
  corrective_action?: string;
  deadline?: string;
  photos?: string[];
  created_at: string;
}

// Document attached to inspection
export interface InspectionDocument {
  id: string;
  name: string;
  type: 'photo' | 'scan' | 'report' | 'certificate' | 'checklist';
  url: string;
  size: number;
  mime_type: string;
  metadata?: {
    latitude?: number;
    longitude?: number;
    captured_at?: string;
    caption?: string;
  };
  uploaded_at: string;
  uploaded_by?: string;
}

// Checklist item
export interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  required: boolean;
  checked: boolean;
  notes?: string;
  checked_at?: string;
}

// Measurement/reading
export interface InspectionMeasurement {
  id: string;
  parameter: string;
  value: number;
  unit: string;
  min_acceptable?: number;
  max_acceptable?: number;
  is_within_range: boolean;
  notes?: string;
}

// Participant in inspection
export interface InspectionParticipant {
  id: string;
  name: string;
  role: string;
  organization?: string;
  email?: string;
  phone?: string;
  signature_url?: string;
  signed_at?: string;
}

// Complete inspection execution data
export interface InspectionExecutionData {
  // Timing
  started_at?: string;
  completed_at?: string;
  duration_minutes?: number;
  
  // Location
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    captured_at: string;
  };
  
  // Content
  observations: InspectionObservation[];
  documents: InspectionDocument[];
  checklist: ChecklistItem[];
  measurements: InspectionMeasurement[];
  participants: InspectionParticipant[];
  
  // Results
  overall_conformity: ConformityStatus;
  quality_score?: number;
  progress_percentage: number;
  
  // Conclusions
  summary: string;
  recommendations: string[];
  corrective_actions_required: boolean;
  next_inspection_date?: string;
}

// PV (Procès-Verbal) Template types
export type PVType = 
  | 'technical_inspection' 
  | 'provisional_reception' 
  | 'final_reception' 
  | 'safety_inspection' 
  | 'quality_control';

export interface PVTemplate {
  type: PVType;
  title: string;
  sections: PVSection[];
  required_signatures: string[];
  footer_text?: string;
}

export interface PVSection {
  id: string;
  title: string;
  type: 'header' | 'text' | 'table' | 'observations' | 'checklist' | 'signatures' | 'photos';
  required: boolean;
  content?: string;
}

// Generated PV
export interface GeneratedPV {
  id: string;
  inspection_id: string;
  pv_type: PVType;
  pv_number: string;
  title: string;
  
  // Content
  header: {
    project_title: string;
    phase_name?: string;
    inspection_date: string;
    inspection_type: string;
    location: string;
  };
  
  participants: InspectionParticipant[];
  object: string;
  observations_summary: string;
  observations_table: Array<{
    category: string;
    observation: string;
    conformity: ConformityStatus;
    action?: string;
  }>;
  
  conclusions: {
    overall_status: ConformityStatus;
    summary: string;
    conditions?: string[];
  };
  
  recommendations: string[];
  reserves?: Array<{
    description: string;
    severity: SeverityLevel;
    deadline: string;
    responsible: string;
  }>;
  
  signatures: Array<{
    role: string;
    name: string;
    signature_url?: string;
    signed_at?: string;
    order: number;
  }>;
  
  annexes: Array<{
    title: string;
    document_url: string;
  }>;
  
  // Metadata
  status: 'draft' | 'finalized' | 'signed' | 'archived';
  generated_at: string;
  generated_by: string;
  finalized_at?: string;
  version: number;
  pdf_url?: string;
}

// Validation workflow
export type ValidationLevel = 'inspector' | 'quality_manager' | 'project_manager' | 'client';

export interface ValidationStep {
  level: ValidationLevel;
  validator_id?: string;
  validator_name?: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comments?: string;
  validated_at?: string;
}

export interface InspectionValidationWorkflow {
  inspection_id: string;
  current_level: ValidationLevel;
  steps: ValidationStep[];
  is_complete: boolean;
  final_status?: 'approved' | 'rejected';
  completed_at?: string;
}

// Default checklist templates by inspection type
export const CHECKLIST_TEMPLATES: Record<string, ChecklistItem[]> = {
  technical: [
    { id: '1', label: 'Conformité aux plans', category: 'Plans', required: true, checked: false },
    { id: '2', label: 'Qualité des matériaux', category: 'Matériaux', required: true, checked: false },
    { id: '3', label: 'Respect des dimensions', category: 'Mesures', required: true, checked: false },
    { id: '4', label: 'État des équipements', category: 'Équipements', required: true, checked: false },
    { id: '5', label: 'Documentation technique', category: 'Documents', required: true, checked: false },
  ],
  safety: [
    { id: '1', label: 'Équipements EPI disponibles', category: 'EPI', required: true, checked: false },
    { id: '2', label: 'Signalisation adéquate', category: 'Signalisation', required: true, checked: false },
    { id: '3', label: 'Accès sécurisé', category: 'Accès', required: true, checked: false },
    { id: '4', label: 'Procédures d\'urgence affichées', category: 'Procédures', required: true, checked: false },
    { id: '5', label: 'Extincteurs accessibles', category: 'Incendie', required: true, checked: false },
    { id: '6', label: 'Zones à risque identifiées', category: 'Risques', required: true, checked: false },
  ],
  quality: [
    { id: '1', label: 'Certificats matériaux présents', category: 'Certificats', required: true, checked: false },
    { id: '2', label: 'Essais de conformité réalisés', category: 'Essais', required: true, checked: false },
    { id: '3', label: 'Traçabilité des lots', category: 'Traçabilité', required: true, checked: false },
    { id: '4', label: 'Finitions conformes', category: 'Finitions', required: true, checked: false },
    { id: '5', label: 'Absence de défauts visibles', category: 'Défauts', required: true, checked: false },
  ],
  regulatory: [
    { id: '1', label: 'Permis de construire valide', category: 'Permis', required: true, checked: false },
    { id: '2', label: 'Autorisations environnementales', category: 'Environnement', required: true, checked: false },
    { id: '3', label: 'Conformité normes locales', category: 'Normes', required: true, checked: false },
    { id: '4', label: 'Assurances à jour', category: 'Assurances', required: true, checked: false },
  ],
};

// Observation categories
export const OBSERVATION_CATEGORIES = {
  technical: [
    'Structure', 'Fondations', 'Maçonnerie', 'Charpente', 
    'Électricité', 'Plomberie', 'Menuiserie', 'Peinture', 'Finitions'
  ],
  safety: [
    'EPI', 'Signalisation', 'Accès', 'Incendie', 
    'Électrique', 'Hauteur', 'Excavation', 'Circulation'
  ],
  quality: [
    'Matériaux', 'Dimensions', 'Alignement', 'Nivellement',
    'Étanchéité', 'Isolation', 'Acoustique', 'Esthétique'
  ],
};
