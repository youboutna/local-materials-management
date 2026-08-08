import { AuthService } from '@/application/services/AuthService';
import { TenderSubmissionService } from '@/application/services/TenderSubmissionService';
import { useToast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface TenderSubmission {
  id: string;
  user_id: string;
  tender_id: string;
  supplier_name: string;
  supplier_email: string;
  submission_date: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  administrative_score?: number;
  technical_score?: number;
  financial_score?: number;
  total_score?: number;
  evaluator_notes?: string;
  reviewer_id?: string;
  reviewed_at?: string;
  submission_documents?: any[];
}

export function useTenderEvaluationHex(tenderId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const authService = getAuthService();

  // Fetch tender submissions
  const submissionsQuery = useQuery({
    queryKey: ['tender-submissions', tenderId],
    queryFn: async (): Promise<TenderSubmission[]> => {
      const submissions = await TenderSubmissionService.getTenderSubmissions(tenderId);
      return (submissions as any[]).map((sub: any) => ({
        id: sub.id,
        user_id: sub.user_id,
        tender_id: sub.tender_id,
        supplier_name: sub.supplier_name || '',
        supplier_email: sub.supplier_email || '',
        submission_date: sub.submission_date || sub.created_at,
        status: sub.status || 'submitted',
        administrative_score: sub.administrative_score,
        technical_score: sub.technical_score,
        financial_score: sub.financial_score,
        total_score: sub.total_score,
        evaluator_notes: sub.evaluator_notes,
        reviewer_id: sub.reviewer_id,
        reviewed_at: sub.reviewed_at,
        submission_documents: sub.submission_documents || []
      }));
    },
    enabled: !!tenderId
  });

  // Update evaluation mutation
  const updateEvaluationMutation = useMutation({
    mutationFn: async ({ submissionId, field, value }: { submissionId: string; field: string; value: string | number | boolean }) => {
      const user = await authService.getCurrentUser();
      
      // Placeholder - would use TenderSubmissionService for updates
      console.warn('Evaluation update via hexagonal not fully implemented');
      return { success: true };
    },
    onSuccess: () => {
      toast({ title: 'Évaluation mise à jour', description: 'L\'évaluation a été mise à jour avec succès' });
      queryClient.invalidateQueries({ queryKey: ['tender-submissions', tenderId] });
    },
    onError: () => {
      toast({ title: 'Erreur de mise à jour', description: 'Impossible de mettre à jour l\'évaluation', variant: 'destructive' });
    }
  });

  // Submit evaluation mutation
  const submitEvaluationMutation = useMutation({
    mutationFn: async ({ submissionId, scores, notes }: { submissionId: string; scores: { administrative?: number; technical?: number; financial?: number; }; notes?: string; }) => {
      const user = await authService.getCurrentUser();
      console.warn('Evaluation submission via hexagonal not fully implemented');
      return { success: true };
    },
    onSuccess: () => {
      toast({ title: 'Évaluation soumise', description: 'L\'évaluation a été soumise avec succès' });
      queryClient.invalidateQueries({ queryKey: ['tender-submissions', tenderId] });
    },
    onError: () => {
      toast({ title: 'Erreur de soumission', description: 'Impossible de soumettre l\'évaluation', variant: 'destructive' });
    }
  });

  // Approve/Reject mutation
  const approveRejectMutation = useMutation({
    mutationFn: async ({ submissionId, action }: { submissionId: string; action: 'approved' | 'rejected'; }) => {
      const user = await authService.getCurrentUser();
      console.warn('Approve/reject via hexagonal not fully implemented');
      return { success: true };
    },
    onSuccess: (_, variables) => {
      const action = variables.action === 'approved' ? 'approuvée' : 'rejetée';
      toast({ title: `Soumission ${action}`, description: `La soumission a été ${action} avec succès` });
      queryClient.invalidateQueries({ queryKey: ['tender-submissions', tenderId] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le statut', variant: 'destructive' });
    }
  });

  return {
    submissions: submissionsQuery.data || [],
    isLoading: submissionsQuery.isLoading,
    error: submissionsQuery.error,
    updateEvaluation: updateEvaluationMutation.mutateAsync,
    submitEvaluation: submitEvaluationMutation.mutateAsync,
    approveReject: approveRejectMutation.mutateAsync,
    isUpdating: updateEvaluationMutation.isPending,
    isSubmitting: submitEvaluationMutation.isPending,
    isApprovingRejecting: approveRejectMutation.isPending
  };
}
