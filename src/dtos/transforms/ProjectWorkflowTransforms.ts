/**
 * Project Workflow Transformer - Method Signatures
 * Handles conversions between layers in hexagonal architecture
 * Following clean code principles: camelCase only, no business logic
 * Rule #3: Convert snake_case ↔ camelCase between entities and DTOs
 * Rule #4: Pure transformations, no business logic
 * Rule #5: UI layer separation with proper state management
 */

// Import workflow DTOs (following "similitude des voisins le plus proche")
import { 
  ProjectWorkflowData,
  StepRelatedDataDTO,
  WorkflowMetadataDTO,
  ValidationResult,
  SaveResult,
  SaveContextDTO,
  WorkflowStep,
  WorkflowTransition,
  WorkflowState,
  ProjectCreationWorkflowDTO,
  WorkflowTemplateDTO,
  WorkflowSessionDTO,
  WorkflowAuditLogDTO,
  WorkflowMetricsDTO,
  ProjectValidationDTO,
  StepProgressDTO
} from '@/dtos/workflows/ProjectWorkflowDTOs';

// Import entity DTOs (following "similitude des voisins le plus proche")
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { PhaseDTO, PhaseStatus, PhaseType, PhasePriority } from '@/dtos/entities/PhaseDTO';
import { MaterialDTO } from '@/dtos/entities/MaterialDTO';
import { RiskDTO, RiskCategory, RiskStatus } from '@/dtos/entities/RiskDTO';
import { TaskDTO } from '@/dtos/entities/TaskDTO';
import { EmployeeDTO } from '@/dtos/entities/EmployeeDTO';
import { InspectionDTO } from '@/dtos/entities/InspectionDTO';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';
import { StakeholderDTO } from '@/dtos/entities/StakeholderDTO';

// Import domain entities
import { Project } from '@/domain';

// Import request/response DTOs
import { CreateProjectDTO, UpdateProjectDTO } from '@/dtos/entities/ProjectDTO';

// Domain entity interfaces for transformation
interface ProjectWorkflowEntity {
  project_id?: string;
  current_step: number;
  is_draft: boolean;
  is_complete: boolean;
  project_title: string;
  project_description?: string;
  start_date?: string;
  end_date?: string;
  project_status: string;
  budget?: number;
  location?: string;
  progress?: number;
  risks?: Array<{
    risk_id: string;
    risk_title: string;
    risk_probability: number;
    risk_impact: number;
  }>;
  phases?: Array<{
    phase_id: string;
    phase_name: string;
    phase_start_date?: string;
    phase_end_date?: string;
  }>;
  last_saved_at?: string;
  total_steps?: number;
  completed_steps?: number;
  progress_percentage?: number;
}

export class ProjectWorkflowTransforms {
  
  // =================== DATABASE ↔ DOMAIN ===================
  
  /**
   * Convert Supabase row to workflow entity
   * Following hexagonal architecture: Infrastructure → Application → Domain
   */
  static fromSupabase(row: Record<string, unknown>): ProjectWorkflowEntity {
    return {
      project_id: row.id as string,
      current_step: (row.current_step as number) || 1,
      is_draft: (row.is_draft as boolean) ?? true,
      is_complete: (row.is_complete as boolean) ?? false,
      project_title: row.title as string,
      project_description: row.description as string || undefined,
      start_date: row.start_date as string || undefined,
      end_date: row.end_date as string || undefined,
      project_status: this.fromDatabaseStatus(row.status as string),
      budget: (row.budget as number) || undefined,
      location: row.location as string || undefined,
      progress: (row.progress as number) || undefined,
      risks: [], // Will be loaded separately
      phases: [], // Will be loaded separately
      last_saved_at: row.updated_at as string || new Date().toISOString(),
      total_steps: (row.total_steps as number) || 7,
      completed_steps: (row.completed_steps as number) || 0,
      progress_percentage: (row.progress as number) || 0
    };
  }

