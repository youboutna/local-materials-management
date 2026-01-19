import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TenderService } from '@/application/services/TenderService';
import { TenderSubmissionService, UploadedDocument } from '@/services/TenderSubmissionService';

interface SharedDocument {
  id: string;
  title: string;
  file_url: string;
  file_name: string;
  description?: string;
  created_at: string;
  metadata?: {
    tender_id?: string;
    phase?: number;
    shared_by?: string;
  };
}

interface PublicTender {
  id: string;
  title: string;
  description: string;
  project_id?: string;
  launch_date?: string;
  attribution_date?: string;
  deadline_date?: string;
  selection_mode?: string;
  market_type?: string;
  financing_source?: string;
  project_reference?: string;
  status: 'draft' | 'published' | 'closed' | 'awarded';
  current_phase?: number;
  created_at: string;
  updated_at: string;
}

interface SubmitBidParams {
  tender: PublicTender;
  documents: UploadedDocument[];
  uploadFile: (file: File, path: string) => Promise<{ success: boolean; url?: string; error?: string }>;
  onProgress?: (step: string, current?: number, total?: number) => void;
}

export function useSupplierPortalHex(selectedTenderId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch public tenders
  const publicTendersQuery = useQuery({
    queryKey: ['public-tenders'],
    queryFn: async () => {
      return await TenderService.getPublishedTendersForSubmission() as PublicTender[];
    }
  });

  // Fetch shared documents for selected tender
  const sharedDocumentsQuery = useQuery({
    queryKey: ['shared-documents', selectedTenderId],
    queryFn: async () => {
      if (!selectedTenderId) return [];
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('document_type', 'tender')
        .eq('is_shared_with_suppliers', true)
        .contains('metadata', { tender_id: selectedTenderId });

      if (error) throw error;
      return (data || []) as SharedDocument[];
    },
    enabled: !!selectedTenderId
  });

  // Fetch user submission
  const userSubmissionQuery = useQuery({
    queryKey: ['user-submission', selectedTenderId],
    queryFn: async () => {
      if (!selectedTenderId) return null;
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      return await TenderSubmissionService.getUserSubmission(
        selectedTenderId,
        user.user.id
      );
    },
    enabled: !!selectedTenderId
  });

  // Submit bid mutation
  const submitBidMutation = useMutation({
    mutationFn: async ({ tender, documents, uploadFile, onProgress }: SubmitBidParams) => {
      // Validate deadline
      if (tender.deadline_date) {
        const deadline = new Date(tender.deadline_date);
        const now = new Date();
        
        if (isNaN(deadline.getTime())) {
          throw new Error('Date limite invalide');
        }
        
        if (now > deadline) {
          throw new Error('La date limite est dépassée');
        }
      }
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non connecté');

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.user.id)
        .single();

      // Create submission with documents
      return await TenderSubmissionService.createSubmissionWithDocuments(
        {
          tender_id: tender.id,
          user_id: user.user.id,
          supplier_name: profile?.full_name || 'Fournisseur',
          supplier_email: user.user.email || '',
          submission_date: new Date().toISOString(),
          status: 'submitted'
        },
        documents,
        uploadFile,
        onProgress
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-submission'] });
      toast({
        title: 'Soumission réussie',
        description: 'Votre offre a été soumise avec succès',
      });
    },
    onError: (error) => {
      console.error('Submit bid error:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de la soumission',
        variant: 'destructive',
      });
    }
  });

  return {
    // Queries
    publicTenders: publicTendersQuery.data || [],
    sharedDocuments: sharedDocumentsQuery.data || [],
    userSubmission: userSubmissionQuery.data,
    isLoading: publicTendersQuery.isLoading,
    isLoadingDocuments: sharedDocumentsQuery.isLoading,
    
    // Mutations
    submitBid: submitBidMutation.mutate,
    isSubmitting: submitBidMutation.isPending,
  };
}
