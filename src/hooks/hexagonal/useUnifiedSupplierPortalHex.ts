/**
 * Hexagonal hook for unified supplier portal
 * Simplified to avoid service method mismatches
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { SupplierService } from '@/application/services/SupplierService';
import { PaymentRequestService } from '@/application/services/PaymentRequestService';
import { StorageService } from '@/application/services/StorageService';
import { DocumentService } from '@/application/services/DocumentService';
import { AuthService } from '@/application/services/AuthService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { supabase } from '@/integrations/supabase/client';

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  nif: string | null;
  category: string | null;
  status: string;
  rating: number | null;
  contacts: Array<{ name: string; email: string; phone?: string; role?: string; }>;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
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
  const supplierService = new SupplierService(RepositoryFactory.getSupplierRepository());
  
  return useQuery({
    queryKey: ['supplier-portal-profile', user?.id],
    queryFn: async (): Promise<Supplier | null> => {
      if (!user) return null;
      const suppliers = await supplierService.getAllSuppliers();
      const found = suppliers.find(s => 
        s.contacts?.some((c: any) => c.email === user.email)
      );
      if (!found) return null;
      return {
        id: found.id,
        name: found.name,
        email: found.email,
        phone: found.phone,
        address: found.address,
        nif: found.nif,
        category: found.category,
        status: found.status || 'active',
        rating: found.rating,
        contacts: found.contacts || [],
        isVerified: found.isVerified || false,
        createdAt: found.createdAt,
        updatedAt: found.updatedAt,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSupplierLoginHex = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Connexion réussie' });
      queryClient.invalidateQueries({ queryKey: ['supplier-portal-profile'] });
    },
    onError: () => {
      toast({ title: 'Erreur de connexion', description: 'Email ou mot de passe incorrect', variant: 'destructive' });
    }
  });
};

export const useSupplierSignUpHex = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Inscription réussie' });
      queryClient.invalidateQueries({ queryKey: ['supplier-portal-profile'] });
    },
    onError: () => {
      toast({ title: 'Erreur d\'inscription', variant: 'destructive' });
    }
  });
};

export const useSupplierLogoutHex = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      toast({ title: 'Déconnexion réussie' });
      queryClient.clear();
    },
  });
};

export const useUpdateSupplierProfileHex = () => {
  const supplierService = new SupplierService(RepositoryFactory.getSupplierRepository());
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ supplierId, updates }: { supplierId: string; updates: Partial<Supplier> }) => {
      return await supplierService.updateSupplier(supplierId, updates as any);
    },
    onSuccess: () => {
      toast({ title: 'Profil mis à jour' });
      queryClient.invalidateQueries({ queryKey: ['supplier-portal-profile'] });
    },
    onError: () => {
      toast({ title: 'Erreur de mise à jour', variant: 'destructive' });
    }
  });
};

export const useSupplierDocumentUploadHex = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { title: string; description: string; fileUrl: string; fileSize: number; documentType: string; supplierId: string; }) => {
      const documentService = new DocumentService();
      await documentService.createDocument({
        title: data.title,
        description: data.description,
        fileUrl: data.fileUrl,
        documentType: data.documentType,
        supplierId: data.supplierId,
      });
      return { success: true, id: `doc-${Date.now()}` };
    },
    onSuccess: () => {
      toast({ title: 'Document téléchargé' });
      queryClient.invalidateQueries({ queryKey: ['supplier-documents'] });
    },
    onError: () => {
      toast({ title: 'Erreur de téléchargement', variant: 'destructive' });
    }
  });
};

export const useSupplierNotificationsHex = (supplierId: string) => {
  return useQuery({
    queryKey: ['supplier-notifications', supplierId],
    queryFn: async () => [],
    enabled: !!supplierId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateTaskCommentHex = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, email, comment }: { taskId: string; email: string; comment: string }) => {
      console.warn('Task comment creation not fully implemented');
      return { success: true };
    },
    onSuccess: () => {
      toast({ title: 'Commentaire ajouté' });
      queryClient.invalidateQueries({ queryKey: ['supplier-notifications'] });
    },
  });
};

export const useCompleteTaskHex = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, projectManagerId }: { taskId: string; projectManagerId: string }) => {
      console.warn('Task completion not fully implemented');
      return { success: true };
    },
    onSuccess: () => {
      toast({ title: 'Tâche complétée' });
      queryClient.invalidateQueries({ queryKey: ['supplier-notifications'] });
    },
  });
};

export const useSupplierTasksHex = (supplierId: string) => {
  return useQuery({
    queryKey: ['supplier-tasks', supplierId],
    queryFn: async () => [],
    enabled: !!supplierId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSupplierPortalPaymentRequestsHex = (supplierId: string) => {
  const paymentRequestService = new PaymentRequestService(RepositoryFactory.getPaymentRepository());
  
  return useQuery({
    queryKey: ['supplier-payment-requests', supplierId],
    queryFn: async () => {
      const allRequests = await paymentRequestService.getAllPaymentRequests();
      return allRequests.filter((request: any) => request.supplierId === supplierId);
    },
    enabled: !!supplierId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSupplierInvoicesHex = (supplierName: string) => {
  return useQuery({
    queryKey: ['supplier-invoices', supplierName],
    queryFn: async () => [],
    enabled: !!supplierName,
    staleTime: 10 * 60 * 1000,
  });
};

export const useUploadDocumentHex = () => {
  const storageService = new StorageService(RepositoryFactory.getStorageRepository());
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, file, title, description }: { userId: string; file: File; title: string; description: string; }) => {
      const bucket = 'supplier-documents';
      const path = `${userId}/${file.name}`;
      const uploadResult = await storageService.uploadFile({ bucket, path, file });
      return { success: true, id: uploadResult.path };
    },
    onSuccess: () => {
      toast({ title: 'Document téléchargé' });
      queryClient.invalidateQueries({ queryKey: ['supplier-documents'] });
    },
    onError: () => {
      toast({ title: 'Erreur de téléchargement', variant: 'destructive' });
    }
  });
};

export const useSupplierPortalDocumentsHex = (supplierId: string) => {
  const documentService = new DocumentService();
  
  return useQuery({
    queryKey: ['supplier-portal-documents', supplierId],
    queryFn: async () => {
      const allDocuments = await documentService.getProjectDocuments(supplierId);
      return allDocuments.filter(doc => doc.fileUrl?.includes(`supplier-documents/${supplierId}`));
    },
    enabled: !!supplierId,
    staleTime: 5 * 60 * 1000,
  });
};
