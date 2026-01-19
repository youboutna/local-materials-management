/**
 * LocalStorage Payment Adapter
 * Implements IPaymentRepository using LocalStorage for DEV_MODE
 */

import { 
  IPaymentRepository, 
  Payment, 
  PaymentStatus, 
  PaymentType 
} from '@/domain/repositories/IPaymentRepository';
import { allPaymentsData, MockPayment } from '@/data/mockData';

// Convert MockPayment to Payment format
const mockPayments: Payment[] = allPaymentsData.map((mock: MockPayment) => {
  // Map mock status to domain status
  const statusMap: Record<string, PaymentStatus> = {
    'pending': 'pending',
    'processing': 'processing',
    'completed': 'completed',
    'failed': 'failed',
    'cancelled': 'cancelled'
  };

  // Map mock type to domain type
  const typeMap: Record<string, PaymentType> = {
    'supplier_payment': 'supplier_payment',
    'employee_payment': 'employee_payment',
    'expense_payment': 'expense_payment',
    'advance_payment': 'advance_payment'
  };

  return new Payment(
    mock.id,
    mock.supplierId,
    mock.inspectionId,
    mock.projectId,
    mock.amount,
    mock.currency,
    mock.dueDate,
    mock.paymentDate,
    typeMap[mock.type] || 'supplier_payment',
    statusMap[mock.status] || 'pending',
    mock.description,
    mock.reference,
    mock.approvedBy,
    mock.createdAt, // created_at
    mock.updatedAt  // updated_at
  );
});

export class LocalStoragePaymentAdapter implements IPaymentRepository {
  
  async findById(id: string): Promise<Payment | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const payments = this.getPaymentsFromStorage();
    const payment = payments.find(p => p.id === id);
    
    return payment || null;
  }

  async findAll(): Promise<Payment[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const payments = this.getPaymentsFromStorage();
    return payments;
  }

  async save(payment: Payment): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const payments = this.getPaymentsFromStorage();
    const existingIndex = payments.findIndex(p => p.id === payment.id);
    
    if (existingIndex >= 0) {
      payments[existingIndex] = payment;
    } else {
      payments.push(payment);
    }
    
    this.savePaymentsToStorage(payments);
    
    console.log(`[DEV_MODE] Saved payment ${payment.id}`);
  }

  async update(id: string, data: Partial<Payment>): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const payments = this.getPaymentsFromStorage();
    const paymentIndex = payments.findIndex(p => p.id === id);
    
    if (paymentIndex === -1) {
      throw new Error(`Payment with id ${id} not found`);
    }
    
    payments[paymentIndex] = {
      ...payments[paymentIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.savePaymentsToStorage(payments);
    
    console.log(`[DEV_MODE] Updated payment ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const payments = this.getPaymentsFromStorage();
    const paymentIndex = payments.findIndex(p => p.id === id);
    
    if (paymentIndex === -1) {
      throw new Error(`Payment with id ${id} not found`);
    }
    
    payments.splice(paymentIndex, 1);
    this.savePaymentsToStorage(payments);
    
    console.log(`[DEV_MODE] Deleted payment ${id}`);
  }

  async findBySupplier(supplierId: string): Promise<Payment[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const payments = this.getPaymentsFromStorage();
    return payments.filter(payment => payment.supplierId === supplierId);
  }

  async findByProject(projectId: string): Promise<Payment[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const payments = this.getPaymentsFromStorage();
    return payments.filter(payment => payment.projectId === projectId);
  }

  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const payments = this.getPaymentsFromStorage();
    return payments.filter(payment => payment.status === status);
  }

  async findByType(type: PaymentType): Promise<Payment[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const payments = this.getPaymentsFromStorage();
    return payments.filter(payment => payment.type === type);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Payment[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const payments = this.getPaymentsFromStorage();
    return payments.filter(payment => 
      payment.paymentDate >= startDate && payment.paymentDate <= endDate
    );
  }

  async findPending(): Promise<Payment[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const payments = this.getPaymentsFromStorage();
    return payments.filter(payment => payment.status === 'pending');
  }

  async findCompleted(): Promise<Payment[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const payments = this.getPaymentsFromStorage();
    return payments.filter(payment => payment.status === 'completed');
  }

  async search(query: string): Promise<Payment[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const payments = this.getPaymentsFromStorage();
    const searchLower = query.toLowerCase();
    
    return payments.filter(payment => 
      payment.description?.toLowerCase().includes(searchLower) ||
      payment.reference?.toLowerCase().includes(searchLower)
    );
  }

  async findByAmountRange(minAmount: number, maxAmount: number): Promise<Payment[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const payments = this.getPaymentsFromStorage();
    return payments.filter(payment => 
      payment.amount >= minAmount && payment.amount <= maxAmount
    );
  }

  // ============= Utility Methods =============

  private getPaymentsFromStorage(): Payment[] {
    if (typeof window === 'undefined') return mockPayments;
    
    const stored = localStorage.getItem('dev_payments');
    return stored ? JSON.parse(stored) : mockPayments;
  }

  private savePaymentsToStorage(payments: Payment[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('dev_payments', JSON.stringify(payments));
  }

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('dev_payments')) {
      localStorage.setItem('dev_payments', JSON.stringify(mockPayments));
    }
    
    console.log('[DEV_MODE] LocalStorage payments initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_payments');
    
    console.log('[DEV_MODE] LocalStorage payments cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData(): Payment[] {
    return this.getPaymentsFromStorage();
  }
}
