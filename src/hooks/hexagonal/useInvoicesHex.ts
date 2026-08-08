/**
 * Hexagonal hook for invoice operations
 * Follows hexagonal architecture: UI → Hook → Service → Repository
 */

import { InvoiceService } from '@/application/services/InvoiceService';
import { CreateInvoiceDTO, InvoiceStatisticsDTO, ParsedInvoiceDTO, UpdateInvoiceDTO } from '@/dtos/entities/InvoiceDTO';
import { useToast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface UseInvoicesResult {
  invoices: ParsedInvoiceDTO[];
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
  createInvoice: (invoiceData: CreateInvoiceDTO) => Promise<ParsedInvoiceDTO>;
  updateInvoice: (id: string, updateData: UpdateInvoiceDTO) => Promise<ParsedInvoiceDTO>;
  deleteInvoice: (id: string) => Promise<void>;
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

  const service = getInvoiceService();

  const result = useQuery({
    queryKey: ['invoices'],
    queryFn: () => service.getParsedInvoicesByStatus('' as any),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

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
 */
export function useParsedInvoicesHex(supplierId: string): UseParsedInvoicesResult {
  const { toast } = useToast();
  const service = getInvoiceService();

  const result = useQuery({
    queryKey: ['parsed-invoices', supplierId],
    queryFn: () => service.getParsedInvoices(supplierId),
    enabled: !!supplierId,
    staleTime: 5 * 60 * 1000,
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
  const service = getInvoiceService();

  const result = useQuery({
    queryKey: ['invoice-statistics', supplierId],
    queryFn: async () => {
      const stats = await service.getParsedInvoiceStatistics(supplierId);
      return stats as InvoiceStatisticsDTO;
    },
    staleTime: 10 * 60 * 1000,
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
  const service = getInvoiceService();

  const createMutation = useMutation({
    mutationFn: async (invoiceData: CreateInvoiceDTO) => {
      return await service.createParsedInvoice(invoiceData as any);
    },
    onSuccess: () => {
      toast({ title: 'Facture créée', description: 'La facture a été créée avec succès' });
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, updateData }: { id: string; updateData: UpdateInvoiceDTO }) => {
      return await service.updateParsedInvoice(id, updateData as any);
    },
    onSuccess: () => {
      toast({ title: 'Facture mise à jour', description: 'La facture a été mise à jour avec succès' });
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await service.deleteParsedInvoice(id);
    },
    onSuccess: () => {
      toast({ title: 'Facture supprimée', description: 'La facture a été supprimée avec succès' });
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
    updateInvoice: async (id: string, updateData: UpdateInvoiceDTO) => updateMutation.mutateAsync({ id, updateData }),
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
  const service = getInvoiceService();

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
  const service = getInvoiceService();

  const result = useQuery({
    queryKey: ['invoices', 'status', status],
    queryFn: () => service.getParsedInvoicesByStatus(status as any),
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
  const service = getInvoiceService();

  const result = useQuery({
    queryKey: ['invoices', 'date-range', startDate, endDate],
    queryFn: () => service.getParsedInvoicesByDateRange(startDate, endDate),
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
