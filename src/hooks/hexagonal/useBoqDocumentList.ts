/**
 * src/hooks/hexagonal/useBoqDocumentList.ts
 * useBoqDocumentList — agrège les lignes BOQ d'un contexte par `document_id`
 * pour la Vue Liste (DQE/Devis/Facture). Aucun accès direct à Supabase :
 * on réutilise le repository hexagonal.
 */
import type { BoqDocumentSummary, BoqLineDTO, BoqLineFilter } from '@/dtos/boq/BoqLineDTO';
import { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

// ✅ IMPORT formatReference
import { formatReference } from '@/utils/entityLabels';

function aggregate(lines: BoqLineDTO[]): BoqDocumentSummary[] {
  const map = new Map<string, BoqLineDTO[]>();
  for (const l of lines) {
    const did = l.documentId ?? l.contextId; // legacy fallback
    if (!did) continue;
    const arr = map.get(did) ?? [];
    arr.push(l);
    map.set(did, arr);
  }
  const list: BoqDocumentSummary[] = [];
  for (const [documentId, group] of map) {
    const statuses = new Set(group.map((g) => g.status ?? 'draft'));
    let status: BoqDocumentSummary['status'];
    if (statuses.size === 1) status = [...statuses][0] as BoqDocumentSummary['status'];
    else status = 'mixed';
    const totalHt = group.reduce((s, l) => s + (l.totalHt ?? 0), 0);
    const totalVat = group.reduce((s, l) => s + (l.totalHt ?? 0) * (l.vatRate ?? 0), 0);
    const createdAt = group.map((g) => g.createdAt ?? '').sort()[0] ?? '';
    const updatedAt = group.map((g) => g.updatedAt ?? g.createdAt ?? '').sort().reverse()[0] ?? '';
    const title = group.find((g) => g.title)?.title ?? '';
    const readOnly = group.some((line) => {
      const metadata = line.metadata as {
        transfer?: { transferredAt?: string };
        signature?: { signedAt?: string };
      } | null;
      return Boolean(metadata?.transfer?.transferredAt || metadata?.signature?.signedAt) ||
        ['validated', 'invoiced', 'paid', 'archived'].includes(line.status ?? 'draft');
    });
    list.push({
      documentId,
      // Référence courte sans préfixe technique : le contexte d'écran ajoute DQE/DEVIS/FACTURE.
      reference: formatReference(documentId),
      title,
      status,
      totalHt,
      totalVat,
      totalTtc: totalHt + totalVat,
      lineCount: group.length,
      createdAt,
      updatedAt,
      readOnly,
    });
  }
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function useBoqDocumentList(filter: Omit<BoqLineFilter, 'documentId'>) {
  const qc = useQueryClient();
  const key = ['boq-list', filter.source, filter.contextId ?? filter.projectId ?? filter.estimateId];

  const query = useQuery({
    queryKey: key,
    queryFn: () => boqRepository.list(filter),
    enabled: Boolean(filter.contextId || filter.projectId || filter.estimateId),
  });

  useEffect(() => {
    const handler = () => {
      qc.invalidateQueries({ queryKey: ['boq-list'] });
      qc.invalidateQueries({ queryKey: ['boq'] });
    };
    window.addEventListener('boq-imported', handler);
    window.addEventListener('boq-kpi-refresh', handler);
    return () => {
      window.removeEventListener('boq-imported', handler);
      window.removeEventListener('boq-kpi-refresh', handler);
    };
  }, [qc]);

  const documents = useMemo(() => aggregate(query.data ?? []), [query.data]);

  return {
    documents,
    rawLines: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    /** Invalide la liste ET les lignes (workspace) pour un rafraîchissement complet. */
    invalidate: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['boq-list'] }),
        qc.invalidateQueries({ queryKey: ['boq'] }),
        qc.invalidateQueries({ queryKey: ['boq-documents'] }),
      ]);
      await query.refetch();
    },
  };
}