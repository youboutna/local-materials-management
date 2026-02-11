import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { supabase } from '@/integrations/supabase/client';
import { ProjectData } from '@/types/project';
import { ReportCalculations } from '@/utils/reportCalculations';
import { ProjectCalculationService } from '@/services/ProjectCalculationService';
import {
  ProjectReportDTO,
  EnhancedPhaseDTO,
  ConstructionMilestoneDTO,
  ProjectAnalyticsDTO,
  FinancialMetricsDTO,
  RiskAssessmentDTO,
  ReportData,
  CostCalculation
} from '@/types/reportTypes';

export class EnhancedReportingService {
  private reportingRepository = RepositoryFactory.getReportingRepository();

  /**
   * Generate complete project report with all enhanced calculations
   */
  static async generateCompleteProjectReport(project: ProjectData): Promise<{
    reportDTO: ProjectReportDTO;
    reportData: ReportData;
    costCalculation: CostCalculation;
    resourceUtilization: any;
    healthScore: any;
  }> {
    const instance = new EnhancedReportingService();
    return instance.generateCompleteProjectReportInstance(project);
  }

  private async generateCompleteProjectReportInstance(project: ProjectData): Promise<{
    reportDTO: ProjectReportDTO;
    reportData: ReportData;
    costCalculation: CostCalculation;
    resourceUtilization: any;
    healthScore: any;
  }> {
    try {
      // Fetch all required data in parallel using repository
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
      
      // Calculate resource utilization for the first phase if available
      const resourceUtilization = phasesData.length > 0 
        ? await ProjectCalculationService.calculatePhaseResourceUtilization(project.id, phasesData[0].id)
        : null;

      // Calculate comprehensive cost data
      const costCalculation: CostCalculation = {
        totalBudget: project.budget || 0,
        spentAmount: realCosts.totalSpent,
        remainingBudget: (project.budget || 0) - realCosts.totalSpent,
        costVariance: realCosts.totalSpent - (project.budget || 0),
        estimatedCost: realCosts.estimatedCost,
        actualCost: realCosts.actualPhaseCost
      };

      // Calculate timeline performance
      const timelinePerformance = ProjectCalculationService.calculateTimelinePerformance(
        project, 
        phasesData,
        realCosts
      );

      // Calculate quality score from inspections
      const qualityScore = EnhancedReportingService.calculateQualityFromInspections(inspectionsData);

      // Calculate overall health score
      const budgetUtilization = project.budget > 0 ? (realCosts.totalSpent / project.budget) * 100 : 0;
      const healthScore = NewService.calculateProjectHealthScore( // Update the method call to use the new service
        project.progress,
        budgetUtilization,
        timelinePerformance.completionRate || 0,
        qualityScore
      );

      // Generate report data
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
        taskProgress: project.tasks?.map(task => ({
          taskId: task.id,
          name: task.name,
          progress: task.progress,
          status: task.status
        })) || [],
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

  /**
   * Transform project data into enriched DTO for reporting
   */
  static async transformProjectForReport(project: ProjectData): Promise<ProjectReportDTO> {
    const [phases, milestones, analytics, financial, risks] = await Promise.all([
      this.fetchEnhancedPhases(project.id),
      this.fetchConstructionMilestones(project.id),
      this.calculateProjectAnalytics(project),
      this.calculateFinancialMetrics(project.id),
      this.assessProjectRisks(project)
    ]);

    return {
      project,
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
          name: phase.phase_name || 'Phase sans nom',
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
      // Try enhanced_project_milestones first, then fall back to project_milestones
      const { data: enhancedMilestones } = await supabase
        .from('enhanced_project_milestones')
        .select('*')
        .eq('project_id', projectId);

      if (enhancedMilestones && enhancedMilestones.length > 0) {
        return enhancedMilestones.map(milestone => ({
          id: milestone.id,
          title: milestone.title,
          description: milestone.description || '',
          targetDate: new Date(milestone.target_date || Date.now()),
          completedDate: milestone.completed_date ? new Date(milestone.completed_date) : undefined,
          status: this.mapMilestoneStatus(milestone.status || 'pending'),
          projectId: milestone.project_id,
          phaseId: milestone.phase_id || undefined,
          stage: this.inferConstructionStage(milestone.title),
          priority: this.inferMilestonePriority(milestone.title),
          completionPercentage: Math.round((milestone.weight || 0) * 100),
          blockers: [],
          dependencies: Array.isArray(milestone.dependencies) ? milestone.dependencies.map(d => String(d)) : []
        }));
      }

      // Fall back to project_milestones
      const { data: milestonesData } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId);

      if (milestonesData && milestonesData.length > 0) {
        return milestonesData.map(milestone => ({
          id: milestone.id,
          title: milestone.title,
          description: milestone.description || '',
          targetDate: new Date(milestone.target_date || Date.now()),
          completedDate: milestone.completion_date ? new Date(milestone.completion_date) : undefined,
          status: this.mapMilestoneStatus(milestone.status || 'pending'),
          projectId: milestone.project_id,
          stage: this.inferConstructionStage(milestone.title),
          priority: this.inferMilestonePriority(milestone.title),
          completionPercentage: milestone.progress_percentage || 0,
          blockers: [],
          dependencies: []
        }));
      }

      return this.generateDefaultConstructionMilestones(projectId);
    } catch (error) {
      console.error('Error fetching construction milestones:', error);
      return this.generateDefaultConstructionMilestones(projectId);
    }
  }

  private static async calculateProjectAnalytics(project: ProjectData): Promise<ProjectAnalyticsDTO> {
    try {
      const [phasesResponse, paymentsResponse, inspectionsResponse] = await Promise.all([
        supabase.from('project_phases').select('*').eq('project_id', project.id),
        supabase.from('payments').select('*').eq('project_id', project.id),
        supabase.from('inspections').select('*').eq('project_id', project.id)
      ]);

      const phasesData = phasesResponse.data || [];
      const paymentsData = paymentsResponse.data || [];
      const inspectionsData = inspectionsResponse.data || [];

      if (phasesData.length === 0) {
        return this.getDefaultAnalytics(project);
      }

      const actualCost = paymentsData.reduce((sum, p) => sum + (p.amount || 0), 0);
      const evmMetrics = ReportCalculations.calculateEVMMetrics(project, actualCost, phasesData);

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
      const [payments, bankGuarantees, insurance, project, expenses] = await Promise.all([
        supabase.from('payments').select('*').eq('project_id', projectId),
        supabase.from('bank_guarantees').select('*').eq('project_id', projectId),
        supabase.from('insurance_certificates').select('*').eq('project_id', projectId),
        supabase.from('projects').select('budget, progress').eq('id', projectId).single(),
        supabase.from('mission_expenses').select('*').eq('mission_id', projectId)
      ]);

      const paymentsData = payments.data || [];
      const expensesData = expenses.data || [];
      const projectData = project.data;

      const totalBudget = projectData?.budget || 0;
      const totalPaid = paymentsData.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalExpenses = expensesData.reduce((sum, e) => sum + (e.amount || 0), 0);
      const spentAmount = totalPaid + totalExpenses;
      const remainingBudget = totalBudget - spentAmount;
      const costOverrun = Math.max(0, spentAmount - totalBudget);

      return {
        totalBudget,
        spentAmount,
        remainingBudget,
        costOverrun,
        paymentMilestones: paymentsData.map(p => ({
          id: p.id,
          amount: p.amount,
          dueDate: new Date(p.payment_date),
          paidDate: new Date(p.payment_date),
          status: 'paid' as const,
          description: p.transaction_id || `Payment ${p.id.slice(0, 8)}`
        })),
        bankGuarantees: bankGuarantees.data?.map(bg => ({
          id: bg.id,
          type: bg.guarantee_type,
          amount: bg.guarantee_amount,
          issueDate: new Date(bg.issue_date),
          expiryDate: new Date(bg.expiry_date),
          bankName: bg.bank_name,
          status: bg.status as 'active' | 'expired' | 'claimed'
        })) || [],
        insuranceCoverage: insurance.data?.map(ins => ({
          id: ins.id,
          type: ins.coverage_type,
          coverage: ins.coverage_amount,
          provider: ins.insurance_company,
          validFrom: new Date(ins.valid_from),
          validUntil: new Date(ins.valid_until),
          status: ins.status as 'active' | 'expired'
        })) || []
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

  private static async assessProjectRisks(project: ProjectData): Promise<RiskAssessmentDTO> {
    // Generate risk assessment based on project data
    const risks = this.generateRiskAssessment(project);
    
    return {
      overallRiskLevel: this.calculateOverallRiskLevel(risks),
      risks,
      mitigationStrategies: []
    };
  }

  // Helper methods (implementation copied from reportDataTransformer)
  private static mapPhaseStatus(status: string): 'planned' | 'in_progress' | 'completed' | 'delayed' {
    if (!status) return 'planned';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('completed') || statusLower === 'done' || statusLower === 'terminé') return 'completed';
    if (statusLower.includes('progress') || statusLower === 'in_progress' || statusLower === 'en_cours') return 'in_progress';
    if (statusLower.includes('delayed') || statusLower === 'retard' || statusLower === 'en_retard') return 'delayed';
    if (statusLower.includes('not_started') || statusLower === 'planned' || statusLower === 'planifié') return 'planned';
    
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

  private static getDefaultAnalytics(project: ProjectData): ProjectAnalyticsDTO {
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
      qualityScore: 85,
      teamEfficiency: 90
    };
  }

  private static calculateOnTimePerformance(phases: any[]): number {
    if (!phases || phases.length === 0) return 100;
    
    const onTimePhases = phases.filter(p => {
      if (p.status === 'completed') {
        const endDate = new Date(p.end_date);
        const now = new Date();
        return now <= endDate;
      }
      return false;
    }).length;
    
    return phases.length > 0 ? (onTimePhases / phases.length) * 100 : 100;
  }

  private static calculateQualityFromInspections(inspections: any[]): number {
    if (!inspections || inspections.length === 0) return 85;
    
    const completedInspections = inspections.filter(i => 
      i.status === 'completed' || i.status === 'approved'
    );
    const approvedInspections = inspections.filter(i => i.status === 'approved');
    const rejectedInspections = inspections.filter(i => i.status === 'rejected');
    
    if (completedInspections.length === 0) return 85;
    
    const approvalRate = approvedInspections.length / completedInspections.length;
    const rejectionPenalty = (rejectedInspections.length / completedInspections.length) * 30;
    
    return Math.max(50, Math.min(100, (approvalRate * 100) - rejectionPenalty));
  }

  private static calculateTeamEfficiency(project: ProjectData, phases: any[]): number {
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

  private static generateRiskAssessment(project: ProjectData): any[] {
    const risks: any[] = [];
    
    // Budget risk
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