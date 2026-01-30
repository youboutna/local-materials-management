import { supabase } from '@/integrations/supabase/client';
import { ProjectData } from '@/types/project';
import {
  ConstructionMilestoneDTO,
  EnhancedPhaseDTO,
  FinancialMetricsDTO,
  ProjectAnalyticsDTO,
  ProjectReportDTO,
  RiskAssessmentDTO,
  RiskItemDTO
} from '@/types/reportTypes';

export class ReportingService {
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

  /**
   * Fetch and enhance project phases data
   */
  private static async fetchEnhancedPhases(projectId: string): Promise<EnhancedPhaseDTO[]> {
    try {
      const { data: phasesData } = await supabase
        .from('project_phases')
        .select(`
          *,
          project_phase_employees(employee_id, employees(full_name))
        `)
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

  /**
   * Fetch construction milestones with enhanced data
   */
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

  /**
   * Generate default construction milestones based on project type
   */
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
        dependencies: [`milestone-${projectId}-1`]
      },
      {
        id: `milestone-${projectId}-3`,
        title: 'Début des travaux de terrassement',
        description: 'Commencement des travaux de préparation du terrain',
        targetDate: new Date(baseDate.getTime() + 90 * 24 * 60 * 60 * 1000),
        status: 'pending' as const,
        projectId,
        stage: 'execution' as const,
        priority: 'high' as const,
        completionPercentage: 0,
        blockers: [],
        dependencies: [`milestone-${projectId}-2`]
      },
      {
        id: `milestone-${projectId}-4`,
        title: 'Achèvement du gros œuvre',
        description: 'Finalisation de la structure principale',
        targetDate: new Date(baseDate.getTime() + 180 * 24 * 60 * 60 * 1000),
        status: 'pending' as const,
        projectId,
        stage: 'execution' as const,
        priority: 'critical' as const,
        completionPercentage: 0,
        blockers: [],
        dependencies: [`milestone-${projectId}-3`]
      },
      {
        id: `milestone-${projectId}-5`,
        title: 'Réception provisoire',
        description: 'Réception des travaux et validation qualité',
        targetDate: new Date(baseDate.getTime() + 240 * 24 * 60 * 60 * 1000),
        status: 'pending' as const,
        projectId,
        stage: 'validation' as const,
        priority: 'critical' as const,
        completionPercentage: 0,
        blockers: [],
        dependencies: [`milestone-${projectId}-4`]
      }
    ];
  }

  /**
   * Calculate enhanced project analytics from Waterfall methodology
   */
  private static async calculateProjectAnalytics(project: ProjectData): Promise<ProjectAnalyticsDTO> {
    try {
      const { data: phasesData } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', project.id);

      if (!phasesData || phasesData.length === 0) {
        return this.getDefaultAnalytics(project);
      }

      // Calculate EVM metrics similar to WaterfallProjectManager
      const earnedValue = phasesData.reduce((sum, p) => sum + ((p.progress || 0) / 100) * (p.estimated_cost || 0), 0);
      const plannedValue = phasesData.reduce((sum, p) => sum + (0 / 100) * (p.estimated_cost || 0), 0);
      const actualCost = phasesData.reduce((sum, p) => sum + (p.actual_cost || 0), 0);
      const budgetAtCompletion = project.budget || phasesData.reduce((sum, p) => sum + (p.estimated_cost || 0), 0);

      return {
        schedulePerformanceIndex: plannedValue > 0 ? earnedValue / plannedValue : 1,
        costPerformanceIndex: actualCost > 0 ? earnedValue / actualCost : 1,
        earnedValue,
        plannedValue,
        actualCost,
        budgetAtCompletion,
        estimateAtCompletion: actualCost + (budgetAtCompletion - earnedValue),
        estimateToComplete: budgetAtCompletion - earnedValue,
        varianceAtCompletion: budgetAtCompletion - (actualCost + (budgetAtCompletion - earnedValue)),
        onTimePerformance: this.calculateOnTimePerformance(phasesData),
        budgetVariance: ((project.budget - actualCost) / project.budget) * 100,
        qualityScore: this.calculateQualityScore(phasesData),
        teamEfficiency: this.calculateTeamEfficiency(project, phasesData)
      };
    } catch (error) {
      console.error('Error calculating project analytics:', error);
      return this.getDefaultAnalytics(project);
    }
  }

  /**
   * Calculate financial metrics for the project
   */
  private static async calculateFinancialMetrics(projectId: string): Promise<FinancialMetricsDTO> {
    try {
      const [payments, bankGuarantees, insurance] = await Promise.all([
        supabase.from('payments').select('*').eq('project_id', projectId),
        supabase.from('bank_guarantees').select('*').eq('project_id', projectId),
        supabase.from('insurance_certificates').select('*').eq('project_id', projectId)
      ]);

      const totalPaid = payments.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      return {
        totalBudget: 0, // Will be set from project data
        spentAmount: totalPaid,
        remainingBudget: 0, // Will be calculated
        costOverrun: 0,
        paymentMilestones: payments.data?.map(p => ({
          id: p.id,
          amount: p.amount,
          dueDate: new Date(p.payment_date),
          paidDate: new Date(p.payment_date),
          status: 'paid' as const,
          description: p.transaction_id
        })) || [],
        bankGuarantees: bankGuarantees.data?.map(bg => ({
          id: bg.id,
          type: bg.guarantee_type,
          amount: bg.guarantee_amount,
          issueDate: new Date(bg.issue_date),
          expiryDate: new Date(bg.expiry_date),
          bankName: bg.bank_name,
          status: bg.status as any
        })) || [],
        insuranceCoverage: insurance.data?.map(ins => ({
          id: ins.id,
          type: ins.coverage_type,
          coverage: ins.coverage_amount,
          provider: ins.insurance_company,
          validFrom: new Date(ins.valid_from),
          validUntil: new Date(ins.valid_until),
          status: ins.status as any
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

  /**
   * Assess project risks
   */
  private static async assessProjectRisks(project: ProjectData): Promise<RiskAssessmentDTO> {
    // For now, generate basic risk assessment based on project status and progress
    const risks = this.generateRiskAssessment(project);
    
    return {
      overallRiskLevel: this.calculateOverallRiskLevel(risks),
      risks,
      mitigationStrategies: []
    };
  }

  // Helper methods
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
      budgetAtCompletion: project.budget,
      estimateAtCompletion: project.budget,
      estimateToComplete: project.budget,
      varianceAtCompletion: 0,
      onTimePerformance: 100,
      budgetVariance: 0,
      qualityScore: 85,
      teamEfficiency: 90
    };
  }

  private static calculateOnTimePerformance(phases: any[]): number {
    const onTimePhases = phases.filter(p => p.status === 'completed' && new Date(p.end_date) >= new Date()).length;
    return phases.length > 0 ? (onTimePhases / phases.length) * 100 : 100;
  }

  private static calculateQualityScore(phases: any[]): number {
    // Placeholder calculation - could be enhanced with actual quality metrics
    return Math.random() * 20 + 80; // 80-100 range
  }

  private static calculateTeamEfficiency(project: ProjectData, phases: any[]): number {
    // Placeholder calculation - could be enhanced with actual team metrics
    const avgProgress = phases.reduce((sum, p) => sum + (p.progress || 0), 0) / phases.length || 0;
    return Math.min(100, avgProgress * 1.2);
  }

  private static generateRiskAssessment(project: ProjectData): RiskItemDTO[] {
    const risks: RiskItemDTO[] = [];
    
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
    
    // Schedule risk
    const daysSinceStart = Math.floor((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24));
    const expectedProgress = Math.min(100, (daysSinceStart / 365) * 100);
    if (project.progress < expectedProgress - 20) {
      risks.push({
        id: `risk-${project.id}-schedule`,
        category: 'schedule' as const,
        description: 'Retard dans la planification',
        probability: 80,
        impact: 70,
        riskScore: 56,
        status: 'identified' as const
      });
    }
    
    return risks;
  }

  private static calculateOverallRiskLevel(risks: RiskItemDTO[]): 'low' | 'medium' | 'high' | 'critical' {
    if (risks.length === 0) return 'low';
    const avgRiskScore = risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length;
    if (avgRiskScore > 70) return 'critical';
    if (avgRiskScore > 50) return 'high';
    if (avgRiskScore > 30) return 'medium';
    return 'low';
  }
}