  /**
   * Convert workflow entity to Supabase insert/update object
   * Following hexagonal architecture: Domain → Application → Infrastructure
   */
  static toSupabase(entity: ProjectWorkflowEntity): Record<string, unknown> {
    return {
      id: entity.project_id,
      current_step: entity.current_step,
      is_draft: entity.is_draft,
      is_complete: entity.is_complete,
      title: entity.project_title,
      description: entity.project_description,
      start_date: entity.start_date,
      end_date: entity.end_date,
      status: this.toDatabaseStatus(entity.project_status),
      budget: entity.budget,
      location: entity.location,
      progress: entity.progress,
      total_steps: entity.total_steps,
      completed_steps: entity.completed_steps,
      updated_at: entity.last_saved_at || new Date().toISOString()
    };
  }

  /**
   * Convert create request to Supabase insert object
   * Following hexagonal architecture: UI → DTOs → Application → Infrastructure
   */
  static createToSupabase(request: CreateProjectDTO): Record<string, unknown> {
    const now = new Date().toISOString();
    
    return {
      title: request.title,
      description: request.description,
      location: request.location,
      budget: request.budget,
      start_date: request.startDate,
      end_date: request.endDate,
      status: this.toDatabaseStatus(request.status || 'draft'),
      progress: 0,
      current_step: 1,
      is_draft: true,
      is_complete: false,
      total_steps: 7,
      completed_steps: 0,
      thumbnail: request.thumbnail,
      created_at: now,
      updated_at: now
    };
  }
  
  // =================== DOMAIN ↔ DTO ===================
  
