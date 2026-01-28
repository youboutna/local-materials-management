/**
 * Domain Entity: TenderEstimate
 * Pure business logic without infrastructure concerns
 * Following hexagonal architecture principles
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';

export type TenderEstimateStatus = 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';
export type CurrencyCode = 'MRU' | 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CFA';

// Interface for TenderEstimateItem (used by repository)
export interface TenderEstimateItem {
  id: string;
  estimateId: string;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  specifications?: string;
}

export interface TenderEstimateRisk {
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  score: number;
}

export interface TenderEstimateMetrics {
  totalItems: number;
  totalAmount: number;
  averageItemPrice: number;
  mostExpensiveItem: TenderEstimateItem | null;
  cheapestItem: TenderEstimateItem | null;
  categoryBreakdown: Record<string, number>;
}

export class TenderEstimate {
  // Private fields for encapsulation - Matching DB structure
  private _id: string;
  private _tenderId: string;
  private _projectId?: string;
  private _submittedBy?: string;
  private _status: TenderEstimateStatus;
  private _currency: CurrencyCode;
  private _estimateType: string;
  
  // Financial fields - Matching DB structure
  private _subtotal?: number;
  private _taxAmount?: number;
  private _taxRate?: number;
  private _totalWithTax?: number;
  private _finalTotal?: number;
  
  // Cost breakdown - Matching DB structure
  private _totalMaterialsCost?: number;
  private _totalLaborCost?: number;
  private _totalEquipmentCost?: number;
  
  // Margin calculations - Matching DB structure
  private _overheadPercentage?: number;
  private _overheadAmount?: number;
  private _profitMarginPercentage?: number;
  private _profitMarginAmount?: number;
  
  // Timestamps
  private _createdAt: string;
  private _updatedAt: string;
  
  // Association table items (loaded separately)
  private _items: TenderEstimateItem[];

  constructor(
    id: string,
    tenderId: string,
    status: TenderEstimateStatus,
    currency: CurrencyCode,
    estimateType: string,
    createdAt: string,
    updatedAt: string,
    options: {
      projectId?: string;
      submittedBy?: string;
      subtotal?: number;
      taxAmount?: number;
      taxRate?: number;
      totalWithTax?: number;
      finalTotal?: number;
      totalMaterialsCost?: number;
      totalLaborCost?: number;
      totalEquipmentCost?: number;
      overheadPercentage?: number;
      overheadAmount?: number;
      profitMarginPercentage?: number;
      profitMarginAmount?: number;
      items?: TenderEstimateItem[];
    } = {}
  ) {
    // Validate and assign private fields
    this._id = this.validateId(id);
    this._tenderId = this.validateTenderId(tenderId);
    this._projectId = options.projectId;
    this._submittedBy = options.submittedBy;
    this._status = this.validateStatus(status);
    this._currency = this.validateCurrency(currency);
    this._estimateType = this.validateEstimateType(estimateType);
    
    // Financial fields
    this._subtotal = options.subtotal;
    this._taxAmount = options.taxAmount;
    this._taxRate = options.taxRate;
    this._totalWithTax = options.totalWithTax;
    this._finalTotal = options.finalTotal;
    
    // Cost breakdown
    this._totalMaterialsCost = options.totalMaterialsCost;
    this._totalLaborCost = options.totalLaborCost;
    this._totalEquipmentCost = options.totalEquipmentCost;
    
    // Margins
    this._overheadPercentage = options.overheadPercentage;
    this._overheadAmount = options.overheadAmount;
    this._profitMarginPercentage = options.profitMarginPercentage;
    this._profitMarginAmount = options.profitMarginAmount;
    
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._items = (options.items || []).map(item => this.validateItem(item));
  }

  // ============= Getters =============
  get id(): string { return this._id; }
  get tenderId(): string { return this._tenderId; }
  get projectId(): string | undefined { return this._projectId; }
  get submittedBy(): string | undefined { return this._submittedBy; }
  get status(): TenderEstimateStatus { return this._status; }
  get currency(): CurrencyCode { return this._currency; }
  get estimateType(): string { return this._estimateType; }
  
  // Financial getters
  get subtotal(): number | undefined { return this._subtotal; }
  get taxAmount(): number | undefined { return this._taxAmount; }
  get taxRate(): number | undefined { return this._taxRate; }
  get totalWithTax(): number | undefined { return this._totalWithTax; }
  get finalTotal(): number | undefined { return this._finalTotal; }
  
  // Cost breakdown getters
  get totalMaterialsCost(): number | undefined { return this._totalMaterialsCost; }
  get totalLaborCost(): number | undefined { return this._totalLaborCost; }
  get totalEquipmentCost(): number | undefined { return this._totalEquipmentCost; }
  
  // Margin getters
  get overheadPercentage(): number | undefined { return this._overheadPercentage; }
  get overheadAmount(): number | undefined { return this._overheadAmount; }
  get profitMarginPercentage(): number | undefined { return this._profitMarginPercentage; }
  get profitMarginAmount(): number | undefined { return this._profitMarginAmount; }
  
  get createdAt(): string { return this._createdAt; }
  get updatedAt(): string { return this._updatedAt; }
  get items(): TenderEstimateItem[] { return [...this._items]; }
  
  // ============= Computed Getters with Business Logic =============
  get totalAmount(): number { 
    return this._finalTotal || this._totalWithTax || this.calculateTotalFromItems(); 
  }
  
  get submissionDate(): string { return this._createdAt; }
  
  // Computed notes (not in DB but useful for business logic)
  get notes(): string | undefined { 
    // Notes can be computed from other fields or stored separately
    return undefined; 
  }

  // ============= Getters with Business Logic =============
  get displayName(): string {
    return `Estimate-${this._id.substring(0, 8)}`;
  }

  get formattedTotalAmount(): string {
    return new Intl.NumberFormat('fr-MR', {
      style: 'currency',
      currency: this._currency
    }).format(this.totalAmount);
  }

  // Computed expiry (30 days default from creation)
  get validityPeriod(): number { return 30; } // Default validity
  get expiryDate(): string {
    const expiry = new Date(this._createdAt);
    expiry.setDate(expiry.getDate() + this.validityPeriod);
    return expiry.toISOString();
  }

  get isExpired(): boolean {
    return new Date() > new Date(this.expiryDate);
  }

  get daysUntilExpiry(): number {
    const expiry = new Date(this.expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get canBeEdited(): boolean {
    return this._status === 'draft';
  }

  get canBeSubmitted(): boolean {
    return this._status === 'draft' && this._items.length > 0;
  }

  get canBeReviewed(): boolean {
    return this._status === 'submitted';
  }

  get canBeAccepted(): boolean {
    return this._status === 'under_review' && !this.isExpired;
  }

  get canBeRejected(): boolean {
    return this._status === 'under_review';
  }

  get isFinalized(): boolean {
    return ['accepted', 'rejected'].includes(this._status);
  }

  get riskAssessment(): TenderEstimateRisk {
    const factors: string[] = [];
    let score = 0;

    // Amount-based risk
    if (this._totalAmount > 1000000) {
      score += 40;
      factors.push('High value amount');
    } else if (this._totalAmount > 500000) {
      score += 25;
      factors.push('Medium-high value amount');
    }

    // Validity period risk
    if (this._validityPeriod > 90) {
      score += 15;
      factors.push('Extended validity period');
    } else if (this._validityPeriod < 7) {
      score += 20;
      factors.push('Very short validity period');
    }

    // Item count risk
    if (this._items.length > 50) {
      score += 10;
      factors.push('High number of items');
    } else if (this._items.length < 3) {
      score += 15;
      factors.push('Low number of items');
    }

    // Expiry risk
    if (this.isExpired) {
      score += 50;
      factors.push('Expired estimate');
    } else if (this.daysUntilExpiry < 7) {
      score += 20;
      factors.push('Expiring soon');
    }

    // Determine risk level
    let level: 'low' | 'medium' | 'high' | 'critical';
    if (score >= 80) level = 'critical';
    else if (score >= 60) level = 'high';
    else if (score >= 30) level = 'medium';
    else level = 'low';

    return { level, factors, score };
  }

  get metrics(): TenderEstimateMetrics {
    const totalItems = this._items.length;
    const totalAmount = this._totalAmount;
    const averageItemPrice = totalItems > 0 ? totalAmount / totalItems : 0;

    const sortedItems = [...this._items].sort((a, b) => b.totalPrice - a.totalPrice);
    const mostExpensiveItem = sortedItems[0] || null;
    const cheapestItem = sortedItems[sortedItems.length - 1] || null;

    const categoryBreakdown: Record<string, number> = {};
    this._items.forEach(item => {
      const category = item.category || 'uncategorized';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + item.totalPrice;
    });

    return {
      totalItems,
      totalAmount,
      averageItemPrice,
      mostExpensiveItem,
      cheapestItem,
      categoryBreakdown
    };
  }

  // ============= Setters with Validation =============
  set status(value: TenderEstimateStatus) {
    this._status = this.validateStatusTransition(this._status, value);
    this._updatedAt = new Date().toISOString();
  }

  set subtotal(value: number | undefined) {
    this._subtotal = value ? this.validateAmount(value) : undefined;
    this._updatedAt = new Date().toISOString();
  }

  set taxAmount(value: number | undefined) {
    this._taxAmount = value ? this.validateAmount(value) : undefined;
    this._updatedAt = new Date().toISOString();
  }

  set taxRate(value: number | undefined) {
    this._taxRate = value ? this.validatePercentage(value) : undefined;
    this._updatedAt = new Date().toISOString();
  }

  set totalWithTax(value: number | undefined) {
    this._totalWithTax = value ? this.validateAmount(value) : undefined;
    this._updatedAt = new Date().toISOString();
  }

  set finalTotal(value: number | undefined) {
    this._finalTotal = value ? this.validateAmount(value) : undefined;
    this._updatedAt = new Date().toISOString();
  }

  set totalMaterialsCost(value: number | undefined) {
    this._totalMaterialsCost = value ? this.validateAmount(value) : undefined;
    this._updatedAt = new Date().toISOString();
  }

  set totalLaborCost(value: number | undefined) {
    this._totalLaborCost = value ? this.validateAmount(value) : undefined;
    this._updatedAt = new Date().toISOString();
  }

  set totalEquipmentCost(value: number | undefined) {
    this._totalEquipmentCost = value ? this.validateAmount(value) : undefined;
    this._updatedAt = new Date().toISOString();
  }

  // ============= Business Logic Methods =============
  addItem(item: Omit<TenderEstimateItem, 'id'>): TenderEstimateItem {
    if (!this.canBeEdited) {
      throw new AppError(ErrorCode.BUSINESS_RULE_VIOLATION, 'Cannot add items to estimate in current status');
    }

    const newItem: TenderEstimateItem = {
      id: this.generateItemId(),
      ...item
    };

    this._items.push(newItem);
    this.recalculateFinancials();
    this._updatedAt = new Date().toISOString();

    return newItem;
  }

  removeItem(itemId: string): boolean {
    if (!this.canBeEdited) {
      throw new AppError(ErrorCode.BUSINESS_RULE_VIOLATION, 'Cannot remove items from estimate in current status');
    }

    const initialLength = this._items.length;
    this._items = this._items.filter(item => item.id !== itemId);
    
    if (this._items.length < initialLength) {
      this.recalculateFinancials();
      this._updatedAt = new Date().toISOString();
      return true;
    }

    return false;
  }

  updateItem(itemId: string, updates: Partial<Omit<TenderEstimateItem, 'id'>>): TenderEstimateItem | null {
    if (!this.canBeEdited) {
      throw new AppError(ErrorCode.BUSINESS_RULE_VIOLATION, 'Cannot update items in estimate in current status');
    }

    const itemIndex = this._items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return null;

    const updatedItem = { ...this._items[itemIndex], ...updates };
    this._items[itemIndex] = this.validateItem(updatedItem);
    
    this.recalculateFinancials();
    this._updatedAt = new Date().toISOString();

    return this._items[itemIndex];
  }

  submit(): void {
    if (!this.canBeSubmitted) {
      throw new AppError(ErrorCode.BUSINESS_RULE_VIOLATION, 'Estimate cannot be submitted in current state');
    }

    if (this._items.length === 0) {
      throw new AppError(ErrorCode.BUSINESS_RULE_VIOLATION, 'Cannot submit estimate without items');
    }

    this._status = 'submitted';
    // submissionDate is computed as createdAt
    this._updatedAt = new Date().toISOString();
  }

  accept(): void {
    if (!this.canBeAccepted) {
      throw new AppError(ErrorCode.BUSINESS_RULE_VIOLATION, 'Estimate cannot be accepted in current state');
    }

    if (this.isExpired) {
      throw new AppError(ErrorCode.BUSINESS_RULE_VIOLATION, 'Cannot accept expired estimate');
    }

    this._status = 'accepted';
    this._updatedAt = new Date().toISOString();
  }

  reject(reason?: string): void {
    if (!this.canBeRejected) {
      throw new AppError(ErrorCode.BUSINESS_RULE_VIOLATION, 'Estimate cannot be rejected in current state');
    }

    this._status = 'rejected';
    // Notes are not stored in DB but can be logged separately
    this._updatedAt = new Date().toISOString();
  }

  // ============= Immutability Methods =============
  withStatus(newStatus: TenderEstimateStatus): TenderEstimate {
    return new TenderEstimate(
      this._id,
      this._tenderId,
      this.validateStatusTransition(this._status, newStatus),
      this._currency,
      this._estimateType,
      this._createdAt,
      new Date().toISOString(),
      {
        projectId: this._projectId,
        submittedBy: this._submittedBy,
        subtotal: this._subtotal,
        taxAmount: this._taxAmount,
        taxRate: this._taxRate,
        totalWithTax: this._totalWithTax,
        finalTotal: this._finalTotal,
        totalMaterialsCost: this._totalMaterialsCost,
        totalLaborCost: this._totalLaborCost,
        totalEquipmentCost: this._totalEquipmentCost,
        overheadPercentage: this._overheadPercentage,
        overheadAmount: this._overheadAmount,
        profitMarginPercentage: this._profitMarginPercentage,
        profitMarginAmount: this._profitMarginAmount,
        items: [...this._items]
      }
    );
  }

  withUpdatedItems(items: TenderEstimateItem[]): TenderEstimate {
    return new TenderEstimate(
      this._id,
      this._tenderId,
      this._status,
      this._currency,
      this._estimateType,
      this._createdAt,
      new Date().toISOString(),
      {
        projectId: this._projectId,
        submittedBy: this._submittedBy,
        subtotal: this._subtotal,
        taxAmount: this._taxAmount,
        taxRate: this._taxRate,
        totalWithTax: this._totalWithTax,
        finalTotal: this._finalTotal,
        totalMaterialsCost: this._totalMaterialsCost,
        totalLaborCost: this._totalLaborCost,
        totalEquipmentCost: this._totalEquipmentCost,
        overheadPercentage: this._overheadPercentage,
        overheadAmount: this._overheadAmount,
        profitMarginPercentage: this._profitMarginPercentage,
        profitMarginAmount: this._profitMarginAmount,
        items
      }
    );
  }

  // ============= Factory Methods =============
  static create(params: {
    tenderId: string;
    currency: CurrencyCode;
    estimateType?: string;
    projectId?: string;
    submittedBy?: string;
  }): TenderEstimate {
    const id = `estimate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    return new TenderEstimate(
      id,
      params.tenderId,
      'draft',
      params.currency,
      params.estimateType || 'standard',
      now,
      now,
      {
        projectId: params.projectId,
        submittedBy: params.submittedBy
      }
    );
  }

  // ============= Private Validation Methods =============
  private validateId(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Estimate ID is required');
    }
    return id.trim();
  }

  private validateTenderId(tenderId: string): string {
    if (!tenderId || tenderId.trim().length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender ID is required');
    }
    return tenderId.trim();
  }

  private validateEstimateType(estimateType: string): string {
    if (!estimateType || estimateType.trim().length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Estimate type is required');
    }
    return estimateType.trim();
  }

  private validateStatus(status: TenderEstimateStatus): TenderEstimateStatus {
    const validStatuses: TenderEstimateStatus[] = ['draft', 'submitted', 'under_review', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid status: ${status}`);
    }
    return status;
  }

  private validateCurrency(currency: CurrencyCode): CurrencyCode {
    const validCurrencies: CurrencyCode[] = ['MRU', 'EUR', 'USD', 'GBP', 'JPY', 'CFA'];
    if (!validCurrencies.includes(currency)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid currency: ${currency}`);
    }
    return currency;
  }

  private validateAmount(amount: number): number {
    if (amount < 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Amount must be non-negative');
    }
    if (amount > 999999999) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Amount too large');
    }
    return amount;
  }

  private validatePercentage(percentage: number): number {
    if (percentage < 0 || percentage > 100) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Percentage must be between 0 and 100');
    }
    return percentage;
  }

  private validateItem(item: TenderEstimateItem): TenderEstimateItem {
    if (!item.itemCode || item.itemCode.trim().length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item code is required');
    }
    if (!item.description || item.description.trim().length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item description is required');
    }
    if (!item.unit || item.unit.trim().length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item unit is required');
    }
    if (item.quantity <= 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item quantity must be positive');
    }
    if (item.unitPrice <= 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item unit price must be positive');
    }
    if (item.totalPrice !== item.quantity * item.unitPrice) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item total price must equal quantity × unit price');
    }
    return item;
  }

  private validateStatusTransition(current: TenderEstimateStatus, next: TenderEstimateStatus): TenderEstimateStatus {
    const validTransitions: Record<TenderEstimateStatus, TenderEstimateStatus[]> = {
      'draft': ['submitted', 'rejected'],
      'submitted': ['under_review', 'rejected'],
      'under_review': ['accepted', 'rejected'],
      'accepted': [], // Terminal state
      'rejected': ['submitted'] // Can be resubmitted
    };

    if (!validTransitions[current].includes(next)) {
      throw new AppError(ErrorCode.BUSINESS_RULE_VIOLATION, `Invalid status transition from ${current} to ${next}`);
    }

    return next;
  }

  private calculateTotalFromItems(): number {
    return this._items.reduce((total, item) => total + item.totalPrice, 0);
  }

  private recalculateFinancials(): void {
    // Recalculate subtotal from items
    this._subtotal = this.calculateTotalFromItems();
    
    // Recalculate tax if tax rate is set
    if (this._taxRate !== undefined && this._subtotal !== undefined) {
      this._taxAmount = this._subtotal * (this._taxRate / 100);
      this._totalWithTax = this._subtotal + this._taxAmount;
    }
    
    // Update final total
    this._finalTotal = this._totalWithTax || this._subtotal;
  }

  private generateItemId(): string {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============= Serialization =============
  toPlainObject(): Record<string, unknown> {
    return {
      id: this._id,
      tenderId: this._tenderId,
      projectId: this._projectId,
      submittedBy: this._submittedBy,
      status: this._status,
      currency: this._currency,
      estimateType: this._estimateType,
      subtotal: this._subtotal,
      taxAmount: this._taxAmount,
      taxRate: this._taxRate,
      totalWithTax: this._totalWithTax,
      finalTotal: this._finalTotal,
      totalMaterialsCost: this._totalMaterialsCost,
      totalLaborCost: this._totalLaborCost,
      totalEquipmentCost: this._totalEquipmentCost,
      overheadPercentage: this._overheadPercentage,
      overheadAmount: this._overheadAmount,
      profitMarginPercentage: this._profitMarginPercentage,
      profitMarginAmount: this._profitMarginAmount,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      items: [...this._items],
      // Computed properties
      displayName: this.displayName,
      formattedTotalAmount: this.formattedTotalAmount,
      expiryDate: this.expiryDate,
      isExpired: this.isExpired,
      daysUntilExpiry: this.daysUntilExpiry,
      canBeEdited: this.canBeEdited,
      canBeSubmitted: this.canBeSubmitted,
      canBeReviewed: this.canBeReviewed,
      canBeAccepted: this.canBeAccepted,
      canBeRejected: this.canBeRejected,
      isFinalized: this.isFinalized,
      riskAssessment: this.riskAssessment,
      metrics: this.metrics
    };
  }
}
