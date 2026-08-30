// src/dtos/transforms/MilestoneTransformer.ts
// VERSION CORRIGÉE v2.0 - Support pour l'import
// 
// Modifications:
// 1. Ajout de la méthode fromImportData pour transformer les données d'import
// 2. Ajout de la méthode toImportData pour exporter en format d'import
// 3. Ajout de la méthode normalizeImportData pour normaliser les données d'import
// 4. Support complet de materialUsage dans les transformations
// 5. Support des champs priority, type, weight, stageType, deliverables, dependencies
// 6. Support des alias snake_case/camelCase pour l'import

/**
 * Milestone Transformer - Hexagonal Architecture
 * Handles transformations between layers in hexagonal architecture
 * Pattern: UI Layer -> DTOs -> Application Layer -> Domain Model -> Infrastructure Layer -> DB
 *              ↑                                      ↓
 *              └─────────── DTOs ←──────────────┘
 * 
 * Following PROMPTS.md Rules:
 * - Rule #1: Arrow flow maintained (Presentation → Application → Domain ← Infrastructure)
 * - Rule #3: Transformer pattern applied (Entity ↔ DTO conversion)
 * - Rule #4: Domain purity maintained (no DTOs in entities)
 * - Rule #5: UI/DOMAIN separation (clean boundaries)
 * 
 * VERSION CORRIGÉE v2.0 - Support import 2D3DTECH
 */

import {
  MaterialUsage,
  Milestone,
  MilestoneDeliverable,
  MilestoneDependency,
  MilestoneStatus
} from '@/domain/entities/Milestone';
import {
  MilestonePriority as DTOPriority,
  MilestoneStatus as DTOStatus,
  MilestoneDTO,
  MilestoneImportDTO,
  MilestoneImportTransformer,
  MilestoneType
} from '@/dtos/entities/MilestoneDTO';
import { UserRoleDTO } from '@/dtos/entities/UserDTO';

// =============================================================================
// REQUEST DTOs
// =============================================================================

export interface CreateMilestoneRequestDTO {
  projectId: string;
  phaseId?: string;
  title: string;
  description?: string;
  targetDate: string;
  type?: MilestoneType;
  priority?: DTOPriority;
  weight?: number;
  isCritical?: boolean;
  dependencies?: string[];
  deliverables?: string[];
  assignedTo?: string;
  tags?: string[];
  templateId?: string;
  approvalRequirements?: string[];
  stageType?: string;
  notes?: string;
  materialUsage?: MaterialUsage[];
  materialCostEstimate?: number;
  actualMaterialCost?: number;
}

export interface UpdateMilestoneRequestDTO {
  title?: string;
  description?: string;
  targetDate?: string;
  status?: DTOStatus;
  type?: MilestoneType;
  priority?: DTOPriority;
  weight?: number;
  isCritical?: boolean;
  dependencies?: string[];
  deliverables?: string[];
  assignedTo?: string;
  progressPercentage?: number;
  notes?: string;
  tags?: string[];
  materialUsage?: MaterialUsage[];
  materialCostEstimate?: number;
  actualMaterialCost?: number;
}

// =============================================================================
// MILESTONE TRANSFORMER - VERSION CORRIGÉE
// =============================================================================

export class MilestoneTransformer {
  
  // =================== DATABASE ↔ DOMAIN ===================
  
