/**
 * Hexagonal hook for contact form / authorization request submission
 */
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ContactFormData {
  applicant_type: string;
  individual_first_name?: string;
  individual_last_name?: string;
  email: string;
  phone_number: string;
  address?: string;
  national_id: string;
  company_name?: string;
  company_nif?: string;
  request_type: string;
  company_address?: string;
  description?: string;
}

export const useSubmitContactFormHex = () => {
  return useMutation({
    mutationFn: async (formData: ContactFormData) => {
      const insertData: Record<string, unknown> = {
        applicant_type: formData.applicant_type,
        email: formData.email,
        national_id: formData.national_id,
        phone_number: formData.phone_number,
        request_type: formData.request_type,
        parcel_address: formData.company_address || 'Non spécifié',
        status: 'draft',
      };

      // Add optional fields only if they have values
      if (formData.individual_first_name) {
        insertData.individual_first_name = formData.individual_first_name;
      }
      if (formData.individual_last_name) {
        insertData.individual_last_name = formData.individual_last_name;
      }
      if (formData.address) {
        insertData.address = formData.address;
      }
      if (formData.description) {
        insertData.description = formData.description;
      }
      if (formData.applicant_type === 'company') {
        if (formData.company_name) {
          insertData.company_name = formData.company_name;
        }
        if (formData.company_nif) {
          insertData.company_nif = formData.company_nif;
        }
      }

      const { data, error } = await supabase
        .from('authorization_requests')
        .insert([insertData as any]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Demande envoyée',
        description: "Votre demande d'autorisation a été envoyée avec succès.",
      });
    },
    onError: (error: any) => {
      console.error('Error submitting authorization request:', error);
      toast({
        title: 'Erreur',
        description: "Une erreur s'est produite lors de l'envoi de votre demande.",
        variant: 'destructive',
      });
    },
  });
};
