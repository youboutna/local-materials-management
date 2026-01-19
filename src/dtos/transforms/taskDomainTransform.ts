/**
 * Task Domain Transformer - Enhanced with Calculations and Business Logic
 * Integrates task calculations, validation, and UI-specific features
 * Following hexagonal architecture principles
 */

import { Task, TaskStatus, TaskPriority } from '@/domain/entities/Task';
import { TaskDTO, TaskAssignmentDTO, TaskSummaryDTO } from '@/dtos/entities/TaskDTO';
import { BaseEntityDTO, EntityToDTOMapper, ValidationResult } from '@/dtos/shared';
import { ProgressAnalytics, TimelineAnalytics, ResourceUtilization } from '@/types/calculations';

// Enhanced types for UI components
export interface TaskResponseDto extends TaskDTO {
  // Enhanced fields for UI
  taskAnalytics?: {
    timeEfficiency: number;
    costEfficiency: number;
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
    title: string;
    status: string;
    isBlocking: boolean;
  }>;
  assigneeDetails?: Array<{
    id: string;
    name: string;
    workload: number;
    availability: number;
  }>;
}

export interface CreateTaskRequestDto extends Omit<TaskDTO, 'id' | 'createdAt' | 'updatedAt'> {
  // Additional validation fields
  checklist?: Array<{
    item: string;
    required: boolean;
    completed: boolean;
  }>;
  attachments?: Array<{
    type: string;
    name: string;
    url: string;
  }>;
  estimatedResources?: Array<{
    type: 'human' | 'material' | 'equipment';
    resourceId: string;
    quantity: number;
    duration: number;
  }>;
}

export interface UpdateTaskRequestDto extends Partial<CreateTaskRequestDto> {
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

export class TaskDomainTransformer implements EntityToDTOMapper<Task, TaskDTO> {
  
