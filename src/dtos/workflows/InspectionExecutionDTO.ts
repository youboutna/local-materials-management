/**
 * Inspection Execution DTOs
 */

export type InspectionExecutionStatus =
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
  correctiveAction?: string;
  deadline?: string;
  photos?: string[];
  createdAt: string;
}

// Document attached to inspection
export interface InspectionDocument {
  id: string;
  name: string;
  type: 'photo' | 'scan' | 'report' | 'certificate' | 'checklist';
  url: string;
  size: number;
  mimeType: string;
  metadata?: {
    latitude?: number;
    longitude?: number;
    capturedAt?: string;
    caption?: string;
  };
  uploadedAt: string;
  uploadedBy?: string;
}

// Checklist item
export interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  required: boolean;
  checked: boolean;
  notes?: string;
  checkedAt?: string;
}

// Measurement/reading
export interface InspectionMeasurement {
  id: string;
  parameter: string;
  value: number;
  unit: string;
  minAcceptable?: number;
  maxAcceptable?: number;
  isWithinRange: boolean;
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
  signatureUrl?: string;
  signedAt?: string;
}

// Complete inspection execution data
export interface InspectionExecutionData {
  // Timing
  startedAt?: string;
  completedAt?: string;
  durationMinutes?: number;

  // Location
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    capturedAt: string;
  };

  // Content
  observations: InspectionObservation[];
  documents: InspectionDocument[];
  checklist: ChecklistItem[];
  measurements: InspectionMeasurement[];
  participants: InspectionParticipant[];

  // Results
  overallConformity: ConformityStatus;
  qualityScore?: number;
  progressPercentage: number;

  // Conclusions
  summary: string;
  recommendations: string[];
  correctiveActionsRequired: boolean;
  nextInspectionDate?: string;
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
  requiredSignatures: string[];
  footerText?: string;
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
  inspectionId: string;
  pvType: PVType;
  pvNumber: string;
  title: string;

  // Content
  header: {
    projectTitle: string;
    phaseName?: string;
    inspectionDate: string;
    inspectionType: string;
    location: string;
  };

  participants: InspectionParticipant[];
  object: string;
  observationsSummary: string;
  observationsTable: Array<{
    category: string;
    observation: string;
    conformity: ConformityStatus;
    action?: string;
  }>;

  conclusions: {
    overallStatus: ConformityStatus;
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
    signatureUrl?: string;
    signedAt?: string;
    order: number;
  }>;

  annexes: Array<{
    title: string;
    documentUrl: string;
  }>;

  // Metadata
  status: 'draft' | 'finalized' | 'signed' | 'archived';
  generatedAt: string;
  generatedBy: string;
  finalizedAt?: string;
  version: number;
  pdfUrl?: string;
}

// Validation workflow
export type ValidationLevel = 'inspector' | 'quality_manager' | 'project_manager' | 'client';

export interface ValidationStep {
  level: ValidationLevel;
  validatorId?: string;
  validatorName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comments?: string;
  validatedAt?: string;
}

export interface InspectionValidationWorkflow {
  inspectionId: string;
  currentLevel: ValidationLevel;
  steps: ValidationStep[];
  isComplete: boolean;
  finalStatus?: 'approved' | 'rejected';
  completedAt?: string;
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
