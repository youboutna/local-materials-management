/**
 * LocalStorage Tender Adapter
 * Implements ITenderRepository using LocalStorage for DEV_MODE
 */

import { 
  ITenderRepository, 
  Tender, 
  TenderStatus, 
  TenderType 
} from '@/domain/repositories/ITenderRepository';
import { allTendersData, MockTender } from '@/data/mockData';

// Convert MockTender to Tender format
const mockTenders: Tender[] = allTendersData.map((mock: MockTender) => {
  // Map mock status to domain status
  const statusMap: Record<string, TenderStatus> = {
    'draft': 'draft',
    'published': 'published',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'closed': 'closed'
  };

  // Map mock type to domain type
  const typeMap: Record<string, TenderType> = {
    'Construction': 'construction',
    'Fourniture': 'procurement',
    'Service': 'service',
    'Consulting': 'consulting'
  };

  return new Tender(
    mock.id,
    mock.title,
    mock.description,
    typeMap[mock.type] || 'construction',
    statusMap[mock.status] || 'draft',
    mock.budget,
    mock.deadline,
    mock.requirements,
    mock.criteria,
    mock.createdBy,
    mock.createdAt, // created_at
    mock.updatedAt  // updated_at
  );
});

export class LocalStorageTenderAdapter implements ITenderRepository {
  
  async findById(id: string): Promise<Tender | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tenders = this.getTendersFromStorage();
    const tender = tenders.find(t => t.id === id);
    
    return tender || null;
  }

  async findAll(): Promise<Tender[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tenders = this.getTendersFromStorage();
    return tenders;
  }

  async save(tender: Tender): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tenders = this.getTendersFromStorage();
    const existingIndex = tenders.findIndex(t => t.id === tender.id);
    
    if (existingIndex >= 0) {
      tenders[existingIndex] = tender;
    } else {
      tenders.push(tender);
    }
    
    this.saveTendersToStorage(tenders);
    
    console.log(`[DEV_MODE] Saved tender ${tender.id}`);
  }

  async update(id: string, data: Partial<Tender>): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tenders = this.getTendersFromStorage();
    const tenderIndex = tenders.findIndex(t => t.id === id);
    
    if (tenderIndex === -1) {
      throw new Error(`Tender with id ${id} not found`);
    }
    
    tenders[tenderIndex] = {
      ...tenders[tenderIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.saveTendersToStorage(tenders);
    
    console.log(`[DEV_MODE] Updated tender ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tenders = this.getTendersFromStorage();
    const tenderIndex = tenders.findIndex(t => t.id === id);
    
    if (tenderIndex === -1) {
      throw new Error(`Tender with id ${id} not found`);
    }
    
    tenders.splice(tenderIndex, 1);
    this.saveTendersToStorage(tenders);
    
    console.log(`[DEV_MODE] Deleted tender ${id}`);
  }

  async findByStatus(status: TenderStatus): Promise<Tender[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tenders = this.getTendersFromStorage();
    return tenders.filter(tender => tender.status === status);
  }

  async findByType(type: TenderType): Promise<Tender[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tenders = this.getTendersFromStorage();
    return tenders.filter(tender => tender.type === type);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Tender[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tenders = this.getTendersFromStorage();
    return tenders.filter(tender => 
      tender.createdAt >= startDate && tender.createdAt <= endDate
    );
  }

  async findActive(): Promise<Tender[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tenders = this.getTendersFromStorage();
    return tenders.filter(tender => tender.status === 'published' || tender.status === 'in_progress');
  }

  async findExpired(): Promise<Tender[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tenders = this.getTendersFromStorage();
    const now = new Date().toISOString();
    return tenders.filter(tender => tender.deadline < now && tender.status !== 'completed' && tender.status !== 'cancelled');
  }

  async search(query: string): Promise<Tender[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tenders = this.getTendersFromStorage();
    const searchLower = query.toLowerCase();
    
    return tenders.filter(tender => 
      tender.title.toLowerCase().includes(searchLower) ||
      tender.description?.toLowerCase().includes(searchLower) ||
      tender.requirements?.some(req => req.toLowerCase().includes(searchLower))
    );
  }

  async findByBudgetRange(minBudget: number, maxBudget: number): Promise<Tender[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tenders = this.getTendersFromStorage();
    return tenders.filter(tender => 
      tender.budget >= minBudget && tender.budget <= maxBudget
    );
  }

  // ============= Utility Methods =============

  private getTendersFromStorage(): Tender[] {
    if (typeof window === 'undefined') return mockTenders;
    
    const stored = localStorage.getItem('dev_tenders');
    return stored ? JSON.parse(stored) : mockTenders;
  }

  private saveTendersToStorage(tenders: Tender[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('dev_tenders', JSON.stringify(tenders));
  }

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('dev_tenders')) {
      localStorage.setItem('dev_tenders', JSON.stringify(mockTenders));
    }
    
    console.log('[DEV_MODE] LocalStorage tenders initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_tenders');
    
    console.log('[DEV_MODE] LocalStorage tenders cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData(): Tender[] {
    return this.getTendersFromStorage();
  }
}
