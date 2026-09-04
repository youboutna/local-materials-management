/**
 * src/hooks/hexagonal/useBoqDocumentHeaderHex.ts
 * Hook hexagonal pour la gestion des en-têtes documentaires BOQ
 *
 * ✅ Utilise createDocumentHeaderService() avec repository
 * ✅ Le hook ne connaît PAS Supabase
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createDocumentHeaderService } from '@/application/services/boq/DocumentHeaderService';
import { DocumentPartiesValue } from '@/components/boq/DocumentPartiesDialog';
import { DocumentHeaderTransformer } from '@/dtos/transforms/DocumentHeaderTransformer';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

function routeContextToBoqSource(routeContext: string): string {
  const mapping: Record<string, string> = {
    'project-dqe': 'dqe',
    'tender-estimate': 'tender_estimate',
    'supplier-bid': 'supplier_bid',
    'supplier-invoice': 'invoice',
    'quantity-takeoff': 'quantity_takeoff',
    'dqe': 'dqe',
    'tender_estimate': 'tender_estimate',
    'supplier_bid': 'supplier_bid',
    'invoice': 'invoice',
    'quantity_takeoff': 'quantity_takeoff',
  };
  return mapping[routeContext] ?? 'dqe';
}

export function useBoqDocumentHeaderHex(
  documentId: string,
  routeContextOrSource: string
) {
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUserRoles();
  const source = routeContextToBoqSource(routeContextOrSource);

  // ✅ Service instancié avec repository injecté via RepositoryFactory
  const service = createDocumentHeaderService(
    RepositoryFactory.getBoqDocumentHeaderRepository()
  );

  // ✅ Query — Lecture
  const { data: header, isLoading, error, refetch } = useQuery({
    queryKey: ['boqDocumentHeader', documentId],
    queryFn: async () => {
      if (!documentId) return null;
      const result = await service.findByDocumentId(documentId);
      return result ? DocumentHeaderTransformer.toUIValue(result) : null;
    },
    enabled: !!documentId,
    staleTime: 60 * 1000,
  });

  // ✅ Mutation — Sauvegarde
  const saveMutation = useMutation({
    mutationFn: async (value: DocumentPartiesValue) => {
      if (!documentId) throw new Error('Document ID required');
      const headerDTO = DocumentHeaderTransformer.fromUIValue(value);
      const userId = (currentUser as { userId?: string; id?: string } | null)?.userId
        ?? (currentUser as { id?: string } | null)?.id;
      await service.save(documentId, headerDTO, source as any, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boqDocumentHeader', documentId] });
    },
  });

  // ✅ Mutation — Workflow
  const workflowMutation = useMutation({
    mutationFn: async (stage: string) => {
      await service.updateWorkflowStage(documentId, stage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boqDocumentHeader', documentId] });
    },
  });

  // ✅ Mutation — Signature
  const signatureMutation = useMutation({
    mutationFn: async ({ signedBy, role }: { signedBy: string; role: string }) => {
      await service.updateSignature(documentId, signedBy, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boqDocumentHeader', documentId] });
    },
  });

  return {
    header,
    isLoading,
    error: error instanceof Error ? error.message : null,
    saveHeader: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    updateWorkflowStage: workflowMutation.mutateAsync,
    updateSignature: signatureMutation.mutateAsync,
    reload: refetch,
  };
}