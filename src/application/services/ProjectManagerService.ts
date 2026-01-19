// application/services/ProjectManagerService.ts
import { Alert, EVMData, ProjectData, EscalationRoles, ActionLabels, GanttChartData, PERTAnalysis } from "@/types/project";
import {
  ProjectManager,
} from "../../services/projectManagerWithActions";

export interface ProjectManagerState {
  alerts: Alert[];
  progress: number;
  evmData: EVMData;
  ganttData: GanttChartData;
  pertData: PERTAnalysis;
}
export const actionLabels: ActionLabels = {
  task_assignment: 'Assigner une tâche',
  hierarchy_notification: 'Notifier la hiérarchie',
  sms: 'Envoyer SMS',
  call: 'Programmer appel',
  email: 'Envoyer email',
  mail: 'Courrier postal',
  export_receipt: 'Exporter reçu',
  blockchain_verification: 'Vérification blockchain',
  document_upload: 'Uploader document',
  meeting_schedule: 'Planifier réunion',
  financial_review: 'Revue financière',
  legal_consultation: 'Consultation juridique',
};

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
