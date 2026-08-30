// src/dtos/entities/MilestoneDTO.ts
// VERSION CORRIGÉE v2.0 - Support pour l'import
// 
// Modifications:
// 1. Ajout du champ externalRef pour support des références externes
// 2. Ajout du champ progressPercent comme alias de progress
// 3. Ajout du champ target_date comme alias de targetDate (support snake_case)
// 4. Ajout du champ completion_date comme alias de completionDate (support snake_case)
// 5. Ajout du champ stageType pour support des types de stage
// 6. Ajout du champ deliverables en tant que tableau
// 7. Support complet de materialUsage avec MaterialUsageDTO
// 8. Ajout des champs materialCostEstimate et actualMaterialCost
// 9. Ajout de l'interface MilestoneImportDTO pour l'import

/**
 * MilestoneDTO - Centralized DTO Structure
 * Following PROMPTS.md naming conventions and hexagonal architecture
 * 
 * Jalon de projet avec méthodologie PM (Waterfall, PERT, CPM)
 * VERSION CORRIGÉE v2.0 - Support import 2D3DTECH
 */

import { UserRoleDTO } from "./UserDTO";

// =============================================================================
// TYPES DE BASE
// =============================================================================

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';

/**
 * Milestone type according to PM standards
 * - gate: Decision point requiring approval (phase gate review)
 * - deliverable: Tangible output completion
 * - checkpoint: Progress verification point
 * - event: Key project event (kickoff, handover, etc.)
 */
export type MilestoneType = 'gate' | 'deliverable' | 'checkpoint' | 'event';

/**
 * Milestone priority for scheduling (PERT/CPM)
 * - critical: On critical path, any delay impacts project end date
 * - high: Important but with some slack time
 * - normal: Standard milestone with float
 * - low: Optional milestone
 */
export type MilestonePriority = 'critical' | 'high' | 'normal' | 'low';

// =============================================================================
// MATERIAL USAGE DTO - NOUVEAU
// =============================================================================

export interface MaterialUsageDTO {
  materialId: string;
  plannedQuantity: number;
  usedQuantity: number;
  unitCost?: number;
}

// =============================================================================
// MILESTONE TEMPLATE DTO
// =============================================================================

export interface MilestoneTemplateDTO {
  id: string;
  name: string;
  description?: string;
  /** Relative offset in days from phase start */
  relativeOffsetDays: number;
  /** Weight for progress calculation (0.1 - 1.0) */
  weight: number;
  /** If true, this milestone is critical for phase completion (CPM) */
  isCritical: boolean;
  /** Type of milestone according to PM standards */
  type: MilestoneType;
  /** Priority level for scheduling */
  priority: MilestonePriority;
  /** Tags/categories for filtering */
  tags?: string[];
  /** Predecessor milestone IDs (for PERT/CPM dependency tracking) */
  predecessorIds?: string[];
  /** Deliverables expected at this milestone */
  deliverables?: string[];
  /** Approval requirements for gate milestones */
  approvalRequirements?: string[];
  requiresInspection?: boolean;
}

// =============================================================================
// MILESTONE DTO - VERSION COMPLÈTE
// =============================================================================

/**
 * Milestone instance attached to a phase
 * Supports full PERT/CPM scheduling with dependencies
 * Database DTO format (snake_case) + CamelCase pour l'UI
 */
export interface MilestoneDTO {
  // Identifiants
  id: string;
  projectId: string;
  phaseId?: string;
  externalRef?: string; // NOUVEAU - Support références externes

  // Informations Générales
  title: string;
  description?: string;
  
  // Dates
  targetDate: string;
  /** Alias snake_case pour targetDate - NOUVEAU */
  target_date?: string;
  /** Earliest start date (PERT forward pass) */
  earlyStartDate?: string;
  /** Latest finish date without delay (PERT backward pass) */
  lateFinishDate?: string;
  completionDate?: string;
  /** Alias snake_case pour completionDate - NOUVEAU */
  completion_date?: string;
  /** Alias pour completionDate (legacy) */
  completedate?: string;
  
  // Statut et Progression
  status: MilestoneStatus;
  progress?: number;
  /** Alias pour progress - NOUVEAU */
  progressPercent?: number;
  
  // Classification
  type: MilestoneType;
  priority: MilestonePriority;
  /** Stage category for workflow grouping - NOUVEAU */
  stageType?: string;
  /** Alias pour stageType - NOUVEAU */
  stage_type?: string;
  
  // Poids et Métriques
  weight: number;
  /** Float/slack time in days (0 = critical path) */
  floatDays?: number;
  /** Is on critical path */
  isOnCriticalPath?: boolean;
  
  // Notes
  notes?: string;
  
  // Template
  isFromTemplate: boolean;
  templateId?: string;
  
