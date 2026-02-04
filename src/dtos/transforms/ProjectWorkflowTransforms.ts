import { ProjectWorkflowDTO } from '@/dtos/workflows/ProjectWorkflowDTO';
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { MaterialDTO } from '@/dtos/entities/MaterialDTO';
import { RiskDTO } from '@/dtos/entities/RiskDTO';
import { StakeholderDTO } from '@/dtos/entities/StakeholderDTO';
import { WorkflowMode } from '@/dtos/enums/WorkflowMode';

export class ProjectWorkflowTransforms {
  static toEntity(dto: ProjectWorkflowDTO) {
    return {
      // Project fields
      project_title: dto.project.title,
      project_description: dto.project.description,
      start_date: dto.project.startDate,
      end_date: dto.project.endDate,
      project_status: dto.project.status,
      
      // Risks
      risks: dto.risks?.map(risk => ({
        risk_id: risk.id,
        risk_title: risk.title,
        risk_probability: risk.probability,
        risk_impact: risk.impact
      })) || [],
      
      // Phases 
      phases: dto.phases?.map(phase => ({
        phase_id: phase.id,
        phase_name: phase.name,
        phase_start_date: phase.startDate,
        phase_end_date: phase.endDate
      })) || []
    };
  }

  static toDTO(entity: ProjectDTO) {
    return {
      project: {
        title: entity.title,
        description: entity.description,
        startDate: entity.startDate,
        endDate: entity.endDate,
        status: entity.status
      },
      risks: entity.risks?.map(risk => ({
        id: risk.risk_id,
        title: risk.risk_title,
        probability: risk.risk_probability,
        impact: risk.risk_impact
      })) || [],
      phases: entity.phases?.map(phase => ({
        id: phase.phase_id,
        name: phase.phase_name,
        startDate: phase.phase_start_date,
        endDate: phase.phase_end_date
      })) || []
    };
  }

  static toCreateDTO(workflow: ProjectWorkflowDTO): ProjectWorkflowDTO {
    return {
      ...workflow,
      mode: WorkflowMode.CREATE,
      currentStep: workflow.currentStep || 0,
      status: workflow.status || 'draft'
    };
  }

  static toEditDTO(workflow: ProjectWorkflowDTO): ProjectWorkflowDTO {
    return {
      ...workflow,
      mode: WorkflowMode.EDIT,
      currentStep: workflow.currentStep || 0,
      status: workflow.status || 'in_progress'
    };
  }

  static fromCreateRequest(request: any): ProjectWorkflowDTO {
    return {
      project: request.project,
      mode: WorkflowMode.CREATE,
      currentStep: 0,
      status: 'draft',
      phases: [],
      materials: [],
      risks: [],
      stakeholders: []
    };
  }

  static fromEditRequest(request: any): ProjectWorkflowDTO {
    return {
      project: request.project,
      mode: WorkflowMode.EDIT,
      currentStep: request.currentStep || 0,
      status: request.status || 'in_progress',
      phases: request.phases || [],
      materials: request.materials || [],
      risks: request.risks || [],
      stakeholders: request.stakeholders || [],
      originalData: request.originalData,
      modifiedFields: request.modifiedFields || []
    };
  }
}
