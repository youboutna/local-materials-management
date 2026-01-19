/**
 * Phase Domain Transformer - Enhanced with Calculations and Business Logic
 * Integrates phase calculations, validation, and UI-specific features
 * Following hexagonal architecture principles
 */

import { Phase, PhaseStatus, PhaseStep, PhaseTask } from '@/domain/entities/Phase';
import { ProgressAnalytics, TimelineAnalytics, BudgetAnalytics } from '@/types/calculations';
import { BaseEntityDTO, EntityToDTOMapper, ValidationResult } from '@/dtos/shared';

// Enhanced types for UI components
export interface PhaseDTO extends BaseEntityDTO {
  projectId: string;
  name: string;
  description: string;
  status: PhaseStatus;
  progress: number;
  orderIndex: number;
  startDate: string;
  endDate: string;
  estimatedCost: number;
  actualCost: number;
  constructionPhase?: string;
  constructionStage?: string;
  steps?: PhaseStepDTO[];
}

export interface PhaseStepDTO {
  id: string;
  name: string;
  description: string;
  status: PhaseStatus;
  progress: number;
  orderIndex: number;
  tasks?: PhaseTaskDTO[];
  estimatedDurationDays?: number;
  requiresInspection?: boolean;
  requiresEngineerApproval?: boolean;
}

export interface PhaseTaskDTO {
  id: string;
  name: string;
  description: string;
  status: PhaseStatus;
  progress: number;
  orderIndex: number;
  assignedTo?: string[];
  requiresInspection?: boolean;
  requiresEngineerApproval?: boolean;
}

export interface PhaseResponseDto extends PhaseDTO {
  // Enhanced fields for UI
  phaseAnalytics?: {
    schedulePerformance: number;
    costPerformance: number;
    qualityScore: number;
    completionRate: number;
  };
  riskAssessment?: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    recommendations: string[];
  };
  dependencies?: Array<{
    id: string;
    name: string;
    status: string;
    isBlocking: boolean;
  }>;
  milestones?: Array<{
    id: string;
    name: string;
    status: 'pending' | 'completed' | 'delayed';
    dueDate: string;
    completedAt?: string;
  }>;
}

export interface CreatePhaseRequestDto extends Omit<PhaseDTO, 'id' | 'createdAt' | 'updatedAt'> {
  // Additional validation fields
  predecessorPhaseId?: string;
  requiredResources?: Array<{
    type: 'human' | 'material' | 'equipment';
    resourceId: string;
    quantity: number;
    duration: number;
  }>;
  qualityStandards?: Array<{
    standard: string;
    requirement: string;
    verificationMethod: string;
  }>;
}

export interface UpdatePhaseRequestDto extends Partial<CreatePhaseRequestDto> {
  // Update-specific fields
  statusChangeReason?: string;
  completionNotes?: string;
  delayReason?: string;
  blockerInfo?: {
    blockerType: string;
    blockerId: string;
    description: string;
  };
}

export class PhaseDomainTransformer implements EntityToDTOMapper<Phase, PhaseDTO> {
  
