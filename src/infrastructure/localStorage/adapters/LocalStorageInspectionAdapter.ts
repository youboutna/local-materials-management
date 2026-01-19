/**
 * LocalStorage Inspection Adapter
 * Implements IInspectionRepository using LocalStorage for DEV_MODE
 */

import { 
  IInspectionRepository, 
  Inspection, 
  InspectionStatus, 
  InspectionType 
} from '@/domain/repositories/IInspectionRepository';
import { allInspectionsData, MockInspection } from '@/data/mockData';

// Convert MockInspection to Inspection format
const mockInspections: Inspection[] = allInspectionsData.map((mock: MockInspection) => {
  // Map mock status to domain status
  const statusMap: Record<string, InspectionStatus> = {
    'scheduled': 'scheduled',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'failed': 'failed'
  };

  // Map mock type to domain type
  const typeMap: Record<string, InspectionType> = {
    'technical': 'technical',
    'quality': 'quality',
    'safety': 'safety',
    'environmental': 'environmental'
  };

  return new Inspection(
    mock.id,
    mock.projectId,
    mock.inspectorId,
    typeMap[mock.type] || 'technical',
    statusMap[mock.status] || 'scheduled',
    mock.scheduledDate,
    mock.completedDate,
    mock.result,
    mock.recommendations,
    mock.createdAt, // created_at
    mock.updatedAt  // updated_at
  );
});

export class LocalStorageInspectionAdapter implements IInspectionRepository {
  
  async findById(id: string): Promise<Inspection | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspections = this.getInspectionsFromStorage();
    const inspection = inspections.find(i => i.id === id);
    
    return inspection || null;
  }

  async findAll(): Promise<Inspection[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspections = this.getInspectionsFromStorage();
    return inspections;
  }

  async save(inspection: Inspection): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspections = this.getInspectionsFromStorage();
    const existingIndex = inspections.findIndex(i => i.id === inspection.id);
    
    if (existingIndex >= 0) {
      inspections[existingIndex] = inspection;
    } else {
      inspections.push(inspection);
    }
    
    this.saveInspectionsToStorage(inspections);
    
    console.log(`[DEV_MODE] Saved inspection ${inspection.id}`);
  }

  async update(id: string, data: Partial<Inspection>): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspections = this.getInspectionsFromStorage();
    const inspectionIndex = inspections.findIndex(i => i.id === id);
    
    if (inspectionIndex === -1) {
      throw new Error(`Inspection with id ${id} not found`);
    }
    
    inspections[inspectionIndex] = {
      ...inspections[inspectionIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.saveInspectionsToStorage(inspections);
    
    console.log(`[DEV_MODE] Updated inspection ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspections = this.getInspectionsFromStorage();
    const inspectionIndex = inspections.findIndex(i => i.id === id);
    
    if (inspectionIndex === -1) {
      throw new Error(`Inspection with id ${id} not found`);
    }
    
    inspections.splice(inspectionIndex, 1);
    this.saveInspectionsToStorage(inspections);
    
    console.log(`[DEV_MODE] Deleted inspection ${id}`);
  }

  async findByProject(projectId: string): Promise<Inspection[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspections = this.getInspectionsFromStorage();
    return inspections.filter(inspection => inspection.projectId === projectId);
  }

  async findByInspector(inspectorId: string): Promise<Inspection[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspections = this.getInspectionsFromStorage();
    return inspections.filter(inspection => inspection.inspectorId === inspectorId);
  }

  async findByStatus(status: InspectionStatus): Promise<Inspection[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspections = this.getInspectionsFromStorage();
    return inspections.filter(inspection => inspection.status === status);
  }

  async findByType(type: InspectionType): Promise<Inspection[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspections = this.getInspectionsFromStorage();
    return inspections.filter(inspection => inspection.type === type);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Inspection[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspections = this.getInspectionsFromStorage();
    return inspections.filter(inspection => 
      inspection.scheduledDate >= startDate && inspection.scheduledDate <= endDate
    );
  }

  async findScheduled(): Promise<Inspection[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspections = this.getInspectionsFromStorage();
    return inspections.filter(inspection => inspection.status === 'scheduled');
  }

  async findInProgress(): Promise<Inspection[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspections = this.getInspectionsFromStorage();
    return inspections.filter(inspection => inspection.status === 'in_progress');
  }

  async findCompleted(): Promise<Inspection[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspections = this.getInspectionsFromStorage();
    return inspections.filter(inspection => inspection.status === 'completed');
  }

  async findFailed(): Promise<Inspection[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspections = this.getInspectionsFromStorage();
    return inspections.filter(inspection => inspection.status === 'failed');
  }

  async search(query: string): Promise<Inspection[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspections = this.getInspectionsFromStorage();
    const searchLower = query.toLowerCase();
    
    return inspections.filter(inspection => 
      inspection.result?.toLowerCase().includes(searchLower) ||
      inspection.recommendations.some(rec => rec.toLowerCase().includes(searchLower))
    );
  }

  // ============= Utility Methods =============

  private getInspectionsFromStorage(): Inspection[] {
    if (typeof window === 'undefined') return mockInspections;
    
    const stored = localStorage.getItem('dev_inspections');
    return stored ? JSON.parse(stored) : mockInspections;
  }

  private saveInspectionsToStorage(inspections: Inspection[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('dev_inspections', JSON.stringify(inspections));
  }

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('dev_inspections')) {
      localStorage.setItem('dev_inspections', JSON.stringify(mockInspections));
    }
    
    console.log('[DEV_MODE] LocalStorage inspections initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_inspections');
    
    console.log('[DEV_MODE] LocalStorage inspections cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData(): Inspection[] {
    return this.getInspectionsFromStorage();
  }
}
