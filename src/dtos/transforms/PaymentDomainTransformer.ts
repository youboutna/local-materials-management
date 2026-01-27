/**
 * Payment Domain Transformer with BTP Calculations and Business Logic
 * Implements hexagonal architecture principles with enriched calculations
 */

import { Payment } from '@/domain/entities/Payment';
import { PaymentStatus } from '@/types/payment';

export interface PaymentEfficiencyResult {
  paymentRate: number;
  onTimePaymentRate: string;
  daysOverdue: number;
  averagePaymentDelay: number;
}

export interface PaymentRiskResult {
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  recommendations: string[];
  financialHealth: string;
}

export interface CashFlowMetricsResult {
  totalPaid: number;
  totalDue: number;
  cashFlowVariance: number;
  averagePaymentDelay: number;
  paymentEfficiency: PaymentEfficiencyResult;
}

export interface PaymentDTO {
  id: string;
  amount: number;
  paymentDate: Date | string;
  paymentMethod: string;
  status: PaymentStatus;
  progressAtPayment: number;
  transactionId: string;
  contractorName: string;
  contractorContact: string;
  bankName?: string;
  accountNumber?: string;
  checkNumber?: string;
  mobileNumber?: string;
  receiverName?: string;
  mobileOperator?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
  risk?: PaymentRiskResult;
  efficiency?: PaymentEfficiencyResult;
  daysOverdue?: number;
  financialHealth?: string;
  projectId?: string;
  invoiceId?: string;
}

export interface CreatePaymentRequestDto {
  amount: number;
  paymentDate?: string;
  paymentMethod: string;
  progressAtPayment?: number;
  transactionId: string;
  contractorName: string;
  contractorContact: string;
  bankName?: string;
  accountNumber?: string;
  checkNumber?: string;
  mobileNumber?: string;
  receiverName?: string;
  mobileOperator?: string;
}

export interface UpdatePaymentRequestDto {
  amount?: number;
  paymentDate?: string;
  progressAtPayment?: number;
  transactionId?: string;
  contractorName?: string;
  contractorContact?: string;
  bankName?: string;
  accountNumber?: string;
  checkNumber?: string;
  mobileNumber?: string;
  receiverName?: string;
  mobileOperator?: string;
}

export class PaymentDomainTransformer {
  /**
   * Calculate payment efficiency and compliance metrics
   */
  static calculatePaymentEfficiency(payment: any): PaymentEfficiencyResult {
    const totalPaid = payment?.totalPaid || 0;
    const totalDue = payment?.totalDue || 0;
    const paymentRate = totalDue > 0 ? (totalPaid / totalDue) : 1;
    
    return {
      paymentRate,
      onTimePaymentRate: paymentRate >= 0.95 ? 'excellent' : paymentRate >= 0.85 ? 'good' : paymentRate >= 0.75 ? 'acceptable' : 'poor',
      daysOverdue: payment?.daysOverdue || 0,
      averagePaymentDelay: payment?.averagePaymentDelay || 0
    };
  }

  /**
   * Calculate payment risk assessment
   */
  static calculatePaymentRisk(payment: any): PaymentRiskResult {
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    
    if (payment?.daysOverdue && payment.daysOverdue > 30) {
      riskFactors.push('Severe payment delay');
      riskLevel = 'high';
      recommendations.push('Immediate payment collection required');
    } else if (payment?.daysOverdue && payment.daysOverdue > 15) {
      riskFactors.push('Payment delay detected');
      riskLevel = 'medium';
      recommendations.push('Review payment schedule');
    }
    
    const financialHealth = payment?.status === 'paid' ? 'healthy' : 
                       payment?.status === 'partial' ? 'warning' : 'critical';
    
    return {
      riskLevel,
      riskFactors,
      recommendations,
      financialHealth
    };
  }

  /**
   * Calculate payment cash flow metrics
   */
  static calculateCashFlowMetrics(payments: any[]): CashFlowMetricsResult {
    const totalPaid = payments.reduce((sum, p) => sum + (p?.totalPaid || 0), 0);
    const totalDue = payments.reduce((sum, p) => sum + (p?.totalDue || 0), 0);
    const avgDelay = payments.length > 0 
      ? payments.reduce((sum, p) => sum + (p?.averagePaymentDelay || 0), 0) / payments.length 
      : 0;
    const cashFlowVariance = totalPaid - (totalDue * 0.9);
    
    return {
      totalPaid,
      totalDue,
      cashFlowVariance,
      averagePaymentDelay: avgDelay,
      paymentEfficiency: this.calculatePaymentEfficiency(payments[payments.length - 1] || {})
    };
  }

