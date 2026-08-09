/**
 * useBoqDocumentList — agrège les lignes BOQ d'un contexte par `document_id`
 * pour la Vue Liste (DQE/Devis/Facture). Aucun accès direct à Supabase :
 * on réutilise le repository hexagonal.
 */
import type { BoqStatus } from '@/domain/entities/boq/BoqLine';
import type { BoqDocumentSummary, BoqLineDTO, BoqLineFilter } from '@/dtos/boq/BoqLineDTO';
import { boqRepository } from '@/infrastructure/supabase/adapters/SupabaseBoqRepository';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

const STATUS_PRIORITY: Partial<Record<BoqStatus, number>> = {
  draft: 1, submitted: 2, validated: 3, invoiced: 4, paid: 5,
};

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
    const createdAt = group.map((g) => g.createdAt ?? '').sort()[0] ?? '';
    const title = group.find((g) => g.title)?.title ?? '';
    list.push({
      documentId,
      reference: documentId.slice(0, 8).toUpperCase(),
      title,
      status,
      totalHt,
      lineCount: group.length,
      createdAt,
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
    const handler = () => qc.invalidateQueries({ queryKey: ['boq-list'] });
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
    invalidate: () => qc.invalidateQueries({ queryKey: ['boq-list'] }),
  };
}
