/**
 * Project Domain Transformer with BTP Calculations and Business Logic
 * Implements hexagonal architecture principles with enriched calculations
 */

import { Project } from '@/domain/entities/Project';
import { ProjectDTO, ProjectDetailDTO, ProjectSummaryDTO, ProjectListItemDTO, CreateProjectRequestDto, UpdateProjectRequestDto } from '@/dtos/transforms/shared';
import { ProjectStatus } from '@/types/project';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';

export class ProjectDomainTransformer implements EntityToDTOMapper<Project, ProjectDTO> {
  /**
   * Calculate project health based on progress, budget, and timeline
   */
  static calculateProjectHealth(project: Project): 'healthy' | 'warning' | 'critical' {
    const progress = project.progress || 0;
    const budget = project.budget || 0;
    const endDate = project.endDate;
    const now = new Date();
    
    // Calculate timeline health
    let timelineHealth: 'healthy';
    if (endDate && new Date(endDate) < now) {
      timelineHealth = 'critical';
    } else if (endDate && new Date(endDate).getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
      timelineHealth = 'warning';
    }
    
    // Calculate budget health
    let budgetHealth: 'healthy';
    if (budget > 0) {
      const spent = (progress / 100) * budget;
      const budgetVariance = Math.abs(spent - (budget * 0.8)); // 80% of budget
      if (budgetVariance > budget * 0.2) {
        budgetHealth = 'critical';
      } else if (budgetVariance > budget * 0.1) {
        budgetHealth = 'warning';
      }
    }
    
    // Calculate overall health
    if (timelineHealth === 'critical' || budgetHealth === 'critical') {
      return 'critical';
    } else if (timelineHealth === 'warning' || budgetHealth === 'warning') {
      return 'warning';
    }
    return 'healthy';
  }