  /**
   * Transform Payment entity to PaymentDTO
   */
  static toResponseDto(payment: any): PaymentDTO {
    const risk = this.calculatePaymentRisk(payment);
    const efficiency = this.calculatePaymentEfficiency(payment);
    
    return {
      id: payment.id,
      amount: payment.amount,
      paymentDate: payment.paymentDate || payment.payment_date,
      paymentMethod: payment.paymentMethod || payment.payment_method,
      status: payment.status as PaymentStatus,
      progressAtPayment: payment.progressAtPayment || payment.progress_at_payment || 0,
      transactionId: payment.transactionId || payment.transaction_id,
      contractorName: payment.contractorName || payment.contractor_name,
      contractorContact: payment.contractorContact || payment.contractor_contact,
      bankName: payment.bankName || payment.bank_name,
      accountNumber: payment.accountNumber || payment.account_number,
      checkNumber: payment.checkNumber || payment.check_number,
      mobileNumber: payment.mobileNumber || payment.mobile_number,
      receiverName: payment.receiverName || payment.receiver_name,
      mobileOperator: payment.mobileOperator || payment.mobile_operator,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      risk,
      efficiency,
      daysOverdue: payment.daysOverdue || 0,
      financialHealth: payment.status === 'paid' ? 'healthy' : 
                       payment.status === 'partial' ? 'warning' : 'critical',
      projectId: payment.projectId || payment.project_id,
      invoiceId: payment.invoiceId || payment.invoice_id
    };
  }

  /**
   * Transform array to response DTOs
   */
  static toResponseDtoArray(payments: any[]): PaymentDTO[] {
    return (payments || []).map(p => this.toResponseDto(p));
  }

  /**
   * Transform CreatePaymentRequestDto to entity data
   */
  static fromCreateDtoToEntity(dto: CreatePaymentRequestDto): any {
    return {
      id: crypto.randomUUID(),
      amount: dto.amount,
      payment_date: dto.paymentDate ? new Date(dto.paymentDate).toISOString() : new Date().toISOString(),
      payment_method: dto.paymentMethod,
      progress_at_payment: dto.progressAtPayment || 0,
      transaction_id: dto.transactionId,
      contractor_name: dto.contractorName,
      contractor_contact: dto.contractorContact,
      bank_name: dto.bankName,
      account_number: dto.accountNumber,
      check_number: dto.checkNumber,
      mobile_number: dto.mobileNumber,
      receiver_name: dto.receiverName,
      mobile_operator: dto.mobileOperator,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Transform UpdatePaymentRequestDto to partial entity data
   */
  static fromUpdateDtoToEntity(dto: UpdatePaymentRequestDto): any {
    const result: any = {
      updated_at: new Date().toISOString()
    };
    
    if (dto.amount !== undefined) result.amount = dto.amount;
    if (dto.paymentDate) result.payment_date = new Date(dto.paymentDate).toISOString();
    if (dto.progressAtPayment !== undefined) result.progress_at_payment = dto.progressAtPayment;
    if (dto.transactionId) result.transaction_id = dto.transactionId;
    if (dto.contractorName) result.contractor_name = dto.contractorName;
    if (dto.contractorContact) result.contractor_contact = dto.contractorContact;
    if (dto.bankName) result.bank_name = dto.bankName;
    if (dto.accountNumber) result.account_number = dto.accountNumber;
    if (dto.checkNumber) result.check_number = dto.checkNumber;
    if (dto.mobileNumber) result.mobile_number = dto.mobileNumber;
    if (dto.receiverName) result.receiver_name = dto.receiverName;
    if (dto.mobileOperator) result.mobile_operator = dto.mobileOperator;
    
    return result;
  }

  /**
   * Validate payment data for business rules
   */
  static validatePaymentData(payment: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!payment.amount || payment.amount <= 0) {
      errors.push('Payment amount must be greater than 0');
    }
    
    if (!payment.paymentDate && !payment.payment_date) {
      errors.push('Payment date is required');
    }
    
    const validMethods = ['cash', 'bank_transfer', 'check', 'credit_card', 'mobile_money'];
    const method = payment.paymentMethod || payment.payment_method;
    if (method && !validMethods.includes(method)) {
      errors.push(`Invalid payment method: ${method}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
