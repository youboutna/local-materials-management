// Repository interface for Risk entity
import { Risk } from '../entities/Risk';
import { RiskStatus, RiskLevel, RiskCategory } from '../entities/RiskTypesExport';

export interface IRiskRepository {
  // CRUD operations
  findById(id: string): Promise<Risk | null>;
  findAll(): Promise<Risk[]>;
  save(risk: Risk): Promise<void>;
  update(id: string, data: Partial<Risk>): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Query methods
  findByProjectId(projectId: string): Promise<Risk[]>;
  findByStatus(status: RiskStatus): Promise<Risk[]>;
  findByLevel(level: RiskLevel): Promise<Risk[]>;
  findActive(): Promise<Risk[]>;
  findCritical(): Promise<Risk[]>;
  
  // Statistics
  countByStatus(projectId: string): Promise<Record<RiskStatus, number>>;
  countByLevel(projectId: string): Promise<Record<RiskLevel, number>>;
  getAverageRiskScore(projectId: string): Promise<number>;
  
  // Risk assessment
  getHighestRisks(projectId: string, limit: number): Promise<Risk[]>;
  getUnmitigatedRisks(projectId: string): Promise<Risk[]>;
}
