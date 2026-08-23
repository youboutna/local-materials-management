/**
 * useBoqDocument — TanStack v5 hook. Reads BOQ lines by source+context and
 * exposes create/bulkCreate/update/delete mutations.
 */
import type { BoqLineDTO, BoqLineFilter } from '@/dtos/boq/BoqLineDTO';
import { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useBoqDocument(filter: BoqLineFilter) {
  const qc = useQueryClient();
  const key = ['boq', filter.source, filter.contextId ?? filter.projectId ?? filter.estimateId, filter.phaseId ?? '', filter.resourceType ?? '', filter.documentId ?? ''];

  const query = useQuery({
    queryKey: key,
    queryFn: () => boqRepository.list(filter),
    enabled: Boolean(filter.contextId || filter.projectId || filter.estimateId),
  });

  // Global refresh on import / KPI events (fired by BoqImportDialog / AdvancedQuantityCalculator).
  useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey: ['boq'] });
    window.addEventListener('boq-imported', handler);
    window.addEventListener('boq-kpi-refresh', handler);
    return () => {
      window.removeEventListener('boq-imported', handler);
      window.removeEventListener('boq-kpi-refresh', handler);
    };
  }, [qc]);


  /** Invalide les lignes + la vue liste, puis force un refetch immédiat de la table courante. */
  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['boq'] }),
      qc.invalidateQueries({ queryKey: ['boq-list'] }),
      qc.invalidateQueries({ queryKey: ['boq-documents'] }),
    ]);
    await query.refetch();
  };

  const createMut = useMutation({
    mutationFn: (dto: BoqLineDTO) => boqRepository.create(dto),
  });
  const bulkCreateMut = useMutation({
    mutationFn: (dtos: BoqLineDTO[]) => boqRepository.bulkCreate(dtos),
  });
  const updateMut = useMutation({
    mutationFn: (p: { id: string; dto: Partial<BoqLineDTO> }) => boqRepository.update(p.id, p.dto),
  });
  const deleteMut = useMutation({
    mutationFn: (p: { id: string; source: BoqLineDTO['source'] }) => boqRepository.delete(p.id, p.source),
  });
  const updateStatusMut = useMutation({
    mutationFn: (p: { ids: string[]; status: NonNullable<BoqLineDTO['status']>; source: BoqLineDTO['source'] }) => boqRepository.updateStatus(p.ids, p.status, p.source),
  });

  const commitChanges = async (changes: {
    create: BoqLineDTO[];
    update: Array<{ id: string; dto: Partial<BoqLineDTO> }>;
    remove: Array<{ id: string; source: BoqLineDTO['source'] }>;
  }) => {
    await Promise.all([
      changes.create.length ? boqRepository.bulkCreate(changes.create) : Promise.resolve([]),
      ...changes.update.map(({ id, dto }) => boqRepository.update(id, dto)),
      ...changes.remove.map(({ id, source }) => boqRepository.delete(id, source)),
    ]);
    await invalidate();
    window.dispatchEvent(new Event('boq-kpi-refresh'));
  };

  return {
    lines: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
    createLine: async (dto: BoqLineDTO) => { const r = await createMut.mutateAsync(dto); await invalidate(); return r; },
    bulkCreate: async (dtos: BoqLineDTO[]) => { const r = await bulkCreateMut.mutateAsync(dtos); await invalidate(); return r; },
    updateLine: async (id: string, dto: Partial<BoqLineDTO>) => { const r = await updateMut.mutateAsync({ id, dto }); await invalidate(); return r; },
    updateStatus: async (ids: string[], status: NonNullable<BoqLineDTO['status']>, source: BoqLineDTO['source']) => { await updateStatusMut.mutateAsync({ ids, status, source }); await invalidate(); },
    deleteLine: async (id: string, source: BoqLineDTO['source']) => { await deleteMut.mutateAsync({ id, source }); await invalidate(); window.dispatchEvent(new Event('boq-kpi-refresh')); },
    commitChanges,
    isPending: createMut.isPending || bulkCreateMut.isPending || updateMut.isPending || deleteMut.isPending || updateStatusMut.isPending,
  };
}
