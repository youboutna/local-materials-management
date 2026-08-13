import { ProjectCalculationService } from '@/application/services/ProjectCalculationService';
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import {
    ConstructionMilestoneDTO,
    CostCalculation,
    EnhancedPhaseDTO,
    FinancialMetricsDTO,
    ProjectAnalyticsDTO,
    ProjectReportDTO,
    ReportData,
    RiskAssessmentDTO
} from '@/dtos/types/reportTypes';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { ReportCalculations } from '@/utils/reportCalculations';

export class EnhancedReportingService {
  private reportingRepository = RepositoryFactory.getReportingRepository();

  /**
   * Generate complete project report with all enhanced calculations
   */
  static async generateCompleteProjectReport(project: ProjectDTO): Promise<{
    reportDTO: ProjectReportDTO;
    reportData: ReportData;
    costCalculation: CostCalculation;
    resourceUtilization: any;
    healthScore: any;
  }> {
    const instance = new EnhancedReportingService();
    return instance.generateCompleteProjectReportInstance(project);
  }

  private async generateCompleteProjectReportInstance(project: ProjectDTO): Promise<{
    reportDTO: ProjectReportDTO;
    reportData: ReportData;
    costCalculation: CostCalculation;
    resourceUtilization: any;
    healthScore: any;
  }> {
    try {
      const [
        reportDTO,
        realCosts,
        phases,
        inspections
      ] = await Promise.all([
        this.reportingRepository.transformProjectForReport(project),
        this.reportingRepository.calculateRealProjectCosts(project.id),
        this.reportingRepository.getProjectPhases(project.id),
        this.reportingRepository.getProjectInspections(project.id)
      ]);

      const phasesData = phases || [];
      const inspectionsData = inspections || [];
      
      const resourceUtilization = phasesData.length > 0 
        ? await ProjectCalculationService.calculatePhaseResourceUtilization(project.id, phasesData[0].id)
        : null;

      const costCalculation: CostCalculation = {
        totalBudget: project.budget || 0,
        spentAmount: realCosts.totalSpent,
        remainingBudget: (project.budget || 0) - realCosts.totalSpent,
        costVariance: realCosts.totalSpent - (project.budget || 0),
        estimatedCost: realCosts.estimatedCost,
        actualCost: realCosts.actualPhaseCost
      };

      const timelinePerformance = ProjectCalculationService.calculateTimelinePerformance(
        project, 
        phasesData
      );

      const qualityScore = EnhancedReportingService.calculateQualityFromInspections(inspectionsData);

      const budgetUtilization = project.budget > 0 ? (realCosts.totalSpent / project.budget) * 100 : 0;
      const healthScore = ProjectCalculationService.calculateProjectHealthScore(
        project.progress,
        budgetUtilization,
        timelinePerformance.completionRate || 0,
        qualityScore
      );

      const reportData: ReportData = {
        id: `report-${project.id}-${Date.now()}`,
        projectId: project.id,
        generatedAt: new Date(),
        financialSummary: {
          totalBudget: costCalculation.totalBudget,
          spentAmount: costCalculation.spentAmount,
          remainingBudget: costCalculation.remainingBudget,
          costVariance: costCalculation.costVariance
        },
        taskProgress: [],
        riskAssessment: reportDTO.riskAssessment?.risks?.map(risk => ({
          id: risk.id,
          title: risk.description,
          severity: String(risk.riskScore),
          status: risk.status
        })) || []
      };

      return {
        reportDTO,
        reportData,
        costCalculation,
        resourceUtilization,
        healthScore
      };
    } catch (error) {
      console.error('Error generating complete project report:', error);
      throw error;
    }
  }

  static async transformProjectForReport(project: ProjectDTO): Promise<ProjectReportDTO> {
    const [phases, milestones, analytics, financial, risks] = await Promise.all([
      this.fetchEnhancedPhases(project.id),
      this.fetchConstructionMilestones(project.id),
      this.calculateProjectAnalytics(project),
      this.calculateFinancialMetrics(project.id),
      this.assessProjectRisks(project)
    ]);

    return {
      project: project as any,
      phases,
      constructionMilestones: milestones,
      analytics,
      financialMetrics: financial,
      riskAssessment: risks
    };
  }

