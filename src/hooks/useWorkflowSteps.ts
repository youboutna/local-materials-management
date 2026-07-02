// React hook for workflow steps management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkflowStepService } from '@/application/services/WorkflowStepService';
import { WorkflowStepDTO, StepDocumentDTO, DocumentUploadDTO } from '@/dtos/types/workflow-dto';
import { useToast } from '@/hooks/use-toast';

interface WorkflowError {
  message: string;
  code?: string;
}

const workflowStepService = new WorkflowStepService();

export const useWorkflowSteps = (tenderId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: steps,
    isLoading: stepsLoading,
    error: stepsError
  } = useQuery({
    queryKey: ['workflow-steps', tenderId],
    queryFn: () => workflowStepService.getTenderWorkflowSteps(tenderId),
    enabled: !!tenderId
  });

  const useStepDocuments = (stepId: string) => {
    return useQuery<StepDocumentDTO[]>({
      queryKey: ['step-documents', stepId],
      queryFn: async () => {
        // Documents are not yet available via service, return empty
        console.warn('WorkflowStepService: getStepDocuments not yet implemented');
        return [];
      },
      enabled: !!stepId
    });
  };

  const {
    data: progress,
    isLoading: progressLoading
  } = useQuery({
    queryKey: ['workflow-progress', tenderId],
    queryFn: () => workflowStepService.getWorkflowProgress(tenderId),
    enabled: !!tenderId
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: { uploadData: DocumentUploadDTO; projectId?: string }) => {
      return workflowStepService.uploadStepDocument(data.uploadData.category, data.uploadData);
    },
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

  const updateStatusMutation = useMutation({
    mutationFn: ({ stepId, status, dates }: { 
      stepId: string; 
      status: string; 
      dates?: {
        submission_date?: string;
        review_deadline?: string;
        approval_deadline?: string;
        due_date?: string;
      }
    }) =>
      workflowStepService.updateStepStatus(stepId, status, dates),
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
        description: error.message || 'Erreur lors de la mise à jour du statut.',
        variant: 'destructive',
      });
    }
  });

  const updateDatesMutation = useMutation({
    mutationFn: ({ stepId, dates }: { 
      stepId: string; 
      dates: {
        submission_date?: string;
        review_deadline?: string;
        approval_deadline?: string;
        due_date?: string;
      }
    }) =>
      workflowStepService.updateStepStatus(stepId, 'pending', dates),
    onMutate: async ({ stepId, dates }) => {
      await queryClient.cancelQueries({ queryKey: ['workflow-steps', tenderId] });
      const previous = queryClient.getQueryData<WorkflowStepDTO[]>(['workflow-steps', tenderId]);
      if (previous) {
        const patched = previous.map(s => s.id === stepId ? {
          ...s,
          submission_date: dates.submission_date ?? s.submission_date,
          review_deadline: dates.review_deadline ?? s.review_deadline,
          approval_deadline: dates.approval_deadline ?? s.approval_deadline,
          due_date: dates.due_date ?? s.due_date,
        } : s);
        queryClient.setQueryData(['workflow-steps', tenderId], patched);
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['workflow-steps', tenderId], ctx.previous);
      }
      toast({
        title: 'Erreur',
        description: (err as Error).message || 'Erreur lors de la mise à jour des dates.',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Dates mises à jour',
        description: 'Les dates ont été mises à jour avec succès.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-steps', tenderId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-progress', tenderId] });
    }
  });

  return {
    steps: steps || [],
    progress,
    stepsLoading,
    progressLoading,
    uploading: uploadDocumentMutation.isPending,
    stepsError,
    uploadDocument: uploadDocumentMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    updateDates: updateDatesMutation.mutate,
    useStepDocuments,
  };
};
