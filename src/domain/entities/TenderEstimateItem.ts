/**
 * Domain Entity: TenderEstimateItem
 * Pure business logic without infrastructure concerns
 * Following hexagonal architecture principles
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';

export class TenderEstimateItem {
  // Private fields for encapsulation
  private _id: string;
  private _estimateId: string;
  private _itemCode: string;
  private _description: string;
  private _unit: string;
  private _quantity: number;
  private _unitPrice: number;
  private _totalPrice: number;
  private _category?: string;
  private _specifications?: string;
  private _createdAt: string;
  private _updatedAt: string;

  constructor(
    id: string,
    estimateId: string,
    itemCode: string,
    description: string,
    unit: string,
    quantity: number,
    unitPrice: number,
    totalPrice: number,
    category?: string,
    specifications?: string,
    createdAt?: string,
    updatedAt?: string
  ) {
    // Validate required fields
    if (!id || !estimateId || !itemCode || !description || !unit) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Required fields cannot be empty');
    }

    if (quantity <= 0 || unitPrice <= 0 || totalPrice <= 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Quantity and prices must be positive');
    }

    this._id = id;
    this._estimateId = estimateId;
    this._itemCode = itemCode;
    this._description = description;
    this._unit = unit;
    this._quantity = quantity;
    this._unitPrice = unitPrice;
    this._totalPrice = totalPrice;
    this._category = category;
    this._specifications = specifications;
    this._createdAt = createdAt || new Date().toISOString();
    this._updatedAt = updatedAt || new Date().toISOString();
  }

  // Getters
  get id(): string { return this._id; }
  get estimateId(): string { return this._estimateId; }
  get itemCode(): string { return this._itemCode; }
  get description(): string { return this._description; }
  get unit(): string { return this._unit; }
  get quantity(): number { return this._quantity; }
  get unitPrice(): number { return this._unitPrice; }
  get totalPrice(): number { return this._totalPrice; }
  get category(): string | undefined { return this._category; }
  get specifications(): string | undefined { return this._specifications; }
  get createdAt(): string { return this._createdAt; }
  get updatedAt(): string { return this._updatedAt; }

  // Business logic methods
  updateQuantity(newQuantity: number): void {
    if (newQuantity <= 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Quantity must be positive');
    }
    
    this._quantity = newQuantity;
    this._totalPrice = newQuantity * this._unitPrice;
    this._updatedAt = new Date().toISOString();
  }

  updateUnitPrice(newUnitPrice: number): void {
    if (newUnitPrice <= 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Unit price must be positive');
    }
    
    this._unitPrice = newUnitPrice;
    this._totalPrice = this._quantity * newUnitPrice;
    this._updatedAt = new Date().toISOString();
  }

  updateDescription(newDescription: string): void {
    if (!newDescription.trim()) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Description cannot be empty');
    }
    
    this._description = newDescription.trim();
    this._updatedAt = new Date().toISOString();
  }

  updateCategory(newCategory?: string): void {
    this._category = newCategory?.trim();
    this._updatedAt = new Date().toISOString();
  }

  updateSpecifications(newSpecifications?: string): void {
    this._specifications = newSpecifications?.trim();
    this._updatedAt = new Date().toISOString();
  }

  // Validation methods
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this._id.trim()) errors.push('ID is required');
    if (!this._estimateId.trim()) errors.push('Estimate ID is required');
    if (!this._itemCode.trim()) errors.push('Item code is required');
    if (!this._description.trim()) errors.push('Description is required');
    if (!this._unit.trim()) errors.push('Unit is required');
    if (this._quantity <= 0) errors.push('Quantity must be positive');
    if (this._unitPrice <= 0) errors.push('Unit price must be positive');
    if (this._totalPrice <= 0) errors.push('Total price must be positive');

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Calculate derived values
  calculateMarginPercentage(): number {
    return this._totalPrice > 0 ? ((this._totalPrice - (this._quantity * this._unitPrice)) / this._totalPrice) * 100 : 0;
  }

  // Factory method
  static create(
    estimateId: string,
    itemCode: string,
    description: string,
    unit: string,
    quantity: number,
    unitPrice: number,
    category?: string,
    specifications?: string
  ): TenderEstimateItem {
    const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const totalPrice = quantity * unitPrice;
    
    return new TenderEstimateItem(
      id,
      estimateId,
      itemCode,
      description,
      unit,
      quantity,
      unitPrice,
      totalPrice,
      category,
      specifications
    );
  }

  // To plain object for repository operations
  toPlainObject(): TenderEstimateItemData {
    return {
      id: this._id,
      estimateId: this._estimateId,
      itemCode: this._itemCode,
      description: this._description,
      unit: this._unit,
      quantity: this._quantity,
      unitPrice: this._unitPrice,
      totalPrice: this._totalPrice,
      category: this._category,
      specifications: this._specifications,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}

// Interface for repository operations
export interface TenderEstimateItemData {
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
  createdAt: string;
  updatedAt: string;
}