  /**
   * Convert workflow entity to DTO
   * Rule #3: Entity (snake_case) → DTO (camelCase)
   * Rule #4: Pure transformation, no business logic
   */
  static toDTO(entity: ProjectWorkflowEntity): ProjectWorkflowData {
    // Calculate derived values
    const totalSteps = entity.total_steps || 7;
    const completedSteps = entity.completed_steps || 0;
    const progressPercentage = entity.progress_percentage || 0;
    const isComplete = entity.is_complete || progressPercentage >= 100;
    
    // Process relationships with proper transformations
    const processedRisks = entity.risks?.map(risk => ({
      id: risk.risk_id,
      title: risk.risk_title,
      probability: risk.risk_probability,
      impact: risk.risk_impact,
      category: RiskCategory.TECHNICAL,
      status: risk.risk_probability > 0.7 ? RiskStatus.IDENTIFIED : risk.risk_impact > 0.7 ? RiskStatus.IDENTIFIED : RiskStatus.MONITORED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })) || [];

    const processedPhases: PhaseDTO[] = entity.phases?.map(phase => ({
      id: phase.phase_id,
      name: phase.phase_name,
      description: `Phase ${phase.phase_name} for project ${entity.project_title}`,
      startDate: phase.phase_start_date,
      endDate: phase.phase_end_date,
      duration: phase.phase_start_date && phase.phase_end_date ? 
        this.calculateDuration(phase.phase_start_date, phase.phase_end_date) : undefined,
      status: this.calculatePhaseStatus(phase.phase_start_date, phase.phase_end_date, progressPercentage) as PhaseStatus,
      progress: this.calculatePhaseProgress(phase.phase_start_date, phase.phase_end_date),
      type: PhaseType.STRUCTURAL,
      priority: PhasePriority.MEDIUM,
      projectId: entity.project_id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })) || [];

    return {
      projectId: entity.project_id,
      currentStep: entity.current_step,
      isDraft: entity.is_draft,
      isComplete: isComplete,
      projectData: {
        id: entity.project_id,
        title: entity.project_title,
        description: entity.project_description,
        startDate: entity.start_date,
        endDate: entity.end_date,
        status: entity.project_status,
        budget: entity.budget || 0,
        location: entity.location || '',
        progress: entity.progress || 0,
        totalPhases: processedPhases.length,
        completedPhases: processedPhases.filter(p => p.status === PhaseStatus.COMPLETED).length,
        totalRisks: processedRisks.length,
        highRiskCount: processedRisks.filter(r => r.status === RiskStatus.IDENTIFIED).length,
        estimatedCompletion: entity.end_date,
        currency: 'MRU' as const,
        teamSize: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as ProjectDTO,
      relatedData: {
        risks: processedRisks,
        phases: processedPhases
      },
      metadata: {
        lastSavedAt: entity.last_saved_at || new Date().toISOString(),
        totalSteps: totalSteps,
        completedSteps: completedSteps,
        progressPercentage: progressPercentage
      }
    };
  }

  /**
   * Convert workflow DTO to entity
   * Rule #3: DTO (camelCase) → DB (snake_case)
   * Rule #4: Pure transformation, no business logic
   */
  static fromDTO(dto: ProjectWorkflowData): ProjectWorkflowEntity {
    return {
      project_id: dto.projectId,
      current_step: dto.currentStep,
      is_draft: dto.isDraft,
      is_complete: dto.isComplete,
      project_title: dto.projectData.title,
      project_description: dto.projectData.description,
      start_date: dto.projectData.startDate,
      end_date: dto.projectData.endDate,
      project_status: dto.projectData.status,
      budget: dto.projectData.budget,
      location: dto.projectData.location,
      progress: dto.projectData.progress,
      risks: dto.relatedData?.risks?.map(risk => ({
        risk_id: risk.id,
        risk_title: risk.title,
        risk_probability: risk.probability,
        risk_impact: risk.impact
      })) || [],
      phases: dto.relatedData?.phases?.map(phase => ({
        phase_id: phase.id,
        phase_name: phase.name,
        phase_start_date: phase.startDate,
        phase_end_date: phase.endDate
      })) || [],
      last_saved_at: dto.metadata.lastSavedAt,
      total_steps: dto.metadata.totalSteps,
      completed_steps: dto.metadata.completedSteps,
      progress_percentage: dto.metadata.progressPercentage
    };
  }

  /**
   * Convert create request to entity
   * Rule #3: DTO (camelCase) → DB (snake_case)
   * Rule #4: Pure transformation, no business logic
   */
  static fromCreateRequest(request: CreateProjectDTO, id: string): ProjectWorkflowEntity {
    return {
      project_id: id,
      current_step: 1,
      is_draft: true,
      is_complete: false,
      project_title: request.title,
      project_description: request.description,
      start_date: request.startDate,
      end_date: request.endDate,
      project_status: request.status || 'draft',
      budget: request.budget,
      location: request.location,
      progress: 0,
      risks: [],
      phases: [],
      last_saved_at: new Date().toISOString(),
      total_steps: 7,
      completed_steps: 0,
      progress_percentage: 0
    };
  }

  /**
   * Convert update request to partial entity
   * Rule #3: DTO (camelCase) → DB (snake_case)
   * Rule #4: Pure transformation, no business logic
   */
  static fromUpdateRequest(dto: UpdateProjectDTO, existing: ProjectWorkflowEntity): Partial<ProjectWorkflowEntity> {
    const updates: Partial<ProjectWorkflowEntity> = {};
    
    if (dto.title !== undefined) updates.project_title = dto.title;
    if (dto.description !== undefined) updates.project_description = dto.description;
    if (dto.startDate !== undefined) updates.start_date = dto.startDate;
    if (dto.endDate !== undefined) updates.end_date = dto.endDate;
    if (dto.status !== undefined) updates.project_status = dto.status;
    if (dto.budget !== undefined) updates.budget = dto.budget;
    if (dto.location !== undefined) updates.location = dto.location;
    if (dto.progress !== undefined) updates.progress = dto.progress;
    
    updates.last_saved_at = new Date().toISOString();
    
    return updates;
  }
  
  // =================== UI ↔ DTO ===================
  
  /**
   * Convert form data to create request
   * Rule #5: UI → DTO transformation
   */
  static formToCreateRequest(formData: Record<string, unknown>): CreateProjectDTO {
    return {
      title: (formData.title as string) || '',
      description: (formData.description as string) || '',
      location: (formData.location as string) || '',
      budget: (formData.budget as number) || 0,
      startDate: (formData.startDate as string) || '',
      endDate: (formData.endDate as string) || '',
      status: ProjectStatus.DRAFT,
      thumbnail: (formData.thumbnail as string) || ''
    };
  }

  /**
   * Convert entity to UI state
   * Rule #5: Domain → UI transformation with presentation logic
   */
  static toUI(entity: ProjectWorkflowEntity): Record<string, unknown> {
    const progressPercentage = entity.progress_percentage || 0;
    const isComplete = entity.is_complete || progressPercentage >= 100;
    
    return {
      // Core data
      id: entity.project_id,
      title: entity.project_title,
      description: entity.project_description,
      status: entity.project_status,
      progress: progressPercentage,
      isComplete,
      
      // Timeline
      startDate: entity.start_date,
      endDate: entity.end_date,
      currentStep: entity.current_step,
      totalSteps: entity.total_steps || 7,
      
      // Financial
      budget: entity.budget,
      location: entity.location,
      
      // Computed properties
      formattedStartDate: entity.start_date ? new Date(entity.start_date).toLocaleDateString() : '',
      formattedEndDate: entity.end_date ? new Date(entity.end_date).toLocaleDateString() : '',
      formattedBudget: entity.budget ? new Intl.NumberFormat('fr-MR', {
        style: 'currency',
        currency: 'MRU'
      }).format(entity.budget) : '',
      
      // Status indicators
      statusColor: this.getStatusColor(entity.project_status),
      progressVariant: this.getProgressVariant(progressPercentage),
      badgeVariant: this.getBadgeVariant(entity.project_status, 0),
      statusIcon: this.getStatusIcon(entity.project_status),
      
      // UI state
      loading: false,
      error: null,
      isDirty: false,
      isValid: true,
      touchedFields: new Set<string>(),
      
      // Workflow state
      isDraft: entity.is_draft,
      canEdit: ['draft', 'en cours'].includes(entity.project_status),
      canDelete: entity.project_status === 'draft',
      canComplete: ['en cours'].includes(entity.project_status),
      
      // Related data counts
      risksCount: entity.risks?.length || 0,
      phasesCount: entity.phases?.length || 0,
      highRiskCount: entity.risks?.filter(r => r.risk_probability > 0.7).length || 0,
      
      // Metadata
      lastSavedAt: entity.last_saved_at,
      completedSteps: entity.completed_steps || 0
    };
  }

  /**
   * Convert form data to update request
   * Rule #5: UI → DTO transformation
   */
  static formToUpdateRequest(formData: Record<string, unknown>): UpdateProjectDTO {
    return {
      id: formData.id as string,
      title: formData.title as string,
      description: formData.description as string,
      location: formData.location as string,
      budget: formData.budget as number,
      startDate: formData.startDate as string,
      endDate: formData.endDate as string,
      status: formData.status as ProjectStatus | undefined,
      progress: formData.progress as number,
      thumbnail: formData.thumbnail as string,
      teamSize: formData.teamSize as number,
      financingSource: formData.financing_source as string,
      marketType: formData.market_type as string,
      selectionMode: formData.selection_mode as string,
      projectReference: formData.project_reference as string,
      mainContractor: formData.main_contractor as string,
      engineeringConsultant: formData.engineering_consultant as string,
      allowsInitialPayment: formData.allows_initial_payment as boolean,
      initialPaymentPercentage: formData.initial_payment_percentage as number,
      currentPhase: formData.current_phase as string,
      currentStage: formData.current_stage as ConstructionStage | undefined,
      coordinates: formData.coordinates as { latitude: number; longitude: number }
    };
  }

  // =================== BATCH TRANSFORMATIONS ===================

  static manyFromSupabase(rows: Record<string, unknown>[]): ProjectWorkflowEntity[] {
    return rows.map(row => this.fromSupabase(row));
  }

  static manyToDTO(entities: ProjectWorkflowEntity[]): ProjectWorkflowData[] {
    return entities.map(entity => this.toDTO(entity));
  }

  static manyToUI(entities: ProjectWorkflowEntity[]): Record<string, unknown>[] {
    return entities.map(entity => this.toUI(entity));
  }

  static manyFromDTO(dtos: ProjectWorkflowData[]): ProjectWorkflowEntity[] {
    return dtos.map(dto => this.fromDTO(dto));
  }
  
  // =================== ENUM CONVERSIONS ===================

  private static fromDatabaseStatus(status: string): string {
    const mapping: Record<string, string> = {
      'draft': 'draft',
      'en_cours': 'en cours',
      'termine': 'terminé',
      'en_attente': 'en attente',
      'suspendu': 'suspendu',
      'annule': 'annulé'
    };
    return mapping[status] || status;
  }

  private static toDatabaseStatus(status: string): string {
    const mapping: Record<string, string> = {
      'draft': 'draft',
      'en cours': 'en_cours',
      'terminé': 'termine',
      'en attente': 'en_attente',
      'suspendu': 'suspendu',
      'annulé': 'annule'
    };
    return mapping[status] || status;
  }

  private static fromDTOStatus(dto: string): string {
    return this.fromDatabaseStatus(dto);
  }

  private static toDTOStatus(status: string): string {
    return this.toDatabaseStatus(status);
  }
  
  // =================== UI HELPER METHODS ===================

  private static getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'draft': 'gray',
      'en cours': 'blue',
      'terminé': 'green',
      'en attente': 'yellow',
      'suspendu': 'orange',
      'annulé': 'red'
    };
    return colors[status] || 'gray';
  }

  private static getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'low': 'green',
      'medium': 'yellow',
      'high': 'red',
      'critical': 'red'
    };
    return colors[priority] || 'gray';
  }

  private static getProgressVariant(progress: number): string {
    if (progress >= 100) return 'success';
    if (progress >= 75) return 'info';
    if (progress >= 50) return 'warning';
    if (progress >= 25) return 'secondary';
    return 'destructive';
  }

  private static getBadgeVariant(status: string, daysRemaining: number): string {
    if (status === 'annulé') return 'destructive';
    if (status === 'terminé') return 'default';
    if (daysRemaining < 0) return 'destructive';
    if (daysRemaining < 7) return 'secondary';
    return 'outline';
  }

  private static getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'draft': 'file-text',
      'en cours': 'play-circle',
      'terminé': 'check-circle',
      'en attente': 'clock',
      'suspendu': 'pause-circle',
      'annulé': 'x-circle'
    };
    return icons[status] || 'circle';
  }

  // =================== WORKFLOW-SPECIFIC TRANSFORMATIONS ===================

  private static calculateRiskLevel(probability: number, impact: number): 'low' | 'medium' | 'high' {
    const score = probability * impact;
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  private static calculateDuration(startDate: string | undefined, endDate: string | undefined): number | undefined {
    if (!startDate || !endDate) return undefined;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private static calculatePhaseStatus(startDate: string | undefined, endDate: string | undefined, progress: number): 'pending' | 'in_progress' | 'completed' | 'delayed' {
    const now = new Date();
    if (!startDate || !endDate) return 'pending';
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (progress >= 100) return 'completed';
    if (now > end) return 'delayed';
    if (now >= start) return 'in_progress';
    return 'pending';
  }

  private static calculatePhaseProgress(startDate: string | undefined, endDate: string | undefined): number {
    const now = new Date();
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  private static calculateWorkflowEfficiency(completedSteps: number, totalSteps: number): number {
    return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  }

  private static calculateAveragePhaseDuration(phases: Array<{duration?: number}>): number | undefined {
    const durations = phases.filter(p => p.duration !== undefined).map(p => p.duration as number);
    return durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : undefined;
  }

  private static calculateOnTimeCompletion(endDate: string | undefined, progressPercentage: number): boolean {
    if (!endDate) return false;
    const now = new Date();
    const end = new Date(endDate);
    return now <= end || progressPercentage >= 100;
  }

  private static calculateHealthScore(risks: Array<{riskLevel: string}>, progressPercentage: number): number {
    const riskPenalty = risks.filter(r => r.riskLevel === 'high').length * 10;
    const progressBonus = progressPercentage >= 50 ? 10 : 0;
    return Math.max(0, 100 - riskPenalty + (100 - progressPercentage) + progressBonus);
  }

  // =================== WORKFLOW METRICS CALCULATIONS ===================

  private static calculateAverageTimePerStep(entity: ProjectWorkflowEntity): number {
    // Default calculation based on project duration and steps
    if (!entity.start_date || !entity.end_date) return 0;
    const start = new Date(entity.start_date);
    const end = new Date(entity.end_date);
    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const totalSteps = entity.total_steps || 7;
    return totalSteps > 0 ? totalMinutes / totalSteps : 0;
  }

  private static calculateTotalElapsedTime(entity: ProjectWorkflowEntity): number {
    if (!entity.start_date) return 0;
    const start = new Date(entity.start_date);
    const now = new Date();
    return (now.getTime() - start.getTime()) / (1000 * 60);
  }

  private static calculateValidationErrors(entity: ProjectWorkflowEntity): number {
    // Simple validation error count based on required fields
    let errors = 0;
    if (!entity.project_title) errors++;
    if (!entity.start_date) errors++;
    if (!entity.end_date) errors++;
    if (!entity.budget || entity.budget <= 0) errors++;
    return errors;
  }

  private static calculateSaveOperations(entity: ProjectWorkflowEntity): number {
    // Estimate save operations based on workflow steps and modifications
    const baseSaves = entity.completed_steps || 0;
    const modificationSaves = entity.last_saved_at ? 1 : 0;
    return baseSaves + modificationSaves;
  }

  private static calculateUserInteractions(entity: ProjectWorkflowEntity): number {
    // Estimate user interactions based on complexity
    let interactions = 10; // Base interactions
    if (entity.risks && entity.risks.length > 0) interactions += entity.risks.length * 2;
    if (entity.phases && entity.phases.length > 0) interactions += entity.phases.length * 3;
    return interactions;
  }

  private static calculateAbandonmentRate(entity: ProjectWorkflowEntity): number | undefined {
    // Calculate abandonment rate based on progress and time
    if (!entity.start_date || !entity.end_date) return undefined;
    const progress = entity.progress_percentage || 0;
    const now = new Date();
    const end = new Date(entity.end_date);
    
    if (progress < 10 && now > end) return 100; // Abandoned
    if (progress < 50 && now > end) return 75; // High risk
    if (progress < 80 && now > end) return 25; // Low risk
    return 0; // On track
  }

  // =================== SUMMARY TRANSFORMATIONS ===================

  static toSummary(entity: ProjectWorkflowEntity): Record<string, unknown> {
    return {
      id: entity.project_id,
      title: entity.project_title,
      status: entity.project_status,
      progress: entity.progress_percentage || 0,
      currentStep: entity.current_step,
      totalSteps: entity.total_steps || 7,
      isComplete: entity.is_complete,
      risksCount: entity.risks?.length || 0,
      phasesCount: entity.phases?.length || 0,
      lastSavedAt: entity.last_saved_at
    };
  }

  static toTimelineItem(entity: ProjectWorkflowEntity): Record<string, unknown> {
    return {
      id: entity.project_id,
      title: entity.project_title,
      startDate: entity.start_date,
      endDate: entity.end_date,
      status: entity.project_status,
      progress: entity.progress_percentage || 0,
      currentStep: entity.current_step,
      type: 'project',
      icon: this.getStatusIcon(entity.project_status),
      color: this.getStatusColor(entity.project_status)
    };
  }

  static toWorkflowMetrics(entity: ProjectWorkflowEntity): WorkflowMetricsDTO {
    const totalSteps = entity.total_steps || 7;
    const completedSteps = entity.completed_steps || 0;
    const progressPercentage = entity.progress_percentage || 0;
    
    return {
      totalSteps,
      completedSteps,
      averageTimePerStep: this.calculateAverageTimePerStep(entity),
      totalElapsedTime: this.calculateTotalElapsedTime(entity),
      validationErrors: this.calculateValidationErrors(entity),
      saveOperations: this.calculateSaveOperations(entity),
      userInteractions: this.calculateUserInteractions(entity),
      completionRate: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
      abandonmentRate: this.calculateAbandonmentRate(entity)
    };
  }

  static toValidationResult(entity: ProjectWorkflowEntity): ValidationResult {
    const errors: string[] = [];

    if (!entity.project_title) errors.push('Project title is required');
    if (!entity.start_date) errors.push('Start date is required');
    if (!entity.end_date) errors.push('End date is required');
    if (entity.start_date && entity.end_date && new Date(entity.start_date) > new Date(entity.end_date)) {
      errors.push('Start date must be before end date');
    }
    if (!entity.budget || entity.budget <= 0) errors.push('Budget must be greater than 0');

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
