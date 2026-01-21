import { supabase } from '@/integrations/supabase/client';

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  target_date: string;
  actual_completion_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deliverables: string[];
  dependencies: string[];
  assigned_to?: string;
  budget?: number;
  actual_cost?: number;
  created_at: string;
  updated_at: string;
}

export class MilestoneService {
  static async getProjectMilestones(projectId: string): Promise<Milestone[]> {
    try {
      const { data, error } = await supabase
        .from('enhanced_project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('target_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        project_id: item.project_id,
        title: item.title,
        description: item.description || undefined,
        target_date: item.target_date,
        actual_completion_date: item.completed_date || undefined,
        status: (item.status as Milestone['status']) || 'pending',
        progress: item.weight || 0,
        priority: 'medium' as const,
        deliverables: [] as string[],
        dependencies: [] as string[],
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      }));
    } catch (error: unknown) {
      console.error('Error fetching milestones:', error);
      return [];
    }
  }

  static async createMilestone(milestoneData: Omit<Milestone, 'id' | 'created_at' | 'updated_at'>): Promise<Milestone> {
    const { data, error } = await supabase
      .from('enhanced_project_milestones')
      .insert({
        project_id: milestoneData.project_id,
        title: milestoneData.title,
        description: milestoneData.description,
        target_date: milestoneData.target_date,
        status: milestoneData.status || 'pending',
        weight: milestoneData.progress || 0
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...milestoneData,
      id: data.id,
      deliverables: milestoneData.deliverables || [],
      dependencies: milestoneData.dependencies || [],
      created_at: data.created_at ?? new Date().toISOString(),
      updated_at: data.updated_at ?? new Date().toISOString()
    };
  }

  static async updateMilestone(id: string, updates: Partial<Milestone>): Promise<Milestone> {
    const { data, error } = await supabase
      .from('enhanced_project_milestones')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      project_id: data.project_id,
      title: data.title,
      target_date: data.target_date,
      status: (data.status as Milestone['status']) || 'pending',
      progress: data.weight || 0,
      priority: 'medium',
      deliverables: [],
      dependencies: [],
      created_at: data.created_at ?? new Date().toISOString(),
      updated_at: data.updated_at ?? new Date().toISOString()
    };
  }

  static async deleteMilestone(id: string): Promise<void> {
    const { error } = await supabase.from('enhanced_project_milestones').delete().eq('id', id);
    if (error) throw error;
  }

  static async getMilestoneById(id: string): Promise<Milestone | null> {
    const { data, error } = await supabase.from('enhanced_project_milestones').select('*').eq('id', id).single();
    if (error) return null;
    return {
      id: data.id,
      project_id: data.project_id,
      title: data.title,
      target_date: data.target_date,
      status: (data.status as Milestone['status']) || 'pending',
      progress: data.weight || 0,
      priority: 'medium',
      deliverables: [],
      dependencies: [],
      created_at: data.created_at ?? new Date().toISOString(),
      updated_at: data.updated_at ?? new Date().toISOString()
    };
  }

  static async completeMilestone(id: string): Promise<Milestone> {
    return this.updateMilestone(id, { status: 'completed', progress: 100 });
  }

  static async getMilestoneStats(projectId: string) {
    const milestones = await this.getProjectMilestones(projectId);
    return {
      total: milestones.length,
      completed: milestones.filter(m => m.status === 'completed').length,
      in_progress: milestones.filter(m => m.status === 'in_progress').length,
      pending: milestones.filter(m => m.status === 'pending').length,
      delayed: milestones.filter(m => m.status === 'delayed').length,
      cancelled: milestones.filter(m => m.status === 'cancelled').length,
      completion_rate: 0,
      on_time_completion_rate: 0,
      average_progress: 0
    };
  }
}