  // Dépendances et Livrables
  /** Predecessor milestone IDs (FS - Finish-to-Start dependencies) */
  dependencies?: string[];
  /** Deliverables list - NOUVEAU */
  deliverables?: string[];
  
  // Approbation
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'not_applicable';
  approvedBy?: string;
  approvalDate?: string;
  
  // ============================================
  // NOUVEAU - Support materialUsage
  // ============================================
  materialUsage?: MaterialUsageDTO[];
  materialCostEstimate?: number;
  actualMaterialCost?: number;
  
  // Assignation
  assignedTo: UserRoleDTO;
  createdBy: UserRoleDTO;
  
  // Métadonnées
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// MILESTONE SUMMARY DTO
// =============================================================================

export interface MilestoneSummaryDTO {
  id: string;
  title: string;
  targetDate: string;
  completionDate?: string;
  status: MilestoneStatus;
  type: MilestoneType;
  priority: MilestonePriority;
  phaseName?: string;
  phaseId?: string;
  weight: number;
  isCritical?: boolean;
  floatDays?: number;
  percentComplete?: number;
}

// =============================================================================
// MILESTONE FORM DTO
// =============================================================================

export interface MilestoneFormDTO {
  title: string;
  description?: string;
  targetDate: string;
  type: MilestoneType;
  priority: MilestonePriority;
  weight: number;
  notes?: string;
  phaseId?: string;
  deliverables?: string[];
  dependencies?: string[];
}

// =============================================================================
// MILESTONE PROGRESS DTO
// =============================================================================

export interface MilestoneProgressDTO {
  totalMilestones: number;
  completedMilestones: number;
  delayedMilestones: number;
  weightedProgress: number;
  schedulePerformanceIndex?: number;
  criticalPathStatus: 'on_track' | 'at_risk' | 'delayed';
  criticalPathFloatDays?: number;
  nextMilestone?: MilestoneSummaryDTO;
  overdueMilestones: MilestoneSummaryDTO[];
  upcomingMilestones: MilestoneSummaryDTO[];
}

// =============================================================================
// PERT ESTIMATE DTO
// =============================================================================

export interface PERTEstimateDTO {
  milestoneId: string;
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
  expectedDuration: number;
  standardDeviation: number;
}

// =============================================================================
// CRITICAL PATH DTO
// =============================================================================

export interface CriticalPathDTO {
  projectId: string;
  criticalPathMilestones: string[];
  totalDurationDays: number;
  estimatedEndDate: string;
  nearCriticalPaths: Array<{
    milestones: string[];
    floatDays: number;
  }>;
}

// =============================================================================
// GENERATED MILESTONE DTO
// =============================================================================

export interface GeneratedMilestoneDTO {
  title: string;
  description?: string;
  targetDate: string;
  type: 'gate' | 'deliverable' | 'checkpoint' | 'event';
  priority: 'critical' | 'high' | 'normal' | 'low';
  weight: number;
  deliverables?: string[];
  dependencies?: string[];
  phaseId: string;
  requiresInspection?: boolean;
  inspectionType?: string;
  templateId?: string;
  phaseCode?: string;
}

// =============================================================================
// MILESTONE IMPORT DTO - NOUVEAU POUR L'IMPORT 2D3DTECH
// =============================================================================

export interface MilestoneImportDTO {
  // Identifiants
  externalRef?: string;
  phaseId?: string;
  
  // Informations Générales
  title: string;
  name?: string;
  description?: string;
  
  // Dates
  targetDate?: string;
  target_date?: string;
  completionDate?: string;
  completion_date?: string;
  
  // Statut et Progression
  status?: string;
  progress?: number;
  progressPercent?: number;
  
  // Priorité et Type
  priority?: string;
  type?: string;
  stageType?: string;
  stage_type?: string;
  
  // Poids et Dépendances
  weight?: number;
  dependencies?: string[];
  deliverables?: string[];
  
  // Notes
  notes?: string;
  
  // ============================================
  // Support materialUsage - NOUVEAU
  // ============================================
  materialUsage?: MaterialUsageDTO[];
  materialCostEstimate?: number;
  actualMaterialCost?: number;
  
  // Métadonnées
  metadata?: Record<string, unknown>;
}

// =============================================================================
// MILESTONE STATUS LABELS
// =============================================================================

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  completed: 'Terminé',
  delayed: 'En retard',
  cancelled: 'Annulé'
};

// =============================================================================
// MILESTONE TYPE CONFIGURATION
// =============================================================================

