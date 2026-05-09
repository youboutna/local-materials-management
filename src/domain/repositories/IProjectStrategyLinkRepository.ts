import type {
  ProjectStrategyLinkDTO,
  CreateProjectStrategyLinkDTO,
  UpdateProjectStrategyLinkDTO,
} from '@/dtos/entities/ProjectStrategyLinkDTO';

export interface IProjectStrategyLinkRepository {
  findByProjectId(projectId: string): Promise<ProjectStrategyLinkDTO[]>;
  create(dto: CreateProjectStrategyLinkDTO): Promise<ProjectStrategyLinkDTO>;
  update(id: string, dto: UpdateProjectStrategyLinkDTO): Promise<ProjectStrategyLinkDTO>;
  delete(id: string): Promise<void>;
}
