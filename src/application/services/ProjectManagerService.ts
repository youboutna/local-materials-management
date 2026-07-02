// application/services/ProjectManagerService.ts
import type { EscalationRoles } from "@/dtos/entities/ProjectAggregateDTO";
import {
  ProjectManager,
  type ActionLabels,
  type ProjectManagerState,
} from "./projectManagerWithActions";

export type { ProjectManagerState };

export const actionLabels: ActionLabels = {
  budget: 'Revue budgétaire',
  timeline: 'Revue planning',
  quality: 'Contrôle qualité',
  resource: 'Allocation ressources',
  risk: 'Analyse du risque',
  compliance: 'Contrôle de conformité',
};

export class ProjectManagerService {
  private manager: ProjectManager;

  constructor(project: any, roles: EscalationRoles) {
    this.manager = new ProjectManager(project, roles, actionLabels);
  }

  async runChecks(): Promise<ProjectManagerState> {
    return this.manager.runAllChecks();
  }

  async acknowledgeAlert(
    alertId: string,
    userId: string,
    actionTaken?: string
  ): Promise<void> {
    this.manager.acknowledgeAlert(alertId, userId, actionTaken);
  }
}

