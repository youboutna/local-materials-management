// src/dtos/entities/ProjectImportDTO.ts
// VERSION CORRIGÉE v2.0 - Support complet pour l'import 2D3DTECH
// 
// Modifications:
// 1. Ajout des champs manquants pour ProjectImportDTO (sector, priority, mainContractor, etc.)
// 2. Ajout de MaterialUsageImportDTO pour support materialUsage dans les jalons
// 3. Extension de ProjectMilestoneImportDTO avec tous les champs supportés par MilestoneService
// 4. Ajout des méthodes de normalisation supplémentaires
// 5. Correction de la méthode toCreateProjectDTO

import { z } from 'zod';
import type { InterventionZoneDTO } from './InterventionZoneDTO';
import type { BoqLineDTO } from '../boq/BoqLineDTO';

// =============================================================================
// Zod Schemas
// =============================================================================

export const ProjectImportModeSchema = z.enum([
  'create',
  'upsert',
  'partial_update',
  'full_update',
  'skip_existing',
  'merge'
]);

export type ProjectImportMode = z.infer<typeof ProjectImportModeSchema>;

export const ConflictResolutionStrategySchema = z.enum([
  'use_import',
  'use_existing',
  'merge',
  'manual'
]);

export type ConflictResolutionStrategy = z.infer<typeof ConflictResolutionStrategySchema>;

// =============================================================================
// Types réutilisés
// =============================================================================

export type CurrencyCode = 'MRU' | 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CFA';
export type ProjectStatus = 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé' | 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING' | 'SUSPENDED' | 'CANCELLED';
export type PaymentMode = 'progressive' | 'milestone' | 'completion';
export type PaymentFrequency = 'monthly' | 'quarterly' | 'milestone';
export type ProjectType = 'infrastructure' | 'fourniture' | 'distribution_rurale' | 'consulting' | 'etudes';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type MarketType = 'appel_offre_international' | 'appel_offre_local' | 'gré_à_gré' | 'consultation';
export type SelectionMode = 'qualite_cout' | 'prix_le_plus_bas' | 'technique_pondere';
export type StakeholderType = 'project_manager' | 'supervisor' | 'inspector' | 'client' | 'contractor' | 'consultant' | 'regulatory_authority' | 'procurement_committee' | 'client_representative';

// =============================================================================
// Ré-export InterventionZoneDTO
// =============================================================================

export type { InterventionZoneDTO, InterventionZoneShape, InterventionZoneLatLng, InterventionZoneGeocodingMeta } from './InterventionZoneDTO';

// =============================================================================
// MaterialUsage DTO - NOUVEAU
// =============================================================================

export interface MaterialUsageImportDTO {
  materialId: string;
  plannedQuantity: number;
  usedQuantity: number;
  unitCost?: number;
}

// =============================================================================
// ProjectImportDTO - Version Complète avec tous les champs
// =============================================================================

export interface ProjectImportDTO {
  // === Identifiants ===
  externalRef?: string;
  projectReference?: string;
  organizationId?: string;

  // === Informations Générales ===
  title: string;
  description?: string;
  status?: ProjectStatus | string;
  progress?: number;
  projectType?: ProjectType | string;
  sector?: string;
  priority?: Priority | string;

  // === Budget et Finance ===
  budget?: number;
  currency?: CurrencyCode | string;
  financingSource?: string;
  donorOrganization?: string;
  budgetSources?: Array<{
    name: string;
    amount: number;
    type?: string;
  }>;

  // === Dates ===
  startDate?: string;
  endDate?: string;
  estimatedDurationDays?: number;
  launchDate?: string;
  attributionDate?: string;
  completionDate?: string;

  // === Localisation ===
  address?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  areaSqm?: number;
  siteDetails?: string;
  permitNumber?: string;

  // === Zones d'Intervention ===
  interventionZones?: InterventionZoneDTO[];
  interventionZone?: InterventionZoneDTO;
  regionCode?: string;
  cityCode?: string;

