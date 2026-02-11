// useMonitoring.ts - Hook for centralized monitoring
import { useState, useEffect, useCallback } from 'react';
import { ProjectData, ActionLabels, EscalationRoles } from '@/dtos/entities/ProjectDTO';
import { getMonitoringService, MonitoringService, MonitoringConfiguration, MonitoringMetrics, defaultMonitoringConfig } from '@/application/services/MonitoringService';

interface UseMonitoringResult {
  metrics: MonitoringMetrics | null;
  isLoading: boolean;
  automatedActions: string[];
  manualActionsRequired: string[];
  workflowSuggestions: {
    creationSuggestions: string[];
    modificationSuggestions: string[];
    importSuggestions: string[];
    exportSuggestions: string[];
  };
  performanceOptimizations: {
    criticalPath: string[];
    resourceBottlenecks: string[];
    scheduleOptimizations: string[];
    costOptimizations: string[];
  };
  runMonitoring: () => Promise<void>;
  validateProject: (project: ProjectData) => {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    fixedIssues: string[];
  };
}

export const useMonitoring = (
  project: ProjectData,
  roles: EscalationRoles,
  actions: ActionLabels,
  config: MonitoringConfiguration = defaultMonitoringConfig
): UseMonitoringResult => {
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [automatedActions, setAutomatedActions] = useState<string[]>([]);
  const [manualActionsRequired, setManualActionsRequired] = useState<string[]>([]);
  const [workflowSuggestions, setWorkflowSuggestions] = useState<{
    creationSuggestions: string[];
    modificationSuggestions: string[];
    importSuggestions: string[];
    exportSuggestions: string[];
  }>({
    creationSuggestions: [],
    modificationSuggestions: [],
    importSuggestions: [],
    exportSuggestions: []
  });
  const [performanceOptimizations, setPerformanceOptimizations] = useState<{
    criticalPath: string[];
    resourceBottlenecks: string[];
    scheduleOptimizations: string[];
    costOptimizations: string[];
  }>({
    criticalPath: [],
    resourceBottlenecks: [],
    scheduleOptimizations: [],
    costOptimizations: []
  });

  const [monitoringService] = useState(() => 
    new MonitoringService(project, roles, actions, config)
  );

  const runMonitoring = useCallback(async () => {
    setIsLoading(true);
    try {
      // Run automated monitoring
      const result = await monitoringService.runAutomatedMonitoring();
      
      setMetrics(result.metrics);
      setAutomatedActions(result.automatedActions);
      setManualActionsRequired(result.manualActionsRequired);
      
      // Get workflow suggestions
      const suggestions = monitoringService.getWorkflowSuggestions(project);
      setWorkflowSuggestions(suggestions);
      
      // Get performance optimizations
      const optimizations = monitoringService.getPerformanceOptimizations();
      setPerformanceOptimizations(optimizations);
      
    } catch (error) {
      console.error('Monitoring failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [monitoringService, project]);

  const validateProject = useCallback((projectToValidate: ProjectData) => {
    return monitoringService.validateAndCleanupProject(projectToValidate);
  }, [monitoringService]);

  // Auto-run monitoring on mount and periodically
  useEffect(() => {
    runMonitoring();
    
    // Set up periodic monitoring based on configuration
    const minInterval = Math.min(
      config.checkIntervals.insurance,
      config.checkIntervals.delays,
      config.checkIntervals.inspections,
      config.checkIntervals.financial
    );
    
    const intervalMs = minInterval * 60 * 60 * 1000; // Convert hours to milliseconds
    const interval = setInterval(runMonitoring, intervalMs);
    
    return () => clearInterval(interval);
  }, [runMonitoring, config]);

  return {
    metrics,
    isLoading,
    automatedActions,
    manualActionsRequired,
    workflowSuggestions,
    performanceOptimizations,
    runMonitoring,
    validateProject
  };
};