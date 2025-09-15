// React hook for workflow steps management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkflowStepService } from '@/services/workflowStepService';
import { WorkflowStepDTO, StepDocumentDTO, DocumentUploadDTO } from '@/types/workflow-dto';
import { useToast } from '@/hooks/use-toast';

export const useWorkflowSteps = (tenderId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for workflow steps
  const {
    data: steps,
    isLoading: stepsLoading,
    error: stepsError
  } = useQuery({
    queryKey: ['workflow-steps', tenderId],
    queryFn: () => WorkflowStepService.getTenderWorkflowSteps(tenderId),
    enabled: !!tenderId
  });

  // Query for step documents
  const useStepDocuments = (stepId: string) => {
    return useQuery({
      queryKey: ['step-documents', stepId],
      queryFn: () => WorkflowStepService.getStepDocuments(stepId),
      enabled: !!stepId
    });
  };

  // Query for tender progress
  const {
    data: progress,
    isLoading: progressLoading
  } = useQuery({
    queryKey: ['workflow-progress', tenderId],
    queryFn: () => WorkflowStepService.getTenderProgress(tenderId),
    enabled: !!tenderId
  });

  // Mutation for uploading documents
  const uploadDocumentMutation = useMutation({
    mutationFn: (data: { uploadData: DocumentUploadDTO; projectId?: string }) =>
      WorkflowStepService.uploadStepDocument(data.uploadData, data.projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-steps', tenderId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-progress', tenderId] });
      toast({
        title: 'Document téléchargé',
        description: 'Le document a été téléchargé avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du téléchargement du document.',
        variant: 'destructive',
      });
    }
  });

  // Mutation for updating step status
  const updateStatusMutation = useMutation({
    mutationFn: ({ stepId, status }: { stepId: string; status: string }) =>
      WorkflowStepService.updateStepStatus(stepId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-steps', tenderId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-progress', tenderId] });
      toast({
        title: 'Statut mis à jour',
        description: 'Le statut de l\'étape a été mis à jour avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour du statut.',
        variant: 'destructive',
      });
    }
  });

  return {
    // Data
    steps: steps || [],
    progress,
    
    // Loading states
    stepsLoading,
    progressLoading,
    uploading: uploadDocumentMutation.isPending,
    
    // Errors
    stepsError,
    
    // Actions
    uploadDocument: uploadDocumentMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    useStepDocuments,
  };
};