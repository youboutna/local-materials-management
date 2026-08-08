/**
 * Project Import DTO - Architecture Hexagonale
 * DTO pour l'import de projets depuis des fichiers
 */

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
  project_manager_id?lestone' | 'completion';
export type PaymentFrequency = 'monthly' | 'quarterly' | 'milestone';
export type ProjectType = 'infrastructure' | 'fourniture' | 'distribution_rurale';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type MarketType = 'appel_offre_international' | 'appel_offre_local' | 'gré_à_gré';
export type SelectionMode = 'qualite_cout' | 'prix_le_plus_bas' | 'technique_pondere';