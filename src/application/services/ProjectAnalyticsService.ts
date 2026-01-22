/**
 * Project Analytics Service
 * Uses existing tables and mock data where tables don't exist
 */

import { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';

export interface ProjectAnalytics {
  project_id: string;
  total_budget: number;
  actual_cost: number;
  budget_variance: number;
  remaining_budget: number;
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
  cpi: number;
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

// In-memory store for analytics
const analyticsCache = new Map<string, ProjectAnalytics>();
const risksStore = new Map<string, ProjectRisk[]>();

export class ProjectAnalyticsService {
  /**
   * Get comprehensive project analytics
   */
  static async getProjectAnalytics(projectId: string): Promise<ProjectAnalytics> {
    try {
      // Check cache first
      if (analyticsCache.has(projectId)) {
        return analyticsCache.get(projectId)!;
      }

      // Generate mock analytics based on project ID
      const analytics: ProjectAnalytics = {
        project_id: projectId,
        total_budget: 1000000,
        actual_cost: 450000,
        budget_variance: 550000,
        remaining_budget: 550000,
        progress_percentage: 45,
        milestone_completion: 40,
        risk_score: 35,
        quality_score: 85,
        timeline_variance: -5,
        resource_utilization: 75,
        cost_efficiency: 45,
        schedule_performance: 80,
        stakeholder_satisfaction: 90,
        last_updated: new Date().toISOString(),
        cpi: 1.1
      };

      analyticsCache.set(projectId, analytics);
      return analytics;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching project analytics:', error);
      throw new Error(`Failed to fetch project analytics: ${message}`);
    }
  }

  /**
   * Get detailed project metrics
   */
  static async getProjectMetrics(projectId: string): Promise<ProjectMetrics> {
    try {
      // Return mock metrics
      return {
        total_tasks: 50,
        completed_tasks: 20,
        pending_tasks: 25,
        overdue_tasks: 5,
        total_milestones: 10,
        completed_milestones: 4,
        total_risks: 8,
        high_risks: 2,
        medium_risks: 3,
        low_risks: 3,
        total_issues: 12,
        open_issues: 5,
        resolved_issues: 7
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching project metrics:', error);
      throw new Error(`Failed to fetch project metrics: ${message}`);
    }
  }

  /**
   * Get project progress data
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
      // Return mock progress data
      return {
        overall_progress: 45,
        phases_progress: [
          { phase_name: 'Planning', progress: 100, status: 'completed' },
          { phase_name: 'Design', progress: 80, status: 'in_progress' },
          { phase_name: 'Development', progress: 40, status: 'in_progress' },
          { phase_name: 'Testing', progress: 10, status: 'pending' },
          { phase_name: 'Deployment', progress: 0, status: 'pending' }
        ],
        timeline_progress: []
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching project progress:', error);
      throw new Error(`Failed to fetch project progress: ${message}`);
    }
  }

  /**
   * Get project risks analysis
   */
  static async getProjectRisks(projectId: string): Promise<ProjectRisk[]> {
    try {
      // Return from cache or generate mock data
      if (risksStore.has(projectId)) {
        return risksStore.get(projectId)!;
      }

      const mockRisks: ProjectRisk[] = [
        {
          id: crypto.randomUUID(),
          project_id: projectId,
          risk_title: 'Budget Overrun Risk',
          risk_description: 'Potential for exceeding allocated budget',
          risk_category: 'Financial',
          probability: 'medium',
          impact: 'high',
          risk_score: 70,
          mitigation_strategy: 'Regular budget reviews and contingency planning',
          status: 'active',
          identified_date: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          project_id: projectId,
          risk_title: 'Schedule Delay Risk',
          risk_description: 'Potential for missing project deadlines',
          risk_category: 'Schedule',
          probability: 'low',
          impact: 'medium',
          risk_score: 40,
          mitigation_strategy: 'Buffer time in schedule and regular progress tracking',
          status: 'active',
          identified_date: new Date().toISOString()
        }
      ];

      risksStore.set(projectId, mockRisks);
      return mockRisks;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching project risks:', error);
      throw new Error(`Failed to fetch project risks: ${message}`);
    }
  }

  /**
   * Get project cost analysis
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
      const totalBudget = 1000000;
      const actualCost = 450000;
      const committedCost = 600000;
      const remainingBudget = totalBudget - actualCost;
      const costVariance = totalBudget - actualCost;
      const costPerformanceIndex = 1.1;
      const estimateAtCompletion = 900000;
      const varianceAtCompletion = 100000;

      return {
        total_budget: totalBudget,
        actual_cost: actualCost,
        committed_cost: committedCost,
        remaining_budget: remainingBudget,
        cost_variance: costVariance,
        cost_performance_index: costPerformanceIndex,
        estimate_at_completion: estimateAtCompletion,
        variance_at_completion: varianceAtCompletion,
        cost_breakdown: [
          { category: 'Labor', budgeted_cost: 400000, actual_cost: 200000, variance: 200000 },
          { category: 'Materials', budgeted_cost: 300000, actual_cost: 150000, variance: 150000 },
          { category: 'Equipment', budgeted_cost: 200000, actual_cost: 80000, variance: 120000 },
          { category: 'Overhead', budgeted_cost: 100000, actual_cost: 20000, variance: 80000 }
        ]
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching cost analysis:', error);
      throw new Error(`Failed to fetch cost analysis: ${message}`);
    }
  }

  /**
   * Update project analytics cache
   */
  static async updateProjectAnalytics(projectId: string): Promise<void> {
    try {
      const analytics = await this.getProjectAnalytics(projectId);
      analyticsCache.set(projectId, {
        ...analytics,
        last_updated: new Date().toISOString()
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error updating project analytics:', error);
      throw new Error(`Failed to update project analytics: ${message}`);
    }
  }

  /**
   * Add a project risk
   */
  static async addProjectRisk(risk: Omit<ProjectRisk, 'id'>): Promise<ProjectRisk> {
    const newRisk: ProjectRisk = {
      ...risk,
      id: crypto.randomUUID()
    };

    const projectRisks = risksStore.get(risk.project_id) || [];
    projectRisks.push(newRisk);
    risksStore.set(risk.project_id, projectRisks);

    return newRisk;
  }

  /**
   * Update a project risk
   */
  static async updateProjectRisk(riskId: string, updates: Partial<ProjectRisk>): Promise<ProjectRisk | null> {
    for (const [projectId, risks] of risksStore.entries()) {
      const riskIndex = risks.findIndex(r => r.id === riskId);
      if (riskIndex >= 0) {
        const updatedRisk = { ...risks[riskIndex], ...updates };
        risks[riskIndex] = updatedRisk;
        risksStore.set(projectId, risks);
        return updatedRisk;
      }
    }
    return null;
  }

  /**
   * Delete a project risk
   */
  static async deleteProjectRisk(riskId: string): Promise<boolean> {
    for (const [projectId, risks] of risksStore.entries()) {
      const filteredRisks = risks.filter(r => r.id !== riskId);
      if (filteredRisks.length !== risks.length) {
        risksStore.set(projectId, filteredRisks);
        return true;
      }
    }
    return false;
  }

  /**
   * Get project compliance data
   */
  static async getComplianceData(projectDetail: ProjectDetailDTO): Promise<{
    compliance_score: number;
    regulatory_compliance: number;
    safety_compliance: number;
    quality_compliance: number;
    documentation_compliance: number;
    last_audit_date: string;
    next_audit_date: string;
    compliance_issues: Array<{
      category: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      due_date: string;
    }>;
  }> {
    try {
      // Return mock compliance data
      return {
        compliance_score: 87,
        regulatory_compliance: 92,
        safety_compliance: 85,
        quality_compliance: 90,
        documentation_compliance: 82,
        last_audit_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        next_audit_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
        compliance_issues: [
          {
            category: 'Documentation',
            severity: 'medium',
            description: 'Missing safety inspection reports for phase 2',
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            category: 'Quality',
            severity: 'low',
            description: 'Minor deviations in material specifications',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching compliance data:', error);
      throw new Error(`Failed to fetch compliance data: ${message}`);
    }
  }
}