  private static async fetchEnhancedPhases(projectId: string): Promise<EnhancedPhaseDTO[]> {
    try {
      const { data: phasesData } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId);

      if (!phasesData || phasesData.length === 0) return [];

      return phasesData.map(phase => {
        const plannedDuration = phase.end_date && phase.start_date 
          ? Math.max(1, Math.ceil((new Date(phase.end_date).getTime() - new Date(phase.start_date).getTime()) / (1000 * 60 * 60 * 24)))
          : 30;
        
        const elapsedDuration = phase.start_date
          ? Math.ceil((new Date().getTime() - new Date(phase.start_date).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        
        const plannedProgress = Math.min(100, (elapsedDuration / plannedDuration) * 100);

        return {
          id: phase.id,
          name: phase.phase_name || phase.title || phase.name || '—',
          plannedProgress: Math.round(plannedProgress),
          actualProgress: phase.progress || 0,
          budget: phase.estimated_cost || 0,
          actualCost: phase.actual_cost || 0,
          startDate: new Date(phase.start_date || Date.now()),
          endDate: new Date(phase.end_date || Date.now()),
          status: this.mapPhaseStatus(phase.status),
          procurementStep: phase.construction_phase || 'preparation',
          projectId: phase.project_id,
          riskLevel: this.calculatePhaseRiskLevel(phase),
          dependencies: [],
          assignedTeam: []
        };
      });
    } catch (error) {
      console.error('Error fetching enhanced phases:', error);
      return [];
    }
  }

  private static async fetchConstructionMilestones(projectId: string): Promise<ConstructionMilestoneDTO[]> {
    try {
      const milestones = await RepositoryFactory.getMilestoneRepository().findByProjectId(projectId);

      if (milestones.length > 0) {
        return milestones.map(milestone => ({
          id: milestone.id,
          title: milestone.title,
          description: milestone.description || '',
          targetDate: new Date(milestone.targetDate || Date.now()),
          completionDate: milestone.completionDate ? new Date(milestone.completionDate) : undefined,
          status: this.mapMilestoneStatus(milestone.status || 'pending'),
          projectId: milestone.projectId,
          phaseId: milestone.phaseId || undefined,
          stage: this.inferConstructionStage(milestone.title),
          priority: this.inferMilestonePriority(milestone.title),
          completionPercentage: Math.round((milestone.weight || 0) * 100),
          blockers: [],
          dependencies: milestone.dependencies || []
        }));
      }

      return this.generateDefaultConstructionMilestones(projectId);
    } catch (error) {
      console.error('Error fetching construction milestones:', error);
      return this.generateDefaultConstructionMilestones(projectId);
    }
  }

  private static async calculateProjectAnalytics(project: ProjectDTO): Promise<ProjectAnalyticsDTO> {
    try {
      const phaseRepository = RepositoryFactory.getPhaseRepository();
      const paymentRepository = RepositoryFactory.getPaymentRepository();
      const inspectionRepository = RepositoryFactory.getInspectionRepository();
      
      const [phasesResponse, paymentsResponse, inspectionsResponse] = await Promise.all([
        phaseRepository.getPhasesByProjectId(project.id),
        paymentRepository.findByProjectId(project.id),
        inspectionRepository.findByProjectId(project.id)
      ]);

      const phasesData = phasesResponse || [];
      const paymentsData = paymentsResponse || [];
      const inspectionsData = inspectionsResponse || [];

      if (phasesData.length === 0) {
        return this.getDefaultAnalytics(project);
      }

      const actualCost = paymentsData.reduce((sum, p) => sum + (p.amount || 0), 0);
      const evmMetrics = ReportCalculations.calculateEVMMetrics(project as any, actualCost, phasesData as any);

      const onTimePerformance = this.calculateOnTimePerformance(phasesData);
      const budgetVariance = project.budget > 0 ? ((project.budget - actualCost) / project.budget) * 100 : 0;
      const qualityScore = this.calculateQualityFromInspections(inspectionsData);
      const teamEfficiency = this.calculateTeamEfficiency(project, phasesData);

      return {
        schedulePerformanceIndex: evmMetrics.schedulePerformanceIndex,
        costPerformanceIndex: evmMetrics.costPerformanceIndex,
        earnedValue: evmMetrics.earnedValue,
        plannedValue: evmMetrics.plannedValue,
        actualCost: evmMetrics.actualCost,
        budgetAtCompletion: evmMetrics.budgetAtCompletion,
        estimateAtCompletion: evmMetrics.estimateAtCompletion,
        estimateToComplete: evmMetrics.estimateToComplete,
        varianceAtCompletion: evmMetrics.varianceAtCompletion,
        onTimePerformance,
        budgetVariance,
        qualityScore,
        teamEfficiency
      };
    } catch (error) {
      console.error('Error calculating project analytics:', error);
      return this.getDefaultAnalytics(project);
    }
  }

  private static async calculateFinancialMetrics(projectId: string): Promise<FinancialMetricsDTO> {
    try {
      const paymentRepository = RepositoryFactory.getPaymentRepository();
      const bankGuaranteeRepository = RepositoryFactory.getBankGuaranteeRepository();
      const insuranceRepository = RepositoryFactory.getInsuranceRepository();
      const projectRepository = RepositoryFactory.getProjectRepository();
      
      const [payments, bankGuarantees, insurance, project] = await Promise.all([
        paymentRepository.findByProjectId(projectId),
        bankGuaranteeRepository.findByProjectId(projectId),
        insuranceRepository.getByProjectId(projectId),
        projectRepository.findById(projectId),
      ]);

      const paymentsData = payments || [];
      const projectData = project;

      const totalBudget = projectData?.budget || 0;
      const totalPaid = paymentsData.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const spentAmount = totalPaid;
      const remainingBudget = totalBudget - spentAmount;
      const costOverrun = Math.max(0, spentAmount - totalBudget);

      return {
        totalBudget,
        spentAmount,
        remainingBudget,
        costOverrun,
        paymentMilestones: paymentsData.map((p: any) => ({
          id: p.id,
          amount: p.amount,
          dueDate: new Date(p.paymentDate || new Date()),
          paidDate: new Date(p.paymentDate || new Date()),
          status: 'paid' as const,
          description: p.transactionId || `Payment ${p.id.slice(0, 8)}`
        })),
        bankGuarantees: (bankGuarantees || []).map((bg: any) => ({
          id: bg.id,
          type: bg.guarantee_type || bg.guaranteeType,
          amount: bg.guarantee_amount || bg.guaranteeAmount,
          issueDate: new Date(bg.issue_date || bg.issueDate),
          expiryDate: new Date(bg.expiry_date || bg.expiryDate),
          bankName: bg.bank_name || bg.bankName,
          status: bg.status as 'active' | 'expired' | 'claimed'
        })),
        insuranceCoverage: (insurance || []).map((ins: any) => ({
          id: ins.id,
          type: ins.coverage_type,
          coverage: ins.coverage_amount,
          provider: ins.insurance_company,
          validFrom: new Date(ins.valid_from),
          validUntil: new Date(ins.valid_until),
          status: ins.status as 'active' | 'expired'
        }))
      };
    } catch (error) {
      console.error('Error calculating financial metrics:', error);
      return {
        totalBudget: 0,
        spentAmount: 0,
        remainingBudget: 0,
        costOverrun: 0,
        paymentMilestones: [],
        bankGuarantees: [],
        insuranceCoverage: []
      };
    }
  }

  private static async assessProjectRisks(project: ProjectDTO): Promise<RiskAssessmentDTO> {
    const risks = this.generateRiskAssessment(project);
    
    return {
      overallRiskLevel: this.calculateOverallRiskLevel(risks),
      risks,
      mitigationStrategies: []
    };
  }

  private static mapPhaseStatus(status: string): 'planned' | 'in_progress' | 'completed' | 'delayed' {
    if (!status) return 'planned';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('completed') || statusLower === 'done' || statusLower === 'terminé') return 'completed';
    if (statusLower.includes('progress') || statusLower === 'in_progress' || statusLower === 'en_cours') return 'in_progress';
    if (statusLower.includes('delayed') || statusLower === 'retard' || statusLower === 'en_retard') return 'delayed';
    return 'planned';
  }

