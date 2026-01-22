/**
 * Complete hexagonal hook for Supplier Portal
 * Centralizes all supplier portal operations including auth, profile, documents, tasks, notifications, payments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import { useToast } from '@/hooks/use-toast';

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  rating?: number;
  nif?: string;
  commerce_register_ref?: string;
  user_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierDocument {
  id: string;
  title: string;
  file_name: string;
  file_url: string;
  document_type: string;
  uploaded_by: string;
  created_at: string;
  description?: string;
  file_size?: number;
  metadata?: any;
}

export interface SupplierTask {
  id: string;
  title: string;
  description?: string;
  assigned_to: string;
  project_id?: string;
  phase_id?: string;
  due_date?: string;
  priority: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface SupplierNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  supplier_id: string;
  sent_at: string;
  read_at?: string;
}

export interface PaymentRequest {
  id: string;
  title: string;
  amount: number;
  description?: string;
  status: string;
  supplier_id: string;
  requested_date: string;
  project_id?: string;
}

export interface ParsedInvoice {
  id: string;
  invoice_number: string;
  supplier_info: string;
  total_amount: number;
  issue_date: string;
  due_date: string;
  status: string;
  created_at: string;
}

// Auth hooks
export function useSupplierAuthHex() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: email.split('@')[0],
          },
        },
      });
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur d'inscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-auth'] });
      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté avec succès.",
      });
    },
  });

  return {
    loginMutation: loginMutation.mutate,
    signUpMutation: signUpMutation.mutate,
    logoutMutation: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}

// Profile hooks
export function useSupplierProfileHex(userId?: string | null) {
  return useQuery({
    queryKey: ['supplier-profile', userId],
    queryFn: async (): Promise<Supplier | null> => {
      if (!userId) return null;

      // First try to find by user_id
      let { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      
      // If no profile found by user_id, try to find by email
      if (!data) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { data: emailData, error: emailError } = await supabase
            .from('suppliers')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();
          
          if (emailError) throw emailError;
          
          if (emailData) {
            // Link existing supplier to this user
            const { error: updateError } = await supabase
              .from('suppliers')
              .update({ user_id: userId })
              .eq('id', emailData.id);
            
            if (updateError) throw updateError;
            
            return emailData;
          }
        }
      }
      
      return data || null;
    },
    enabled: !!userId,
  });
}

// Documents hooks
export function useSupplierDocumentsHex(userId?: string | null, supplierId?: string | null, supplierName?: string | null) {
  return useQuery({
    queryKey: ['supplier-documents', userId, supplierId],
    queryFn: async (): Promise<SupplierDocument[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useSupplierSharedDocumentsHex(supplierId?: string | null) {
  return useQuery({
    queryKey: ['supplier-shared-documents', supplierId],
    queryFn: async (): Promise<SupplierDocument[]> => {
      if (!supplierId) return [];

      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          document:documents(*)
        `)
        .eq('document_type', 'supplier_info')
        .eq('is_shared_with_suppliers', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!supplierId,
  });
}

// Tasks hooks
export function useSupplierTasksHex(userId?: string | null, supplierId?: string | null) {
  return useQuery({
    queryKey: ['supplier-tasks', userId, supplierId],
    queryFn: async (): Promise<SupplierTask[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

// Notifications hooks
export function useSupplierNotificationsHex(supplierId?: string | null) {
  return useQuery({
    queryKey: ['supplier-notifications', supplierId],
    queryFn: async (): Promise<SupplierNotification[]> => {
      if (!supplierId) return [];

      const { data, error } = await supabase
        .from('supplier_notifications')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('sent_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!supplierId,
  });
}

// Payment requests hooks
export function useSupplierPaymentRequestsHex(supplierId?: string | null) {
  return useQuery({
    queryKey: ['supplier-payment-requests', supplierId],
    queryFn: async (): Promise<PaymentRequest[]> => {
      if (!supplierId) return [];

      const { data, error } = await supabase
        .from('supplier_payment_requests')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('requested_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!supplierId,
  });
}

// Invoices hooks
export function useSupplierParsedInvoicesHex(supplierName?: string | null) {
  return useQuery({
    queryKey: ['supplier-parsed-invoices', supplierName],
    queryFn: async (): Promise<ParsedInvoice[]> => {
      if (!supplierName) return [];

      const { data, error } = await supabase
        .from('parsed_invoices')
        .select('*')
        .or(`supplier_info.ilike.%${supplierName}%,supplier_info.ilike.%${supplierName}%`)
        .order('issue_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!supplierName,
  });
}

// Document upload mutation
export function useUploadSupplierDocumentHex() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      file, 
      title, 
      description, 
      documentType,
      userId,
      supplierId 
    }: {
      file: File;
      title: string;
      description?: string;
      documentType: string;
      userId: string;
      supplierId?: string;
    }) => {
      const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
      const filePath = `supplier-documents/${userId}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('supplier-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('supplier-documents')
        .getPublicUrl(filePath);

      // Save document record
      const { error } = await supabase
        .from('documents')
        .insert({
          title,
          description,
          file_name: file.name,
          file_url: publicUrl,
          document_type: documentType,
          uploaded_by: userId,
          metadata: supplierId ? { supplier_id: supplierId } : null,
        });

      if (error) throw error;
      return { success: true, url: publicUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-documents'] });
      toast({
        title: "Document uploadé",
        description: "Le document a été uploadé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur d'upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Task comment mutation
export function useAddTaskCommentHex() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, comment }: { taskId: string; comment: string }) => {
      // Get existing task
      const { data: existingTask } = await supabase
        .from('task_assignments')
        .select('notes')
        .eq('id', taskId)
        .single();

      const existingNotes = existingTask?.notes || '';
      const newNote = existingNotes ? `${existingNotes}\n\n${comment}` : comment;

      // Update task with new comment
      const { error } = await supabase
        .from('task_assignments')
        .update({ notes: newNote })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-tasks'] });
      toast({
        title: "Commentaire ajouté",
        description: "Le commentaire a été ajouté avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Task completion mutation
export function useMarkTaskCompletedHex() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, projectManagerId }: { taskId: string; projectManagerId: string }) => {
      // Update task status
      const { error: updateError } = await supabase
        .from('task_assignments')
        .update({ 
          status: 'completed',
          completion_date: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      // Get task details for notification
      const { data: task } = await supabase
        .from('task_assignments')
        .select('title, assigned_by')
        .eq('id', taskId)
        .single();

      // Create notification for project manager
      await supabase
        .from('notifications')
        .insert({
          recipient_id: projectManagerId,
          title: "Tâche complétée",
          message: `La tâche "${task?.title}" a été marquée comme complétée par le fournisseur.`,
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-tasks'] });
      toast({
        title: "Tâche complétée",
        description: "La tâche a été marquée comme complétée.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
