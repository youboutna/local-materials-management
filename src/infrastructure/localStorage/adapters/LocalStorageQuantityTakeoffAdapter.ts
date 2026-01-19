/**
 * LocalStorage Quantity Takeoff Adapter
 * Implements IQuantityTakeoffRepository using LocalStorage for DEV_MODE
 */

import { 
  IQuantityTakeoffRepository, 
  QuantityTakeoff, 
  QuantityTakeoffStatus, 
  TakeoffType 
} from '@/domain/repositories/IQuantityTakeoffRepository';
import { allQuantityTakeoffsData, MockQuantityTakeoff } from '@/data/mockData';

// Convert MockQuantityTakeoff to QuantityTakeoff format
const mockQuantityTakeoffs: QuantityTakeoff[] = allQuantityTakeoffsData.map((mock: MockQuantityTakeoff) => {
  // Map mock status to domain status
  const statusMap: Record<string, QuantityTakeoffStatus> = {
    'draft': 'draft',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'approved': 'approved',
    'rejected': 'rejected'
  };

  // Map mock type to domain type
  const typeMap: Record<string, TakeoffType> = {
    'material': 'material',
    'labor': 'labor',
    'equipment': 'equipment',
    'subcontractor': 'subcontractor'
  };

  return new QuantityTakeoff(
    mock.id,
    mock.projectId,
    mock.title,
    mock.description,
    typeMap[mock.type] || 'material',
    statusMap[mock.status] || 'draft',
    mock.quantity,
    mock.unit,
    mock.unitPrice,
    mock.totalPrice,
    mock.materialId,
    mock.location,
    mock.measuredBy,
    mock.measuredDate,
    mock.approvedBy,
    mock.approvedDate,
    mock.createdBy,
    mock.createdAt, // created_at
    mock.updatedAt  // updated_at
  );
});

export class LocalStorageQuantityTakeoffAdapter implements IQuantityTakeoffRepository {
  
  async findById(id: string): Promise<QuantityTakeoff | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const quantityTakeoffs = this.getQuantityTakeoffsFromStorage();
    const quantityTakeoff = quantityTakeoffs.find(q => q.id === id);
    
