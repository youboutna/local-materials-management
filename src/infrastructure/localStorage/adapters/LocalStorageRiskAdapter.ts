/**
 * LocalStorage Risk Adapter
 * Implements IRiskRepository using LocalStorage for DEV_MODE
 */

import { 
  IRiskRepository, 
  Risk, 
  RiskLevel, 
  RiskStatus, 
  RiskCategory 
} from '@/domain/repositories/IRiskRepository';
import { allRisksData, MockRisk } from '@/data/mockData';

// Convert MockRisk to Risk format
const mockRisks: Risk[] = allRisksData.map((mock: MockRisk) => {
  // Map mock status to domain status
  const statusMap: Record<string, RiskStatus> = {
    'identified': 'identified',
    'assessed': 'assessed',
    'mitigated': 'mitigated',
    'accepted': 'accepted',
    'rejected': 'rejected'
  };

  // Map mock level to domain level
  const levelMap: Record<string, RiskLevel> = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high',
    'critical': 'critical'
  };

  // Map mock category to domain category
  const categoryMap: Record<string, RiskCategory> = {
    'safety': 'safety',
    'quality': 'quality',
    'environmental': 'environmental',
    'financial': 'financial',
    'operational': 'operational',
    'legal': 'legal'
  };

  return new Risk(
    mock.id,
    mock.title,
    mock.description,
    categoryMap[mock.category] || 'operational',
    levelMap[mock.level] || 'medium',
    statusMap[mock.status] || 'identified',
    mock.projectId,
    mock.likelihood,
    mock.impact,
    mock.mitigationMeasures,
    mock.identifiedBy,
    mock.identifiedDate,
    mock.mitigationDate,
    mock.reviewDate,
    mock.createdBy,
    mock.createdAt, // created_at
    mock.updatedAt  // updated_at
  );
});

export class LocalStorageRiskAdapter implements IRiskRepository {
  
  async findById(id: string): Promise<Risk | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const risks = this.getRisksFromStorage();
    const risk = risks.find(r => r.id === id);
    
    return risk || null;
  }

  async findAll(): Promise<Risk[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const risks = this.getRisksFromStorage();
    return risks;
  }

  async save(risk: Risk): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const risks = this.getRisksFromStorage();
    const existingIndex = risks.findIndex(r => r.id === risk.id);
    
    if (existingIndex >= 0) {
      risks[existingIndex] = risk;
    } else {
      risks.push(risk);
    }
    
    this.saveRisksToStorage(risks);
    
    console.log(`[DEV_MODE] Saved risk ${risk.id}`);
  }

  async update(id: string, data: Partial<Risk>): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const risks = this.getRisksFromStorage();
    const riskIndex = risks.findIndex(r => r.id === id);
    
    if (riskIndex === -1) {
      throw new Error(`Risk with id ${id} not found`);
    }
    
    risks[riskIndex] = {
      ...risks[riskIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.saveRisksToStorage(risks);
    
    console.log(`[DEV_MODE] Updated risk ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const risks = this.getRisksFromStorage();
    const riskIndex = risks.findIndex(r => r.id === id);
    
    if (riskIndex === -1) {
      throw new Error(`Risk with id ${id} not found`);
    }
    
    risks.splice(riskIndex, 1);
    this.saveRisksToStorage(risks);
    
    console.log(`[DEV_MODE] Deleted risk ${id}`);
  }

  async findByProject(projectId: string): Promise<Risk[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const risks = this.getRisksFromStorage();
    return risks.filter(risk => risk.projectId === projectId);
  }

  async findByCategory(category: RiskCategory): Promise<Risk[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const risks = this.getRisksFromStorage();
    return risks.filter(risk => risk.category === category);
  }

  async findByLevel(level: RiskLevel): Promise<Risk[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const risks = this.getRisksFromStorage();
    return risks.filter(risk => risk.level === level);
  }

  async findByStatus(status: RiskStatus): Promise<Risk[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const risks = this.getRisksFromStorage();
    return risks.filter(risk => risk.status === status);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Risk[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const risks = this.getRisksFromStorage();
    return risks.filter(risk => 
      risk.identifiedDate >= startDate && risk.identifiedDate <= endDate
    );
  }

  async search(query: string): Promise<Risk[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const risks = this.getRisksFromStorage();
    const searchLower = query.toLowerCase();
    
    return risks.filter(risk => 
      risk.title.toLowerCase().includes(searchLower) ||
      risk.description?.toLowerCase().includes(searchLower) ||
      risk.mitigationMeasures?.toLowerCase().includes(searchLower)
    );
  }

  async findHighRisk(): Promise<Risk[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const risks = this.getRisksFromStorage();
    return risks.filter(risk => risk.level === 'high' || risk.level === 'critical');
  }

  async findUnmitigated(): Promise<Risk[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const risks = this.getRisksFromStorage();
    return risks.filter(risk => risk.status === 'identified' || risk.status === 'assessed');
  }

  // ============= Utility Methods =============

  private getRisksFromStorage(): Risk[] {
    if (typeof window === 'undefined') return mockRisks;
    
    const stored = localStorage.getItem('dev_risks');
    return stored ? JSON.parse(stored) : mockRisks;
  }

  private saveRisksToStorage(risks: Risk[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('dev_risks', JSON.stringify(risks));
  }

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('dev_risks')) {
      localStorage.setItem('dev_risks', JSON.stringify(mockRisks));
    }
    
    console.log('[DEV_MODE] LocalStorage risks initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_risks');
    
    console.log('[DEV_MODE] LocalStorage risks cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData(): Risk[] {
    return this.getRisksFromStorage();
  }
}