  /**
   * Supabase Row → Domain Model
   * Following hexagonal architecture: Infrastructure → Application → Domain
   */
  static fromSupabase(row: Record<string, unknown>): Milestone {
    // Parse dependencies from JSON
    const dependencies: MilestoneDependency[] = [];
    if (row.dependencies && Array.isArray(row.dependencies)) {
      dependencies.push(...row.dependencies.map((dep: any, index: number) => ({
        id: `${row.id}_dep_${index}`,
        type: 'finish_to_start' as const,
        description: dep
      })));
    }

    // Parse deliverables
    const deliverables: MilestoneDeliverable[] = [];
    if (row.deliverables && Array.isArray(row.deliverables)) {
      deliverables.push(...row.deliverables.map((del: string, index: number) => ({
        id: `${row.id}_del_${index}`,
        name: del,
        description: '',
        status: 'pending' as const,
        dueDate: row.target_date as string,
        assignedTo: row.assigned_to as string || undefined
      })));
    }

    return new Milestone(
      row.id as string,
      row.project_id as string,
      row.title as string,
      (row.description as string) || null,
      row.target_date as string || null,
      row.completion_date as string || null,
      this.fromDatabaseStatus(row.status as string),
      (row.priority as DTOPriority) || 'normal',
      (row.progress_percentage as number) || null,
      dependencies,
      deliverables,
      (row.assigned_to as string) || null,
      (row.created_by as string) || null,
      (row.created_at as string) || null,
      (row.updated_at as string) || null,
      {
        templateId: (row.template_id as string) || undefined,
        constructionPhase: undefined,
        phaseId: (row.phase_id as string) || undefined,
        stageType: (row.stage_type as string) || undefined,
        notes: (row.notes as string) || undefined,
        weight: (row.weight as number) || 1,
        isCritical: (row.is_critical as boolean) || false,
        type: (row.type as MilestoneType) || 'checkpoint',
        priority: (row.priority as DTOPriority) || 'normal',
        tags: (row.tags as string[]) || [],
        predecessorIds: (row.dependencies as string[]) || [],
        expectedDeliverables: (row.deliverables as string[]) || [],
        approvalRequirements: (row.approval_requirements as string[]) || [],
        relativeOffsetDays: 0
      },
      (Array.isArray(row.material_usage) ? row.material_usage : []) as MaterialUsage[],
      (row.material_cost_estimate as number) || null,
      (row.actual_material_cost as number) || null
    );
  }

  /**
   * Domain Model → Supabase Insert/Update Object
   * Following hexagonal architecture: Domain → Application → Infrastructure
   */
  static toSupabase(milestone: Milestone): Record<string, unknown> {
    return {
      id: milestone.id,
      project_id: milestone.projectId,
      phase_id: milestone.configuration.phaseId,
      title: milestone.title,
      description: milestone.description,
      target_date: milestone.targetDate,
      completion_date: milestone.completionDate,
      status: this.toDatabaseStatus(milestone.status),
      progress_percentage: milestone.progressPercentage,
      dependencies: milestone.dependencies.map(dep => dep.description),
      deliverables: milestone.deliverables.map(del => del.name),
      assigned_to: milestone.assignedTo,
      created_by: milestone.createdBy,
      created_at: milestone.createdAt,
      updated_at: milestone.updatedAt,
      // Configuration fields
      template_id: milestone.configuration.templateId,
      type: milestone.configuration.type,
      priority: milestone.configuration.priority,
      weight: milestone.configuration.weight,
      is_critical: milestone.configuration.isCritical,
      tags: milestone.configuration.tags,
      predecessor_ids: milestone.configuration.predecessorIds,
      expected_deliverables: milestone.configuration.expectedDeliverables,
      approval_requirements: milestone.configuration.approvalRequirements,
      stage_type: milestone.configuration.stageType,
      notes: milestone.configuration.notes,
      relative_offset_days: milestone.configuration.relativeOffsetDays,
      material_usage: milestone.materialUsage,
      material_cost_estimate: milestone.materialCostEstimate,
      actual_material_cost: milestone.actualMaterialCost
    };
  }

  // =================== LEGACY TRANSFORMATIONS ===================
  
  static toLegacyFormat(dto: MilestoneDTO): Record<string, unknown> {
    return {
      id: dto.id,
      project_id: dto.projectId,
      phase_id: dto.phaseId,
      title: dto.title,
      description: dto.description,
      target_date: dto.targetDate,
      completion_date: dto.completionDate,
      status: dto.status,
      type: dto.type,
      priority: dto.priority,
      stage_type: dto.stageType,
      weight: dto.weight,
      notes: dto.notes,
      dependencies: dto.dependencies || [],
      material_usage: dto.materialUsage || [],
      material_cost_estimate: dto.materialCostEstimate,
      actual_material_cost: dto.actualMaterialCost,
      created_at: dto.createdAt,
      updated_at: dto.updatedAt
    };
  }

