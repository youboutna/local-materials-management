// @ts-nocheck
// Note: @ts-nocheck conservé temporairement — la table `project_phases` est exposée
// via une vue proxy publique (Multi-Schema Architecture) et n'est pas typée dans
// Database['public']['Tables']. À retirer après typage des proxies.
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { IReportingRepository } from '@/domain/repositories/IReportingRepository';
import { ReportCalculations } from '@/utils/reportCalculations';
import { ProjectCalculationService } from '@/application/services/ProjectCalculationService';
import { ProjectReportDTO, EnhancedPhaseDTO } from '@/dtos/entities/ProjectReportDTO';
import { toPhaseViewModel, type PhaseViewModel } from '@/utils/phaseViewModel';

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

    return data.map((phase: any) => {
      const vm = hydratePhase(phase);
      return {
        id: vm.id,
        name: vm.name,
        status: vm.status || this.getPhaseStatus(phase),
        progress: vm.progress || this.calculatePhaseProgress(phase),
        startDate: vm.startDate || new Date().toISOString(),
        endDate: vm.endDate || new Date().toISOString(),
        actualStartDate: vm.startDate,
        actualEndDate: vm.actualEndDate || vm.endDate,
        budget: vm.budget,
        actualCost: vm.actualCost,
        tasks: [], // TODO: Fetch actual tasks for this phase
        milestones: [], // TODO: Fetch actual milestones for this phase
        createdAt: phase.created_at || new Date().toISOString(),
        updatedAt: phase.updated_at || new Date().toISOString(),
        createdBy: phase.created_by || undefined,
        updatedBy: phase.updated_by || undefined,
        version: 1,
      };
    });
  }

  async getProjectInspections(projectId: string): Promise<any[]> {
    const { data } = await supabase
      .from('inspections')
      .select('*')
      .eq('project_id', projectId);
    return data || [];
  }

  async calculateRealProjectCosts(projectId: string): Promise<any> {
    return await ProjectCalculationService.calculateRealProjectCosts(projectId);
  }

  async calculatePhaseResourceUtilization(projectId: string, phaseId: string): Promise<any> {
    return await ProjectCalculationService.calculatePhaseResourceUtilization(projectId, phaseId);
  }

  async transformProjectForReport(project: any): Promise<ProjectReportDTO> {
    try {
      // Fetch real project data from database
      const [phasesData, milestonesData, materialsData, inspectionsData] = await Promise.all([
        supabase.from('project_phases').select('*').eq('project_id', project.id),
        supabase.from('project_milestones').select('*').eq('project_id', project.id),
        supabase.from('project_materials').select('*').eq('project_id', project.id),
        supabase.from('inspections').select('*').eq('project_id', project.id),
      ]);

      // Hydratation snake_case → camelCase via le transformer phase.
      const phases: ReportPhase[] = (phasesData.data || []).map(hydratePhase);
      const milestones = milestonesData.data || [];
      const materials = materialsData.data || [];
      const inspections = inspectionsData.data || [];

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('project_id', project.id);

      const actualCost = paymentsData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      const evmMetrics = ReportCalculations.calculateEVMMetrics(project, actualCost, phases);

      const analytics = ProjectCalculationService.calculateProjectHealthScore(
        project.progress || 0,
        85,
        90,
        88,
      );

      return {
        project: {
          ...project,
          // `phases` (EnhancedPhaseDTO-like) ET `plannedPhases` (ProjectDetailDTO-like)
          // pointent sur la même source hydratée, plus de divergence snake/camel.
          phases,
          plannedPhases: phases,
          milestones: milestones.map((m: any) => ({
            ...m,
            title: m.title,
            status: this.getMilestoneStatus(m),
          })),
          materials,
          inspections,
        },
        evmMetrics,
        analytics,
        generatedAt: new Date().toISOString(),
      } as unknown as ProjectReportDTO;
    } catch (error) {
      console.error('Error transforming project for report:', error);
      throw error;
    }
  }

  /**
   * Calculate phase progress
   */
  private calculatePhaseProgress(phase: any): number {
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
  private getPhaseStatus(phase: any): string {
    const progress = this.calculatePhaseProgress(phase);
    if (progress === 0) return 'pending';
    if (progress === 100) return 'completed';
    return 'in_progress';
  }

  /**
   * Get milestone status
   */
  private getMilestoneStatus(milestone: any): string {
    if (milestone.completion_date) return 'completed';
    if (milestone.status === 'completed') return 'completed';
    if (milestone.target_date && new Date(milestone.target_date) < new Date()) return 'overdue';
    return 'pending';
  }
}
