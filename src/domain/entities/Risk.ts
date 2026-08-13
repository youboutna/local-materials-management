// Domain Entity: Risk
// Pure business logic without infrastructure concerns
// Cache invalidation fix - v3 - RiskStatus export issue

export type RiskStatus = 'identified' | 'monitored' | 'mitigated' | 'resolved';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskCategory = 'technical' | 'financial' | 'operational' | 'strategic' | 'compliance' | 'safety';

// Forward declarations to avoid circular dependencies
export interface IProject {
  id: string;
  title: string;
}

export interface IEmployee {
  id: string;
  fullName: string;
  user?: {
    id: string;
  };
}

/**
 * Détails opérationnels d'un risque (plans, coûts, échéances).
 * Optionnels: ne participent pas aux invariants du risque.
 */
export interface RiskDetails {
  mitigationPlan?: string | null;
  contingencyPlan?: string | null;
  costs?: number | null;
  timelineImpact?: number | null;
  reviewDate?: string | null;
  ownerId?: string | null;
  dueDate?: string | null;
}

export class Risk {
  // Private fields for encapsulation
  private _id: string;
  private _project: IProject | null;
  private _title: string;
  private _description: string | null;
  private _probability: number; // 0-1
  private _impact: number; // 0-1
  private _status: RiskStatus;
  private _category: RiskCategory;
  private _mitigationStrategy: string | null;
  private _identifiedBy: IEmployee | null;
  private _identifiedDate: string | null;
  private _relatedTasks: string[];
  private _createdAt: string;
  private _updatedAt: string;
  private _details: RiskDetails;