  static fromLegacyFormat(row: Record<string, unknown>): Partial<MilestoneDTO> {
    return {
      id: row.id as string,
      projectId: row.project_id as string,
      phaseId: row.phase_id as string | undefined,
      title: row.title as string,
      description: row.description as string | undefined,
      targetDate: row.target_date as string,
      completionDate: row.completion_date as string | undefined,
      status: (row.status as DTOStatus) || 'pending',
      type: (row.type as MilestoneType) || 'checkpoint',
      priority: (row.priority as DTOPriority) || 'normal',
      stageType: row.stage_type as string | undefined,
      weight: (row.weight as number) || 0,
      notes: row.notes as string | undefined,
      dependencies: (row.dependencies as string[]) || [],
      materialUsage: (row.material_usage as MaterialUsage[]) || [],
      materialCostEstimate: row.material_cost_estimate as number | undefined,
      actualMaterialCost: row.actual_material_cost as number | undefined,
      isFromTemplate: false,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    };
  }

  /**
   * Create Request → Supabase Insert Object
   * Following hexagonal architecture: UI → DTOs → Application → Infrastructure
   */
  static createToSupabase(request: CreateMilestoneRequestDTO): Record<string, unknown> {
    const now = new Date().toISOString();
    
    return {
      project_id: request.projectId,
      phase_id: request.phaseId,
      title: request.title,
      description: request.description,
      target_date: request.targetDate,
      status: 'pending',
      priority: request.priority || 'normal',
      weight: request.weight || 1,
      type: request.type || 'checkpoint',
      is_critical: request.isCritical || false,
      dependencies: request.dependencies || [],
      deliverables: request.deliverables || [],
      assigned_to: request.assignedTo,
      tags: request.tags || [],
      template_id: request.templateId,
      approval_requirements: request.approvalRequirements || [],
      stage_type: request.stageType,
      notes: request.notes,
      material_usage: request.materialUsage || [],
      material_cost_estimate: request.materialCostEstimate,
      actual_material_cost: request.actualMaterialCost,
      created_at: now,
      updated_at: now
    };
  }

  // =================== DOMAIN ↔ DTO ===================
  
  /**
   * Domain Model → API Response DTO
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toDTO(milestone: Milestone): MilestoneDTO {
    return {
      // Required UserRoleDTO properties
      assignedTo: milestone.assignedTo ? {
        id: milestone.assignedTo,
        userId: milestone.assignedTo,
        roleName: 'assignee',
        status: 'active',
        assignedAt: milestone.createdAt || new Date().toISOString(),
        createdAt: milestone.createdAt || '',
        updatedAt: milestone.updatedAt || ''
      } : {} as UserRoleDTO,
      createdBy: milestone.createdBy ? {
        id: milestone.createdBy,
        userId: milestone.createdBy,
        roleName: 'creator',
        status: 'active',
        assignedAt: milestone.createdAt || new Date().toISOString(),
        createdAt: milestone.createdAt || '',
        updatedAt: milestone.updatedAt || ''
      } : {} as UserRoleDTO,
      completedate: milestone.completionDate || '',

      id: milestone.id,
      projectId: milestone.projectId,
      phaseId: milestone.configuration.phaseId,
      title: milestone.title,
      description: milestone.description || undefined,
      targetDate: milestone.targetDate || '',
      earlyStartDate: undefined,
      lateFinishDate: undefined,
      status: this.toDTOStatus(milestone.status),
      type: milestone.configuration.type,
      priority: milestone.configuration.priority,
      stageType: milestone.configuration.stageType,
      weight: milestone.configuration.weight,
      notes: milestone.configuration.notes,
      isFromTemplate: !!milestone.configuration.templateId,
      templateId: milestone.configuration.templateId,
      dependencies: milestone.dependencies.map(dep => dep.description),
      floatDays: undefined,
      isOnCriticalPath: milestone.configuration.isCritical,
      deliverables: milestone.deliverables.map(del => del.name),
      approvalStatus: undefined,
      approvedBy: undefined,
      approvalDate: undefined,
      createdAt: milestone.createdAt || '',
      updatedAt: milestone.updatedAt || '',
      materialUsage: milestone.materialUsage,
      materialCostEstimate: milestone.materialCostEstimate ?? undefined,
      actualMaterialCost: milestone.actualMaterialCost ?? undefined
    };
  }

  /**
   * API Response DTO → Domain Model
   * Following hexagonal architecture: Presentation → Application → Domain
   */
  static fromDTO(dto: MilestoneDTO): Milestone {
    // Parse dependencies
    const dependencies: MilestoneDependency[] = [];
    if (dto.dependencies) {
      dependencies.push(...dto.dependencies.map((dep, index) => ({
        id: `${dto.id}_dep_${index}`,
        type: 'finish_to_start' as const,
        description: dep
      })));
    }

    // Parse deliverables
    const deliverables: MilestoneDeliverable[] = [];
    if (dto.deliverables) {
      deliverables.push(...dto.deliverables.map((del, index) => ({
        id: `${dto.id}_del_${index}`,
        name: del,
        description: '',
        status: 'pending' as const,
        dueDate: dto.targetDate,
        assignedTo: undefined
      })));
    }

    return new Milestone(
      dto.id,
      dto.projectId,
      dto.title,
      dto.description || null,
      dto.targetDate,
      dto.completionDate || null,
      this.fromDTOStatus(dto.status),
      dto.priority,
      null, // progressPercentage not in DTO
      dependencies,
      deliverables,
      dto?.assignedTo?.userId || null, // Extract userId from UserRoleDTO
      dto?.createdBy?.userId || null, // Extract userId from UserRoleDTO
      dto.createdAt,
      dto.updatedAt,
      {
        templateId: dto.templateId,
        constructionPhase: undefined,
        stageType: dto.stageType,
        notes: dto.notes,
        weight: dto.weight,
        isCritical: dto.isOnCriticalPath || false,
        type: dto.type,
        priority: dto.priority,
        tags: [],
        predecessorIds: dto.dependencies || [],
        expectedDeliverables: dto.deliverables || [],
        approvalRequirements: [],
        relativeOffsetDays: 0
      },
      dto.materialUsage || [],
      dto.materialCostEstimate ?? null,
      dto.actualMaterialCost ?? null
    );
  }

