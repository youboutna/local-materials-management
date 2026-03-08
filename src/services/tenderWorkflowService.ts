// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';

export interface TenderWorkflowStatus {
  id: string;
  tender_id: string;
  phase: string;
  stage: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  started_at?: string;
  completed_at?: string;
  due_date?: string;
  responsible_person?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TenderPhaseProgress {
  phase: string;
  stages: {
    stage: string;
    status: 'pending' | 'in_progress' | 'completed' | 'delayed';
    startDate?: string;
    endDate?: string;
    progress: number;
  }[];
  overallProgress: number;
}

export class TenderWorkflowService {
  
  /**
   * Get workflow status for a tender
   */
  static async getTenderWorkflowStatus(tenderId: string): Promise<TenderWorkflowStatus[]> {
    const { data, error } = await supabase
      .from('tender_workflow_status')
      .select('*')
      .eq('tender_id', tenderId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tender workflow status:', error);
      throw error;
    }

    return (data || []).map(item => ({
      id: item.id,
      tender_id: item.tender_id,
      phase: item.phase,
      stage: item.stage,
      status: item.status as 'pending' | 'in_progress' | 'completed' | 'delayed',
      started_at: item.started_at || undefined,
      completed_at: item.completed_at || undefined,
      due_date: item.due_date || undefined,
      responsible_person: item.responsible_person || undefined,
      notes: item.notes || undefined,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    }));
  }

  /**
   * Update workflow stage status
   */
  static async updateWorkflowStage(
    tenderId: string,
    phase: string,
    stage: string,
    status: 'pending' | 'in_progress' | 'completed' | 'delayed',
    notes?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'in_progress' && !updateData.started_at) {
      updateData.started_at = new Date().toISOString();
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (notes) {
      updateData.notes = notes;
    }

    const { error } = await supabase
      .from('tender_workflow_status')
      .update(updateData)
      .eq('tender_id', tenderId)
      .eq('phase', phase)
      .eq('stage', stage);

    if (error) {
      console.error('Error updating workflow stage:', error);
      throw error;
    }

    // Update tender's current phase and stage if completed
    if (status === 'completed') {
      await this.updateTenderCurrentPhaseStage(tenderId, phase, stage);
    }
  }

  /**
   * Update tender's current phase and stage
   */
  static async updateTenderCurrentPhaseStage(
    tenderId: string,
    phase: string,
    stage: string
  ): Promise<void> {
      // Skip updating current_phase/current_stage as they have type constraints
      const { error } = await supabase
        .from('tenders')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', tenderId);

    if (error) {
      console.error('Error updating tender phase/stage:', error);
      throw error;
    }
  }

  /**
   * Calculate phase progress for a tender
   */
  static async calculateTenderProgress(tenderId: string): Promise<TenderPhaseProgress[]> {
    const workflowStatus = await this.getTenderWorkflowStatus(tenderId);
    
    // Group by phase
    const phaseGroups = workflowStatus.reduce((groups, status) => {
      if (!groups[status.phase]) {
        groups[status.phase] = [];
      }
      groups[status.phase].push(status);
      return groups;
    }, {} as Record<string, TenderWorkflowStatus[]>);

    return Object.entries(phaseGroups).map(([phase, stages]) => {
      const stageProgress = stages.map(stage => ({
        stage: stage.stage,
        status: stage.status,
        startDate: stage.started_at,
        endDate: stage.completed_at,
        progress: stage.status === 'completed' ? 100 : stage.status === 'in_progress' ? 50 : 0
      }));

      const overallProgress = stageProgress.reduce((sum, stage) => sum + stage.progress, 0) / stageProgress.length;

      return {
        phase,
        stages: stageProgress,
        overallProgress
      };
    });
  }

  /**
   * Get overdue workflow stages
   */
  static async getOverdueStages(tenderId?: string): Promise<TenderWorkflowStatus[]> {
    const now = new Date().toISOString();
    
    let query = supabase
      .from('tender_workflow_status')
      .select(`
        *,
        tenders:tender_id (
          title,
          project_reference
        )
      `)
      .lt('due_date', now)
      .neq('status', 'completed');

    if (tenderId) {
      query = query.eq('tender_id', tenderId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching overdue stages:', error);
      throw error;
    }

    return (data || []).map(item => ({
      id: item.id,
      tender_id: item.tender_id,
      phase: item.phase,
      stage: item.stage,
      status: item.status as 'pending' | 'in_progress' | 'completed' | 'delayed',
      started_at: item.started_at || undefined,
      completed_at: item.completed_at || undefined,
      due_date: item.due_date || undefined,
      responsible_person: item.responsible_person || undefined,
      notes: item.notes || undefined,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    }));
  }

  /**
   * Create initial workflow stages for a tender
   */
  static async createInitialWorkflowStages(
    tenderId: string,
    phases: Array<{
      phase: string;
      stage: string;
      dueDate?: string;
      responsiblePerson?: string;
    }>
  ): Promise<void> {
    const workflowStages = phases.map(phaseData => ({
      tender_id: tenderId,
      phase: phaseData.phase,
      stage: phaseData.stage,
      status: 'pending' as const,
      due_date: phaseData.dueDate || null,
      responsible_person: phaseData.responsiblePerson || null,
    }));

    const { error } = await supabase
      .from('tender_workflow_status')
      .insert(workflowStages);

    if (error) {
      console.error('Error creating initial workflow stages:', error);
      throw error;
    }
  }

  /**
   * Get tender deadline alerts
   */
  static async getTenderDeadlineAlerts(): Promise<Array<{
    tender: any;
    daysUntilDeadline: number;
    severity: 'warning' | 'critical';
  }>> {
    const { data: tenders, error } = await supabase
      .from('tenders')
      .select('*')
      .not('deadline_date', 'is', null)
      .in('status', ['draft', 'published']);

    if (error) {
      console.error('Error fetching tenders for deadline alerts:', error);
      throw error;
    }

    const now = new Date();
    const alerts: Array<{
      tender: any;
      daysUntilDeadline: number;
      severity: 'warning' | 'critical';
    }> = [];

    for (const tender of tenders || []) {
      if (tender.deadline_date) {
        const deadline = new Date(tender.deadline_date);
        const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDeadline <= 7 && daysUntilDeadline >= 0) {
          alerts.push({
            tender,
            daysUntilDeadline,
            severity: daysUntilDeadline <= 2 ? 'critical' : 'warning'
          });
        }
      }
    }

    return alerts;
  }
}