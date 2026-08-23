/**
 * Domain Entity: Payment
 * Pure business logic without infrastructure concerns
 * ✅ Utilise des références par ID (projectRef, phaseRef, inspectionRef)
 */

export type PaymentMethod =
  | 'cash'
  | 'check'
  | 'bank_transfer'
  | 'mobile_money'
  | 'credit_card'
  | 'other';

export type PaymentStatus =
  | 'requested'
  | 'pending_validation'
  | 'validated'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'cancelled'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'manual'
  | 'blocked'
  | 'processed';

export interface PaymentDocument {
  id: string;
  type: string;
  name: string;
  url?: string;
}

export class Payment {
  private _id: string;
  private _projectRef: { id: string } | null;
  private _phaseRef: { id: string } | null;
  private _inspectionRef: { id: string } | null;
  private _amount: number;
  private _paymentDate: string;
  private _paymentMethod: PaymentMethod;
  private _status: PaymentStatus;
  private _progressAtPayment: number;
  private _transactionId: string | null;
  private _contractorId: string | null;
  private _contractorName: string;
  private _contractorContact: string;
  private _bankName: string | null;
  private _accountNumber: string | null;
  private _checkNumber: string | null;
  private _mobileNumber: string | null;
  private _mobileOperator: string | null;
  private _receiverName: string | null;
  private _documents: PaymentDocument[];
  private _createdAt: string;
  private _updatedAt: string;
  private _createdBy: string | null;
  private _notes: string | null;

  constructor(
    id: string,
    projectRef: { id: string } | null,
    phaseRef: { id: string } | null,
    inspectionRef: { id: string } | null,
    amount: number,
    paymentDate: string,
    paymentMethod: PaymentMethod,
    status: PaymentStatus,
    progressAtPayment: number,
    transactionId: string | null,
    contractorId: string | null,
    contractorName: string,
    contractorContact: string,
    bankName: string | null,
    accountNumber: string | null,
    checkNumber: string | null,
    mobileNumber: string | null,
    mobileOperator: string | null,
    receiverName: string | null,
    documents: PaymentDocument[],
    createdAt: string,
    updatedAt: string,
    createdBy: string | null = null,
    notes: string | null = null
  ) {
    this._id = id;
    this._projectRef = projectRef;
    this._phaseRef = phaseRef;
    this._inspectionRef = inspectionRef;
    this._amount = amount;
    this._paymentDate = paymentDate;
    this._paymentMethod = paymentMethod;
    this._status = status;
    this._progressAtPayment = progressAtPayment;
    this._transactionId = transactionId;
    this._contractorId = contractorId;
    this._contractorName = contractorName;
    this._contractorContact = contractorContact;
    this._bankName = bankName;
    this._accountNumber = accountNumber;
    this._checkNumber = checkNumber;
    this._mobileNumber = mobileNumber;
    this._mobileOperator = mobileOperator;
    this._receiverName = receiverName;
    this._documents = documents || [];
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._createdBy = createdBy;
    this._notes = notes;
  }

  // Getters
  get id(): string { return this._id; }
  get projectRef(): { id: string } | null { return this._projectRef; }
  get phaseRef(): { id: string } | null { return this._phaseRef; }
  get inspectionRef(): { id: string } | null { return this._inspectionRef; }
  get projectId(): string | null { return this._projectRef?.id ?? null; }
  get phaseId(): string | null { return this._phaseRef?.id ?? null; }
  get inspectionId(): string | null { return this._inspectionRef?.id ?? null; }
  get amount(): number { return this._amount; }
  get paymentDate(): string { return this._paymentDate; }
  get paymentMethod(): PaymentMethod { return this._paymentMethod; }
  get status(): PaymentStatus { return this._status; }
  get progressAtPayment(): number { return this._progressAtPayment; }
  get transactionId(): string | null { return this._transactionId; }
  get contractorId(): string | null { return this._contractorId; }
  get contractorName(): string { return this._contractorName; }
  get contractorContact(): string { return this._contractorContact; }
  get bankName(): string | null { return this._bankName; }
  get accountNumber(): string | null { return this._accountNumber; }
  get checkNumber(): string | null { return this._checkNumber; }
  get mobileNumber(): string | null { return this._mobileNumber; }
  get mobileOperator(): string | null { return this._mobileOperator; }
  get receiverName(): string | null { return this._receiverName; }
  get documents(): PaymentDocument[] { return this._documents; }
  get createdAt(): string { return this._createdAt; }
  get updatedAt(): string { return this._updatedAt; }
  get createdBy(): string | null { return this._createdBy; }
  get notes(): string | null { return this._notes; }

  // Business logic methods
  get displayName(): string {
    return `${this._contractorName} - ${this._amount}`;
  }

  getFormattedAmount(): string {
    return new Intl.NumberFormat('fr-MR', {
      style: 'currency',
      currency: 'MRU'
    }).format(this._amount);
  }

  getRequiredDocumentTypes(): string[] {
    return ['pv_service_fait', 'decompte', 'facture', 'attestation_avancement'];
  }

  hasAllRequiredDocuments(): boolean {
    const required = this.getRequiredDocumentTypes();
    return required.every(type =>
      this._documents.some(doc => doc.type === type)
    );
  }

  getNetAmount(retentionPercentage: number = 5): number {
    return this._amount * (1 - retentionPercentage / 100);
  }

  isFinalized(): boolean {
    return ['paid', 'rejected', 'cancelled'].includes(this._status);
  }

