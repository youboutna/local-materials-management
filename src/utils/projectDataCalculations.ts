import { ProjectData } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';

export class ProjectDataCalculations {
  /**
   * Calculate real project costs from database
   */
  static async calculateRealProjectCosts(projectId: string) {
    try {
      const [paymentsResponse, expensesResponse, phasesResponse] = await Promise.all([
        supabase.from('payments').select('amount').eq('project_id', projectId),
        supabase.from('mission_expenses').select('amount').eq('mission_id', projectId),
        supabase.from('project_phases').select('estimated_cost, actual_cost').eq('project_id', projectId)
      ]);

      const payments = paymentsResponse.data || [];
      const expenses = expensesResponse.data || [];
      const phases = phasesResponse.data || [];

      const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const estimatedCost = phases.reduce((sum, p) => sum + (p.estimated_cost || 0), 0);
      const actualPhaseCost = phases.reduce((sum, p) => sum + (p.actual_cost || 0), 0);

      return {
        totalPayments,
        totalExpenses,
        estimatedCost,
        actualPhaseCost,
        totalSpent: totalPayments + totalExpenses,
        phasesCostVariance: actualPhaseCost - estimatedCost
      };
    } catch (error) {
      console.error('Error calculating real project costs:', error);
      return {
        totalPayments: 0,
        totalExpenses: 0,
        estimatedCost: 0,
        actualPhaseCost: 0,
        totalSpent: 0,
        phasesCostVariance: 0
      };
    }
  }

  /**
   * Calculate project timeline performance
   */
  static calculateTimelinePerformance(project: ProjectData, phases: any[]) {
    if (!phases || phases.length === 0) {
      return {
        onTimePhases: 0,
        delayedPhases: 0,
        averageDelay: 0,
        scheduleHealth: 'unknown'
      };
    }

    const today = new Date();
    let onTimePhases = 0;
    let delayedPhases = 0;
    let totalDelay = 0;

    phases.forEach(phase => {
      const endDate = new Date(phase.end_date);
      const isCompleted = phase.status === 'completed';
      const isOverdue = !isCompleted && today > endDate;

      if (isCompleted && today <= endDate) {
        onTimePhases++;
      } else if (isOverdue) {
        delayedPhases++;
        const delayDays = Math.ceil((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
        totalDelay += delayDays;
      }
    });

    const averageDelay = delayedPhases > 0 ? totalDelay / delayedPhases : 0;
    const scheduleHealth = delayedPhases === 0 ? 'on_track' : 
                          delayedPhases / phases.length < 0.3 ? 'minor_delays' : 'major_delays';

    return {
      onTimePhases,
      delayedPhases,
      averageDelay,
      scheduleHealth,
      completionRate: phases.filter(p => p.status === 'completed').length / phases.length
    };
  }

  /**
   * Calculate resource utilization
   */
  static async calculateResourceUtilization(projectId: string) {
    try {
      const [employeesResponse, materialsResponse] = await Promise.all([
        supabase.from('employees')
          .select('full_name, position')
          .limit(100), // Get all employees for now, will filter by project later
        supabase.from('materials')
          .select('name, category')
          .limit(100) // Get all materials for now, will filter by project later
      ]);

      const employees = employeesResponse.data || [];
      const materials = materialsResponse.data || [];

      return {
        totalEmployees: employees.length,
        employeesByPosition: employees.reduce((acc, emp) => {
          const position = emp.position || 'Unknown';
          acc[position] = (acc[position] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        totalMaterials: materials.length,
        materialsByCategory: materials.reduce((acc, mat) => {
          const category = mat.category || 'Unknown';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      console.error('Error calculating resource utilization:', error);
      return {
        totalEmployees: 0,
        employeesByPosition: {},
        totalMaterials: 0,
        materialsByCategory: {}
      };
    }
  }

  /**
   * Calculate project health score
   */
  static calculateProjectHealthScore(
    progress: number, 
    budgetUtilization: number, 
    schedulePerformance: number,
    qualityScore: number
  ) {
    // Weighted average: Progress 25%, Budget 30%, Schedule 25%, Quality 20%
    const weights = {
      progress: 0.25,
      budget: 0.30,
      schedule: 0.25,
      quality: 0.20
    };

    const progressScore = Math.min(100, progress * 1.2); // Slight bonus for progress
    const budgetScore = budgetUtilization <= 100 ? 100 - (budgetUtilization - 100) : Math.max(0, 200 - budgetUtilization);
    const scheduleScore = schedulePerformance * 100;

    const healthScore = (
      progressScore * weights.progress +
      budgetScore * weights.budget +
      scheduleScore * weights.schedule +
      qualityScore * weights.quality
    );

    let healthLevel: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    if (healthScore >= 90) healthLevel = 'excellent';
    else if (healthScore >= 75) healthLevel = 'good';
    else if (healthScore >= 60) healthLevel = 'fair';
    else if (healthScore >= 40) healthLevel = 'poor';
    else healthLevel = 'critical';

    return {
      overallScore: Math.round(healthScore),
      healthLevel,
      components: {
        progress: Math.round(progressScore),
        budget: Math.round(budgetScore),
        schedule: Math.round(scheduleScore),
        quality: Math.round(qualityScore)
      }
    };
  }
}