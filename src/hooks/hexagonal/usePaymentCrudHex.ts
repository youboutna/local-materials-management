/**
 * Hexagonal hooks for Payment CRUD operations
 * Compatible avec le formulaire unifié et le référentiel des origines
 * Utilise les services applicatifs (src/application/services/)
 * ✅ Version corrigée : utilise useQuery pour une synchronisation automatique
 */

import { PaymentService, getPaymentService } from '@/application/services/PaymentService';
import { StorageService } from '@/application/services/StorageService';
import {
  CreatePaymentDTO,
  PaymentDTO,
  UpdatePaymentDTO,
} from '@/dtos/entities/PaymentDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import {
  PAYMENT_ORIGINS,
  PAYMENT_STATUSES,
  getInitialStatusForOrigin,
  getDefaultPaymentMethod,
  PaymentOrigin,
} from '@/config/referentials/payment-origin.referential';
import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export type Payment = PaymentDTO;
export type PaymentFormData = CreatePaymentDTO;

export function usePaymentCrud() {
  const queryClient = useQueryClient();

  const paymentService = useMemo(() => getPaymentService(), []);
  const storageService = useMemo(
    () => new StorageService(RepositoryFactory.getStorageRepository()),
    [],
  );

  const {
    data: payments = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentService.getAllPayments(),
    staleTime: 5 * 60 * 1000,
  });

  const validatePayment = useCallback(
    async (projectId: string, contractorId: string): Promise<boolean> => {
      try {
        const { getPaymentBlockingService } = await import('@/application/services/PaymentBlockingService');
        const service = getPaymentBlockingService();
        const result = await service.validatePaymentEligibility(projectId);
        return result.canProceed;
      } catch (error) {
        console.error('Error validating payment:', error);
        return true;
      }
    },
    [],
  );

  const createPayment = useCallback(
    async (formData: CreatePaymentDTO, origin: PaymentOrigin = 'manual'): Promise<PaymentDTO> => {
      const initialStatus = getInitialStatusForOrigin(origin);
      const paymentData = {
        ...formData,
        status: initialStatus,
        origin: origin,
        paymentMethod: formData.paymentMethod || getDefaultPaymentMethod(),
      };

      try {
        const created = await paymentService.createPayment(paymentData);
        await queryClient.invalidateQueries({ queryKey: ['payments'] });
        await queryClient.invalidateQueries({ queryKey: ['associated-payments'] });
        await refetch();
        return created;
      } catch (error) {
        console.error('Error creating payment:', error);
        throw error;
      }
    },
    [paymentService, queryClient, refetch],
  );

  const updatePayment = useCallback(
    async (paymentId: string, formData: UpdatePaymentDTO): Promise<void> => {
      try {
        await paymentService.updatePayment(paymentId, formData);
        await queryClient.invalidateQueries({ queryKey: ['payments'] });
        await queryClient.invalidateQueries({ queryKey: ['associated-payments'] });
        await refetch();
      } catch (error) {
        console.error('Error updating payment:', error);
        throw error;
      }
    },
    [paymentService, queryClient, refetch],
  );

  const deletePayment = useCallback(
    async (paymentId: string): Promise<void> => {
      try {
        await paymentService.deletePayment(paymentId);
        await queryClient.invalidateQueries({ queryKey: ['payments'] });
        await queryClient.invalidateQueries({ queryKey: ['associated-payments'] });
        await refetch();
      } catch (error) {
        console.error('Error deleting payment:', error);
        throw error;
      }
    },
    [paymentService, queryClient, refetch],
  );

  const uploadReceipt = useCallback(
    async (file: File): Promise<string> => {
      const fileName = `receipt_${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `payments/receipts/${fileName}`;
      const result = await storageService.uploadFile({
        bucket: 'documents',
        path: filePath,
        file,
      });
      return result.publicUrl;
    },
    [storageService],
  );

  const uploadInvoice = useCallback(
    async (file: File): Promise<string> => {
      const fileName = `invoice_${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `payments/invoices/${fileName}`;
      const result = await storageService.uploadFile({
        bucket: 'documents',
        path: filePath,
        file,
      });
      return result.publicUrl;
    },
    [storageService],
  );

  const uploadSupportingDocument = useCallback(
    async (file: File): Promise<string> => {
      const fileName = `support_${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `payments/supporting/${fileName}`;
      const result = await storageService.uploadFile({
        bucket: 'documents',
        path: filePath,
        file,
      });
      return result.publicUrl;
    },
    [storageService],
  );

  const getPaymentsByOrigin = useCallback(
    (origin: PaymentOrigin): PaymentDTO[] => payments.filter((p) => p.origin === origin),
    [payments],
  );

  const getPaymentsByStatus = useCallback(
    (status: string): PaymentDTO[] => payments.filter((p) => p.status === status),
    [payments],
  );

  const getPendingPayments = useCallback((): PaymentDTO[] => {
    return payments.filter((p) => p.status === 'pending' || p.status === 'requested');
  }, [payments]);

  const reset = useCallback(() => { refetch(); }, [refetch]);

  return {
    payments,
    loading,
    error,
    refetch,
    fetchPayments: refetch,
    validatePayment,
    createPayment,
    updatePayment,
    deletePayment,
    uploadReceipt,
    uploadInvoice,
    uploadSupportingDocument,
    getPaymentsByOrigin,
    getPaymentsByStatus,
    getPendingPayments,
    reset,
  };
}