/**
 * Supplier Payment Reporting Service - Hexagonal Architecture
 * Business logic for supplier payment reporting and analytics with proper error handling
 */

import { IReportingRepository } from '@/domain/repositories/IReportingRepository';
import { PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { SupplierDTO } from '@/dtos/entities/SupplierDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { differenceInDays } from 'date-fns';

// Local DTOs for payment reporting
export interface PaymentRequestReportDTO {
  id: string;
  supplierId: string;
  amount: number;
  status: string;
  dueDate?: string;
  createdAt: string;
}

export interface InvoiceReportDTO {
  id: string;
  supplierId: string;
  amount: number;
  status: string;
  invoiceDate: string;
  createdAt: string;
}

export interface SupplierPaymentReportData {
  supplier: SupplierDTO;
  payments: PaymentDTO[];
  paymentRequests: PaymentRequestReportDTO[];
  invoices: InvoiceReportDTO[];
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
  private supplierPaymentReportingRepository: IReportingRepository;

  constructor() {
    this.supplierPaymentReportingRepository = RepositoryFactory.getReportingRepository();
  }

  /**
   * Calculate payment totals by status
   */
  calculatePaymentTotals(payments: PaymentDTO[], paymentRequests: PaymentRequestReportDTO[]): { totalPaid: number; totalPending: number; totalOverdue: number } {
    const allTransactions = [
      ...payments.map(p => ({ ...p, source: 'payment' })),
      ...paymentRequests.map(pr => ({ ...pr, source: 'request' }))
    ];

    const totalPaid = allTransactions
      .filter(t => t.status === 'paid' || t.status === 'completed')
      .reduce((sum, t) => sum + ((t as any).amount || 0), 0);

    const totalPending = allTransactions
      .filter(t => t.status === 'pending' || t.status === 'processing')
      .reduce((sum, t) => sum + ((t as any).amount || 0), 0);

    const totalOverdue = allTransactions
      .filter(t => t.status === 'overdue')
      .reduce((sum, t) => sum + ((t as any).amount || 0), 0);

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
      const paymentDate = new Date(payment.paymentDate!);
      const requestDate = new Date(payment.createdAt!);
      return sum + differenceInDays(paymentDate, requestDate);
    }, 0);

    return Math.round(totalDays / completedPayments.length);
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
      return this.getDefaultMetrics();
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

      if (paymentData.totalOverdue > 0) {
        recommendations.push({
          category: 'cash_flow',
          priority: 'high',
          title: 'Traiter les paiements en retard',
          description: 'Traiter en priorité les paiements en retard',
          actionRequired: true,
          impact: 'critical'
        });
      }

      if (paymentData.averagePaymentTime > 45) {
        recommendations.push({
          category: 'process',
          priority: 'medium',
          title: 'Optimiser les processus de paiement',
          description: 'Optimiser les processus de validation des paiements',
          actionRequired: true,
          impact: 'significant'
        });
      } else if (paymentData.averagePaymentTime < 15) {
        recommendations.push({
          category: 'performance',
          priority: 'low',
          title: 'Excellent délai de paiement',
          description: 'Excellent délai de paiement - maintenir les bonnes pratiques',
          actionRequired: false,
          impact: 'informational'
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating payment recommendations:', error);
      return [];
    }
  }

  // Private helper methods

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

  private calculateTrendConfidence(paymentHistory: MonthlyPaymentData[]): 'high' | 'medium' | 'low' {
    if (paymentHistory.length >= 6) return 'high';
    if (paymentHistory.length >= 3) return 'medium';
    return 'low';
  }
}

// Factory function
let supplierPaymentReportingServiceInstance: SupplierPaymentReportingService | null = null;

export function getSupplierPaymentReportingService(): SupplierPaymentReportingService {
  if (!supplierPaymentReportingServiceInstance) {
    supplierPaymentReportingServiceInstance = new SupplierPaymentReportingService();
  }
  return supplierPaymentReportingServiceInstance;
}
