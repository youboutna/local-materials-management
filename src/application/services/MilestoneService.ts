// src/application/services/MilestoneService.ts
// VERSION CORRIGÉE v2.0 - Support pour l'import
// 
// Modifications:
// 1. Ajout de la méthode getMilestonesByProject pour l'import
// 2. Ajout de la méthode createMilestoneFromImportData pour l'import
// 3. Ajout de la méthode updateMilestoneFromImportData pour l'import
// 4. Support complet de materialUsage dans les jalons
// 5. Support des champs priority, type, weight, stageType, deliverables, dependencies

/**
 * Milestone Service - Hexagonal Architecture
 * Business logic for milestone management operations
 * VERSION CORRIGÉE v2.0 - Support import 2D3DTECH
 */

import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { IMaterialRepository } from '@/domain/repositories/IMaterialRepository';
import { CreateMilestoneData, IMilestoneRepository, UpdateMilestoneData } from '@/domain/repositories/IMilestoneRepository';
import { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import {
    CriticalPathDTO,
    MilestoneDTO,
    MilestoneFormDTO,
    MilestonePriority,
    MilestoneProgressDTO,
    MilestoneSummaryDTO,
    MilestoneTemplateDTO,
    MilestoneType
} from '@/dtos/entities/MilestoneDTO';
import type { UserRoleDTO } from '@/dtos/entities/UserDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { differenceInDays } from 'date-fns';

// =============================================================================
// INTERFACES
// =============================================================================

export interface Milestone {
  id: string;
  project_id: string;
  phase_id?: string;
  title: string;
  description?: string;
  target_date: string;
  actual_completion_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deliverables: string[];
  dependencies: string[];
  assigned_to?: string;
  budget?: number;
  actual_cost?: number;
  type?: MilestoneType;
  weight?: number;
  notes?: string;
  stage_type?: string;
  material_usage?: Array<{ materialId: string; plannedQuantity: number; usedQuantity: number; unitCost?: number }>;
  material_cost_estimate?: number;
  actual_material_cost?: number;
  created_at: string;
  updated_at: string;
}

// Service DTOs for data exchange
export interface CreateMilestoneRequestDto {
  project_id: string;
  phase_id?: string;
  title: string;
  description?: string;
  target_date: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  progress?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  deliverables?: string[];
  dependencies?: string[];
  assigned_to?: string;
  budget?: number;
  actual_cost?: number;
  type?: MilestoneType;
  weight?: number;
  notes?: string;
  stage_type?: string;
  material_usage?: Array<{ materialId: string; plannedQuantity: number; usedQuantity: number; unitCost?: number }>;
  material_cost_estimate?: number;
  actual_material_cost?: number;
}

export interface UpdateMilestoneRequestDto {
  title?: string;
  description?: string;
  target_date?: string;
  actual_completion_date?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  progress?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  deliverables?: string[];
  dependencies?: string[];
  assigned_to?: string;
  budget?: number;
  actual_cost?: number;
  type?: MilestoneType;
  weight?: number;
  notes?: string;
  stage_type?: string;
  material_usage?: Array<{ materialId: string; plannedQuantity: number; usedQuantity: number; unitCost?: number }>;
  material_cost_estimate?: number;
  actual_material_cost?: number;
}

export interface MilestoneStatsDto {
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
  delayed: number;
  cancelled: number;
  completion_rate: number;
  on_time_completion_rate: number;
  average_progress: number;
}

// =============================================================================
// SERVICE
// =============================================================================

export class MilestoneService {
  constructor(
    private milestoneRepository: IMilestoneRepository = RepositoryFactory.getMilestoneRepository(),
    private projectRepository: IProjectRepository = RepositoryFactory.getProjectRepository(),
    private phaseRepository: IPhaseRepository = RepositoryFactory.getPhaseRepository(),
    private materialRepository: IMaterialRepository = RepositoryFactory.getMaterialRepository(),
    private inspectionRepository: IInspectionRepository = RepositoryFactory.getInspectionRepository(),
    private documentRepository: IDocumentRepository = RepositoryFactory.getDocumentRepository()
  ) {}

  // ===========================================================================
  // TRANSFORMATION METHODS
  // ===========================================================================

  private toServiceMilestone(milestone: MilestoneDTO): Milestone {
    return {
      id: milestone.id,
      project_id: milestone.projectId,
      phase_id: milestone.phaseId,
      title: milestone.title,
      description: milestone.description,
      target_date: milestone.targetDate,
      actual_completion_date: milestone.completionDate,
      status: milestone.status === 'delayed' ? 'delayed' : milestone.status,
      progress: 0,
      priority: milestone.priority === 'normal' ? 'medium' : milestone.priority,
      deliverables: milestone.deliverables || [],
      dependencies: milestone.dependencies || [],
      assigned_to: milestone.assignedTo?.userId,
      created_at: milestone.createdAt,
      updated_at: milestone.updatedAt,
      type: milestone.type,
      weight: milestone.weight,
      notes: milestone.notes,
      stage_type: milestone.stageType,
      material_usage: milestone.materialUsage,
      material_cost_estimate: milestone.materialCostEstimate,
      actual_material_cost: milestone.actualMaterialCost
    };
  }

  private transformToMilestoneDTO(milestone: Milestone): MilestoneDTO {
    return {
      id: milestone.id,
      projectId: milestone.project_id,
      phaseId: milestone.phase_id,
      title: milestone.title,
      description: milestone.description,
      targetDate: milestone.target_date,
      completionDate: milestone.actual_completion_date,
      completedate: milestone.actual_completion_date || '',
      status: milestone.status === 'cancelled' ? 'delayed' : milestone.status,
      type: milestone.type || 'checkpoint',
      priority: this.transformPriority(milestone.priority),
      weight: milestone.weight || 0.2,
      stageType: milestone.stage_type,
      notes: milestone.notes,
      isFromTemplate: false,
      dependencies: milestone.dependencies,
      deliverables: milestone.deliverables,
      assignedTo: this.emptyUserRoleDTO(),
      createdBy: this.emptyUserRoleDTO(),
      createdAt: milestone.created_at,
      updatedAt: milestone.updated_at,
      materialUsage: milestone.material_usage,
      materialCostEstimate: milestone.material_cost_estimate,
      actualMaterialCost: milestone.actual_material_cost
    };
  }

  private emptyUserRoleDTO(): UserRoleDTO {
    return {
      id: '',
      userId: '',
      roleName: '',
      status: 'active',
      assignedAt: '',
      createdAt: '',
      updatedAt: ''
    };
  }

  private transformPriority(priority: 'low' | 'medium' | 'high' | 'critical'): MilestonePriority {
    switch (priority) {
      case 'critical': return 'critical' as MilestonePriority;
      case 'high': return 'high' as MilestonePriority;
      case 'medium': return 'normal' as MilestonePriority;
      case 'low': return 'low' as MilestonePriority;
      default: return 'normal' as MilestonePriority;
    }
  }

  private transformPriorityFromForm(priority: MilestonePriority): 'low' | 'medium' | 'high' | 'critical' {
    switch (priority) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'normal': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  // ===========================================================================
  // CALCULATION METHODS
  // ===========================================================================

  private calculateMilestoneStatus(milestoneData: {
    target_date: string;
    actual_completion_date?: string;
    status: string;
    progress?: number;
  }): 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled' {
    const today = new Date();
    const targetDate = new Date(milestoneData.target_date);
    const progress = milestoneData.progress || 0;

    if (milestoneData.status === 'cancelled') return 'cancelled';
    if (milestoneData.actual_completion_date || progress >= 100) return 'completed';
    if (today > targetDate && progress < 100) return 'delayed';
    if (progress > 0) return 'in_progress';
    return 'pending';
  }

  private async calculateMilestoneProgress(milestoneId: string): Promise<number> {
    try {
      const deliverablesProgress = await this.getDeliverablesProgress(milestoneId);
      const inspectionsProgress = await this.getInspectionsProgress(milestoneId);
      const materialsProgress = await this.getMaterialsProgress(milestoneId);
      
      const totalProgress = (deliverablesProgress * 0.4) + (inspectionsProgress * 0.3) + (materialsProgress * 0.3);
      return Math.round(totalProgress);
    } catch (error) {
      console.error('MilestoneService.calculateMilestoneProgress failed:', error);
      return 0;
    }
  }

  private async getDeliverablesProgress(milestoneId: string): Promise<number> {
    try {
      const milestone = await this.milestoneRepository.findById(milestoneId);
      if (!milestone) return 0;
      if (milestone.status === 'completed') return 100;
      if (!milestone.deliverables || milestone.deliverables.length === 0) return 0;
      return milestone.status === 'in_progress' ? 50 : 0;
    } catch (error) {
      console.error('MilestoneService.getDeliverablesProgress failed:', error);
      return 0;
    }
  }

  private async getInspectionsProgress(milestoneId: string): Promise<number> {
    try {
      const milestone = await this.milestoneRepository.findById(milestoneId);
      if (!milestone?.projectId) return 0;

      const inspections = await this.inspectionRepository.findByProjectId(milestone.projectId);
      if (!inspections || inspections.length === 0) return 0;

      const completed = inspections.filter(i => String(i.status) === 'completed' || String(i.status) === 'approved').length;
      return Math.round((completed / inspections.length) * 100);
    } catch (error) {
      console.error('MilestoneService.getInspectionsProgress failed:', error);
      return 0;
    }
  }

  private async getMaterialsProgress(milestoneId: string): Promise<number> {
    try {
      const milestone = await this.milestoneRepository.findById(milestoneId);
      const usage = milestone?.materialUsage || [];
      const planned = usage.reduce((total, item) => total + Math.max(item.plannedQuantity, 0), 0);
      const used = usage.reduce((total, item) => total + Math.min(Math.max(item.usedQuantity, 0), Math.max(item.plannedQuantity, 0)), 0);

      return planned > 0 ? Math.round((used / planned) * 100) : 0;
    } catch (error) {
      console.error('MilestoneService.getMaterialsProgress failed:', error);
      return 0;
    }
  }

  // ===========================================================================
  // NOUVEAUX MÉTHODES POUR L'IMPORT 2D3DTECH
  // ===========================================================================

  /**
   * Récupère tous les jalons d'un projet - NOUVEAU
   * Utilisé par l'import pour la déduplication
   */
  async getMilestonesByProject(projectId: string): Promise<MilestoneDTO[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const milestones = await this.milestoneRepository.findByProjectId(projectId);
      return milestones.map(m => this.transformToMilestoneDTO(this.toServiceMilestone(m)));
    } catch (error) {
      console.error('MilestoneService.getMilestonesByProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get milestones by project');
    }
  }

  /**
   * Crée un jalon à partir des données d'import - NOUVEAU
   * Support complet de materialUsage, priority, type, weight, stageType, deliverables, dependencies
   */
  async createMilestoneFromImportData(
    projectId: string,
    phaseId: string | undefined,
    importData: {
      title: string;
      description?: string;
      targetDate?: string;
      target_date?: string;
      status?: string;
      progress?: number;
      progressPercent?: number;
      priority?: string;
      type?: string;
      weight?: number;
      notes?: string;
      stageType?: string;
      deliverables?: string[];
      dependencies?: string[];
      externalRef?: string;
      materialUsage?: Array<{ materialId: string; plannedQuantity: number; usedQuantity: number; unitCost?: number }>;
      materialCostEstimate?: number;
      actualMaterialCost?: number;
      completionDate?: string;
      completion_date?: string;
    }
  ): Promise<MilestoneDTO> {
    try {
      if (!projectId || !importData.title) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID and title are required');
      }

      // Normaliser les dates
      const targetDate = importData.target_date ?? importData.targetDate ?? new Date().toISOString();
      const completionDate = importData.completion_date ?? importData.completionDate;

      // Normaliser le statut
      const normalizedStatus = this.normalizeMilestoneStatus(importData.status);
      const normalizedPriority = this.normalizeMilestonePriority(importData.priority);

      // Normaliser le progrès
      const progress = importData.progress ?? importData.progressPercent ?? 0;

      const createData: CreateMilestoneRequestDto = {
        project_id: projectId,
        phase_id: phaseId,
        title: importData.title,
        description: importData.description,
        target_date: targetDate,
        status: normalizedStatus,
        progress: progress,
        priority: normalizedPriority,
        type: importData.type as MilestoneType || 'checkpoint',
        weight: importData.weight || 0.2,
        notes: importData.notes,
        stage_type: importData.stageType,
        deliverables: importData.deliverables || [],
        dependencies: importData.dependencies || [],
        material_usage: importData.materialUsage,
        material_cost_estimate: importData.materialCostEstimate,
        actual_material_cost: importData.actualMaterialCost,
      };

      // Si une date de completion est fournie, l'ajouter
      if (completionDate) {
        (createData as Record<string, unknown>).actual_completion_date = completionDate;
      }

      const milestone = await this.createMilestone(createData);
      return this.transformToMilestoneDTO(milestone);
    } catch (error) {
      console.error('MilestoneService.createMilestoneFromImportData failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create milestone from import data');
    }
  }

  /**
   * Met à jour un jalon à partir des données d'import - NOUVEAU
   * Support complet de materialUsage, priority, type, weight, stageType, deliverables, dependencies
   */
  async updateMilestoneFromImportData(
    id: string,
    importData: {
      title?: string;
      description?: string;
      targetDate?: string;
      target_date?: string;
      status?: string;
      progress?: number;
      progressPercent?: number;
      priority?: string;
      type?: string;
      weight?: number;
      notes?: string;
      stageType?: string;
      deliverables?: string[];
      dependencies?: string[];
      externalRef?: string;
      materialUsage?: Array<{ materialId: string; plannedQuantity: number; usedQuantity: number; unitCost?: number }>;
      materialCostEstimate?: number;
      actualMaterialCost?: number;
      completionDate?: string;
      completion_date?: string;
    }
  ): Promise<MilestoneDTO> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Milestone ID is required');
      }

      const updates: UpdateMilestoneRequestDto = {};

      if (importData.title) updates.title = importData.title;
      if (importData.description) updates.description = importData.description;
      if (importData.target_date || importData.targetDate) {
        updates.target_date = importData.target_date ?? importData.targetDate;
      }
      if (importData.completion_date || importData.completionDate) {
        updates.actual_completion_date = importData.completion_date ?? importData.completionDate;
      }
      if (importData.status) {
        updates.status = this.normalizeMilestoneStatus(importData.status);
      }
      if (importData.progress !== undefined || importData.progressPercent !== undefined) {
        updates.progress = importData.progress ?? importData.progressPercent;
      }
      if (importData.priority) {
        updates.priority = this.normalizeMilestonePriority(importData.priority);
      }
      if (importData.type) {
        updates.type = importData.type as MilestoneType;
      }
      if (importData.weight !== undefined) updates.weight = importData.weight;
      if (importData.notes) updates.notes = importData.notes;
      if (importData.stageType) updates.stage_type = importData.stageType;
      if (importData.deliverables) updates.deliverables = importData.deliverables;
      if (importData.dependencies) updates.dependencies = importData.dependencies;
      if (importData.materialUsage) updates.material_usage = importData.materialUsage;
      if (importData.materialCostEstimate !== undefined) updates.material_cost_estimate = importData.materialCostEstimate;
      if (importData.actualMaterialCost !== undefined) updates.actual_material_cost = importData.actualMaterialCost;

      const milestone = await this.updateMilestone(id, updates);
      return this.transformToMilestoneDTO(milestone);
    } catch (error) {
      console.error('MilestoneService.updateMilestoneFromImportData failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update milestone from import data');
    }
  }

  /**
   * Normalise le statut d'un jalon - NOUVEAU
   */
  private normalizeMilestoneStatus(status?: string): 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled' | undefined {
    if (!status) return undefined;
    const normalized = status.toLowerCase().trim();
    const mapping: Record<string, 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'> = {
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
   * Normalise la priorité d'un jalon - NOUVEAU
   */
  private normalizeMilestonePriority(priority?: string): 'low' | 'medium' | 'high' | 'critical' | undefined {
    if (!priority) return undefined;
    const normalized = priority.toLowerCase().trim();
    const mapping: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'critical',
      'haute': 'high',
      'elevee': 'high',
      'élevée': 'high',
      'moyenne': 'medium',
      'basse': 'low',
      'faible': 'low',
    };
    return mapping[normalized] || 'medium';
  }

  // ===========================================================================
  // EXISTING METHODS (inchangés)
  // ===========================================================================

  /**
   * Get project milestones
   */
  async getProjectMilestones(projectId: string): Promise<Milestone[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const milestones = await this.milestoneRepository.findByProjectId(projectId);
      
      if (!milestones || milestones.length === 0) {
        return [];
      }

      const milestonesWithProgress = await Promise.all(
        milestones.map(async milestone => {
          const serviceMilestone = this.toServiceMilestone(milestone);
          const calculatedStatus = this.calculateMilestoneStatus({
            target_date: serviceMilestone.target_date,
            actual_completion_date: serviceMilestone.actual_completion_date,
            status: serviceMilestone.status,
            progress: serviceMilestone.progress
          });
          const calculatedProgress = await this.calculateMilestoneProgress(serviceMilestone.id);

          return {
            ...serviceMilestone,
            status: calculatedStatus,
            progress: calculatedProgress
          };
        })
      );

      return milestonesWithProgress;
    } catch (error) {
      console.error('MilestoneService.getProjectMilestones failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project milestones');
    }
  }

  /**
   * Create a new milestone
   */
  async createMilestone(request: CreateMilestoneRequestDto): Promise<Milestone> {
    try {
      if (!request.project_id || !request.title) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID and title are required');
      }

      const milestoneData: CreateMilestoneData = {
        projectId: request.project_id,
        phaseId: request.phase_id,
        title: request.title,
        description: request.description,
        targetDate: request.target_date,
        status: request.status || 'pending',
        priority: request.priority === 'medium' ? 'normal' : request.priority,
        type: request.type,
        stageType: request.stage_type,
        weight: request.weight,
        dependencies: request.dependencies || [],
        notes: request.notes,
        materialUsage: request.material_usage,
        materialCostEstimate: request.material_cost_estimate,
        actualMaterialCost: request.actual_material_cost
      };

      const createdMilestone = await this.milestoneRepository.create(milestoneData);
      
      if (!createdMilestone) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create milestone');
      }

      return this.toServiceMilestone(createdMilestone);
    } catch (error) {
      console.error('MilestoneService.createMilestone failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create milestone');
    }
  }

  /**
   * Update an existing milestone
   */
  async updateMilestone(id: string, updates: UpdateMilestoneRequestDto): Promise<Milestone> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Milestone ID is required');
      }

      const existingMilestone = await (this.milestoneRepository as unknown as { findById: (id: string) => Promise<unknown> }).findById(id);
      
      if (!existingMilestone) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Milestone not found');
      }

      const updateData: UpdateMilestoneData = {
        title: updates.title,
        description: updates.description,
        targetDate: updates.target_date,
        completionDate: updates.actual_completion_date,
        status: updates.status,
        priority: updates.priority === 'medium' ? 'normal' : updates.priority,
        type: updates.type,
        stageType: updates.stage_type,
        weight: updates.weight,
        dependencies: updates.dependencies,
        notes: updates.notes,
        materialUsage: updates.material_usage,
        materialCostEstimate: updates.material_cost_estimate,
        actualMaterialCost: updates.actual_material_cost
      };

      const updatedMilestone = await this.milestoneRepository.update(id, updateData);
      
      if (!updatedMilestone) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to retrieve updated milestone');
      }

      return this.toServiceMilestone(updatedMilestone);
    } catch (error) {
      console.error('MilestoneService.updateMilestone failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update milestone');
    }
  }

  /**
   * Delete a milestone
   */
  async deleteMilestone(id: string): Promise<void> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Milestone ID is required');
      }

      const existingMilestone = await (this.milestoneRepository as unknown as { findById: (id: string) => Promise<unknown> }).findById(id);
      
      if (!existingMilestone) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Milestone not found');
      }

      await (this.milestoneRepository as unknown as { delete: (id: string) => Promise<void> }).delete(id);
    } catch (error) {
      console.error('MilestoneService.deleteMilestone failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete milestone');
    }
  }

  /**
   * Get milestone by ID
   */
  async getMilestoneById(id: string): Promise<Milestone | null> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Milestone ID is required');
      }

      const milestone = await (this.milestoneRepository as unknown as { findById: (id: string) => Promise<unknown> }).findById(id);
      
      if (!milestone) {
        return null;
      }

      return {
        id: (milestone as { id: string }).id,
        project_id: (milestone as { project_id: string }).project_id,
        title: (milestone as { title: string }).title,
        description: (milestone as { description?: string }).description,
        target_date: (milestone as { target_date: string }).target_date,
        actual_completion_date: (milestone as { actual_completion_date?: string }).actual_completion_date,
        status: (milestone as { status: string }).status as 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled',
        progress: (milestone as { progress: number }).progress || 0,
        priority: (milestone as { priority: string }).priority as 'low' | 'medium' | 'high' | 'critical',
        deliverables: (milestone as { deliverables: string[] }).deliverables || [],
        dependencies: (milestone as { dependencies: string[] }).dependencies || [],
        assigned_to: (milestone as { assigned_to?: string }).assigned_to,
        budget: (milestone as { budget?: number }).budget,
        actual_cost: (milestone as { actual_cost?: number }).actual_cost,
        type: (milestone as { type?: MilestoneType }).type,
        weight: (milestone as { weight?: number }).weight,
        notes: (milestone as { notes?: string }).notes,
        stage_type: (milestone as { stage_type?: string }).stage_type,
        material_usage: (milestone as { material_usage?: Array<{ materialId: string; plannedQuantity: number; usedQuantity: number; unitCost?: number }> }).material_usage,
        material_cost_estimate: (milestone as { material_cost_estimate?: number }).material_cost_estimate,
        actual_material_cost: (milestone as { actual_material_cost?: number }).actual_material_cost,
        created_at: (milestone as { created_at: string }).created_at,
        updated_at: (milestone as { updated_at: string }).updated_at
      };
    } catch (error) {
      console.error('MilestoneService.getMilestoneById failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get milestone by ID');
    }
  }

  /**
   * Complete a milestone
   */
  async completeMilestone(id: string): Promise<Milestone> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Milestone ID is required');
      }

      return this.updateMilestone(id, { status: 'completed', progress: 100 });
    } catch (error) {
      console.error('MilestoneService.completeMilestone failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to complete milestone');
    }
  }

  /**
   * Get milestone statistics for a project
   */
  async getMilestoneStats(projectId: string): Promise<MilestoneStatsDto> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const milestones = await this.getProjectMilestones(projectId);
      const total = milestones.length;
      const completed = milestones.filter(m => m.status === 'completed').length;
      const inProgress = milestones.filter(m => m.status === 'in_progress').length;
      const pending = milestones.filter(m => m.status === 'pending').length;
      const delayed = milestones.filter(m => m.status === 'delayed').length;
      const cancelled = milestones.filter(m => m.status === 'cancelled').length;
      
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      const averageProgress = milestones.length > 0 
        ? Math.round(milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length)
        : 0;
      
      return {
        total,
        completed,
        in_progress: inProgress,
        pending,
        delayed,
        cancelled,
        completion_rate: completionRate,
        on_time_completion_rate: completionRate,
        average_progress: averageProgress
      };
    } catch (error) {
      console.error('MilestoneService.getMilestoneStats failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get milestone stats');
    }
  }

  /**
   * Get milestone progress for a project
   */
  async getMilestoneProgress(projectId: string): Promise<number> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const milestones = await this.getProjectMilestones(projectId);
      
      if (milestones.length === 0) return 0;
      
      const totalProgress = milestones.reduce((sum, milestone) => sum + milestone.progress, 0);
      const averageProgress = totalProgress / milestones.length;
      
      return Math.round(averageProgress);
    } catch (error) {
      console.error('MilestoneService.getMilestoneProgress failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get milestone progress');
    }
  }

  // ===========================================================================
  // PM METRICS (EVM, SPI, CPI)
  // ===========================================================================

  async getMilestoneProgressWithMetrics(projectId: string, phaseId?: string): Promise<MilestoneProgressDTO> {
    try {
      const milestones = await this.getProjectMilestones(projectId);
      const milestoneDTOs = milestones.map(m => this.transformToMilestoneDTO(m));
      
      const today = new Date();
      const completed = milestoneDTOs.filter(m => m.status === 'completed');
      const pending = milestoneDTOs.filter(m => m.status === 'pending');
      const delayed = milestoneDTOs.filter(m => m.status === 'delayed');
      
      const totalWeight = milestoneDTOs.reduce((sum, m) => sum + (m.weight || 0.1), 0);
      const completedWeight = completed.reduce((sum, m) => sum + (m.weight || 0.1), 0);
      
      const upcomingMilestones: MilestoneSummaryDTO[] = pending
        .filter(m => {
          const targetDate = new Date(m.targetDate);
          const daysUntil = differenceInDays(targetDate, today);
          return daysUntil >= 0 && daysUntil <= 14;
        })
        .map(m => ({
          id: m.id,
          title: m.title,
          targetDate: m.targetDate,
          status: m.status,
          type: m.type,
          priority: m.priority,
          weight: m.weight
        }));

      const overdueMilestones: MilestoneSummaryDTO[] = pending
        .filter(m => {
          const targetDate = new Date(m.targetDate);
          return targetDate < today;
        })
        .map(m => ({
          id: m.id,
          title: m.title,
          targetDate: m.targetDate,
          status: m.status,
          type: m.type,
          priority: m.priority,
          weight: m.weight
        }));

      const nextMilestone: MilestoneSummaryDTO | undefined = pending.length > 0 ? {
        id: pending[0].id,
        title: pending[0].title,
        targetDate: pending[0].targetDate,
        status: pending[0].status,
        type: pending[0].type,
        priority: pending[0].priority,
        weight: pending[0].weight
      } : undefined;

      return {
        totalMilestones: milestoneDTOs.length,
        completedMilestones: completed.length,
        delayedMilestones: delayed.length,
        weightedProgress: totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0,
        schedulePerformanceIndex: 1.0,
        criticalPathStatus: delayed.length > 0 ? 'at_risk' : 'on_track',
        criticalPathFloatDays: 0,
        nextMilestone: nextMilestone,
        overdueMilestones: overdueMilestones,
        upcomingMilestones: upcomingMilestones
      };
    } catch (error) {
      console.error('MilestoneService.getMilestoneProgressWithMetrics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get milestone progress metrics');
    }
  }

  // ===========================================================================
  // CRITICAL PATH ANALYSIS
  // ===========================================================================

  async getCriticalPath(projectId: string): Promise<CriticalPathDTO> {
    try {
      const milestones = await this.getProjectMilestones(projectId);
      const milestoneDTOs = milestones.map(m => this.transformToMilestoneDTO(m));
      
      const criticalMilestones = milestoneDTOs.filter(m => m.priority === 'critical');
      
      return {
        projectId: projectId,
        criticalPathMilestones: criticalMilestones.map(m => m.id),
        totalDurationDays: criticalMilestones.length > 0 ? 
          differenceInDays(
            new Date(criticalMilestones[criticalMilestones.length - 1].targetDate),
            new Date(criticalMilestones[0].targetDate)
          ) : 0,
        estimatedEndDate: criticalMilestones.length > 0 
          ? criticalMilestones[criticalMilestones.length - 1].targetDate 
          : new Date().toISOString(),
        nearCriticalPaths: []
      };
    } catch (error) {
      console.error('MilestoneService.getCriticalPath failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get critical path');
    }
  }

  // ===========================================================================
  // SUMMARY REPORTS
  // ===========================================================================

  async getProjectSummary(projectId: string): Promise<MilestoneSummaryDTO> {
    try {
      const milestones = await this.getProjectMilestones(projectId);
      const milestoneDTOs = milestones.map(m => this.transformToMilestoneDTO(m));
      const progress = await this.getMilestoneProgressWithMetrics(projectId);
      const criticalPath = await this.getCriticalPath(projectId);
      
      const nextPending = milestoneDTOs.find(m => m.status === 'pending');
      
      return {
        id: projectId,
        title: `Project ${projectId} Summary`,
        targetDate: nextPending?.targetDate || new Date().toISOString(),
        status: progress.delayedMilestones > 0 ? 'delayed' : 'pending',
        type: 'checkpoint',
        priority: 'normal',
        weight: 1,
        isCritical: criticalPath.criticalPathMilestones.length > 0,
        floatDays: 0,
        percentComplete: progress.weightedProgress
      };
    } catch (error) {
      console.error('MilestoneService.getProjectSummary failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project summary');
    }
  }

  // ===========================================================================
  // ADDITIONAL METHODS
  // ===========================================================================

  async getPhaseMilestones(projectId: string, phaseId: string): Promise<MilestoneDTO[]> {
    try {
      const milestones = await this.getProjectMilestones(projectId);
      return milestones
        .filter((milestone) => !phaseId || milestone.phase_id === phaseId || (milestone as { phaseId?: string }).phaseId === phaseId)
        .map(m => this.transformToMilestoneDTO(m));
    } catch (error) {
      console.error('MilestoneService.getPhaseMilestones failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get phase milestones');
    }
  }

  async getPhaseMilestonesRaw(phaseId: string): Promise<MilestoneDTO[]> {
    if (!phaseId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
    }
    return this.milestoneRepository.findByPhaseId(phaseId);
  }

  async toggleComplete(id: string): Promise<MilestoneDTO> {
    try {
      const milestone = await this.getMilestoneById(id);
      if (!milestone) throw new AppError(ErrorCode.NOT_FOUND, 'Milestone not found');

      const updated = await this.updateMilestone(id, { 
        status: 'completed' as const, 
        actual_completion_date: new Date().toISOString() 
      });
      
      return this.transformToMilestoneDTO(updated);
    } catch (error) {
      console.error('MilestoneService.toggleComplete failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to toggle milestone completion');
    }
  }

  // ===========================================================================
  // TEMPLATE GENERATION
  // ===========================================================================

  async generateFromReferential(
    projectId: string,
    phaseId: string,
    phaseCode: string,
    phaseStartDate: string
  ): Promise<MilestoneDTO[]> {
    try {
      const templates = await this.getMilestoneTemplatesForPhase(phaseCode);
      
      if (templates.length === 0) {
        return [];
      }

      const startDate = new Date(phaseStartDate);
      const milestones: MilestoneDTO[] = [];

      for (const template of templates) {
        const targetDate = new Date(startDate);
        targetDate.setDate(targetDate.getDate() + template.relativeOffsetDays);

        const milestoneData: CreateMilestoneRequestDto = {
          project_id: projectId,
          phase_id: phaseId,
          title: template.name,
          description: template.description || '',
          target_date: targetDate.toISOString().split('T')[0],
          status: 'pending',
          type: template.type,
          priority: this.transformPriorityFromForm(template.priority),
          weight: template.weight,
          notes: template.approvalRequirements?.join(', '),
          dependencies: template.predecessorIds,
          deliverables: template.deliverables
        };

        const milestone = await this.createMilestone(milestoneData);
        milestones.push(this.transformToMilestoneDTO(milestone));
      }

      return milestones;
    } catch (error) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to generate milestones for phase: ${phaseCode}`);
    }
  }

  private async getMilestoneTemplatesForPhase(phaseCode: string): Promise<MilestoneTemplateDTO[]> {
    try {
      const baseTemplates: MilestoneTemplateDTO[] = [
        {
          id: `template-${phaseCode}-start`,
          name: 'Début de phase',
          description: 'Démarrage officiel de la phase',
          relativeOffsetDays: 0,
          weight: 0.1,
          isCritical: true,
          type: 'event',
          priority: 'high',
          tags: ['start', 'phase'],
          predecessorIds: [],
          deliverables: ['Plan de phase validé'],
          approvalRequirements: ['Validation chef de projet']
        },
        {
          id: `template-${phaseCode}-mid`,
          name: 'Contrôle intermédiaire',
          description: 'Vérification de l\'avancement',
          relativeOffsetDays: 14,
          weight: 0.3,
          isCritical: false,
          type: 'checkpoint',
          priority: 'normal',
          tags: ['review', 'progress'],
          predecessorIds: [`template-${phaseCode}-start`],
          deliverables: ['Rapport d\'avancement'],
          approvalRequirements: []
        },
        {
          id: `template-${phaseCode}-end`,
          name: 'Fin de phase',
          description: 'Clôture et validation de la phase',
          relativeOffsetDays: 28,
          weight: 0.6,
          isCritical: true,
          type: 'gate',
          priority: 'high',
          tags: ['end', 'validation'],
          predecessorIds: [`template-${phaseCode}-mid`],
          deliverables: ['Livraison de phase', 'Rapport final'],
          approvalRequirements: ['Validation client', 'Validation technique']
        }
      ];

      return baseTemplates;
    } catch (error) {
      console.error('Error getting milestone templates:', error);
      return [];
    }
  }

  async deleteTemplateMilestones(phaseId: string): Promise<void> {
    try {
      const milestones = await this.milestoneRepository.findByPhaseId(phaseId);
      await Promise.all(milestones.map(m => this.milestoneRepository.delete(m.id)));
    } catch (error) {
      console.error('MilestoneService.deleteTemplateMilestones failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete template milestones');
    }
  }

  // ===========================================================================
  // ENHANCED CRUD METHODS (RETURNING DTOS)
  // ===========================================================================

  async getProjectMilestonesDTO(projectId: string): Promise<MilestoneDTO[]> {
    try {
      const milestones = await this.getProjectMilestones(projectId);
      return milestones.map(m => this.transformToMilestoneDTO(m));
    } catch (error) {
      console.error('MilestoneService.getProjectMilestonesDTO failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project milestones');
    }
  }

  async getMilestoneByIdDTO(id: string): Promise<MilestoneDTO | null> {
    try {
      const milestone = await this.getMilestoneById(id);
      return milestone ? this.transformToMilestoneDTO(milestone) : null;
    } catch (error) {
      console.error('MilestoneService.getMilestoneByIdDTO failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get milestone by ID');
    }
  }

  async createMilestoneFromForm(projectId: string, data: MilestoneFormDTO): Promise<MilestoneDTO> {
    try {
      const createData = {
        project_id: projectId,
        title: data.title,
        description: data.description,
        target_date: data.targetDate,
        status: 'pending' as const,
        progress: 0,
        priority: this.transformPriorityFromForm(data.priority),
        deliverables: data.deliverables || [],
        dependencies: data.dependencies || []
      };
      
      const milestone = await this.createMilestone(createData);
      return this.transformToMilestoneDTO(milestone);
    } catch (error) {
      console.error('MilestoneService.createMilestoneFromForm failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create milestone');
    }
  }

  async updateMilestoneFromForm(id: string, data: Partial<MilestoneFormDTO>): Promise<MilestoneDTO> {
    try {
      const updateData = {
        title: data.title,
        description: data.description,
        target_date: data.targetDate,
        priority: data.priority ? this.transformPriorityFromForm(data.priority) : undefined,
        deliverables: data.deliverables,
        dependencies: data.dependencies
      };
      
      const milestone = await this.updateMilestone(id, updateData);
      return this.transformToMilestoneDTO(milestone);
    } catch (error) {
      console.error('MilestoneService.updateMilestoneFromForm failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update milestone');
    }
  }
}

// Factory function for singleton instance
let milestoneServiceInstance: MilestoneService | null = null;

export function getMilestoneService(): MilestoneService {
  if (!milestoneServiceInstance) {
    milestoneServiceInstance = new MilestoneService();
  }
  return milestoneServiceInstance;
}