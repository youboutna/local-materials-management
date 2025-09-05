import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface SupplierPaymentReportData {
  supplier: any;
  payments: any[];
  paymentRequests: any[];
  invoices: any[];
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  averagePaymentTime: number;
  paymentHistory: MonthlyPaymentData[];
}

export interface MonthlyPaymentData {
  month: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  transactionCount: number;
}

export interface PaymentTrend {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  description: string;
}

export interface SupplierPaymentMetrics {
  totalSuppliers: number;
  activeSuppliers: number;
  totalPayments: number;
  averagePaymentTime: number;
  onTimePaymentRate: number;
  totalPaymentValue: number;
}

export class SupplierPaymentReportingService {
  
  /**
   * Fetch comprehensive supplier payment data
   */
  static async fetchSupplierPaymentData(
    supplierId: string, 
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<SupplierPaymentReportData> {
    try {
      const [
        supplierResult,
        paymentsResult,
        paymentRequestsResult,
        invoicesResult
      ] = await Promise.all([
        supabase
          .from('suppliers')
          .select('*')
          .eq('id', supplierId)
          .single(),
        supabase
          .from('payments')
          .select('*')
          .eq('contractor_id', supplierId)
          .gte('payment_date', dateRange.startDate.toISOString())
          .lte('payment_date', dateRange.endDate.toISOString()),
        supabase
          .from('supplier_payment_requests')
          .select('*')
          .eq('supplier_id', supplierId)
          .gte('requested_date', dateRange.startDate.toISOString())
          .lte('requested_date', dateRange.endDate.toISOString()),
        supabase
          .from('parsed_invoices')
          .select('*')
          .eq('supplier_id', supplierId)
          .gte('invoice_date', dateRange.startDate.toISOString())
          .lte('invoice_date', dateRange.endDate.toISOString())
      ]);

      const supplier = supplierResult.data;
      const payments = paymentsResult.data || [];
      const paymentRequests = paymentRequestsResult.data || [];
      const invoices = invoicesResult.data || [];

      // Calculate totals
      const totals = this.calculatePaymentTotals(payments, paymentRequests);
      
      // Calculate average payment time
      const averagePaymentTime = this.calculateAveragePaymentTime(payments);
      
      // Generate payment history
      const paymentHistory = this.generatePaymentHistory(payments, dateRange);

      return {
        supplier,
        payments,
        paymentRequests,
        invoices,
        totalPaid: totals.totalPaid,
        totalPending: totals.totalPending,
        totalOverdue: totals.totalOverdue,
        averagePaymentTime,
        paymentHistory
      };
    } catch (error) {
      console.error('Error fetching supplier payment data:', error);
      throw error;
    }
  }

  /**
   * Calculate payment totals by status
   */
  static calculatePaymentTotals(payments: any[], paymentRequests: any[]) {
    const allTransactions = [
      ...payments.map(p => ({ ...p, source: 'payment' })),
      ...paymentRequests.map(pr => ({ ...pr, source: 'request' }))
    ];

    const totalPaid = allTransactions
      .filter(t => (t as any).status === 'paid' || (t as any).status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalPending = allTransactions
      .filter(t => (t as any).status === 'pending' || (t as any).status === 'processing')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalOverdue = allTransactions
      .filter(t => (t as any).status === 'overdue' || (
        (t as any).status === 'pending' && 
        (t as any).due_date && 
        new Date((t as any).due_date) < new Date()
      ))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return { totalPaid, totalPending, totalOverdue };
  }

  /**
   * Calculate average payment time in days
   */
  static calculateAveragePaymentTime(payments: any[]): number {
    const completedPayments = payments.filter(p => 
      (p as any).status === 'paid' && 
      p.payment_date && 
      p.created_at
    );

    if (completedPayments.length === 0) return 0;

    const totalDays = completedPayments.reduce((sum, payment) => {
      const paymentDate = new Date(payment.payment_date);
      const requestDate = new Date(payment.created_at);
      return sum + differenceInDays(paymentDate, requestDate);
    }, 0);

    return Math.round(totalDays / completedPayments.length);
  }

  /**
   * Generate monthly payment history
   */
  static generatePaymentHistory(
    payments: any[], 
    dateRange: { startDate: Date; endDate: Date }
  ): MonthlyPaymentData[] {
    const history: MonthlyPaymentData[] = [];
    
    let currentDate = startOfMonth(dateRange.startDate);
    const endDate = endOfMonth(dateRange.endDate);

    while (currentDate <= endDate) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      const monthPayments = payments.filter(p => {
        const paymentDate = new Date(p.payment_date || p.created_at);
        return paymentDate >= monthStart && paymentDate <= monthEnd;
      });

      const monthData: MonthlyPaymentData = {
        month: format(currentDate, 'MMMM yyyy', { locale: fr }),
        totalAmount: monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        paidAmount: monthPayments
          .filter(p => (p as any).status === 'paid')
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        pendingAmount: monthPayments
          .filter(p => (p as any).status === 'pending')
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        overdueAmount: monthPayments
          .filter(p => (p as any).status === 'overdue')
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        transactionCount: monthPayments.length
      };

      history.push(monthData);
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }

    return history;
  }

  /**
   * Calculate payment trends
   */
  static calculatePaymentTrends(paymentHistory: MonthlyPaymentData[]): PaymentTrend {
    if (paymentHistory.length < 2) {
      return {
        direction: 'stable',
        percentage: 0,
        description: 'Données insuffisantes pour calculer la tendance'
      };
    }

    const currentMonth = paymentHistory[paymentHistory.length - 1];
    const previousMonth = paymentHistory[paymentHistory.length - 2];

    if (previousMonth.totalAmount === 0) {
      return {
        direction: 'stable',
        percentage: 0,
        description: 'Aucun paiement le mois précédent'
      };
    }

    const change = currentMonth.totalAmount - previousMonth.totalAmount;
    const percentage = Math.abs((change / previousMonth.totalAmount) * 100);

    if (Math.abs(change) < (previousMonth.totalAmount * 0.05)) {
      return {
        direction: 'stable',
        percentage: 0,
        description: 'Montants stables par rapport au mois précédent'
      };
    }

    return {
      direction: change > 0 ? 'up' : 'down',
      percentage: Math.round(percentage),
      description: change > 0 
        ? `Augmentation de ${Math.round(percentage)}% par rapport au mois précédent`
        : `Diminution de ${Math.round(percentage)}% par rapport au mois précédent`
    };
  }

  /**
   * Calculate overall supplier payment metrics
   */
  static async calculateSupplierPaymentMetrics(): Promise<SupplierPaymentMetrics> {
    try {
      const [
        suppliersResult,
        paymentsResult
      ] = await Promise.all([
        supabase.from('suppliers').select('*'),
        supabase.from('payments').select('*')
      ]);

      const suppliers = suppliersResult.data || [];
      const payments = paymentsResult.data || [];

      const totalSuppliers = suppliers.length;
      const activeSuppliers = suppliers.filter(s => s.is_active).length;
      const totalPayments = payments.length;

      // Calculate average payment time
      const completedPayments = payments.filter(p => 
        (p as any).status === 'paid' && p.payment_date && p.created_at
      );

      const averagePaymentTime = completedPayments.length > 0
        ? completedPayments.reduce((sum, payment) => {
            const paymentDate = new Date(payment.payment_date);
            const requestDate = new Date(payment.created_at);
            return sum + differenceInDays(paymentDate, requestDate);
          }, 0) / completedPayments.length
        : 0;

      // Calculate on-time payment rate (assuming 30 days is on-time)
      const onTimePayments = completedPayments.filter(p => {
        const paymentDate = new Date(p.payment_date);
        const requestDate = new Date(p.created_at);
        return differenceInDays(paymentDate, requestDate) <= 30;
      }).length;

      const onTimePaymentRate = completedPayments.length > 0
        ? (onTimePayments / completedPayments.length) * 100
        : 0;

      const totalPaymentValue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        totalSuppliers,
        activeSuppliers,
        totalPayments,
        averagePaymentTime: Math.round(averagePaymentTime),
        onTimePaymentRate: Math.round(onTimePaymentRate),
        totalPaymentValue
      };
    } catch (error) {
      console.error('Error calculating supplier payment metrics:', error);
      return {
        totalSuppliers: 0,
        activeSuppliers: 0,
        totalPayments: 0,
        averagePaymentTime: 0,
        onTimePaymentRate: 0,
        totalPaymentValue: 0
      };
    }
  }