export const MILESTONE_TYPES: Record<MilestoneType, { label: string; description: string; icon: string }> = {
  gate: {
    label: 'Point de décision',
    description: 'Revue de phase nécessitant une approbation formelle pour continuer',
    icon: 'ShieldCheck'
  },
  deliverable: {
    label: 'Livrable',
    description: 'Achèvement d\'un livrable tangible du projet',
    icon: 'Package'
  },
  checkpoint: {
    label: 'Point de contrôle',
    description: 'Vérification de l\'avancement sans approbation formelle',
    icon: 'CheckSquare'
  },
  event: {
    label: 'Événement clé',
    description: 'Événement important du projet (lancement, transfert, etc.)',
    icon: 'Flag'
  }
};

// =============================================================================
// MILESTONE PRIORITY CONFIGURATION
// =============================================================================

export const MILESTONE_PRIORITIES: Record<MilestonePriority, { label: string; color: string }> = {
  critical: { label: 'Critique', color: 'destructive' },
  high: { label: 'Haute', color: 'warning' },
  normal: { label: 'Normale', color: 'default' },
  low: { label: 'Basse', color: 'secondary' }
};

// =============================================================================
// MILESTONE TRANSFORMER - NOUVEAU
// =============================================================================

export class MilestoneImportTransformer {
  /**
   * Normalise un titre de jalon
   */
  static normalizeTitle(title?: string): string {
    return title?.trim() || 'Jalon sans titre';
  }

