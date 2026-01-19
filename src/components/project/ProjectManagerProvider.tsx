// services/ProjectManagerProvider.tsx
import React, { useState, useCallback, ReactNode } from "react";

import {
  ProjectManager,
} from "@/application/services/projectManagerWithActions"
import { ProjectManagerState,ProjectManagerContext } from "@/application/services/ProjectManagerContext";
import { EscalationRoles, ActionLabels, ProjectData } from "@/types/project";

export const ProjectManagerProvider: React.FC<{
  project: ProjectData;
  roles: EscalationRoles;
  actionLabels : ActionLabels;
  children: ReactNode;
}> = ({ project, roles, children,actionLabels }) => {
  const [manager] = useState(() => new ProjectManager(project, roles, actionLabels));
  const [data, setData] = useState<ProjectManagerState | null>(null);

  const runChecks = useCallback(async () => {
    const result = manager.runAllChecks();
    setData({
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

  return (
    <ProjectManagerContext.Provider
      value={{ data, runChecks, acknowledgeAlert }}
    >
      {children}
    </ProjectManagerContext.Provider>
  );
};