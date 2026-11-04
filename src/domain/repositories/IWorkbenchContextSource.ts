/**
 * Sources de contexte de l'espace projet (calendrier, consommations, dépenses, recettes).
 * Par défaut, ProjectWorkbenchService compose les services canoniques (projet, DQE,
 * décomptes, référentiels). Un fournisseur de données autonome (ex. mode local) peut
 * fournir ces mêmes données via ce port, choisi par RepositoryFactory.
 */
import type { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { BoqSource } from '@/domain/entities/boq/BoqLine';
import type { DecomptePaymentDTO, DecompteRecordDTO } from '@/dtos/entities/DecompteRecordDTO';
import type { ReferentialItemDTO } from '@/dtos/entities/ReferentialItemDTO';

export interface IWorkbenchContextSource {
  projectDetail(projectId: string): Promise<ProjectDetailDTO | null>;
  boqLines(projectId: string, source: BoqSource): Promise<BoqLineDTO[]>;
  decomptes(projectId: string): Promise<{ decomptes: DecompteRecordDTO[]; payments: DecomptePaymentDTO[] }>;
  operationContexts(projectId: string): Promise<ReferentialItemDTO[]>;
}
