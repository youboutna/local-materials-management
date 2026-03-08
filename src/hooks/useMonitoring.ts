// useMonitoring.ts - Hook for centralized monitoring
import { useState, useEffect, useCallback } from 'react';
import { MonitoringService } from '@/application/services/MonitoringService';

interface MonitoringMetrics {
  projectHealth: 'excellent' | 'good' | 'warning' | 'critical';
  automationRate: number;
  manualInterventionsRequired: number;
}

interface MonitoringConfiguration {
  checkIntervals: {
    insurance: number;
    delays: number;
    inspections: number;
    financial: number;
  };
}

const defaultMonitoringConfig: MonitoringConfiguration = {
  checkIntervals: {
    insurance: 24,
    delays: 12,
    inspections: 8,
    financial: 24,
  }
};

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
  validateProject: (project: any) => {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    fixedIssues: string[];
  };
}

export const useMonitoring = (
  project: any,
  roles?: any,
  actions?: any,
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

  const monitoringService = new MonitoringService();

  const runMonitoring = useCallback(async () => {
    setIsLoading(true);
    try {
      if (project?.id) {
        const data = await monitoringService.getProjectMonitoringData(project.id);
        setMetrics(data.metrics);
        setAutomatedActions(data.metrics ? ['Auto-monitoring active'] : []);
        setManualActionsRequired(data.alerts?.filter((a: any) => a.status === 'open').map((a: any) => a.title) || []);
      }
    } catch (error) {
      console.error('Monitoring failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [project?.id]);

  const validateProject = useCallback((projectToValidate: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!projectToValidate.title) errors.push('Title is required');
    if (!projectToValidate.budget || projectToValidate.budget <= 0) warnings.push('Budget not set');
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fixedIssues: []
    };
  }, []);

  useEffect(() => {
    runMonitoring();
    
    const minInterval = Math.min(
      config.checkIntervals.insurance,
      config.checkIntervals.delays,
      config.checkIntervals.inspections,
      config.checkIntervals.financial
    );
    
    const intervalMs = minInterval * 60 * 60 * 1000;
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