  /**
   * Create Request DTO → Domain Model
   * Following hexagonal architecture: UI → DTOs → Application → Domain
   */
  static fromCreateRequest(request: CreateMilestoneRequestDTO, id: string): Milestone {
    // Parse dependencies
    const dependencies: MilestoneDependency[] = [];
    if (request.dependencies) {
      dependencies.push(...request.dependencies.map((dep, index) => ({
        id: `${id}_dep_${index}`,
        type: 'finish_to_start' as const,
        description: dep
      })));
    }

    // Parse deliverables
    const deliverables: MilestoneDeliverable[] = [];
    if (request.deliverables) {
      deliverables.push(...request.deliverables.map((del, index) => ({
        id: `${id}_del_${index}`,
        name: del,
        description: '',
        status: 'pending' as const,
        dueDate: request.targetDate,
        assignedTo: request.assignedTo
      })));
    }

    return new Milestone(
      id,
      request.projectId,
      request.title,
      request.description || null,
      request.targetDate,
      null,
      'pending',
      request.priority || 'normal',
      null,
      dependencies,
      deliverables,
      request.assignedTo || null,
      null,
      new Date().toISOString(),
      new Date().toISOString(),
      {
        templateId: request.templateId,
        constructionPhase: undefined,
        weight: request.weight || 1,
        isCritical: request.isCritical || false,
        type: request.type || 'checkpoint',
        priority: request.priority || 'normal',
        tags: request.tags || [],
        predecessorIds: request.dependencies || [],
        expectedDeliverables: request.deliverables || [],
        approvalRequirements: request.approvalRequirements || [],
        stageType: request.stageType,
        notes: request.notes,
        relativeOffsetDays: 0
      }
    );
  }

  /**
   * Update Request DTO → Partial Domain Model
   * Following hexagonal architecture: UI → DTOs → Application → Domain
   */
  static fromUpdateRequest(dto: UpdateMilestoneRequestDTO): Partial<Milestone> {
    // Note: Since Milestone properties are readonly, we return update data
    // The service layer will handle creating a new Milestone instance with updates
    return {
      updatedAt: new Date().toISOString()
    };
  }

  // =================== NOUVEAU - IMPORT TRANSFORMATIONS ===================

