/**
 * Mission Expense Entity
 * Pure domain entity for mission expense business logic
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

export interface MissionExpense {
  // Core identification
  readonly id: string;
  readonly missionId: string;
  readonly recordedBy: string;
  readonly recordedAt: string;
  readonly updatedAt: string;

  // Expense details
  readonly amount: number;
  readonly category: MissionExpenseCategory;
  readonly description: string;
  readonly receiptUrl?: string;
  readonly receiptNumber?: string;

  // Status and approval
  readonly status: MissionExpenseStatus;
  readonly approvedAt?: string;
  readonly approvedBy?: string;

  // Financial details
  readonly currency: string;
  readonly exchangeRate?: number;
  readonly originalAmount?: number;
  readonly originalCurrency?: string;

  // Metadata
  readonly notes?: string;
  readonly tags?: string[];
  readonly location?: string;
  readonly projectPhase?: string;
}

export class MissionExpense implements MissionExpense {
  constructor(
    public readonly id: string,
    public readonly missionId: string,
    public readonly recordedBy: string,
    public readonly recordedAt: string,
    public readonly updatedAt: string,
    public readonly amount: number,
    public readonly category: MissionExpenseCategory,
    public readonly description: string,
    public readonly receiptUrl: string | undefined,
    public readonly receiptNumber: string | undefined,
    public readonly status: MissionExpenseStatus,
    public readonly approvedAt: string | undefined,
    public readonly approvedBy: string | undefined,
    public readonly currency: string = 'MRU',
    public readonly exchangeRate?: number,
    public readonly originalAmount?: number,
    public readonly originalCurrency?: string,
    public readonly notes?: string,
    public readonly tags?: string[],
    public readonly location?: string,
    public readonly projectPhase?: string
  ) {}

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
      case MissionExpenseCategory.TRANSPORT:
        return 'Transport';
      case MissionExpenseCategory.ACCOMMODATION:
        return 'Hébergement';
      case MissionExpenseCategory.MEALS:
        return 'Repas';
      case MissionExpenseCategory.MATERIALS:
        return 'Matériaux';
      case MissionExpenseCategory.EQUIPMENT:
        return 'Équipement';
      case MissionExpenseCategory.OTHER:
        return 'Autre';
      default:
        return this.category;
    }
  }

  getStatusLabel(): string {
    switch (this.status) {
      case MissionExpenseStatus.PENDING:
        return 'En attente';
      case MissionExpenseStatus.APPROVED:
        return 'Approuvé';
      case MissionExpenseStatus.REJECTED:
        return 'Rejeté';
      case MissionExpenseStatus.PAID:
        return 'Payé';
      default:
        return this.status;
    }
  }
}
