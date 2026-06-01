import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { IReportingRepository, ProjectData } from '@/domain/repositories/IReportingRepository';
import { ReportCalculations } from '@/utils/reportCalculations';
import { ProjectCalculationService } from '@/application/services/ProjectCalculationService';
import { ProjectReportDTO, EnhancedPhaseDTO, FinancialMetricsDTO } from '@/dtos/entities/ProjectReportDTO';
import { Database } from '@/integrations/supabase/types';
import { toPhaseViewModel, type PhaseViewModel } from '@/utils/phaseViewModel';

// Types officiels Supabase pour les tables utilisées
type ProjectPhaseRow = Database['public']['Tables']['project_phases']['Row'];
type InspectionRow = Database['public']['Tables']['inspections']['Row'];
type ProjectMilestoneRow = Database['public']['Tables']['project_milestones']['Row'];

// Phase hydratée pour les rapports — camelCase + alias `name` pour rester
// compatible avec EnhancedPhaseDTO/ProjectDetailDTO côté UI/PDF.
type ReportPhase = PhaseViewModel & { name: string; actualProgress: number };

const hydratePhase = (row: unknown): ReportPhase => {
  const vm = toPhaseViewModel(row as Record<string, unknown>);
  return { ...vm, name: vm.title, actualProgress: vm.progress };
};

export class SupabaseReportingAdapter implements IReportingRepository {
  
  async getProjectPhases(projectId: string): Promise<EnhancedPhaseDTO[]> {
    const { data } = await supabase
      .from('project_phases')
      .select('*')
      .eq('project_id', projectId);
    
    if (!data || data.length === 0) return [];

    return data.map(phase => ({
      id: phase.id,
      name: phase.phase_name || 'Phase sans nom',
      status: this.getPhaseStatus(phase),
      progress: this.calculatePhaseProgress(phase),
      startDate: phase.start_date || new Date().toISOString(),
      endDate: phase.end_date || new Date().toISOString(),
      actualStartDate: phase.start_date,
      actualEndDate: phase.end_date,
      budget: phase.estimated_cost || 0,
      actualCost: phase.actual_cost || 0,
      tasks: [], // TODO: Fetch actual tasks for this phase
      milestones: [], // TODO: Fetch actual milestones for this phase
      createdAt: phase.created_at || new Date().toISOString(),
      updatedAt: phase.updated_at || new Date().toISOString(),
      createdBy: phase.created_by || undefined,
      updatedBy: phase.updated_by || undefined,
      version: 1
    }));
  }

  async getProjectInspections(projectId: string): Promise<InspectionRow[]> {
    const { data } = await supabase
      .from('inspections')
      .select('*')
      .eq('project_id', projectId);
    return data || [];
  }

  async calculateRealProjectCosts(projectId: string): Promise<PhaseCostsResult> {
    return await ProjectCalculationService.calculateRealProjectCosts(projectId);
  }

  async calculatePhaseResourceUtilization(projectId: string, phaseId: string): Promise<ResourceUtilization> {
    return await ProjectCalculationService.calculatePhaseResourceUtilization(projectId, phaseId);
  }

  async transformProjectForReport(project: ProjectData): Promise<ProjectReportDTO> {
    try {
      // Fetch real project data from database
      const [phasesData, milestonesData, materialsData, inspectionsData] = await Promise.all([
        supabase.from('project_phases').select('*').eq('project_id', project.id),
        supabase.from('project_milestones').select('*').eq('project_id', project.id),
        supabase.from('project_materials').select('*').eq('project_id', project.id),
        supabase.from('inspections').select('*').eq('project_id', project.id)
      ]);

      // Calculate metrics using real data
      const phases = phasesData.data || [];
      const milestones = milestonesData.data || [];
      const materials = materialsData.data || [];
      const inspections = inspectionsData.data || [];

      // Use ReportCalculations for EVM metrics
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('project_id', project.id);
      
      const actualCost = paymentsData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      const evmMetrics = ReportCalculations.calculateEVMMetrics(project, actualCost, phases);

      // Use ProjectCalculationService for project analytics
      const analytics = ProjectCalculationService.calculateProjectHealthScore(
        project.progress || 0,
        85, // Default budget utilization
        90, // Default schedule performance
        88  // Default quality score
      );

      return {
        project: {
          ...project,
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
   * Calculate phase progress
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
   * Get phase status
   */
  private getPhaseStatus(phase: ProjectPhaseRow): string {
    const progress = this.calculatePhaseProgress(phase);
    if (progress === 0) return 'pending';
    if (progress === 100) return 'completed';
    return 'in_progress';
  }

  /**
   * Get milestone status
   */
  private getMilestoneStatus(milestone: ProjectMilestoneRow): string {
    if (milestone.completed) return 'completed';
    if (milestone.target_date && new Date(milestone.target_date) < new Date()) return 'overdue';
    return 'pending';
  }
}