  toDTO(entity: Phase): PhaseDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      name: entity.name,
      description: entity.description,
      status: entity.status,
      progress: entity.progress,
      orderIndex: entity.orderIndex,
      startDate: entity.startDate?.toISOString() || '',
      endDate: entity.endDate?.toISOString() || '',
      estimatedCost: entity.estimatedCost,
      actualCost: entity.actualCost,
      constructionPhase: entity.constructionPhase,
      constructionStage: entity.constructionStage,
      steps: entity.steps.map(step => ({
        id: step.id,
        name: step.name,
        description: step.description,
        status: step.status,
        progress: step.progress,
        orderIndex: step.orderIndex,
        tasks: step.tasks.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description,
          status: task.status,
          progress: task.progress,
          orderIndex: task.orderIndex,
          assignedTo: task.assignedTo,
          requiresInspection: task.requiresInspection,
          requiresEngineerApproval: task.requiresEngineerApproval
        })),
        estimatedDurationDays: step.estimatedDurationDays,
        requiresInspection: step.requiresInspection,
        requiresEngineerApproval: step.requiresEngineerApproval
      })),
      createdAt: new Date().toISOString(), // Phase entity doesn't have createdAt
      updatedAt: new Date().toISOString()  // Phase entity doesn't have updatedAt
    };
  }

  fromDTO(dto: PhaseDTO): Phase {
    return new Phase(
      dto.id,
      dto.projectId,
      dto.name,
      dto.description,
      dto.status,
      dto.progress,
      dto.orderIndex,
      dto.startDate ? new Date(dto.startDate) : null,
      dto.endDate ? new Date(dto.endDate) : null,
      dto.estimatedCost,
      dto.actualCost,
      dto.constructionPhase,
      dto.constructionStage,
      dto.steps?.map(step => ({
        id: step.id,
        name: step.name,
        description: step.description,
        status: step.status,
        progress: step.progress,
        orderIndex: step.orderIndex,
        tasks: step.tasks?.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description,
          status: task.status,
          progress: task.progress,
          orderIndex: task.orderIndex,
          assignedTo: task.assignedTo || [],
          requiresInspection: task.requiresInspection || false,
          requiresEngineerApproval: task.requiresEngineerApproval || false
        })) || [],
        estimatedDurationDays: step.estimatedDurationDays,
        requiresInspection: step.requiresInspection || false,
        requiresEngineerApproval: step.requiresEngineerApproval || false
      })) || []
    );
  }

  fromEntityToDTO(entity: Phase): PhaseResponseDto {
    const baseDTO = this.toDTO(entity);
    
    // Add enhanced UI features
    return {
      ...baseDTO,
      phaseAnalytics: this.calculatePhaseAnalytics(entity),
      riskAssessment: this.assessPhaseRisk(entity),
      dependencies: [], // Would fetch from phase service
      milestones: [] // Would fetch from phase service
    };
  }

  fromDtosToAdapter(dtos: PhaseDTO[]): PhaseResponseDto[] {
    return dtos.map(dto => this.fromEntityToDTO(this.fromDTO(dto)));
  }

  toResponseDto(entity: Phase): PhaseResponseDto {
    return this.fromEntityToDTO(entity);
  }

  toRequestDto(dto: CreatePhaseRequestDto): PhaseDTO {
    return {
      ...dto,
      id: '', // Will be generated
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending' as PhaseStatus
    };
  }

  toUpdateDto(dto: UpdatePhaseRequestDto): Partial<PhaseDTO> {
    return {
      ...dto,
      updatedAt: new Date().toISOString()
    };
  }

  validate(dto: PhaseDTO): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Required fields validation
    if (!dto.name || dto.name.trim() === '') {
      errors.push('Phase name is required');
      fieldErrors.name = ['Phase name is required'];
    }

    if (!dto.projectId || dto.projectId.trim() === '') {
      errors.push('Project ID is required');
      fieldErrors.projectId = ['Project ID is required'];
    }

    // Progress validation
    if (dto.progress < 0 || dto.progress > 100) {
      errors.push('Progress must be between 0 and 100');
      fieldErrors.progress = ['Progress must be between 0 and 100'];
    }

    // Cost validation
    if (dto.estimatedCost < 0) {
      errors.push('Estimated cost must be greater than or equal to 0');
      fieldErrors.estimatedCost = ['Estimated cost must be greater than or equal to 0'];
    }

    if (dto.actualCost < 0) {
      errors.push('Actual cost must be greater than or equal to 0');
      fieldErrors.actualCost = ['Actual cost must be greater than or equal to 0'];
    }

    // Order validation
    if (dto.orderIndex < 0) {
      errors.push('Order index must be greater than or equal to 0');
      fieldErrors.orderIndex = ['Order index must be greater than or equal to 0'];
    }

    // Date validation
    if (dto.startDate && dto.endDate) {
      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);
      if (start > end) {
        errors.push('Start date cannot be after end date');
        fieldErrors.startDate = ['Start date cannot be after end date'];
        fieldErrors.endDate = ['End date cannot be before start date'];
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  // Enhanced utility methods with calculations
  static calculatePhaseAnalytics(phase: Phase): any {
    const schedulePerformance = PhaseDomainTransformer.calculateSchedulePerformance(phase);
    const costPerformance = PhaseDomainTransformer.calculateCostPerformance(phase);
    const qualityScore = PhaseDomainTransformer.calculateQualityScore(phase);
    const completionRate = phase.progress;

    return {
      schedulePerformance,
      costPerformance,
      qualityScore,
      completionRate
    };
  }

  static assessPhaseRisk(phase: Phase): any {
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    let level: 'low' | 'medium' | 'high' = 'low';

    // Status-based risk
    if (phase.status === 'blocked') {
      riskFactors.push('Phase is blocked');
      recommendations.push('Resolve blockers immediately');
      level = 'high';
    }

    if (phase.status === 'delayed') {
      riskFactors.push('Phase is delayed');
      recommendations.push('Assess delay impact');
      level = 'high';
    }

    // Cost-based risk
    const costVariance = phase.actualCost - phase.estimatedCost;
    const costVariancePercentage = phase.estimatedCost > 0 ? (costVariance / phase.estimatedCost) * 100 : 0;
    
    if (costVariancePercentage > 20) {
      riskFactors.push('Significant cost overrun');
      recommendations.push('Review cost management');
      level = 'high';
    } else if (costVariancePercentage > 10) {
      riskFactors.push('Cost overrun detected');
      recommendations.push('Monitor expenses closely');
      level = 'medium';
    }

    // Progress-based risk
    if (phase.progress < 25 && phase.status === 'in_progress') {
      riskFactors.push('Low progress despite active status');
      recommendations.push('Review phase execution');
      level = 'medium';
    }

    return {
      level,
      factors: riskFactors,
      recommendations
    };
  }

  static calculateSchedulePerformance(phase: Phase): number {
    if (!phase.startDate || !phase.endDate) {
      return 100; // Default if no dates
    }

    const start = new Date(phase.startDate);
    const end = new Date(phase.endDate);
    const plannedDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Simplified - would need actual completion data
    return 85; // Default performance score
  }

  static calculateCostPerformance(phase: Phase): number {
    if (phase.estimatedCost === 0) {
      return 100; // Default if no estimated cost
    }

    const costEfficiency = (phase.estimatedCost / phase.actualCost) * 100;
    return Math.min(100, Math.max(0, costEfficiency));
  }

  static calculateQualityScore(phase: Phase): number {
    let score = 50; // Base score

    // Status contribution (40%)
    switch (phase.status) {
      case 'completed':
        score += 40;
        break;
      case 'in_progress':
        score += 25;
        break;
      case 'delayed':
        score -= 10;
        break;
      case 'blocked':
        score -= 20;
        break;
    }

    // Progress contribution (30%)
    if (phase.progress >= 90) {
      score += 30;
    } else if (phase.progress >= 75) {
      score += 20;
    } else if (phase.progress >= 50) {
      score += 10;
    }

    // Cost performance contribution (30%)
    const costPerformance = PhaseDomainTransformer.calculateCostPerformance(phase);
    if (costPerformance >= 90) {
      score += 30;
    } else if (costPerformance >= 80) {
      score += 20;
    } else if (costPerformance >= 70) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  static generatePhaseReport(phase: Phase): any {
    const analytics = PhaseDomainTransformer.calculatePhaseAnalytics(phase);
    const risk = PhaseDomainTransformer.assessPhaseRisk(phase);

    return {
      phaseInfo: {
        id: phase.id,
        name: phase.name,
        status: phase.status,
        progress: phase.progress,
        orderIndex: phase.orderIndex
      },
      analytics,
      risk,
      recommendations: PhaseDomainTransformer.generatePhaseRecommendations(phase, analytics, risk),
      generatedAt: new Date().toISOString()
    };
  }

  static generatePhaseRecommendations(phase: Phase, analytics: any, risk: any): string[] {
    const recommendations: string[] = [];

    if (risk.level === 'high') {
      recommendations.push('Immediate attention required');
    }

    if (analytics.costPerformance < 80) {
      recommendations.push('Review cost management');
    }

    if (phase.progress < 50 && phase.status === 'in_progress') {
      recommendations.push('Accelerate phase execution');
    }

    if (phase.steps.length === 0) {
      recommendations.push('Define phase steps and tasks');
    }

    return recommendations;
  }

  static formatPhaseDuration(startDate: string, endDate: string): string {
    if (!startDate || !endDate) {
      return 'N/A';
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (days < 30) {
      return `${days} jours`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      return `${months} mois ${remainingDays > 0 ? remainingDays + ' jours' : ''}`;
    } else {
      const years = Math.floor(days / 365);
      const remainingDays = days % 365;
      return `${years} an${remainingDays > 0 ? ' ' + remainingDays + ' jours' : ''}`;
    }
  }

  static getPhaseStatusColor(status: PhaseStatus): string {
    switch (status) {
      case 'pending': return '#6B7280'; // Gray
      case 'in_progress': return '#3B82F6'; // Blue
      case 'completed': return '#10B981'; // Green
      case 'blocked': return '#EF4444'; // Red
      case 'delayed': return '#F59E0B'; // Amber
      default: return '#9CA3AF'; // Medium Gray
    }
  }

  static validatePhaseWorkflow(phase: Phase, workflow: any): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    if (workflow.requiresInspection && !phase.steps.some(step => step.requiresInspection)) {
      errors.push('Phase requires inspection steps');
      fieldErrors.steps = ['Inspection steps required'];
    }

    if (workflow.requiresEngineerApproval && !phase.steps.some(step => step.requiresEngineerApproval)) {
      errors.push('Phase requires engineer approval steps');
      fieldErrors.steps = ['Engineer approval steps required'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  static calculatePhaseMetrics(phases: Phase[]): ProgressAnalytics {
    const totalPhases = phases.length;
    const completedPhases = phases.filter(p => p.status === 'completed').length;
    const inProgressPhases = phases.filter(p => p.status === 'in_progress').length;
    const delayedPhases = phases.filter(p => p.status === 'delayed').length;
    const pendingPhases = phases.filter(p => p.status === 'pending').length;

    const overallProgress = totalPhases > 0 
      ? phases.reduce((sum, p) => sum + p.progress, 0) / totalPhases 
      : 0;

    return {
      overallProgress,
      phaseProgress: phases.reduce((acc, phase) => {
        acc[phase.id] = phase.progress;
        return acc;
      }, {} as Record<string, number>),
      taskProgress: {}, // Would group by tasks within phases
      delayedTasksCount: delayedPhases,
      completedTasksCount: completedPhases,
      tasksInProgressCount: inProgressPhases,
      pendingTasksCount: pendingPhases
    };
  }

  static generatePhaseTimeline(phases: Phase[]): TimelineAnalytics {
    const today = new Date();
    const activePhases = phases.filter(p => p.status === 'in_progress');
    
    return {
      projectDuration: 0, // Would calculate from project
      elapsedDays: 0, // Would calculate from project
      remainingDays: 0, // Would calculate from project
      scheduleVariance: 0, // Would calculate from plan vs actual
      criticalPathTasks: [], // Would calculate from dependencies
      delayedTasks: phases.filter(p => p.status === 'delayed').map(p => p.id),
      upcomingDeadlines: [] // Would calculate from phase end dates
    };
  }
}