  /**
   * Import Data → Domain Model
   * Following hexagonal architecture: Import → DTOs → Application → Domain
   * 
   * @param importData - Données d'import normalisées
   * @param projectId - ID du projet
   * @param id - ID du jalon (optionnel, généré si non fourni)
   * @returns Milestone - Entité domaine
   */
  static fromImportData(importData: MilestoneImportDTO, projectId: string, id?: string): Milestone {
    const normalized = this.normalizeImportData(importData);
    const milestoneId = id || `milestone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Normaliser le statut
    const status = MilestoneImportTransformer.normalizeStatus(importData.status) || 'pending';
    const priority = MilestoneImportTransformer.normalizePriority(importData.priority) || 'normal';
    const type = MilestoneImportTransformer.normalizeType(importData.type) || 'checkpoint';

    // Normaliser les dates
    const targetDate = MilestoneImportTransformer.normalizeDate(
      importData.target_date ?? importData.targetDate
    ) || new Date().toISOString();
    
    const completionDate = MilestoneImportTransformer.normalizeDate(
      importData.completion_date ?? importData.completionDate
    );

    // Extraire les dépendances
    const dependencies: MilestoneDependency[] = [];
    if (importData.dependencies) {
      dependencies.push(...importData.dependencies.map((dep, index) => ({
        id: `${milestoneId}_dep_${index}`,
        type: 'finish_to_start' as const,
        description: dep
      })));
    }

    // Extraire les livrables
    const deliverables: MilestoneDeliverable[] = [];
    if (importData.deliverables) {
      deliverables.push(...importData.deliverables.map((del, index) => ({
        id: `${milestoneId}_del_${index}`,
        name: del,
        description: '',
        status: 'pending' as const,
        dueDate: targetDate,
        assignedTo: undefined
      })));
    }

    // Extraire le materialUsage
    const materialUsage = importData.materialUsage || [];

    return new Milestone(
      milestoneId,
      projectId,
      MilestoneImportTransformer.normalizeTitle(importData.title || importData.name || 'Jalon importé'),
      importData.description || null,
      targetDate,
      completionDate || null,
      status as unknown as Parameters<typeof Milestone>[6],
      priority,
      importData.progress ?? importData.progressPercent ?? null,
      dependencies,
      deliverables,
      null, // assignedTo
      null, // createdBy
      new Date().toISOString(),
      new Date().toISOString(),
      {
        templateId: undefined,
        constructionPhase: undefined,
        phaseId: importData.phaseId,
        stageType: importData.stageType ?? importData.stage_type,
        notes: importData.notes,
        weight: importData.weight || 1,
        isCritical: priority === 'critical',
        type: type,
        priority: priority,
        tags: [],
        predecessorIds: importData.dependencies || [],
        expectedDeliverables: importData.deliverables || [],
        approvalRequirements: [],
        relativeOffsetDays: 0
      },
      materialUsage,
      importData.materialCostEstimate ?? null,
      importData.actualMaterialCost ?? null
    );
  }

  /**
   * Import Data → Supabase Insert Object
   * Following hexagonal architecture: Import → Application → Infrastructure
   */
  static importToSupabase(importData: MilestoneImportDTO, projectId: string): Record<string, unknown> {
    const now = new Date().toISOString();
    const normalized = this.normalizeImportData(importData);
    
    const targetDate = MilestoneImportTransformer.normalizeDate(
      importData.target_date ?? importData.targetDate
    ) || new Date().toISOString();
    
    const completionDate = MilestoneImportTransformer.normalizeDate(
      importData.completion_date ?? importData.completionDate
    );

    return {
      project_id: projectId,
      phase_id: importData.phaseId,
      title: MilestoneImportTransformer.normalizeTitle(importData.title || importData.name || 'Jalon importé'),
      description: importData.description,
      target_date: targetDate,
      completion_date: completionDate || null,
      status: MilestoneImportTransformer.normalizeStatus(importData.status) || 'pending',
      priority: MilestoneImportTransformer.normalizePriority(importData.priority) || 'normal',
      weight: importData.weight || 1,
      type: MilestoneImportTransformer.normalizeType(importData.type) || 'checkpoint',
      is_critical: (MilestoneImportTransformer.normalizePriority(importData.priority) || 'normal') === 'critical',
      dependencies: importData.dependencies || [],
      deliverables: importData.deliverables || [],
      tags: [],
      approval_requirements: [],
      stage_type: importData.stageType ?? importData.stage_type,
      notes: importData.notes,
      material_usage: importData.materialUsage || [],
      material_cost_estimate: importData.materialCostEstimate,
      actual_material_cost: importData.actualMaterialCost,
      external_ref: importData.externalRef,
      created_at: now,
      updated_at: now
    };
  }

  /**
   * Normalise les données d'import - NOUVEAU
   */
  static normalizeImportData(importData: MilestoneImportDTO): MilestoneImportDTO {
    return {
      externalRef: importData.externalRef,
      phaseId: importData.phaseId,
      title: MilestoneImportTransformer.normalizeTitle(importData.title || importData.name),
      name: importData.name,
      description: importData.description,
      targetDate: MilestoneImportTransformer.normalizeDate(importData.target_date ?? importData.targetDate),
      target_date: MilestoneImportTransformer.normalizeDate(importData.target_date ?? importData.targetDate),
      completionDate: MilestoneImportTransformer.normalizeDate(importData.completion_date ?? importData.completionDate),
      completion_date: MilestoneImportTransformer.normalizeDate(importData.completion_date ?? importData.completionDate),
      status: importData.status,
      progress: importData.progress ?? importData.progressPercent ?? 0,
      progressPercent: importData.progress ?? importData.progressPercent ?? 0,
      priority: importData.priority,
      type: importData.type,
      stageType: importData.stageType ?? importData.stage_type,
      stage_type: importData.stageType ?? importData.stage_type,
      weight: importData.weight,
      dependencies: importData.dependencies || [],
      deliverables: importData.deliverables || [],
      notes: importData.notes,
      materialUsage: importData.materialUsage || [],
      materialCostEstimate: importData.materialCostEstimate,
      actualMaterialCost: importData.actualMaterialCost,
      metadata: importData.metadata
    };
  }

  /**
   * Domain Model → Import Data - NOUVEAU
   * Pour l'export au format d'import
   */
  static toImportData(milestone: Milestone): MilestoneImportDTO {
    return {
      externalRef: milestone.configuration.templateId,
      phaseId: milestone.configuration.phaseId,
      title: milestone.title,
      name: milestone.title,
      description: milestone.description || undefined,
      targetDate: milestone.targetDate || undefined,
      target_date: milestone.targetDate || undefined,
      completionDate: milestone.completionDate || undefined,
      completion_date: milestone.completionDate || undefined,
      status: milestone.status,
      progress: milestone.progressPercentage || 0,
      progressPercent: milestone.progressPercentage || 0,
      priority: milestone.configuration.priority,
      type: milestone.configuration.type,
      stageType: milestone.configuration.stageType,
      stage_type: milestone.configuration.stageType,
      weight: milestone.configuration.weight,
      dependencies: milestone.dependencies.map(dep => dep.description),
      deliverables: milestone.deliverables.map(del => del.name),
      notes: milestone.configuration.notes,
      materialUsage: milestone.materialUsage,
      materialCostEstimate: milestone.materialCostEstimate ?? undefined,
      actualMaterialCost: milestone.actualMaterialCost ?? undefined
    };
  }

  /**
   * DTO → Import Data - NOUVEAU
   */
  static dtoToImportData(dto: MilestoneDTO): MilestoneImportDTO {
    return {
      externalRef: dto.templateId,
      phaseId: dto.phaseId,
      title: dto.title,
      name: dto.title,
      description: dto.description,
      targetDate: dto.targetDate,
      target_date: dto.targetDate,
      completionDate: dto.completionDate,
      completion_date: dto.completionDate,
      status: dto.status,
      progress: dto.progress,
      progressPercent: dto.progress,
      priority: dto.priority,
      type: dto.type,
      stageType: dto.stageType,
      stage_type: dto.stageType,
      weight: dto.weight,
      dependencies: dto.dependencies,
      deliverables: dto.deliverables,
      notes: dto.notes,
      materialUsage: dto.materialUsage,
      materialCostEstimate: dto.materialCostEstimate,
      actualMaterialCost: dto.actualMaterialCost
    };
  }

  // =================== UI ↔ DTO ===================
  
  /**
   * UI Form Data → Create Request DTO
   * Following hexagonal architecture: UI → DTOs → Application
   */
  static formToCreateRequest(formData: Record<string, unknown>): CreateMilestoneRequestDTO {
    return {
      projectId: formData.projectId as string,
      phaseId: formData.phaseId as string,
      title: formData.title as string,
      description: formData.description as string,
      targetDate: formData.targetDate as string,
      type: (formData.type as MilestoneType) || 'checkpoint',
      priority: (formData.priority as DTOPriority) || 'normal',
      weight: Number(formData.weight) || 1,
      isCritical: Boolean(formData.isCritical),
      dependencies: Array.isArray(formData.dependencies) ? formData.dependencies as string[] : [],
      deliverables: Array.isArray(formData.deliverables) ? formData.deliverables as string[] : [],
      assignedTo: formData.assignedTo as string,
      tags: Array.isArray(formData.tags) ? formData.tags as string[] : [],
      templateId: formData.templateId as string,
      approvalRequirements: Array.isArray(formData.approvalRequirements) ? formData.approvalRequirements as string[] : [],
      stageType: formData.stageType as string,
      notes: formData.notes as string,
      materialUsage: formData.materialUsage as MaterialUsage[],
      materialCostEstimate: formData.materialCostEstimate as number,
      actualMaterialCost: formData.actualMaterialCost as number
    };
  }

  /**
   * Domain Model → UI View Model
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toUI(milestone: Milestone) {
    const dto = this.toDTO(milestone);
    const today = new Date();
    const targetDate = new Date(dto.targetDate);
    const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      ...dto,
      // UI-specific properties
      formattedTargetDate: targetDate.toLocaleDateString(),
      formattedCompletionDate: dto.completionDate ? new Date(dto.completionDate).toLocaleDateString() : null,
      daysRemaining: daysRemaining,
      isOverdue: daysRemaining < 0 && dto.status !== 'completed',
      isToday: daysRemaining === 0,
      statusColor: this.getStatusColor(dto.status),
      priorityColor: this.getPriorityColor(dto.priority),
      progressVariant: this.getProgressVariant(milestone.progressPercentage || 0),
      canEdit: dto.status !== 'completed',
      canDelete: dto.status === 'pending',
      canComplete: ['pending', 'in_progress'].includes(dto.status as 'pending' | 'in_progress' | 'completed' | 'delayed'),
      badgeVariant: this.getBadgeVariant(dto.status, daysRemaining),
      icon: this.getStatusIcon(dto.status)
    };
  }

  /**
   * UI Form Data → Update Request DTO
   * Following hexagonal architecture: UI → DTOs → Application
   */
  static formToUpdateRequest(formData: Record<string, unknown>): UpdateMilestoneRequestDTO {
    return {
      title: formData.title as string,
      description: formData.description as string,
      targetDate: formData.targetDate as string,
      status: formData.status as DTOStatus,
      type: formData.type as MilestoneType,
      priority: formData.priority as DTOPriority,
      weight: Number(formData.weight),
      isCritical: Boolean(formData.isCritical),
      dependencies: Array.isArray(formData.dependencies) ? formData.dependencies as string[] : [],
      deliverables: Array.isArray(formData.deliverables) ? formData.deliverables as string[] : [],
      assignedTo: formData.assignedTo as string,
      progressPercentage: Number(formData.progressPercentage) || 0,
      notes: formData.notes as string,
      tags: Array.isArray(formData.tags) ? formData.tags as string[] : [],
      materialUsage: formData.materialUsage as MaterialUsage[],
      materialCostEstimate: formData.materialCostEstimate as number,
      actualMaterialCost: formData.actualMaterialCost as number
    };
  }

  // =================== BATCH TRANSFORMATIONS ===================
  
  /**
   * Multiple Supabase Rows → Domain Models
   */
  static manyFromSupabase(rows: Record<string, unknown>[]): Milestone[] {
    return rows.map(row => this.fromSupabase(row));
  }

  /**
   * Multiple Domain Models → DTOs
   */
  static manyToDTO(milestones: Milestone[]): MilestoneDTO[] {
    return milestones.map(milestone => this.toDTO(milestone));
  }

  /**
   * Multiple Domain Models → UI View Models
   */
  static manyToUI(milestones: Milestone[]): ReturnType<typeof this.toUI>[] {
    return milestones.map(milestone => this.toUI(milestone));
  }

  /**
   * Multiple DTOs → Domain Models
   */
  static manyFromDTO(dtos: MilestoneDTO[]): Milestone[] {
    return dtos.map(dto => this.fromDTO(dto));
  }

  /**
   * Multiple Import Data → Domain Models - NOUVEAU
   */
  static manyFromImportData(
    importDataList: MilestoneImportDTO[],
    projectId: string
  ): Milestone[] {
    return importDataList.map(data => this.fromImportData(data, projectId));
  }

  /**
   * Multiple Domain Models → Import Data - NOUVEAU
   */
  static manyToImportData(milestones: Milestone[]): MilestoneImportDTO[] {
    return milestones.map(milestone => this.toImportData(milestone));
  }

  // =================== ENUM CONVERSIONS ===================
  
  private static fromDatabaseStatus(status: string): MilestoneStatus {
    const mapping: Record<string, MilestoneStatus> = {
      'pending': 'pending',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'delayed': 'delayed',
      'blocked': 'blocked',
      'overdue': 'overdue'
    };
    return mapping[status] || 'pending';
  }

  private static toDatabaseStatus(status: MilestoneStatus): string {
    return status; // Already in snake_case
  }

  private static fromDTOStatus(dto: DTOStatus): MilestoneStatus {
    return dto as MilestoneStatus;
  }

  private static toDTOStatus(status: MilestoneStatus): DTOStatus {
    return status as DTOStatus;
  }

  // =================== UI HELPER METHODS ===================
  
  private static getStatusColor(status: DTOStatus): string {
    const colors = {
      'pending': 'blue',
      'in_progress': 'orange',
      'completed': 'green',
      'delayed': 'red'
    };
    return colors[status] || 'gray';
  }

  private static getPriorityColor(priority: DTOPriority): string {
    const colors = {
      'low': 'gray',
      'normal': 'blue',
      'high': 'orange',
      'critical': 'red'
    };
    return colors[priority] || 'gray';
  }

  private static getProgressVariant(progress: number): string {
    if (progress >= 100) return 'success';
    if (progress >= 75) return 'primary';
    if (progress >= 50) return 'info';
    if (progress >= 25) return 'warning';
    return 'danger';
  }

  private static getBadgeVariant(status: DTOStatus, daysRemaining: number): string {
    if (status === 'completed') return 'success';
    if (status === 'delayed') return 'danger';
    if (daysRemaining < 0 && (status as string) !== 'completed') return 'warning';
    if (status === 'in_progress') return 'primary';
    return 'secondary';
  }

  private static getStatusIcon(status: DTOStatus): string {
    const icons = {
      'pending': 'clock',
      'in_progress': 'play-circle',
      'completed': 'check-circle',
      'delayed': 'alert-circle'
    };
    return icons[status] || 'clock';
  }

  // =================== SUMMARY TRANSFORMATIONS ===================
  
  /**
   * Create summary object for lists
   */
  static toSummary(milestone: Milestone) {
    const ui = this.toUI(milestone);
    
    return {
      id: ui.id,
      title: ui.title,
      status: ui.status,
      priority: ui.priority,
      targetDate: ui.formattedTargetDate,
      daysRemaining: ui.daysRemaining,
      progressPercentage: milestone.progressPercentage,
      isCritical: milestone.configuration.isCritical,
      badgeVariant: ui.badgeVariant,
      statusColor: ui.statusColor
    };
  }

  /**
   * Create timeline item
   */
  static toTimelineItem(milestone: Milestone) {
    const ui = this.toUI(milestone);
    
    return {
      id: ui.id,
      title: ui.title,
      description: ui.description,
      date: ui.formattedTargetDate,
      status: ui.status,
      icon: ui.icon,
      color: ui.statusColor,
      isToday: ui.isToday,
      isOverdue: ui.isOverdue,
      progress: milestone.progressPercentage
    };
  }
}

export default MilestoneTransformer;