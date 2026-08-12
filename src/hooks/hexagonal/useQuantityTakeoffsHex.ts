/**
 * Hexagonal hook for btp.quantity_takeoffs CRUD (UI -> Service -> Repository -> DB)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getQuantityTakeoffService,
  type QuantityTakeoffInput,
} from '@/application/services/QuantityTakeoffService';
import type { QuantityTakeoffWithDetails } from '@/dtos/types/quantityTakeoff';

export function useQuantityTakeoffsHex(projectId?: string) {
  const service = getQuantityTakeoffService();
  const queryClient = useQueryClient();
  const queryKey = ['quantity-takeoffs', projectId];

  const query = useQuery<QuantityTakeoffWithDetails[]>({
    queryKey,
    queryFn: () => service.getByProject(projectId as string),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['quantity-takeoffs'] });

  const createMutation = useMutation({
    mutationFn: (input: QuantityTakeoffInput) => service.create(input),
    onSuccess: invalidate,
  });

  const createManyMutation = useMutation({
    mutationFn: (inputs: QuantityTakeoffInput[]) => service.createMany(inputs),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<QuantityTakeoffInput> }) =>
      service.update(id, updates),
    onSuccess: invalidate,
  });

  const updateRawMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) =>
      service.updateRaw(id, updates),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => service.remove(id),
    onSuccess: invalidate,
  });

  const replaceMutation = useMutation({
    mutationFn: (inputs: QuantityTakeoffInput[]) =>
      service.replaceForProject(projectId as string, inputs),
    onSuccess: invalidate,
  });

  const rows = (query.data ?? []) as (QuantityTakeoffWithDetails & {
    unit?: string;
    quantity?: number;
    unit_price?: number;
  })[];

  const getTotalQuantityByUnit = (unit: string) =>
    rows
      .filter((r) => r.unit === unit)
      .reduce((sum, r) => sum + Number(r.quantity ?? 0), 0);

  const getTotalValue = () =>
    rows.reduce(
      (sum, r) =>
        sum +
        Number(r.quantity ?? 0) *
          Number(r.unit_price ?? (r as { material?: { price_per_unit?: number } }).material?.price_per_unit ?? 0),
      0,
    );

  return {
    takeoffs: query.data ?? [],
    // Back-compat surface used by QuantityTakeoffsList
    quantityTakeoffs: rows,
    deleteMutation,
    updateMutation: {
      ...updateMutation,
      mutate: (
        payload: { id: string } & Record<string, unknown>,
        options?: { onSuccess?: () => void; onError?: (e: unknown) => void },
      ) => {
        const { id, ...rest } = payload;
        updateRawMutation.mutate({ id, updates: rest }, options as never);
      },
      mutateAsync: (payload: { id: string } & Record<string, unknown>) => {
        const { id, ...rest } = payload;
        return updateRawMutation.mutateAsync({ id, updates: rest });
      },
    },
    getTotalQuantityByUnit,
    getTotalValue,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
    createTakeoff: createMutation.mutateAsync,
    createTakeoffs: createManyMutation.mutateAsync,
    updateTakeoff: updateMutation.mutateAsync,
    deleteTakeoff: deleteMutation.mutateAsync,
    replaceTakeoffs: replaceMutation.mutateAsync,
    isSaving:
      createMutation.isPending ||
      createManyMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      replaceMutation.isPending,
  };
}