  toDTO(entity: Task): TaskDTO {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description || '',
      assignedTo: entity.assignedTo,
      status: entity.status,
      progress: entity.progress,
      startDate: entity.startDate || '',
      endDate: entity.endDate || '',
      estimatedDuration: entity.estimatedDuration || 0,
      actualDuration: entity.actualDuration || undefined,
      costEstimate: 0, // Would calculate from resources
      actualCost: undefined, // Would calculate from actual work
      priority: entity.priority,
      projectId: entity.projectId,
      phaseId: entity.phaseId || undefined,
      assigneeName: '', // Would fetch from user service
      dueDate: entity.dueDate || undefined,
      completedAt: entity.completionDate || undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  fromDTO(dto: TaskDTO): Task {
    return new Task(
      dto.id,
      dto.projectId || '',
      dto.phaseId || null,
      null, // stepId - not in DTO
      dto.title,
      dto.description,
      dto.status,
      dto.priority || 'medium',
      dto.progress,
      dto.assignedTo,
      dto.assignedBy || null,
      dto.startDate || null,
      dto.endDate || null,
      dto.dueDate || null,
      dto.completedAt || null,
      dto.estimatedDuration || null,
      dto.actualDuration || null,
      [], // dependencies - not in DTO
      dto.notes || null,
      dto.createdAt,
      dto.updatedAt
    );
  }

  fromEntityToDTO(entity: Task): TaskResponseDto {
    const baseDTO = this.toDTO(entity);
    
    // Add enhanced UI features
    return {
      ...baseDTO,
      taskAnalytics: this.calculateTaskAnalytics(entity),
      riskAssessment: this.assessTaskRisk(entity),
      dependencies: [], // Would fetch from task service
      assigneeDetails: [] // Would fetch from user service
    };
  }

  fromDtosToAdapter(dtos: TaskDTO[]): TaskResponseDto[] {
    return dtos.map(dto => this.fromEntityToDTO(this.fromDTO(dto)));
  }

  toResponseDto(entity: Task): TaskResponseDto {
    return this.fromEntityToDTO(entity);
  }

  toRequestDto(dto: CreateTaskRequestDto): TaskDTO {
    return {
      ...dto,
      id: '', // Will be generated
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'not_started' as TaskStatus
    };
  }

  toUpdateDto(dto: UpdateTaskRequestDto): Partial<TaskDTO> {
    return {
      ...dto,
      updatedAt: new Date().toISOString()
    };
  }

  validate(dto: TaskDTO): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Required fields validation
    if (!dto.title || dto.title.trim() === '') {
      errors.push('Task title is required');
      fieldErrors.title = ['Task title is required'];
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

    // Duration validation
    if (dto.estimatedDuration && dto.estimatedDuration <= 0) {
      errors.push('Estimated duration must be greater than 0');
      fieldErrors.estimatedDuration = ['Estimated duration must be greater than 0'];
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

    // Due date validation
    if (dto.dueDate) {
      const due = new Date(dto.dueDate);
      const today = new Date();
      if (due < today) {
        errors.push('Due date cannot be in the past');
        fieldErrors.dueDate = ['Due date cannot be in the past'];
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  // Enhanced utility methods with calculations
  static calculateTaskAnalytics(task: Task): any {
    const timeEfficiency = TaskDomainTransformer.calculateTimeEfficiency(task);
    const costEfficiency = TaskDomainTransformer.calculateCostEfficiency(task);
    const qualityScore = TaskDomainTransformer.calculateQualityScore(task);
    const completionRate = task.progress;

    return {
      timeEfficiency,
      costEfficiency,
      qualityScore,
      completionRate
    };
  }

  static assessTaskRisk(task: Task): any {
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    let level: 'low' | 'medium' | 'high' = 'low';

    // Priority-based risk
    if (task.priority === 'urgent') {
      riskFactors.push('High priority task');
      recommendations.push('Monitor closely');
      level = 'medium';
    }

    // Status-based risk
    if (task.status === 'blocked') {
      riskFactors.push('Task is blocked');
      recommendations.push('Resolve blockers immediately');
      level = 'high';
    }

    if (task.status === 'delayed') {
      riskFactors.push('Task is delayed');
      recommendations.push('Assess delay impact');
      level = 'high';
    }

    // Due date-based risk
    if (task.dueDate) {
      const today = new Date();
      const dueDate = new Date(task.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue < 0) {
        riskFactors.push('Task is overdue');
        recommendations.push('Immediate attention required');
        level = 'high';
      } else if (daysUntilDue <= 3) {
        riskFactors.push('Task due soon');
        recommendations.push('Prioritize completion');
        level = 'medium';
      }
    }

    // Progress-based risk
    if (task.progress < 25 && task.status === 'in_progress') {
      riskFactors.push('Low progress despite active status');
      recommendations.push('Review task execution');
      level = 'medium';
    }

    return {
      level,
      factors: riskFactors,
      recommendations
    };
  }

  static calculateTimeEfficiency(task: Task): number {
    if (!task.estimatedDuration || !task.actualDuration) {
      return 100; // Default if no duration data
    }

    return Math.min(100, Math.max(0, (task.estimatedDuration / task.actualDuration) * 100));
  }

  static calculateCostEfficiency(task: Task): number {
    // Simplified - would need actual cost data
    return 85; // Default efficiency score
  }

  static calculateQualityScore(task: Task): number {
    let score = 50; // Base score

    // Status contribution (40%)
    switch (task.status) {
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
    if (task.progress >= 90) {
      score += 30;
    } else if (task.progress >= 75) {
      score += 20;
    } else if (task.progress >= 50) {
      score += 10;
    }

    // Timeliness contribution (30%)
    if (task.dueDate) {
      const completedDate = task.completionDate ? new Date(task.completionDate) : new Date();
      const dueDate = new Date(task.dueDate);
      
      if (completedDate <= dueDate) {
        score += 30;
      } else {
        const daysLate = Math.ceil((completedDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLate <= 1) {
          score += 20;
        } else if (daysLate <= 3) {
          score += 10;
        }
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  static generateTaskReport(task: Task): any {
    const analytics = TaskDomainTransformer.calculateTaskAnalytics(task);
    const risk = TaskDomainTransformer.assessTaskRisk(task);

    return {
      taskInfo: {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        progress: task.progress,
        assignees: task.assignedTo
      },
      analytics,
      risk,
      recommendations: TaskDomainTransformer.generateTaskRecommendations(task, analytics, risk),
      generatedAt: new Date().toISOString()
    };
  }

  static generateTaskRecommendations(task: Task, analytics: any, risk: any): string[] {
    const recommendations: string[] = [];

    if (risk.level === 'high') {
      recommendations.push('Immediate attention required');
    }

    if (analytics.timeEfficiency < 70) {
      recommendations.push('Review time estimation and execution');
    }

    if (task.progress < 50 && task.status === 'in_progress') {
      recommendations.push('Focus on task completion');
    }

    if (task.assignedTo.length === 0) {
      recommendations.push('Assign task to team member');
    }

    return recommendations;
  }

  static formatTaskDuration(duration: number): string {
    if (duration < 8) {
      return `${duration}h`;
    } else if (duration < 40) {
      const days = Math.floor(duration / 8);
      const hours = duration % 8;
      return `${days}j ${hours}h`;
    } else {
      const weeks = Math.floor(duration / 40);
      const remainingDays = duration % 40;
      return `${weeks}s ${remainingDays}j`;
    }
  }

  static getTaskStatusColor(status: TaskStatus): string {
    switch (status) {
      case 'not_started': return '#6B7280'; // Gray
      case 'in_progress': return '#3B82F6'; // Blue
      case 'completed': return '#10B981'; // Green
      case 'delayed': return '#F59E0B'; // Amber
      case 'blocked': return '#EF4444'; // Red
      case 'cancelled': return '#6B7280'; // Gray
      default: return '#9CA3AF'; // Medium Gray
    }
  }

  static getTaskPriorityColor(priority: TaskPriority): string {
    switch (priority) {
      case 'urgent': return '#DC2626'; // Red
      case 'high': return '#EA580C'; // Orange
      case 'medium': return '#D97706'; // Amber
      case 'low': return '#65A30D'; // Lime
      default: return '#6B7280'; // Gray
    }
  }

  static validateTaskWorkflow(task: Task, workflow: any): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    if (workflow.requiresApproval && task.priority !== 'urgent') {
      errors.push('Task requires urgent priority for approval');
      fieldErrors.priority = ['Urgent priority required'];
    }

    if (workflow.requiresMultipleAssignees && task.assignedTo.length < 2) {
      errors.push('Task requires multiple assignees');
      fieldErrors.assignedTo = ['Multiple assignees required'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  static calculateTaskMetrics(tasks: Task[]): ProgressAnalytics {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const delayedTasks = tasks.filter(t => t.status === 'delayed').length;
    const pendingTasks = tasks.filter(t => t.status === 'not_started').length;

    const overallProgress = totalTasks > 0 
      ? tasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks 
      : 0;

    return {
      overallProgress,
      phaseProgress: {}, // Would group by phase
      taskProgress: tasks.reduce((acc, task) => {
        acc[task.id] = task.progress;
        return acc;
      }, {} as Record<string, number>),
      delayedTasksCount: delayedTasks,
      completedTasksCount: completedTasks,
      tasksInProgressCount: inProgressTasks,
      pendingTasksCount: pendingTasks
    };
  }

  static generateTaskTimeline(tasks: Task[]): TimelineAnalytics {
    const today = new Date();
    const upcomingDeadlines = tasks
      .filter(task => task.dueDate && new Date(task.dueDate) > today)
      .map(task => ({
        taskId: task.id,
        taskName: task.title,
        deadline: task.dueDate!,
        daysRemaining: Math.ceil((new Date(task.dueDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    const delayedTasks = tasks
      .filter(task => task.status === 'delayed')
      .map(task => task.id);

    return {
      projectDuration: 0, // Would calculate from project
      elapsedDays: 0, // Would calculate from project
      remainingDays: 0, // Would calculate from project
      scheduleVariance: 0, // Would calculate from plan vs actual
      criticalPathTasks: [], // Would calculate from dependencies
      delayedTasks,
      upcomingDeadlines
    };
  }
}