  /**
   * Normalise une date de jalon
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
   * Normalise le statut d'un jalon
   */
  static normalizeStatus(status?: string): MilestoneStatus | undefined {
    if (!status) return undefined;
    const normalized = status.toLowerCase().trim();
    const mapping: Record<string, MilestoneStatus> = {
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
   * Normalise la priorité d'un jalon
   */
  static normalizePriority(priority?: string): MilestonePriority | undefined {
    if (!priority) return undefined;
    const normalized = priority.toLowerCase().trim();
    const mapping: Record<string, MilestonePriority> = {
      'low': 'low',
      'medium': 'normal',
      'high': 'high',
      'critical': 'critical',
      'haute': 'high',
      'elevee': 'high',
      'élevée': 'high',
      'moyenne': 'normal',
      'basse': 'low',
      'faible': 'low',
      'normal': 'normal',
    };
    return mapping[normalized] || 'normal';
  }

  /**
   * Normalise le type d'un jalon
   */
  static normalizeType(type?: string): MilestoneType | undefined {
    if (!type) return undefined;
    const normalized = type.toLowerCase().trim();
    const mapping: Record<string, MilestoneType> = {
      'gate': 'gate',
      'deliverable': 'deliverable',
      'checkpoint': 'checkpoint',
      'event': 'event',
      'point de decision': 'gate',
      'decision': 'gate',
      'livrable': 'deliverable',
      'controle': 'checkpoint',
      'evenement': 'event',
      'evenement cle': 'event',
      'evenement clé': 'event',
    };
    return mapping[normalized] || 'checkpoint';
  }

  /**
   * Transforme un MilestoneImportDTO en données de création
   */
  static toCreateData(importData: MilestoneImportDTO, projectId: string): any {
    const targetDate = this.normalizeDate(importData.target_date ?? importData.targetDate) || new Date().toISOString();
    const completionDate = this.normalizeDate(importData.completion_date ?? importData.completionDate);

    return {
      projectId,
      phaseId: importData.phaseId,
      title: this.normalizeTitle(importData.title || importData.name),
      description: importData.description,
      targetDate,
      completionDate,
      status: this.normalizeStatus(importData.status) || 'pending',
      progress: importData.progress ?? importData.progressPercent ?? 0,
      priority: this.normalizePriority(importData.priority) || 'normal',
      type: this.normalizeType(importData.type) || 'checkpoint',
      weight: importData.weight ?? 0.2,
      notes: importData.notes,
      stageType: importData.stageType ?? importData.stage_type,
      deliverables: importData.deliverables || [],
      dependencies: importData.dependencies || [],
      externalRef: importData.externalRef,
      materialUsage: importData.materialUsage,
      materialCostEstimate: importData.materialCostEstimate,
      actualMaterialCost: importData.actualMaterialCost,
    };
  }

  /**
   * Transforme un MilestoneImportDTO en données de mise à jour
   */
  static toUpdateData(importData: MilestoneImportDTO): any {
    const updates: any = {};

    if (importData.title || importData.name) {
      updates.title = this.normalizeTitle(importData.title || importData.name);
    }
    if (importData.description) updates.description = importData.description;
    if (importData.target_date || importData.targetDate) {
      updates.targetDate = this.normalizeDate(importData.target_date ?? importData.targetDate);
    }
    if (importData.completion_date || importData.completionDate) {
      updates.completionDate = this.normalizeDate(importData.completion_date ?? importData.completionDate);
    }
    if (importData.status) updates.status = this.normalizeStatus(importData.status);
    if (importData.progress !== undefined || importData.progressPercent !== undefined) {
      updates.progress = importData.progress ?? importData.progressPercent;
    }
    if (importData.priority) updates.priority = this.normalizePriority(importData.priority);
    if (importData.type) updates.type = this.normalizeType(importData.type);
    if (importData.weight !== undefined) updates.weight = importData.weight;
    if (importData.notes) updates.notes = importData.notes;
    if (importData.stageType || importData.stage_type) {
      updates.stageType = importData.stageType ?? importData.stage_type;
    }
    if (importData.deliverables) updates.deliverables = importData.deliverables;
    if (importData.dependencies) updates.dependencies = importData.dependencies;
    if (importData.externalRef) updates.externalRef = importData.externalRef;
    if (importData.materialUsage) updates.materialUsage = importData.materialUsage;
    if (importData.materialCostEstimate !== undefined) updates.materialCostEstimate = importData.materialCostEstimate;
    if (importData.actualMaterialCost !== undefined) updates.actualMaterialCost = importData.actualMaterialCost;

    return updates;
  }
}

export default MilestoneImportTransformer;
/* ------------------------------------------------------------------------- */
/* Checkpoints : un checkpoint est une action de vérification d'un jalon.     */
/* Définitions canoniques (les fichiers CheckpointDTO / VerificationItemDTO   */
/* ne sont que des ré-exports de compatibilité).                             */
/* ------------------------------------------------------------------------- */

/** Statut d'un item ou d'un checkpoint de vérification. */
export type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'failed' | 'skipped';

/** Catégorie d'un item de vérification. */
export type CheckpointCategory =
  | 'inspection'
  | 'resource'
  | 'document'
  | 'service_fait'
  | 'approval'
  | 'material'
  | 'payment'
  | 'pv';

/** Nature du checkpoint rattaché au jalon. */
export type CheckpointType =
  | 'gate'
  | 'deliverable'
  | 'progress'
  | 'payment'
  | 'inspection'
  | 'approval'
  | 'custom';

/** Item élémentaire de vérification (preuve attendue). */
export interface VerificationItemDTO {
  id: string;
  title: string;
  category: CheckpointCategory;
  status: VerificationStatus;
  required: boolean;
  /** Poids relatif dans le score (0-1 ou pondération libre). */
  weight: number;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

/** Checkpoint d'un jalon (projet / phase / étape). */
export interface CheckpointDTO {
  id: string;
  projectId: string;
  phaseId?: string;
  stepId?: string;
  milestoneId: string;
  title: string;
  description?: string;
  checkpointType: CheckpointType;
  triggerProgress: number;
  financialWeight: number;
  status: VerificationStatus;
  progress: number;
  requiredInspections: string[];
  requiredDocuments: string[];
  requiredApprovals: string[];
  verificationResult?: CheckpointVerificationResultDTO;
  triggersPayment: boolean;
  paymentAmount?: number;
  triggersNotification: boolean;
  notificationRecipients?: string[];
  targetDate?: string;
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
}

/** Résultat consolidé d'une vérification de checkpoint. */
export interface CheckpointVerificationResultDTO {
  id: string;
  checkpointId: string;
  projectId: string;
  verified: boolean;
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  score?: number;
  items?: VerificationItemDTO[];
  blockingIssues?: string[];
  warnings?: string[];
  canProceed?: boolean;
}

/** Alias historique. */
export type CheckpointVerificationResult = CheckpointVerificationResultDTO;

export interface CreateCheckpointVerificationDto {
  checkpointId: string;
  projectId: string;
  items?: VerificationItemDTO[];
  notes?: string;
  verifiedBy?: string;
}

export interface UpdateCheckpointVerificationDto {
  id: string;
  status?: 'pending' | 'verified' | 'rejected';
  verified?: boolean;
  notes?: string;
  items?: VerificationItemDTO[];
}

export interface VerifyCheckpointRequestDto {
  checkpoint: CheckpointDTO;
  projectId?: string;
  phaseId?: string;
}

export interface VerifyCheckpointResponseDto {
  result: CheckpointVerificationResultDTO;
  errors?: string[];
}

export interface VerifyInspectionsRequestDto {
  requiredInspectionIds: string[];
  triggerProgress: number;
  projectId: string;
}

export interface VerifyDocumentsRequestDto {
  requiredDocumentIds: string[];
  projectId: string;
}

export interface VerifyApprovalsRequestDto {
  requiredApprovalIds: string[];
  projectId: string;
}

export interface VerifyResourcesRequestDto {
  stepId: string;
  projectId: string;
}

export interface VerifyServiceFaitRequestDto {
  checkpointId: string;
  projectId: string;
}
