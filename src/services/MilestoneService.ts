/**
 * MilestoneService - Facade for backward compatibility
 * 
 * This service delegates to UnifiedMilestoneService and Repository pattern
 * Kept for compatibility with existing components
 * 
 * Architecture:
 * - MilestoneService (facade) -> UnifiedMilestoneService -> Repository -> Adapter
 */

import { getMilestoneTemplates } from '@/config/referentials/milestones.referential';
import { supabase } from '@/integrations/supabase/client';
import {
  CriticalPathDTO,
  MilestoneDTO,
  MilestoneFormDTO,
  MilestoneProgressDTO,
  MilestoneSummaryDTO
} from '@/types/milestone-dto';
import { addDays, differenceInDays, format, isBefore, parseISO } from 'date-fns';

// Re-export for convenience
export { GanttPertDataService, getGanttPertService } from './GanttPertDataService';
export { getMilestoneService, UnifiedMilestoneService } from './UnifiedMilestoneService';

/**
 * MilestoneService class - Legacy API for backward compatibility
 * New code should use UnifiedMilestoneService or getMilestoneService()
 */
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
   * Get milestones summary for timeline view (Gantt compatible)
   */
  static async getProjectMilestonesSummary(projectId: string): Promise<MilestoneSummaryDTO[]> {
    const { data: milestones, error: mError } = await supabase
      .from('enhanced_project_milestones')
      .select('id, title, target_date, completed_date, status, phase_id, weight, dependencies')
      .eq('project_id', projectId)
      .order('target_date', { ascending: true });

    if (mError) throw mError;

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

    return (milestones || []).map(m => {
      const deps = m.dependencies as any;
      return {
        id: m.id,
        title: m.title,
        target_date: m.target_date,
        completed_date: m.completed_date || undefined,
        status: m.status as MilestoneSummaryDTO['status'],
        type: deps?.type || 'checkpoint',
        priority: deps?.priority || 'normal',
        phase_id: m.phase_id || undefined,
        phase_name: m.phase_id ? phaseMap[m.phase_id] : undefined,
        weight: m.weight || 0.1,
        is_critical: deps?.is_critical || false,
        float_days: deps?.float_days
      };
    });
  }

  /**
   * Calculate milestone progress with PM metrics
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

    const plannedToDate = milestones.filter(m => 
      m.target_date && isBefore(parseISO(m.target_date), today)
    );
    const plannedWeight = plannedToDate.reduce((sum, m) => sum + (m.weight || 0.1), 0);
    const earnedWeight = plannedToDate.filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + (m.weight || 0.1), 0);
    const spi = plannedWeight > 0 ? earnedWeight / plannedWeight : 1;

    const criticalMilestones = milestones.filter(m => {
      const deps = m.dependencies as any;
      return deps?.is_critical || deps?.priority === 'critical';
    });
    
    const criticalDelayed = criticalMilestones.filter(m => 
      m.status !== 'completed' && 
      m.target_date && 
      isBefore(parseISO(m.target_date), today)
    );

    let criticalPathStatus: 'on_track' | 'at_risk' | 'delayed' = 'on_track';
    if (criticalDelayed.length > 0) {
      criticalPathStatus = 'delayed';
    } else if (spi < 0.9) {
      criticalPathStatus = 'at_risk';
    }

    const pending = milestones.filter(m => m.status !== 'completed');
    const upcoming = pending.filter(m => {
      const targetDate = parseISO(m.target_date);
      const daysUntil = differenceInDays(targetDate, today);
      return daysUntil >= 0 && daysUntil <= 14;
    });

    const nextMilestone = pending.length > 0 ? this.mapToSummary(pending[0]) : undefined;

    return {
      total_milestones: milestones.length,
      completed_milestones: completed.length,
      delayed_milestones: delayed.length,
      weighted_progress: Math.round(weightedProgress),
      schedule_performance_index: Math.round(spi * 100) / 100,
      critical_path_status: criticalPathStatus,
      critical_path_float_days: criticalDelayed.length > 0 ? -differenceInDays(today, parseISO(criticalDelayed[0].target_date)) : undefined,
      next_milestone: nextMilestone,
      overdue_milestones: delayed.map(m => this.mapToSummary(m)),
      upcoming_milestones: upcoming.map(m => this.mapToSummary(m))
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
        dependencies: {
          from_template: isFromTemplate,
          template_id: templateId,
          type: data.type || 'checkpoint',
          priority: data.priority || 'normal',
          deliverables: data.deliverables || [],
          predecessor_ids: data.dependencies || []
        }
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapToDTO(result);
  }

  /**
   * Generate milestones from referential template
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
        is_critical: template.is_critical,
        type: template.type,
        priority: template.priority,
        deliverables: template.deliverables || [],
        approval_requirements: template.approval_requirements || [],
        predecessor_ids: template.predecessor_ids || [],
        tags: template.tags || []
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
   * Calculate critical path
   */
  static async calculateCriticalPath(projectId: string): Promise<CriticalPathDTO> {
    const milestones = await this.getProjectMilestones(projectId);
    
    const criticalMilestones = milestones
      .filter(m => m.is_on_critical_path || m.priority === 'critical')
      .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime());

    const allSorted = milestones.sort((a, b) => 
      new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
    );

    const lastMilestone = allSorted[allSorted.length - 1];
    const firstMilestone = allSorted[0];

    const totalDuration = lastMilestone && firstMilestone 
      ? differenceInDays(parseISO(lastMilestone.target_date), parseISO(firstMilestone.target_date))
      : 0;

    const nearCritical = milestones.filter(m => {
      const floatDays = m.float_days ?? 5;
      return floatDays > 0 && floatDays < 5 && !m.is_on_critical_path;
    });

    return {
      project_id: projectId,
      critical_path_milestones: criticalMilestones.map(m => m.id),
      total_duration_days: totalDuration,
      estimated_end_date: lastMilestone?.target_date || format(new Date(), 'yyyy-MM-dd'),
      near_critical_paths: nearCritical.length > 0 ? [{
        milestones: nearCritical.map(m => m.id),
        float_days: Math.min(...nearCritical.map(m => m.float_days ?? 5))
      }] : []
    };
  }

  /**
   * Update a milestone
   */
  static async updateMilestone(
    milestoneId: string, 
    data: Partial<MilestoneFormDTO> & { status?: string; completed_date?: string | null }
  ): Promise<MilestoneDTO> {
    const { data: current } = await supabase
      .from('enhanced_project_milestones')
      .select('dependencies')
      .eq('id', milestoneId)
      .single();

    const currentDeps = (current?.dependencies as any) || {};
    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.target_date !== undefined) updateData.target_date = data.target_date;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.completed_date !== undefined) updateData.completed_date = data.completed_date;
    
    if (data.type || data.priority || data.deliverables || data.dependencies) {
      updateData.dependencies = {
        ...currentDeps,
        ...(data.type && { type: data.type }),
        ...(data.priority && { priority: data.priority }),
        ...(data.deliverables && { deliverables: data.deliverables }),
        ...(data.dependencies && { predecessor_ids: data.dependencies })
      };
    }

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
   * Toggle milestone completion
   */
  static async toggleComplete(milestoneId: string): Promise<MilestoneDTO> {
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
   * Approve a gate milestone
   */
  static async approveGate(milestoneId: string, approvedBy: string): Promise<MilestoneDTO> {
    const { data: current } = await supabase
      .from('enhanced_project_milestones')
      .select('dependencies')
      .eq('id', milestoneId)
      .single();

    const currentDeps = (current?.dependencies as any) || {};

    const { data: result, error } = await supabase
      .from('enhanced_project_milestones')
      .update({
        status: 'completed',
        completed_date: format(new Date(), 'yyyy-MM-dd'),
        dependencies: {
          ...currentDeps,
          approval_status: 'approved',
          approved_by: approvedBy,
          approval_date: format(new Date(), 'yyyy-MM-dd')
        }
      })
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) throw error;

    return this.mapToDTO(result);
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
   * Delete template milestones for a phase
   */
  static async deleteTemplateMilestones(phaseId: string): Promise<void> {
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
      early_start_date: deps?.early_start_date,
      late_finish_date: deps?.late_finish_date,
      completed_date: data.completed_date || undefined,
      status: data.status || 'pending',
      type: deps?.type || 'checkpoint',
      priority: deps?.priority || 'normal',
      weight: data.weight || 0.1,
      notes: data.notes || undefined,
      is_from_template: deps?.from_template || false,
      template_id: deps?.template_id,
      dependencies: deps?.predecessor_ids,
      float_days: deps?.float_days,
      is_on_critical_path: deps?.is_critical || deps?.priority === 'critical',
      deliverables: deps?.deliverables,
      approval_status: deps?.approval_status,
      approved_by: deps?.approved_by,
      approval_date: deps?.approval_date,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  private static mapToSummary(data: any): MilestoneSummaryDTO {
    const deps = data.dependencies as any;
    return {
      id: data.id,
      title: data.title,
      target_date: data.target_date,
      completed_date: data.completed_date || undefined,
      status: data.status as MilestoneSummaryDTO['status'],
      type: deps?.type || 'checkpoint',
      priority: deps?.priority || 'normal',
      weight: data.weight || 0.1,
      is_critical: deps?.is_critical || false,
      float_days: deps?.float_days
    };
  }
}
