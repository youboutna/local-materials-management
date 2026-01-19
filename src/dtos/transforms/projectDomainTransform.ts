/**
 * Project Domain Transformer - Consolidated & Unified
 * Implements EntityToDTOMapper interface for Project domain entity
 * Centralizes all project transformation logic following hexagonal architecture
 */

import { Project, ProjectStatus } from '@/domain/entities/Project';
import { ProjectDTO, CreateProjectDTO, UpdateProjectDTO } from '@/dtos/entities/ProjectDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms';
import { ProjectDataCalculations } from '@/utils/projectDataCalculations';
import { calculateEquivalentOpening } from '@/utils/btpCalculations';
import { REFERENTIAL_REGISTRY } from '@/config/referentials';
import { calculatePaymentEligibility } from '@/utils/paymentCalculations';
import { parseInvoiceFromPdf } from '@/utils/integrations';

// API Request/Response DTOs for UI and Supabase integration
export class ProjectResponseDto {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public status: string,
    public progress: number,
    public budget: number,
    public startDate: string | null,
    public endDate: string | null,
    public location?: string,
    public coordinates?: { latitude: number; longitude: number } | null,
    public teamSize?: number | null,
    public thumbnail?: string | null,
    public financingSource?: string | null,
    public mainContractor?: string | null,
    public createdAt?: string,
    public updatedAt?: string
  ) {}
}

export class CreateProjectRequestDto {
  constructor(
    public title: string,
    public description: string,
    public status: string,
    public progress: number,
    public budget: number,
    public startDate?: string | null,
    public endDate?: string | null,
    public location?: string,
    public coordinates?: { latitude: number; longitude: number } | null,
    public teamSize?: number | null,
    public thumbnail?: string | null,
    public financingSource?: string | null,
    public mainContractor?: string | null
  ) {}
}

export class UpdateProjectRequestDto {
  constructor(
    public title?: string,
    public description?: string,
    public status?: string,
    public progress?: number,
    public budget?: number,
    public startDate?: string | null,
    public endDate?: string | null,
    public location?: string,
    public coordinates?: { latitude: number; longitude: number } | null,
    public teamSize?: number | null,
    public thumbnail?: string | null,
    public financingSource?: string | null,
    public mainContractor?: string | null
  ) {}
}

export class ProjectDomainTransformer implements EntityToDTOMapper<Project, ProjectDTO> {
  
  /**
   * Transform Project domain entity to ProjectDTO
   */
  toDTO(entity: Project): ProjectDTO {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      location: entity.location || '',
      status: entity.status,
      progress: entity.progress,
      budget: entity.budget,
      startDate: entity.startDate?.toISOString() || '',
      endDate: entity.endDate?.toISOString(),
      thumbnail: entity.thumbnail || '',
      teamSize: entity.teamSize || 0,
      coordinates: entity.coordinates ? {
        latitude: entity.coordinates.latitude,
        longitude: entity.coordinates.longitude
      } : undefined,
      
      // Additional fields that might be in the DTO but not in the domain entity
      localisation: [],
      forme: undefined,
      adresse: undefined,
      geographicZone: undefined,
      terrainType: undefined,
      environmentalConstraints: undefined,
      hasUtilities: undefined,
      requiresPermits: undefined,
      category: undefined,
      subCategory: undefined,
      priorityLevel: undefined,
      riskLevel: undefined,
      environmentalImpact: undefined,
      sustainabilityScore: undefined,
      financingSource: entity.financingSource,
      marketType: undefined,
      selectionMode: undefined,
      launchDate: undefined,
      attributionDate: undefined,
      projectResponsableId: undefined,
      mainContractor: entity.mainContractor,
      projectReference: undefined,
      allowsInitialPayment: undefined,
      initialPaymentPercentage: undefined,
      currentPhase: undefined,
      currentStage: undefined,
      
      // BaseEntityDTO fields
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Transform ProjectDTO to partial Project domain entity
   */
  fromDTO(dto: Partial<ProjectDTO>): Partial<Project> {
    return {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      location: dto.location,
      status: dto.status,
      progress: dto.progress,
      budget: dto.budget,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      thumbnail: dto.thumbnail,
      teamSize: dto.teamSize,
      coordinates: dto.coordinates && dto.coordinates.latitude !== undefined && dto.coordinates.longitude !== undefined ? {
        latitude: dto.coordinates.latitude,
        longitude: dto.coordinates.longitude
      } : undefined,
      financingSource: dto.financingSource,
      mainContractor: dto.mainContractor
    };
  }

  /**
   * Transform ProjectEntity (database) to ProjectDTO
   */
  fromEntityToDTO(entity: ProjectEntity): ProjectDTO {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      location: entity.location,
      status: entity.status as ProjectStatus,
      progress: entity.progress,
      budget: entity.budget,
      startDate: entity.start_date,
      endDate: entity.end_date,
      thumbnail: entity.thumbnail,
      teamSize: entity.team_size,
      coordinates: entity.coordinates_latitude && entity.coordinates_longitude ? {
        latitude: entity.coordinates_latitude,
        longitude: entity.coordinates_longitude
      } : undefined,
      
      // Localization fields (from database)
      localisation: (entity as any).localisation || [],
      forme: (entity as any).forme,
      adresse: (entity as any).adresse,
      
      // Location-specific fields (from database)
      geographicZone: (entity as any).geographic_zone,
      terrainType: (entity as any).terrain_type,
      environmentalConstraints: (entity as any).environmental_constraints,
      hasUtilities: (entity as any).has_utilities,
      requiresPermits: (entity as any).requires_permits,
      
      // Classification fields (from database)
      category: (entity as any).category,
      subCategory: (entity as any).sub_category,
      priorityLevel: (entity as any).priority_level,
      riskLevel: (entity as any).risk_level,
      environmentalImpact: (entity as any).environmental_impact,
      sustainabilityScore: (entity as any).sustainability_score,
      
      // Project management fields (from database)
      financingSource: entity.financing_source,
      marketType: (entity as any).market_type,
      selectionMode: (entity as any).selection_mode,
      launchDate: (entity as any).launch_date,
      attributionDate: (entity as any).attribution_date,
      projectResponsableId: (entity as any).project_responsable_id,
      mainContractor: entity.main_contractor,
      projectReference: (entity as any).project_reference,
      allowsInitialPayment: (entity as any).allows_initial_payment,
      initialPaymentPercentage: (entity as any).initial_payment_percentage,
      currentPhase: (entity as any).current_phase,
      currentStage: (entity as any).current_stage,
      
      createdAt: entity.created_at,
      updatedAt: entity.updated_at
    };
  }

