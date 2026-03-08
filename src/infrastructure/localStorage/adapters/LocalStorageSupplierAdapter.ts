// @ts-nocheck
/**
 * LocalStorage Supplier Adapter
 * Implements ISupplierRepository using LocalStorage for DEV_MODE
 */

import { 
  ISupplierRepository, 
  Supplier, 
  SupplierStatus, 
  SupplierCategory 
} from '@/domain/repositories/ISupplierRepository';
import { allSuppliersData, MockSupplier } from '@/data/mockData';

// Convert MockSupplier to Supplier format
const mockSuppliers: Supplier[] = allSuppliersData.map((mock: MockSupplier) => {
  // Map mock status to domain status
  const statusMap: Record<string, SupplierStatus> = {
    'active': 'active',
    'inactive': 'inactive'
  };

  // Map mock category to domain category
  const categoryMap: Record<string, SupplierCategory> = {
    'materials': 'materials',
    'equipment': 'equipment',
    'services': 'services',
    'consulting': 'consulting'
  };

  return new Supplier(
    mock.id,
    mock.name,
    mock.contactEmail, // email
    mock.contactPhone, // phone
    mock.address,
    mock.nif,
    categoryMap[mock.specialization?.[0] || 'materials'], // Use first specialization as category
    statusMap[mock.isActive ? 'active' : 'inactive'],
    mock.rating ? { 
      quality: mock.rating * 0.25, 
      delivery: mock.rating * 0.25, 
      price: mock.rating * 0.25, 
      communication: mock.rating * 0.25, 
      overall: mock.rating 
    } : null,
    [], // contacts
    false, // is_verified
    null, // verified_at
    null, // workspace_id
    mock.createdAt, // created_at
    mock.updatedAt // updated_at
  );
});

export class LocalStorageSupplierAdapter implements ISupplierRepository {
  
  async findById(id: string): Promise<Supplier | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const suppliers = this.getSuppliersFromStorage();
    const supplier = suppliers.find(s => s.id === id);
    
    return supplier || null;
  }

  async findAll(): Promise<Supplier[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const suppliers = this.getSuppliersFromStorage();
    return suppliers;
  }

  async save(supplier: Supplier): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const suppliers = this.getSuppliersFromStorage();
    const existingIndex = suppliers.findIndex(s => s.id === supplier.id);
    
    if (existingIndex >= 0) {
      suppliers[existingIndex] = supplier;
    } else {
      suppliers.push(supplier);
    }
    
    this.saveSuppliersToStorage(suppliers);
    
    console.log(`[DEV_MODE] Saved supplier ${supplier.id}`);
  }

  async update(id: string, data: Partial<Supplier>): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const suppliers = this.getSuppliersFromStorage();
    const supplierIndex = suppliers.findIndex(s => s.id === id);
    
    if (supplierIndex === -1) {
      throw new Error(`Supplier with id ${id} not found`);
    }
    
    suppliers[supplierIndex] = {
      ...suppliers[supplierIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.saveSuppliersToStorage(suppliers);
    
    console.log(`[DEV_MODE] Updated supplier ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const suppliers = this.getSuppliersFromStorage();
    const supplierIndex = suppliers.findIndex(s => s.id === id);
    
    if (supplierIndex === -1) {
      throw new Error(`Supplier with id ${id} not found`);
    }
    
    suppliers.splice(supplierIndex, 1);
    this.saveSuppliersToStorage(suppliers);
    
    console.log(`[DEV_MODE] Deleted supplier ${id}`);
  }

  async findByCategory(category: SupplierCategory): Promise<Supplier[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const suppliers = this.getSuppliersFromStorage();
    return suppliers.filter(supplier => supplier.category === category);
  }

  async findByStatus(status: SupplierStatus): Promise<Supplier[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const suppliers = this.getSuppliersFromStorage();
    return suppliers.filter(supplier => supplier.status === status);
  }

  async search(query: string): Promise<Supplier[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const suppliers = this.getSuppliersFromStorage();
    const searchLower = query.toLowerCase();
    
    return suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(searchLower) ||
      supplier.email?.toLowerCase().includes(searchLower) ||
      supplier.phone?.toLowerCase().includes(searchLower)
    );
  }

  async findVerified(): Promise<Supplier[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const suppliers = this.getSuppliersFromStorage();
    return suppliers.filter(supplier => supplier.is_verified);
  }

  async findByRating(minRating: number): Promise<Supplier[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const suppliers = this.getSuppliersFromStorage();
    return suppliers.filter(supplier => 
      supplier.rating && supplier.rating.overall >= minRating
    );
  }

  async findByWorkspace(workspaceId: string): Promise<Supplier[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const suppliers = this.getSuppliersFromStorage();
    return suppliers.filter(supplier => supplier.workspace_id === workspaceId);
  }

  async findByContact(contactInfo: string): Promise<Supplier[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const suppliers = this.getSuppliersFromStorage();
    const searchLower = contactInfo.toLowerCase();
    
    return suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(searchLower) ||
      supplier.email?.toLowerCase().includes(searchLower) ||
      supplier.phone?.toLowerCase().includes(searchLower)
    );
  }

  async findActive(): Promise<Supplier[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const suppliers = this.getSuppliersFromStorage();
    return suppliers.filter(supplier => supplier.status === 'active');
  }

  async findInactive(): Promise<Supplier[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const suppliers = this.getSuppliersFromStorage();
    return suppliers.filter(supplier => supplier.status === 'inactive');
  }

  async updateStatus(id: string, status: SupplierStatus): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const suppliers = this.getSuppliersFromStorage();
    const supplierIndex = suppliers.findIndex(s => s.id === id);
    
    if (supplierIndex === -1) {
      throw new Error(`Supplier with id ${id} not found`);
    }
    
    suppliers[supplierIndex] = {
      ...suppliers[supplierIndex],
      status,
      updated_at: new Date().toISOString()
    };
    
    this.saveSuppliersToStorage(suppliers);
    
    console.log(`[DEV_MODE] Updated supplier ${id} status to ${status}`);
  }

  async verifySupplier(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const suppliers = this.getSuppliersFromStorage();
    const supplierIndex = suppliers.findIndex(s => s.id === id);
    
    if (supplierIndex === -1) {
      throw new Error(`Supplier with id ${id} not found`);
    }
    
    suppliers[supplierIndex] = {
      ...suppliers[supplierIndex],
      is_verified: true,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.saveSuppliersToStorage(suppliers);
    
    console.log(`[DEV_MODE] Verified supplier ${id}`);
  }

  // ============= Utility Methods =============

  private getSuppliersFromStorage(): Supplier[] {
    if (typeof window === 'undefined') return mockSuppliers;
    
    const stored = localStorage.getItem('dev_suppliers');
    return stored ? JSON.parse(stored) : mockSuppliers;
  }

  private saveSuppliersToStorage(suppliers: Supplier[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('dev_suppliers', JSON.stringify(suppliers));
  }

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('dev_suppliers')) {
      localStorage.setItem('dev_suppliers', JSON.stringify(mockSuppliers));
    }
    
    console.log('[DEV_MODE] LocalStorage suppliers initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_suppliers');
    
    console.log('[DEV_MODE] LocalStorage suppliers cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData(): Supplier[] {
    return this.getSuppliersFromStorage();
  }
}