  /**
   * Calculate project progress metrics
   */
  static calculateProgressMetrics(project: Project): {
    estimatedCompletionDate: Date;
    progressRate: number;
    efficiency: number;
  } {
    const progress = project.progress || 0;
    const startDate = project.startDate;
    const endDate = project.endDate;
    const now = new Date();
    
    // Calculate progress rate
    const elapsedDays = startDate ? Math.floor((now.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const totalDays = endDate && startDate ? Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    // Calculate efficiency based on progress vs elapsed time
    const expectedProgress = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;
    const efficiency = expectedProgress > 0 ? (progress / expectedProgress) : 1;
    
    // Calculate estimated completion date
    let estimatedCompletionDate: Date;
    if (progress > 0 && progress < 100) {
      const remainingProgress = 100 - progress;
      const avgDailyProgress = expectedProgress / totalDays;
      const remainingDays = Math.ceil(remainingProgress / avgDailyProgress);
      estimatedCompletionDate = new Date(now.getTime() + (remainingDays * 1000 * 60 * 60 * 24));
    } else {
      estimatedCompletionDate = endDate || now;
    }
    
    return {
      estimatedCompletionDate,
      progressRate: progress,
      efficiency
    };
  }

  /**
   * Calculate EVM (Earned Value Management) metrics
   */
  static calculateEVMMetrics(project: Project): {
    plannedValue: number;
    earnedValue: number;
    scheduleVariance: number;
    costVariance: number;
    schedulePerformanceIndex: number;
    costPerformanceIndex: number;
  } {
    const progress = project.progress || 0;
    const budget = project.budget || 0;
    
    // Calculate planned value (PV)
    const plannedValue = (progress / 100) * budget;
    
    // Calculate earned value (EV)
    const earnedValue = plannedValue; // Simplified - should be based on actual work completed
    
    // Calculate schedule variance (SV = PV - EV)
    const scheduleVariance = plannedValue - earnedValue;
    
    // Calculate cost variance (CV = AC - EV)
    const actualCost = (progress / 100) * budget; // Simplified actual cost
    const costVariance = actualCost - earnedValue;
    
    // Calculate performance indices
    const schedulePerformanceIndex = plannedValue > 0 ? (earnedValue / plannedValue) : 0;
    const costPerformanceIndex = earnedValue > 0 ? (earnedValue / actualCost) : 0;
    
    return {
      plannedValue,
      earnedValue,
      scheduleVariance,
      costVariance,
      schedulePerformanceIndex,
      costPerformanceIndex
    };
  }

  /**
   * Calculate risk assessment based on project metrics
   */
  static calculateRiskAssessment(project: Project): {
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    recommendations: string[];
  } {
    const health = this.calculateProjectHealth(project);
    const metrics = this.calculateProgressMetrics(project);
    const evm = this.calculateEVMMetrics(project);
    
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    
    // Assess risk factors
    if (health === 'critical') {
      riskFactors.push('Timeline overrun detected');
      riskFactors.push('Budget variance critical');
      recommendations.push('Immediate intervention required');
    }
    
    if (evm.schedulePerformanceIndex < 0.8) {
      riskFactors.push('Poor schedule performance');
      recommendations.push('Review project timeline');
    }
    
    if (evm.costPerformanceIndex < 0.9) {
      riskFactors.push('Cost overruns detected');
      recommendations.push('Implement cost controls');
    }
    
    // Determine overall risk level
    let riskLevel: 'low';
    if (riskFactors.length > 2) {
      riskLevel = 'high';
    } else if (riskFactors.length > 0) {
      riskLevel = 'medium';
    }
    
    return {
      riskLevel,
      riskFactors,
      recommendations
    };
  }

  /**
   * Transform Project entity to ProjectDTO
   */
  static toDTO(entity: Project): ProjectDTO {
    const health = this.calculateProjectHealth(entity);
    const metrics = this.calculateProgressMetrics(entity);
    const evm = this.calculateEVMMetrics(entity);
    const risk = this.calculateRiskAssessment(entity);
    
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      location: entity.location,
      status: entity.status as ProjectStatus,
      progress: entity.progress || 0,
      budget: entity.budget || 0,
      startDate: entity.startDate ? entity.startDate.toISOString() : new Date().toISOString(),
      endDate: entity.endDate ? entity.endDate.toISOString() : undefined,
      thumbnail: entity.thumbnail,
      teamSize: entity.teamSize || 0,
      coordinates: entity.coordinates,
      
      // Enriched fields
      health,
      progressMetrics: metrics,
      evmMetrics: evm,
      riskAssessment: risk,
      
      // BTP specific fields
      estimatedCost: entity.estimatedCost || 0,
      actualCost: entity.actualCost || 0,
      costVariance: entity.costVariance || 0,
      productivityIndex: entity.productivityIndex || 1,
      
      // Location analysis
      geographicZone: entity.geographicZone || '',
      terrainType: entity.terrainType || '',
      environmentalConstraints: entity.environmentalConstraints || '',
      
      // Project metadata
      financingSource: entity.financingSource || '',
      marketType: entity.marketType || '',
      selectionMode: entity.selectionMode || '',
      launchDate: entity.launchDate,
      attributionDate: entity.attributionDate,
      projectReference: entity.projectReference || '',
      
      // Team and resources
      mainContractor: entity.mainContractor || '',
      allowsInitialPayment: entity.allowsInitialPayment || false,
      initialPaymentPercentage: entity.initialPaymentPercentage || 0,
      
      // Phase information
      currentPhase: entity.currentPhase || '',
      currentStage: entity.currentStage || ''
    };
  }

  /**
   * Transform ProjectDTO to Project entity
   */
  static fromDTO(dto: ProjectDTO): Project {
    return new Project(
      dto.id,
      dto.title,
      dto.description,
      dto.status as ProjectStatus,
      dto.progress,
      dto.budget,
      dto.startDate ? new Date(dto.startDate) : new Date(),
      dto.endDate ? new Date(dto.endDate) : undefined,
      dto.location,
      dto.coordinates,
      dto.teamSize,
      dto.thumbnail
    );
  }

  /**
   * Transform Project entity to ProjectDTO (alias for toDTO)
   */
  static fromEntityToDTO(entity: Project): ProjectDTO {
    return this.toDTO(entity);
  }

  /**
   * Transform multiple Project entities to ProjectDTO array
   */
  static fromDtosToAdapter(dtos: ProjectDTO[]): ProjectDTO[] {
    return dtos.map(dto => this.fromDTO(dto));
  }

  /**
   * Transform Project entity to ProjectResponseDto (alias for toDTO)
   */
  static toResponseDto(entity: Project): ProjectDTO {
    return this.toDTO(entity);
  }

  /**
   * Transform CreateProjectRequestDto to Project entity
   */
  static toRequestDto(dto: CreateProjectRequestDto): ProjectDTO {
    const entity = this.fromCreateDtoToEntity(dto);
    return this.toDTO(entity);
  }

  /**
   * Transform UpdateProjectRequestDto to partial Project entity
   */
  static toUpdateDto(dto: UpdateProjectRequestDto): Partial<ProjectDTO> {
    const entity = this.fromUpdateDtoToEntity(dto);
    return entity ? this.toDTO(entity) : {};
  }

  /**
   * Transform CreateProjectRequestDto to Project entity
   */
  static fromCreateDtoToEntity(dto: CreateProjectRequestDto): Project {
    return Project.create({
      id: crypto.randomUUID(),
      title: dto.title,
      description: dto.description,
      location: dto.location,
      status: 'planning',
      progress: 0,
      budget: dto.budget || 0,
      startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      thumbnail: dto.thumbnail || '',
      teamSize: dto.teamSize || 1,
      coordinates: dto.coordinates,
      
      // BTP specific fields
      estimatedCost: dto.estimatedCost || 0,
      geographicZone: dto.geographicZone || '',
      terrainType: dto.terrainType || '',
      environmentalConstraints: dto.environmentalConstraints || '',
      
      // Project metadata
      financingSource: dto.financingSource || '',
      marketType: dto.marketType || '',
      selectionMode: dto.selectionMode || '',
      launchDate: dto.launchDate,
      attributionDate: dto.attributionDate,
      projectReference: dto.projectReference || '',
      
      // Team and resources
      mainContractor: dto.mainContractor || '',
      allowsInitialPayment: dto.allowsInitialPayment || false,
      initialPaymentPercentage: dto.initialPaymentPercentage || 0,
      
      // Phase information
      currentPhase: dto.currentPhase || '',
      currentStage: dto.currentStage || ''
    });
  }

  /**
   * Transform UpdateProjectRequestDto to partial Project entity
   */
  static fromUpdateDtoToEntity(dto: UpdateProjectRequestDto): Partial<Project> {
    return {
      title: dto.title,
      description: dto.description,
      location: dto.location,
      status: dto.status,
      progress: dto.progress,
      budget: dto.budget,
      endDate: dto.endDate,
      thumbnail: dto.thumbnail,
      teamSize: dto.teamSize,
      coordinates: dto.coordinates,
      
      // BTP specific fields
      estimatedCost: dto.estimatedCost,
      geographicZone: dto.geographicZone,
      terrainType: dto.terrainType,
      environmentalConstraints: dto.environmentalConstraints,
      
      // Project metadata
      financingSource: dto.financingSource,
      marketType: dto.marketType,
      selectionMode: dto.selectionMode,
      launchDate: dto.launchDate,
      attributionDate: dto.attributionDate,
      projectReference: dto.projectReference,
      
      // Team and resources
      mainContractor: dto.mainContractor,
      allowsInitialPayment: dto.allowsInitialPayment,
      initialPaymentPercentage: dto.initialPaymentPercentage,
      
      // Phase information
      currentPhase: dto.currentPhase,
      currentStage: dto.currentStage
    };
  }

  /**
   * Transform Project entity to ProjectSummaryDTO
   */
  static toSummaryDto(project: Project): ProjectSummaryDTO {
    const health = this.calculateProjectHealth(project);
    const metrics = this.calculateProgressMetrics(project);
    const evm = this.calculateEVMMetrics(project);
    
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      location: project.location,
      status: project.status as ProjectStatus,
      progress: project.progress || 0,
      budget: project.budget || 0,
      startDate: project.startDate,
      endDate: project.endDate,
      thumbnail: project.thumbnail,
      teamSize: project.teamSize || 0,
      
      // Enriched fields
      health,
      progressMetrics: metrics,
      evmMetrics: evm,
      
      // Summary statistics
      totalTasks: 0, // Should be calculated from related data
      completedTasks: 0,
      totalRisks: 0,
      totalInspections: 0,
      totalPayments: 0,
      
      // BTP specific fields
      estimatedCost: project.estimatedCost || 0,
      actualCost: project.actualCost || 0,
      costVariance: project.costVariance || 0,
      productivityIndex: project.productivityIndex || 1,
      
      // Location analysis
      geographicZone: project.geographicZone || '',
      terrainType: project.terrainType || '',
      environmentalConstraints: project.environmentalConstraints || '',
      
      // Project metadata
      financingSource: project.financingSource || '',
      marketType: project.marketType || '',
      selectionMode: project.selectionMode || '',
      launchDate: project.launchDate,
      attributionDate: project.attributionDate,
      projectReference: project.projectReference || '',
      
      // Team and resources
      mainContractor: project.mainContractor || '',
      allowsInitialPayment: project.allowsInitialPayment || false,
      initialPaymentPercentage: project.initialPaymentPercentage || 0,
      
      // Phase information
      currentPhase: project.currentPhase || '',
      currentStage: project.currentStage || ''
    };
  }

