/**
 * Project Import DTO - Architecture Hexagonale
 * DTO pour l'import de projets depuis des fichiers
 */

export interface ProjectImportDTO {
  title: string;
  description: string;
  budget: number;
  project_type: ProjectType;
  start_date: string;
  end_date?: string;
  address?: string;
  client_name?: string;
  main_contractor?: string;
  engineering_consultant?: string;
  project_reference?: string;
  estimated_duration_days?: number;
  currency?: CurrencyCode;
  sector?: string;
  priority?: Priority;
  financing_source?: string;
  market_type?: MarketType;
  selection_mode?: SelectionMode;
  payment_mode?: PaymentMode;
  payment_frequency?: PaymentFrequency;
  initial_advance?: number;
  retention_percentage?: number;
  latitude?: number;
  longitude?: number;
  area_sqm?: number;
  site_details?: string;
  permit_number?: string;
  donor_organization?: string;
  client_id?: string;
  project_manager_id?: string;
  technical_manager_id?: string;
  supervisor_id?: string;
  workspace_id?: string;
}

export interface ProjectExportDTO {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  project_type: ProjectType;
  start_date: string;
  end_date?: string;
  client_name?: string;
  main_contractor?: string;
  engineering_consultant?: string;
  project_reference?: string;
  estimated_duration_days?: number;
  currency?: CurrencyCode;
  sector?: string;
  priority?: Priority;
  financing_source?: string;
  market_type?: MarketType;
  selection_mode?: SelectionMode;
  payment_mode?: PaymentMode;
  payment_frequency?: PaymentFrequency;
  initial_advance?: number;
  retention_percentage?: number;
  progress?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  area_sqm?: number;
  site_details?: string;
  permit_number?: string;
  donor_organization?: string;
  client_id?: string;
  project_manager_id?: string;
  technical_manager_id?: string;
  supervisor_id?: string;
  workspace_id?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  total: number;
  errors: string[];
  warnings?: string[];
  importedProjects?: ProjectExportDTO[];
}

export interface ImportMode {
  mode: 'create' | 'update' | 'patch';
  strategy: 'skip_duplicates' | 'overwrite' | 'merge';
}

export interface ImportOptions {
  maxFileSize: number;
  allowedFormats: string[];
  allowedMimeTypes: string[];
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'email' | 'url';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

// Types réutilisés
export type CurrencyCode = 'MRU' | 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CFA';
export type ProjectStatus = 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé';
export type PaymentMode = 'progressive' | 'milestone' | 'completion';
export type PaymentFrequency = 'monthly' | 'quarterly' | 'milestone';
export type ProjectType = 'infrastructure' | 'fourniture' | 'distribution_rurale';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type MarketType = 'appel_offre_international' | 'appel_offre_local' | 'gré_à_gré';
export type SelectionMode = 'qualite_cout' | 'prix_le_plus_bas' | 'technique_pondere';
