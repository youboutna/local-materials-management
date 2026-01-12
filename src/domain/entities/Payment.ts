// Domain Entity: Payment
// Pure business logic without infrastructure concerns

export type PaymentStatus = 
  | 'requested' 
  | 'pending_validation' 
  | 'validated' 
  | 'approved' 
  | 'rejected' 
  | 'paid' 
  | 'cancelled';

export type PaymentMethod = 
  | 'bank_transfer' 
  | 'check' 
  | 'mobile_money' 
  | 'cash';

export interface PaymentDocument {
  id: string;
  type: string;
  name: string;
  url?: string;
}

export class Payment {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly phaseId: string | null,
    public readonly stepId: string | null,
    public readonly inspectionId: string | null,
    public readonly amount: number,
    public readonly paymentDate: string,
    public readonly paymentMethod: PaymentMethod,
    public readonly status: PaymentStatus,
    public readonly progressAtPayment: number,
    public readonly transactionId: string | null,
    public readonly contractorName: string,
    public readonly contractorContact: string,
    public readonly bankName: string | null,
    public readonly accountNumber: string | null,
    public readonly checkNumber: string | null,
    public readonly mobileNumber: string | null,
    public readonly mobileOperator: string | null,
    public readonly receiverName: string | null,
    public readonly documents: PaymentDocument[],
    public readonly createdAt: string,
    public readonly updatedAt: string
  ) {}

  // Business logic
  canBeValidated(): boolean {
    return this.status === 'requested' || this.status === 'pending_validation';
  }

  canBeApproved(): boolean {
    return this.status === 'validated';
  }

  canBePaid(): boolean {
    return this.status === 'approved';
  }

  isFinalized(): boolean {
    return ['paid', 'rejected', 'cancelled'].includes(this.status);
  }

  isPending(): boolean {
    return ['requested', 'pending_validation', 'validated', 'approved'].includes(this.status);
  }

  getRequiredDocumentTypes(): string[] {
    return [
      'pv_service_fait',
      'decompte',
      'facture',
      'attestation_avancement'
    ];
  }

  hasAllRequiredDocuments(): boolean {
    const required = this.getRequiredDocumentTypes();
    return required.every(type => 
      this.documents.some(doc => doc.type === type)
    );
  }

  calculateNetAmount(retentionPercentage: number = 5): number {
    return this.amount * (1 - retentionPercentage / 100);
  }

  // Factory method
  static create(params: {
    id: string;
    projectId: string;
    phaseId?: string;
    stepId?: string;
    inspectionId?: string;
    amount: number;
    paymentMethod: PaymentMethod;
    contractorName: string;
    contractorContact: string;
    progressAtPayment: number;
  }): Payment {
    return new Payment(
      params.id,
      params.projectId,
      params.phaseId || null,
      params.stepId || null,
      params.inspectionId || null,
      params.amount,
      new Date().toISOString(),
      params.paymentMethod,
      'requested',
      params.progressAtPayment,
      null,
      params.contractorName,
      params.contractorContact,
      null,
      null,
      null,
      null,
      null,
      null,
      [],
      new Date().toISOString(),
      new Date().toISOString()
    );
  }
}
