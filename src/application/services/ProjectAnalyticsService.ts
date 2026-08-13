/**
 * Project Analytics Service - Hexagonal Architecture
 * Business logic for project analytics and metrics
 */

import { IInspectionRepository, IMilestoneRepository, IProjectRepository } from '@/domain/repositories';
import {
    ProjectAnalyticsDTO,
    ProjectMetricsDTO
} from '@/dtos/entities/ProjectAnalyticsDTO';
import { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// Local compliance DTO to avoid circular import
export interface ProjectComplianceDTO {
  complianceScore: number;
  regulatoryCompliance: number;
  safetyCompliance: number;
  qualityCompliance: number;
  documentationCompliance: number;
  lastAuditDate: string;
  nextAuditDate: string;
  complianceIssues: Array<{
    category: string;
    severity: string;
    description: string;
    dueDate: string;
  }>;
}

export class ProjectAnalyticsService {
  constructor(
    private projectRepository: IProjectRepository = RepositoryFactory.getProjectRepository(),
    private inspectionRepository: IInspectionRepository = RepositoryFactory.getInspectionRepository(),
    private milestoneRepository: IMilestoneRepository = RepositoryFactory.getMilestoneRepository()
  ) {}

  /**
   * Get comprehensive project analytics
   */
  async getProjectAnalytics(projectId: string): Promise<ProjectAnalyticsDTO> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const projectData = await this.projectRepository.findWithRelatedData(projectId);

      if (!projectData.project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }

      const tasks = projectData.tasks || [];
      const completedTasks = tasks.filter((task) => task.status === 'completed').length;
      const totalTasks = tasks.length;
      // Avancement réel : priorité au progress projet (calculé via phases), fallback ratio tâches.
      const projectProgress = Number((projectData.project as any).progress ?? 0);
      const overallProgress = projectProgress > 0
        ? projectProgress
        : (totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0);

      const budget = projectData.project.budget || 0;
      const payments = projectData.payments || [];
      const actualCost = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

      // --- EVM dérivé des vraies dates et progression ---
      const startDate = projectData.project.startDate ? new Date(projectData.project.startDate as any) : null;
      const endDate = (projectData.project as any).endDate ? new Date((projectData.project as any).endDate) : null;
      let plannedValue = 0;
      let timeProgressPct = 0;
      if (startDate && endDate) {
        const total = endDate.getTime() - startDate.getTime();
        const elapsed = Math.max(0, Date.now() - startDate.getTime());
        const ratio = total > 0 ? Math.min(1, elapsed / total) : 0;
        timeProgressPct = ratio * 100;
        plannedValue = budget * ratio;
      }
      const earnedValue = budget * (overallProgress / 100);
      const spi = plannedValue > 0 ? earnedValue / plannedValue : 1;
      const cpi = actualCost > 0 ? earnedValue / actualCost : 1;
      const timelineVariance = overallProgress - timeProgressPct;

      // --- Milestones réels ---
      let milestoneCompletion = 0;
      try {
        const milestones = await this.milestoneRepository.findByProjectId(projectId);
        if (milestones.length > 0) {
          const done = milestones.filter((m) => m.status === 'completed').length;
          milestoneCompletion = (done / milestones.length) * 100;
        }
      } catch { /* no-op */ }

      // --- Qualité réelle : taux de conformité des inspections ---
      let qualityScore = 0;
      try {
        const inspections = await this.inspectionRepository.findByProjectId(projectId);
        if (inspections.length > 0) {
          const passed = inspections.filter((i) => {
            const s = String((i as any).status || '').toLowerCase();
            return s === 'completed' || s === 'passed' || s === 'approved';
          }).length;
          qualityScore = (passed / inspections.length) * 100;
        }
      } catch { /* no-op */ }

      // --- Risque réel : moyenne pondérée probabilité × impact ---
      const risks = (projectData as any).risks || [];
      let riskScore = 0;
      if (risks.length > 0) {
        const sum = risks.reduce((acc: number, r: any) => {
          const p = String(r.probability || 'low').toLowerCase() as 'low' | 'medium' | 'high';
          const i = String(r.impact || 'low').toLowerCase() as 'low' | 'medium' | 'high';
          return acc + this.calculateRiskScore(p, i);
        }, 0);
        riskScore = Math.min(100, sum / risks.length);
      }

      // --- Utilisation ressources : tâches actives / capacité équipe ---
      const teamSize = projectData.project.teamSize || 0;
      const activeTasks = tasks.filter((t) => t.status === 'in_progress').length;
      const resourceUtilization = teamSize > 0 ? Math.min(100, (activeTasks / teamSize) * 100) : 0;

      return {
        title: projectData.project.title || '',
        description: projectData.project.description || '',
        status: (projectData.project.status as 'planning' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold') || 'en cours',
        progress: overallProgress,
        budget,
        location: projectData.project.location || '',
        startDate: projectData.project.startDate?.toISOString() || new Date().toISOString(),
        teamSize,
        currency: (projectData.project as any).currency || 'MRU',
        thumbnail: '',

        totalBudget: budget,
        actualCost,
        budgetVariance: budget - actualCost,
        remainingBudget: budget - actualCost,
        progressPercentage: overallProgress,
        milestoneCompletion,
        riskScore,
        qualityScore,
        timelineVariance,
        resourceUtilization,
        costEfficiency: budget > 0 ? (actualCost / budget) * 100 : 0,
        // SPI brut (0-1+) pour rester compatible avec les consommateurs existants (`>= 1`, `* 3`).
        schedulePerformance: spi,
        // Aucune source de feedback parties prenantes branchée : 0 plutôt qu'une valeur fictive.
        stakeholderSatisfaction: 0,
        lastUpdated: new Date().toISOString(),
        cpi,
        // Exposer EVM brut pour les widgets qui le consomment
        plannedValue,
        earnedValue,
        scheduleVariance: earnedValue - plannedValue,
        costVariance: earnedValue - actualCost,
      } as ProjectAnalyticsDTO;
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

      const projectData = await this.projectRepository.findWithRelatedData(projectId);
      
      if (!projectData.project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }

      const tasks = projectData.tasks || [];
      const totalTasks = tasks.length;
      const overdueTasks = tasks.filter((task) => 
        task.status !== 'completed' && new Date(task.endDate || '') < new Date()
      ).length;

      const milestones = await this.milestoneRepository.findByProjectId(projectId);
      const totalMilestones = milestones.length;
      const completedMilestones = milestones.filter((milestone) => milestone.status === 'completed').length;

      return {
        totalMilestones,
        completedMilestones,
        overdueTasks,
        totalItems: totalTasks,
        totalAmount: projectData.project?.budget || 0,
        averageItemPrice: 0,
        medianItemPrice: 0,
        categoryBreakdown: [],
        priceDistribution: {
          ranges: [],
          standardDeviation: 0,
          variance: 0
        },
        // Complexité normalisée sur les volumes réels (tâches, jalons, retards)
        // au lieu de paliers arbitraires 80/50/20.
        complexityScore: Math.min(
          100,
          Math.round(totalTasks * 2 + totalMilestones * 3 + overdueTasks * 5),
        )
      } as ProjectMetricsDTO;
    } catch (error) {
      console.error('ProjectAnalyticsService.getProjectMetrics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project metrics');
    }
  }

  /**
   * Get project cost analysis
   */
  async getProjectCostAnalysis(projectId: string): Promise<{
    totalBudget: number;
    actualCost: number;
    committedCost: number;
    remainingBudget: number;
    costVariance: number;
    costPerformanceIndex: number;
    estimateAtCompletion: number;
    varianceAtCompletion: number;
    costBreakdown: Array<{
      category: string;
      budgetedCost: number;
      actualCost: number;
      variance: number;
    }>;
  }> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const projectData = await this.projectRepository.findWithRelatedData(projectId);
      
      if (!projectData.project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }

      const totalBudget = projectData.project.budget || 0;
      const payments = projectData.payments || [];
      const actualCost = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const remainingBudget = totalBudget - actualCost;

      // EVM : délégation au moteur UNIQUE (EvmService) — aucun calcul local.
      const evm = EvmService.compute({
        budget: totalBudget,
        progress: Number((projectData.project as any).progress ?? 0),
        startDate: (projectData.project as any).startDate ?? null,
        endDate: (projectData.project as any).endDate ?? null,
        actualCost,
        phases: ((projectData as any).phases || []) as any[],
      });
      const costPerformanceIndex = evm.costPerformanceIndex ?? 0;
      const costVariance = evm.costVariance ?? 0;
      const estimateAtCompletion = evm.estimateAtCompletion ?? totalBudget;
      const varianceAtCompletion = evm.varianceAtCompletion ?? 0;


      // Répartition réelle par catégorie (depuis payments.category), pas de split arbitraire
      const breakdownMap = new Map<string, { budgeted: number; actual: number }>();
      for (const p of payments) {
        const cat = String((p as any).category || 'Autre');
        const entry = breakdownMap.get(cat) || { budgeted: 0, actual: 0 };
        entry.actual += Number(p.amount || 0);
        breakdownMap.set(cat, entry);
      }
      const costBreakdown = Array.from(breakdownMap.entries()).map(([category, v]) => ({
        category,
        budgetedCost: v.budgeted,
        actualCost: v.actual,
        variance: v.budgeted - v.actual,
      }));

      return {
        totalBudget,
        actualCost,
        committedCost: actualCost,
        remainingBudget,
        costVariance,
        costPerformanceIndex,
        estimateAtCompletion,
        varianceAtCompletion,
        costBreakdown,
      };

    } catch (error) {
      console.error('ProjectAnalyticsService.getProjectCostAnalysis failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project cost analysis');
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

      const inspections = await this.inspectionRepository.findByProjectId(projectDetail.id);
      const passed = inspections.filter((i) => {
        const s = String((i as any).status || '').toLowerCase();
        return s === 'completed' || s === 'passed' || s === 'approved';
      }).length;
      const totalInspections = inspections.length;

      // Score de conformité réel : passés / total. 0 si aucune inspection (pas de valeur fictive).
      const complianceScore = totalInspections > 0
        ? Math.round((passed / totalInspections) * 100)
        : 0;

      // Catégories réelles : alertes non résolues classées par sévérité
      const alerts = ((projectDetail as any).alerts || []) as Array<any>;
      const complianceIssues = alerts
        .filter((a) => !a.resolved && !a.acknowledged)
        .map((a) => ({
          category: String(a.category || a.type || 'Autre'),
          severity: String(a.severity || 'low').toLowerCase(),
          description: String(a.message || a.description || ''),
          dueDate: a.dueDate || a.due_date || new Date().toISOString(),
        }));

      // Dates d'audit : tirées des inspections réelles (dernière complétée / prochaine planifiée)
      const completed = inspections
        .filter((i) => String((i as any).status || '').toLowerCase() === 'completed')
        .map((i) => new Date((i as any).completedAt || (i as any).updatedAt || (i as any).inspectionDate || 0).getTime())
        .filter((t) => t > 0)
        .sort((a, b) => b - a);
      const upcoming = inspections
        .map((i) => new Date((i as any).scheduledDate || (i as any).inspectionDate || 0).getTime())
        .filter((t) => t > Date.now())
        .sort((a, b) => a - b);

      return {
        complianceScore,
        regulatoryCompliance: complianceScore,
        safetyCompliance: complianceScore,
        qualityCompliance: complianceScore,
        documentationCompliance: complianceScore,
        lastAuditDate: completed[0] ? new Date(completed[0]).toISOString() : '',
        nextAuditDate: upcoming[0] ? new Date(upcoming[0]).toISOString() : '',
        complianceIssues,
      };
    } catch (error) {
      console.error('ProjectAnalyticsService.getComplianceData failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get compliance data');
    }
  }

  private calculateRiskScore(probability: 'low' | 'medium' | 'high', impact: 'low' | 'medium' | 'high'): number {
    const probabilityScore = { low: 1, medium: 2, high: 3 }[probability];
    const impactScore = { low: 1, medium: 2, high: 3 }[impact];
    return probabilityScore * impactScore * 10;
  }
}

let projectAnalyticsServiceInstance: ProjectAnalyticsService | null = null;
export function getProjectAnalyticsService(): ProjectAnalyticsService {
  if (!projectAnalyticsServiceInstance) {
    projectAnalyticsServiceInstance = new ProjectAnalyticsService();
  }
  return projectAnalyticsServiceInstance;
}
