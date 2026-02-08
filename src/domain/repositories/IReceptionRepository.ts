/**
 * Reception Repository Interface - Hexagonal Architecture
 * Defines contract for reception data persistence operations
 */

import { ReceptionDTO } from '@/dtos/entities/ReceptionDTO';

export interface IReceptionRepository {
  // CRUD Operations
  create(reception: Omit<ReceptionDTO, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReceptionDTO>;
  findById(id: string): Promise<ReceptionDTO | null>;
  findByProjectId(projectId: string): Promise<ReceptionDTO[]>;
  update(id: string, updates: Partial<ReceptionDTO>): Promise<ReceptionDTO>;
  delete(id: string): Promise<void>;
  
  // Query Operations
  findByType(projectId: string, type: 'provisional' | 'definitive'): Promise<ReceptionDTO[]>;
  findByStatus(status: string): Promise<ReceptionDTO[]>;
  findByDateRange(startDate: string, endDate: string): Promise<ReceptionDTO[]>;
  findByChairman(chairmanId: string): Promise<ReceptionDTO[]>;
  
  // Batch Operations
  createBatch(receptions: Omit<ReceptionDTO, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<ReceptionDTO[]>;
  updateBatch(updates: Array<{ id: string; data: Partial<ReceptionDTO> }>): Promise<ReceptionDTO[]>;
  
  // Search and Filter
  search(criteria: {
    projectId?: string;
    type?: 'provisional' | 'definitive';
    status?: string;
    dateRange?: { start: string; end: string };
    chairmanId?: string;
  }): Promise<ReceptionDTO[]>;
  
  // Validation and Workflow
  validateReception(id: string): Promise<boolean>;
  getReceptionWorkflow(projectId: string): Promise<any>;
  
  // Document Management
  addDocument(receptionId: string, document: any): Promise<void>;
  removeDocument(receptionId: string, documentId: string): Promise<void>;
  getDocuments(receptionId: string): Promise<any[]>;
  
  // Committee Management
  updateCommittee(receptionId: string, committee: string[]): Promise<void>;
  addCommitteeMember(receptionId: string, member: any): Promise<void>;
  removeCommitteeMember(receptionId: string, memberId: string): Promise<void>;
  
  // Findings and Decisions
  addFinding(receptionId: string, finding: any): Promise<void>;
  updateFinding(receptionId: string, findingId: string, finding: any): Promise<void>;
  addDecision(receptionId: string, decision: any): Promise<void>;
  
  // Statistics and Reporting
  getReceptionStats(projectId: string): Promise<{
    total: number;
    provisional: number;
    definitive: number;
    approved: number;
    pending: number;
    rejected: number;
  }>;
  
  getReceptionTimeline(projectId: string): Promise<Array<{
    date: string;
    type: 'provisional' | 'definitive';
    status: string;
    description: string;
  }>>;
}
