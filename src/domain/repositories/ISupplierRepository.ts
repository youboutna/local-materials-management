// Repository interface for Supplier entity
import { Supplier, SupplierStatus, SupplierCategory } from '../entities/Supplier';

export interface ISupplierRepository {
  // CRUD operations
  findById(id: string): Promise<Supplier | null>;
  findAll(): Promise<Supplier[]>;
  save(supplier: Supplier): Promise<void>;
  update(id: string, data: Partial<Supplier>): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Query methods
  findByStatus(status: SupplierStatus): Promise<Supplier[]>;
  findByCategory(category: SupplierCategory): Promise<Supplier[]>;
  findByWorkspace(workspaceId: string): Promise<Supplier[]>;
  findByNif(nif: string): Promise<Supplier | null>;
  findByEmail(email: string): Promise<Supplier | null>;
  
  // Search
  search(query: string): Promise<Supplier[]>;
  
  // Tender eligibility
  findActive(): Promise<Supplier[]>;
  findVerified(): Promise<Supplier[]>;
  findEligibleForTenders(): Promise<Supplier[]>;
  findBlacklisted(): Promise<Supplier[]>;
  
  // Rating
  findByMinimumRating(rating: number): Promise<Supplier[]>;
  getTopRated(limit: number): Promise<Supplier[]>;
  
  // Statistics
  countByStatus(): Promise<Record<SupplierStatus, number>>;
  countByCategory(): Promise<Record<SupplierCategory, number>>;
}
