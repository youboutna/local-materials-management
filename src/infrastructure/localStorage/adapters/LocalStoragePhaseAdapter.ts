/**
 * LocalStorage Phase Adapter
 * Implements IPhaseRepository using LocalStorage for DEV_MODE
 */

import { 
  IPhaseRepository, 
  Phase, 
  PhaseStatus, 
  PhaseType 
} from '@/domain/repositories/IPhaseRepository';
import { allPhasesData, MockPhase } from '@/data/mockData';

// Convert MockPhase to Phase format
const mockPhases: Phase[] = allPhasesData.map((mock: MockPhase) => {
  // Map mock status to domain status
  const statusMap: Record<string, PhaseStatus> = {
    'planning': 'draft',
    'in_progress': 'active',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'on_hold': 'suspended'
  };

  // Map mock type to domain type
  const typeMap: Record<string, PhaseType> = {
    'planning': 'planning',
    'execution': 'execution',
    'review': 'review',
    'approval': 'approval',
    'delivery': 'delivery',
    'closeout': 'closeout'
  };

  return new Phase(
    mock.id,
    mock.projectId,
    mock.name,
    mock.description,
    typeMap[mock.type] || 'planning',
    statusMap[mock.status] || 'draft',
    mock.startDate,
    mock.endDate,
    mock.budget,
    mock.progress,
    mock.deliverables,
    mock.dependencies,
    mock.assignedTo,
    mock.createdBy,
    mock.createdAt, // ✅ SNAKE_CASE: created_at in DB
    mock.updatedAt  // ✅ SNAKE_CASE: updated_at in DB
  );
});

export class LocalStoragePhaseAdapter implements IPhaseRepository {
  
  async findById(id: string): Promise<Phase | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const phases = this.getPhasesFromStorage();
    const phase = phases.find(p => p.id === id);
    
    return phase || null;
  }

  async findAll(): Promise<Phase[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const phases = this.getPhasesFromStorage();
    return phases;
  }

  async save(phase: Phase): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const phases = this.getPhasesFromStorage();
    const existingIndex = phases.findIndex(p => p.id === phase.id);
    
    if (existingIndex >= 0) {
      phases[existingIndex] = phase;
    } else {
      phases.push(phase);
    }
    
    this.savePhasesToStorage(phases);
    
    console.log(`[DEV_MODE] Saved phase ${phase.id}`);
  }

  async update(id: string, data: Partial<Phase>): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const phases = this.getPhasesFromStorage();
    const phaseIndex = phases.findIndex(p => p.id === id);
    
    if (phaseIndex === -1) {
      throw new Error(`Phase with id ${id} not found`);
    }
    
    phases[phaseIndex] = {
      ...phases[phaseIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.savePhasesToStorage(phases);
    
    console.log(`[DEV_MODE] Updated phase ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const phases = this.getPhasesFromStorage();
    const phaseIndex = phases.findIndex(p => p.id === id);
    
    if (phaseIndex === -1) {
      throw new Error(`Phase with id ${id} not found`);
    }
    
    phases.splice(phaseIndex, 1);
    this.savePhasesToStorage(phases);
    
    console.log(`[DEV_MODE] Deleted phase ${id}`);
  }

  async findByProject(projectId: string): Promise<Phase[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const phases = this.getPhasesFromStorage();
    return phases.filter(phase => phase.projectId === projectId);
  }

  async findByStatus(status: PhaseStatus): Promise<Phase[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const phases = this.getPhasesFromStorage();
    return phases.filter(phase => phase.status === status);
  }

  async findByType(type: PhaseType): Promise<Phase[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const phases = this.getPhasesFromStorage();
    return phases.filter(phase => phase.type === type);
  }

  async findByManager(managerId: string): Promise<Phase[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const phases = this.getPhasesFromStorage();
    return phases.filter(phase => phase.assignedTo === managerId);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Phase[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const phases = this.getPhasesFromStorage();
    return phases.filter(phase => 
      phase.startDate >= startDate && phase.startDate <= endDate
    );
  }

  async search(query: string): Promise<Phase[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const phases = this.getPhasesFromStorage();
    const searchLower = query.toLowerCase();
    
    return phases.filter(phase => 
      phase.name.toLowerCase().includes(searchLower) ||
      phase.description?.toLowerCase().includes(searchLower)
    );
  }

  async findActive(): Promise<Phase[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const phases = this.getPhasesFromStorage();
    return phases.filter(phase => phase.status === 'active');
  }

  async findCompleted(): Promise<Phase[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const phases = this.getPhasesFromStorage();
    return phases.filter(phase => phase.status === 'completed');
  }

  async findUpcoming(): Promise<Phase[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const phases = this.getPhasesFromStorage();
    return phases.filter(phase => phase.status === 'draft' || phase.status === 'planning');
  }

  async findByProgress(minProgress: number, maxProgress: number): Promise<Phase[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const phases = this.getPhasesFromStorage();
    return phases.filter(phase => 
      phase.progress >= minProgress && phase.progress <= maxProgress
    );
  }

  // ============= Utility Methods =============

  private getPhasesFromStorage(): Phase[] {
    if (typeof window === 'undefined') return mockPhases;
    
    const stored = localStorage.getItem('dev_phases');
    return stored ? JSON.parse(stored) : mockPhases;
  }

  private savePhasesToStorage(phases: Phase[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('dev_phases', JSON.stringify(phases));
  }

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('dev_phases')) {
      localStorage.setItem('dev_phases', JSON.stringify(mockPhases));
    }
    
    console.log('[DEV_MODE] LocalStorage phases initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_phases');
    
    console.log('[DEV_MODE] LocalStorage phases cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData(): Phase[] {
    return this.getPhasesFromStorage();
  }
}
