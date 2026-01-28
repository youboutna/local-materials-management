/**
 * Project Creation DTO - Architecture Hexagonale
 * DTO pour la création de projets avec types forts
 */

export interface ProjectCreationDTO {
  // Basic info
  title: string;
  project_reference: string;
  description: string;
  budget: number;
  estimated_duration_days: number;
  currency: CurrencyCode;
  status: ProjectStatus;
  
  // Dates
  start_date: string;
  end_date?: string;
  
  // Location
  address: string;
  latitude?: number;
  longitude?: number;
  area_sqm?: number;
  site_details?: string;
  
  // Financial
  payment_mode: PaymentMode;
  payment_frequency: PaymentFrequency;
  initial_advance: number;
  retention_percentage: number;
  advance_percentage?: number;
  
  // Team & Stakeholders
  project_manager_id?: string;
  technical_manager_id?: string;
  supervisor_id?: string;
  client_id?: string;
  workspace_id?: string;
  
  // Project metadata
  project_type: ProjectType;
  sector: string;
  priority: Priority;
  financing_source: string;
  donor_organization?: string;
  market_type: MarketType;
  selection_mode: SelectionMode;
  permit_number?: string;
  
  // Client info
  client_name?: string;
  main_contractor?: string;
  engineering_consultant?: string;
}

export interface ProjectWorkflowDTO {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  data: Partial<ProjectCreationDTO>;
  stakeholders?: StakeholderDTO[];
  risks?: RiskDTO[];
  compliance?: ComplianceDTO[];
  phases?: PhaseDTO[];
}

// Types enums
export type CurrencyCode = 'MRU' | 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CFA';
export type ProjectStatus = 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé';
export type PaymentMode = 'progressive' | 'milestone' | 'completion';
export type PaymentFrequency = 'monthly' | 'quarterly' | 'milestone';
export type ProjectType = 'infrastructure' | 'fourniture' | 'distribution_rurale';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type MarketType = 'appel_offre_international' | 'appel_offre_local' | 'gré_à_gré';
export type SelectionMode = 'qualite_cout' | 'prix_le_plus_bas' | 'technique_pondere';

// Interfaces pour les entités associées
export interface StakeholderDTO {
  id: string;
  type: "employee" | "external";
  entityId: string;
  role: string;
  isPrimary: boolean;
  name: string;
  email?: string;
  phone?: string;
}

export interface RiskDTO {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'financial' | 'environmental' | 'regulatory' | 'operational' | 'security';
  probability: number; // 1-5 scale
  impact: number; // 1-5 scale
  riskScore: number; // probability * impact
  mitigationPlan: string;
  contingencyPlan: string;
  status: 'identified' | 'assessed' | 'mitigated' | 'monitoring' | 'closed';
  owner: string;
  reviewDate?: string;
  costs?: number;
  timeline_impact?: number;
}

export interface ComplianceDTO {
  id: string;
  type: 'regulatory' | 'insurance' | 'bank_guarantee' | 'technical' | 'environmental';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: string;
  responsible: string;
  documents: string[];
  notes?: string;
}

export interface PhaseDTO {
  id: string;
  name: string;
  phase_name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  start_date?: string;
  end_date?: string;
  estimated_cost?: number;
  order?: number;
  custom_phase_data?: Record<string, unknown>;
}
