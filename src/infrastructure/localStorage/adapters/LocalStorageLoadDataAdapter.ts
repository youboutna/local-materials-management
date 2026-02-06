/**
 * LocalStorage Load Data Adapter
 * Implements ILoadDataRepository using LocalStorage for DEV_MODE
 */

import { 
  ILoadDataRepository, 
  LoadData, 
  LoadDataStatus, 
  LoadDataType 
} from '@/domain/repositories/ILoadDataRepository';
import { allLoadDataData, MockLoadData } from '@/data/mockData';

// Convert MockLoadData to LoadData format
const mockLoadData: LoadData[] = allLoadDataData.map((mock: MockLoadData) => {
  // Map mock status to domain status
  const statusMap: Record<string, LoadDataStatus> = {
    'pending': 'pending',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'failed': 'failed',
    'cancelled': 'cancelled'
  };

  // Map mock type to domain type
  const typeMap: Record<string, LoadDataType> = {
    'material': 'material',
    'equipment': 'equipment',
    'labor': 'labor',
    'subcontractor': 'subcontractor'
  };

  return new LoadData(
    mock.id,
    mock.projectId,
    mock.title,
    mock.description,
    typeMap[mock.type] || 'material',
    statusMap[mock.status] || 'pending',
    mock.quantity,
    mock.unit,
    mock.unitPrice,
    mock.totalPrice,
    mock.supplierId,
    mock.deliveryDate,
    mock.deliveryLocation,
    mock.receivedBy,
    mock.receivedDate,
    mock.qualityCheck,
    mock.notes,
    mock.createdBy,
    mock.createdAt, // ✅ SNAKE_CASE: created_at in DB
    mock.updatedAt  // ✅ SNAKE_CASE: updated_at in DB
  );
});

export class LocalStorageLoadDataAdapter implements ILoadDataRepository {
  
  async findById(id: string): Promise<LoadData | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const loadData = this.getLoadDataFromStorage();
    const load = loadData.find(l => l.id === id);
    
    return load || null;
  }

  async findAll(): Promise<LoadData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const loadData = this.getLoadDataFromStorage();
    return loadData;
  }

  async save(loadData: LoadData): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const loadData = this.getLoadDataFromStorage();
    const existingIndex = loadData.findIndex(l => l.id === loadData.id);
    
    if (existingIndex >= 0) {
      loadData[existingIndex] = loadData;
    } else {
      loadData.push(loadData);
    }
    
    this.saveLoadDataToStorage(loadData);
    
    console.log(`[DEV_MODE] Saved load data ${loadData.id}`);
  }

  async update(id: string, data: Partial<LoadData>): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const loadData = this.getLoadDataFromStorage();
    const loadDataIndex = loadData.findIndex(l => l.id === id);
    
    if (loadDataIndex === -1) {
      throw new Error(`Load data with id ${id} not found`);
    }
    
    loadData[loadDataIndex] = {
      ...loadData[loadDataIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.saveLoadDataToStorage(loadData);
    
    console.log(`[DEV_MODE] Updated load data ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const loadData = this.getLoadDataFromStorage();
    const loadDataIndex = loadData.findIndex(l => l.id === id);
    
    if (loadDataIndex === -1) {
      throw new Error(`Load data with id ${id} not found`);
    }
    
    loadData.splice(loadDataIndex, 1);
    this.saveLoadDataToStorage(loadData);
    
    console.log(`[DEV_MODE] Deleted load data ${id}`);
  }

  async findByProject(projectId: string): Promise<LoadData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const loadData = this.getLoadDataFromStorage();
    return loadData.filter(l => l.projectId === projectId);
  }

  async findByType(type: LoadDataType): Promise<LoadData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const loadData = this.getLoadDataFromStorage();
    return loadData.filter(l => l.type === type);
  }

  async findByStatus(status: LoadDataStatus): Promise<LoadData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const loadData = this.getLoadDataFromStorage();
    return loadData.filter(l => l.status === status);
  }

  async findBySupplier(supplierId: string): Promise<LoadData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const loadData = this.getLoadDataFromStorage();
    return loadData.filter(l => l.supplierId === supplierId);
  }

  async findByDeliveryDateRange(startDate: string, endDate: string): Promise<LoadData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const loadData = this.getLoadDataFromStorage();
    return loadData.filter(l => 
      l.deliveryDate >= startDate && l.deliveryDate <= endDate
    );
  }

  async search(query: string): Promise<LoadData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const loadData = this.getLoadDataFromStorage();
    const searchLower = query.toLowerCase();
    
    return loadData.filter(l => 
      l.title.toLowerCase().includes(searchLower) ||
      l.description?.toLowerCase().includes(searchLower) ||
      l.deliveryLocation?.toLowerCase().includes(searchLower)
    );
  }

  async findPending(): Promise<LoadData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const loadData = this.getLoadDataFromStorage();
    return loadData.filter(l => l.status === 'pending' || l.status === 'in_progress');
  }

  async findCompleted(): Promise<LoadData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const loadData = this.getLoadDataFromStorage();
    return loadData.filter(l => l.status === 'completed');
  }

  async findOverdue(): Promise<LoadData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const loadData = this.getLoadDataFromStorage();
    const now = new Date().toISOString();
    return loadData.filter(l => l.deliveryDate < now && l.status !== 'completed' && l.status !== 'cancelled');
  }

  async findByPriceRange(minPrice: number, maxPrice: number): Promise<LoadData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const loadData = this.getLoadDataFromStorage();
    return loadData.filter(l => 
      l.totalPrice >= minPrice && l.totalPrice <= maxPrice
    );
  }

  // ============= Utility Methods =============

  private getLoadDataFromStorage(): LoadData[] {
    if (typeof window === 'undefined') return mockLoadData;
    
    const stored = localStorage.getItem('dev_load_data');
    return stored ? JSON.parse(stored) : mockLoadData;
  }

  private saveLoadDataToStorage(loadData: LoadData[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('dev_load_data', JSON.stringify(loadData));
  }

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('dev_load_data')) {
      localStorage.setItem('dev_load_data', JSON.stringify(mockLoadData));
    }
    
    console.log('[DEV_MODE] LocalStorage load data initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_load_data');
    
    console.log('[DEV_MODE] LocalStorage load data cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData(): LoadData[] {
    return this.getLoadDataFromStorage();
  }
}
