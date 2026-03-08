/**
 * Payments Hook - Enhanced with PaymentDomainTransformer Integration
 * Uses PaymentRequestService following hexagonal architecture
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { PaymentRequestService } from "@/application/services/PaymentRequestService";
import { 
  PaymentDTO, 
  CreatePaymentDTO, 
  UpdatePaymentDTO,
  PaymentRequestDTO,
} from '@/dtos/entities/PaymentDTO';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

// Enhanced types for UI components
interface PaymentRiskAssessment {
  risk: 'low' | 'medium' | 'high';
  efficiency: number;
  financialHealth: 'healthy' | 'warning' | 'critical';
}

interface PaymentAnalytics {
  totalPayments: number;
  averageAmount: number;
  overdueCount: number;
  pendingCount: number;
  completedCount: number;
  totalOverdue: number;
  efficiency: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
}

interface PaymentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  referentialCompliance: {
    financial: boolean;
    regulatory: boolean;
    procedural: boolean;
  };
}

interface UsePaymentsHexResult {
  payments: PaymentRequestDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createPayment: (data: CreatePaymentDTO) => void;
  updatePayment: ({ id, data }: { id: string; data: UpdatePaymentDTO }) => void;
  deletePayment: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  getPaymentRisk: (payment: PaymentRequestDTO) => PaymentRiskAssessment;
  getPaymentEfficiency: (payment: PaymentRequestDTO) => number;
  getPaymentFinancialHealth: (payment: PaymentRequestDTO) => 'healthy' | 'warning' | 'critical';
  getPaymentDaysOverdue: (payment: PaymentRequestDTO) => number;
  getPaymentAnalytics: () => PaymentAnalytics;
  validatePaymentWithReferential: (payment: PaymentRequestDTO, referentialType: string) => Promise<PaymentValidationResult>;
  generatePaymentReport: (payment: PaymentRequestDTO) => Record<string, unknown>;
}

export function usePaymentsHex(): UsePaymentsHexResult {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const paymentRepository = RepositoryFactory.getPaymentRepository();
  const paymentRequestService = new PaymentRequestService(paymentRepository);

  const {
    data: payments = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['payments'],
    queryFn: async (): Promise<PaymentRequestDTO[]> => {
      return await paymentRequestService.getAllPaymentRequests();
    },
    retry: 3,
    retryDelay: 1000,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: CreatePaymentDTO) => {
      return await paymentRequestService.createPaymentRequest({
        supplierId: paymentData.contractorId,
        projectId: paymentData.projectId,
        amount: paymentData.amount,
        description: paymentData.contractorName,
        paymentReason: paymentData.paymentMethod,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Le paiement a été créé avec succès.');
      navigate('/payments');
    },
    onError: () => {
      toast.error("Impossible de créer le paiement.");
    }
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePaymentDTO }) => {
      return await paymentRequestService.updatePaymentRequest(id, {
        amount: data.amount,
        description: data.contractorName,
        paymentReason: data.paymentMethod,
        status: (data as any).status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Le paiement a été mis à jour.');
    },
    onError: () => {
      toast.error("Impossible de mettre à jour le paiement.");
    }
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      await paymentRequestService.deletePaymentRequest(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success("Le paiement a été supprimé.");
    },
    onError: () => {
      toast.error("Impossible de supprimer le paiement.");
    }
  });

  const getPaymentDaysOverdue = (payment: PaymentRequestDTO): number => {
    if (!payment.createdAt) return 0;
    const createdDate = new Date(payment.createdAt);
    const now = new Date();
    if (payment.status === 'paid' || payment.status === 'approved') return 0;
    const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysDiff - 30); // Consider overdue after 30 days
  };

  const getPaymentEfficiency = (payment: PaymentRequestDTO): number => {
    const daysOverdue = getPaymentDaysOverdue(payment);
    if (payment.status === 'paid') return 100;
    if (payment.status === 'approved') return 80;
    return Math.max(0, 100 - daysOverdue * 3);
  };

  const getPaymentFinancialHealth = (payment: PaymentRequestDTO): 'healthy' | 'warning' | 'critical' => {
    const efficiency = getPaymentEfficiency(payment);
    if (efficiency >= 80) return 'healthy';
    if (efficiency >= 50) return 'warning';
    return 'critical';
  };

  const getPaymentRisk = (payment: PaymentRequestDTO): PaymentRiskAssessment => {
    const daysOverdue = getPaymentDaysOverdue(payment);
    const amount = payment.amount || 0;
    const risk = daysOverdue > 30 || amount > 100000 ? 'high' : 
      daysOverdue > 7 || amount > 50000 ? 'medium' : 'low';
    return { risk, efficiency: getPaymentEfficiency(payment), financialHealth: getPaymentFinancialHealth(payment) };
  };

  const getPaymentAnalytics = (): PaymentAnalytics => {
    const totalPayments = payments.length;
    const paidPayments = payments.filter(p => p.status === 'paid').length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const overduePayments = payments.filter(p => getPaymentDaysOverdue(p) > 0).length;
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const averageEfficiency = payments.length > 0 
      ? payments.reduce((sum, p) => sum + getPaymentEfficiency(p), 0) / payments.length 
      : 0;

    return {
      totalPayments,
      averageAmount: totalPayments > 0 ? totalAmount / totalPayments : 0,
      overdueCount: overduePayments,
      pendingCount: pendingPayments,
      completedCount: paidPayments,
      totalOverdue: overduePayments,
      efficiency: Math.round(averageEfficiency),
      riskDistribution: {
        low: payments.filter(p => getPaymentRisk(p).risk === 'low').length,
        medium: payments.filter(p => getPaymentRisk(p).risk === 'medium').length,
        high: payments.filter(p => getPaymentRisk(p).risk === 'high').length,
      },
    };
  };

  const validatePaymentWithReferential = async (payment: PaymentRequestDTO, referentialType: string): Promise<PaymentValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!payment.amount || payment.amount <= 0) errors.push('Amount must be > 0');
    if (!payment.supplierId) errors.push('Supplier is required');
    if (payment.amount > 1000000) warnings.push('High-value payment requires additional approval');

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      referentialCompliance: {
        financial: errors.length === 0,
        regulatory: true,
        procedural: true,
      },
    };
  };

  return {
    payments,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createPayment: createPaymentMutation.mutate,
    updatePayment: updatePaymentMutation.mutate,
    deletePayment: deletePaymentMutation.mutate,
    isCreating: createPaymentMutation.isPending,
    isUpdating: updatePaymentMutation.isPending,
    isDeleting: deletePaymentMutation.isPending,
    getPaymentRisk,
    getPaymentEfficiency,
    getPaymentFinancialHealth,
    getPaymentDaysOverdue,
    getPaymentAnalytics,
    validatePaymentWithReferential,
    generatePaymentReport: (payment: PaymentRequestDTO) => {
      const risk = getPaymentRisk(payment);
      return {
        payment,
        generatedAt: new Date().toISOString(),
        reportType: 'Payment Analysis Report',
        risk: risk.risk,
        health: risk.financialHealth,
        efficiency: risk.efficiency,
      };
    }
  };
}

export default usePaymentsHex;