  /**
   * Transform Project entity to ProjectDetailDTO
   */
  static toDetailDto(project: Project): ProjectDetailDTO {
    const health = this.calculateProjectHealth(project);
    const metrics = this.calculateProgressMetrics(project);
    const evm = this.calculateEVMMetrics(project);
    const risk = this.calculateRiskAssessment(project);
    
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      location: project.location,
      status: project.status as ProjectStatus,
      progress: project.progress || 0,
      budget: project.budget || 0,
      startDate: project.startDate,
      endDate: project.endDate,
      thumbnail: project.thumbnail,
      teamSize: project.teamSize || 0,
      
      // Enriched fields
      health,
      progressMetrics: metrics,
      evmMetrics: evm,
      riskAssessment: risk,
      
      // BTP specific fields
      estimatedCost: project.estimatedCost || 0,
      actualCost: project.actualCost || 0,
      costVariance: project.costVariance || 0,
      productivityIndex: project.productivityIndex || 1,
      
      // Location analysis
      geographicZone: project.geographicZone || '',
      terrainType: project.terrainType || '',
      environmentalConstraints: project.environmentalConstraints || '',
      
      // Project metadata
      financingSource: project.financingSource || '',
      marketType: project.marketType || '',
      selectionMode: project.selectionMode || '',
      launchDate: project.launchDate,
      attributionDate: project.attributionDate,
      projectReference: project.projectReference || '',
      
      // Team and resources
      mainContractor: project.mainContractor || '',
      allowsInitialPayment: project.allowsInitialPayment || false,
      initialPaymentPercentage: project.initialPaymentPercentage || 0,
      
      // Phase information
      currentPhase: project.currentPhase || '',
      currentStage: project.currentStage || '',
      
      // Related data (would be populated from services)
      risks: [],
      tasks: [],
      inspections: [],
      payments: [],
      phases: []
    };
  }

  /**
   * Transform Project entity to ProjectListItemDTO
   */
  static toListItemDto(project: Project): ProjectListItemDTO {
    return {
      id: project.id,
      title: project.title,
      location: project.location,
      status: project.status as ProjectStatus,
      progress: project.progress || 0,
      budget: project.budget || 0,
      startDate: project.startDate,
      endDate: project.endDate,
      thumbnail: project.thumbnail,
      teamSize: project.teamSize || 0,
      coordinates: project.coordinates
    };
  }

  /**
   * Validate ProjectDTO data
   */
  static validate(dto: Partial<ProjectDTO>): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};
    
    // Validate required fields
    if (!dto.title || dto.title.trim() === '') {
      errors.push('Project title is required');
      fieldErrors.title = ['Project title is required'];
    }
    
    if (!dto.location || dto.location.trim() === '') {
      errors.push('Project location is required');
      fieldErrors.location = ['Project location is required'];
    }
    
    if (dto.budget !== undefined && dto.budget <= 0) {
      errors.push('Project budget must be greater than 0');
      fieldErrors.budget = ['Project budget must be greater than 0'];
    }
    
    if (dto.startDate && dto.endDate && new Date(dto.startDate) >= new Date(dto.endDate)) {
      errors.push('Start date must be before end date');
      fieldErrors.startDate = ['Start date must be before end date'];
      fieldErrors.endDate = ['End date must be after start date'];
    }
    
    // Validate BTP specific fields
    if (dto.estimatedCost !== undefined && dto.estimatedCost < 0) {
      errors.push('Estimated cost cannot be negative');
      fieldErrors.estimatedCost = ['Estimated cost cannot be negative'];
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }
}
