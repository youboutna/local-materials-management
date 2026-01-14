/**
 * Hexagonal hook for unified supplier portal
 * Encapsulates all supplier portal operations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  user_id: string | null;
  contact_person: string | null;
  is_active: boolean;
}

export const useSupplierPortalAuthHex = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, session, loading };
};

export const useFetchSupplierProfileHex = (user: SupabaseUser | null) => {
  return useQuery({
    queryKey: ['supplier-portal-profile', user?.id],
    queryFn: async (): Promise<Supplier | null> => {
      if (!user) return null;

      // First try to find by user_id
      let { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // If no profile found by user_id, try to find by email and link it
      if (!data && user.email) {
        const { data: emailData } = await supabase
          .from('suppliers')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (emailData) {
          // Link the existing supplier to this user
          const { data: updatedData, error: updateError } = await supabase
            .from('suppliers')
            .update({ user_id: user.id })
            .eq('id', emailData.id)
            .select()
            .single();

          if (!updateError) {
            toast({
              title: 'Profil lié',
              description: 'Votre profil fournisseur a été lié à votre compte.',
            });
            return updatedData as Supplier;
          }
        }
      }

      if (error) throw error;
      return data as Supplier | null;
    },
    enabled: !!user,
  });
};

export const useSupplierLoginHex = () => {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Connexion réussie',
        description: 'Bienvenue sur le portail fournisseur',
      });
    },
    onError: (error: any) => {
      let errorMessage = 'Erreur de connexion';
      if (error.message === 'Invalid login credentials') {
        errorMessage = 'Email ou mot de passe incorrect';
      }
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

export const useSupplierSignUpHex = () => {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/supplier-portal`,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Inscription réussie',
        description: 'Vérifiez votre email pour confirmer votre compte',
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'inscription",
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useSupplierLogoutHex = () => {
  return useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      toast({
        title: 'Déconnexion réussie',
        description: 'Vous avez été déconnecté',
      });
    },
  });
};

export const useSupplierPortalNotificationsHex = (supplierId: string | undefined) => {
  return useQuery({
    queryKey: ['supplier-portal-notifications', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      
      const { data, error } = await supabase
        .from('supplier_notifications')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!supplierId,
  });
};

export const useSupplierPortalPaymentRequestsHex = (supplierId: string | undefined) => {
  return useQuery({
    queryKey: ['supplier-portal-payment-requests', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];

      // Get from supplier_payment_requests table
      const { data: directRequests, error: directError } = await supabase
        .from('supplier_payment_requests')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('requested_date', { ascending: false });

      if (directError) {
        console.error('Error fetching payment requests:', directError);
      }

      // Also get from notifications table
      const { data: notificationRequests, error: notificationError } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', supplierId)
        .eq('type', 'supplier_payment_request')
        .order('created_at', { ascending: false });

      if (notificationError) {
        console.error('Error fetching notification requests:', notificationError);
      }

      // Combine both sources
      const combined = [
        ...(directRequests || []),
        ...(notificationRequests || []).map((notif) => ({
          id: notif.id,
          supplier_id: supplierId,
          amount: (notif.metadata as any)?.amount || 0,
          description: (notif.metadata as any)?.description || notif.message,
          payment_reason: (notif.metadata as any)?.payment_reason || 'Non spécifié',
          status: (notif.metadata as any)?.status || 'pending',
          requested_date: notif.created_at,
          supporting_documents: (notif.metadata as any)?.supporting_documents || [],
          notes: (notif.metadata as any)?.notes,
          project_id: (notif.metadata as any)?.project_id,
          created_at: notif.created_at,
          updated_at: notif.updated_at,
        })),
      ];

      return combined;
    },
    enabled: !!supplierId,
  });
};

export const useSupplierPortalDocumentsHex = (userId: string | undefined, supplierId: string | undefined, supplierName: string | undefined) => {
  return useQuery({
    queryKey: ['supplier-portal-documents', userId, supplierId],
    queryFn: async () => {
      if (!userId || !supplierId) return [];

      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          projects!documents_project_id_fkey (title, status)
        `)
        .or(`assigned_to.eq.${userId},tags.cs.{${supplierName}}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && !!supplierId,
  });
};

export const useUploadSupplierDocumentHex = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      userId,
      title,
      description,
      fileUrl,
      fileName,
      mimeType,
      fileSize,
      documentType,
    }: {
      userId: string;
      title: string;
      description: string;
      fileUrl: string;
      fileName: string;
      mimeType: string;
      fileSize: number;
      documentType: string;
    }) => {
      const { error } = await supabase.from('documents').insert({
        title,
        description,
        file_url: fileUrl,
        file_name: fileName,
        mime_type: mimeType,
        file_size: fileSize,
        document_type: documentType as any,
        uploaded_by: userId,
        status: 'draft',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-portal-documents'] });
      toast({
        title: 'Document téléchargé',
        description: 'Votre document a été téléchargé avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de téléchargement',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useAddSupplierTaskCommentHex = () => {
  return useMutation({
    mutationFn: async ({
      supplierId,
      taskId,
      email,
      comment,
    }: {
      supplierId: string;
      taskId: string;
      email: string;
      comment: string;
    }) => {
      const { error } = await supabase.from('supplier_notifications').insert({
        supplier_id: supplierId,
        task_id: taskId,
        notification_type: 'task_comment',
        email,
        metadata: { comment, from_supplier: true },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Commentaire ajouté',
        description: 'Votre commentaire a été envoyé',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useMarkTaskCompletedHex = () => {
  return useMutation({
    mutationFn: async ({
      supplierId,
      taskId,
      email,
    }: {
      supplierId: string;
      taskId: string;
      email: string;
    }) => {
      const { error } = await supabase.from('supplier_notifications').insert({
        supplier_id: supplierId,
        task_id: taskId,
        notification_type: 'task_completed',
        email,
        metadata: { status: 'completed', from_supplier: true },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Tâche marquée comme terminée',
        description: 'Le chef de projet a été notifié',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
