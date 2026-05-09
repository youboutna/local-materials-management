import type {
  ProjectBudgetLinkDTO,
  CreateProjectBudgetLinkDTO,
  UpdateProjectBudgetLinkDTO,
} from '@/dtos/entities/ProjectBudgetLinkDTO';

export interface IProjectBudgetLinkRepository {
  findByProjectId(projectId: string): Promise<ProjectBudgetLinkDTO[]>;
  create(dto: CreateProjectBudgetLinkDTO): Promise<ProjectBudgetLinkDTO>;
  update(id: string, dto: UpdateProjectBudgetLinkDTO): Promise<ProjectBudgetLinkDTO>;
  delete(id: string): Promise<void>;
}
