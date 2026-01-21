/**
 * Hexagonal hook for unified supplier portal
 * Encapsulates all supplier portal operations using hexagonal architecture
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { SupplierPortalService } from '@/application/services/SupplierPortalService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  nif: string | null;
  category: string | null;
  status: string;
  rating: any | null;
  contacts: Array<{
    name: string;
    email: string;
    phone?: string;
    role?: string;
  }>;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useSupplierPortalAuthHex = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const authRepository = RepositoryFactory.getAuthRepository();

  useEffect(() => {
    const subscription = authRepository.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    authRepository.getSession().then((session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [authRepository]);

  return { user, session, loading };
};

export const useFetchSupplierProfileHex = (user: SupabaseUser | null) => {
  const supplierService = SupplierPortalService.create();
  
  return useQuery({
    queryKey: ['supplier-portal-profile', user?.id],
    queryFn: async (): Promise<Supplier | null> => {
      if (!user) return null;

      // First try to find by user_id in contacts
      const suppliers = await supplierService['supplierRepository'].findAll();
      return suppliers.find(supplier => 
        supplier.contacts.some(contact => contact.email === user.email)
      ) || null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSupplierLoginHex = () => {
  const supplierService = SupplierPortalService.create();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const supplier = await supplierService.login(email, password);
      if (!supplier) {
        throw new Error('Invalid credentials');
      }
      return supplier;
    },
    onSuccess: (supplier) => {
      toast({
        title: 'Connexion réussie',
        description: `Bienvenue ${supplier.name}!`,
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-portal-profile'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de connexion',
        description: 'Email ou mot de passe incorrect',
        variant: 'destructive',
      });
    }
  });
};

export const useSupplierSignUpHex = () => {
  const supplierService = SupplierPortalService.create();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const supplier = await supplierService.signUp(email, password);
      return supplier;
    },
    onSuccess: (supplier) => {
      toast({
        title: 'Inscription réussie',
        description: `Compte créé pour ${supplier.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-portal-profile'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur d\'inscription',
        description: 'Cet email est déjà utilisé',
        variant: 'destructive',
      });
    }
  });
};

export const useSupplierLogoutHex = () => {
  const authService = AuthService.create();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await authService.logout();
    },
    onSuccess: () => {
      toast({
        title: 'Déconnexion réussie',
        description: 'Vous avez été déconnecté',
      });
      queryClient.clear();
    },
  });
};

export const useUpdateSupplierProfileHex = () => {
  const supplierService = SupplierPortalService.create();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ supplierId, updates }: { supplierId: string; updates: Partial<Supplier> }) => {
      return await supplierService.updateSupplierProfile(supplierId, updates);
    },
    onSuccess: () => {
      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été enregistrées',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-portal-profile'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de mise à jour',
        description: 'Impossible de mettre à jour votre profil',
        variant: 'destructive',
      });
    }
  });
};

export const useSupplierDocumentUploadHex = () => {
  const supplierService = SupplierPortalService.create();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      fileUrl: string;
      fileSize: number;
      documentType: string;
      supplierId: string;
    }) => {
      await supplierService.uploadDocument(data);
      return { success: true, id: `doc-${Date.now()}` };
    },
    onSuccess: () => {
      toast({
        title: 'Document téléchargé',
        description: 'Votre document a été téléchargé avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-documents'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de téléchargement',
        description: 'Impossible de télécharger le document',
        variant: 'destructive',
      });
    }
  });
};

export const useSupplierNotificationsHex = (supplierId: string) => {
  const supplierService = SupplierPortalService.create();
  
  return useQuery({
    queryKey: ['supplier-notifications', supplierId],
    queryFn: async () => {
      // Placeholder - would use NotificationService
      console.log('Notifications not implemented for supplier:', supplierId);
      return [];
    },
    enabled: !!supplierId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateTaskCommentHex = () => {
  const supplierService = SupplierPortalService.create();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, email, comment }: { taskId: string; email: string; comment: string }) => {
      await supplierService.createNotification({
        supplierId: taskId, // Using taskId as supplierId for now
        taskId,
        email,
        comment,
        notificationType: 'task_comment'
      });
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Commentaire ajouté',
        description: 'Votre commentaire a été enregistré',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-notifications'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le commentaire',
        variant: 'destructive',
      });
    }
  });
};

export const useCompleteTaskHex = () => {
  const supplierService = SupplierPortalService.create();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, projectManagerId }: { taskId: string; projectManagerId: string }) => {
      await supplierService.createNotification({
        supplierId: taskId, // Using taskId as supplierId for now
        taskId,
        email: projectManagerId,
        comment: 'Tâche marquée comme complétée',
        notificationType: 'task_completed'
      });
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Tâche complétée',
        description: 'La tâche a été marquée comme terminée',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-notifications'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer la tâche comme terminée',
        variant: 'destructive',
      });
    }
  });
};

export const useSupplierTasksHex = (supplierId: string) => {
  // Placeholder - would use TaskService
  return useQuery({
    queryKey: ['supplier-tasks', supplierId],
    queryFn: async () => {
      console.log('Tasks not implemented for supplier:', supplierId);
      return [];
    },
    enabled: !!supplierId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSupplierPaymentRequestsHex = (supplierId: string) => {
  // Placeholder - would use PaymentRequestService
  return useQuery({
    queryKey: ['supplier-payment-requests', supplierId],
    queryFn: async () => {
      console.log('Payment requests not implemented for supplier:', supplierId);
      return [];
    },
    enabled: !!supplierId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSupplierInvoicesHex = (supplierName: string) => {
  // Placeholder - would use InvoiceService
  return useQuery({
    queryKey: ['supplier-invoices', supplierName],
    queryFn: async () => {
      console.log('Invoices not implemented for supplier:', supplierName);
      return [];
    },
    enabled: !!supplierName,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUploadDocumentHex = () => {
  const supplierService = SupplierPortalService.create();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, file, title, description }: {
      userId: string;
      file: File;
      title: string;
      description: string;
    }) => {
      // Create file URL (in real implementation, would use StorageService)
      const fileUrl = `https://example.com/files/${file.name}`;
      
      await supplierService.uploadDocument({
        title,
        description,
        fileUrl,
        fileSize: file.size,
        documentType: file.type,
        supplierId: userId
      });
      
      return { success: true, id: `doc-${Date.now()}` };
    },
    onSuccess: () => {
      toast({
        title: 'Document téléchargé',
        description: 'Votre document a été téléchargé avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-documents'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de téléchargement',
        description: 'Impossible de télécharger le document',
        variant: 'destructive',
      });
    }
  });
};
