import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

/**
 * PublicTenderService
 * Accès aux appels d'offres publics (portail fournisseur, consultation anonyme).
 * Encapsule les requêtes btpClient pour les pages/composants publics.
 */

export interface PublicTenderSummaryDTO {
  id: string;
  title: string;
  description?: string;
  status: string;
  deadlineDate?: string;
  publicationDate?: string;
  marketType?: string;
  budgetMax?: number;
  projectReference?: string;
}

export interface PublicTenderDetailDTO {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadlineDate: string | null;
  marketType: string | null;
  budgetMax: number | null;
  projectReference: string | null;
}

export class PublicTenderService {
  /**
   * Liste des appels d'offres ouverts (published/open), accès anonyme via policy RLS.
   */
  static async getOpenTenders(): Promise<PublicTenderSummaryDTO[]> {
    const data = await RepositoryFactory.getTenderCatalogRepository().findOpenTenders(['published', 'open']);
    return data.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? undefined,
      status: t.status,
      deadlineDate: t.deadline_date ?? undefined,
      publicationDate: t.publication_date ?? undefined,
      marketType: t.market_type ?? undefined,
      budgetMax: t.budget_max ?? undefined,
      projectReference: t.project_reference ?? undefined,
    }));
  }

  /**
   * Détail d'un appel d'offres public par id.
   */
  static async getTenderById(id: string): Promise<PublicTenderDetailDTO | null> {
    const data: any = await RepositoryFactory.getTenderCatalogRepository().findPublicTenderById(id);
    if (!data) return null;
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      deadlineDate: data.deadline_date,
      marketType: data.market_type,
      budgetMax: data.budget_max,
      projectReference: data.project_reference,
    };
  }
}