  // === Marché Public ===
  marketType?: MarketType | string;
  selectionMode?: SelectionMode | string;
  paymentMode?: PaymentMode | string;
  paymentFrequency?: PaymentFrequency | string;
  initialAdvance?: number;
  retentionPercentage?: number;
  referentialCode?: string;

  // === Personnel ===
  teamSize?: number;
  projectManagerId?: string;
  technicalManagerId?: string;
  supervisorId?: string;
  clientId?: string;
  clientName?: string;
  mainContractor?: string;
  engineeringConsultant?: string;

  // === Relations (Support complet) ===
  phases?: ProjectPhaseImportDTO[];
  tasks?: ProjectTaskImportDTO[];
  milestones?: ProjectMilestoneImportDTO[];
  stakeholders?: ProjectStakeholderImportDTO[];
  dqeLines?: BoqLineImportDTO[];
  documents?: ProjectDocumentImportDTO[];
  files?: ProjectFileImportDTO[];

  // === Métadonnées ===
  metadata?: Record<string, unknown>;
  workspaceId?: string;
  tags?: string[];
  source?: string;
  version?: string;

  // === Mode d'import ===
  importMode?: ProjectImportMode;
}

// =============================================================================
// Phase Import DTO - Version Complète
// =============================================================================

export interface ProjectPhaseImportDTO {
  id?: string;
  externalRef?: string;
  name: string;
  code?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  progress?: number;
  orderIndex?: number;
  status?: string;
  type?: string;
  estimatedCost?: number;
  actualCost?: number;
  budget?: number;
  weight?: number;
  dependencies?: string[];
  milestones?: ProjectMilestoneImportDTO[];
  tasks?: ProjectTaskImportDTO[];
  dqeLines?: BoqLineImportDTO[];
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Task Import DTO - Version Complète
// =============================================================================

export interface ProjectTaskImportDTO {
  id?: string;
  title: string;
  name?: string;
  description?: string;
  status?: string;
  priority?: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  phaseId?: string;
  assignedTo?: string | string[];
  assigneeName?: string;
  assigneeEmail?: string;
  assigneeId?: string;
  assigneeType?: 'employee' | 'supplier';
  estimatedHours?: number;
  actualHours?: number;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Milestone Import DTO - VERSION AMÉLIORÉE (AVEC materialUsage)
// =============================================================================

export interface ProjectMilestoneImportDTO {
  // === Identifiants ===
  externalRef?: string;
  phaseId?: string;
  
  // === Informations Générales ===
  title: string;
  name?: string;
  description?: string;
  
  // === Dates ===
  targetDate?: string;
  target_date?: string;
  completionDate?: string;
  completion_date?: string;
  
  // === Statut et Progression ===
  status?: string;
  progress?: number;
  progressPercent?: number;
  
  // === Priorité et Type ===
  priority?: string;
  type?: string;
  stageType?: string;
  
  // === Poids et Dépendances ===
  weight?: number;
  dependencies?: string[];
  deliverables?: string[];
  
  // === Notes ===
  notes?: string;
  
  // === Material Usage - NOUVEAU ===
  materialUsage?: MaterialUsageImportDTO[];
  materialCostEstimate?: number;
  actualMaterialCost?: number;
  
