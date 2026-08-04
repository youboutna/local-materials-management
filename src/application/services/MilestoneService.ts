/**
 * Milestone Service - Hexagonal Architecture
 * Business logic for milestone management operations
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

export class MilestoneService {
  constructor(
    private milestoneRepository: IMilestoneRepository = RepositoryFactory.getMilestoneRepository(),
    private projectRepository: IProjectRepository = RepositoryFactory.getProjectRepository(),
    private phaseRepository: IPhaseRepository = RepositoryFactory.getPhaseRepository(),
    private materialRepository: IMaterialRepository = RepositoryFactory.getMaterialRepository(),
    private inspectionRepository: IInspectionRepository = RepositoryFactory.getInspectionRepository(),
    private documentRepository: IDocumentRepository = RepositoryFactory.getDocumentRepository()
  ) {}

  private toServiceMilestone(milestone: MilestoneDTO): Milestone {
    return {
      id: milestone.id,
      project_id: milestone.projectId,
      phase_id: milestone.phaseId,
      title: milestone.title,
      description: milestone.description,
      target_date: milestone.targetDate,
      actual_completion_date: milestone.completionDate,
      status: milestone.status,
      progress: 0,
      priority: milestone.priority === 'normal' ? 'medium' : milestone.priority,
      deliverables: milestone.deliverables || [],
      dependencies: milestone.dependencies || [],
      assigned_to: milestone.assignedTo?.userId,
      created_at: milestone.createdAt,
      updated_at: milestone.updatedAt
      ,type: milestone.type
      ,weight: milestone.weight
      ,notes: milestone.notes
      ,stage_type: milestone.stageType
      ,material_usage: milestone.materialUsage
      ,material_cost_estimate: milestone.materialCostEstimate
      ,actual_material_cost: milestone.actualMaterialCost
    };
  }

  /**
   * Get project milestones
   */
  async getProjectMilestones(projectId: string): Promise<Milestone[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // Get milestones from repository
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
   * Calculate milestone status based on dates, progress, and dependencies
   */
  private calculateMilestoneStatus(milestoneData: {
    target_date: string;
    actual_completion_date?: string;
    status: string;
    progress?: number;
  }): 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled' {
    const today = new Date();
    const targetDate = new Date(milestoneData.target_date);
    const progress = milestoneData.progress || 0;

    // If explicitly cancelled
    if (milestoneData.status === 'cancelled') return 'cancelled';
    
    // If completed
    if (milestoneData.actual_completion_date || progress >= 100) return 'completed';
    
    // If overdue
    if (today > targetDate && progress < 100) return 'delayed';
    
    // If in progress (progress > 0)
    if (progress > 0) return 'in_progress';
    
    // Otherwise pending
    return 'pending';
  }

  /**
   * Calculate milestone progress based on deliverables, inspections, and materials
   */
  private async calculateMilestoneProgress(milestoneId: string): Promise<number> {
    try {
      // Get deliverables completion
      const deliverablesProgress = await this.getDeliverablesProgress(milestoneId);
      
      // Get inspections completion
      const inspectionsProgress = await this.getInspectionsProgress(milestoneId);
      
      // Get materials usage
      const materialsProgress = await this.getMaterialsProgress(milestoneId);
      
      // Weighted calculation: 40% deliverables, 30% inspections, 30% materials
      const totalProgress = (deliverablesProgress * 0.4) + (inspectionsProgress * 0.3) + (materialsProgress * 0.3);
      
      return Math.round(totalProgress);
    } catch (error) {
      console.error('MilestoneService.calculateMilestoneProgress failed:', error);
      return 0;
    }
  }

  /**
   * Get deliverables completion percentage for milestone
   */
  private async getDeliverablesProgress(milestoneId: string): Promise<number> {
    try {
      // TODO: Implement proper deliverable tracking when repository supports it
      // For now, return default progress as deliverables are not linked to milestones
       // // console.log(`Deliverables progress for milestone ${milestoneId}: Not implemented, returning 0`);
      return 0;
    } catch (error) {
      console.error('MilestoneService.getDeliverablesProgress failed:', error);
      return 0;
    }
  }

  /**
   * Get inspections completion percentage for milestone
   */
  private async getInspectionsProgress(milestoneId: string): Promise<number> {
    try {
      // TODO: Implement proper inspection tracking when repository supports it
      // For now, return default progress as inspections are not linked to milestones
       // // console.log(`Inspections progress for milestone ${milestoneId}: Not implemented, returning 0`);
      return 0;
    } catch (error) {
      console.error('MilestoneService.getInspectionsProgress failed:', error);
      return 0;
    }
  }

  /**
   * Get materials usage percentage for milestone
   */
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

  // ============= COMPREHENSIVE PROJECT MANAGEMENT METHODS =============

  /**
   * Get milestone with bank guarantee requirements
   */
  async getMilestoneWithBankGuarantee(milestoneId: string): Promise<{
    milestone: Milestone;
    bankGuaranteeRequired: boolean;
    guaranteeAmount?: number;
    guaranteeType?: string;
    guaranteeStatus?: string;
  }> {
    try {
      const milestone = await this.getMilestoneById(milestoneId);
      
      if (!milestone) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Milestone not found');
      }

      // Get project details to determine guarantee requirements
      const project = await (this.projectRepository as unknown as { 
        findById: (id: string) => Promise<unknown> 
      }).findById(milestone.project_id);

      const projectData = project as {
        contract_value?: number;
        guarantee_required?: boolean;
        guarantee_percentage?: number;
        guarantee_type?: string;
      };

      const bankGuaranteeRequired = projectData.guarantee_required || false;
      const guaranteeAmount = bankGuaranteeRequired && projectData.contract_value && projectData.guarantee_percentage
        ? projectData.contract_value * projectData.guarantee_percentage
        : undefined;

      // Get actual guarantee status if required
      let guaranteeStatus;
      if (bankGuaranteeRequired) {
        const guarantees = await (this.milestoneRepository as unknown as { 
          getBankGuaranteesByMilestone: (id: string) => Promise<unknown[]> 
        }).getBankGuaranteesByMilestone(milestoneId);
        
        guaranteeStatus = guarantees && guarantees.length > 0 
          ? (guarantees[0] as { status: string }).status 
          : 'not_submitted';
      }

      return {
        milestone,
        bankGuaranteeRequired,
        guaranteeAmount,
        guaranteeType: projectData.guarantee_type,
        guaranteeStatus
      };
    } catch (error) {
      console.error('MilestoneService.getMilestoneWithBankGuarantee failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get milestone with bank guarantee');
    }
  }

  /**
   * Get milestone with insurance requirements
   */
  async getMilestoneWithInsurance(milestoneId: string): Promise<{
    milestone: Milestone;
    insuranceRequired: boolean;
    insuranceTypes: string[];
    insuranceStatus?: Record<string, string>;
    coverageAmount?: number;
  }> {
    try {
      const milestone = await this.getMilestoneById(milestoneId);
      
      if (!milestone) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Milestone not found');
      }

      // Get project insurance requirements
      const project = await (this.projectRepository as unknown as { 
        findById: (id: string) => Promise<unknown> 
      }).findById(milestone.project_id);

      const projectData = project as {
        insurance_required?: boolean;
        insurance_types?: string[];
        insurance_coverage?: number;
      };

      const insuranceRequired = projectData.insurance_required || false;
      const insuranceTypes = projectData.insurance_types || [];
      const coverageAmount = projectData.insurance_coverage;

      // Get actual insurance status
      let insuranceStatus;
      if (insuranceRequired && insuranceTypes.length > 0) {
        const insurances = await (this.milestoneRepository as unknown as { 
          getInsurancesByMilestone: (id: string) => Promise<unknown[]> 
        }).getInsurancesByMilestone(milestoneId);
        
        insuranceStatus = {};
        insuranceTypes.forEach(type => {
          const insurance = insurances?.find((i: unknown) => 
            (i as { type: string }).type === type
          );
          insuranceStatus[type] = insurance ? (insurance as { status: string }).status : 'not_submitted';
        });
      }

      return {
        milestone,
        insuranceRequired,
        insuranceTypes,
        insuranceStatus,
        coverageAmount
      };
    } catch (error) {
      console.error('MilestoneService.getMilestoneWithInsurance failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get milestone with insurance');
    }
  }

  /**
   * Get milestone with geolocation data
   */
  async getMilestoneWithGeolocation(milestoneId: string): Promise<{
    milestone: Milestone;
    location?: {
      latitude: number;
      longitude: number;
      address: string;
      site_name: string;
    };
    nearbyResources: Array<{
      type: string;
      name: string;
      distance: number;
      availability: string;
    }>;
    weatherConditions?: {
      temperature: number;
      humidity: number;
      wind_speed: number;
      forecast: string;
    };
  }> {
    try {
      const milestone = await this.getMilestoneById(milestoneId);
      
      if (!milestone) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Milestone not found');
      }

      // Get milestone location
      const location = await (this.milestoneRepository as unknown as { 
        getMilestoneLocation: (id: string) => Promise<unknown> 
      }).getMilestoneLocation(milestoneId);

      const locationData = location as {
        latitude?: number;
        longitude?: number;
        address?: string;
        site_name?: string;
      };

      // Get nearby resources (materials, equipment, personnel)
      const nearbyResources = await this.getNearbyResources(
        locationData.latitude || 0,
        locationData.longitude || 0,
        milestone.project_id
      );

      // Get weather conditions for outdoor milestones
      let weatherConditions;
      if (locationData && this.isOutdoorMilestone(milestone)) {
        weatherConditions = await this.getWeatherConditions(
          locationData.latitude || 0,
          locationData.longitude || 0
        );
      }

      return {
        milestone,
        location: locationData.latitude && locationData.longitude ? {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address: locationData.address || 'Unknown address',
          site_name: locationData.site_name || 'Site'
        } : undefined,
        nearbyResources,
        weatherConditions
      };
    } catch (error) {
      console.error('MilestoneService.getMilestoneWithGeolocation failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get milestone with geolocation');
    }
  }

  /**
   * Get milestone with tender management data
   */
  async getMilestoneWithTenderData(milestoneId: string): Promise<{
    milestone: Milestone;
    relatedTenders: Array<{
      id: string;
      title: string;
      status: string;
      amount: number;
      supplier: string;
      submission_date: string;
      evaluation_score?: number;
    }>;
    materialRequirements: Array<{
      material_id: string;
      name: string;
      quantity: number;
      unit: string;
      unit_cost: number;
      total_cost: number;
      availability_status: string;
      delivery_date?: string;
    }>;
    budgetUtilization: {
      allocated_budget: number;
      spent_amount: number;
      remaining_budget: number;
      utilization_percentage: number;
    };
  }> {
    try {
      const milestone = await this.getMilestoneById(milestoneId);
      
      if (!milestone) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Milestone not found');
      }

      // Get related tenders
      const tenders = await (this.milestoneRepository as unknown as { 
        getTendersByMilestone: (id: string) => Promise<unknown[]> 
      }).getTendersByMilestone(milestoneId);

      const relatedTenders = (tenders || []).map((tender: unknown) => ({
        id: (tender as { id: string }).id,
        title: (tender as { title: string }).title,
        status: (tender as { status: string }).status,
        amount: (tender as { amount: number }).amount || 0,
        supplier: (tender as { supplier: string }).supplier || 'Unknown',
        submission_date: (tender as { submission_date: string }).submission_date,
        evaluation_score: (tender as { evaluation_score?: number }).evaluation_score
      }));

      // Get material requirements
      const materials = await (this.materialRepository as unknown as { 
        getByMilestone: (id: string) => Promise<unknown[]> 
      }).getByMilestone(milestoneId);

      const materialRequirements = (materials || []).map((material: unknown) => ({
        material_id: (material as { id: string }).id,
        name: (material as { name: string }).name,
        quantity: (material as { quantity: number }).quantity || 0,
        unit: (material as { unit: string }).unit || 'unit',
        unit_cost: (material as { unit_cost: number }).unit_cost || 0,
        total_cost: ((material as { quantity: number }).quantity || 0) * ((material as { unit_cost: number }).unit_cost || 0),
        availability_status: (material as { availability_status: string }).availability_status || 'unknown',
        delivery_date: (material as { delivery_date?: string }).delivery_date
      }));

      // Calculate budget utilization
      const allocatedBudget = milestone.budget || 0;
      const spentAmount = materialRequirements.reduce((total, mat) => total + mat.total_cost, 0);
      const remainingBudget = allocatedBudget - spentAmount;
      const utilizationPercentage = allocatedBudget > 0 ? (spentAmount / allocatedBudget) * 100 : 0;

      return {
        milestone,
        relatedTenders,
        materialRequirements,
        budgetUtilization: {
          allocated_budget: allocatedBudget,
          spent_amount: spentAmount,
          remaining_budget: remainingBudget,
          utilization_percentage: Math.round(utilizationPercentage)
        }
      };
    } catch (error) {
      console.error('MilestoneService.getMilestoneWithTenderData failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get milestone with tender data');
    }
  }

  // ============= HELPER METHODS FOR COMPREHENSIVE MANAGEMENT =============

  /**
   * Get nearby resources based on geolocation
   */
  private async getNearbyResources(
    latitude: number, 
    longitude: number, 
    projectId: string
  ): Promise<Array<{ type: string; name: string; distance: number; availability: string }>> {
    try {
      // Get nearby materials
      const materials = await (this.materialRepository as unknown as { 
        getNearbyMaterials: (lat: number, lng: number, projectId: string) => Promise<unknown[]> 
      }).getNearbyMaterials(latitude, longitude, projectId);

      // Get nearby personnel
      const personnel = await (this.projectRepository as unknown as { 
        getNearbyPersonnel: (lat: number, lng: number, projectId: string) => Promise<unknown[]> 
      }).getNearbyPersonnel(latitude, longitude, projectId);

      // Get nearby equipment
      const equipment = await (this.projectRepository as unknown as { 
        getNearbyEquipment: (lat: number, lng: number, projectId: string) => Promise<unknown[]> 
      }).getNearbyEquipment(latitude, longitude, projectId);

      const allResources = [
        ...(materials || []).map((m: unknown) => ({
          type: 'material',
          name: (m as { name: string }).name,
          distance: (m as { distance: number }).distance || 0,
          availability: (m as { availability: string }).availability || 'unknown'
        })),
        ...(personnel || []).map((p: unknown) => ({
          type: 'personnel',
          name: (p as { name: string }).name,
          distance: (p as { distance: number }).distance || 0,
          availability: (p as { availability: string }).availability || 'unknown'
        })),
        ...(equipment || []).map((e: unknown) => ({
          type: 'equipment',
          name: (e as { name: string }).name,
          distance: (e as { distance: number }).distance || 0,
          availability: (e as { availability: string }).availability || 'unknown'
        }))
      ];

      // Sort by distance and return nearest 10
      return allResources
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10);
    } catch (error) {
      console.error('MilestoneService.getNearbyResources failed:', error);
      return [];
    }
  }

  /**
   * Check if milestone is outdoor work
   */
  private isOutdoorMilestone(milestone: Milestone): boolean {
    const outdoorKeywords = ['excavation', 'foundation', 'roofing', 'landscaping', 'external', 'outdoor'];
    const title = milestone.title.toLowerCase();
    const description = (milestone.description || '').toLowerCase();
    
    return outdoorKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
  }

  /**
   * Get weather conditions for location
   */
  private async getWeatherConditions(
    latitude: number, 
    longitude: number
  ): Promise<{
    temperature: number;
    humidity: number;
    wind_speed: number;
    forecast: string;
  }> {
    try {
      const weather = await (this.projectRepository as unknown as { 
        getWeatherConditions: (lat: number, lng: number) => Promise<unknown> 
      }).getWeatherConditions(latitude, longitude);

      const weatherData = weather as {
        temperature?: number;
        humidity?: number;
        wind_speed?: number;
        forecast?: string;
      };

      return {
        temperature: weatherData.temperature || 20,
        humidity: weatherData.humidity || 50,
        wind_speed: weatherData.wind_speed || 0,
        forecast: weatherData.forecast || 'clear'
      };
    } catch (error) {
      console.error('MilestoneService.getWeatherConditions failed:', error);
      return {
        temperature: 20,
        humidity: 50,
        wind_speed: 0,
        forecast: 'unknown'
      };
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

      // Create milestone entity from request
      const milestoneData: CreateMilestoneData = {
        project_id: request.project_id,
        phase_id: request.phase_id,
        title: request.title,
        description: request.description,
        target_date: request.target_date,
        status: request.status || 'pending',
        priority: request.priority === 'medium' ? 'normal' : request.priority,
        type: request.type,
        stage_type: request.stage_type,
        weight: request.weight,
        dependencies: request.dependencies || [],
        notes: request.notes
        ,material_usage: request.material_usage
        ,material_cost_estimate: request.material_cost_estimate
        ,actual_material_cost: request.actual_material_cost
      };

      // Save through repository
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

      // Get existing milestone first
      const existingMilestone = await (this.milestoneRepository as unknown as { findById: (id: string) => Promise<unknown> }).findById(id);
      
      if (!existingMilestone) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Milestone not found');
      }

      // Prepare update data
      const updateData: UpdateMilestoneData = {
        title: updates.title,
        description: updates.description,
        target_date: updates.target_date,
        completion_date: updates.actual_completion_date,
        status: updates.status,
        priority: updates.priority === 'medium' ? 'normal' : updates.priority,
        type: updates.type,
        stage_type: updates.stage_type,
        weight: updates.weight,
        dependencies: updates.dependencies,
        notes: updates.notes
        ,material_usage: updates.material_usage
        ,material_cost_estimate: updates.material_cost_estimate
        ,actual_material_cost: updates.actual_material_cost
      };

      // Update through repository
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

      // Check if milestone exists
      const existingMilestone = await (this.milestoneRepository as unknown as { findById: (id: string) => Promise<unknown> }).findById(id);
      
      if (!existingMilestone) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Milestone not found');
      }

      // Delete through repository
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

      // Get milestone from repository
      const milestone = await (this.milestoneRepository as unknown as { findById: (id: string) => Promise<unknown> }).findById(id);
      
      if (!milestone) {
        return null;
      }

      // Transform to Milestone interface
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
        on_time_completion_rate: completionRate, // Simplified calculation
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

  // ============= PM METRICS (EVM, SPI, CPI) =============

  /**
   * Get milestone progress with PM metrics
   */
  async getMilestoneProgressWithMetrics(projectId: string, phaseId?: string): Promise<MilestoneProgressDTO> {
    try {
      const milestones = await this.getProjectMilestones(projectId);
      const milestoneDTOs = milestones.map(m => this.transformToMilestoneDTO(m));
      
      const today = new Date();
      const completed = milestoneDTOs.filter(m => m.status === 'completed');
      const pending = milestoneDTOs.filter(m => m.status === 'pending');
      const delayed = milestoneDTOs.filter(m => m.status === 'delayed');
      
      // Simplified implementation - would need more sophisticated logic for real metrics
      const totalWeight = milestoneDTOs.reduce((sum, m) => sum + (m.weight || 0.1), 0);
      const completedWeight = completed.reduce((sum, m) => sum + (m.weight || 0.1), 0);
      
      // Get upcoming and overdue milestones
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
        schedulePerformance_index: 1.0,
        criticalPath_status: delayed.length > 0 ? 'at_risk' : 'on_track',
        criticalPathFloat_days: 0,
        next_milestone: nextMilestone,
        overdueMilestones: overdueMilestones,
        upcomingMilestones: upcomingMilestones
      };
    } catch (error) {
      console.error('MilestoneService.getMilestoneProgressWithMetrics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get milestone progress metrics');
    }
  }

  // ============= CRITICAL PATH ANALYSIS =============

  /**
   * Get critical path analysis
   */
  async getCriticalPath(projectId: string): Promise<CriticalPathDTO> {
    try {
      const milestones = await this.getProjectMilestones(projectId);
      const milestoneDTOs = milestones.map(m => this.transformToMilestoneDTO(m));
      
      // Simplified critical path analysis
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

  // ============= SUMMARY REPORTS =============

  /**
   * Get project summary
   */
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

  // ============= ADDITIONAL METHODS FROM UNIFIED SERVICE =============

  /**
   * Get phase milestones (filtered by phase)
   */
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

  /**
   * Toggle milestone completion
   */
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

  // ============= TEMPLATE GENERATION =============

  /**
   * Generate milestones from referential template
   */
  async generateFromReferential(
    projectId: string,
    phaseId: string,
    phaseCode: string,
    phaseStartDate: string
  ): Promise<MilestoneDTO[]> {
    try {
      // Get milestone templates for the phase
      const templates = await this.getMilestoneTemplatesForPhase(phaseCode);
      
      if (templates.length === 0) {
        return [];
      }

      const startDate = new Date(phaseStartDate);
      const milestones: MilestoneDTO[] = [];

      for (const template of templates) {
        const targetDate = new Date(startDate);
        targetDate.setDate(targetDate.getDate() + template.relative_offset_days);

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
          notes: template.approval_requirements?.join(', '),
          dependencies: template.predecessor_ids,
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

  /**
   * Get milestone templates for a phase
   */
  private async getMilestoneTemplatesForPhase(phaseCode: string): Promise<MilestoneTemplateDTO[]> {
    try {
      // For now, return basic templates - this would be enhanced with actual template logic
      const baseTemplates: MilestoneTemplateDTO[] = [
        {
          id: `template-${phaseCode}-start`,
          name: 'Début de phase',
          description: 'Démarrage officiel de la phase',
          relative_offset_days: 0,
          weight: 0.1,
          is_critical: true,
          type: 'event',
          priority: 'high',
          tags: ['start', 'phase'],
          predecessor_ids: [],
          deliverables: ['Plan de phase validé'],
          approval_requirements: ['Validation chef de projet']
        },
        {
          id: `template-${phaseCode}-mid`,
          name: 'Contrôle intermédiaire',
          description: 'Vérification de l\'avancement',
          relative_offset_days: 14,
          weight: 0.3,
          is_critical: false,
          type: 'checkpoint',
          priority: 'normal',
          tags: ['review', 'progress'],
          predecessor_ids: [`template-${phaseCode}-start`],
          deliverables: ['Rapport d\'avancement'],
          approval_requirements: []
        },
        {
          id: `template-${phaseCode}-end`,
          name: 'Fin de phase',
          description: 'Clôture et validation de la phase',
          relative_offset_days: 28,
          weight: 0.6,
          is_critical: true,
          type: 'gate',
          priority: 'high',
          tags: ['end', 'validation'],
          predecessor_ids: [`template-${phaseCode}-mid`],
          deliverables: ['Livraison de phase', 'Rapport final'],
          approval_requirements: ['Validation client', 'Validation technique']
        }
      ];

      return baseTemplates;
    } catch (error) {
      console.error('Error getting milestone templates:', error);
      return [];
    }
  }

  /**
   * Delete template milestones
   */
  async deleteTemplateMilestones(phaseId: string): Promise<void> {
    try {
      // Get all milestones for this phase and delete them
      console.log(`Template milestones deletion for phase ${phaseId} - not fully implemented`);
      // TODO: Implement actual deletion logic
    } catch (error) {
      console.error('MilestoneService.deleteTemplateMilestones failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete template milestones');
    }
  }

  // ============= ENHANCED CRUD METHODS (RETURNING DTOS) =============

  /**
   * Get project milestones (returns DTOs)
   */
  async getProjectMilestonesDTO(projectId: string): Promise<MilestoneDTO[]> {
    try {
      const milestones = await this.getProjectMilestones(projectId);
      return milestones.map(m => this.transformToMilestoneDTO(m));
    } catch (error) {
      console.error('MilestoneService.getProjectMilestonesDTO failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project milestones');
    }
  }

  /**
   * Get milestone by ID (returns DTO)
   */
  async getMilestoneByIdDTO(id: string): Promise<MilestoneDTO | null> {
    try {
      const milestone = await this.getMilestoneById(id);
      return milestone ? this.transformToMilestoneDTO(milestone) : null;
    } catch (error) {
      console.error('MilestoneService.getMilestoneByIdDTO failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get milestone by ID');
    }
  }

  /**
   * Create milestone (accepts MilestoneFormDTO, returns DTO)
   */
  async createMilestoneFromForm(projectId: string, data: MilestoneFormDTO): Promise<MilestoneDTO> {
    try {
      // Convert MilestoneFormDTO to CreateMilestoneRequestDto
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

  /**
   * Update milestone (accepts Partial<MilestoneFormDTO>, returns DTO)
   */
  async updateMilestoneFromForm(id: string, data: Partial<MilestoneFormDTO>): Promise<MilestoneDTO> {
    try {
      // Convert MilestoneFormDTO to UpdateMilestoneRequestDto
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

  // ============= TRANSFORMATION METHODS =============

  /**
   * Transform Milestone to MilestoneDTO (for UI consumption)
   */
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

  /**
   * Transform priority from Milestone to MilestoneDTO
   */
  private transformPriority(priority: 'low' | 'medium' | 'high' | 'critical'): MilestonePriority {
    switch (priority) {
      case 'critical': return 'critical' as MilestonePriority;
      case 'high': return 'high' as MilestonePriority;
      case 'medium': return 'normal' as MilestonePriority;
      case 'low': return 'low' as MilestonePriority;
      default: return 'normal' as MilestonePriority;
    }
  }

  /**
   * Transform priority from MilestoneFormDTO to Milestone
   */
  private transformPriorityFromForm(priority: MilestonePriority): 'low' | 'medium' | 'high' | 'critical' {
    switch (priority) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'normal': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }
}

// Factory function for singleton instance (replacing UnifiedMilestoneService)
let milestoneServiceInstance: MilestoneService | null = null;

export function getMilestoneService(): MilestoneService {
  if (!milestoneServiceInstance) {
    milestoneServiceInstance = new MilestoneService();
  }
  return milestoneServiceInstance;
}
