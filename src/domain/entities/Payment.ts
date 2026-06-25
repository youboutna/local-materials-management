// Domain Entity: Payment
// Pure business logic without infrastructure concerns

import { Project } from './Project';
import { Phase } from './Phase';
import { Inspection } from './Inspection';

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
  | 'manual';

export interface PaymentDocument {
  id: string;
  type: string;
  name: string;
  url?: string;
}

export class Payment {
  // Private fields for encapsulation
  private _id: string;
  private _project: Project | null;
  private _phase: Phase | null;
  private _inspection: Inspection | null;
  private _amount: number;
  private _paymentDate: string;
  private _paymentMethod: PaymentMethod;
  private _status: PaymentStatus;
  private _progressAtPayment: number;
  private _transactionId: string | null;
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

  constructor(
    id: string,
    project: Project | null,
    phase: Phase | null,
    inspection: Inspection | null,
    amount: number,
    paymentDate: string,
    paymentMethod: PaymentMethod,
    status: PaymentStatus,
    progressAtPayment: number,
    transactionId: string | null,
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
    updatedAt: string
  ) {
    // Validate and assign private fields
    this._id = this.validateId(id);
    this._project = project;
    this._phase = phase;
    this._inspection = inspection;
    this._amount = this.validateAmount(amount);
    this._paymentDate = paymentDate;
    this._paymentMethod = paymentMethod;
    this._status = this.validateStatus(status);
    this._progressAtPayment = this.validateProgress(progressAtPayment);
    this._transactionId = transactionId;
    this._contractorName = this.validateContractorName(contractorName);
    this._contractorContact = this.validateContractorContact(contractorContact);
    this._bankName = bankName;
    this._accountNumber = accountNumber;
    this._checkNumber = checkNumber;
    this._mobileNumber = mobileNumber;
    this._mobileOperator = mobileOperator;
    this._receiverName = receiverName;
    this._documents = documents || [];
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ============= Getters =============
  get id(): string { return this._id; }
  get project(): Project | null { return this._project; }
  get phase(): Phase | null { return this._phase; }
  get inspection(): Inspection | null { return this._inspection; }
  get amount(): number { return this._amount; }
  get paymentDate(): string { return this._paymentDate; }
  get paymentMethod(): PaymentMethod { return this._paymentMethod; }
  get status(): PaymentStatus { return this._status; }
  get progressAtPayment(): number { return this._progressAtPayment; }
  get transactionId(): string | null { return this._transactionId; }
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

  // ============= Getters with Business Logic =============
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

  // ============= Setters with Validation =============
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

  // ============= Business Logic Methods =============
  canBeValidated(): boolean {
    return this._status === 'requested' || this._status === 'pending_validation';
  }

  canBeApproved(): boolean {
    return this._status === 'validated';
  }

  canBePaid(): boolean {
    return this._status === 'approved';
  }

  // ============= Immutability Methods =============
  withStatus(newStatus: PaymentStatus): Payment {
    return new Payment(
      this._id,
      this._project,
      this._phase,
      this._inspection,
      this._amount,
      this._paymentDate,
      this._paymentMethod,
      newStatus,
      this._progressAtPayment,
      this._transactionId,
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
      new Date().toISOString()
    );
  }

  withAmount(newAmount: number): Payment {
    return new Payment(
      this._id,
      this._project,
      this._phase,
      this._inspection,
      this.validateAmount(newAmount),
      this._paymentDate,
      this._paymentMethod,
      this._status,
      this._progressAtPayment,
      this._transactionId,
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
      new Date().toISOString()
    );
  }

  // ============= Factory Methods =============
  static create(params: {
    id: string;
    project: Project | null;
    phase?: Phase | null;
    inspection?: Inspection | null;
    amount: number;
    paymentMethod: PaymentMethod;
    contractorName: string;
    contractorContact: string;
    progressAtPayment?: number;
  }): Payment {
    return new Payment(
      params.id,
      params.project,
      params.phase || null,
      params.inspection || null,
      params.amount,
      new Date().toISOString(),
      params.paymentMethod,
      'requested',
      params.progressAtPayment || 0,
      null, // transactionId
      params.contractorName,
      params.contractorContact,
      null, // bankName
      null, // accountNumber
      null, // checkNumber
      null, // mobileNumber
      null, // mobileOperator
      null, // receiverName
      [],   // documents
      new Date().toISOString(), // createdAt
      new Date().toISOString()  // updatedAt
    );
  }

  // ============= Data Transformation Methods =============
  toPlainObject(): Record<string, unknown> {
    return {
      id: this._id,
      project_id: this._project?.id || null,
      phase_id: this._phase?.id || null,
      inspection_id: this._inspection?.id || null,
      amount: this._amount,
      payment_date: this._paymentDate,
      payment_method: this._paymentMethod,
      status: this._status,
      progress_at_payment: this._progressAtPayment,
      transaction_id: this._transactionId,
      contractor_name: this._contractorName,
      contractor_contact: this._contractorContact,
      bank_name: this._bankName,
      account_number: this._accountNumber,
      check_number: this._checkNumber,
      mobile_number: this._mobileNumber,
      mobile_operator: this._mobileOperator,
      receiver_name: this._receiverName,
      documents: this._documents.map(d => ({ ...d })),
      created_at: this._createdAt,
      updated_at: this._updatedAt
    };
  }

  // ============= Validation Methods =============
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
      'pending', 'processing', 'completed', 'failed', 'refunded', 'manual'
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

  private validateContractorName(name: string): string {
    if (!name || name.trim().length === 0) {
      console.warn('[Payment] contractorName missing — defaulting to "—"');
      return '—';
    }
    return name.trim();
  }

  private validateContractorContact(contact: string): string {
    if (!contact || contact.trim().length === 0) {
      console.warn('[Payment] contractorContact missing — defaulting to "—"');
      return '—';
    }
    return contact.trim();
  }
}