  // === Métadonnées ===
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Stakeholder Import DTO
// =============================================================================

export interface ProjectStakeholderImportDTO {
  externalRef?: string;
  stakeholderType?: StakeholderType | string;
  stakeholderEntityType?: 'employee' | 'supplier' | 'organization';
  supplierId?: string;
  organizationId?: string;
  employeeId?: string;
  role?: string;
  roleDescription?: string;
  isPrimary?: boolean;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// BoqLine Import DTO - Version Complète
// =============================================================================

export interface BoqLineImportDTO {
  btpCode?: string;
  code?: string;
  designation: string;
  unit: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  totalHt?: number;
  category?: string;
  dqeType?: string;
  status?: string;
  phaseId?: string;
  source?: 'project' | 'phase';
  taxRate?: number;
  discount?: number;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Document Import DTO
// =============================================================================

export interface ProjectDocumentImportDTO {
  title: string;
  description?: string;
  url?: string;
  documentType?: string;
  issueDate?: string;
  metadata?: Record<string, unknown>;
}

export interface ProjectFileImportDTO {
  fileName: string;
  content?: string;
  url?: string;
  mimeType?: string;
  size?: number;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Organization Import DTO
// =============================================================================

export interface OrganizationImportDTO {
  id: string;
  name: string;
  code?: string;
  type?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  externalRef?: string;
}

// =============================================================================
// Supplier Import DTO
// =============================================================================

export interface SupplierImportDTO {
  id: string;
  name: string;
  type?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  rating?: number;
  isActive?: boolean;
  nif?: string;
  bankInfo?: {
    bank?: string;
    account?: string;
    iban?: string;
  };
  externalRef?: string;
}

// =============================================================================
// Employee Import DTO
// =============================================================================

export interface EmployeeImportDTO {
  id: string;
  employeeId?: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  position?: string;
  department?: string;
  role?: string;
  type?: string;
  skills?: string[];
  certifications?: CertificationImportDTO[];
  isActive?: boolean;
  avatar?: string;
  externalRef?: string;
}

export interface CertificationImportDTO {
  name: string;
  issuer?: string;
  date?: string;
  expiryDate?: string;
  certificateId?: string;
}

// =============================================================================
// Dataset Import DTO
// =============================================================================

export interface ImportDatasetDTO {
  metadata?: ImportMetadataDTO;
  projects: ProjectImportDTO[];
  organizations?: OrganizationImportDTO[];
  suppliers?: SupplierImportDTO[];
  employees?: EmployeeImportDTO[];
  crossReferences?: Record<string, string[]>;
}

export interface ImportMetadataDTO {
  source: string;
  version: string;
  exportedAt: string;
  referential: string;
  totalRows: number;
  generatedAt?: string;
  sourceHash?: string;
  author?: string;
  description?: string;
}

// =============================================================================
// Options Import DTO
// =============================================================================

export interface ImportOptionsDTO {
  mode?: ProjectImportMode;
  conflictStrategy?: ConflictResolutionStrategy;
  targetReferential?: string;
  preserveRelations?: boolean;
  continueOnError?: boolean;
  batchSize?: number;
  fieldMapping?: Record<string, string>;
  ignoredFields?: string[];
  requiredFields?: string[];
  dryRun?: boolean;
  validateOnly?: boolean;
  employeeResolution?: 'email' | 'externalRef' | 'both';
  supplierResolution?: 'name' | 'externalRef' | 'both';
  organizationResolution?: 'name' | 'code' | 'externalRef' | 'both';
}

// =============================================================================
// Résultat Import DTO
// =============================================================================

export interface ImportResultDTO {
  summary: ImportSummaryDTO;
  operations: ImportOperationSummaryDTO;
  entities: ImportEntitySummaryDTO;
  errors: ImportErrorDTO[];
  warnings: ImportWarningDTO[];
  changes: ImportChangeLogDTO[];
  createdIds: string[];
  metadata?: ImportResultMetadataDTO;
}

export interface ImportSummaryDTO {
  totalRows: number;
  processedRows: number;
  validRows: number;
  invalidRows: number;
  successRate: number;
  hasErrors: boolean;
  hasWarnings: boolean;
  duration: number;
  timestamp: string;
}

export interface ImportOperationSummaryDTO {
  created: number;
  updated: number;
  skipped: number;
  merged: number;
  failed: number;
  total: number;
}

export interface ImportEntitySummaryDTO {
  projects: ImportEntityResultDTO;
  organizations: ImportEntityResultDTO;
  suppliers: ImportEntityResultDTO;
  employees: ImportEntityResultDTO;
  phases: ImportEntityResultDTO;
  tasks: ImportEntityResultDTO;
  milestones: ImportEntityResultDTO;
  stakeholders: ImportEntityResultDTO;
  dqeLines: ImportEntityResultDTO;
}

export interface ImportEntityResultDTO {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: ImportErrorDTO[];
  ids: string[];
}

export interface ImportErrorDTO {
  code: string;
  message: string;
  row?: number;
  entity?: string;
  field?: string;
  suggestion?: string;
  severity?: 'error' | 'warning' | 'info';
}

export interface ImportWarningDTO {
  code: string;
  message: string;
  row?: number;
  entity?: string;
  field?: string;
  suggestion?: string;
}

export interface ImportChangeLogDTO {
  entityType: 'project' | 'organization' | 'supplier' | 'employee' | 'phase' | 'task' | 'milestone' | 'stakeholder' | 'dqeLine';
  entityId: string;
  entityName: string;
  operation: 'created' | 'updated' | 'skipped' | 'merged' | 'failed';
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  changedFields?: string[];
  timestamp: string;
  reason?: string;
}

export interface ImportResultMetadataDTO {
  source: string;
  version: string;
  referential: string;
  importMode: ProjectImportMode;
  conflictStrategy?: ConflictResolutionStrategy;
  continueOnError?: boolean;
  batchSize?: number;
  duration: number;
  timestamp: string;
}

// =============================================================================
// Transformateur - VERSION AMÉLIORÉE
// =============================================================================

export class ImportDTOTransformer {
  /**
   * Normalise un titre de projet
   */
  static normalizeTitle(title: string): string {
    return title?.trim() || 'Projet sans titre';
  }

