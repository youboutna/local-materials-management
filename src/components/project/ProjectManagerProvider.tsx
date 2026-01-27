// services/ProjectManagerProvider.tsx
import React, { useState, useCallback, ReactNode } from "react";

import {
  ProjectManager,
} from "@/application/services/projectManagerWithActions"
import { ProjectManagerState,ProjectManagerContext } from "@/application/services/ProjectManagerContext";
import { EscalationRoles, ProjectData } from "@/types/project";
import { ActionLabels } from "@/application/services/projectManagerWithActions";

export const ProjectManagerProvider: React.FC<{
  project: ProjectData;
  roles: EscalationRoles;
  actionLabels : ActionLabels;
  children: ReactNode;
}> = ({ project, roles, children,actionLabels }) => {
  const [manager] = useState(() => new ProjectManager(project, roles, actionLabels));
  const [state, setState] = useState<ProjectManagerState | null>(null);

  const runChecks = useCallback(async () => {
    const result = manager.runAllChecks();
    setState({
      alerts: result.alerts,
      progress: result.progress,
      evmData: result.evmData,
      ganttData: result.ganttData,
      pertData: result.pertData,
    });
  }, [manager]);

  const acknowledgeAlert = useCallback(
    (alertId: string, userId: string, actionTaken?: string) => {
      manager.acknowledgeAlert(alertId, userId, actionTaken);
      runChecks();
    },
    [manager, runChecks]
  );

  const resolveAlert = useCallback(
    (alertId: string, userId: string, resolution?: string) => {
      manager.resolveAlert(alertId, userId, resolution);
      runChecks();
    },
    [manager, runChecks]
  );

  const closeAlert = useCallback(
    (alertId: string, userId: string) => {
      manager.closeAlert(alertId, userId);
      runChecks();
    },
    [manager, runChecks]
  );

  const getAlertsByType = useCallback((type: string) => {
    return manager.getAlertsByType(type as any);
  }, [manager]);

  const getAlertsBySeverity = useCallback((severity: string) => {
    return manager.getAlertsBySeverity(severity as any);
  }, [manager]);

  const needsEscalation = useCallback((alert: any) => {
    return manager.needsEscalation(alert);
  }, [manager]);

  const getEscalationPath = useCallback((alert: any) => {
    return manager.getEscalationPath(alert);
  }, [manager]);

  const getActionLabel = useCallback((alertType: string) => {
    return manager.getActionLabel(alertType as any);
  }, [manager]);

  const getSummaryStats = useCallback(() => {
    return manager.getSummaryStats();
  }, [manager]);

  return (
    <ProjectManagerContext.Provider
      value={{
        manager,
        state: state || manager.getState(),
        alerts: state?.alerts || manager.getAlerts(),
        runChecks,
        acknowledgeAlert,
        resolveAlert,
        closeAlert,
        getAlertsByType,
        getAlertsBySeverity,
        needsEscalation,
        getEscalationPath,
        getActionLabel,
        getSummaryStats
      }}
    >
      {children}
    </ProjectManagerContext.Provider>
  );
};