/**
 * Milestone Service - Hexagonal Architecture
 * Business logic for milestone management operations
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IMilestoneRepository } from '@/domain/repositories/IMilestoneRepository';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import { IMaterialRepository } from '@/domain/repositories/IMaterialRepository';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface Milestone {
  id: string;
  project_id: string;
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
  created_at: string;
  updated_at: string;
}

// Service DTOs for data exchange
export interface CreateMilestoneRequestDto {
  project_id: string;
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
    private milestoneRepository: IMilestoneRepository = RepositoryFactory.getPhaseRepository() as unknown as IMilestoneRepository,
    private projectRepository: IProjectRepository = RepositoryFactory.getProjectRepository(),
    private phaseRepository: IPhaseRepository = RepositoryFactory.getPhaseRepository(),
    private materialRepository: IMaterialRepository = RepositoryFactory.getMaterialRepository(),
    private inspectionRepository: IInspectionRepository = RepositoryFactory.getInspectionRepository(),
    private documentRepository: IDocumentRepository = RepositoryFactory.getDocumentRepository()
  ) {}
  /**
   * Get project milestones
   */
  async getProjectMilestones(projectId: string): Promise<Milestone[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // Get milestones from repository
      const milestones = await (this.milestoneRepository as unknown as { findByProjectId: (id: string) => Promise<unknown[]> }).findByProjectId(projectId);
      
      if (!milestones || milestones.length === 0) {
        return [];
      }

      // Transform to Milestone interface with business logic
      const milestonesWithProgress = await Promise.all(
        milestones.map(async (milestone: unknown) => {
          const milestoneData = milestone as {
            id: string;
            project_id: string;
            title: string;
            description?: string;
            target_date: string;
            actual_completion_date?: string;
            status: string;
            progress?: number;
            priority?: string;
            deliverables?: string[];
            dependencies?: string[];
            assigned_to?: string;
            budget?: number;
            actual_cost?: number;
            created_at: string;
            updated_at: string;
          };

          // Apply business logic for status determination
          const calculatedStatus = this.calculateMilestoneStatus(milestoneData);
          
          // Calculate progress based on deliverables and inspections
          const calculatedProgress = await this.calculateMilestoneProgress(milestoneData.id);

          return {
            id: milestoneData.id,
            project_id: milestoneData.project_id,
            title: milestoneData.title,
            description: milestoneData.description,
            target_date: milestoneData.target_date,
            actual_completion_date: milestoneData.actual_completion_date,
            status: calculatedStatus,
            progress: calculatedProgress,
            priority: (milestoneData.priority as 'low' | 'medium' | 'high' | 'critical') || 'medium',
            deliverables: milestoneData.deliverables || [],
            dependencies: milestoneData.dependencies || [],
            assigned_to: milestoneData.assigned_to,
            budget: milestoneData.budget,
            actual_cost: milestoneData.actual_cost,
            created_at: milestoneData.created_at,
            updated_at: milestoneData.updated_at
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
      const deliverables = await (this.documentRepository as unknown as { 
        getDeliverablesByMilestone: (id: string) => Promise<unknown[]> 
      }).getDeliverablesByMilestone(milestoneId);
      
      if (!deliverables || deliverables.length === 0) return 0;
      
      const completedDeliverables = deliverables.filter((d: unknown) => 
        (d as { status: string }).status === 'completed'
      );
      
      return (completedDeliverables.length / deliverables.length) * 100;
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
      const inspections = await (this.inspectionRepository as unknown as { 
        getByMilestone: (id: string) => Promise<unknown[]> 
      }).getByMilestone(milestoneId);
      
      if (!inspections || inspections.length === 0) return 0;
      
      const completedInspections = inspections.filter((i: unknown) => 
        (i as { status: string }).status === 'approved'
      );
      
      return (completedInspections.length / inspections.length) * 100;
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
      const materials = await (this.materialRepository as unknown as { 
        getByMilestone: (id: string) => Promise<unknown[]> 
      }).getByMilestone(milestoneId);
      
      if (!materials || materials.length === 0) return 0;
      
      const usedMaterials = materials.filter((m: unknown) => 
        (m as { status: string }).status === 'delivered'
      );
      
      return (usedMaterials.length / materials.length) * 100;
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
      const milestoneData = {
        project_id: request.project_id,
        title: request.title,
        description: request.description,
        target_date: request.target_date,
        actual_completion_date: undefined,
        status: request.status || 'pending',
        progress: request.progress || 0,
        priority: request.priority || 'medium',
        deliverables: request.deliverables || [],
        dependencies: request.dependencies || [],
        assigned_to: request.assigned_to,
        budget: request.budget,
        actual_cost: request.actual_cost
      };

      // Save through repository
      const createdMilestone = await (this.milestoneRepository as unknown as { create: (data: unknown) => Promise<Milestone> }).create(milestoneData);
      
      if (!createdMilestone) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create milestone');
      }

      // Add missing fields to return proper Milestone type
      const milestone: Milestone = {
        id: createdMilestone.id || crypto.randomUUID(),
        project_id: createdMilestone.project_id || request.project_id,
        title: createdMilestone.title || request.title,
        description: createdMilestone.description || request.description,
        target_date: createdMilestone.target_date || request.target_date,
        actual_completion_date: createdMilestone.actual_completion_date,
        status: createdMilestone.status || request.status || 'pending',
        progress: createdMilestone.progress || request.progress || 0,
        priority: createdMilestone.priority || request.priority || 'medium',
        deliverables: createdMilestone.deliverables || request.deliverables || [],
        dependencies: createdMilestone.dependencies || request.dependencies || [],
        assigned_to: createdMilestone.assigned_to || request.assigned_to,
        budget: createdMilestone.budget || request.budget,
        actual_cost: createdMilestone.actual_cost || request.actual_cost,
        created_at: createdMilestone.created_at || new Date().toISOString(),
        updated_at: createdMilestone.updated_at || new Date().toISOString()
      };

      return milestone;
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
      const updateData = {
        title: updates.title,
        description: updates.description,
        target_date: updates.target_date,
        actual_completion_date: updates.actual_completion_date,
        status: updates.status,
        progress: updates.progress,
        priority: updates.priority,
        deliverables: updates.deliverables,
        dependencies: updates.dependencies,
        assigned_to: updates.assigned_to,
        budget: updates.budget,
        actual_cost: updates.actual_cost,
        updated_at: new Date().toISOString()
      };

      // Update through repository
      await (this.milestoneRepository as unknown as { update: (id: string, data: unknown) => Promise<void> }).update(id, updateData);
      
      // Get updated milestone
      const updatedMilestone = await (this.milestoneRepository as unknown as { findById: (id: string) => Promise<unknown> }).findById(id);
      
      if (!updatedMilestone) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to retrieve updated milestone');
      }

      // Transform to Milestone interface
      return {
        id: (updatedMilestone as { id: string }).id,
        project_id: (updatedMilestone as { project_id: string }).project_id,
        title: (updatedMilestone as { title: string }).title,
        description: (updatedMilestone as { description?: string }).description,
        target_date: (updatedMilestone as { target_date: string }).target_date,
        actual_completion_date: (updatedMilestone as { actual_completion_date?: string }).actual_completion_date,
        status: (updatedMilestone as { status: string }).status as 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled',
        progress: (updatedMilestone as { progress: number }).progress || 0,
        priority: (updatedMilestone as { priority: string }).priority as 'low' | 'medium' | 'high' | 'critical',
        deliverables: (updatedMilestone as { deliverables: string[] }).deliverables || [],
        dependencies: (updatedMilestone as { dependencies: string[] }).dependencies || [],
        assigned_to: (updatedMilestone as { assigned_to?: string }).assigned_to,
        budget: (updatedMilestone as { budget?: number }).budget,
        actual_cost: (updatedMilestone as { actual_cost?: number }).actual_cost,
        created_at: (updatedMilestone as { created_at: string }).created_at,
        updated_at: (updatedMilestone as { updated_at: string }).updated_at
      };
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
}
