/**
 * Supabase Adapter for Report Data Transformer Repository
 * Implements the IReportDataTransformerRepository using Supabase
 * Following hexagonal architecture: Adapter → Entity → Transformer → DTO
 */
import { supabase } from '@/integrations/supabase/client';
import { IReportDataTransformerRepository } from '@/domain/repositories/IReportDataTransformerRepository';
import { 
  ProjectReportDTO,
  EnhancedPhaseDTO,
  ConstructionMilestoneDTO,
  ProjectAnalyticsDTO,
  FinancialMetricsDTO,
  RiskAssessmentDTO
} from '@/dtos/entities/ReportDTO';
import { ReportCalculations } from '@/utils/reportCalculations';
import { ProjectDataCalculations } from '@/utils/projectDataCalculations';
import { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import { Database } from '@/integrations/supabase/types';
import { Project } from '@/domain/entities/Project';
import { ProjectTransformer } from '@/dtos/transforms';

// Types officiels Supabase pour les tables utilisées
type ProjectPhaseRow = Database['public']['Tables']['project_phases']['Row'];
type ProjectMilestoneRow = Database['public']['Tables']['project_milestones']['Row'];
type ProjectMaterialRow = Database['public']['Tables']['project_materials']['Row'];
type InspectionRow = Database['public']['Tables']['inspections']['Row'];
type PaymentRow = Database['public']['Tables']['payments']['Row'];

export class SupabaseReportDataTransformerAdapter implements IReportDataTransformerRepository {

  /**
   * Transform project data for reporting
   * Following hexagonal architecture: Adapter → Entity → Transformer → DTO
   */
  async transformProjectForReport(project: ProjectDetailDTO): Promise<ProjectReportDTO> {
    try {
      // 1. Convert ProjectData to Project entity (Domain)
      const projectEntity = this.createProjectEntity(project);
      
      // 2. Fetch related data from database using official Supabase types
      const [phasesData, milestonesData, materialsData, inspectionsData] = await Promise.all([
        supabase.from('project_phases').select('*').eq('project_id', project.id),
        supabase.from('project_milestones').select('*').eq('project_id', project.id),
        supabase.from('project_materials').select('*').eq('project_id', project.id),
        supabase.from('inspections').select('*').eq('project_id', project.id)
      ]);

      // 3. Calculate metrics using real data with proper typing
      const phases = phasesData.data || [] as ProjectPhaseRow[];
      const milestones = milestonesData.data || [] as ProjectMilestoneRow[];
      const materials = materialsData.data || [] as ProjectMaterialRow[];
      const inspections = inspectionsData.data || [] as InspectionRow[];

      // 4. Use ReportCalculations for EVM metrics (Domain logic)
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('project_id', project.id);
      
      const actualCost = (paymentsData as PaymentRow[]).reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const evmMetrics = ReportCalculations.calculateEVMMetrics(projectEntity, actualCost, phases);

      // 5. Use ProjectDataCalculations for project analytics (Domain logic)
      const analytics = ProjectDataCalculations.calculateProjectHealthScore(
        projectEntity.progress || 0,
        85, // Default budget utilization
        90, // Default schedule performance
        88  // Default quality score
      );

      // 6. Transform Project entity to DTO using transformer
      const projectDTO = ProjectTransformer.toResponseDto(projectEntity);

      // 7. Return final report DTO with all data
      return {
        project: {
          ...projectDTO,
          phases: phases.map(p => ({
            ...p,
            progress: this.calculatePhaseProgress(p),
            status: this.getPhaseStatus(p)
          })),
          milestones: milestones.map(m => ({
            ...m,
            status: this.getMilestoneStatus(m)
          })),
          materials: materials,
          inspections: inspections
        },
        evmMetrics,
        analytics,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error transforming project for report:', error);
      throw error;
    }
  }

  /**
   * Create Project entity from ProjectData
   * This is the Adapter → Entity transformation
   */
  private createProjectEntity(projectData: ProjectData): Project {
    return new Project(
      projectData.id,
      projectData.title,
      projectData.description || '',
      projectData.status,
      projectData.progress || 0,
      projectData.budget || 0,
      projectData.startDate ? new Date(projectData.startDate) : null,
      projectData.endDate ? new Date(projectData.endDate) : null,
      projectData.location || '',
      projectData.coordinates ? {
        latitude: projectData.coordinates.latitude || 0,
        longitude: projectData.coordinates.longitude || 0
      } : undefined,
      projectData.teamSize || 0,
      projectData.thumbnail || ''
    );
  }

  /**
   * Calculate phase progress using official Supabase types
   */
  private calculatePhaseProgress(phase: ProjectPhaseRow): number {
    const now = new Date();
    const start = phase.start_date ? new Date(phase.start_date) : new Date();
    const end = phase.end_date ? new Date(phase.end_date) : new Date();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.round((elapsed / total) * 100);
  }

  /**
   * Get phase status using official Supabase types
   */
  private getPhaseStatus(phase: ProjectPhaseRow): string {
    const progress = this.calculatePhaseProgress(phase);
    if (progress === 0) return 'pending';
    if (progress === 100) return 'completed';
    return 'in_progress';
  }

  /**
   * Get milestone status using official Supabase types
   */
  private getMilestoneStatus(milestone: ProjectMilestoneRow): string {
    if (milestone.completed) return 'completed';
    if (milestone.target_date && new Date(milestone.target_date) < new Date()) return 'overdue';
    return 'pending';
  }

  /**
   * Fetch enhanced project phases data
   */
  async fetchEnhancedPhases(projectId: string): Promise<EnhancedPhaseDTO[]> {
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
   * Fetch construction milestones data
   */
  async fetchConstructionMilestones(projectId: string): Promise<ConstructionMilestoneDTO[]> {
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

      if (!milestonesData || milestonesData.length === 0) {
        return this.generateDefaultConstructionMilestones(projectId);
      }

      return milestonesData.map(milestone => ({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description || '',
        targetDate: new Date(milestone.target_date || Date.now()),
        completedDate: milestone.completion_date ? new Date(milestone.completion_date) : undefined,
        status: this.mapMilestoneStatus(milestone.status || 'pending'),
        projectId: milestone.project_id,
        phaseId: milestone.phase_id || undefined,
        stage: this.inferConstructionStage(milestone.title),
        priority: this.inferMilestonePriority(milestone.title),
        completionPercentage: milestone.progress_percentage || 0,
        blockers: [],
        dependencies: []
      }));
    } catch (error) {
      console.error('Error fetching construction milestones:', error);
      return this.generateDefaultConstructionMilestones(projectId);
    }
  }

  /**
   * Calculate project analytics
   */
  async calculateProjectAnalytics(project: ProjectData): Promise<ProjectAnalyticsDTO> {
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

      // Calculate real EVM metrics using ReportCalculations
      const actualCost = paymentsData.reduce((sum, p) => sum + (p.amount || 0), 0);
      const evmMetrics = ReportCalculations.calculateEVMMetrics(project, actualCost, phasesData);

      // Calculate performance indicators
      const onTimePerformance = this.calculateOnTimePerformance(phasesData);
      const budgetVariance = project.budget > 0 ? ((project.budget - actualCost) / project.budget) * 100 : 0;
      const qualityScore = this.calculateQualityScore(inspectionsData);
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

  /**
   * Calculate financial metrics
   */
  async calculateFinancialMetrics(projectId: string): Promise<FinancialMetricsDTO> {
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

  /**
   * Assess project risks
   */
  async assessProjectRisks(project: ProjectData): Promise<RiskAssessmentDTO> {
    try {
      // For now, generate basic risk assessment based on project status and progress
      const risks = this.generateRiskAssessment(project);
      
      return {
        overallRiskLevel: this.calculateOverallRiskLevel(risks),
        risks,
        mitigationStrategies: []
      };
    } catch (error) {
      console.error('Error assessing project risks:', error);
      return {
        overallRiskLevel: 'low',
        risks: [],
        mitigationStrategies: []
      };
    }
  }

  // Helper methods (copied from original service)
  private mapPhaseStatus(status: string): 'planned' | 'in_progress' | 'completed' | 'delayed' {
    if (!status) return 'planned';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('completed') || statusLower === 'done' || statusLower === 'terminé') return 'completed';
    if (statusLower.includes('progress') || statusLower === 'in_progress' || statusLower === 'en_cours') return 'in_progress';
    if (statusLower.includes('delayed') || statusLower === 'retard' || statusLower === 'en_retard') return 'delayed';
    if (statusLower.includes('not_started') || statusLower === 'planned') return 'planned';
    
    return 'planned';
  }

  private mapMilestoneStatus(status: string): 'pending' | 'in_progress' | 'completed' | 'overdue' {
    switch (status) {
      case 'completed': return 'completed';
      case 'in_progress': return 'in_progress';
      case 'overdue': return 'overdue';
      default: return 'pending';
    }
  }

  private inferConstructionStage(title: string): 'conception' | 'preparation' | 'execution' | 'validation' | 'livraison' {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('étude') || lowerTitle.includes('conception')) return 'conception';
    if (lowerTitle.includes('autorisation') || lowerTitle.includes('permis')) return 'preparation';
    if (lowerTitle.includes('travaux') || lowerTitle.includes('construction')) return 'execution';
    if (lowerTitle.includes('réception') || lowerTitle.includes('validation')) return 'validation';
    if (lowerTitle.includes('livraison') || lowerTitle.includes('remise')) return 'livraison';
    return 'execution';
  }

  private inferMilestonePriority(title: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('critique') || lowerTitle.includes('réception')) return 'critical';
    if (lowerTitle.includes('important') || lowerTitle.includes('autorisation')) return 'high';
    if (lowerTitle.includes('secondaire')) return 'low';
    return 'medium';
  }

  private calculatePhaseRiskLevel(phase: DatabasePhaseData): 'low' | 'medium' | 'high' {
    const progress = phase.progress || 0;
    const budget = phase.estimated_cost || 0;
    const actualCost = phase.actual_cost || 0;
    
    if (actualCost > budget * 1.2 || progress < 50) return 'high';
    if (actualCost > budget * 1.1 || progress < 75) return 'medium';
    return 'low';
  }

  private calculateOnTimePerformance(phases: DatabasePhaseData[]): number {
    const onTimePhases = phases.filter(p => p.status === 'completed' && p.end_date && new Date(p.end_date) >= new Date());
    return phases.length > 0 ? (onTimePhases.length / phases.length) * 100 : 100;
  }

  private calculateQualityScore(inspections: InspectionData[]): number {
    if (!inspections || inspections.length === 0) return 85; // Default score
    
    const completedInspections = inspections.filter(i => i.status === 'completed' || i.status === 'approved');
    const approvedInspections = inspections.filter(i => i.status === 'approved');
    const rejectedInspections = inspections.filter(i => i.status === 'rejected');
    
    if (completedInspections.length === 0) return 85;
    
    // Calculate score based on inspection results
    const approvalRate = approvedInspections.length / completedInspections.length;
    const rejectionPenalty = (rejectedInspections.length / completedInspections.length) * 30;
    
    return Math.max(50, Math.min(100, (approvalRate * 100) - rejectionPenalty));
  }

  private calculateTeamEfficiency(project: ProjectData, phases: any[]): number {
    // Placeholder calculation - could be enhanced with actual team metrics
    const avgProgress = phases.reduce((sum, p) => sum + (p.progress || 0), 0) / phases.length || 0;
    return Math.min(100, avgProgress * 1.2);
  }

  private getDefaultAnalytics(project: ProjectData): ProjectAnalyticsDTO {
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

  private generateDefaultConstructionMilestones(projectId: string): ConstructionMilestoneDTO[] {
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

  private generateRiskAssessment(project: ProjectData): RiskData[] {
    const risks: RiskData[] = [];
    
    // Budget risk
    if (project.progress < 50 && new Date() > new Date(project.startDate)) {
      risks.push({
        id: `risk-${project.id}-budget`,
        category: 'financial' as 'financial' | 'technical' | 'environmental' | 'regulatory' | 'schedule',
        description: 'Risque de dépassement budgétaire',
        probability: 70,
        impact: 80,
        riskScore: 56,
        status: 'identified' as 'identified' | 'assessed' | 'mitigated' | 'closed'
      });
    }
    
    // Schedule risk
    const daysSinceStart = Math.floor((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24));
    const expectedProgress = Math.min(100, (daysSinceStart / 365) * 100);
    if (project.progress < expectedProgress - 20) {
      risks.push({
        id: `risk-${project.id}-schedule`,
        category: 'schedule' as 'financial' | 'technical' | 'environmental' | 'regulatory' | 'schedule',
        description: 'Retard dans la planification',
        probability: 80,
        impact: 70,
        riskScore: 56,
        status: 'identified' as 'identified' | 'assessed' | 'mitigated' | 'closed'
      });
    }
    
    return risks;
  }

  private calculateOverallRiskLevel(risks: any[]): 'low' | 'medium' | 'high' | 'critical' {
    if (risks.length === 0) return 'low';
    
    const avgRiskScore = risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length;
    if (avgRiskScore > 70) return 'critical';
    if (avgRiskScore > 50) return 'high';
    if (avgRiskScore > 30) return 'medium';
    return 'low';
  }
}