  /**
   * Generate payment recommendations based on data analysis
   */
  static generatePaymentRecommendations(
    paymentData: SupplierPaymentReportData
  ): string[] {
    const recommendations: string[] = [];
    
    // Overdue payment recommendations
    if (paymentData.totalOverdue > 0) {
      recommendations.push(
        'Traiter en priorité les paiements en retard',
        'Contacter le fournisseur pour clarifier les retards',
        'Mettre en place un plan de rattrapage des paiements'
      );
    }

    // Payment time recommendations
    if (paymentData.averagePaymentTime > 45) {
      recommendations.push(
        'Optimiser les processus de validation des paiements',
        'Automatiser les workflows d\'approbation',
        'Former les équipes sur les procédures de paiement'
      );
    } else if (paymentData.averagePaymentTime < 15) {
      recommendations.push(
        'Excellent délai de paiement - maintenir les bonnes pratiques',
        'Documenter et partager les processus efficaces'
      );
    }

    // Volume recommendations
    if (paymentData.payments.length === 0) {
      recommendations.push(
        'Aucun paiement enregistré sur la période',
        'Vérifier l\'activité avec ce fournisseur',
        'Mettre à jour le statut du fournisseur si nécessaire'
      );
    }

    // Trend recommendations
    const trend = this.calculatePaymentTrends(paymentData.paymentHistory);
    if (trend.direction === 'up' && trend.percentage > 50) {
      recommendations.push(
        'Forte augmentation des paiements - vérifier la capacité budgétaire',
        'Analyser la cause de l\'augmentation des volumes'
      );
    }

    return recommendations;
  }
}