/**
 * Compliance Repository Interface
 * Defines the contract for compliance data access following hexagonal architecture
 */

import { ComplianceItem, ComplianceDocument, ComplianceNote, ComplianceAuditEntry } from '@/domain/entities/Compliance';

export interface IComplianceRepository {
  // Main compliance operations
  findById(id: string): Promise<ComplianceItem | null>;
  findByProject(projectId: string): Promise<ComplianceItem[]>;
  findByFilter(filter: {
    projectId?: string;
    type?: string;
    status?: string;
    priority?: string;
    responsible?: string;
    deadline?: string;
    riskLevel?: string;
    mitigationRequired?: boolean;
  }): Promise<ComplianceItem[]>;
  save(entity: ComplianceItem): Promise<ComplianceItem>;
  update(id: string, entity: ComplianceItem): Promise<ComplianceItem>;
  delete(id: string): Promise<void>;

  // Document operations
  findDocumentsByComplianceItem(complianceItemId: string): Promise<ComplianceDocument[]>;
  saveDocument(document: ComplianceDocument): Promise<ComplianceDocument>;
  updateDocument(id: string, document: Partial<ComplianceDocument>): Promise<ComplianceDocument>;
  deleteDocument(id: string): Promise<void>;

  // Note operations
  findNotesByComplianceItem(complianceItemId: string): Promise<ComplianceNote[]>;
  saveNote(note: ComplianceNote): Promise<ComplianceNote>;
  updateNote(id: string, note: Partial<ComplianceNote>): Promise<ComplianceNote>;
  deleteNote(id: string): Promise<void>;

  // Audit operations
  saveAuditEntry(auditEntry: ComplianceAuditEntry): Promise<ComplianceAuditEntry>;
  findAuditByComplianceItem(complianceItemId: string): Promise<ComplianceAuditEntry[]>;

  // Statistics operations
  getComplianceStatistics(projectId: string): Promise<{
    totalItems: number;
    approvedItems: number;
    pendingItems: number;
    inProgressItems: number;
    rejectedItems: number;
    criticalItems: number;
    overdueItems: number;
  }>;
}