  /**
   * Transform array of ProjectDTOs to array of ProjectResponseDTOs (for UI/API)
   */
  fromDtosToAdapter(dtos: ProjectDTO[]): ProjectResponseDto[] {
    return dtos.map(dto => this.toResponseDto(dto));
  }

  /**
   * Transform single ProjectDTO to ProjectResponseDto (for UI/API)
   */
  toResponseDto(dto: ProjectDTO): ProjectResponseDto {
    return new ProjectResponseDto(
      dto.id,
      dto.title,
      dto.description,
      dto.status,
      dto.progress,
      dto.budget,
      dto.startDate || null,
      dto.endDate || null,
      dto.location,
      dto.coordinates?.latitude !== undefined && dto.coordinates?.longitude !== undefined 
        ? { latitude: dto.coordinates.latitude, longitude: dto.coordinates.longitude }
        : null,
      dto.teamSize,
      dto.thumbnail,
      dto.financingSource,
      dto.mainContractor,
      dto.createdAt,
      dto.updatedAt
    );
  }

  /**
   * Transform CreateProjectRequestDto to ProjectDTO
   */
  toRequestDto(requestDto: CreateProjectRequestDto): ProjectDTO {
    return {
      id: crypto.randomUUID(),
      title: requestDto.title,
      description: requestDto.description,
      location: requestDto.location || '',
      status: requestDto.status as ProjectStatus,
      progress: requestDto.progress,
      budget: requestDto.budget,
      startDate: (requestDto.startDate) || '',
      endDate: (requestDto.endDate) || '',
      thumbnail: (requestDto.thumbnail) || '',
      teamSize: requestDto.teamSize || 0,
      coordinates: requestDto.coordinates?.latitude !== undefined && requestDto.coordinates?.longitude !== undefined
        ? { latitude: requestDto.coordinates.latitude, longitude: requestDto.coordinates.longitude }
        : undefined,
      
      // Default values for optional fields
      localisation: [],
      forme: undefined,
      adresse: undefined,
      geographicZone: undefined,
      terrainType: undefined,
      environmentalConstraints: undefined,
      hasUtilities: undefined,
      requiresPermits: undefined,
      category: undefined,
      subCategory: undefined,
      priorityLevel: undefined,
      riskLevel: undefined,
      environmentalImpact: undefined,
      sustainabilityScore: undefined,
      financingSource: (requestDto.financingSource) || undefined,
      marketType: undefined,
      selectionMode: undefined,
      launchDate: undefined,
      attributionDate: undefined,
      projectResponsableId: undefined,
      mainContractor: (requestDto.mainContractor) || undefined,
      projectReference: undefined,
      allowsInitialPayment: undefined,
      initialPaymentPercentage: undefined,
      currentPhase: undefined,
      currentStage: undefined,
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Transform UpdateProjectRequestDto to partial ProjectDTO
   */
  toUpdateDto(requestDto: UpdateProjectRequestDto): Partial<ProjectDTO> {
    return {
      title: requestDto.title,
      description: requestDto.description,
      location: requestDto.location,
      status: requestDto.status as ProjectStatus | undefined,
      progress: requestDto.progress,
      budget: requestDto.budget,
      startDate: requestDto.startDate || undefined,
      endDate: requestDto.endDate || undefined,
      thumbnail: requestDto.thumbnail || undefined,
      teamSize: requestDto.teamSize || undefined,
      coordinates: requestDto.coordinates?.latitude !== undefined && requestDto.coordinates?.longitude !== undefined
        ? { latitude: requestDto.coordinates.latitude, longitude: requestDto.coordinates.longitude }
        : undefined,
      financingSource: (requestDto.financingSource) || undefined,
      mainContractor: (requestDto.mainContractor) || undefined,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Transform Project domain entity to ProjectResponseDto (direct path)
   */
  fromDomainToResponseDto(entity: Project): ProjectResponseDto {
    const dto = this.toDTO(entity);
    return this.toResponseDto(dto);
  }

  /**
   * Transform ProjectEntity (database) to ProjectResponseDto (direct path)
   */
  fromEntityToResponseDto(entity: ProjectEntity): ProjectResponseDto {
    const dto = this.fromEntityToDTO(entity);
    return this.toResponseDto(dto);
  }

  /**
   * Validate ProjectDTO data
   */
  validate(dto: Partial<ProjectDTO>): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Title validation
    if (!dto.title || dto.title.trim() === '') {
      errors.push('Project title is required');
      fieldErrors.title = ['Project title is required'];
    }

    // Description validation
    if (!dto.description || dto.description.trim() === '') {
      errors.push('Project description is required');
      fieldErrors.description = ['Project description is required'];
    }

    // Location validation
    if (!dto.location || dto.location.trim() === '') {
      errors.push('Project location is required');
      fieldErrors.location = ['Project location is required'];
    }

    // Budget validation
    if (dto.budget !== undefined && dto.budget <= 0) {
      errors.push('Budget must be greater than 0');
      fieldErrors.budget = ['Budget must be greater than 0'];
    }

    // Progress validation
    if (dto.progress !== undefined && (dto.progress < 0 || dto.progress > 100)) {
      errors.push('Progress must be between 0 and 100');
      fieldErrors.progress = ['Progress must be between 0 and 100'];
    }

    // Team size validation
    if (dto.teamSize !== undefined && dto.teamSize < 0) {
      errors.push('Team size cannot be negative');
      fieldErrors.teamSize = ['Team size cannot be negative'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  static calculateProjectProgress(project: ProjectDTO): number {
    // Calculate progress based on multiple factors
    const budgetProgress = project.budget > 0 ? (project.progress || 0) : 0;
    const timeProgress = this.calculateTimeProgress(project.startDate, project.endDate);
    
    // Weighted average: 60% progress, 40% time
    return (budgetProgress * 0.6) + (timeProgress * 0.4);
  }

  static calculateTimeProgress(startDate?: string | null, endDate?: string | null): number {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    const totalTime = end.getTime() - start.getTime();
    const elapsedTime = now.getTime() - start.getTime();
    
    if (totalTime <= 0) return 0;
    if (elapsedTime <= 0) return 0;
    if (elapsedTime >= totalTime) return 100;
    
    return Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
  }

  static calculateProjectRisk(project: ProjectDTO): 'low' | 'medium' | 'high' {
    const riskFactors = [];
    
    // Budget risk
    if (project.budget > 1000000) riskFactors.push('high_budget');
    
    // Time risk
    const timeProgress = this.calculateTimeProgress(project.startDate, project.endDate);
    if (timeProgress > 80 && (project.progress || 0) < 60) riskFactors.push('schedule_delay');
    
    // Complexity risk
    if (project.teamSize && project.teamSize > 50) riskFactors.push('large_team');
    
    if (riskFactors.length >= 2) return 'high';
    if (riskFactors.length === 1) return 'medium';
    return 'low';
  }

  static getProjectHealthStatus(project: ProjectDTO): 'healthy' | 'warning' | 'critical' {
    const progress = this.calculateProjectProgress(project);
    const risk = this.calculateProjectRisk(project);
    
    if (risk === 'high' || progress < 25) return 'critical';
    if (risk === 'medium' || progress < 50) return 'warning';
    return 'healthy';
  }

  static formatProjectDuration(startDate?: string | null, endDate?: string | null): string {
    if (!startDate || !endDate) return 'N/A';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} jours`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mois`;
    return `${Math.floor(diffDays / 365)} ans`;
  }

  // Enhanced utility methods with referentials and integrations
  static async validateProjectWithReferential(project: ProjectDTO, referentialType: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Basic validation
    const basicValidation = this.validate(project);
    if (!basicValidation.isValid) {
      errors.push(...basicValidation.errors);
      Object.assign(fieldErrors, basicValidation.fieldErrors);
    }

    // Referential-specific validation
    const referential = REFERENTIAL_REGISTRY[referentialType as keyof typeof REFERENTIAL_REGISTRY];
    if (referential) {
      // Check if project has required phases
      if (referential.phases && referential.phases.length > 0) {
        const hasRequiredPhases = referential.phases.every(phase => 
          project.currentPhase && project.currentPhase.includes(phase.code)
        );
        if (!hasRequiredPhases) {
          errors.push(`Project missing required phases for ${referentialType}`);
          fieldErrors.currentPhase = [`Required phases: ${referential.phases.map(p => p.code).join(', ')}`];
        }
      }

      // Check engineering consultant requirement
      if (referential.requiresEngineeringConsultant && !project.projectResponsableId) {
        errors.push('Engineering consultant required for this referential');
        fieldErrors.projectResponsableId = ['Engineering consultant assignment required'];
      }

      // Check donor approval requirement
      if (referential.requiresDonorApproval && project.financingSource !== 'donor') {
        errors.push('Donor approval required for this referential');
        fieldErrors.financingSource = ['Donor financing required'];
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  static async calculateProjectWithPayments(projectId: string): Promise<any> {
    try {
      const projectMetrics = await ProjectDataCalculations.calculateRealProjectCosts(projectId);
      const paymentValidation = await calculatePaymentEligibility(
        projectId, 
        projectMetrics.mainContractor || '', 
        projectMetrics.totalSpent, 
        projectMetrics.totalSpent / projectMetrics.estimatedCost * 100
      );

      return {
        ...projectMetrics,
        paymentValidation,
        canProceedToPayment: paymentValidation.canProceed,
        paymentBlockingReasons: paymentValidation.blockingReasons
      };
    } catch (error) {
      console.error('Error calculating project with payments:', error);
      return null;
    }
  }

  static async processProjectDocuments(files: File[]): Promise<any[]> {
    const processedDocuments = [];

    for (const file of files) {
      if (file.type === 'application/pdf') {
        try {
          const invoiceLines = await parseInvoiceFromPdf(file);
          processedDocuments.push({
            fileName: file.name,
            type: 'invoice',
            extractedData: invoiceLines,
            processedAt: new Date().toISOString()
          });
        } catch (error) {
          console.error(`Error processing PDF ${file.name}:`, error);
          processedDocuments.push({
            fileName: file.name,
            type: 'pdf',
            error: error instanceof Error ? error.message : 'Processing failed',
            processedAt: new Date().toISOString()
          });
        }
      } else {
        processedDocuments.push({
          fileName: file.name,
          type: 'document',
          size: file.size,
          processedAt: new Date().toISOString()
        });
      }
    }

    return processedDocuments;
  }

  static getProjectReferentialInfo(project: ProjectDTO): any {
    // Determine which referential this project follows
    for (const [referentialType, referential] of Object.entries(REFERENTIAL_REGISTRY)) {
      if (referential.paymentWorkflow && project.financingSource) {
        const matchesReferential = this.validateProjectAgainstReferential(project, referential);
        if (matchesReferential.isValid) {
          return {
            type: referentialType,
            name: referential.name,
            description: referential.description,
            phases: referential.phases,
            requirements: {
              requiresEngineeringConsultant: referential.requiresEngineeringConsultant,
              requiresDonorApproval: referential.requiresDonorApproval,
              requiresMinistryApproval: referential.requiresMinistryApproval
            }
          };
        }
      }
    }

    return {
      type: 'CUSTOM_STANDARD',
      name: 'Standard Custom',
      description: 'Custom project configuration'
    };
  }

  static validateProjectAgainstReferential(project: ProjectDTO, referential: any): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Check phase requirements
    if (referential.phases && referential.phases.length > 0) {
      const projectPhases = project.currentPhase ? [project.currentPhase] : [];
      const missingPhases = referential.phases.filter((phase: any) => 
        !projectPhases.includes(phase.code)
      );
      
      if (missingPhases.length > 0) {
        errors.push(`Missing required phases: ${missingPhases.map((p: any) => p.code).join(', ')}`);
        fieldErrors.currentPhase = [`Required: ${missingPhases.map((p: any) => p.code).join(', ')}`];
      }
    }

    // Check consultant requirement
    if (referential.requiresEngineeringConsultant && !project.projectResponsableId) {
      errors.push('Engineering consultant required');
      fieldErrors.projectResponsableId = ['Engineering consultant required'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  static calculateProjectMetricsEnhanced(project: ProjectDTO): any {
    const basicMetrics = this.calculateProjectMetrics(project);
    const referentialInfo = this.getProjectReferentialInfo(project);
    
    return {
      ...basicMetrics,
      referentialCompliance: referentialInfo,
      estimatedCompletionDate: this.calculateEstimatedCompletionDate(project),
      resourceUtilization: this.calculateResourceUtilization(project),
      qualityScore: this.calculateQualityScore(project),
      riskAssessment: this.calculateProjectRisk(project)
    };
  }

  static calculateEstimatedCompletionDate(project: ProjectDTO): Date | null {
    if (!project.startDate || project.progress >= 100) return null;
    
    const start = new Date(project.startDate);
    const elapsed = new Date().getTime() - start.getTime();
    const elapsedDays = Math.floor(elapsed / (1000 * 60 * 60 * 24));
    
    if (project.progress <= 0) return null;
    
    const totalEstimatedDays = (elapsedDays / project.progress) * 100;
    const completionDate = new Date(start.getTime() + (totalEstimatedDays * 1000 * 60 * 60 * 24));
    
    return completionDate;
  }

  static calculateResourceUtilization(project: ProjectDTO): number {
    // Calculate based on team size, budget, and progress
    const teamEfficiency = project.teamSize ? project.progress / (project.teamSize * 10) : 0;
    const budgetEfficiency = project.budget > 0 ? (project.progress / 100) / (project.budget / 1000000) : 0;
    
    return Math.min(100, Math.max(0, (teamEfficiency + budgetEfficiency) / 2 * 100));
  }

  static calculateQualityScore(project: ProjectDTO): number {
    let score = 50; // Base score
    
    // Progress quality (40%)
    if (project.progress > 75) score += 20;
    else if (project.progress > 50) score += 10;
    else if (project.progress > 25) score += 5;
    
    // Timeline adherence (30%)
    const timeProgress = this.calculateTimeProgress(project.startDate, project.endDate);
    if (timeProgress > 0) {
      const progressVsTime = project.progress / timeProgress;
      if (progressVsTime >= 0.9) score += 15;
      else if (progressVsTime >= 0.7) score += 10;
      else if (progressVsTime >= 0.5) score += 5;
    }
    
    // Budget management (30%)
    if (project.budget > 0) {
      // This would require actual cost data from payments/expenses
      score += 15; // Assume good budget management for now
    }
    
    return Math.min(100, Math.max(0, score));
  }

  static generateProjectReport(project: ProjectDTO): any {
    const metrics = this.calculateProjectMetricsEnhanced(project);
    const referentialInfo = this.getProjectReferentialInfo(project);
    
    return {
      projectInfo: {
        id: project.id,
        title: project.title,
        status: project.status,
        progress: project.progress,
        budget: project.budget,
        healthStatus: this.getProjectHealthStatus(project)
      },
      metrics,
      referential: referentialInfo,
      recommendations: this.generateProjectRecommendations(project, metrics),
      generatedAt: new Date().toISOString()
    };
  }

  static generateProjectRecommendations(project: ProjectDTO, metrics: any): string[] {
    const recommendations: string[] = [];
    
    // Progress-based recommendations
    if (project.progress < 25) {
      recommendations.push('Project needs immediate attention - very low progress');
    } else if (project.progress < 50) {
      recommendations.push('Consider reviewing project timeline and resources');
    }
    
    // Risk-based recommendations
    const risk = this.calculateProjectRisk(project);
    if (risk === 'high') {
      recommendations.push('High risk detected - implement risk mitigation strategies');
    }
    
    // Timeline recommendations
    const isOverdue = this.isProjectOverdue(project);
    if (isOverdue) {
      recommendations.push('Project is overdue - review schedule and constraints');
    }
    
    return recommendations;
  }
}
