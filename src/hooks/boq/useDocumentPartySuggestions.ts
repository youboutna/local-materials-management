/**
 * useDocumentPartySuggestions — source d'autocomplétion des parties
 * (émetteur / destinataire) des en-têtes documentaires DQE.
 *
 * Données issues des services applicatifs (hexagonal) : organisations
 * (maîtres d'ouvrage / entités internes) et fournisseurs. Aucun appel
 * Supabase direct, aucun libellé codé en dur.
 */
import { useQuery } from '@tanstack/react-query';
import { getOrganizationService } from '@/application/services/OrganizationService';
import { getSupplierService } from '@/application/services/SupplierService';

export type DocumentPartyKind = 'organization' | 'supplier';

export interface DocumentPartySuggestion {
  id: string;
  name: string;
  kind: DocumentPartyKind;
  address?: string;
  phone?: string;
  email?: string;
}

const asRecord = (v: unknown): Record<string, unknown> => (v ?? {}) as Record<string, unknown>;
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

export function useDocumentPartySuggestions() {
  const query = useQuery<DocumentPartySuggestion[]>({
    queryKey: ['document-party-suggestions'],
    queryFn: async () => {
      const [orgs, suppliers] = await Promise.all([
        getOrganizationService().list().catch(() => []),
        getSupplierService().getAllSuppliers().catch(() => []),
      ]);

      const orgItems: DocumentPartySuggestion[] = (orgs ?? [])
        .filter((o) => o && o.isActive !== false)
        .map((o) => ({
          id: `org:${o.id}`,
          name: o.name,
          kind: 'organization' as const,
          address: o.address ?? undefined,
          phone: o.phone ?? undefined,
          email: o.email ?? undefined,
        }))
        .filter((o) => !!o.name);

      const supplierItems: DocumentPartySuggestion[] = (suppliers ?? []).map((s) => {
        const r = asRecord(s);
        return {
          id: `sup:${str(r.id) ?? str(r.supplierId) ?? Math.random().toString(36).slice(2)}`,
          name: str(r.name) ?? str(r.companyName) ?? '',
          kind: 'supplier' as const,
          address: str(r.address),
          phone: str(r.phone) ?? str(r.contactPhone),
          email: str(r.email) ?? str(r.contactEmail),
        };
      }).filter((s) => !!s.name);

      const seen = new Set<string>();
      return [...orgItems, ...supplierItems].filter((p) => {
        const key = `${p.kind}|${p.name.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    suggestions: query.data ?? [],
    isLoading: query.isLoading,
  };
}
