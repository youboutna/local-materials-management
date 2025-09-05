// services/ProjectManagerContext.tsx
import React, { createContext, useState, useCallback, ReactNode } from "react";
import {
  ProjectManager,
  ProjectData,
  EscalationRoles,
  Alert,
  EVMData,
  GanttChartData,
  PERTAnalysis,
  actionLabels
} from '@/services/ projectManagerWithActions';

interface ProjectManagerState {
  alerts: Alert[];
  progress: number;
  evmData: EVMData;
  ganttData: GanttChartData;
  pertData: PERTAnalysis;
}

interface ProjectManagerContextValue {
  data: ProjectManagerState | null;
  runChecks: () => Promise<void>;
  acknowledgeAlert: (
    alertId: string,
    userId: string,
    actionTaken?: string
  ) => void;
}

export const ProjectManagerContext =
  createContext<ProjectManagerContextValue | null>(null);

export const ProjectManagerProvider: React.FC<{
  project: ProjectData;
  roles: EscalationRoles;
  children: ReactNode;
}> = ({ project, roles, children }) => {
  const [manager] = useState(() => new ProjectManager(project, roles, actionLabels));
  const [data, setData] = useState<ProjectManagerState | null>(null);

  const runChecks = useCallback(async () => {
    const result = manager.runAllChecks();
    setData({
      alerts: result.alerts,
      progress: result.progress,
      evmData: result.evmData,
      ganttData: result.ganttData,
      pertData: result.pertData
    });
  }, [manager]);

  const acknowledgeAlert = useCallback(
    (alertId: string, userId: string, actionTaken?: string) => {
      manager.acknowledgeAlert(alertId, userId, actionTaken);
      // Refresh the data after acknowledging the alert
      runChecks();
    },
    [manager, runChecks]
  );

  return (
    <ProjectManagerContext.Provider
      value={{ data, runChecks, acknowledgeAlert }}
    >
      {children}
    </ProjectManagerContext.Provider>
  );
};