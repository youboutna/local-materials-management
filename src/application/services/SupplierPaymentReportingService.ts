/**
 * Supplier Payment Reporting Service - Hexagonal Architecture
 * Business logic for supplier payment reporting and analytics with proper error handling
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ISupplierPaymentReportingRepository } from '@/domain/repositories/ISupplierPaymentReportingRepository';
import { SupplierDTO, PaymentDTO, PaymentRequestDTO, InvoiceDTO } from '@/dtos/entities/SupplierDTO';
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface SupplierPaymentReportData {
  supplier: SupplierDTO;
  payments: PaymentDTO[];
  paymentRequests: PaymentRequestDTO[];
  invoices: InvoiceDTO[];
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  averagePaymentTime: number;
  paymentHistory: MonthlyPaymentData[];
  paymentTrend?: PaymentTrend;
  recommendations?: string[];
}

export interface MonthlyPaymentData {
  month: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  transactionCount: number;
  averageAmount: number;
  paymentRate: number;
}

export interface PaymentTrend {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface SupplierPaymentMetrics {
  totalSuppliers: number;
  activeSuppliers: number;
  totalPayments: number;
  averagePaymentTime: number;
  onTimePaymentRate: number;
  totalPaymentValue: number;
  averagePaymentAmount: number;
  paymentVelocity: number;
  overdueRate: number;
}

export interface PaymentRecommendation {
  category: 'cash_flow' | 'process' | 'relationship' | 'compliance' | 'performance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionRequired: boolean;
  impact: 'critical' | 'significant' | 'minor' | 'informational';
}

/**
 * Service for managing supplier payment reporting and analytics with hexagonal architecture
 */
export class SupplierPaymentReportingService {
  private supplierPaymentReportingRepository: ISupplierPaymentReportingRepository;

  constructor() {
    this.supplierPaymentReportingRepository = RepositoryFactory.getSupplierPaymentReportingRepository();
  }

  /**
   * Fetch comprehensive supplier payment data
   */
  async fetchSupplierPaymentData(
    supplierId: string, 
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<SupplierPaymentReportData> {
    try {
      if (!supplierId || supplierId.trim() === '') {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Supplier ID is required');
      }

      if (!dateRange.startDate || !dateRange.endDate) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Date range is required');
      }

      if (dateRange.startDate > dateRange.endDate) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Start date must be before end date');
      }

      // Validate date range is not too large (max 2 years)
      const maxDateRange = subMonths(dateRange.endDate, 24);
      if (dateRange.startDate < maxDateRange) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Date range cannot exceed 2 years');
      }

      // Fetch all payment-related data in parallel
      const [
        supplierResult,
        paymentsResult,
        paymentRequestsResult,
        invoicesResult
      ] = await Promise.all([
        this.supplierPaymentReportingRepository.getSupplierById(supplierId),
        this.supplierPaymentReportingRepository.getSupplierPayments(supplierId, dateRange),
        this.supplierPaymentReportingRepository.getSupplierPaymentRequests(supplierId, dateRange),
        this.supplierPaymentReportingRepository.getSupplierInvoices(supplierId, dateRange)
      ]);

