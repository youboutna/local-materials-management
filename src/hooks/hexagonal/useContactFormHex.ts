/**
 * Hexagonal hook for contact form / authorization request submission
 * Delegates persistence to AuthorizationRequestAdapter (no direct Supabase calls).
 */
import { toast } from '@/hooks/use-toast';
import { getAuthorizationRequestRepository } from '@/infrastructure/adapters/supabase/AuthorizationRequestAdapter';
import { useMutation } from '@tanstack/react-query';

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

const repo = getAuthorizationRequestRepository();

export const useSubmitContactFormHex = () => {
  return useMutation({
    mutationFn: async (formData: ContactFormData) => {
      return repo.submit({
        applicantType: formData.applicant_type,
        individualFirstName: formData.individual_first_name,
        individualLastName: formData.individual_last_name,
        email: formData.email,
        phoneNumber: formData.phone_number,
        address: formData.address,
        nationalId: formData.national_id,
        companyName: formData.company_name,
        companyNif: formData.company_nif,
        requestType: formData.request_type,
        parcelAddress: formData.company_address,
        description: formData.description,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Demande envoyée',
        description: "Votre demande d'autorisation a été envoyée avec succès.",
      });
    },
    onError: (error: unknown) => {
      console.error('Error submitting authorization request:', error);
      toast({
        title: 'Erreur',
        description: "Une erreur s'est produite lors de l'envoi de votre demande.",
        variant: 'destructive',
      });
    },
  });
};
