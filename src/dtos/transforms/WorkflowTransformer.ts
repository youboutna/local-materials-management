/**
 * Workflow Transformer
 * Transformers for workflow operations following hexagonal architecture
 * Following clean code principles: camelCase only, no business logic
 * Rule #3: Convert snake_case ↔ camelCase between entities and DTOs
 */

// Import workflow DTOs
import { 
  ProjectWorkflowData,
  WorkflowMetadataDTO,
  StepRelatedDataDTO,
  SaveResult,
  ValidationResult
} from '@/dtos/workflows/ProjectWorkflowDTOs';
import { PhaseWorkflowDTO } from '@/dtos/workflows/PhaseWorkflowDTO';

// Import entity DTOs
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { PhaseDTO, PhaseType, PhasePriority, PhaseStatus } from '@/dtos/entities/PhaseDTO';
import { RiskDTO, RiskCategory, RiskStatus } from '@/dtos/entities/RiskDTO';

// Import request/response DTOs for workflow operations
import { 
  OnProgressUpdatedRequestDTO,
  TriggerPaymentRequestDTO
} from '@/dtos/entities/WorkflowDTO';

// Domain entities for transformation
interface WorkflowProgressUpdate {
  phaseId: string;
  progress: number;
}

interface WorkflowPaymentRequest {
  phaseId: string;
  amount: number;
}

// Domain entity interfaces for transformation
interface ProjectWorkflowEntity {
  id?: string;
  project_id?: string;
  current_step: number;
  is_draft: boolean;
  is_complete: boolean;
  project_title: string;
  project_description?: string;
  start_date?: string;
  end_date?: string;
  project_status: string;
  budget?: number;
  location?: string;
  progress?: number;
  phases?: Array<{
    phase_id?: string;
    id?: string;
    phase_name?: string;
    name?: string;
    description?: string;
    start_date?: string;
    startDate?: string;
    end_date?: string;
    endDate?: string;
    status?: string;
    progress?: number;
  }>;
  risks?: Array<{
    risk_id?: string;
    id?: string;
    risk_title?: string;
    title?: string;
    risk_probability?: number;
    probability?: number;
    risk_impact?: number;
    impact?: number;
    description?: string;
    status?: string;
  }>;
  last_saved_at?: string;
  total_steps?: number;
  completed_steps?: number;
  progress_percentage?: number;
}