      if (!supplierResult) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Supplier not found');
      }

      const supplier = this.validateAndTransformSupplier(supplierResult);
      const payments = paymentsResult.map(p => this.validateAndTransformPayment(p));
      const paymentRequests = paymentRequestsResult.map(pr => this.validateAndTransformPaymentRequest(pr));
      const invoices = invoicesResult.map(i => this.validateAndTransformInvoice(i));

      // Calculate totals
      const totals = this.calculatePaymentTotals(payments, paymentRequests);
      
      // Calculate average payment time
      const averagePaymentTime = this.calculateAveragePaymentTime(payments);
      
      // Generate payment history
      const paymentHistory = this.generatePaymentHistory(payments, dateRange);

      // Calculate payment trend
      const paymentTrend = this.calculatePaymentTrends(paymentHistory);

      // Generate recommendations
      const recommendations = await this.generatePaymentRecommendations({
        supplier,
        payments,
        paymentRequests,
        invoices,
        totalPaid: totals.totalPaid,
        totalPending: totals.totalPending,
        totalOverdue: totals.totalOverdue,
        averagePaymentTime,
        paymentHistory,
        paymentTrend
      });

      return {
        supplier,
        payments,
        paymentRequests,
        invoices,
        totalPaid: totals.totalPaid,
        totalPending: totals.totalPending,
        totalOverdue: totals.totalOverdue,
        averagePaymentTime,
        paymentHistory,
        paymentTrend,
        recommendations: recommendations.map(r => r.title)
      };
    } catch (error) {
      console.error('Error fetching supplier payment data:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to fetch supplier payment data',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Calculate payment totals by status
   */
  calculatePaymentTotals(payments: PaymentDTO[], paymentRequests: PaymentRequestDTO[]): { totalPaid: number; totalPending: number; totalOverdue: number } {
    const allTransactions = [
      ...payments.map(p => ({ ...p, source: 'payment' })),
      ...paymentRequests.map(pr => ({ ...pr, source: 'request' }))
    ];

    const totalPaid = allTransactions
      .filter(t => t.status === 'paid' || t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalPending = allTransactions
      .filter(t => t.status === 'pending' || t.status === 'processing')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalOverdue = allTransactions
      .filter(t => t.status === 'overdue' || (
        t.status === 'pending' && 
        t.dueDate && 
        new Date(t.dueDate) < new Date()
      ))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return { totalPaid, totalPending, totalOverdue };
  }

  /**
   * Calculate average payment time in days
   */
  calculateAveragePaymentTime(payments: PaymentDTO[]): number {
    const completedPayments = payments.filter(p => 
      p.status === 'paid' && 
      p.paymentDate && 
      p.createdAt
    );

    if (completedPayments.length === 0) return 0;

    const totalDays = completedPayments.reduce((sum, payment) => {
      const paymentDate = new Date(payment.paymentDate);
      const requestDate = new Date(payment.createdAt);
      return sum + differenceInDays(paymentDate, requestDate);
    }, 0);

    return Math.round(totalDays / completedPayments.length);
  }

  /**
   * Generate monthly payment history
   */
  generatePaymentHistory(
    payments: PaymentDTO[], 
    dateRange: { startDate: Date; endDate: Date }
  ): MonthlyPaymentData[] {
    const history: MonthlyPaymentData[] = [];
    
    let currentDate = startOfMonth(dateRange.startDate);
    const endDate = endOfMonth(dateRange.endDate);

    while (currentDate <= endDate) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      const monthPayments = payments.filter(p => {
        const paymentDate = new Date(p.paymentDate || p.createdAt);
        return paymentDate >= monthStart && paymentDate <= monthEnd;
      });

      const totalAmount = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const transactionCount = monthPayments.length;

      const monthData: MonthlyPaymentData = {
        month: format(currentDate, 'MMMM yyyy', { locale: fr }),
        totalAmount,
        paidAmount: monthPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        pendingAmount: monthPayments
          .filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        overdueAmount: monthPayments
          .filter(p => p.status === 'overdue')
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        transactionCount,
        averageAmount: transactionCount > 0 ? totalAmount / transactionCount : 0,
        paymentRate: totalAmount > 0 ? (monthPayments.filter(p => p.status === 'paid').length / transactionCount) * 100 : 0
      };

      history.push(monthData);
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }

    return history;
  }

  /**
   * Calculate payment trends
   */
  calculatePaymentTrends(paymentHistory: MonthlyPaymentData[]): PaymentTrend {
    if (paymentHistory.length < 2) {
      return {
        direction: 'stable',
        percentage: 0,
        description: 'Données insuffisantes pour calculer la tendance',
        confidence: 'low'
      };
    }

    const currentMonth = paymentHistory[paymentHistory.length - 1];
    const previousMonth = paymentHistory[paymentHistory.length - 2];

    if (previousMonth.totalAmount === 0) {
      return {
        direction: 'stable',
        percentage: 0,
        description: 'Aucun paiement le mois précédent',
        confidence: 'medium'
      };
    }

    const change = currentMonth.totalAmount - previousMonth.totalAmount;
    const percentage = Math.abs((change / previousMonth.totalAmount) * 100);

    // Determine confidence based on data consistency
    const confidence = this.calculateTrendConfidence(paymentHistory);

    if (Math.abs(change) < (previousMonth.totalAmount * 0.05)) {
      return {
        direction: 'stable',
        percentage: 0,
        description: 'Montants stables par rapport au mois précédent',
        confidence
      };
    }

    return {
      direction: change > 0 ? 'up' : 'down',
      percentage: Math.round(percentage),
      description: change > 0 
        ? `Augmentation de ${Math.round(percentage)}% par rapport au mois précédent`
        : `Diminution de ${Math.round(percentage)}% par rapport au mois précédent`,
      confidence
    };
  }

  /**
   * Calculate overall supplier payment metrics
   */
  async calculateSupplierPaymentMetrics(): Promise<SupplierPaymentMetrics> {
    try {
      const [
        suppliersResult,
        paymentsResult
      ] = await Promise.all([
        this.supplierReportingRepository.getAllSuppliers(),
        this.supplierPaymentReportingRepository.getAllPayments()
      ]);

      const suppliers = suppliersResult.filter(s => s !== null);
      const payments = paymentsResult.filter(p => p !== null);

      const totalSuppliers = suppliers.length;
      const activeSuppliers = suppliers.filter(s => s.isActive).length;
      const totalPayments = payments.length;

      // Calculate average payment time
      const completedPayments = payments.filter(p => 
        p.status === 'paid' && p.paymentDate && p.createdAt
      );

      const averagePaymentTime = completedPayments.length > 0
        ? completedPayments.reduce((sum, payment) => {
            const paymentDate = new Date(payment.paymentDate);
            const requestDate = new Date(payment.createdAt);
            return sum + differenceInDays(paymentDate, requestDate);
          }, 0) / completedPayments.length
        : 0;

      // Calculate on-time payment rate (assuming 30 days is on-time)
      const onTimePayments = completedPayments.filter(p => {
        const paymentDate = new Date(p.paymentDate);
        const requestDate = new Date(p.createdAt);
        return differenceInDays(paymentDate, requestDate) <= 30;
      }).length;

      const onTimePaymentRate = completedPayments.length > 0
        ? (onTimePayments / completedPayments.length) * 100
        : 0;

      const totalPaymentValue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const averagePaymentAmount = totalPayments > 0 ? totalPaymentValue / totalPayments : 0;

      // Calculate payment velocity (payments per month)
      const paymentDates = payments
        .filter(p => p.paymentDate)
        .map(p => new Date(p.paymentDate))
        .sort((a, b) => a.getTime() - b.getTime());
      
      let paymentVelocity = 0;
      if (paymentDates.length > 1) {
        const dateRange = differenceInDays(paymentDates[paymentDates.length - 1], paymentDates[0]);
        paymentVelocity = (paymentDates.length / dateRange) * 30; // Convert to monthly rate
      }

      // Calculate overdue rate
      const overduePayments = payments.filter(p => p.status === 'overdue').length;
      const overdueRate = totalPayments > 0 ? (overduePayments / totalPayments) * 100 : 0;

      return {
        totalSuppliers,
        activeSuppliers,
        totalPayments,
        averagePaymentTime: Math.round(averagePaymentTime),
        onTimePaymentRate: Math.round(onTimePaymentRate),
        totalPaymentValue,
        averagePaymentAmount: Math.round(averagePaymentAmount * 100) / 100,
        paymentVelocity: Math.round(paymentVelocity * 10) / 10,
        overdueRate: Math.round(overdueRate)
      };
    } catch (error) {
      console.error('Error calculating supplier payment metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Generate payment recommendations based on data analysis
   */
  async generatePaymentRecommendations(paymentData: SupplierPaymentReportData): Promise<PaymentRecommendation[]> {
    try {
      const recommendations: PaymentRecommendation[] = [];

      // Overdue payment recommendations
      if (paymentData.totalOverdue > 0) {
        recommendations.push(
          {
            category: 'cash_flow',
            priority: 'high',
            title: 'Traiter les paiements en retard',
            description: 'Traiter en priorité les paiements en retard',
            actionRequired: true,
            impact: 'critical'
          },
          {
            category: 'relationship',
            priority: 'medium',
            title: 'Contacter le fournisseur',
            description: 'Contacter le fournisseur pour clarifier les retards',
            actionRequired: true,
            impact: 'significant'
          },
          {
            category: 'process',
            priority: 'medium',
            title: 'Plan de rattrapage',
            description: 'Mettre en place un plan de rattrapage des paiements',
            actionRequired: true,
            impact: 'significant'
          }
        );
      }

      // Payment time recommendations
      if (paymentData.averagePaymentTime > 45) {
        recommendations.push(
          {
            category: 'process',
            priority: 'medium',
            title: 'Optimiser les processus de paiement',
            description: 'Optimiser les processus de validation des paiements',
            actionRequired: true,
            impact: 'significant'
          },
          {
            category: 'process',
            priority: 'medium',
            title: 'Automatiser les workflows',
            description: 'Automatiser les workflows d\'approbation',
            actionRequired: false,
            impact: 'minor'
          },
          {
            category: 'performance',
            priority: 'low',
            title: 'Former les équipes',
            description: 'Former les équipes sur les procédures de paiement',
            actionRequired: false,
            impact: 'informational'
          }
        );
      } else if (paymentData.averagePaymentTime < 15) {
        recommendations.push(
          {
            category: 'performance',
            priority: 'low',
            title: 'Excellent délai de paiement',
            description: 'Excellent délai de paiement - maintenir les bonnes pratiques',
            actionRequired: false,
            impact: 'informational'
          },
          {
            category: 'process',
            priority: 'low',
            title: 'Documenter les processus',
            description: 'Documenter et partager les processus efficaces',
            actionRequired: false,
            impact: 'informational'
          }
        );
      }

      // Volume recommendations
      if (paymentData.payments.length === 0) {
        recommendations.push(
          {
            category: 'compliance',
            priority: 'high',
            title: 'Aucun paiement enregistré',
            description: 'Aucun paiement enregistré sur la période',
            actionRequired: true,
            impact: 'critical'
          },
          {
            category: 'relationship',
            priority: 'medium',
            title: 'Vérifier l\'activité',
            description: 'Vérifier l\'activité avec ce fournisseur',
            actionRequired: true,
            impact: 'significant'
          },
          {
            category: 'compliance',
            priority: 'low',
            title: 'Mettre à jour le statut',
            description: 'Mettre à jour le statut du fournisseur si nécessaire',
            actionRequired: false,
            impact: 'minor'
          }
        );
      }

      // Trend recommendations
      if (paymentData.paymentTrend) {
        const trend = paymentData.paymentTrend;
        if (trend.direction === 'up' && trend.percentage > 50) {
          recommendations.push(
            {
              category: 'cash_flow',
              priority: 'medium',
              title: 'Forte augmentation des paiements',
              description: 'Forte augmentation des paiements - vérifier la capacité budgétaire',
              actionRequired: true,
              impact: 'significant'
            },
            {
              category: 'performance',
              priority: 'medium',
              title: 'Analyser la cause',
              description: 'Analyser la cause de l\'augmentation des volumes',
              actionRequired: false,
              impact: 'minor'
            }
          );
        } else if (trend.direction === 'down' && trend.percentage > 30) {
          recommendations.push(
            {
              category: 'cash_flow',
              priority: 'high',
              title: 'Baisse significative des paiements',
              description: 'Baisse significative des paiements - analyser la situation',
              actionRequired: true,
              impact: 'critical'
            },
            {
              category: 'relationship',
              priority: 'medium',
              title: 'Contacter le fournisseur',
              description: 'Contacter le fournisseur pour comprendre la baisse',
              actionRequired: true,
              impact: 'significant'
            }
          );
        }
      }

      // Compliance recommendations
      const overdueRate = paymentData.totalOverdue > 0 
        ? (paymentData.totalOverdue / (paymentData.totalPaid + paymentData.totalPending + paymentData.totalOverdue)) * 100 
        : 0;

      if (overdueRate > 20) {
        recommendations.push(
          {
            category: 'compliance',
            priority: 'high',
            title: 'Taux de retard élevé',
            description: `Taux de retard de ${overdueRate.toFixed(1)}% - action corrective requise`,
            actionRequired: true,
            impact: 'critical'
          }
        );
      }

      // Sort by priority and impact
      return recommendations
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const impactOrder = { critical: 4, significant: 3, minor: 2, informational: 1 };
          
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          return impactOrder[b.impact] - impactOrder[a.impact];
        });
    } catch (error) {
      console.error('Error generating payment recommendations:', error);
      return [{
        category: 'process',
        priority: 'low',
        title: 'Erreur lors de la génération',
        description: 'Erreur lors de la génération des recommandations',
        actionRequired: false,
        impact: 'informational'
      }];
    }
  }

  // Private helper methods

  /**
   * Get default metrics
   */
  private getDefaultMetrics(): SupplierPaymentMetrics {
    return {
      totalSuppliers: 0,
      activeSuppliers: 0,
      totalPayments: 0,
      averagePaymentTime: 0,
      onTimePaymentRate: 0,
      totalPaymentValue: 0,
      averagePaymentAmount: 0,
      paymentVelocity: 0,
      overdueRate: 0
    };
  }

  /**
   * Calculate trend confidence based on data consistency
   */
  private calculateTrendConfidence(paymentHistory: MonthlyPaymentData[]): 'high' | 'medium' | 'low' {
    if (paymentHistory.length < 3) return 'low';
    
    // Check for consistent patterns
    const recentMonths = paymentHistory.slice(-3);
    const variations = recentMonths.map((month, index) => {
      if (index === 0) return 0;
      return Math.abs(month.totalAmount - recentMonths[index - 1].totalAmount) / recentMonths[index - 1].totalAmount;
    });
    
    const avgVariation = variations.reduce((sum, v) => sum + v, 0) / variations.length;
    
    if (avgVariation < 0.1) return 'high';
    if (avgVariation < 0.25) return 'medium';
    return 'low';
  }

  /**
   * Validate and transform supplier data
   */
  private validateAndTransformSupplier(data: any): SupplierDTO {
    return {
      id: data.id,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      category: data.category || 'other',
      isActive: data.is_active !== false,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Validate and transform payment data
   */
  private validateAndTransformPayment(data: any): PaymentDTO {
    return {
      id: data.id,
      contractorId: data.contractor_id,
      amount: data.amount || 0,
      status: data.status || 'pending',
      paymentDate: data.payment_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      dueDate: data.due_date
    };
  }

  /**
   * Validate and transform payment request data
   */
  private validateAndTransformPaymentRequest(data: any): PaymentRequestDTO {
    return {
      id: data.id,
      supplierId: data.supplier_id,
      amount: data.amount || 0,
      status: data.status || 'pending',
      requestedDate: data.requested_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Validate and transform invoice data
   */
  private validateAndTransformInvoice(data: any): InvoiceDTO {
    return {
      id: data.id,
      supplierId: data.supplier_id,
      invoiceNumber: data.invoice_number || '',
      amount: data.amount || 0,
      status: data.status || 'pending',
      invoiceDate: data.invoice_date,
      dueDate: data.due_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

// Factory function for service instance
let supplierPaymentReportingServiceInstance: SupplierPaymentReportingService | null = null;

export function getSupplierPaymentReportingService(): SupplierPaymentReportingService {
  if (!supplierPaymentReportingServiceInstance) {
    supplierPaymentReportingServiceInstance = new SupplierPaymentReportingService();
  }
  return supplierPaymentReportingServiceInstance;
}
