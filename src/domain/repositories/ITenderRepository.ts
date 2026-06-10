// Repository interface for Tender entity
import { Tender, TenderStatus, SelectionMode, MarketType } from '../entities/Tender';

export interface ITenderRepository {
  // CRUD operations
  findById(id: string): Promise<Tender | null>;
  findAll(): Promise<Tender[]>;
  save(tender: Tender | Record<string, any>): Promise<Tender | null>;
  update(id: string, data: Partial<Tender>): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Query methods
  findByProjectId(projectId: string): Promise<Tender[]>;
  findByStatus(status: TenderStatus): Promise<Tender[]>;
  findBySelectionMode(mode: SelectionMode): Promise<Tender[]>;
  findByMarketType(type: MarketType): Promise<Tender[]>;
  findByTenderNumber(tenderNumber: string): Promise<Tender | null>;
  
  // Open tenders
  findOpen(): Promise<Tender[]>;
  findAcceptingSubmissions(): Promise<Tender[]>;
  
  // Date-based queries
  findPublishedBetween(startDate: string, endDate: string): Promise<Tender[]>;
  findDeadlineApproaching(days: number): Promise<Tender[]>;
  findDeadlinePassed(): Promise<Tender[]>;
  
  // Statistics
  countByStatus(): Promise<Record<TenderStatus, number>>;
}
