import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { 
  UploadDocumentsUseCase,
  UpdateInspectionUseCase,
  GetInspectionUseCase
} from '@/application/use-cases/inspection/InspectionExecutionUseCases';
import { InspectionDocument } from '@/domain/repositories/IInspectionExecutionRepository';

interface InspectionExecutionData {
  inspectionId: string;
  status: string;
  progress?: number;
  documents?: File[];
  syncResult?: any;
}

export function useInspectionExecutionHex() {
  const queryClient = useQueryClient();

  // Singleton instances des use cases
  const uploadDocumentsUseCase = new UploadDocumentsUseCase();
  const updateInspectionUseCase = new UpdateInspectionUseCase();
  const getInspectionUseCase = new GetInspectionUseCase();

  const uploadDocumentsMutation = useMutation({
    mutationFn: async ({ inspectionId, documents }: { inspectionId: string; documents: File[] }) => {
      const result = await uploadDocumentsUseCase.execute(inspectionId, documents);
      if (!result.success) {
        throw new Error(result.error || 'Failed to upload documents');
      }
      return result.documents;
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
    mutationFn: async ({ inspectionId, status, progress, comments }: { 
      inspectionId: string; 
      status: string; 
      progress?: number; 
      comments?: string 
    }) => {
      const result = await updateInspectionUseCase.execute(inspectionId, status, progress, comments);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update inspection');
      }
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

  const getInspectionById = async (inspectionId: string) => {
    const result = await getInspectionUseCase.execute(inspectionId);
    return result.success ? result.inspection : null;
  };

  return {
    uploadDocumentsMutation,
    updateInspectionMutation,
    getInspectionById
  };
}
