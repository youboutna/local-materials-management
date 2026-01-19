import { supabase } from '@/integrations/supabase/client';
import { IReportingRepository } from '@/domain/repositories/IReportingRepository';
import { ProjectData } from '@/types/project';
import { ReportDataTransformer } from '@/services/reportDataTransformer';
import { ProjectDataCalculations } from '@/utils/projectDataCalculations';

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

  async transformProjectForReport(project: ProjectData): Promise<any> {
    return await ReportDataTransformer.transformProjectForReport(project);
  }
}