  /**
   * Normalise une référence de projet
   */
  static normalizeReference(ref?: string): string | undefined {
    if (!ref) return undefined;
    const trimmed = ref.trim();
    return trimmed || undefined;
  }

  /**
   * Normalise un statut - CORRIGÉ avec plus de mappings
   */
  static normalizeStatus(status?: string): string {
    if (!status) return 'DRAFT';
    const normalized = status.toLowerCase().trim();
    const mapping: Record<string, string> = {
      // Français
      'en cours': 'IN_PROGRESS',
      'en_cours': 'IN_PROGRESS',
      'en cours v2': 'IN_PROGRESS',
      'termine': 'COMPLETED',
      'terminé': 'COMPLETED',
      'termine_v2': 'COMPLETED',
      'en attente': 'PENDING',
      'en_attente': 'PENDING',
      'suspendu': 'SUSPENDED',
      'suspend': 'SUSPENDED',
      'annule': 'CANCELLED',
      'annulé': 'CANCELLED',
      'en_inspection_v2': 'IN_PROGRESS',
      // Anglais
      'in progress': 'IN_PROGRESS',
      'in_progress': 'IN_PROGRESS',
      'completed': 'COMPLETED',
      'pending': 'PENDING',
      'suspended': 'SUSPENDED',
      'cancelled': 'CANCELLED',
      'draft': 'DRAFT',
    };
    return mapping[normalized] || 'DRAFT';
  }

  /**
   * Normalise une date
   */
  static normalizeDate(date?: string): string | undefined {
    if (!date) return undefined;
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return undefined;
      return d.toISOString();
    } catch {
      return undefined;
    }
  }

  /**
   * Normalise un budget
   */
  static normalizeBudget(budget?: number | string): number | undefined {
    if (budget === undefined || budget === null) return undefined;
    const num = typeof budget === 'string' ? parseFloat(budget) : budget;
    return isNaN(num) ? undefined : num;
  }

  /**
   * Normalise une priorité
   */
  static normalizePriority(priority?: string): string | undefined {
    if (!priority) return undefined;
    const normalized = priority.toLowerCase().trim();
    const mapping: Record<string, string> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'critical',
      'haute': 'high',
      'elevee': 'high',
      'élevée': 'high',
      'moyenne': 'medium',
      'basse': 'low',
    };
    return mapping[normalized] || undefined;
  }