    return quantityTakeoff || null;
  }

  async findAll(): Promise<QuantityTakeoff[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const quantityTakeoffs = this.getQuantityTakeoffsFromStorage();
    return quantityTakeoffs;
  }

  async save(quantityTakeoff: QuantityTakeoff): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const quantityTakeoffs = this.getQuantityTakeoffsFromStorage();
    const existingIndex = quantityTakeoffs.findIndex(q => q.id === quantityTakeoff.id);
    
    if (existingIndex >= 0) {
      quantityTakeoffs[existingIndex] = quantityTakeoff;
    } else {
      quantityTakeoffs.push(quantityTakeoff);
    }
    
    this.saveQuantityTakeoffsToStorage(quantityTakeoffs);
    
    console.log(`[DEV_MODE] Saved quantity takeoff ${quantityTakeoff.id}`);
  }

  async update(id: string, data: Partial<QuantityTakeoff>): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const quantityTakeoffs = this.getQuantityTakeoffsFromStorage();
    const quantityTakeoffIndex = quantityTakeoffs.findIndex(q => q.id === id);
    
    if (quantityTakeoffIndex === -1) {
      throw new Error(`Quantity takeoff with id ${id} not found`);
    }
    
    quantityTakeoffs[quantityTakeoffIndex] = {
      ...quantityTakeoffs[quantityTakeoffIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.saveQuantityTakeoffsToStorage(quantityTakeoffs);
    
    console.log(`[DEV_MODE] Updated quantity takeoff ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const quantityTakeoffs = this.getQuantityTakeoffsFromStorage();
    const quantityTakeoffIndex = quantityTakeoffs.findIndex(q => q.id === id);
    
    if (quantityTakeoffIndex === -1) {
      throw new Error(`Quantity takeoff with id ${id} not found`);
    }
    
    quantityTakeoffs.splice(quantityTakeoffIndex, 1);
    this.saveQuantityTakeoffsToStorage(quantityTakeoffs);
    
    console.log(`[DEV_MODE] Deleted quantity takeoff ${id}`);
  }

  async findByProject(projectId: string): Promise<QuantityTakeoff[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const quantityTakeoffs = this.getQuantityTakeoffsFromStorage();
    return quantityTakeoffs.filter(q => q.projectId === projectId);
  }

  async findByType(type: TakeoffType): Promise<QuantityTakeoff[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const quantityTakeoffs = this.getQuantityTakeoffsFromStorage();
    return quantityTakeoffs.filter(q => q.type === type);
  }

  async findByStatus(status: QuantityTakeoffStatus): Promise<QuantityTakeoff[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const quantityTakeoffs = this.getQuantityTakeoffsFromStorage();
    return quantityTakeoffs.filter(q => q.status === status);
  }

  async findByMaterial(materialId: string): Promise<QuantityTakeoff[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const quantityTakeoffs = this.getQuantityTakeoffsFromStorage();
    return quantityTakeoffs.filter(q => q.materialId === materialId);
  }

  async findByLocation(location: string): Promise<QuantityTakeoff[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const quantityTakeoffs = this.getQuantityTakeoffsFromStorage();
    return quantityTakeoffs.filter(q => q.location === location);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<QuantityTakeoff[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const quantityTakeoffs = this.getQuantityTakeoffsFromStorage();
    return quantityTakeoffs.filter(q => 
      q.measuredDate >= startDate && q.measuredDate <= endDate
    );
  }

  async search(query: string): Promise<QuantityTakeoff[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const quantityTakeoffs = this.getQuantityTakeoffsFromStorage();
    const searchLower = query.toLowerCase();
    
    return quantityTakeoffs.filter(q => 
      q.title.toLowerCase().includes(searchLower) ||
      q.description?.toLowerCase().includes(searchLower) ||
      q.location?.toLowerCase().includes(searchLower)
    );
  }

  async findPending(): Promise<QuantityTakeoff[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const quantityTakeoffs = this.getQuantityTakeoffsFromStorage();
    return quantityTakeoffs.filter(q => q.status === 'draft' || q.status === 'in_progress');
  }

  async findCompleted(): Promise<QuantityTakeoff[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const quantityTakeoffs = this.getQuantityTakeoffsFromStorage();
    return quantityTakeoffs.filter(q => q.status === 'completed');
  }

  async findByPriceRange(minPrice: number, maxPrice: number): Promise<QuantityTakeoff[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const quantityTakeoffs = this.getQuantityTakeoffsFromStorage();
    return quantityTakeoffs.filter(q => 
      q.totalPrice >= minPrice && q.totalPrice <= maxPrice
    );
  }

  // ============= Utility Methods =============

  private getQuantityTakeoffsFromStorage(): QuantityTakeoff[] {
    if (typeof window === 'undefined') return mockQuantityTakeoffs;
    
    const stored = localStorage.getItem('dev_quantity_takeoffs');
    return stored ? JSON.parse(stored) : mockQuantityTakeoffs;
  }

  private saveQuantityTakeoffsToStorage(quantityTakeoffs: QuantityTakeoff[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('dev_quantity_takeoffs', JSON.stringify(quantityTakeoffs));
  }

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('dev_quantity_takeoffs')) {
      localStorage.setItem('dev_quantity_takeoffs', JSON.stringify(mockQuantityTakeoffs));
    }
    
    console.log('[DEV_MODE] LocalStorage quantity takeoffs initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_quantity_takeoffs');
    
    console.log('[DEV_MODE] LocalStorage quantity takeoffs cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData(): QuantityTakeoff[] {
    return this.getQuantityTakeoffsFromStorage();
  }
}