  private static mapMilestoneStatus(status: string): 'pending' | 'in_progress' | 'completed' | 'overdue' {
    switch (status) {
      case 'completed': return 'completed';
      case 'in_progress': return 'in_progress';
      case 'overdue': return 'overdue';
      default: return 'pending';
    }
  }

  private static calculatePhaseRiskLevel(phase: any): 'low' | 'medium' | 'high' {
    const progress = phase.progress || 0;
    const budget = phase.estimated_cost || 0;
    const actualCost = phase.actual_cost || 0;
    if (actualCost > budget * 1.2 || progress < 50) return 'high';
    if (actualCost > budget * 1.1 || progress < 75) return 'medium';
    return 'low';
  }

  private static inferConstructionStage(title: string): 'conception' | 'preparation' | 'execution' | 'validation' | 'livraison' {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('étude') || lowerTitle.includes('conception')) return 'conception';
    if (lowerTitle.includes('autorisation') || lowerTitle.includes('permis')) return 'preparation';
    if (lowerTitle.includes('travaux') || lowerTitle.includes('construction')) return 'execution';
    if (lowerTitle.includes('réception') || lowerTitle.includes('validation')) return 'validation';
    if (lowerTitle.includes('livraison') || lowerTitle.includes('remise')) return 'livraison';
    return 'execution';
  }

  private static inferMilestonePriority(title: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('critique') || lowerTitle.includes('réception')) return 'critical';
    if (lowerTitle.includes('important') || lowerTitle.includes('autorisation')) return 'high';
    if (lowerTitle.includes('secondaire')) return 'low';
    return 'medium';
  }

  private static getDefaultAnalytics(project: ProjectDTO): ProjectAnalyticsDTO {
    return {
      schedulePerformanceIndex: 1,
      costPerformanceIndex: 1,
      earnedValue: 0,
      plannedValue: 0,
      actualCost: 0,
      budgetAtCompletion: project.budget || 0,
      estimateAtCompletion: project.budget || 0,
      estimateToComplete: project.budget || 0,
      varianceAtCompletion: 0,
      onTimePerformance: 100,
      budgetVariance: 0,
      qualityScore: 0,
      teamEfficiency: 0
    };
  }

  private static calculateOnTimePerformance(phases: any[]): number {
    if (!phases || phases.length === 0) return 100;
    const onTimePhases = phases.filter(p => {
      if (p.status === 'completed') {
        const endDate = new Date(p.end_date);
        return new Date() <= endDate;
      }
      return false;
    }).length;
    return phases.length > 0 ? (onTimePhases / phases.length) * 100 : 100;
  }

  // Qualité issue des inspections réelles — 0 quand aucune inspection n'est
  // exploitable (plus de constante 85 qui simulait une qualité inexistante).
  private static calculateQualityFromInspections(inspections: any[]): number {
    if (!inspections || inspections.length === 0) return 0;
    const completedInspections = inspections.filter(i => i.status === 'completed' || i.status === 'approved');
    const approvedInspections = inspections.filter(i => i.status === 'approved');
    const rejectedInspections = inspections.filter(i => i.status === 'rejected');
    if (completedInspections.length === 0) return 0;
    const approvalRate = approvedInspections.length / completedInspections.length;
    const rejectionPenalty = (rejectedInspections.length / completedInspections.length) * 30;
    return Math.max(50, Math.min(100, (approvalRate * 100) - rejectionPenalty));
  }

  private static calculateTeamEfficiency(project: ProjectDTO, phases: any[]): number {
    if (!phases || phases.length === 0) return 90;
    const avgProgress = phases.reduce((sum, p) => sum + (p.progress || 0), 0) / phases.length;
    const expectedProgress = project.progress || 0;
    return Math.min(100, Math.max(50, (avgProgress / Math.max(expectedProgress, 1)) * 100));
  }

  private static generateDefaultConstructionMilestones(projectId: string): ConstructionMilestoneDTO[] {
    const baseDate = new Date();
    return [
      {
        id: `milestone-${projectId}-1`,
        title: 'Validation des études préliminaires',
        description: 'Validation des études de faisabilité et conception préliminaire',
        targetDate: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: 'pending' as const,
        projectId,
        stage: 'conception' as const,
        priority: 'critical' as const,
        completionPercentage: 0,
        blockers: [],
        dependencies: []
      },
      {
        id: `milestone-${projectId}-2`,
        title: 'Obtention des autorisations',
        description: 'Permis de construire et autorisations administratives',
        targetDate: new Date(baseDate.getTime() + 60 * 24 * 60 * 60 * 1000),
        status: 'pending' as const,
        projectId,
        stage: 'preparation' as const,
        priority: 'high' as const,
        completionPercentage: 0,
        blockers: [],
        dependencies: []
      }
    ];
  }

  private static generateRiskAssessment(project: ProjectDTO): any[] {
    const risks: any[] = [];
    if (project.progress < 50 && new Date() > new Date(project.startDate)) {
      risks.push({
        id: `risk-${project.id}-budget`,
        category: 'financial' as const,
        description: 'Risque de dépassement budgétaire',
        probability: 70,
        impact: 80,
        riskScore: 56,
        status: 'identified' as const
      });
    }
    return risks;
  }

  private static calculateOverallRiskLevel(risks: any[]): 'low' | 'medium' | 'high' | 'critical' {
    if (risks.length === 0) return 'low';
    const avgRiskScore = risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length;
    if (avgRiskScore > 70) return 'critical';
    if (avgRiskScore > 50) return 'high';
    if (avgRiskScore > 30) return 'medium';
    return 'low';
  }
}
