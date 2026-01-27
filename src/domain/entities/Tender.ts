// Domain Entity: Tender
// Pure business logic without infrastructure concerns

export type TenderStatus = 
  | 'draft' 
  | 'published' 
  | 'open' 
  | 'under_evaluation' 
  | 'awarded' 
  | 'cancelled' 
  | 'closed';

export type SelectionMode = 
  | 'open' 
  | 'restricted' 
  | 'negotiated' 
  | 'direct';

export type MarketType = 
  | 'works' 
  | 'supplies' 
  | 'services' 
  | 'intellectual_services';

export interface EvaluationCriteria {
  name: string;
  weight: number;
  description?: string;
}

export class Tender {
  constructor(
    public readonly id: string,
    public readonly projectId: string | null,
    public readonly title: string,
    public readonly description: string | null,
    public readonly tenderNumber: string | null,
    public readonly status: TenderStatus,
    public readonly selectionMode: SelectionMode | null,
    public readonly marketType: MarketType | null,
    public readonly financingSource: string | null,
    public readonly projectReference: string | null,
    public readonly publicationDate: string | null,
    public readonly deadlineDate: string | null,
    public readonly launchDate: string | null,
    public readonly attributionDate: string | null,
    public readonly budgetMin: number | null,
    public readonly budgetMax: number | null,
    public readonly evaluationCriteria: EvaluationCriteria[],
    public readonly eligibilityRequirements: string[],
    public readonly createdAt: string,
    public readonly updatedAt: string
  ) {}

  // Business logic
  isOpen(): boolean {
    return this.status === 'published' || this.status === 'open';
  }

  isAcceptingSubmissions(): boolean {
    if (!this.isOpen()) return false;
    if (!this.deadlineDate) return true;
    return new Date() < new Date(this.deadlineDate);
  }

  getDaysUntilDeadline(): number | null {
    if (!this.deadlineDate) return null;
    const diff = new Date(this.deadlineDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  isDeadlinePassed(): boolean {
    if (!this.deadlineDate) return false;
    return new Date() > new Date(this.deadlineDate);
  }

  canBePublished(): boolean {
    return this.status === 'draft' && !!this.title && !!this.description;
  }

  canBeAwarded(): boolean {
    return this.status === 'under_evaluation';
  }

  getBudgetRange(): string {
    if (this.budgetMin && this.budgetMax) {
      return `${this.formatAmount(this.budgetMin)} - ${this.formatAmount(this.budgetMax)}`;
    }
    if (this.budgetMin) return `Min: ${this.formatAmount(this.budgetMin)}`;
    if (this.budgetMax) return `Max: ${this.formatAmount(this.budgetMax)}`;
    return 'Non spécifié';
  }

  private formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MR', {
      style: 'currency',
      currency: 'MRU',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Factory method
  static create(params: {
    id: string;
    projectId?: string;
    title: string;
    description?: string;
    tenderNumber?: string;
    selectionMode?: SelectionMode;
    marketType?: MarketType;
    deadlineDate?: string;
    budgetMin?: number;
    budgetMax?: number;
  }): Tender {
    return new Tender(
      params.id,
      params.projectId || null,
      params.title,
      params.description || null,
      params.tenderNumber || null,
      'draft',
      params.selectionMode || null,
      params.marketType || null,
      null,
      null,
      null,
      params.deadlineDate || null,
      null,
      null,
      params.budgetMin || null,
      params.budgetMax || null,
      [],
      [],
      new Date().toISOString(),
      new Date().toISOString()
    );
  }
}