  /**
   * Normalise un statut de jalon
   */
  static normalizeMilestoneStatus(status?: string): string | undefined {
    if (!status) return undefined;
    const normalized = status.toLowerCase().trim();
    const mapping: Record<string, string> = {
      'planifie': 'pending',
      'planned': 'pending',
      'en_cours': 'in_progress',
      'en cours': 'in_progress',
      'in_progress': 'in_progress',
      'termine': 'completed',
      'terminé': 'completed',
      'completed': 'completed',
      'overdue': 'delayed',
      'delayed': 'delayed',
      'en_retard': 'delayed',
      'annule': 'cancelled',
      'annulé': 'cancelled',
      'cancelled': 'cancelled',
    };
    return mapping[normalized] || 'pending';
  }

  /**
   * Transforme une source brute en ProjectImportDTO
   */
  static fromSource(source: Record<string, unknown>): ProjectImportDTO {
    return {
      title: this.normalizeTitle(String(source.title || source.name || '')),
      description: String(source.description || ''),
      externalRef: String(source.externalRef || source.id || ''),
      projectReference: this.normalizeReference(String(source.reference || source.projectReference || '')),
      organizationId: String(source.organizationId || ''),
      status: this.normalizeStatus(String(source.status || '')),
      progress: typeof source.progress === 'number' ? source.progress : Number(source.progress) || 0,
      budget: this.normalizeBudget((source.budget ?? source.budgetTotal) as string | number | undefined),
      currency: String(source.currency || 'MRU'),
      startDate: this.normalizeDate(String(source.startDate || source.dateDebut || '')),
      endDate: this.normalizeDate(String(source.endDate || source.dateFin || '')),
      location: String(source.location || source.address || ''),
      latitude: typeof source.latitude === 'number' ? source.latitude : Number(source.latitude) || undefined,
      longitude: typeof source.longitude === 'number' ? source.longitude : Number(source.longitude) || undefined,
      teamSize: typeof source.teamSize === 'number' ? source.teamSize : Number(source.teamSize) || 0,
      projectType: String(source.projectType || source.type || ''),
      sector: String(source.sector || ''),
      priority: this.normalizePriority(String(source.priority || '')),
      referentialCode: String(source.referentialCode || source.referential || ''),
      marketType: String(source.marketType || ''),
      selectionMode: String(source.selectionMode || ''),
      launchDate: this.normalizeDate(String(source.launchDate || '')),
      attributionDate: this.normalizeDate(String(source.attributionDate || '')),
      completionDate: this.normalizeDate(String(source.completionDate || '')),
      financingSource: String(source.financingSource || ''),
      donorOrganization: String(source.donorOrganization || ''),
      mainContractor: String(source.mainContractor || ''),
      engineeringConsultant: String(source.engineeringConsultant || ''),
      clientName: String(source.clientName || ''),
      areaSqm: typeof source.areaSqm === 'number' ? source.areaSqm : Number(source.areaSqm) || undefined,
      phases: Array.isArray(source.phases) ? source.phases as ProjectPhaseImportDTO[] : [],
      tasks: Array.isArray(source.tasks) ? source.tasks as ProjectTaskImportDTO[] : [],
      milestones: Array.isArray(source.milestones) ? source.milestones as ProjectMilestoneImportDTO[] : [],
      stakeholders: Array.isArray(source.stakeholders) ? source.stakeholders as ProjectStakeholderImportDTO[] : [],
      dqeLines: Array.isArray(source.dqeLines) ? source.dqeLines as BoqLineImportDTO[] : [],
      interventionZones: Array.isArray(source.interventionZones) ? source.interventionZones as InterventionZoneDTO[] : [],
      metadata: typeof source.metadata === 'object' ? source.metadata as Record<string, unknown> : {},
      importMode: source.importMode as ProjectImportMode || 'upsert',
    };
  }

  /**
   * Valide un DTO d'import
   */
  static validate(dto: ProjectImportDTO): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!dto.title || dto.title.trim().length === 0) {
      errors.push('Le titre du projet est requis');
    }

    if (dto.budget !== undefined && dto.budget < 0) {
      errors.push('Le budget ne peut pas être négatif');
    }

    if (dto.progress !== undefined && (dto.progress < 0 || dto.progress > 100)) {
      errors.push('La progression doit être comprise entre 0 et 100');
    }

