/**
 * Payments Hook - Enhanced with PaymentDomainTransformer Integration
 * Uses PaymentDomainTransformer with advanced calculations and analytics
 * Following hexagonal architecture principles with UI-specific enhancements
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { PaymentRequestService } from "@/application/services/PaymentRequestService";
import { PaymentDomainTransformer, CreatePaymentRequestDto, UpdatePaymentRequestDto } from "@/dtos/transforms";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

// Types compatibles avec le service
type ServiceCreatePaymentDTO = Omit<CreatePaymentRequestDto, 'status'> & { status?: any };
type ServiceUpdatePaymentDTO = Omit<UpdatePaymentRequestDto, 'status'> & { status?: any };

// Enhanced types for UI components
export interface UsePaymentsHexResult {
  payments: any[];
  isLoading: boolean;
  error: any;
  refetch: () => void;
  createPayment: (data: CreatePaymentRequestDto) => void;
  updatePayment: ({ id, data }: { id: string; data: UpdatePaymentRequestDto }) => void;
  deletePayment: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  // Enhanced UI features
  getPaymentRisk: (payment: any) => 'low' | 'medium' | 'high';
  getPaymentEfficiency: (payment: any) => number;
  getPaymentFinancialHealth: (payment: any) => 'healthy' | 'warning' | 'critical';
  getPaymentDaysOverdue: (payment: any) => number;
  getPaymentAnalytics: () => any;
  validatePaymentWithReferential: (payment: any, referentialType: string) => Promise<any>;
  generatePaymentReport: (payment: any) => any;
}

/**
 * Enhanced hook for payments management with UI-specific features
 */
