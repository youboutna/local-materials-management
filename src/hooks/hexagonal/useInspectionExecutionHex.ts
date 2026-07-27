import { InspectionService } from '@/application/services/InspectionService';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface InspectionExecutionData {
  id: string;
  status: string;
  progressAtInspection?: number;
  comments?: string;
  documents?: any[];
  completedAt?: string;
}

interface InspectionExecutionParams {
  inspectionId: string;
  status: string;
  progress?: number;
  comments?: string;
}

export function useInspectionExecutionHex() {
  const queryClient = useQueryClient();
  const inspectionService = new InspectionService(RepositoryFactory.getInspectionRepository());

  const uploadDocumentsMutation = useMutation({
    mutationFn: async ({ inspectionId, documents }: { inspectionId: string; documents: File[] }) => {
      // Placeholder for document upload
      return { inspectionId, count: documents.length };
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Documents téléchargés avec succès' });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de télécharger les documents', variant: 'destructive' });
    }
  });

  const updateInspectionMutation = useMutation({
    mutationFn: async ({ inspectionId, status, progress, comments }: InspectionExecutionParams) => {
      const result = await inspectionService.updateInspection(inspectionId, {
        status,
        progressAtInspection: progress,
        comments,
      } as any);
      return result;
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Inspection mise à jour avec succès' });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour l\'inspection', variant: 'destructive' });
    }
  });

  const completeInspectionMutation = useMutation({
    mutationFn: async ({ inspectionId, progress, comments }: { inspectionId: string; progress: number; comments?: string }) => {
      const result = await inspectionService.updateInspection(inspectionId, {
        status: 'completed',
        progressAtInspection: progress,
        comments,
      } as any);
      return result;
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Inspection complétée avec succès' });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de compléter l\'inspection', variant: 'destructive' });
    }
  });

  const cancelInspectionMutation = useMutation({
    mutationFn: async ({ inspectionId, reason }: { inspectionId: string; reason?: string }) => {
      const result = await inspectionService.updateInspection(inspectionId, {
        status: 'cancelled',
        comments: reason,
      } as any);
      return result;
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Inspection annulée avec succès' });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible d\'annuler l\'inspection', variant: 'destructive' });
    }
  });

  return {
    uploadDocuments: uploadDocumentsMutation.mutate,
    updateInspection: updateInspectionMutation.mutate,
    completeInspection: completeInspectionMutation.mutate,
    cancelInspection: cancelInspectionMutation.mutate,
    isUploading: uploadDocumentsMutation.isPending,
    isUpdating: updateInspectionMutation.isPending,
    isCompleting: completeInspectionMutation.isPending,
    isCancelling: cancelInspectionMutation.isPending,
  };
}
