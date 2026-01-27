/**
 * useProjectsFull - Extended project hooks with analytics
 */

import { ProjectData } from '@/types/project';

export function useProjectsFull() {
  /**
   * Get project health status
   */
  const getProjectHealth = (project: ProjectData): 'healthy' | 'warning' | 'critical' => {
    // Check budget utilization
    const budgetUsed = project.budget > 0 ? (project.progress / 100) * project.budget : 0;
    const budgetRatio = project.budget > 0 ? budgetUsed / project.budget : 0;
    
    // Check timeline
    const now = new Date();
    const endDate = project.endDate ? new Date(project.endDate) : null;
    const startDate = project.startDate ? new Date(project.startDate) : null;
    
    let timelineProgress = 0;
    if (startDate && endDate) {
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      timelineProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    }
    
    // Calculate health based on progress vs timeline
    const progressDiff = project.progress - timelineProgress;
    
    if (progressDiff < -20 || budgetRatio > 0.95) {
      return 'critical';
    } else if (progressDiff < -10 || budgetRatio > 0.85) {
      return 'warning';
    }
    return 'healthy';
  };

  /**
   * Get project progress percentage
   */
  const getProjectProgress = (project: ProjectData): number => {
    return project.progress || 0;
  };

  /**
   * Get project risk level
   */
  const getProjectRisk = (project: ProjectData): 'low' | 'medium' | 'high' => {
    const health = getProjectHealth(project);
    if (health === 'critical') return 'high';
    if (health === 'warning') return 'medium';
    return 'low';
  };

  /**
   * Get project analytics
   */
  const getProjectAnalytics = (project: ProjectData) => {
    const health = getProjectHealth(project);
    const progress = getProjectProgress(project);
    const risk = getProjectRisk(project);
    
    return {
      health,
      progress,
      risk,
      budgetUtilization: project.budget > 0 ? (progress / 100) : 0,
      isOnTrack: health === 'healthy',
      needsAttention: health !== 'healthy'
    };
  };

  return {
    getProjectHealth,
    getProjectProgress,
    getProjectRisk,
    getProjectAnalytics
  };
}
