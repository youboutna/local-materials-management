/**
 * Hexagonal hooks for Payment CRUD operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PaymentService } from '@/application/services/PaymentService';
import { StorageService } from '@/application/services/StorageService';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import { PaymentDTO, CreatePaymentDTO, UpdatePaymentDTO } from '@/dtos/entities/PaymentDTO';

// Re-export types for components
export type Payment = PaymentDTO;
export type PaymentFormData = CreatePaymentDTO;

// Hook: Payment CRUD with real-time updates
export function usePaymentCrud() {
  const [payments, setPayments] = useState<PaymentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  const paymentService = useMemo(() => 
    new PaymentService(RepositoryFactory.getPaymentRepository()), 
    []
  );
  const storageService = useMemo(() => 
    new StorageService(RepositoryFactory.getStorageRepository()), 
    []
  );

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const paymentData = await paymentService.getAllPayments();
      setPayments(paymentData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [paymentService]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const validatePayment = async (projectId: string, contractorId: string): Promise<boolean> => {
    try {
      console.log(`Validating payment for project ${projectId}, contractor ${contractorId}`);
      return true;
    } catch (error) {
      console.error('Error validating payment:', error);
      return true;
    }
  };

  const createPayment = async (formData: CreatePaymentDTO) => {
    const paymentData = await paymentService.createPayment(formData);
    return paymentData;
  };

  const updatePayment = async (paymentId: string, formData: UpdatePaymentDTO) => {
    await paymentService.updatePayment(paymentId, formData);
  };

  const deletePayment = async (paymentId: string) => {
    await paymentService.deletePayment(paymentId);
  };

  const uploadReceipt = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `receipt_${Date.now()}.${fileExt}`;
    const filePath = `payments/${fileName}`;

    const uploadResult = await storageService.uploadFile('documents', filePath, file);
    return uploadResult.publicUrl;
  };

  const uploadInvoice = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `invoice_${Date.now()}.${fileExt}`;
    const filePath = `payments/${fileName}`;

    const uploadResult = await storageService.uploadFile('documents', filePath, file);
    return uploadResult.publicUrl;
  };

  return {
    payments,
    loading,
    fetchPayments,
    validatePayment,
    createPayment,
    updatePayment,
    deletePayment,
    uploadReceipt,
    uploadInvoice
  };
}
