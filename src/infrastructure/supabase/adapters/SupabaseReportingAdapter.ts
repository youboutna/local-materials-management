import { supabase } from '@/integrations/supabase/client';
import { IReportingRepository } from '@/domain/repositories/IReportingRepository';
import { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import { ReportCalculations } from '@/utils/reportCalculations';
import { ProjectDataCalculations } from '@/utils/projectDataCalculations';
import { ProjectReportDTO } from '@/types/reportTypes';

export class SupabaseReportingAdapter implements IReportingRepository {
  
  async getProjectPhases(projectId: string): Promise<any[]> {
    const { data } = await supabase
      .from('project_phases')
      .select('*')
      .eq('project_id', projectId);
    return data || [];
  }

  async getProjectInspections(projectId: string): Promise<any[]> {
    const { data } = await supabase
      .from('inspections')
      .select('*')
      .eq('project_id', projectId);
    return data || [];
  }

  async calculateRealProjectCosts(projectId: string): Promise<any> {
    return await ProjectDataCalculations.calculateRealProjectCosts(projectId);
  }

  async calculatePhaseResourceUtilization(projectId: string, phaseId: string): Promise<any> {
    return await ProjectDataCalculations.calculatePhaseResourceUtilization(projectId, phaseId);
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

      // Use ProjectDataCalculations for project analytics
      const analytics = ProjectDataCalculations.calculateProjectHealthScore(
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
    if (milestone.completed) return 'completed';
    if (milestone.target_date && new Date(milestone.target_date) < new Date()) return 'overdue';
    return 'pending';
  }
}
