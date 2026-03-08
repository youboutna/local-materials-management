import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TenderSubmissionService, UploadedDocument } from '@/application/services/TenderSubmissionService';
import { TenderService } from '@/application/services/TenderService';
import { TenderDocumentDTO } from '@/dtos/entities/TenderDocumentDTO';
import { UserService } from '@/application/services/UserService';
import { AuthService } from '@/application/services/AuthService';
import { DocumentService } from '@/application/services/DocumentService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { useToast } from '@/hooks/use-toast';

interface PublicTender { id: string; title: string; description?: string; deadline_date?: string; status?: string; }

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
      const tenderService = new TenderService(
        RepositoryFactory.getTenderRepository(),
        RepositoryFactory.getParsedInvoiceRepository(),
        RepositoryFactory.getTenderDocumentRepository()
      );
      const allTenders = await tenderService.getAllTenders();
      const now = new Date();
      
      // Filter for published tenders that are open for submission
      return allTenders
        .filter(tender => tender.status === 'published' && 
                new Date(tender.deadlineDate || '') > now)
        .map(tender => ({
          id: tender.id,
          title: tender.title,
          description: tender.description,
          deadline_date: tender.deadlineDate,
          status: tender.status
        })) as PublicTender[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchInterval: false // Disable auto-refetch to prevent infinite loops
  });

  // Fetch shared documents for selected tender
  const sharedDocumentsQuery = useQuery({
    queryKey: ['shared-documents', selectedTenderId],
    queryFn: async () => {
      if (!selectedTenderId) return [];
      
      // Use repository directly until DocumentService implements getSharedTenderDocuments
      const documentRepository = RepositoryFactory.getDocumentRepository();
      // Search all documents and filter by tender_id in metadata (temporary solution)
      const allDocuments = await documentRepository.findAll();
      const documents = allDocuments.filter(doc => 
        doc.metadata?.tender_id === selectedTenderId
      );
      
      return documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        file_url: doc.fileUrl,
        file_name: doc.fileName,
        description: doc.description,
        created_at: doc.createdAt,
        metadata: {
          tender_id: selectedTenderId
        }
      }));
    },
    enabled: !!selectedTenderId
  });

  // Fetch user submission
  const userSubmissionQuery = useQuery({
    queryKey: ['user-submission', selectedTenderId],
    queryFn: async () => {
      if (!selectedTenderId) return null;
      
      const authService = new AuthService(RepositoryFactory.getAuthRepository());
      const user = await authService.getCurrentUser();
      if (!user) return null;

      return await TenderSubmissionService.getUserSubmission(
        selectedTenderId,
        user.id
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
      
      const authService = new AuthService(RepositoryFactory.getAuthRepository());
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Get user profile via hexagonal service
      const userService = new UserService(RepositoryFactory.getUserRepository());
      const profile = await userService.getUserById(user.id);

      // Create submission with documents using hexagonal service
      return await TenderSubmissionService.createSubmissionWithDocuments(
        {
          tender_id: tender.id,
          user_id: user.id,
          supplier_name: profile?.fullName || 'Fournisseur',
          supplier_email: user.email || '',
          submission_date: new Date().toISOString(),
          status: 'submitted'
        },
        documents,
        uploadFile,
        onProgress
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-submission', selectedTenderId] });
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
