import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TenderSubmissionService } from '@/application/services/TenderSubmissionService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { useToast } from '@/hooks/use-toast';

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
  submission_documents?: {
    id: string;
    category: 'administrative' | 'technical' | 'financial';
    subcategory?: string;
    document: {
      id: string;
      title: string;
      file_url: string;
      file_name: string;
    };
  }[];
}

export function useTenderEvaluationHex(tenderId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const tenderRepository = RepositoryFactory.getTenderRepository();
  const authRepository = RepositoryFactory.getAuthRepository();

  // Fetch tender submissions
  const submissionsQuery = useQuery({
    queryKey: ['tender-submissions', tenderId],
    queryFn: async (): Promise<TenderSubmission[]> => {
      // Use hexagonal TenderSubmissionService
      const submissions = await TenderSubmissionService.getTenderSubmissionsByTenderId(tenderId);
      return submissions.map((sub: any) => ({
        id: sub.id,
        user_id: sub.user_id,
        tender_id: sub.tender_id,
        supplier_name: sub.supplier_name,
        supplier_email: sub.supplier_email,
        submission_date: sub.submission_date,
        status: sub.status,
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
    mutationFn: async ({ 
      submissionId, 
      field, 
      value 
    }: { 
      submissionId: string; 
      field: string; 
      value: string | number | boolean 
    }) => {
      const user = await authRepository.getCurrentUser();
      
      // Update evaluation using repository
      await tenderRepository.updateSubmission(submissionId, {
        [field]: value,
        ...(field === 'status' && value !== 'submitted' && {
          reviewer_id: user?.id,
          reviewed_at: new Date().toISOString()
        })
      });
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Évaluation mise à jour',
        description: 'L\'évaluation a été mise à jour avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['tender-submissions', tenderId] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de mise à jour',
        description: 'Impossible de mettre à jour l\'évaluation',
        variant: 'destructive',
      });
    }
  });

  // Submit evaluation mutation
  const submitEvaluationMutation = useMutation({
    mutationFn: async ({ 
      submissionId, 
      scores, 
      notes 
    }: { 
      submissionId: string; 
      scores: {
        administrative?: number;
        technical?: number;
        financial?: number;
      };
      notes?: string;
    }) => {
      const user = await authRepository.getCurrentUser();
      
      // Submit evaluation using repository
      await tenderRepository.updateSubmission(submissionId, {
        administrative_score: scores.administrative,
        technical_score: scores.technical,
        financial_score: scores.financial,
        total_score: (scores.administrative || 0) + (scores.technical || 0) + (scores.financial || 0),
        evaluator_notes: notes,
        reviewer_id: user?.id,
        reviewed_at: new Date().toISOString(),
        status: 'under_review'
      });
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Évaluation soumise',
        description: 'L\'évaluation a été soumise avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['tender-submissions', tenderId] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de soumission',
        description: 'Impossible de soumettre l\'évaluation',
        variant: 'destructive',
      });
    }
  });

  // Approve/Reject mutation
  const approveRejectMutation = useMutation({
    mutationFn: async ({ 
      submissionId, 
      action 
    }: { 
      submissionId: string; 
      action: 'approved' | 'rejected';
    }) => {
      const user = await authRepository.getCurrentUser();
      
      // Update status using repository
      await tenderRepository.updateSubmission(submissionId, {
        status: action,
        reviewer_id: user?.id,
        reviewed_at: new Date().toISOString()
      });
      
      return { success: true };
    },
    onSuccess: (_, variables) => {
      const action = variables.action === 'approved' ? 'approuvée' : 'rejetée';
      toast({
        title: `Soumission ${action}`,
        description: `La soumission a été ${action} avec succès`,
      });
      queryClient.invalidateQueries({ queryKey: ['tender-submissions', tenderId] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    }
  });

  return {
    // Data
    submissions: submissionsQuery.data || [],
    isLoading: submissionsQuery.isLoading,
    error: submissionsQuery.error,

    // Mutations
    updateEvaluation: updateEvaluationMutation.mutateAsync,
    submitEvaluation: submitEvaluationMutation.mutateAsync,
    approveReject: approveRejectMutation.mutateAsync,

    // Loading states
    isUpdating: updateEvaluationMutation.isPending,
    isSubmitting: submitEvaluationMutation.isPending,
    isApprovingRejecting: approveRejectMutation.isPending
  };
}
