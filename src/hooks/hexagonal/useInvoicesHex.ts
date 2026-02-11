/**
 * Hexagonal hook for invoice operations
 * Follows hexagonal architecture: UI → Hook → Service → Repository
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InvoiceDTO, CreateInvoiceDTO, UpdateInvoiceDTO, ParsedInvoiceDTO, InvoiceStatisticsDTO } from '@/dtos/entities/InvoiceDTO';
import { InvoiceService } from '@/application/services/InvoiceService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { useToast } from '@/hooks/use-toast';

export interface UseInvoicesResult {
  invoices: InvoiceDTO[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseParsedInvoicesResult {
  invoices: ParsedInvoiceDTO[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseInvoiceStatisticsResult {
  statistics: InvoiceStatisticsDTO | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseInvoiceMutationsResult {
  createInvoice: (invoiceData: CreateInvoiceDTO) => Promise<InvoiceDTO>;
  updateInvoice: (id: string, updateData: UpdateInvoiceDTO) => Promise<InvoiceDTO>;
  deleteInvoice: (id: string) => Promise<boolean>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: Error | null;
}

/**
 * Hook for fetching all invoices
 */
export function useInvoicesHex(): UseInvoicesResult {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Initialize service with RepositoryFactory
  const service = new InvoiceService(RepositoryFactory.getInvoiceRepository());

  const result = useQuery({
    queryKey: ['invoices'],
    queryFn: () => service.getInvoicesByStatus(''), // Empty status gets all invoices
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Handle errors with toast notifications
  if (result.error) {
    toast({
      title: 'Erreur de chargement',
      description: 'Impossible de charger les factures',
      variant: 'destructive',
    });
  }

  return {
    invoices: result.data || [],
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Hook for fetching parsed invoices for a supplier
 * Replaces direct supabase.from("parsed_invoices") calls
 */
export function useParsedInvoicesHex(supplierId: string): UseParsedInvoicesResult {
  const { toast } = useToast();
  const service = new InvoiceService(RepositoryFactory.getInvoiceRepository());

  const result = useQuery({
    queryKey: ['parsed-invoices', supplierId],
    queryFn: () => service.getParsedInvoices(supplierId),
    enabled: !!supplierId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (result.error) {
    toast({
      title: 'Erreur de chargement',
      description: 'Impossible de charger les factures analysées',
      variant: 'destructive',
    });
  }

  return {
    invoices: result.data || [],
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Hook for invoice statistics
 */
export function useInvoiceStatisticsHex(supplierId?: string): UseInvoiceStatisticsResult {
  const { toast } = useToast();
  const service = new InvoiceService(RepositoryFactory.getInvoiceRepository());

  const result = useQuery({
    queryKey: ['invoice-statistics', supplierId],
    queryFn: () => service.getInvoiceStatistics(supplierId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  if (result.error) {
    toast({
      title: 'Erreur de statistiques',
      description: 'Impossible de calculer les statistiques de factures',
      variant: 'destructive',
    });
  }

  return {
    statistics: result.data || null,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Hook for invoice mutations (create, update, delete)
 */
export function useInvoiceMutationsHex(): UseInvoiceMutationsResult {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const service = new InvoiceService(RepositoryFactory.getInvoiceRepository());

  // Create invoice mutation
  const createMutation = useMutation({
    mutationFn: (invoiceData: CreateInvoiceDTO) => service.createInvoice(invoiceData),
    onSuccess: (newInvoice) => {
      toast({
        title: 'Facture créée',
        description: `La facture ${newInvoice.invoiceNumber} a été créée avec succès`,
      });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-statistics'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de création',
        description: error instanceof Error ? error.message : 'Impossible de créer la facture',
        variant: 'destructive',
      });
    },
  });

  // Update invoice mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updateData }: { id: string; updateData: UpdateInvoiceDTO }) =>
      service.updateInvoice(id, updateData),
    onSuccess: (updatedInvoice) => {
      toast({
        title: 'Facture mise à jour',
        description: `La facture ${updatedInvoice.invoiceNumber} a été mise à jour avec succès`,
      });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-statistics'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de mise à jour',
        description: error instanceof Error ? error.message : 'Impossible de mettre à jour la facture',
        variant: 'destructive',
      });
    },
  });

  // Delete invoice mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => service.deleteInvoice(id),
    onSuccess: () => {
      toast({
        title: 'Facture supprimée',
        description: 'La facture a été supprimée avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-statistics'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de suppression',
        description: error instanceof Error ? error.message : 'Impossible de supprimer la facture',
        variant: 'destructive',
      });
    },
  });

  return {
    createInvoice: createMutation.mutateAsync,
    updateInvoice: updateMutation.mutateAsync,
    deleteInvoice: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    error: createMutation.error || updateMutation.error || deleteMutation.error,
  };
}

/**
 * Hook for fetching invoice by ID
 */
export function useInvoiceHex(invoiceId: string) {
  const service = new InvoiceService(RepositoryFactory.getInvoiceRepository());

  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => service.getInvoiceById(invoiceId),
    enabled: !!invoiceId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for invoices by status
 */
export function useInvoicesByStatusHex(status: string): UseInvoicesResult {
  const { toast } = useToast();
  const service = new InvoiceService(RepositoryFactory.getInvoiceRepository());

  const result = useQuery({
    queryKey: ['invoices', 'status', status],
    queryFn: () => service.getInvoicesByStatus(status),
    enabled: !!status,
    staleTime: 5 * 60 * 1000,
  });

  if (result.error) {
    toast({
      title: 'Erreur de chargement',
      description: `Impossible de charger les factures avec le statut ${status}`,
      variant: 'destructive',
    });
  }

  return {
    invoices: result.data || [],
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Hook for invoices by date range
 */
export function useInvoicesByDateRangeHex(startDate: string, endDate: string): UseInvoicesResult {
  const { toast } = useToast();
  const service = new InvoiceService(RepositoryFactory.getInvoiceRepository());

  const result = useQuery({
    queryKey: ['invoices', 'date-range', startDate, endDate],
    queryFn: () => service.getInvoicesByDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
  });

  if (result.error) {
    toast({
      title: 'Erreur de chargement',
      description: 'Impossible de charger les factures pour la période spécifiée',
      variant: 'destructive',
    });
  }

  return {
    invoices: result.data || [],
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}
