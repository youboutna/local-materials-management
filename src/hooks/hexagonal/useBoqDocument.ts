/**
 * useBoqDocument — TanStack v5 hook. Reads BOQ lines by source+context and
 * exposes create/bulkCreate/update/delete mutations.
 */
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boqRepository } from '@/infrastructure/supabase/adapters/SupabaseBoqRepository';
import type { BoqLineDTO, BoqLineFilter } from '@/dtos/boq/BoqLineDTO';

export function useBoqDocument(filter: BoqLineFilter) {
  const qc = useQueryClient();
  const key = ['boq', filter.source, filter.contextId ?? filter.projectId ?? filter.estimateId, filter.phaseId ?? '', filter.resourceType ?? ''];

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


  const invalidate = () => qc.invalidateQueries({ queryKey: ['boq'] });

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

  return {
    lines: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createLine: async (dto: BoqLineDTO) => { const r = await createMut.mutateAsync(dto); invalidate(); return r; },
    bulkCreate: async (dtos: BoqLineDTO[]) => { const r = await bulkCreateMut.mutateAsync(dtos); invalidate(); return r; },
    updateLine: async (id: string, dto: Partial<BoqLineDTO>) => { const r = await updateMut.mutateAsync({ id, dto }); invalidate(); return r; },
    updateStatus: async (ids: string[], status: NonNullable<BoqLineDTO['status']>, source: BoqLineDTO['source']) => { await updateStatusMut.mutateAsync({ ids, status, source }); invalidate(); },
    deleteLine: async (id: string, source: BoqLineDTO['source']) => { await deleteMut.mutateAsync({ id, source }); invalidate(); },
    isPending: createMut.isPending || bulkCreateMut.isPending || updateMut.isPending || deleteMut.isPending || updateStatusMut.isPending,
  };
}
