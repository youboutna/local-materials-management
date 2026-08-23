/**
 * Project Import DTO - Architecture Hexagonale
 * DTO pour l'import de projets depuis des fichiers
 */

export interface ProjectImportDTO {
  title: string;
  description: string;
  budget: number;
  projectType: ProjectType;
  startDate: string;
  endDate?: string;
  address?: string;
  clientName?: string;
  mainContractor?: string;
  engineeringConsultant?: string;
  projectReference?: string;
  estimatedDurationDays?: number;
  currency?: CurrencyCode;
  sector?: string;
  priority?: Priority;
  financingSource?: string;
  marketType?: MarketType;
  selectionMode?: SelectionMode;
  paymentMode?: PaymentMode;
  paymentFrequency?: PaymentFrequency;
  initialAdvance?: number;
  retentionPercentage?: number;
  latitude?: number;
  longitude?: number;
  areaSqm?: number;
  siteDetails?: string;
  permitNumber?: string;
  donorOrganization?: string;
  clientId?: string;
  projectManagerId?: string;
  technicalManagerId?: string;
  supervisorId?: string;
  workspaceId?: string;
}

export interface ProjectExportDTO {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  projectType: ProjectType;
  startDate: string;
  endDate?: string;
  clientName?: string;
  mainContractor?: string;
  engineeringConsultant?: string;
  projectReference?: string;
  estimatedDurationDays?: number;
  currency?: CurrencyCode;
  sector?: string;
  priority?: Priority;
  financingSource?: string;
  marketType?: MarketType;
  selectionMode?: SelectionMode;
  paymentMode?: PaymentMode;
  paymentFrequency?: PaymentFrequency;
  initialAdvance?: number;
  retentionPercentage?: number;
  progress?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  areaSqm?: number;
  siteDetails?: string;
  permitNumber?: string;
  donorOrganization?: string;
  clientId?: string;
  projectManagerId?: string;
  technicalManagerId?: string;
  supervisorId?: string;
  workspaceId?: string;
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
