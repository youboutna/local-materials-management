import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { InspectionService, InspectionDocument, InspectionExecutionData } from '@/application/services/InspectionService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

interface InspectionExecutionParams {
  inspectionId: string;
  status: string;
  progress?: number;
  comments?: string;
}

export function useInspectionExecutionHex() {
  const queryClient = useQueryClient();

  // Inspection service instance
  const inspectionService = new InspectionService(RepositoryFactory.getInspectionRepository());

  const uploadDocumentsMutation = useMutation({
    mutationFn: async ({ inspectionId, documents }: { inspectionId: string; documents: File[] }) => {
      const result = await inspectionService.uploadDocuments(inspectionId, documents);
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Succès',
        description: 'Documents téléchargés avec succès'
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger les documents',
        variant: 'destructive'
      });
    }
  });

  const updateInspectionMutation = useMutation({
    mutationFn: async ({ inspectionId, status, progress, comments }: InspectionExecutionParams) => {
      const executionData: InspectionExecutionData = {
        id: inspectionId,
        status,
        progressAtInspection: progress,
        comments,
        documents: [],
        completedAt: status === 'completed' ? new Date().toISOString() : undefined
      };
      
      const result = await inspectionService.updateInspectionExecution(executionData);
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Succès',
        description: 'Inspection mise à jour avec succès'
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'inspection',
        variant: 'destructive'
      });
    }
  });

  const completeInspectionMutation = useMutation({
    mutationFn: async ({ inspectionId, progress, comments }: { inspectionId: string; progress: number; comments?: string }) => {
      const result = await inspectionService.completeInspection(inspectionId, progress, comments);
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Succès',
        description: 'Inspection complétée avec succès'
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de compléter l\'inspection',
        variant: 'destructive'
      });
    }
  });

  const cancelInspectionMutation = useMutation({
    mutationFn: async ({ inspectionId, reason }: { inspectionId: string; reason?: string }) => {
      const result = await inspectionService.cancelInspection(inspectionId, reason);
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Succès',
        description: 'Inspection annulée avec succès'
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'annuler l\'inspection',
        variant: 'destructive'
      });
    }
  });

  const getInspectionById = async (inspectionId: string): Promise<InspectionExecutionData | null> => {
    const result = await inspectionService.getInspectionExecutionData(inspectionId);
    return result;
  };

  return {
    uploadDocumentsMutation,
    updateInspectionMutation,
    completeInspectionMutation,
    cancelInspectionMutation,
    getInspectionById
  };
}
