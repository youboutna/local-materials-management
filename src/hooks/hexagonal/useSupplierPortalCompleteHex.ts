/**
 * Complete hexagonal hook for Supplier Portal
 * Centralizes all supplier portal operations via services
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/application/services/AuthService';
import { SupplierService } from '@/application/services/SupplierService';
import { StorageService } from '@/application/services/StorageService';
import { DocumentService } from '@/application/services/DocumentService';
import { NotificationService } from '@/application/services/NotificationService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

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
  metadata?: Record<string, unknown>;
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
      const authService = new AuthService(RepositoryFactory.getAuthRepository());
      await authService.login({ email: email.trim(), password });
      return { success: true };
    },
    onSuccess: () => {
      toast({ title: "Connexion réussie", description: "Vous êtes maintenant connecté." });
    },
    onError: (error: any) => {
      toast({ title: "Erreur de connexion", description: error.message, variant: "destructive" });
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const authService = new AuthService(RepositoryFactory.getAuthRepository());
      await authService.register({ email: email.trim(), password, full_name: email.split('@')[0] } as any);
      return { success: true };
    },
    onSuccess: () => {
      toast({ title: "Inscription réussie", description: "Votre compte a été créé avec succès." });
    },
    onError: (error: any) => {
      toast({ title: "Erreur d'inscription", description: error.message, variant: "destructive" });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const authService = new AuthService(RepositoryFactory.getAuthRepository());
      await authService.logout();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-auth'] });
      toast({ title: "Déconnexion", description: "Vous avez été déconnecté avec succès." });
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
      const supplierService = new SupplierService(RepositoryFactory.getSupplierRepository());
      // Search for supplier linked to this user
      const result = await supplierService.searchSuppliers({ searchTerm: userId, limit: 1 });
      if (result.suppliers.length > 0) {
        const s = result.suppliers[0];
        return { id: s.id, name: s.name, category: s.category, is_active: s.isActive, created_at: '', updated_at: '' } as Supplier;
      }
      return null;
    },
    enabled: !!userId,
  });
}

// Documents hooks
export function useSupplierDocumentsHex(userId?: string | null) {
  return useQuery({
    queryKey: ['supplier-documents', userId],
    queryFn: async (): Promise<SupplierDocument[]> => {
      if (!userId) return [];
      const documentService = new DocumentService();
      const docs = await documentService.getAllDocuments();
      return (docs || []).filter((d: any) => d.uploadedBy === userId) as unknown as SupplierDocument[];
    },
    enabled: !!userId,
  });
}

export function useSupplierSharedDocumentsHex(supplierId?: string | null) {
  return useQuery({
    queryKey: ['supplier-shared-documents', supplierId],
    queryFn: async (): Promise<SupplierDocument[]> => {
      if (!supplierId) return [];
      const docRepo = RepositoryFactory.getDocumentRepository();
      const data = await docRepo.findSharedWithSuppliers();
      return (data || []) as unknown as SupplierDocument[];
    },
    enabled: !!supplierId,
  });
}

// Tasks hooks
export function useSupplierTasksHex(userId?: string | null) {
  return useQuery({
    queryKey: ['supplier-tasks', userId],
    queryFn: async (): Promise<SupplierTask[]> => {
      if (!userId) return [];
      const taskRepo = RepositoryFactory.getTaskAssignmentRepository();
      const data = await taskRepo.findByAssignedTo(userId);
      return (data || []) as unknown as SupplierTask[];
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
      const notifService = new NotificationService();
      const data = await notifService.getUserNotifications(supplierId);
      return (data || []) as unknown as SupplierNotification[];
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
      // Use payment repository findAll and filter
      const paymentRepo = RepositoryFactory.getPaymentRepository();
      const allPayments = await paymentRepo.findAll();
      return (allPayments || []).filter((p: any) => p.supplierId === supplierId) as unknown as PaymentRequest[];
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
      const invoiceRepo = RepositoryFactory.getParsedInvoiceRepository();
      const data = await invoiceRepo.findBySupplierId(supplierName);
      return (data || []) as unknown as ParsedInvoice[];
    },
    enabled: !!supplierName,
  });
}

// Document upload mutation
export function useUploadSupplierDocumentHex() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ file, title, description, documentType, userId, supplierId }: {
      file: File; title: string; description?: string; documentType: string; userId: string; supplierId?: string;
    }) => {
      const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
      const filePath = `supplier-documents/${userId}/${fileName}`;

      const storageService = new StorageService();
      await storageService.uploadFile({ bucket: 'supplier-documents', path: filePath, file });

      const publicUrl = storageService.getPublicUrl({ bucket: 'supplier-documents', path: filePath });

      const documentService = new DocumentService();
      await documentService.createDocument({
        title,
        description: description || '',
        fileName: file.name,
        fileUrl: publicUrl,
        documentType: documentType as any,
        uploadedBy: userId,
      } as any);
      return { success: true, url: publicUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-documents'] });
      toast({ title: "Document uploadé", description: "Le document a été uploadé avec succès." });
    },
    onError: (error: any) => {
      toast({ title: "Erreur d'upload", description: error.message, variant: "destructive" });
    },
  });
}

// Task comment mutation
export function useAddTaskCommentHex() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, comment }: { taskId: string; comment: string }) => {
      const taskRepo = RepositoryFactory.getTaskAssignmentRepository();
      const existingTask = await taskRepo.findById(taskId);
      const existingNotes = (existingTask as any)?.notes || '';
      const newNote = existingNotes ? `${existingNotes}\n\n${comment}` : comment;
      await taskRepo.update(taskId, { notes: newNote } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-tasks'] });
      toast({ title: "Commentaire ajouté", description: "Le commentaire a été ajouté avec succès." });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });
}

// Task completion mutation
export function useMarkTaskCompletedHex() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, projectManagerId }: { taskId: string; projectManagerId: string }) => {
      const taskRepo = RepositoryFactory.getTaskAssignmentRepository();
      await taskRepo.update(taskId, {
        status: 'completed',
        completion_date: new Date().toISOString(),
      } as any);

      const task = await taskRepo.findById(taskId);

      const notifService = new NotificationService();
      await notifService.createNotification({
        recipient_id: projectManagerId,
        title: "Tâche complétée",
        message: `La tâche "${(task as any)?.title}" a été marquée comme complétée par le fournisseur.`,
        type: 'info',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-tasks'] });
      toast({ title: "Tâche complétée", description: "La tâche a été marquée comme complétée." });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });
}