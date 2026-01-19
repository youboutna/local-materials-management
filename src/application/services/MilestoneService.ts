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

export interface MilestoneProgress {
  milestone_id: string;
  progress_percentage: number;
  completed_deliverables: number;
  total_deliverables: number;
  days_remaining: number;
  is_on_track: boolean;
  risk_level: 'low' | 'medium' | 'high';
}

export class MilestoneService {
  
  /**
   * Get all milestones for a project
   * @param projectId The project ID
   * @returns Array of milestones
   */
  static async getProjectMilestones(projectId: string): Promise<Milestone[]> {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('target_date', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching project milestones:', error);
      throw new Error(`Failed to fetch project milestones: ${error.message}`);
    }
  }

  /**
   * Create a new milestone
   * @param milestoneData The milestone data
   * @returns The created milestone
   */
  static async createMilestone(milestoneData: Omit<Milestone, 'id' | 'created_at' | 'updated_at'>): Promise<Milestone> {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .insert({
          ...milestoneData,
          progress: milestoneData.progress || 0,
          status: milestoneData.status || 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw new Error(`Failed to create milestone: ${error.message}`);
    }
  }

  /**
   * Update an existing milestone
   * @param milestoneId The milestone ID
   * @param updates The updates to apply
   * @returns The updated milestone
   */
  static async updateMilestone(milestoneId: string, updates: Partial<Milestone>): Promise<Milestone> {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', milestoneId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating milestone:', error);
      throw new Error(`Failed to update milestone: ${error.message}`);
    }
  }

  /**
   * Delete a milestone
   * @param milestoneId The milestone ID
   */
  static async deleteMilestone(milestoneId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', milestoneId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting milestone:', error);
      throw new Error(`Failed to delete milestone: ${error.message}`);
    }
  }

  /**
   * Get milestone by ID
   * @param milestoneId The milestone ID
   * @returns The milestone or null
   */
  static async getMilestoneById(milestoneId: string): Promise<Milestone | null> {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('id', milestoneId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching milestone:', error);
      throw new Error(`Failed to fetch milestone: ${error.message}`);
    }
  }

  /**
   * Get milestone progress
   * @param milestoneId The milestone ID
   * @returns Milestone progress data
   */
  static async getMilestoneProgress(milestoneId: string): Promise<MilestoneProgress> {
    try {
      const milestone = await this.getMilestoneById(milestoneId);
      if (!milestone) {
        throw new Error('Milestone not found');
      }

      const now = new Date();
      const targetDate = new Date(milestone.target_date);
      const daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const completedDeliverables = milestone.deliverables?.length || 0;
      const totalDeliverables = milestone.deliverables?.length || 0;
      const progressPercentage = milestone.progress || 0;

      // Determine if milestone is on track
      const expectedProgress = daysRemaining > 0 ? 
        Math.max(0, 100 - (daysRemaining / 30) * 100) : 100;
      const isOnTrack = progressPercentage >= expectedProgress;

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (daysRemaining < 7 && milestone.status !== 'completed') {
        riskLevel = 'high';
      } else if (daysRemaining < 14 && !isOnTrack) {
        riskLevel = 'medium';
      }

      return {
        milestone_id: milestoneId,
        progress_percentage: progressPercentage,
        completed_deliverables: completedDeliverables,
        total_deliverables: totalDeliverables,
        days_remaining: daysRemaining,
        is_on_track: isOnTrack,
        risk_level: riskLevel
      };
    } catch (error) {
      console.error('Error fetching milestone progress:', error);
      throw new Error(`Failed to fetch milestone progress: ${error.message}`);
    }
  }

  /**
   * Get upcoming milestones for a project
   * @param projectId The project ID
   * @param daysAhead Number of days ahead to look
   * @returns Array of upcoming milestones
   */
  static async getUpcomingMilestones(projectId: string, daysAhead: number = 30): Promise<Milestone[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .in('status', ['pending', 'in_progress'])
        .lte('target_date', futureDate.toISOString())
        .gte('target_date', new Date().toISOString())
        .order('target_date', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching upcoming milestones:', error);
      throw new Error(`Failed to fetch upcoming milestones: ${error.message}`);
    }
  }

  /**
   * Get overdue milestones for a project
   * @param projectId The project ID
   * @returns Array of overdue milestones
   */
  static async getOverdueMilestones(projectId: string): Promise<Milestone[]> {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .in('status', ['pending', 'in_progress'])
        .lt('target_date', new Date().toISOString())
        .order('target_date', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching overdue milestones:', error);
      throw new Error(`Failed to fetch overdue milestones: ${error.message}`);
    }
  }

  /**
   * Complete a milestone
   * @param milestoneId The milestone ID
   * @param actualCost The actual cost (optional)
   * @returns The updated milestone
   */
  static async completeMilestone(milestoneId: string, actualCost?: number): Promise<Milestone> {
    try {
      const updates: Partial<Milestone> = {
        status: 'completed',
        progress: 100,
        actual_completion_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (actualCost !== undefined) {
        updates.actual_cost = actualCost;
      }

      return await this.updateMilestone(milestoneId, updates);
    } catch (error) {
      console.error('Error completing milestone:', error);
      throw new Error(`Failed to complete milestone: ${error.message}`);
    }
  }

  /**
   * Get milestone statistics for a project
   * @param projectId The project ID
   * @returns Milestone statistics
   */
  static async getMilestoneStats(projectId: string): Promise<{
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
    delayed: number;
    cancelled: number;
    completion_rate: number;
    on_time_completion_rate: number;
    average_progress: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('status, progress, target_date, actual_completion_date')
        .eq('project_id', projectId);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        completed: 0,
        in_progress: 0,
        pending: 0,
        delayed: 0,
        cancelled: 0,
        completion_rate: 0,
        on_time_completion_rate: 0,
        average_progress: 0
      };

      if (data) {
        let totalProgress = 0;
        let onTimeCompletions = 0;

        for (const milestone of data) {
          totalProgress += milestone.progress || 0;

          switch (milestone.status) {
            case 'completed':
              stats.completed++;
              // Check if completed on time
              if (milestone.actual_completion_date && milestone.target_date) {
                if (new Date(milestone.actual_completion_date) <= new Date(milestone.target_date)) {
                  onTimeCompletions++;
                }
              }
              break;
            case 'in_progress':
              stats.in_progress++;
              break;
            case 'pending':
              stats.pending++;
              break;
            case 'delayed':
              stats.delayed++;
              break;
            case 'cancelled':
              stats.cancelled++;
              break;
          }
        }

        stats.average_progress = stats.total > 0 ? Math.round(totalProgress / stats.total) : 0;
        stats.completion_rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        stats.on_time_completion_rate = stats.completed > 0 ? Math.round((onTimeCompletions / stats.completed) * 100) : 0;
      }

      return stats;
    } catch (error) {
      console.error('Error fetching milestone stats:', error);
      throw new Error(`Failed to fetch milestone stats: ${error.message}`);
    }
  }

  /**
   * Update milestone progress
   * @param milestoneId The milestone ID
   * @param progress The progress percentage (0-100)
   * @returns The updated milestone
   */
  static async updateMilestoneProgress(milestoneId: string, progress: number): Promise<Milestone> {
    try {
      if (progress < 0 || progress > 100) {
        throw new Error('Progress must be between 0 and 100');
      }

      const updates: Partial<Milestone> = {
        progress: Math.round(progress),
        updated_at: new Date().toISOString()
      };

      // Update status based on progress
      if (progress >= 100) {
        updates.status = 'completed';
        updates.actual_completion_date = new Date().toISOString();
      } else if (progress > 0) {
        updates.status = 'in_progress';
      }

      return await this.updateMilestone(milestoneId, updates);
    } catch (error) {
      console.error('Error updating milestone progress:', error);
      throw new Error(`Failed to update milestone progress: ${error.message}`);
    }
  }
}