export function usePaymentsHex(): UsePaymentsHexResult {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Initialize services with transformers
  const paymentRepository = RepositoryFactory.getPaymentRepository();
  const paymentService = new PaymentService(paymentRepository, PaymentDomainTransformer);

  // Query for payments list
  const {
    data: payments = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['payments'],
    queryFn: async (): Promise<any[]> => {
      try {
        const paymentData = await paymentService.getAllPayments();
        return paymentData;
      } catch (err) {
        console.error('Error fetching payments:', err);
        throw err;
      }
    },
    retry: 3,
    retryDelay: 1000,
    enabled: true
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: CreatePaymentRequestDto) => {
      try {
        // Convert to service-compatible format
        const serviceData: ServiceCreatePaymentDTO = { ...paymentData };
        const createdPayment = await paymentService.createPayment(serviceData as any);
        return createdPayment;
      } catch (error) {
        console.error('Error creating payment:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(`Le paiement "${data.reference}" a été créé avec succès.`);
      navigate('/payments');
    },
    onError: (error) => {
      console.error('Error creating payment:', error);
      toast.error("Impossible de créer le paiement. Veuillez réessayer.");
    }
  });

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePaymentRequestDto }) => {
      try {
        // Convert to service-compatible format
        const serviceData: ServiceUpdatePaymentDTO = { ...data };
        const updatedPayment = await paymentService.updatePayment(id, serviceData as any);
        return updatedPayment;
      } catch (error) {
        console.error('Error updating payment:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(`Le paiement "${data.reference}" a été mis à jour avec succès.`);
    },
    onError: (error) => {
      console.error('Error updating payment:', error);
      toast.error("Impossible de mettre à jour le paiement. Veuillez réessayer.");
    }
  });

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await paymentService.deletePayment(id);
        return true;
      } catch (error) {
        console.error('Error deleting payment:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success("Le paiement a été supprimé avec succès.");
    },
    onError: (error) => {
      console.error('Error deleting payment:', error);
      toast.error("Impossible de supprimer le paiement.");
    }
  });

  // Enhanced UI functions
  const getPaymentRisk = (payment: any): 'low' | 'medium' | 'high' => {
    const daysOverdue = getPaymentDaysOverdue(payment);
    const amount = payment.amount || 0;
    const status = payment.status || 'pending';
    
    if (daysOverdue > 30 || amount > 100000 || status === 'overdue') return 'high';
    if (daysOverdue > 7 || amount > 50000 || status === 'delayed') return 'medium';
    return 'low';
  };

  const getPaymentEfficiency = (payment: any): number => {
    const paidOnTime = payment.paidOnTime || false;
    const processingDays = payment.processingDays || 0;
    const amount = payment.amount || 0;
    const expectedDays = payment.expectedDays || 5;
    
    // Score based on timeliness and processing efficiency
    const timelinessScore = paidOnTime ? 100 : Math.max(0, 100 - processingDays * 5);
    const efficiencyScore = expectedDays > 0 ? Math.max(0, 100 - (processingDays / expectedDays) * 50) : 100;
    const amountScore = amount > 0 ? Math.min(100, 100000 / amount * 10) : 100;
    
    return Math.round((timelinessScore * 0.5 + efficiencyScore * 0.3 + amountScore * 0.2));
  };

  const getPaymentFinancialHealth = (payment: any): 'healthy' | 'warning' | 'critical' => {
    const efficiency = getPaymentEfficiency(payment);
    const risk = getPaymentRisk(payment);
    const daysOverdue = getPaymentDaysOverdue(payment);
    const cashFlowImpact = payment.cashFlowImpact || 0;
    
    if (efficiency >= 80 && risk === 'low' && daysOverdue <= 0 && cashFlowImpact >= 0) return 'healthy';
    if (efficiency >= 60 && risk !== 'high' && daysOverdue <= 7) return 'warning';
    return 'critical';
  };

  const getPaymentDaysOverdue = (payment: any): number => {
    const dueDate = payment.dueDate ? new Date(payment.dueDate) : null;
    const paidDate = payment.paidDate ? new Date(payment.paidDate) : null;
    const now = new Date();
    
    if (!dueDate) return 0;
    if (paidDate && paidDate <= dueDate) return 0; // Paid on time
    
    const referenceDate = paidDate || now;
    return Math.floor((referenceDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getPaymentAnalytics = () => {
    const totalPayments = payments.length;
    const paidPayments = payments.filter(p => p.status === 'paid').length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const overduePayments = payments.filter(p => getPaymentDaysOverdue(p) > 0).length;
    const highRiskPayments = payments.filter(p => getPaymentRisk(p) === 'high').length;
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const averageEfficiency = payments.length > 0 
      ? payments.reduce((sum, p) => sum + getPaymentEfficiency(p), 0) / payments.length 
      : 0;
    const healthyPayments = payments.filter(p => getPaymentFinancialHealth(p) === 'healthy').length;
    
    return {
      totalPayments,
      statusBreakdown: {
        paid: paidPayments,
        pending: pendingPayments,
        overdue: overduePayments
      },
      riskBreakdown: {
        low: payments.filter(p => getPaymentRisk(p) === 'low').length,
        medium: payments.filter(p => getPaymentRisk(p) === 'medium').length,
        high: highRiskPayments
      },
      healthBreakdown: {
        healthy: healthyPayments,
        warning: payments.filter(p => getPaymentFinancialHealth(p) === 'warning').length,
        critical: payments.filter(p => getPaymentFinancialHealth(p) === 'critical').length
      },
      totalAmount,
      averageEfficiency: Math.round(averageEfficiency),
      paymentRate: totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 0
    };
  };

  return {
    payments,
    isLoading,
    error,
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
    validatePaymentWithReferential: async (payment: any, referentialType: string) => {
      // TODO: Implement referential validation
      return { isValid: true, errors: [] };
    },
    riskBreakdown: {
      low: payments.filter(p => getPaymentRisk(p) === 'low').length,
      medium: payments.filter(p => getPaymentRisk(p) === 'medium').length,
      high: payments.filter(p => getPaymentRisk(p) === 'high').length
    return {
    payments,
    isLoading,
    error,
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
    validatePaymentWithReferential: async (payment: any, referentialType: string) => {
      // TODO: Implement referential validation
      return { isValid: true, errors: [] };
    },
    generatePaymentReport: (payment: any) => {
      // TODO: Implement report generation
      return { payment, generatedAt: new Date().toISOString() };
    }
  };
}

export default usePaymentsHex;
      if (!escalationLevel) return [];
      const { data, error } = await supabase.rpc('get_escalation_targets', {
        project_id_param: projectId,
        escalation_level_param: escalationLevel
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId && !!escalationLevel
  });
}
