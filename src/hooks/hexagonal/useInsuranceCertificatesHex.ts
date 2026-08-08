/**
 * Hexagonal hook for insurance certificates management
 * Replaces direct supabase calls in UnifiedInsuranceManager.tsx
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { InsuranceCertificatesService } from '@/application/services/InsuranceCertificatesService';
import { InsuranceCertificateUpdateData } from '@/dtos/entities/InsuranceDTO';;

// Export the type for external use
export type { InsuranceCertificateDTO as InsuranceCertificateData } from '@/dtos/entities/InsuranceCertificateDTO';

export function useInsuranceCertificatesHex(projectId?: string) {
  const queryClient = useQueryClient();
  const insuranceService = InsuranceCertificatesService.create();

  // Fetch certificates
  const certificatesQuery = useQuery({
    queryKey: ['insurance-certificates-hex', projectId],
    queryFn: async () => {
      return await insuranceService.getCertificates(projectId);
    }
  });

  // Create certificate
  const createMutation = useMutation({
    mutationFn: async (data: InsuranceCertificateCreateData) => {
      return await insuranceService.createCertificate(data);
    },
    onSuccess: () => {
      toast({
        title: 'Certificat créé',
        description: 'Le certificat d\'assurance a été créé avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['insurance-certificates-hex'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de création',
        description: 'Impossible de créer le certificat d\'assurance',
        variant: 'destructive',
      });
    }
  });

  // Update certificate
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsuranceCertificateUpdateData> }) => {
      await insuranceService.updateCertificate(id, data);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Certificat mis à jour',
        description: 'Le certificat d\'assurance a été mis à jour',
      });
      queryClient.invalidateQueries({ queryKey: ['insurance-certificates-hex'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de mise à jour',
        description: 'Impossible de mettre à jour le certificat d\'assurance',
        variant: 'destructive',
      });
    }
  });

  // Delete certificate
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await insuranceService.deleteCertificate(id);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Certificat supprimé',
        description: 'Le certificat d\'assurance a été supprimé',
      });
      queryClient.invalidateQueries({ queryKey: ['insurance-certificates-hex'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de suppression',
        description: 'Impossible de supprimer le certificat d\'assurance',
        variant: 'destructive',
      });
    }
  });

  // Upload certificate file
  const uploadFileMutation = useMutation({
    mutationFn: async ({ certificateId, file }: { certificateId: string; file: File }) => {
      const fileUrl = await insuranceService.uploadCertificateFile(certificateId, file);
      
      // Update certificate with file URL
      await insuranceService.updateCertificate(certificateId, {
        certificate_url: fileUrl
      });
      
      return { success: true, fileUrl };
    },
    onSuccess: (data) => {
      toast({
        title: 'Fichier téléchargé',
        description: 'Le certificat a été téléchargé avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['insurance-certificates-hex'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de téléchargement',
        description: 'Impossible de télécharger le certificat',
        variant: 'destructive',
      });
    }
  });

  // Validate certificate
  const validateMutation = useMutation({
    mutationFn: async (id: string) => {
      await insuranceService.validateCertificate(id);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Certificat validé',
        description: 'Le certificat d\'assurance a été validé',
      });
      queryClient.invalidateQueries({ queryKey: ['insurance-certificates-hex'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de validation',
        description: 'Impossible de valider le certificat d\'assurance',
        variant: 'destructive',
      });
    }
  });

  // Expire certificate
  const expireMutation = useMutation({
    mutationFn: async (id: string) => {
      await insuranceService.expireCertificate(id);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Certificat expiré',
        description: 'Le certificat d\'assurance a été marqué comme expiré',
      });
      queryClient.invalidateQueries({ queryKey: ['insurance-certificates-hex'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur d\'expiration',
        description: 'Impossible de marquer le certificat comme expiré',
        variant: 'destructive',
      });
    }
  });

  return {
    // Queries
    certificates: certificatesQuery.data || [],
    isLoading: certificatesQuery.isLoading,
    error: certificatesQuery.error,
    refetch: certificatesQuery.refetch,

    // Mutations
    createCertificate: createMutation.mutateAsync,
    updateCertificate: updateMutation.mutateAsync,
    deleteCertificate: deleteMutation.mutateAsync,
    uploadFile: uploadFileMutation.mutateAsync,
    validateCertificate: validateMutation.mutateAsync,
    expireCertificate: expireMutation.mutateAsync,

    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUploading: uploadFileMutation.isPending,
    isValidating: validateMutation.isPending,
    isExpiring: expireMutation.isPending,

    // Error states
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    uploadError: uploadFileMutation.error,
    validateError: validateMutation.error,
    expireError: expireMutation.error
  };
}
