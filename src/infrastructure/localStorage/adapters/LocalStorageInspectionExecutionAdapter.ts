/**
 * LocalStorage Inspection Execution Adapter
 * Implements IInspectionExecutionRepository using LocalStorage for DEV_MODE
 */

import { 
  IInspectionExecutionRepository, 
  InspectionExecution, 
  InspectionExecutionStatus, 
  ExecutionType 
} from '@/domain/repositories/IInspectionExecutionRepository';
import { allInspectionExecutionsData, MockInspectionExecution } from '@/data/mockData';

// Convert MockInspectionExecution to InspectionExecution format
const mockInspectionExecutions: InspectionExecution[] = allInspectionExecutionsData.map((mock: MockInspectionExecution) => {
  // Map mock status to domain status
  const statusMap: Record<string, InspectionExecutionStatus> = {
    'planned': 'planned',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'failed': 'failed',
    'cancelled': 'cancelled'
  };

  // Map mock type to domain type
  const typeMap: Record<string, ExecutionType> = {
    'routine': 'routine',
    'special': 'special',
    'emergency': 'emergency',
    'follow_up': 'follow_up'
  };

  return new InspectionExecution(
    mock.id,
    mock.inspectionId,
    mock.executorId,
    typeMap[mock.type] || 'routine',
    statusMap[mock.status] || 'planned',
    mock.scheduledDate,
    mock.actualStartDate,
    mock.actualEndDate,
    mock.duration,
    mock.results,
    mock.issues,
    mock.recommendations,
    mock.photos,
    mock.documents,
    mock.approvedBy,
    mock.approvedDate,
    mock.createdBy,
    mock.createdAt, // ✅ SNAKE_CASE: created_at in DB
    mock.updatedAt  // ✅ SNAKE_CASE: updated_at in DB
  );
});

export class LocalStorageInspectionExecutionAdapter implements IInspectionExecutionRepository {
  
  async findById(id: string): Promise<InspectionExecution | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspectionExecutions = this.getInspectionExecutionsFromStorage();
    const inspectionExecution = inspectionExecutions.find(ie => ie.id === id);
    
    return inspectionExecution || null;
  }

  async findAll(): Promise<InspectionExecution[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspectionExecutions = this.getInspectionExecutionsFromStorage();
    return inspectionExecutions;
  }

  async save(inspectionExecution: InspectionExecution): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspectionExecutions = this.getInspectionExecutionsFromStorage();
    const existingIndex = inspectionExecutions.findIndex(ie => ie.id === inspectionExecution.id);
    
    if (existingIndex >= 0) {
      inspectionExecutions[existingIndex] = inspectionExecution;
    } else {
      inspectionExecutions.push(inspectionExecution);
    }
    
    this.saveInspectionExecutionsToStorage(inspectionExecutions);
    
    console.log(`[DEV_MODE] Saved inspection execution ${inspectionExecution.id}`);
  }

  async update(id: string, data: Partial<InspectionExecution>): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspectionExecutions = this.getInspectionExecutionsFromStorage();
    const inspectionExecutionIndex = inspectionExecutions.findIndex(ie => ie.id === id);
    
    if (inspectionExecutionIndex === -1) {
      throw new Error(`Inspection execution with id ${id} not found`);
    }
    
    inspectionExecutions[inspectionExecutionIndex] = {
      ...inspectionExecutions[inspectionExecutionIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.saveInspectionExecutionsToStorage(inspectionExecutions);
    
    console.log(`[DEV_MODE] Updated inspection execution ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspectionExecutions = this.getInspectionExecutionsFromStorage();
    const inspectionExecutionIndex = inspectionExecutions.findIndex(ie => ie.id === id);
    
    if (inspectionExecutionIndex === -1) {
      throw new Error(`Inspection execution with id ${id} not found`);
    }
    
    inspectionExecutions.splice(inspectionExecutionIndex, 1);
    this.saveInspectionExecutionsToStorage(inspectionExecutions);
    
    console.log(`[DEV_MODE] Deleted inspection execution ${id}`);
  }

  async findByInspection(inspectionId: string): Promise<InspectionExecution[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspectionExecutions = this.getInspectionExecutionsFromStorage();
    return inspectionExecutions.filter(ie => ie.inspectionId === inspectionId);
  }

  async findByExecutor(executorId: string): Promise<InspectionExecution[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspectionExecutions = this.getInspectionExecutionsFromStorage();
    return inspectionExecutions.filter(ie => ie.executorId === executorId);
  }

  async findByStatus(status: InspectionExecutionStatus): Promise<InspectionExecution[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspectionExecutions = this.getInspectionExecutionsFromStorage();
    return inspectionExecutions.filter(ie => ie.status === status);
  }

  async findByType(type: ExecutionType): Promise<InspectionExecution[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspectionExecutions = this.getInspectionExecutionsFromStorage();
    return inspectionExecutions.filter(ie => ie.type === type);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<InspectionExecution[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspectionExecutions = this.getInspectionExecutionsFromStorage();
    return inspectionExecutions.filter(ie => 
      ie.scheduledDate >= startDate && ie.scheduledDate <= endDate
    );
  }

  async search(query: string): Promise<InspectionExecution[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspectionExecutions = this.getInspectionExecutionsFromStorage();
    const searchLower = query.toLowerCase();
    
    return inspectionExecutions.filter(ie => 
      ie.results?.toLowerCase().includes(searchLower) ||
      ie.issues?.some(issue => issue.toLowerCase().includes(searchLower)) ||
      ie.recommendations?.some(rec => rec.toLowerCase().includes(searchLower))
    );
  }

  async findInProgress(): Promise<InspectionExecution[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspectionExecutions = this.getInspectionExecutionsFromStorage();
    return inspectionExecutions.filter(ie => ie.status === 'in_progress');
  }

  async findCompleted(): Promise<InspectionExecution[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspectionExecutions = this.getInspectionExecutionsFromStorage();
    return inspectionExecutions.filter(ie => ie.status === 'completed');
  }

  async findFailed(): Promise<InspectionExecution[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspectionExecutions = this.getInspectionExecutionsFromStorage();
    return inspectionExecutions.filter(ie => ie.status === 'failed');
  }

  async findByDurationRange(minDuration: number, maxDuration: number): Promise<InspectionExecution[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const inspectionExecutions = this.getInspectionExecutionsFromStorage();
    return inspectionExecutions.filter(ie => 
      ie.duration >= minDuration && ie.duration <= maxDuration
    );
  }

  // ============= Utility Methods =============

  private getInspectionExecutionsFromStorage(): InspectionExecution[] {
    if (typeof window === 'undefined') return mockInspectionExecutions;
    
    const stored = localStorage.getItem('dev_inspection_executions');
    return stored ? JSON.parse(stored) : mockInspectionExecutions;
  }

  private saveInspectionExecutionsToStorage(inspectionExecutions: InspectionExecution[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('dev_inspection_executions', JSON.stringify(inspectionExecutions));
  }

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('dev_inspection_executions')) {
      localStorage.setItem('dev_inspection_executions', JSON.stringify(mockInspectionExecutions));
    }
    
    console.log('[DEV_MODE] LocalStorage inspection executions initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_inspection_executions');
    
    console.log('[DEV_MODE] LocalStorage inspection executions cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData(): InspectionExecution[] {
    return this.getInspectionExecutionsFromStorage();
  }
}
