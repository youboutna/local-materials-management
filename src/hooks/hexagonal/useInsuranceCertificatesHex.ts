/**
 * Hexagonal hook for insurance certificates management
 * Replaces direct supabase calls in UnifiedInsuranceManager.tsx
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface InsuranceCertificateData {
  id?: string;
  project_id: string;
  contractor_id: string;
  contractor_name: string;
  insurance_company: string;
  policy_number: string;
  coverage_amount: number;
  coverage_type: string;
  valid_from: string;
  valid_until: string;
  status?: string;
  notes?: string;
  certificate_url?: string;
}

export function useInsuranceCertificatesHex(projectId?: string) {
  const queryClient = useQueryClient();

  // Fetch certificates
  const certificatesQuery = useQuery({
    queryKey: ['insurance-certificates-hex', projectId],
    queryFn: async () => {
      let query = supabase
        .from('insurance_certificates')
        .select('*')
        .order('valid_until', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Create certificate
  const createMutation = useMutation({
    mutationFn: async (data: InsuranceCertificateData) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: certificate, error } = await supabase
        .from('insurance_certificates')
        .insert({
          project_id: data.project_id,
          contractor_id: data.contractor_id,
          contractor_name: data.contractor_name,
          insurance_company: data.insurance_company,
          policy_number: data.policy_number,
          coverage_amount: data.coverage_amount,
          coverage_type: data.coverage_type,
          valid_from: data.valid_from,
          valid_until: data.valid_until,
          status: 'active',
          last_verified: new Date().toISOString(),
          verified_by: user?.id,
          notes: data.notes,
          certificate_url: data.certificate_url
        })
        .select()
        .single();

      if (error) throw error;
      return certificate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-certificates-hex'] });
      toast({ title: 'Succès', description: 'Certificat créé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Update certificate
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsuranceCertificateData> }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('insurance_certificates')
        .update({
          ...data,
          last_verified: new Date().toISOString(),
          verified_by: user?.id
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-certificates-hex'] });
      toast({ title: 'Succès', description: 'Certificat mis à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Delete certificate
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('insurance_certificates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-certificates-hex'] });
      toast({ title: 'Succès', description: 'Certificat supprimé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Upload document
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, certificateId }: { file: File; certificateId: string }) => {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `insurance/${certificateId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Update certificate with URL
      await updateMutation.mutateAsync({
        id: certificateId,
        data: { certificate_url: publicUrl }
      });

      return publicUrl;
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Document téléchargé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  return {
    certificates: certificatesQuery.data || [],
    isLoading: certificatesQuery.isLoading,
    error: certificatesQuery.error,
    createCertificate: createMutation.mutateAsync,
    updateCertificate: updateMutation.mutateAsync,
    deleteCertificate: deleteMutation.mutateAsync,
    uploadDocument: uploadDocumentMutation.mutateAsync,
    refetch: certificatesQuery.refetch,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUploading: uploadDocumentMutation.isPending
  };
}
