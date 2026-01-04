import { supabase } from '@/integrations/supabase/client';
import { 
  MilestoneDTO, 
  MilestoneSummaryDTO, 
  MilestoneFormDTO,
  MilestoneProgressDTO,
  MilestoneTemplateDTO
} from '@/types/milestone-dto';
import { getMilestoneTemplates } from '@/data/referential-milestones';
import { addDays, format, parseISO, isBefore } from 'date-fns';

export class MilestoneService {
  /**
   * Get all milestones for a project
   */
  static async getProjectMilestones(projectId: string): Promise<MilestoneDTO[]> {
    const { data, error } = await supabase
      .from('enhanced_project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('target_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.mapToDTO);
  }

  /**
   * Get milestones for a specific phase
   */
  static async getPhaseMilestones(projectId: string, phaseId: string): Promise<MilestoneDTO[]> {
    const { data, error } = await supabase
      .from('enhanced_project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .eq('phase_id', phaseId)
      .order('target_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.mapToDTO);
  }

  /**
   * Get milestones summary for timeline view
   */
  static async getProjectMilestonesSummary(projectId: string): Promise<MilestoneSummaryDTO[]> {
    const { data: milestones, error: mError } = await supabase
      .from('enhanced_project_milestones')
      .select('id, title, target_date, completed_date, status, phase_id, weight')
      .eq('project_id', projectId)
      .order('target_date', { ascending: true });

    if (mError) throw mError;

    // Get phase names for context
    const phaseIds = [...new Set((milestones || []).filter(m => m.phase_id).map(m => m.phase_id as string))];
    
    let phaseMap: Record<string, string> = {};
    if (phaseIds.length > 0) {
      const { data: phases } = await supabase
        .from('project_phases')
        .select('id, phase_name')
        .in('id', phaseIds);
      
      phaseMap = (phases || []).reduce((acc, p) => {
        acc[p.id] = p.phase_name || 'Phase sans nom';
        return acc;
      }, {} as Record<string, string>);
    }

    return (milestones || []).map(m => ({
      id: m.id,
      title: m.title,
      target_date: m.target_date,
      completed_date: m.completed_date || undefined,
      status: m.status as MilestoneSummaryDTO['status'],
      phase_id: m.phase_id || undefined,
      phase_name: m.phase_id ? phaseMap[m.phase_id] : undefined,
      weight: m.weight || 0.1
    }));
  }

  /**
   * Calculate milestone progress for a phase or project
   */
  static async getMilestoneProgress(projectId: string, phaseId?: string): Promise<MilestoneProgressDTO> {
    const query = supabase
      .from('enhanced_project_milestones')
      .select('*')
      .eq('project_id', projectId);

    if (phaseId) {
      query.eq('phase_id', phaseId);
    }

    const { data, error } = await query.order('target_date', { ascending: true });

    if (error) throw error;

    const milestones = data || [];
    const today = new Date();

    const completed = milestones.filter(m => m.status === 'completed');
    const delayed = milestones.filter(m => 
      m.status !== 'completed' && 
      m.target_date && 
      isBefore(parseISO(m.target_date), today)
    );

    const totalWeight = milestones.reduce((sum, m) => sum + (m.weight || 0.1), 0);
    const completedWeight = completed.reduce((sum, m) => sum + (m.weight || 0.1), 0);
    const weightedProgress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

    const pending = milestones.filter(m => m.status !== 'completed');
    const nextMilestone = pending.length > 0 ? {
      id: pending[0].id,
      title: pending[0].title,
      target_date: pending[0].target_date,
      status: pending[0].status as MilestoneSummaryDTO['status'],
      weight: pending[0].weight || 0.1
    } : undefined;

    return {
      total_milestones: milestones.length,
      completed_milestones: completed.length,
      delayed_milestones: delayed.length,
      weighted_progress: Math.round(weightedProgress),
      next_milestone: nextMilestone,
      overdue_milestones: delayed.map(m => ({
        id: m.id,
        title: m.title,
        target_date: m.target_date,
        status: 'delayed' as const,
        weight: m.weight || 0.1
      }))
    };
  }

  /**
   * Create a milestone
   */
  static async createMilestone(
    projectId: string, 
    data: MilestoneFormDTO,
    isFromTemplate = false,
    templateId?: string
  ): Promise<MilestoneDTO> {
    const { data: result, error } = await supabase
      .from('enhanced_project_milestones')
      .insert({
        project_id: projectId,
        phase_id: data.phase_id || null,
        title: data.title,
        description: data.description || null,
        target_date: data.target_date,
        weight: data.weight,
        notes: data.notes || null,
        status: 'pending',
        // Store template info in dependencies JSON for tracking
        dependencies: isFromTemplate ? { from_template: true, template_id: templateId } : null
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapToDTO(result);
  }

  /**
   * Generate milestones from referential template for a phase
   */
  static async generateFromReferential(
    projectId: string,
    phaseId: string,
    constructionPhase: string,
    phaseStartDate: string
  ): Promise<MilestoneDTO[]> {
    const templates = getMilestoneTemplates(constructionPhase);
    
    if (templates.length === 0) {
      console.log(`No milestone templates found for phase: ${constructionPhase}`);
      return [];
    }

    const startDate = parseISO(phaseStartDate);
    const milestonesToCreate = templates.map(template => ({
      project_id: projectId,
      phase_id: phaseId,
      title: template.name,
      description: template.description || null,
      target_date: format(addDays(startDate, template.relative_offset_days), 'yyyy-MM-dd'),
      weight: template.weight,
      status: 'pending',
      dependencies: { 
        from_template: true, 
        template_id: template.id,
        is_critical: template.is_critical 
      }
    }));

    const { data, error } = await supabase
      .from('enhanced_project_milestones')
      .insert(milestonesToCreate)
      .select();

    if (error) throw error;

    return (data || []).map(this.mapToDTO);
  }

  /**
   * Update a milestone
   */
  static async updateMilestone(
    milestoneId: string, 
    data: Partial<MilestoneFormDTO> & { status?: string; completed_date?: string | null }
  ): Promise<MilestoneDTO> {
    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.target_date !== undefined) updateData.target_date = data.target_date;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.completed_date !== undefined) updateData.completed_date = data.completed_date;

    const { data: result, error } = await supabase
      .from('enhanced_project_milestones')
      .update(updateData)
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) throw error;

    return this.mapToDTO(result);
  }

  /**
   * Toggle milestone completion status
   */
  static async toggleComplete(milestoneId: string): Promise<MilestoneDTO> {
    // Get current status
    const { data: current, error: fetchError } = await supabase
      .from('enhanced_project_milestones')
      .select('status')
      .eq('id', milestoneId)
      .single();

    if (fetchError) throw fetchError;

    const isCompleted = current.status === 'completed';
    
    return this.updateMilestone(milestoneId, {
      status: isCompleted ? 'pending' : 'completed',
      completed_date: isCompleted ? null : format(new Date(), 'yyyy-MM-dd')
    });
  }

  /**
   * Delete a milestone
   */
  static async deleteMilestone(milestoneId: string): Promise<void> {
    const { error } = await supabase
      .from('enhanced_project_milestones')
      .delete()
      .eq('id', milestoneId);

    if (error) throw error;
  }

  /**
   * Delete all template-generated milestones for a phase
   */
  static async deleteTemplateMilestones(phaseId: string): Promise<void> {
    // Get milestones with template markers
    const { data, error: fetchError } = await supabase
      .from('enhanced_project_milestones')
      .select('id, dependencies')
      .eq('phase_id', phaseId);

    if (fetchError) throw fetchError;

    const templateMilestoneIds = (data || [])
      .filter(m => m.dependencies && typeof m.dependencies === 'object' && (m.dependencies as any).from_template)
      .map(m => m.id);

    if (templateMilestoneIds.length === 0) return;

    const { error } = await supabase
      .from('enhanced_project_milestones')
      .delete()
      .in('id', templateMilestoneIds);

    if (error) throw error;
  }

  private static mapToDTO(data: any): MilestoneDTO {
    const deps = data.dependencies as any;
    return {
      id: data.id,
      project_id: data.project_id,
      phase_id: data.phase_id || undefined,
      title: data.title,
      description: data.description || undefined,
      target_date: data.target_date,
      completed_date: data.completed_date || undefined,
      status: data.status || 'pending',
      weight: data.weight || 0.1,
      notes: data.notes || undefined,
      is_from_template: deps?.from_template || false,
      template_id: deps?.template_id,
      dependencies: deps && !deps.from_template ? deps : undefined,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }
}
