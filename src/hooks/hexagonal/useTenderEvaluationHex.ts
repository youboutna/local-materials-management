import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

  // Fetch tender submissions
  const submissionsQuery = useQuery({
    queryKey: ['tender-submissions', tenderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tender_submissions')
        .select(`
          *,
          submission_documents:tender_submission_documents(
            *,
            document:documents(*)
          )
        `)
        .eq('tender_id', tenderId)
        .order('submission_date', { ascending: false });

      if (error) throw error;
      return data as TenderSubmission[];
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
      value: any 
    }) => {
      const updateData: Record<string, any> = { [field]: value };
      
      if (field === 'status' && value !== 'submitted') {
        const { data: { user } } = await supabase.auth.getUser();
        updateData.reviewer_id = user?.id;
        updateData.reviewed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tender_submissions')
        .update(updateData)
        .eq('id', submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-submissions', tenderId] });
      toast({
        title: "Évaluation mise à jour",
        description: "Les modifications ont été sauvegardées avec succès."
      });
    },
    onError: (error) => {
      console.error('Error updating evaluation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications.",
        variant: "destructive"
      });
    }
  });

  // Batch update scores
  const updateScoresMutation = useMutation({
    mutationFn: async ({ 
      submissionId, 
      scores 
    }: { 
      submissionId: string; 
      scores: { 
        administrative_score?: number; 
        technical_score?: number; 
        financial_score?: number;
        total_score?: number;
      } 
    }) => {
      const { error } = await supabase
        .from('tender_submissions')
        .update(scores)
        .eq('id', submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-submissions', tenderId] });
      toast({
        title: "Scores mis à jour",
        description: "Les scores ont été sauvegardés."
      });
    }
  });

  return {
    // Queries
    submissions: submissionsQuery.data || [],
    isLoading: submissionsQuery.isLoading,
    isError: submissionsQuery.isError,
    refetch: submissionsQuery.refetch,
    
    // Mutations
    updateEvaluation: (submissionId: string, field: string, value: any) => 
      updateEvaluationMutation.mutate({ submissionId, field, value }),
    updateScores: updateScoresMutation.mutate,
    isUpdating: updateEvaluationMutation.isPending || updateScoresMutation.isPending,
  };
}
