/**
 * useTenderLotsHex - CRUD hooks for persisted tender lots.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTenderLotService, TenderLotRecord } from '@/application/services/TenderLotService';
import { toast } from '@/hooks/use-toast';

export type { TenderLotRecord };

const key = (tenderId: string) => ['tender-lots', tenderId];

export function useTenderLots(tenderId: string) {
  return useQuery({
    queryKey: key(tenderId),
    queryFn: () => getTenderLotService().listByTender(tenderId),
    enabled: !!tenderId,
  });
}

export function useCreateTenderLot(tenderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lot: Omit<TenderLotRecord, 'id'>) => getTenderLotService().create(lot),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(tenderId) });
      toast({ title: 'Lot ajouté', description: 'Le lot a été enregistré.' });
    },
    onError: (e: any) =>
      toast({ title: 'Erreur', description: e?.message ?? 'Échec de la création', variant: 'destructive' }),
  });
}

export function useUpdateTenderLot(tenderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; lot: Partial<TenderLotRecord> & { tenderId: string } }) =>
      getTenderLotService().update(payload.id, payload.lot),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(tenderId) }),
    onError: (e: any) =>
      toast({ title: 'Erreur', description: e?.message ?? 'Échec de la mise à jour', variant: 'destructive' }),
  });
}

export function useDeleteTenderLot(tenderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getTenderLotService().delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(tenderId) });
      toast({ title: 'Lot supprimé' });
    },
    onError: (e: any) =>
      toast({ title: 'Erreur', description: e?.message ?? 'Échec de la suppression', variant: 'destructive' }),
  });
}

/** Transition de statut d'un lot (brouillon → publié → en évaluation → attribué / annulé). */
export function useSetTenderLotStatus(tenderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; status: TenderLotRecord['status'] }) =>
      getTenderLotService().setStatus(payload.id, payload.status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(tenderId) });
      toast({ title: 'Statut du lot mis à jour' });
    },
    onError: (e: any) =>
      toast({ title: 'Erreur', description: e?.message ?? 'Échec de la transition', variant: 'destructive' }),
  });
}

/** Attribution d'un lot à un prestataire. */
export function useAwardTenderLot(tenderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      id: string;
      awardedTo: string;
      awardedSubmissionId?: string | null;
      awardedAmount?: number | null;
    }) => getTenderLotService().award(payload.id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(tenderId) });
      toast({ title: 'Lot attribué' });
    },
    onError: (e: any) =>
      toast({ title: 'Erreur', description: e?.message ?? "Échec de l'attribution", variant: 'destructive' }),
  });
}

/** Soumissions rattachées à un lot. */
export function useLotSubmissions(lotId?: string) {
  return useQuery({
    queryKey: ['tender-lot-submissions', lotId],
    queryFn: () => getTenderLotService().listSubmissionsByLot(lotId!),
    enabled: !!lotId,
  });
}

