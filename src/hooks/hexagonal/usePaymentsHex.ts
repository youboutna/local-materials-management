/**
 * Payments Hook - Enhanced with PaymentDomainTransformer Integration
 * Uses PaymentDomainTransformer with advanced calculations and analytics
 * Following hexagonal architecture principles with UI-specific enhancements
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { PaymentRequestService } from "@/application/services/PaymentRequestService";
import { CreatePaymentDTO, UpdatePaymentDTO } from '@/dtos/entities/PaymentDTO';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

// Types compatibles avec le service
type ServiceCreatePaymentDTO = Omit<CreatePaymentDTO, 'status'> & { status?: any };
type ServiceUpdatePaymentDTO = Omit<UpdatePaymentDTO, 'status'> & { status?: any };

// Enhanced types for UI components
export interface UsePaymentsHexResult {
  payments: any[];
  isLoading: boolean;
  error: any;
  refetch: () => void;
  createPayment: (data: CreatePaymentDTO) => void;
  updatePayment: ({ id, data }: { id: string; data: UpdatePaymentDTO }) => void;
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
  const paymentRequestService = new PaymentRequestService(paymentRepository);

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
        const paymentData = await paymentRequestService.getAllPaymentRequests();
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
    mutationFn: async (paymentData: CreatePaymentDTO) => {
      try {
        // Convert to service-compatible format
        const serviceData: ServiceCreatePaymentDTO = { ...paymentData };
        const createdPayment = await paymentRequestService.createPaymentRequest(serviceData as any);
        return createdPayment;
      } catch (error) {
        console.error('Error creating payment:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(`Le paiement "${data.id}" a été créé avec succès.`);
      navigate('/payments');
    },
    onError: (error) => {
      console.error('Error creating payment:', error);
      toast.error("Impossible de créer le paiement. Veuillez réessayer.");
    }
  });

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePaymentDTO }) => {
      try {
        // Convert to service-compatible format
        const serviceData: ServiceUpdatePaymentDTO = { ...data };
        const updatedPayment = await paymentRequestService.updatePaymentRequest(id, serviceData as any);
        return updatedPayment;
      } catch (error) {
        console.error('Error updating payment:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(`Le paiement "${data.id}" a été mis à jour avec succès.`);
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
        await paymentRequestService.deletePaymentRequest(id);
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

  // Validation functions for different referential types
  const validateFinancialReferential = (payment: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate amount
    if (!payment.amount || payment.amount <= 0) {
      errors.push('Payment amount must be greater than 0');
    }
    
    // Validate currency
    if (!payment.currency) {
      warnings.push('Currency not specified');
    }
    
    // Validate due date
    if (!payment.dueDate) {
      errors.push('Due date is required');
    } else {
      const dueDate = new Date(payment.dueDate);
      const today = new Date();
      if (dueDate < today) {
        warnings.push('Payment is overdue');
      }
    }
    
    // Validate financial thresholds
    if (payment.amount > 1000000) {
      warnings.push('High-value payment requires additional approval');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'financial'
    };
  };

  const validateRegulatoryReferential = (payment: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate regulatory compliance
    if (!payment.complianceCode) {
      errors.push('Compliance code is required');
    }
    
    // Validate tax information
    if (!payment.taxId && payment.amount > 10000) {
      warnings.push('Tax ID recommended for payments over 10,000');
    }
    
    // Validate regulatory documentation
    if (!payment.documentation || payment.documentation.length === 0) {
      warnings.push('Supporting documentation recommended');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'regulatory'
    };
  };

  const validateContractualReferential = (payment: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate contract reference
    if (!payment.contractId) {
      errors.push('Contract reference is required');
    }
    
    // Validate milestone compliance
    if (!payment.milestoneId && payment.amount > 50000) {
      warnings.push('Milestone reference recommended for payments over 50,000');
    }
    
    // Validate approval workflow
    if (!payment.approvedBy && payment.amount > 25000) {
      errors.push('Manager approval required for payments over 25,000');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'contractual'
    };
  };

  const validateQualityReferential = (payment: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate quality standards
    if (!payment.qualityStandard) {
      warnings.push('Quality standard not specified');
    }
    
    // Validate inspection requirements
    if (!payment.inspectionRequired && payment.amount > 75000) {
      warnings.push('Quality inspection recommended for high-value payments');
    }
    
    // Validate supplier certification
    if (!payment.supplierCertified && payment.amount > 100000) {
      warnings.push('Supplier certification recommended for major payments');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'quality'
    };
  };

  // Generate payment recommendations based on analysis
  const generatePaymentRecommendations = (payment: any, risk: string, health: string) => {
    const recommendations: string[] = [];
    
    // Risk-based recommendations
    if (risk === 'high') {
      recommendations.push('Immediate attention required - high-risk payment detected');
      recommendations.push('Consider escalating to management for review');
      recommendations.push('Implement additional verification procedures');
    } else if (risk === 'medium') {
      recommendations.push('Monitor payment closely for timely processing');
      recommendations.push('Ensure all documentation is complete');
    }
    
    // Health-based recommendations
    if (health === 'critical') {
      recommendations.push('Payment requires immediate intervention');
      recommendations.push('Review payment terms and conditions');
      recommendations.push('Consider restructuring payment schedule');
    } else if (health === 'warning') {
      recommendations.push('Monitor payment progress and efficiency');
      recommendations.push('Review payment processing timeline');
    }
    
    // Efficiency-based recommendations
    const efficiency = getPaymentEfficiency(payment);
    if (efficiency < 60) {
      recommendations.push('Improve payment processing efficiency');
      recommendations.push('Review current payment workflow');
    }
    
    // Days overdue recommendations
    const daysOverdue = getPaymentDaysOverdue(payment);
    if (daysOverdue > 0) {
      recommendations.push(`Payment is ${daysOverdue} days overdue - follow up required`);
      if (daysOverdue > 30) {
        recommendations.push('Consider penalty assessment per contract terms');
      }
    }
    
    return recommendations;
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
      try {
        // Validation selon le type de référentiel
        switch (referentialType) {
          case 'financial':
            return validateFinancialReferential(payment);
          case 'regulatory':
            return validateRegulatoryReferential(payment);
          case 'contractual':
            return validateContractualReferential(payment);
          case 'quality':
            return validateQualityReferential(payment);
          default:
            return { isValid: true, errors: [], warnings: ['Unknown referential type'] };
        }
      } catch (error) {
        console.error('Referential validation error:', error);
        return { isValid: false, errors: ['Validation failed'], warnings: [] };
      }
    },
    generatePaymentReport: (payment: any) => {
      try {
        const analytics = getPaymentAnalytics();
        const risk = getPaymentRisk(payment);
        const health = getPaymentFinancialHealth(payment);
        const efficiency = getPaymentEfficiency(payment);
        
        return {
          payment: {
            ...payment,
            risk,
            health,
            efficiency,
            daysOverdue: getPaymentDaysOverdue(payment)
          },
          generatedAt: new Date().toISOString(),
          reportType: 'Payment Analysis Report',
          summary: {
            totalPayments: analytics.totalPayments,
            paymentRate: analytics.paymentRate,
            averageEfficiency: analytics.averageEfficiency,
            totalAmount: analytics.totalAmount
          },
          recommendations: generatePaymentRecommendations(payment, risk, health),
          compliance: {
            isValid: true,
            lastValidated: new Date().toISOString(),
            validatedBy: 'PaymentSystem'
          }
        };
      } catch (error) {
        console.error('Report generation error:', error);
        return { 
          payment, 
          generatedAt: new Date().toISOString(),
          error: 'Report generation failed',
          status: 'error'
        };
      }
    }
  };
}

export default usePaymentsHex;
