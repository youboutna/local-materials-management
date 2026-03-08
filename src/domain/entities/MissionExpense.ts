/**
 * Mission Expense Entity
 * Pure domain entity for mission expense business logic
 * Following hexagonal architecture: Props interface + create() factory
 */

export enum MissionExpenseStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid'
}

export enum MissionExpenseCategory {
  TRANSPORT = 'transport',
  ACCOMMODATION = 'accommodation',
  MEALS = 'meals',
  MATERIALS = 'materials',
  EQUIPMENT = 'equipment',
  OTHER = 'other'
}

export interface MissionExpenseProps {
  id: string;
  missionId: string;
  recordedBy: string;
  amount: number;
  category: MissionExpenseCategory;
  description: string;
  recordedAt?: string;
  updatedAt?: string;
  receiptUrl?: string;
  receiptNumber?: string;
  status?: MissionExpenseStatus;
  approvedAt?: string;
  approvedBy?: string;
  currency?: string;
  exchangeRate?: number;
  originalAmount?: number;
  originalCurrency?: string;
  notes?: string;
  tags?: string[];
  location?: string;
  projectPhase?: string;
}

export interface IMissionExpense {
  readonly id: string;
  readonly missionId: string;
  readonly recordedBy: string;
  readonly recordedAt: string;
  readonly updatedAt: string;
  readonly amount: number;
  readonly category: MissionExpenseCategory;
  readonly description: string;
  readonly receiptUrl?: string;
  readonly receiptNumber?: string;
  readonly status: MissionExpenseStatus;
  readonly approvedAt?: string;
  readonly approvedBy?: string;
  readonly currency: string;
  readonly exchangeRate?: number;
  readonly originalAmount?: number;
  readonly originalCurrency?: string;
  readonly notes?: string;
  readonly tags?: string[];
  readonly location?: string;
  readonly projectPhase?: string;
}

export class MissionExpense implements IMissionExpense {
  public readonly id: string;
  public readonly missionId: string;
  public readonly recordedBy: string;
  public readonly recordedAt: string;
  public readonly updatedAt: string;
  public readonly amount: number;
  public readonly category: MissionExpenseCategory;
  public readonly description: string;
  public readonly receiptUrl: string | undefined;
  public readonly receiptNumber: string | undefined;
  public readonly status: MissionExpenseStatus;
  public readonly approvedAt: string | undefined;
  public readonly approvedBy: string | undefined;
  public readonly currency: string;
  public readonly exchangeRate?: number;
  public readonly originalAmount?: number;
  public readonly originalCurrency?: string;
  public readonly notes?: string;
  public readonly tags?: string[];
  public readonly location?: string;
  public readonly projectPhase?: string;

  private constructor(props: MissionExpenseProps) {
    this.id = props.id;
    this.missionId = props.missionId;
    this.recordedBy = props.recordedBy;
    this.recordedAt = props.recordedAt ?? new Date().toISOString();
    this.updatedAt = props.updatedAt ?? new Date().toISOString();
    this.amount = props.amount;
    this.category = props.category;
    this.description = props.description;
    this.receiptUrl = props.receiptUrl;
    this.receiptNumber = props.receiptNumber;
    this.status = props.status ?? MissionExpenseStatus.PENDING;
    this.approvedAt = props.approvedAt;
    this.approvedBy = props.approvedBy;
    this.currency = props.currency ?? 'MRU';
    this.exchangeRate = props.exchangeRate;
    this.originalAmount = props.originalAmount;
    this.originalCurrency = props.originalCurrency;
    this.notes = props.notes;
    this.tags = props.tags;
    this.location = props.location;
    this.projectPhase = props.projectPhase;
  }

  // ============= Factory Method =============
  static create(props: MissionExpenseProps): MissionExpense {
    return new MissionExpense(props);
  }

  // Business logic methods
  isPending(): boolean {
    return this.status === MissionExpenseStatus.PENDING;
  }

  isApproved(): boolean {
    return this.status === MissionExpenseStatus.APPROVED;
  }

  isPaid(): boolean {
    return this.status === MissionExpenseStatus.PAID;
  }

  isRejected(): boolean {
    return this.status === MissionExpenseStatus.REJECTED;
  }

  canBeApproved(): boolean {
    return this.isPending() && this.amount > 0;
  }

  getAmountInCurrency(): number {
    if (this.exchangeRate && this.originalAmount) {
      return this.originalAmount * this.exchangeRate;
    }
    return this.amount;
  }

  getCategoryLabel(): string {
    switch (this.category) {
      case MissionExpenseCategory.TRANSPORT: return 'Transport';
      case MissionExpenseCategory.ACCOMMODATION: return 'Hébergement';
      case MissionExpenseCategory.MEALS: return 'Repas';
      case MissionExpenseCategory.MATERIALS: return 'Matériaux';
      case MissionExpenseCategory.EQUIPMENT: return 'Équipement';
      case MissionExpenseCategory.OTHER: return 'Autre';
      default: return this.category;
    }
  }

  getStatusLabel(): string {
    switch (this.status) {
      case MissionExpenseStatus.PENDING: return 'En attente';
      case MissionExpenseStatus.APPROVED: return 'Approuvé';
      case MissionExpenseStatus.REJECTED: return 'Rejeté';
      case MissionExpenseStatus.PAID: return 'Payé';
      default: return this.status;
    }
  }
}