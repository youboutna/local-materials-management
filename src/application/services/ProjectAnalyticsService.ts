/**
 * Project Analytics Service - Hexagonal Architecture
 * Business logic for project analytics and metrics
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import { ProjectCalculationService } from '@/services/ProjectCalculationService';

// Service DTOs for data exchange
export interface ProjectAnalyticsDTO {
  project_id: string;
  total_budget: number;
  actual_cost: number;
  budget_variance: number;
  remaining_budget: number;
  progress_percentage: number;
  milestone_completion: number;
  risk_score: number;
  quality_score: number;
  timeline_variance: number;
  resource_utilization: number;
  cost_efficiency: number;
  schedule_performance: number;
  stakeholder_satisfaction: number;
  last_updated: string;
  cpi: number;
}

export interface ProjectMetricsDTO {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  total_milestones: number;
  completed_milestones: number;
  total_risks: number;
  high_risks: number;
  medium_risks: number;
  low_risks: number;
  total_issues: number;
  open_issues: number;
  resolved_issues: number;
}

export interface ProjectRiskDTO {
  id: string;
  project_id: string;
  risk_title: string;
  risk_description: string;
  risk_category: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  risk_score: number;
  mitigation_strategy: string;
  status: 'active' | 'mitigated' | 'closed';
  identified_date: string;
  target_resolution_date?: string;
  assigned_to?: string;
}

export interface ProjectProgressDTO {
  overall_progress: number;
  phases_progress: Array<{
    phase_name: string;
    progress: number;
    status: string;
  }>;
  timeline_progress: Array<{
    date: string;
    planned_progress: number;
    actual_progress: number;
  }>;
}

export interface ProjectCostAnalysisDTO {
  total_budget: number;
  actual_cost: number;
  committed_cost: number;
  remaining_budget: number;
  cost_variance: number;
  cost_performance_index: number;
  estimate_at_completion: number;
  variance_at_completion: number;
  cost_breakdown: Array<{
    category: string;
    budgeted_cost: number;
    actual_cost: number;
    variance: number;
  }>;
}

export interface ProjectComplianceDTO {
  compliance_score: number;
  regulatory_compliance: number;
  safety_compliance: number;
  quality_compliance: number;
  documentation_compliance: number;
  last_audit_date: string;
  next_audit_date: string;
  compliance_issues: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    due_date: string;
  }>;
}

export interface CreateProjectRiskRequestDto {
  project_id: string;
  risk_title: string;
  risk_description: string;
  risk_category: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation_strategy: string;
  target_resolution_date?: string;
  assigned_to?: string;
}

export interface UpdateProjectRiskRequestDto {
  risk_title?: string;
  risk_description?: string;
  risk_category?: string;
  probability?: 'low' | 'medium' | 'high';
  impact?: 'low' | 'medium' | 'high';
  mitigation_strategy?: string;
  status?: 'active' | 'mitigated' | 'closed';
  target_resolution_date?: string;
  assigned_to?: string;
}

export class ProjectAnalyticsService {
  constructor(
    private projectRepository: IProjectRepository = RepositoryFactory.getProjectRepository(),
    private inspectionRepository: IInspectionRepository = RepositoryFactory.getInspectionRepository()
  ) {}

  /**
   * Get comprehensive project analytics
   */
  async getProjectAnalytics(projectId: string): Promise<ProjectAnalyticsDTO> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // Get project with all related data using the correct repository method
      const projectData = await this.projectRepository.findWithRelatedData(projectId);
      
      if (!projectData.project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }

      // Get inspections using the correct repository method
      const inspections = await this.inspectionRepository.findByProjectId(projectId);
      const projectInspections = inspections.map((inspection) => {
        return {
          id: inspection.id,
          title: `Inspection ${inspection.id}`,
          description: inspection.comments || '',
          date: inspection.date,
          status: inspection.status || 'pending',
          progress_at_inspection: inspection.progressAtInspection || 0,
          issues: [] // Inspection entity doesn't have issues, using empty array
        };
      });

      // Build comprehensive project DTO for calculations
      const projectDetailDTO: ProjectDetailDTO = {
        id: projectData.project.id,
        title: projectData.project.title,
        description: projectData.project.description || '',
        location: projectData.project.location || '',
        status: projectData.project.status || 'en cours',
        progress: projectData.project.progress || 0,
        budget: projectData.project.budget || 0,
        startDate: projectData.project.startDate?.toISOString() || new Date().toISOString(),
        endDate: projectData.project.endDate?.toISOString(),
        thumbnail: projectData.project.thumbnail || '',
        teamSize: projectData.project.teamSize || 0,
        tasks: projectData.tasks || [],
        risks: projectData.risks || [],
        resources: [], // Adding missing required property
        inspections: projectInspections,
        plannedPhases: [], // Adding missing required property
        expenses: projectData.payments || []
      };

      // Use ProjectCalculationService for real analytics
      const progressAnalytics = ProjectCalculationService.calculateProgressAnalytics(projectDetailDTO);
      const budgetAnalytics = ProjectCalculationService.calculateBudgetAnalytics(projectDetailDTO);
      const timelineAnalytics = ProjectCalculationService.calculateTimelineAnalytics(projectDetailDTO);
      const qualityMetrics = ProjectCalculationService.calculateQualityMetrics(projectDetailDTO);
      const riskAnalytics = ProjectCalculationService.calculateRiskAnalytics(projectDetailDTO);

      // Build comprehensive analytics object
      const analytics = {
        progress: progressAnalytics,
        budget: budgetAnalytics,
        timeline: timelineAnalytics,
        quality: qualityMetrics,
        risk: riskAnalytics,
        evm: {
          plannedValue: budgetAnalytics.estimatedTotalCost * (progressAnalytics.overallProgress / 100),
          earnedValue: budgetAnalytics.estimatedTotalCost * (progressAnalytics.overallProgress / 100),
          actualCost: budgetAnalytics.spentAmount,
          schedulePerformanceIndex: 1.0, // Simplified
          costPerformanceIndex: budgetAnalytics.budgetUtilization > 0 ? 100 / budgetAnalytics.budgetUtilization : 1.0,
          scheduleVariance: 0, // Simplified
          costVariance: budgetAnalytics.costVariance
        },
        kpis: {
          totalTasks: progressAnalytics.completedTasksCount + progressAnalytics.tasksInProgressCount + progressAnalytics.pendingTasksCount,
          completedTasks: progressAnalytics.completedTasksCount,
          delayedTasks: progressAnalytics.delayedTasksCount,
          budgetUtilization: budgetAnalytics.budgetUtilization,
          costVariance: budgetAnalytics.costVariance,
          remainingBudget: budgetAnalytics.remainingBudget,
          scheduleVariance: timelineAnalytics.scheduleVariance,
          spi: 1.0, // Simplified
          cpi: budgetAnalytics.budgetUtilization > 0 ? 100 / budgetAnalytics.budgetUtilization : 1.0,
          earnedValue: budgetAnalytics.estimatedTotalCost * (progressAnalytics.overallProgress / 100),
          healthScore: 75, // Simplified
          healthBudget: budgetAnalytics.budgetUtilization < 90 ? 85 : 60,
          healthSchedule: timelineAnalytics.scheduleVariance > -5 ? 80 : 50,
          healthQuality: qualityMetrics.inspectionPassRate
        },
        health: {
          overall: 75, // Simplified calculation
          budget: budgetAnalytics.budgetUtilization < 90 ? 85 : 60,
          schedule: timelineAnalytics.scheduleVariance > -5 ? 80 : 50,
          quality: qualityMetrics.inspectionPassRate
        }
      };

      return {
        project_id: projectId,
        total_budget: analytics.budget,
        actual_cost: analytics.actualCost,
        budget_variance: analytics.budgetVariance,
        remaining_budget: analytics.remainingBudget,
        progress_percentage: analytics.progress,
        milestone_completion: analytics.milestoneCompletion,
        risk_score: analytics.riskScore,
        quality_score: analytics.qualityScore,
        timeline_variance: analytics.timelineVariance,
        resource_utilization: analytics.resourceUtilization,
        cost_efficiency: analytics.costEfficiency,
        schedule_performance: analytics.schedulePerformance,
        stakeholder_satisfaction: analytics.stakeholderSatisfaction,
        last_updated: new Date().toISOString(),
        cpi: analytics.cpi
      };
    } catch (error) {
      console.error('ProjectAnalyticsService.getProjectAnalytics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project analytics');
    }
  }

  /**
   * Get project metrics
   */
  async getProjectMetrics(projectId: string): Promise<ProjectMetricsDTO> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // Get project data for metrics
      const projectData = await this.projectRepository.findWithRelatedData(projectId);
      
      if (!projectData.project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }

      const tasks = projectData.tasks || [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((task: any) => task.status === 'completed').length;
      const pendingTasks = tasks.filter((task: any) => task.status === 'not_started').length;
      const overdueTasks = tasks.filter((task: any) => 
        task.status !== 'completed' && new Date(task.endDate || task.end_date) < new Date()
      ).length;

      // Get milestones
      const milestones = projectData.milestones || [];
      const totalMilestones = milestones.length;
      const completedMilestones = milestones.filter((milestone: any) => milestone.status === 'completed').length;

      // Get risks
      const risks = projectData.risks || [];
      const totalRisks = risks.length;
      const highRisks = risks.filter((risk: any) => 
        (risk.probability * risk.impact) >= 15 || risk.impact >= 4 || risk.probability >= 4
      ).length;
      const mediumRisks = risks.filter((risk: any) => {
        const score = risk.probability * risk.impact;
        return score >= 8 && score < 15;
      }).length;
      const lowRisks = risks.filter((risk: any) => (risk.probability * risk.impact) < 8).length;

      // Get issues from inspections
      const inspections = await this.inspectionRepository.findByProjectId(projectId);
      const allIssues = inspections.flatMap((inspection: any) => inspection.issues || []);
      const totalIssues = allIssues.length;
      const openIssues = allIssues.filter((issue: any) => issue.status !== 'resolved').length;
      const resolvedIssues = allIssues.filter((issue: any) => issue.status === 'resolved').length;
    } catch (error) {
      console.error('ProjectAnalyticsService.getProjectRisks failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project risks');
    }
  }

  /**
   * Get project cost analysis
   */
  async getProjectCostAnalysis(projectId: string): Promise<ProjectCostAnalysisDTO> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // For now, return mock cost analysis as cost repository is not available
      // TODO: Implement proper cost analysis when cost repository is available
      console.warn('ProjectAnalyticsService.getProjectCostAnalysis: Cost repository not available');
      
      const totalBudget = 1000000;
      const actualCost = 450000;
      const committedCost = 600000;
      const remainingBudget = totalBudget - actualCost;
      const costVariance = totalBudget - actualCost;
      const costPerformanceIndex = 1.1;
      const estimateAtCompletion = 900000;
      const varianceAtCompletion = 100000;

      return {
        total_budget: totalBudget,
        actual_cost: actualCost,
        committed_cost: committedCost,
        remaining_budget: remainingBudget,
        cost_variance: costVariance,
        cost_performance_index: costPerformanceIndex,
        estimate_at_completion: estimateAtCompletion,
        variance_at_completion: varianceAtCompletion,
        cost_breakdown: [
          { category: 'Labor', budgeted_cost: 400000, actual_cost: 200000, variance: 200000 },
          { category: 'Materials', budgeted_cost: 300000, actual_cost: 150000, variance: 150000 },
          { category: 'Equipment', budgeted_cost: 200000, actual_cost: 80000, variance: 120000 },
          { category: 'Overhead', budgeted_cost: 100000, actual_cost: 20000, variance: 80000 }
        ]
      };
    } catch (error) {
      console.error('ProjectAnalyticsService.getProjectCostAnalysis failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project cost analysis');
    }
  }

  /**
   * Update project analytics cache
   */
  async updateProjectAnalytics(projectId: string): Promise<void> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // For now, just log as analytics repository is not available
      // TODO: Implement proper analytics cache update when analytics repository is available
      console.warn('ProjectAnalyticsService.updateProjectAnalytics: Analytics repository not available');
      console.log(`Updating analytics for project: ${projectId}`);
    } catch (error) {
      console.error('ProjectAnalyticsService.updateProjectAnalytics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update project analytics');
    }
  }

  /**
   * Add a project risk
   */
  async addProjectRisk(risk: CreateProjectRiskRequestDto): Promise<ProjectRiskDTO> {
    try {
      if (!risk.project_id || !risk.risk_title || !risk.risk_category) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID, risk title and category are required');
      }

      // For now, return mock risk as risk repository is not available
      // TODO: Implement proper risk creation when risk repository is available
      console.warn('ProjectAnalyticsService.addProjectRisk: Risk repository not available');
      
      const newRisk: ProjectRiskDTO = {
        ...risk,
        id: `risk-${Date.now()}`,
        risk_score: this.calculateRiskScore(risk.probability, risk.impact),
        status: 'active',
        identified_date: new Date().toISOString()
      };

      return newRisk;
    } catch (error) {
      console.error('ProjectAnalyticsService.addProjectRisk failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to add project risk');
    }
  }

  /**
   * Update a project risk
   */
  async updateProjectRisk(riskId: string, updates: UpdateProjectRiskRequestDto): Promise<ProjectRiskDTO | null> {
    try {
      if (!riskId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Risk ID is required');
      }

      // For now, return mock updated risk as risk repository is not available
      // TODO: Implement proper risk update when risk repository is available
      console.warn('ProjectAnalyticsService.updateProjectRisk: Risk repository not available');
      
      const updatedRisk: ProjectRiskDTO = {
        id: riskId,
        project_id: 'unknown', // This would come from the repository in a real implementation
        risk_title: updates.risk_title || 'Updated Risk',
        risk_description: updates.risk_description || '',
        risk_category: updates.risk_category || 'General',
        probability: updates.probability || 'medium',
        impact: updates.impact || 'medium',
        risk_score: this.calculateRiskScore(updates.probability || 'medium', updates.impact || 'medium'),
        mitigation_strategy: updates.mitigation_strategy || '',
        status: updates.status || 'active',
        identified_date: new Date().toISOString(),
        target_resolution_date: updates.target_resolution_date,
        assigned_to: updates.assigned_to
      };

      return updatedRisk;
    } catch (error) {
      console.error('ProjectAnalyticsService.updateProjectRisk failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update project risk');
    }
  }

  /**
   * Delete a project risk
   */
  async deleteProjectRisk(riskId: string): Promise<boolean> {
    try {
      if (!riskId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Risk ID is required');
      }

      // For now, return true as risk repository is not available
      // TODO: Implement proper risk deletion when risk repository is available
      console.warn('ProjectAnalyticsService.deleteProjectRisk: Risk repository not available');
      console.log(`Deleting risk: ${riskId}`);
      
      return true;
    } catch (error) {
      console.error('ProjectAnalyticsService.deleteProjectRisk failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete project risk');
    }
  }

  /**
   * Get project compliance data
   */
  async getComplianceData(projectDetail: ProjectDetailDTO): Promise<ProjectComplianceDTO> {
    try {
      if (!projectDetail || !projectDetail.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project detail is required');
      }

      // For now, return mock compliance data as compliance repository is not available
      // TODO: Implement proper compliance retrieval when compliance repository is available
      console.warn('ProjectAnalyticsService.getComplianceData: Compliance repository not available');
      
      return {
        compliance_score: 87,
        regulatory_compliance: 92,
        safety_compliance: 85,
        quality_compliance: 90,
        documentation_compliance: 82,
        last_audit_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        next_audit_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
        compliance_issues: [
          {
            category: 'Documentation',
            severity: 'medium',
            description: 'Missing safety inspection reports for phase 2',
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            category: 'Quality',
            severity: 'low',
            description: 'Minor deviations in material specifications',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      };
    } catch (error) {
      console.error('ProjectAnalyticsService.getComplianceData failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get compliance data');
    }
  }

  /**
   * Calculate risk score based on probability and impact
   */
  private calculateRiskScore(probability: 'low' | 'medium' | 'high', impact: 'low' | 'medium' | 'high'): number {
    const probabilityScore = { low: 1, medium: 2, high: 3 }[probability];
    const impactScore = { low: 1, medium: 2, high: 3 }[impact];
    return probabilityScore * impactScore * 10;
  }
}
