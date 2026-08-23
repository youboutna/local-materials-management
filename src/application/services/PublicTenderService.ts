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
    const { btpClient } = await import('@/integrations/supabase/schema-clients');
    const { data, error } = await btpClient.from('tenders')
      .select('id, title, description, status, deadline_date, publication_date, market_type, budget_max, project_reference')
      .in('status', ['published', 'open'])
      .order('deadline_date', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return (data ?? []).map((t) => ({
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
    const { btpClient } = await import('@/integrations/supabase/schema-clients');
    const { data, error } = await btpClient.from('tenders')
      .select('id, title, description, status, deadline_date, market_type, budget_max, project_reference')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
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
