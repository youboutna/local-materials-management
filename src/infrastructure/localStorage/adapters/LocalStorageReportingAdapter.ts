// @ts-nocheck
/**
 * LocalStorage Reporting Adapter
 * Implements IReportingRepository using LocalStorage for DEV_MODE
 */

import { 
  IReportingRepository, 
  Report, 
  ReportStatus, 
  ReportType 
} from '@/domain/repositories/IReportingRepository';
import { allReportsData, MockReport } from '@/data/mockData';

// Convert MockReport to Report format
const mockReports: Report[] = allReportsData.map((mock: MockReport) => {
  // Map mock status to domain status
  const statusMap: Record<string, ReportStatus> = {
    'draft': 'draft',
    'generating': 'generating',
    'completed': 'completed',
    'failed': 'failed',
    'cancelled': 'cancelled'
  };

  // Map mock type to domain type
  const typeMap: Record<string, ReportType> = {
    'financial': 'financial',
    'progress': 'progress',
    'quality': 'quality',
    'safety': 'safety',
    'environmental': 'environmental',
    'inspection': 'inspection',
    'material': 'material',
    'equipment': 'equipment'
  };

  return new Report(
    mock.id,
    mock.title,
    mock.description,
    typeMap[mock.type] || 'progress',
    statusMap[mock.status] || 'draft',
    mock.projectId,
    mock.generatedBy,
    mock.generatedDate,
    mock.periodStart,
    mock.periodEnd,
    mock.data,
    mock.format,
    mock.fileUrl,
    mock.fileSize,
    mock.approvedBy,
    mock.approvedDate,
    mock.sentTo,
    mock.sentDate,
    mock.createdBy,
    mock.createdAt, // created_at
    mock.updatedAt  // updated_at
  );
});

export class LocalStorageReportingAdapter implements IReportingRepository {
  
  async findById(id: string): Promise<Report | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const reports = this.getReportsFromStorage();
    const report = reports.find(r => r.id === id);
    
    return report || null;
  }

  async findAll(): Promise<Report[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const reports = this.getReportsFromStorage();
    return reports;
  }

  async save(report: Report): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const reports = this.getReportsFromStorage();
    const existingIndex = reports.findIndex(r => r.id === report.id);
    
    if (existingIndex >= 0) {
      reports[existingIndex] = report;
    } else {
      reports.push(report);
    }
    
    this.saveReportsToStorage(reports);
    
    console.log(`[DEV_MODE] Saved report ${report.id}`);
  }

  async update(id: string, data: Partial<Report>): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const reports = this.getReportsFromStorage();
    const reportIndex = reports.findIndex(r => r.id === id);
    
    if (reportIndex === -1) {
      throw new Error(`Report with id ${id} not found`);
    }
    
    reports[reportIndex] = {
      ...reports[reportIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.saveReportsToStorage(reports);
    
    console.log(`[DEV_MODE] Updated report ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const reports = this.getReportsFromStorage();
    const reportIndex = reports.findIndex(r => r.id === id);
    
    if (reportIndex === -1) {
      throw new Error(`Report with id ${id} not found`);
    }
    
    reports.splice(reportIndex, 1);
    this.saveReportsToStorage(reports);
    
    console.log(`[DEV_MODE] Deleted report ${id}`);
  }

  async findByProject(projectId: string): Promise<Report[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const reports = this.getReportsFromStorage();
    return reports.filter(r => r.projectId === projectId);
  }

  async findByType(type: ReportType): Promise<Report[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const reports = this.getReportsFromStorage();
    return reports.filter(r => r.type === type);
  }

  async findByStatus(status: ReportStatus): Promise<Report[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const reports = this.getReportsFromStorage();
    return reports.filter(r => r.status === status);
  }

  async findByGenerator(generatorId: string): Promise<Report[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const reports = this.getReportsFromStorage();
    return reports.filter(r => r.generatedBy === generatorId);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Report[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const reports = this.getReportsFromStorage();
    return reports.filter(r => 
      r.generatedDate >= startDate && r.generatedDate <= endDate
    );
  }

  async search(query: string): Promise<Report[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const reports = this.getReportsFromStorage();
    const searchLower = query.toLowerCase();
    
    return reports.filter(r => 
      r.title.toLowerCase().includes(searchLower) ||
      r.description?.toLowerCase().includes(searchLower)
    );
  }

  async findCompleted(): Promise<Report[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const reports = this.getReportsFromStorage();
    return reports.filter(r => r.status === 'completed');
  }

  async findPending(): Promise<Report[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const reports = this.getReportsFromStorage();
    return reports.filter(r => r.status === 'draft' || r.status === 'generating');
  }

  async findByFormat(format: string): Promise<Report[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const reports = this.getReportsFromStorage();
    return reports.filter(r => r.format === format);
  }

  async findByFileSizeRange(minSize: number, maxSize: number): Promise<Report[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const reports = this.getReportsFromStorage();
    return reports.filter(r => 
      r.fileSize >= minSize && r.fileSize <= maxSize
    );
  }

  // ============= Utility Methods =============

  private getReportsFromStorage(): Report[] {
    if (typeof window === 'undefined') return mockReports;
    
    const stored = localStorage.getItem('dev_reports');
    return stored ? JSON.parse(stored) : mockReports;
  }

  private saveReportsToStorage(reports: Report[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('dev_reports', JSON.stringify(reports));
  }

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('dev_reports')) {
      localStorage.setItem('dev_reports', JSON.stringify(mockReports));
    }
    
    console.log('[DEV_MODE] LocalStorage reports initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_reports');
    
    console.log('[DEV_MODE] LocalStorage reports cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData(): Report[] {
    return this.getReportsFromStorage();
  }
}