interface PhaseWorkflowEntity {
  id: string;
  phase_id?: string;
  workflow_type?: string;
  current_step?: string | number;
  status?: string;
  started_at?: string;
  completed_at?: string;
  total_steps?: number;
  completed_steps?: number;
  progress_percentage?: number;
  phase?: {
    phase_id?: string;
    id?: string;
    phase_name?: string;
    name?: string;
    description?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    progress?: number;
  };
  steps?: Array<{
    id: string;
    name: string;
    description?: string;
    status?: string;
    progress?: number;
    order_index?: number;
    orderIndex?: number;
    start_date?: string;
    end_date?: string;
  }>;
  resources?: {
    employees?: string[];
    contractors?: string[];
    total_required?: number;
    total_assigned?: number;
    skills?: string[];
  };
  tasks?: unknown[];
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export class WorkflowTransformer {
  static toProgressUpdateDTO(entity: WorkflowProgressUpdate): OnProgressUpdatedRequestDTO {
    return {
      phaseId: entity.phaseId,
      newProgress: entity.progress
    };
  }

  static toProgressUpdateEntity(dto: OnProgressUpdatedRequestDTO): WorkflowProgressUpdate {
    return {
      phaseId: dto.phaseId,
      progress: dto.newProgress
    };
  }

  static toPaymentRequestDTO(entity: WorkflowPaymentRequest): TriggerPaymentRequestDTO {
    return {
      phaseId: entity.phaseId,
      amount: entity.amount
    };
  }

  static toPaymentRequestEntity(dto: TriggerPaymentRequestDTO): WorkflowPaymentRequest {
    return {
      phaseId: dto.phaseId,
      amount: dto.amount
    };
  }

  static toProjectWorkflowDTO(entity: ProjectWorkflowEntity): ProjectWorkflowData {
    return {
      projectId: entity.project_id || entity.id,
      currentStep: entity.current_step || 1,
      isDraft: entity.is_draft || true,
      isComplete: entity.is_complete || false,
      projectData: {
        id: entity.project_id,
        title: entity.project_title || '',
        description: entity.project_description || '',
        startDate: entity.start_date || '',
        endDate: entity.end_date || '',
        status: entity.project_status || 'draft',
        budget: entity.budget || 0,
        location: entity.location || '',
        progress: entity.progress || 0
      } as ProjectDTO,
      relatedData: {
        phases: entity.phases?.map((phase) => ({
          id: phase.phase_id || phase.id || '',
          name: phase.phase_name || phase.name || '',
          description: phase.description || '',
          startDate: phase.start_date || phase.startDate || '',
          endDate: phase.end_date || phase.endDate || '',
          status: (phase.status as PhaseStatus) || PhaseStatus.PLANNING,
          progress: phase.progress || 0,
          type: PhaseType.STRUCTURAL,
          priority: PhasePriority.MEDIUM,
        })) || [],
        risks: entity.risks?.map((risk) => ({
          id: risk.risk_id || risk.id || '',
          title: risk.risk_title || risk.title || '',
          probability: risk.risk_probability || risk.probability || 0.5,
          impact: risk.risk_impact || risk.impact || 0.5,
          description: risk.description || '',
          category: RiskCategory.TECHNICAL,
          status: (risk.status as RiskStatus) || RiskStatus.IDENTIFIED,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })) || []
      },
      metadata: {
        lastSavedAt: entity.last_saved_at || new Date().toISOString(),
        totalSteps: entity.total_steps || 7,
        completedSteps: entity.completed_steps || 0,
        progressPercentage: entity.progress_percentage || 0
      }
    };
  }

  static toProjectWorkflowEntity(dto: ProjectWorkflowData): ProjectWorkflowEntity {
    return {
      project_id: dto.projectId,
      current_step: dto.currentStep,
      is_draft: dto.isDraft,
      is_complete: dto.isComplete,
      project_title: dto.projectData.title,
      project_description: dto.projectData.description,
      start_date: dto.projectData.startDate,
      end_date: dto.projectData.endDate,
      project_status: dto.projectData.status,
      budget: dto.projectData.budget,
      location: dto.projectData.location,
      progress: dto.projectData.progress,
      phases: dto.relatedData?.phases?.map(phase => ({
        phase_id: phase.id,
        phase_name: phase.name,
        description: phase.description,
        start_date: phase.startDate,
        end_date: phase.endDate,
        status: phase.status,
        progress: phase.progress
      })) || [],
      risks: dto.relatedData?.risks?.map(risk => ({
        risk_id: risk.id,
        risk_title: risk.title,
        probability: risk.probability,
        impact: risk.impact,
        description: risk.description
      })) || [],
      last_saved_at: dto.metadata.lastSavedAt,
      total_steps: dto.metadata.totalSteps,
      completed_steps: dto.metadata.completedSteps,
      progress_percentage: dto.metadata.progressPercentage
    };
  }

  static toPhaseWorkflowDTO(entity: PhaseWorkflowEntity): PhaseWorkflowDTO {
    return {
      id: entity.id,
      phaseId: entity.phase_id || entity.id,
      workflowType: entity.workflow_type || 'phase_execution',
      currentStep: entity.current_step || 'planning',
      status: entity.status || 'draft',
      startedAt: entity.started_at,
      completedAt: entity.completed_at,
      totalSteps: entity.total_steps || 4,
      completedSteps: entity.completed_steps || 0,
      progressPercentage: entity.progress_percentage || 0,
      phase: entity.phase ? {
        id: entity.phase.phase_id || entity.phase.id,
        name: entity.phase.phase_name || entity.phase.name,
        description: entity.phase.description,
        status: entity.phase.status,
        startDate: entity.phase.start_date,
        endDate: entity.phase.end_date,
        progress: entity.phase.progress
      } : undefined,
      steps: entity.steps?.map((step) => ({
        id: step.id,
        name: step.name,
        description: step.description,
        status: step.status,
        progress: step.progress,
        orderIndex: step.order_index || step.orderIndex,
        startDate: step.start_date,
        endDate: step.end_date
      })) || [],
      resources: {
        employees: entity.resources?.employees || [],
        contractors: entity.resources?.contractors || [],
        totalRequired: entity.resources?.total_required || 0,
        totalAssigned: entity.resources?.total_assigned || 0,
        skills: entity.resources?.skills || []
      },
      tasks: entity.tasks || [],
      createdBy: entity.created_by,
      updatedBy: entity.updated_by,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at
    } as PhaseWorkflowDTO;
  }

  static toPhaseWorkflowEntity(dto: PhaseWorkflowDTO): PhaseWorkflowEntity {
    return {
      id: dto.id,
      phase_id: dto.phaseId,
      workflow_type: dto.workflowType,
      current_step: dto.currentStep,
      status: dto.status,
      started_at: dto.startedAt,
      completed_at: dto.completedAt,
      total_steps: dto.totalSteps,
      completed_steps: dto.completedSteps,
      progress_percentage: dto.progressPercentage,
      phase: dto.phase ? {
        phase_id: dto.phase.id,
        phase_name: dto.phase.name,
        description: dto.phase.description,
        status: dto.phase.status,
        start_date: dto.phase.startDate,
        end_date: dto.phase.endDate,
        progress: dto.phase.progress
      } : undefined,
      steps: dto.steps?.map(step => ({
        id: step.id,
        name: step.name,
        description: step.description,
        status: step.status,
        progress: step.progress,
        order_index: step.orderIndex,
        start_date: step.startDate,
        end_date: step.endDate
      })) || [],
      resources: {
        employees: dto.resources.employees,
        contractors: dto.resources.contractors,
        total_required: dto.resources.totalRequired,
        total_assigned: dto.resources.totalAssigned,
        skills: dto.resources.skills
      },
      tasks: dto.tasks,
      created_by: dto.createdBy,
      updated_by: dto.updatedBy,
      created_at: dto.createdAt,
      updated_at: dto.updatedAt
    };
  }
}
