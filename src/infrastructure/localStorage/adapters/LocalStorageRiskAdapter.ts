/**
 * LocalStorage Risk Adapter
 * Implements IRiskRepository using LocalStorage for DEV_MODE
 */

import { IRiskRepository } from '@/domain/repositories/IRiskRepository';
import { Risk, RiskStatus, RiskLevel, IProject, IEmployee } from '@/domain/entities/Risk';

export class LocalStorageRiskAdapter implements IRiskRepository {
  private risks: Risk[] = [];

  async findById(id: string): Promise<Risk | null> {
    return this.risks.find(r => r.id === id) || null;
  }

  async findAll(): Promise<Risk[]> {
    return [...this.risks];
  }

  async save(risk: Risk): Promise<void> {
    const existingIndex = this.risks.findIndex(r => r.id === risk.id);
    if (existingIndex >= 0) {
      this.risks[existingIndex] = risk;
    } else {
      this.risks.push(risk);
    }
  }

  async update(id: string, data: Partial<Risk>): Promise<void> {
    const index = this.risks.findIndex(r => r.id === id);
    if (index >= 0) {
      // Create updated risk using with methods
      const current = this.risks[index];
      if (data.status) {
        this.risks[index] = current.withStatus(data.status);
      }
      if (data.probability) {
        this.risks[index] = current.withProbability(data.probability);
      }
      if (data.impact) {
        this.risks[index] = current.withImpact(data.impact);
      }
    }
  }

  async delete(id: string): Promise<void> {
    const index = this.risks.findIndex(r => r.id === id);
    if (index >= 0) {
      this.risks.splice(index, 1);
    }
  }

  async findByProjectId(projectId: string): Promise<Risk[]> {
    return this.risks.filter(r => r.projectId === projectId);
  }

  async findActive(): Promise<Risk[]> {
    return this.risks.filter(r => r.status !== 'resolved');
  }

  async findCritical(): Promise<Risk[]> {
    return this.risks.filter(r => r.getRiskLevel() === 'critical');
  }

  async countByStatus(projectId: string): Promise<Record<RiskStatus, number>> {
    const projectRisks = this.risks.filter(r => r.projectId === projectId);
    const counts: Record<RiskStatus, number> = {
      'identified': 0,
      'monitored': 0,
      'mitigated': 0,
      'resolved': 0
    };
    
    projectRisks.forEach(risk => {
      counts[risk.status]++;
    });
    
    return counts;
  }

  async findByCategory(category: string): Promise<Risk[]> {
    return this.risks.filter(r => r.getCategory() === category);
  }

  async findByLevel(level: RiskLevel): Promise<Risk[]> {
    return this.risks.filter(r => r.getRiskLevel() === level);
  }

  async findByStatus(status: RiskStatus): Promise<Risk[]> {
    return this.risks.filter(r => r.status === status);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Risk[]> {
    return this.risks.filter(r => {
      const identifiedDate = r.identifiedDate;
      return identifiedDate && identifiedDate >= startDate && identifiedDate <= endDate;
    });
  }

  async search(query: string): Promise<Risk[]> {
    const queryLower = query.toLowerCase();
    return this.risks.filter(r => 
      r.title.toLowerCase().includes(queryLower) ||
      (r.description && r.description.toLowerCase().includes(queryLower))
    );
  }

  async findHighRisk(): Promise<Risk[]> {
    return this.risks.filter(r => r.getRiskLevel() === 'high' || r.getRiskLevel() === 'critical');
  }

  async findUnmitigated(): Promise<Risk[]> {
    return this.risks.filter(r => !r.mitigationStrategy);
  }

  async countByLevel(projectId: string): Promise<Record<RiskLevel, number>> {
    const projectRisks = this.risks.filter(r => r.projectId === projectId);
    const counts: Record<RiskLevel, number> = {
      'low': 0,
      'medium': 0,
      'high': 0,
      'critical': 0
    };
    
    projectRisks.forEach(risk => {
      counts[risk.getRiskLevel()]++;
    });
    
    return counts;
  }

  async getAverageRiskScore(projectId: string): Promise<number> {
    const projectRisks = this.risks.filter(r => r.projectId === projectId);
    if (projectRisks.length === 0) return 0;
    
    const totalScore = projectRisks.reduce((sum, risk) => sum + risk.getRiskScore(), 0);
    return totalScore / projectRisks.length;
  }

  async getHighestRisks(projectId: string, limit: number = 5): Promise<Risk[]> {
    const projectRisks = this.risks.filter(r => r.projectId === projectId);
    return projectRisks
      .sort((a, b) => b.getRiskScore() - a.getRiskScore())
      .slice(0, limit);
  }

  async getUnmitigatedRisks(projectId: string): Promise<Risk[]> {
    return this.risks.filter(r => 
      r.projectId === projectId && 
      r.status !== 'resolved' && 
      !r.mitigationStrategy
    );
  }

  // ============= Utility Methods =============

  private getMockRisks(): Risk[] {
    // Create some sample risks for testing
    return [
      Risk.create({
        id: 'risk-1',
        project: { id: 'project-1', title: 'Test Project' },
        title: 'Budget overrun risk',
        description: 'Risk of exceeding project budget',
        probability: 0.7,
        impact: 0.8,
        identifiedBy: { id: 'emp-1', fullName: 'John Doe', user: { id: 'user-1' } }
      }),
      Risk.create({
        id: 'risk-2',
        project: { id: 'project-1', title: 'Test Project' },
        title: 'Schedule delay risk',
        description: 'Risk of project schedule delays',
        probability: 0.5,
        impact: 0.6,
        identifiedBy: { id: 'emp-1', fullName: 'John Doe', user: { id: 'user-1' } }
      })
    ];
  }

  private getRisksFromStorage(): Risk[] {
    if (typeof window === 'undefined') return this.getMockRisks();
    
    const stored = localStorage.getItem('dev_risks');
    return stored ? JSON.parse(stored) : this.getMockRisks();
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
      localStorage.setItem('dev_risks', JSON.stringify(this.getMockRisks()));
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
