/**
 * Shared DTOs and Common Interfaces
 * Reusable DTOs across different domains
 */

// Base entity interface
export interface BaseEntityDTO {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Common user/contact information
export interface ContactInfoDTO {
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
}

// Common audit fields
export interface AuditFieldsDTO {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// Common status enums
export enum CommonStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DRAFT = 'draft'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Common pagination
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Common API response
export interface ApiResponseDTO<T> {
  data: T[];
  pagination: PaginationDTO;
  error?: string;
  message?: string;
  success: boolean;
}

// Common search and filter
export interface SearchParamsDTO {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, string | number | boolean>;
}

// Common file/document
export interface FileDTO {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy?: string;
}

// Common location
export interface LocationDTO {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  country?: string;
}

// Common validation
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: string | number | boolean) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors?: Record<string, string[]>;
}

// Common transformer interface
export interface Transformer<Entity, DTO> {
  toDTO: (entity: Entity) => DTO;
  fromDTO: (dto: Partial<DTO>) => Partial<Entity>;
  validate: (dto: Partial<DTO>) => ValidationResult;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Common date utilities
export interface DateRangeDTO {
  startDate: string;
  endDate?: string;
}

// Common monetary values
export interface MonetaryDTO {
  amount: number;
  currency?: string;
  formatted?: string;
}

// Common status with timestamps
export interface StatusHistoryDTO {
  status: string;
  changedAt: string;
  changedBy?: string;
  reason?: string;
}
