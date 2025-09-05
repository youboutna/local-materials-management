// services/ProjectManagerService.ts
import {
  ProjectManager,
  ProjectData,
  EscalationRoles,
  Alert,
  EVMData,
  GanttChartData,
  PERTAnalysis,
  actionLabels
} from "./ projectManagerWithActions";

export interface ProjectManagerState {
  alerts: Alert[];
  progress: number;
  evmData: EVMData;
  ganttData: GanttChartData;
  pertData: PERTAnalysis;
}

export class ProjectManagerService {
  private manager: ProjectManager;

  constructor(project: ProjectData, roles: EscalationRoles) {
    this.manager = new ProjectManager(project, roles, actionLabels);
  }

  async runChecks(): Promise<ProjectManagerState> {
    const result = this.manager.runAllChecks();
    return {
      alerts: result.alerts,
      progress: result.progress,
      evmData: result.evmData,
      ganttData: result.ganttData,
      pertData: result.pertData
    };
  }

  async acknowledgeAlert(
    alertId: string,
    userId: string,
    actionTaken?: string
  ): Promise<void> {
    this.manager.acknowledgeAlert(alertId, userId, actionTaken);
  }
}