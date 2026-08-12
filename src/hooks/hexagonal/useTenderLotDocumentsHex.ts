/**
 * useTenderLotDocumentsHex - CRUD hooks for documents attached to tender lots.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTenderLotDocumentService,
  TenderLotDocumentRecord,
  CreateTenderLotDocumentInput,
} from '@/application/services/TenderLotDocumentService';
import { toast } from '@/hooks/use-toast';

export type { TenderLotDocumentRecord };

const key = (tenderId: string) => ['tender-lot-documents', tenderId];

export function useTenderLotDocuments(tenderId: string) {
  return useQuery({
    queryKey: key(tenderId),
    queryFn: () => getTenderLotDocumentService().listByTender(tenderId),
    enabled: !!tenderId,
  });
}

export function useCreateTenderLotDocument(tenderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTenderLotDocumentInput) =>
      getTenderLotDocumentService().create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(tenderId) });
      toast({ title: 'Document ajouté' });
    },
    onError: (e: any) =>
      toast({ title: 'Erreur', description: e?.message ?? 'Échec ajout document', variant: 'destructive' }),
  });
}

export function useUpdateTenderLotDocument(tenderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; updates: Partial<TenderLotDocumentRecord> }) =>
      getTenderLotDocumentService().update(payload.id, payload.updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(tenderId) });
      toast({ title: 'Document mis à jour' });
    },
    onError: (e: any) =>
      toast({ title: 'Erreur', description: e?.message ?? 'Échec mise à jour', variant: 'destructive' }),
  });
}

export function useDeleteTenderLotDocument(tenderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getTenderLotDocumentService().delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(tenderId) });
      toast({ title: 'Document supprimé' });
    },
    onError: (e: any) =>
      toast({ title: 'Erreur', description: e?.message ?? 'Échec suppression', variant: 'destructive' }),
  });
}

export function useUploadTenderLotFile() {
  return useMutation({
    mutationFn: (payload: { tenderId: string; file: File }) =>
      getTenderLotDocumentService().uploadFile(payload.tenderId, payload.file),
    onError: (e: any) =>
      toast({ title: 'Upload échoué', description: e?.message ?? 'Erreur upload', variant: 'destructive' }),
  });
}