    if (dto.startDate && dto.endDate) {
      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
        errors.push('La date de début ne peut pas être postérieure à la date de fin');
      }
    }

    // Validation des phases
    if (dto.phases) {
      for (let i = 0; i < dto.phases.length; i++) {
        const phase = dto.phases[i];
        if (!phase.name || phase.name.trim().length === 0) {
          errors.push(`Phase ${i + 1}: le nom est requis`);
        }
      }
    }

    // Validation des jalons
    if (dto.milestones) {
      for (let i = 0; i < dto.milestones.length; i++) {
        const milestone = dto.milestones[i];
        if (!milestone.title || milestone.title.trim().length === 0) {
          errors.push(`Jalon ${i + 1}: le titre est requis`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Transforme un ProjectImportDTO en CreateProjectDTO - CORRIGÉ
   */
  static toCreateProjectDTO(dto: ProjectImportDTO): any {
    const baseDTO: any = {
      title: dto.title,
      description: dto.description || '',
      status: this.normalizeStatus(dto.status),
      progress: dto.progress || 0,
      budget: dto.budget || 0,
      currency: dto.currency || 'MRU',
      startDate: dto.startDate || new Date().toISOString(),
      endDate: dto.endDate || '',
      location: dto.location || 'Adresse non spécifiée',
      latitude: dto.latitude,
      longitude: dto.longitude,
      teamSize: dto.teamSize || 0,
      financingSource: dto.financingSource,
      marketType: dto.marketType,
      selectionMode: dto.selectionMode,
      projectType: dto.projectType,
      referentialCode: dto.referentialCode,
      organizationId: dto.organizationId,
      externalRef: dto.externalRef,
      projectReference: dto.projectReference,
      launchDate: dto.launchDate,
      attributionDate: dto.attributionDate,
      completionDate: dto.completionDate,
      sector: dto.sector,
      priority: dto.priority,
      interventionZones: dto.interventionZones,
      // NOUVEAUX CHAMPS
      mainContractor: dto.mainContractor,
      engineeringConsultant: dto.engineeringConsultant,
      clientName: dto.clientName,
      donorOrganization: dto.donorOrganization,
      areaSqm: dto.areaSqm,
    };

    // Ajouter les champs optionnels
    if (dto.estimatedDurationDays) baseDTO.estimatedDurationDays = dto.estimatedDurationDays;
    if (dto.siteDetails) baseDTO.siteDetails = dto.siteDetails;
    if (dto.permitNumber) baseDTO.permitNumber = dto.permitNumber;
    if (dto.budgetSources) baseDTO.budgetSources = dto.budgetSources;
    if (dto.metadata) baseDTO.metadata = dto.metadata;
    if (dto.tags) baseDTO.tags = dto.tags;

    return baseDTO;
  }

  /**
   * Transforme un ProjectMilestoneImportDTO en données de milestone - NOUVEAU
   */
  static toMilestoneData(milestone: ProjectMilestoneImportDTO, projectId: string, phaseId?: string): any {
    return {
      project_id: projectId,
      phase_id: phaseId || null,
      title: milestone.title || milestone.name || 'Jalon importé',
      description: milestone.description,
      target_date: milestone.target_date ?? milestone.targetDate ?? new Date().toISOString(),
      completion_date: milestone.completion_date ?? milestone.completionDate,
      status: this.normalizeMilestoneStatus(milestone.status) || 'pending',
      progress_percentage: milestone.progress ?? milestone.progressPercent ?? 0,
      external_ref: milestone.externalRef,
      priority: milestone.priority,
      type: milestone.type,
      weight: milestone.weight,
      notes: milestone.notes,
      stage_type: milestone.stageType,
      deliverables: milestone.deliverables,
      dependencies: milestone.dependencies,
      // NOUVEAU - Support materialUsage
      material_usage: milestone.materialUsage,
      material_cost_estimate: milestone.materialCostEstimate,
      actual_material_cost: milestone.actualMaterialCost,
    };
  }
}

export default ImportDTOTransformer;