  isPending(): boolean {
    return ['requested', 'pending_validation', 'validated', 'approved'].includes(this._status);
  }

  // Setters with validation
  set amount(value: number) {
    this._amount = this.validateAmount(value);
    this._updatedAt = new Date().toISOString();
  }

  set status(value: PaymentStatus) {
    this._status = this.validateStatus(value);
    this._updatedAt = new Date().toISOString();
  }

  set progressAtPayment(value: number) {
    this._progressAtPayment = this.validateProgress(value);
    this._updatedAt = new Date().toISOString();
  }

  set projectRef(value: { id: string } | null) {
    this._projectRef = value;
    this._updatedAt = new Date().toISOString();
  }

  set phaseRef(value: { id: string } | null) {
    this._phaseRef = value;
    this._updatedAt = new Date().toISOString();
  }

  set inspectionRef(value: { id: string } | null) {
    this._inspectionRef = value;
    this._updatedAt = new Date().toISOString();
  }

  // Business logic
  canBeValidated(): boolean {
    return this._status === 'requested' || this._status === 'pending_validation';
  }

  canBeApproved(): boolean {
    return this._status === 'validated';
  }

  canBePaid(): boolean {
    return this._status === 'approved';
  }

  // Immutability methods
  withStatus(newStatus: PaymentStatus): Payment {
    return new Payment(
      this._id,
      this._projectRef,
      this._phaseRef,
      this._inspectionRef,
      this._amount,
      this._paymentDate,
      this._paymentMethod,
      newStatus,
      this._progressAtPayment,
      this._transactionId,
      this._contractorId,
      this._contractorName,
      this._contractorContact,
      this._bankName,
      this._accountNumber,
      this._checkNumber,
      this._mobileNumber,
      this._mobileOperator,
      this._receiverName,
      this._documents,
      this._createdAt,
      new Date().toISOString(),
      this._createdBy,
      this._notes
    );
  }

  withAmount(newAmount: number): Payment {
    return new Payment(
      this._id,
      this._projectRef,
      this._phaseRef,
      this._inspectionRef,
      this.validateAmount(newAmount),
      this._paymentDate,
      this._paymentMethod,
      this._status,
      this._progressAtPayment,
      this._transactionId,
      this._contractorId,
      this._contractorName,
      this._contractorContact,
      this._bankName,
      this._accountNumber,
      this._checkNumber,
      this._mobileNumber,
      this._mobileOperator,
      this._receiverName,
      this._documents,
      this._createdAt,
      new Date().toISOString(),
      this._createdBy,
      this._notes
    );
  }

  // Factory
  static create(params: {
    id: string;
    projectRef?: { id: string } | null;
    phaseRef?: { id: string } | null;
    inspectionRef?: { id: string } | null;
    amount: number;
    paymentMethod: PaymentMethod;
    contractorId?: string | null;
    contractorName: string;
    contractorContact: string;
    progressAtPayment?: number;
    paymentDate?: string;
    transactionId?: string | null;
    bankName?: string | null;
    accountNumber?: string | null;
    checkNumber?: string | null;
    mobileNumber?: string | null;
    mobileOperator?: string | null;
    receiverName?: string | null;
    createdBy?: string | null;
    notes?: string | null;
  }): Payment {
    return new Payment(
      params.id,
      params.projectRef ?? null,
      params.phaseRef ?? null,
      params.inspectionRef ?? null,
      params.amount,
      params.paymentDate || new Date().toISOString(),
      params.paymentMethod,
      'requested',
      params.progressAtPayment || 0,
      params.transactionId || null,
      params.contractorId || null,
      params.contractorName,
      params.contractorContact,
      params.bankName || null,
      params.accountNumber || null,
      params.checkNumber || null,
      params.mobileNumber || null,
      params.mobileOperator || null,
      params.receiverName || null,
      [],
      new Date().toISOString(),
      new Date().toISOString(),
      params.createdBy || null,
      params.notes || null
    );
  }

  toPlainObject(): Record<string, unknown> {
    return {
      id: this._id,
      projectId: this._projectRef?.id ?? null,
      phaseId: this._phaseRef?.id ?? null,
      inspectionId: this._inspectionRef?.id ?? null,
      amount: this._amount,
      paymentDate: this._paymentDate,
      paymentMethod: this._paymentMethod,
      status: this._status,
      progressAtPayment: this._progressAtPayment,
      transactionId: this._transactionId,
      contractorId: this._contractorId,
      contractorName: this._contractorName,
      contractorContact: this._contractorContact,
      bankName: this._bankName,
      accountNumber: this._accountNumber,
      checkNumber: this._checkNumber,
      mobileNumber: this._mobileNumber,
      mobileOperator: this._mobileOperator,
      receiverName: this._receiverName,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      createdBy: this._createdBy,
      notes: this._notes,
    };
  }

  // Validations
  private validateId(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new Error('Payment ID is required');
    }
    return id.trim();
  }

  private validateAmount(amount: number): number {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    if (amount > 1000000) {
      throw new Error('Amount seems too high');
    }
    return amount;
  }

  private validateStatus(status: PaymentStatus): PaymentStatus {
    const validStatuses: PaymentStatus[] = [
      'requested', 'pending_validation', 'validated', 'approved', 'rejected', 'paid', 'cancelled',
      'pending', 'processing', 'completed', 'failed', 'refunded', 'manual', 'blocked', 'processed'
    ];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid payment status: ${status}`);
    }
    return status;
  }

  private validateProgress(progress: number): number {
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    return progress;
  }
}