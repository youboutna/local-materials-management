/**
 * LocalStorage Report Data Transformer Adapter
 * Implements IReportDataTransformerRepository using LocalStorage for DEV_MODE
 */

import { 
  IReportDataTransformerRepository, 
  ReportDataTransformer, 
  TransformerStatus, 
  TransformerType 
} from '@/domain/repositories/IReportDataTransformerRepository';
import { allReportDataTransformersData, MockReportDataTransformer } from '@/data/mockData';

// Convert MockReportDataTransformer to ReportDataTransformer format
const mockReportDataTransformers: ReportDataTransformer[] = allReportDataTransformersData.map((mock: MockReportDataTransformer) => {
  // Map mock status to domain status
  const statusMap: Record<string, TransformerStatus> = {
    'active': 'active',
    'inactive': 'inactive',
    'maintenance': 'maintenance',
    'error': 'error'
  };

  // Map mock type to domain type
  const typeMap: Record<string, TransformerType> = {
    'data_cleaning': 'data_cleaning',
    'format_conversion': 'format_conversion',
    'data_aggregation': 'data_aggregation',
    'calculation': 'calculation',
    'validation': 'validation',
    'enrichment': 'enrichment'
  };

  return new ReportDataTransformer(
    mock.id,
    mock.name,
    mock.description,
    typeMap[mock.type] || 'data_cleaning',
    statusMap[mock.status] || 'active',
    mock.inputFormat,
    mock.outputFormat,
    mock.transformationRules,
    mock.schedule,
    mock.lastRun,
    mock.nextRun,
    mock.successCount,
    mock.errorCount,
    mock.averageProcessingTime,
    mock.createdBy,
    mock.createdAt, // created_at
    mock.updatedAt  // updated_at
  );
});

export class LocalStorageReportDataTransformerAdapter implements IReportDataTransformerRepository {
  
  async findById(id: string): Promise<ReportDataTransformer | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const transformers = this.getTransformersFromStorage();
    const transformer = transformers.find(t => t.id === id);
    
    return transformer || null;
  }

  async findAll(): Promise<ReportDataTransformer[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const transformers = this.getTransformersFromStorage();
    return transformers;
  }

  async save(transformer: ReportDataTransformer): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const transformers = this.getTransformersFromStorage();
    const existingIndex = transformers.findIndex(t => t.id === transformer.id);
    
    if (existingIndex >= 0) {
      transformers[existingIndex] = transformer;
    } else {
      transformers.push(transformer);
    }
    
    this.saveTransformersToStorage(transformers);
    
    console.log(`[DEV_MODE] Saved report data transformer ${transformer.id}`);
  }

  async update(id: string, data: Partial<ReportDataTransformer>): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const transformers = this.getTransformersFromStorage();
    const transformerIndex = transformers.findIndex(t => t.id === id);
    
    if (transformerIndex === -1) {
      throw new Error(`Report data transformer with id ${id} not found`);
    }
    
    transformers[transformerIndex] = {
      ...transformers[transformerIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.saveTransformersToStorage(transformers);
    
    console.log(`[DEV_MODE] Updated report data transformer ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const transformers = this.getTransformersFromStorage();
    const transformerIndex = transformers.findIndex(t => t.id === id);
    
    if (transformerIndex === -1) {
      throw new Error(`Report data transformer with id ${id} not found`);
    }
    
    transformers.splice(transformerIndex, 1);
    this.saveTransformersToStorage(transformers);
    
    console.log(`[DEV_MODE] Deleted report data transformer ${id}`);
  }

  async findByType(type: TransformerType): Promise<ReportDataTransformer[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const transformers = this.getTransformersFromStorage();
    return transformers.filter(t => t.type === type);
  }

  async findByStatus(status: TransformerStatus): Promise<ReportDataTransformer[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const transformers = this.getTransformersFromStorage();
    return transformers.filter(t => t.status === status);
  }

  async findByInputFormat(inputFormat: string): Promise<ReportDataTransformer[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const transformers = this.getTransformersFromStorage();
    return transformers.filter(t => t.inputFormat === inputFormat);
  }

  async findByOutputFormat(outputFormat: string): Promise<ReportDataTransformer[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const transformers = this.getTransformersFromStorage();
    return transformers.filter(t => t.outputFormat === outputFormat);
  }

  async findActive(): Promise<ReportDataTransformer[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const transformers = this.getTransformersFromStorage();
    return transformers.filter(t => t.status === 'active');
  }

  async findScheduled(): Promise<ReportDataTransformer[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const transformers = this.getTransformersFromStorage();
    const now = new Date().toISOString();
    return transformers.filter(t => t.nextRun <= now && t.status === 'active');
  }

  async findOverdue(): Promise<ReportDataTransformer[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const transformers = this.getTransformersFromStorage();
    const now = new Date().toISOString();
    return transformers.filter(t => t.nextRun < now && t.status === 'active');
  }

  async search(query: string): Promise<ReportDataTransformer[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const transformers = this.getTransformersFromStorage();
    const searchLower = query.toLowerCase();
    
    return transformers.filter(t => 
      t.name.toLowerCase().includes(searchLower) ||
      t.description?.toLowerCase().includes(searchLower) ||
      t.inputFormat?.toLowerCase().includes(searchLower) ||
      t.outputFormat?.toLowerCase().includes(searchLower)
    );
  }

  async findBySuccessRate(minRate: number, maxRate: number): Promise<ReportDataTransformer[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const transformers = this.getTransformersFromStorage();
    return transformers.filter(t => {
      const totalRuns = t.successCount + t.errorCount;
      const successRate = totalRuns > 0 ? (t.successCount / totalRuns) * 100 : 0;
      return successRate >= minRate && successRate <= maxRate;
    });
  }

  // ============= Utility Methods =============

  private getTransformersFromStorage(): ReportDataTransformer[] {
    if (typeof window === 'undefined') return mockReportDataTransformers;
    
    const stored = localStorage.getItem('dev_report_data_transformers');
    return stored ? JSON.parse(stored) : mockReportDataTransformers;
  }

  private saveTransformersToStorage(transformers: ReportDataTransformer[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('dev_report_data_transformers', JSON.stringify(transformers));
  }

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('dev_report_data_transformers')) {
      localStorage.setItem('dev_report_data_transformers', JSON.stringify(mockReportDataTransformers));
    }
    
    console.log('[DEV_MODE] LocalStorage report data transformers initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_report_data_transformers');
    
    console.log('[DEV_MODE] LocalStorage report data transformers cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData(): ReportDataTransformer[] {
    return this.getTransformersFromStorage();
  }
}
