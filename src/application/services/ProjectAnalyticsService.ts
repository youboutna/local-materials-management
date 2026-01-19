import { supabase } from '@/integrations/supabase/client';

export interface ProjectAnalytics {
  project_id: string;
  total_budget: number;
  actual_cost: number;
  budget_variance: number;
  progress_percentage: number;
  milestone_completion: number;
  risk_score: number;
  quality_score: number;
  timeline_variance: number;
  resource_utilization: number;
  cost_efficiency: number;
  schedule_performance: number;
  stakeholder_satisfaction: number;
  last_updated: string;
}

export interface ProjectMetrics {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  total_milestones: number;
  completed_milestones: number;
  total_risks: number;
  high_risks: number;
  medium_risks: number;
  low_risks: number;
  total_issues: number;
  open_issues: number;
  resolved_issues: number;
}

export interface ProjectRisk {
  id: string;
  project_id: string;
  risk_title: string;
  risk_description: string;
  risk_category: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  risk_score: number;
  mitigation_strategy: string;
  status: 'active' | 'mitigated' | 'closed';
  identified_date: string;
  target_resolution_date?: string;
  assigned_to?: string;
}

export class ProjectAnalyticsService {
  
  /**
   * Get comprehensive project analytics
   * @param projectId The project ID
   * @returns Project analytics data
   */
  static async getProjectAnalytics(projectId: string): Promise<ProjectAnalytics> {
    try {
      // Get project basic data
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('budget, actual_cost, start_date, end_date')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Get tasks metrics
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('status, progress')
        .eq('project_id', projectId);

      if (tasksError) throw tasksError;

      // Get milestones metrics
      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('status, target_date')
        .eq('project_id', projectId);

      if (milestonesError) throw milestonesError;

      // Get risks metrics
      const { data: risks, error: risksError } = await supabase
        .from('project_risks')
        .select('probability, impact, risk_score')
        .eq('project_id', projectId)
        .eq('status', 'active');

      if (risksError) throw risksError;

      // Calculate analytics
      const totalBudget = project?.budget || 0;
      const actualCost = project?.actual_cost || 0;
      const budgetVariance = totalBudget - actualCost;
      
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const totalTasks = tasks?.length || 0;
      const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      const completedMilestones = milestones?.filter(m => m.status === 'completed').length || 0;
      const totalMilestones = milestones?.length || 0;
      const milestoneCompletion = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
      
      const avgRiskScore = risks?.reduce((sum, risk) => sum + risk.risk_score, 0) || 0;
      const riskScore = risks?.length > 0 ? avgRiskScore / risks.length : 0;

      return {
        project_id: projectId,
        total_budget: totalBudget,
        actual_cost: actualCost,
        budget_variance: budgetVariance,
        progress_percentage: Math.round(progressPercentage),
        milestone_completion: Math.round(milestoneCompletion),
        risk_score: Math.round(riskScore),
        quality_score: 85, // Placeholder - would be calculated from quality metrics
        timeline_variance: 0, // Placeholder - would be calculated from schedule data
        resource_utilization: 75, // Placeholder - would be calculated from resource data
        cost_efficiency: totalBudget > 0 ? (actualCost / totalBudget) * 100 : 0,
        schedule_performance: 80, // Placeholder - would be calculated from timeline data
        stakeholder_satisfaction: 90, // Placeholder - would be calculated from feedback data
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching project analytics:', error);
      throw new Error(`Failed to fetch project analytics: ${error.message}`);
    }
  }

  /**
   * Get detailed project metrics
   * @param projectId The project ID
   * @returns Project metrics data
   */
  static async getProjectMetrics(projectId: string): Promise<ProjectMetrics> {
    try {
      // Get tasks metrics
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('status, due_date')
        .eq('project_id', projectId);

      if (tasksError) throw tasksError;

      // Get milestones metrics
      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('status')
        .eq('project_id', projectId);

      if (milestonesError) throw milestonesError;

      // Get risks metrics
      const { data: risks, error: risksError } = await supabase
        .from('project_risks')
        .select('probability, impact, status')
        .eq('project_id', projectId);

      if (risksError) throw risksError;

      // Get issues metrics
      const { data: issues, error: issuesError } = await supabase
        .from('project_issues')
        .select('status')
        .eq('project_id', projectId);

      if (issuesError) throw issuesError;

      const now = new Date();
      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const pendingTasks = tasks?.filter(t => t.status === 'pending').length || 0;
      const overdueTasks = tasks?.filter(t => 
        t.status !== 'completed' && t.due_date && new Date(t.due_date) < now
      ).length || 0;

      const totalMilestones = milestones?.length || 0;
      const completedMilestones = milestones?.filter(m => m.status === 'completed').length || 0;

      const totalRisks = risks?.length || 0;
      const highRisks = risks?.filter(r => r.probability === 'high' && r.impact === 'high').length || 0;
      const mediumRisks = risks?.filter(r => 
        (r.probability === 'high' && r.impact === 'medium') ||
        (r.probability === 'medium' && r.impact === 'high')
      ).length || 0;
      const lowRisks = totalRisks - highRisks - mediumRisks;

      const totalIssues = issues?.length || 0;
      const openIssues = issues?.filter(i => i.status === 'open').length || 0;
      const resolvedIssues = issues?.filter(i => i.status === 'resolved').length || 0;

      return {
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        pending_tasks: pendingTasks,
        overdue_tasks: overdueTasks,
        total_milestones: totalMilestones,
        completed_milestones: completedMilestones,
        total_risks: totalRisks,
        high_risks: highRisks,
        medium_risks: mediumRisks,
        low_risks: lowRisks,
        total_issues: totalIssues,
        open_issues: openIssues,
        resolved_issues: resolvedIssues
      };
    } catch (error) {
      console.error('Error fetching project metrics:', error);
      throw new Error(`Failed to fetch project metrics: ${error.message}`);
    }
  }

  /**
   * Get project progress data
   * @param projectId The project ID
   * @returns Progress data with timeline
   */
  static async getProjectProgress(projectId: string): Promise<{
    overall_progress: number;
    phases_progress: Array<{
      phase_name: string;
      progress: number;
      status: string;
    }>;
    timeline_progress: Array<{
      date: string;
      planned_progress: number;
      actual_progress: number;
    }>;
  }> {
    try {
      // Get phases progress
      const { data: phases, error: phasesError } = await supabase
        .from('project_phases')
        .select('phase_name, progress, status')
        .eq('project_id', projectId)
        .order('order_index');

      if (phasesError) throw phasesError;

      const overallProgress = phases?.reduce((sum, phase) => sum + (phase.progress || 0), 0) || 0;
      const avgProgress = phases?.length > 0 ? overallProgress / phases.length : 0;

      return {
        overall_progress: Math.round(avgProgress),
        phases_progress: phases?.map(phase => ({
          phase_name: phase.phase_name,
          progress: phase.progress || 0,
          status: phase.status
        })) || [],
        timeline_progress: [] // Placeholder - would be calculated from historical data
      };
    } catch (error) {
      console.error('Error fetching project progress:', error);
      throw new Error(`Failed to fetch project progress: ${error.message}`);
    }
  }

  /**
   * Get project risks analysis
   * @param projectId The project ID
   * @returns Project risks data
   */
  static async getProjectRisks(projectId: string): Promise<ProjectRisk[]> {
    try {
      const { data, error } = await supabase
        .from('project_risks')
        .select('*')
        .eq('project_id', projectId)
        .order('risk_score', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching project risks:', error);
      throw new Error(`Failed to fetch project risks: ${error.message}`);
    }
  }

  /**
   * Get project cost analysis
   * @param projectId The project ID
   * @returns Cost analysis data
   */
  static async getProjectCostAnalysis(projectId: string): Promise<{
    total_budget: number;
    actual_cost: number;
    committed_cost: number;
    remaining_budget: number;
    cost_variance: number;
    cost_performance_index: number;
    estimate_at_completion: number;
    variance_at_completion: number;
    cost_breakdown: Array<{
      category: string;
      budgeted_cost: number;
      actual_cost: number;
      variance: number;
    }>;
  }> {
    try {
      // Get project budget and actual costs
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('budget, actual_cost')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Get cost breakdown by category
      const { data: expenses, error: expensesError } = await supabase
        .from('project_expenses')
        .select('category, amount, budgeted_amount')
        .eq('project_id', projectId);

      if (expensesError) throw expensesError;

      const totalBudget = project?.budget || 0;
      const actualCost = project?.actual_cost || 0;
      const committedCost = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
      const remainingBudget = totalBudget - actualCost;
      const costVariance = totalBudget - actualCost;
      const costPerformanceIndex = actualCost > 0 ? totalBudget / actualCost : 1;
      const estimateAtCompletion = costPerformanceIndex > 0 ? totalBudget / costPerformanceIndex : actualCost;
      const varianceAtCompletion = totalBudget - estimateAtCompletion;

      // Calculate cost breakdown
      const costBreakdown = expenses?.map(expense => ({
        category: expense.category,
        budgeted_cost: expense.budgeted_amount || 0,
        actual_cost: expense.amount || 0,
        variance: (expense.budgeted_amount || 0) - (expense.amount || 0)
      })) || [];

      return {
        total_budget: totalBudget,
        actual_cost: actualCost,
        committed_cost: committedCost,
        remaining_budget: remainingBudget,
        cost_variance: costVariance,
        cost_performance_index: Math.round(costPerformanceIndex * 100) / 100,
        estimate_at_completion: estimateAtCompletion,
        variance_at_completion: varianceAtCompletion,
        cost_breakdown: costBreakdown
      };
    } catch (error) {
      console.error('Error fetching cost analysis:', error);
      throw new Error(`Failed to fetch cost analysis: ${error.message}`);
    }
  }

  /**
   * Update project analytics cache
   * @param projectId The project ID
   */
  static async updateProjectAnalytics(projectId: string): Promise<void> {
    try {
      const analytics = await this.getProjectAnalytics(projectId);
      
      const { error } = await supabase
        .from('project_analytics')
        .upsert({
          project_id: projectId,
          ...analytics,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating project analytics:', error);
      throw new Error(`Failed to update project analytics: ${error.message}`);
    }
  }
}
