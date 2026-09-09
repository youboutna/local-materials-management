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
import { getEmployeeService } from '@/application/services/EmployeeService';

export type DocumentPartyKind = 'organization' | 'supplier' | 'employee';

export interface DocumentPartySuggestion {
  id: string;
  name: string;
  kind: DocumentPartyKind;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
}

const asRecord = (v: unknown): Record<string, unknown> => (v ?? {}) as Record<string, unknown>;
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

export function useDocumentPartySuggestions() {
  const query = useQuery<DocumentPartySuggestion[]>({
    queryKey: ['document-party-suggestions'],
    queryFn: async () => {
      const [orgs, suppliers, employees] = await Promise.all([
        getOrganizationService().list().catch(() => []),
        getSupplierService().getAllSuppliers().catch(() => []),
        getEmployeeService().getAllEmployees().catch(() => []),
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
          taxId: o.nif ?? undefined,
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
          taxId: str(r.nif),
        };
      }).filter((s) => !!s.name);

      const employeeItems: DocumentPartySuggestion[] = (employees ?? [])
        .filter((e) => e && e.isActive !== false)
        .map((e) => ({
          id: `emp:${e.id}`,
          name: e.fullName ?? `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim(),
          kind: 'employee' as const,
          phone: e.phone ?? undefined,
          email: e.email ?? undefined,
          taxId: e.nif ?? undefined,
        }))
        .filter((e) => !!e.name);

      const seen = new Set<string>();
      return [...orgItems, ...supplierItems, ...employeeItems].filter((p) => {
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
