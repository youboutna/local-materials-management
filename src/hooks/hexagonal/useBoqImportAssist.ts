/**
 * useBoqImportAssist — charge les catalogues (matériaux, RH, fournisseurs,
 * organisations, projets, phases) et expose `assist()` pour confronter les
 * lignes issues du parseur aux entités du système.
 *
 * Aucune logique métier ici : tout est délégué à BoqImportAssistService.
 */
import {
  BoqImportAssistService,
  type AssistCatalogs,
  type AssistResult,
} from '@/application/services/boq/BoqImportAssistService';
import type { DocumentMeta } from '@/application/services/boq/parsers/documentMetaDetection';
import type { DocumentParties } from '@/application/services/boq/parsers/headerDetection';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

async function loadCatalogs(projectId?: string | null): Promise<AssistCatalogs> {
  const { RepositoryFactory } = await import('@/infrastructure/RepositoryFactory');
  const safe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch {
      return fallback;
    }
  };

  const [materials, employees, suppliers, organizations, projects, phases] = await Promise.all([
    safe(async () => (await RepositoryFactory.getMaterialRepository().findAll()) as unknown[], []),
    safe(async () => (await RepositoryFactory.getEmployeeRepository().findAll()) as unknown[], []),
    safe(async () => (await RepositoryFactory.getSupplierRepository().findAll()) as unknown[], []),
    safe(async () => (await RepositoryFactory.getOrganizationRepository().findAll()) as unknown[], []),
    safe(async () => (await RepositoryFactory.getProjectRepository().findAll()) as unknown[], []),
    safe(
      async () =>
        projectId
          ? ((await RepositoryFactory.getPhaseRepository().findByProjectId(projectId)) as unknown[])
          : [],
      [],
    ),
  ]);

  const rec = (v: unknown) => (v ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? null : String(v));
  const num = (v: unknown) => (typeof v === 'number' ? v : null);

  return {
    materials: materials.map((m) => {
      const r = rec(m);
      return {
        id: String(r.id ?? ''),
        name: str(r.name) ?? '',
        unit: str(r.unit),
        pricePerUnit: num(r.pricePerUnit) ?? num(r.unitPrice) ?? num(r.unit_price),
        category: str(r.category),
      };
    }),
    employees: employees.map((e) => {
      const r = rec(e);
      return {
        id: String(r.id ?? ''),
        full_name: str(r.fullName) ?? str(r.full_name) ?? '',
        position: str(r.position),
        department: str(r.department),
      };
    }),
    suppliers: suppliers.map((s) => {
      const r = rec(s);
      return { id: String(r.id ?? ''), name: str(r.name) ?? str(r.companyName) ?? '' };
    }),
    organizations: organizations.map((o) => {
      const r = rec(o);
      return { id: String(r.id ?? ''), name: str(r.name) ?? '' };
    }),
    projects: projects.map((p) => {
      const r = rec(p);
      return {
        id: String(r.id ?? ''),
        title: str(r.title),
        projectReference: str(r.projectReference) ?? str(r.project_reference),
      };
    }),
    phases: phases.map((p) => {
      const r = rec(p);
      return { id: String(r.id ?? ''), name: str(r.name), code: str(r.code) };
    }),
  };
}

export function useBoqImportAssist(projectId?: string | null) {
  const { data: catalogs, isLoading } = useQuery({
    queryKey: ['boq-import-catalogs', projectId ?? null],
    queryFn: () => loadCatalogs(projectId),
    staleTime: 5 * 60 * 1000,
  });

  const assist = useCallback(
    (
      lines: BoqLineDTO[],
      context: { documentMeta?: DocumentMeta | null; parties?: DocumentParties | null } = {},
    ): AssistResult =>
      BoqImportAssistService.assist(lines, catalogs ?? {}, { ...context, projectId }),
    [catalogs, projectId],
  );

  return { assist, catalogs, isCatalogsLoading: isLoading };
}