  constructor(
    id: string,
    project: IProject | null,
    title: string,
    description: string | null,
    probability: number, // 0-1
    impact: number, // 0-1
    status: RiskStatus,
    category: RiskCategory,
    mitigationStrategy: string | null,
    identifiedBy: IEmployee | null,
    identifiedDate: string | null,
    relatedTasks: string[],
    createdAt: string,
    updatedAt: string
  ) {
    // Validate and assign private fields
    this._id = this.validateId(id);
    this._project = project;
    this._title = this.validateTitle(title);
    this._description = description;
    this._probability = this.validateProbability(probability);
    this._impact = this.validateImpact(impact);
    this._status = this.validateStatus(status);
    this._category = this.validateCategory(category);
    this._mitigationStrategy = mitigationStrategy;
    this._identifiedBy = identifiedBy;
    this._identifiedDate = identifiedDate;
    this._relatedTasks = relatedTasks || [];
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ============= Getters =============
  get id(): string { return this._id; }
  get project(): IProject | null { return this._project; }
  get projectId(): string { return this._project?.id || ''; }
  get title(): string { return this._title; }
  get description(): string | null { return this._description; }
  get probability(): number { return this._probability; }
  get impact(): number { return this._impact; }
  get status(): RiskStatus { return this._status; }
  get category(): RiskCategory { return this._category; }
  
  // Backward compatibility method
  getCategory(): RiskCategory {
    return this._category;
  }
  
  get mitigationStrategy(): string | null { return this._mitigationStrategy; }
  get identifiedBy(): IEmployee | null { return this._identifiedBy; }
  get identifiedByUserId(): string | null { return this._identifiedBy?.user?.id || null; }
  get identifiedDate(): string | null { return this._identifiedDate; }
  get relatedTasks(): string[] { return this._relatedTasks; }
  get createdAt(): string { return this._createdAt; }
  get updatedAt(): string { return this._updatedAt; }

  // ============= Getters with Business Logic =============
  get displayName(): string {
    return this._title || `Risk-${this._id}`;
  }

  getProbabilityLabel(): string {
    if (this._probability >= 0.8) return 'Très élevée';
    if (this._probability >= 0.6) return 'Élevée';
    if (this._probability >= 0.4) return 'Moyenne';
    if (this._probability >= 0.2) return 'Faible';
    return 'Très faible';
  }

  getImpactLabel(): string {
    if (this._impact >= 0.8) return 'Critique';
    if (this._impact >= 0.6) return 'Élevé';
    if (this._impact >= 0.4) return 'Modéré';
    if (this._impact >= 0.2) return 'Mineur';
    return 'Négligeable';
  }

  // ============= Setters with Validation =============
  set title(value: string) { 
    this._title = this.validateTitle(value); 
    this._updatedAt = new Date().toISOString();
  }
  
  set description(value: string | null) { 
    this._description = value; 
    this._updatedAt = new Date().toISOString();
  }
  
  set probability(value: number) { 
    this._probability = this.validateProbability(value); 
    this._updatedAt = new Date().toISOString();
  }
  
  set impact(value: number) { 
    this._impact = this.validateImpact(value); 
    this._updatedAt = new Date().toISOString();
  }
  
  set status(value: RiskStatus) { 
    this._status = this.validateStatus(value); 
    this._updatedAt = new Date().toISOString();
  }
  
  set mitigationStrategy(value: string | null) { 
    this._mitigationStrategy = value; 
    this._updatedAt = new Date().toISOString();
  }
  
  set category(value: RiskCategory) { 
    this._category = this.validateCategory(value); 
    this._updatedAt = new Date().toISOString();
  }
  
  set relatedTasks(value: string[]) { 
    this._relatedTasks = value || []; 
    this._updatedAt = new Date().toISOString();
  }

  // ============= Business Logic Methods =============
  getRiskScore(): number {
    return this._probability * this._impact;
  }

  getRiskLevel(): RiskLevel {
    const score = this.getRiskScore();
    if (score >= 0.7) return 'critical';
    if (score >= 0.5) return 'high';
    if (score >= 0.3) return 'medium';
    return 'low';
  }

  isHighRisk(): boolean {
    return this.getRiskLevel() === 'high' || this.getRiskLevel() === 'critical';
  }

  requiresImmediateAttention(): boolean {
    return this.getRiskLevel() === 'critical' && this._status !== 'resolved';
  }

  // ============= Immutability Methods =============
  withStatus(newStatus: RiskStatus): Risk {
    return new Risk(
      this._id,
      this._project,
      this._title,
      this._description,
      this._probability,
      this._impact,
      this.validateStatus(newStatus),
      this._category,
      this._mitigationStrategy,
      this._identifiedBy,
      this._identifiedDate,
      this._relatedTasks,
      this._createdAt,
      new Date().toISOString()
    );
  }

  withProbability(newProbability: number): Risk {
    return new Risk(
      this._id,
      this._project,
      this._title,
      this._description,
      this.validateProbability(newProbability),
      this._impact,
      this._status,
      this._category,
      this._mitigationStrategy,
      this._identifiedBy,
      this._identifiedDate,
      this._relatedTasks,
      this._createdAt,
      new Date().toISOString()
    );
  }

  withImpact(newImpact: number): Risk {
    return new Risk(
      this._id,
      this._project,
      this._title,
      this._description,
      this._probability,
      this.validateImpact(newImpact),
      this._status,
      this._category,
      this._mitigationStrategy,
      this._identifiedBy,
      this._identifiedDate,
      this._relatedTasks,
      this._createdAt,
      new Date().toISOString()
    );
  }

  withCategory(newCategory: RiskCategory): Risk {
    return new Risk(
      this._id,
      this._project,
      this._title,
      this._description,
      this._probability,
      this._impact,
      this._status,
      this.validateCategory(newCategory),
      this._mitigationStrategy,
      this._identifiedBy,
      this._identifiedDate,
      this._relatedTasks,
      this._createdAt,
      new Date().toISOString()
    );
  }

  withRelatedTasks(newRelatedTasks: string[]): Risk {
    return new Risk(
      this._id,
      this._project,
      this._title,
      this._description,
      this._probability,
      this._impact,
      this._status,
      this._category,
      this._mitigationStrategy,
      this._identifiedBy,
      this._identifiedDate,
      newRelatedTasks || [],
      this._createdAt,
      new Date().toISOString()
    );
  }

  // ============= Factory Methods =============
  static create(params: {
    id: string;
    project: IProject | null;
    title: string;
    description?: string;
    probability?: number;
    impact?: number;
    status?: RiskStatus;
    category?: RiskCategory;
    identifiedBy?: IEmployee | null;
  }): Risk {
    return new Risk(
      params.id,
      params.project || null,
      params.title,
      params.description || null,
      params.probability || 0.5,
      params.impact || 0.5,
      params.status || 'identified',
      params.category || 'operational',
      null, // mitigationStrategy
      params.identifiedBy || null,
      new Date().toISOString(), // identifiedDate
      [], // relatedTasks
      new Date().toISOString(),
      new Date().toISOString()
    );
  }

  // ============= Data Transformation Methods =============
  toPlainObject(): Record<string, unknown> {
    return {
      id: this._id,
      project_id: this._project?.id || null,
      title: this._title,
      description: this._description,
      probability: this._probability,
      impact: this._impact,
      status: this._status,
      category: this._category,
      mitigation_strategy: this._mitigationStrategy,
      identified_by: this._identifiedBy?.id || null,
      identified_date: this._identifiedDate,
      related_tasks: this._relatedTasks,
      created_at: this._createdAt,
      updated_at: this._updatedAt
    };
  }

  // ============= Validation Methods =============
  private validateId(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new Error('Risk ID is required');
    }
    return id.trim();
  }

  private validateTitle(title: string): string {
    if (!title || title.trim().length === 0) {
      throw new Error('Risk title is required');
    }
    if (title.length > 500) {
      throw new Error('Risk title must be less than 500 characters');
    }
    return title.trim();
  }

  private validateProbability(probability: number): number {
    if (probability < 0 || probability > 1) {
      throw new Error('Probability must be between 0 and 1');
    }
    return probability;
  }

  private validateImpact(impact: number): number {
    if (impact < 0 || impact > 1) {
      throw new Error('Impact must be between 0 and 1');
    }
    return impact;
  }

  private validateStatus(status: RiskStatus): RiskStatus {
    const validStatuses: RiskStatus[] = ['identified', 'monitored', 'mitigated', 'resolved'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid risk status: ${status}`);
    }
    return status;
  }

  private validateCategory(category: RiskCategory): RiskCategory {
    const validCategories: RiskCategory[] = ['technical', 'financial', 'operational', 'strategic', 'compliance', 'safety'];
    
    if (!validCategories.includes(category)) {
      throw new Error(`Invalid risk category: ${category}`);
    }
    return category;
  }
}
