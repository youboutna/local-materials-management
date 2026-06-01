/**
 * Reception Service - Hexagonal Architecture
 * Business logic for reception management operations
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IReceptionRepository } from '@/domain/repositories/IReceptionRepository';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { IEmployeeRepository } from '@/domain/repositories/IEmployeeRepository';
import { 
  ReceptionDTO, 
  ReceptionType, 
  ReceptionStatus,
  ReceptionDocumentDTO,
  ReceptionInspectionDTO,
  ReceptionFindingDTO,
  ReceptionDecisionDTO,
  ReceptionConditionDTO,
  ReceptionValidationDTO,
  ReceptionWorkflowDTO,
  ReceptionParticipantDTO
} from '@/dtos/entities/ReceptionDTO';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';
import { InspectionDTO } from '@/dtos/entities/InspectionDTO';
import { EmployeeDTO } from '@/dtos/entities/EmployeeDTO';

export class ReceptionService {
  constructor(
    private receptionRepository: IReceptionRepository,
    private documentRepository: IDocumentRepository,
    private inspectionRepository: IInspectionRepository,
    private employeeRepository: IEmployeeRepository
  ) {}

  // =================== RECEPTION CRUD ===================

  async createReception(receptionData: Omit<ReceptionDTO, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReceptionDTO> {
    try {
      // Validate reception data
      const validation = this.validateReceptionData(receptionData);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid reception data: ${validation.errors.join(', ')}`);
      }

      // Create reception
      const reception = await this.receptionRepository.create({
        ...receptionData,
        status: ReceptionStatus.PENDING
      } as any);

      return reception;
    } catch (error) {
      console.error('Failed to create reception:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create reception');
    }
  }

  async getReceptionById(id: string): Promise<ReceptionDTO | null> {
    try {
      return await this.receptionRepository.findById(id);
    } catch (error) {
      console.error('Failed to get reception:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to get reception');
    }
  }

  async getReceptionsByProject(projectId: string): Promise<ReceptionDTO[]> {
    try {
      return await this.receptionRepository.findByProjectId(projectId);
    } catch (error) {
      console.error('Failed to get receptions by project:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to get receptions by project');
    }
  }

  async updateReception(id: string, updates: Partial<ReceptionDTO>): Promise<ReceptionDTO> {
    try {
      const existingReception = await this.receptionRepository.findById(id);
      if (!existingReception) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Reception not found');
      }

      const updatedReception = await this.receptionRepository.update(id, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      return updatedReception;
    } catch (error) {
      console.error('Failed to update reception:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update reception');
    }
  }

  async deleteReception(id: string): Promise<void> {
    try {
      await this.receptionRepository.delete(id);
    } catch (error) {
      console.error('Failed to delete reception:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to delete reception');
    }
  }

  // =================== PROVISIONAL RECEPTION ===================

  async createProvisionalReception(projectId: string, phaseId: string, data: {
    scheduledDate: string;
    committee: string[];
    chairmanId: string;
    documents: File[];
    notes: string;
  }): Promise<ReceptionDTO> {
    try {
      // Validate chairman exists
      const chairman = await this.employeeRepository.findById(data.chairmanId);
      if (!chairman) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Chairman not found');
      }

      // Upload documents
      const uploadedDocuments = await this.uploadDocuments(projectId, data.documents);

      // Create provisional reception
      const reception = await this.createReception({
        projectId,
        phaseId,
        type: ReceptionType.PROVISIONAL,
        status: ReceptionStatus.PENDING,
        scheduledDate: data.scheduledDate,
        receptionCommittee: data.committee,
        chairmanId: data.chairmanId,
        chairmanName: (chairman as any).fullName || (chairman as any).full_name || 'Unknown',
        participants: await this.createParticipants(data.committee),
        documents: uploadedDocuments,
        inspections: [],
        findings: [],
        decisions: [],
        conditions: [],
        notes: data.notes,
        createdBy: chairman.id
      });

      return reception;
    } catch (error) {
      console.error('Failed to create provisional reception:', error);
      throw error;
    }
  }

  async approveProvisionalReception(receptionId: string, data: {
    findings: ReceptionFindingDTO[];
    conditions: ReceptionConditionDTO[];
    validUntil: string;
    notes: string;
    approvedBy: string;
  }): Promise<ReceptionDTO> {
    try {
      // Create approval decision
      const decision: ReceptionDecisionDTO = {
        id: `decision-${Date.now()}`,
        type: 'conditional_approval',
        description: 'Provisional reception approved with conditions',
        conditions: data.conditions.map(c => c.description),
        validUntil: data.validUntil,
        decidedBy: data.approvedBy,
        decidedAt: new Date().toISOString()
      };

      return await this.updateReception(receptionId, {
        status: ReceptionStatus.APPROVED,
        findings: data.findings,
        conditions: data.conditions,
        decisions: [decision],
        provisionalValidUntil: data.validUntil,
        notes: data.notes,
        actualDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to approve provisional reception:', error);
      throw error;
    }
  }

  // =================== DEFINITIVE RECEPTION ===================

  async createDefinitiveReception(projectId: string, data: {
    scheduledDate: string;
    committee: string[];
    chairmanId: string;
    provisionalReceptionId?: string;
    documents: File[];
    notes: string;
  }): Promise<ReceptionDTO> {
    try {
      // Validate provisional reception if provided
      if (data.provisionalReceptionId) {
        const provisionalReception = await this.getReceptionById(data.provisionalReceptionId);
        if (!provisionalReception || provisionalReception.type !== ReceptionType.PROVISIONAL) {
          throw new AppError(ErrorCode.NOT_FOUND, 'Invalid provisional reception');
        }
      }

      // Upload documents
      const uploadedDocuments = await this.uploadDocuments(projectId, data.documents);

      // Create definitive reception
      const reception = await this.createReception({
        projectId,
        type: ReceptionType.DEFINITIVE,
        status: ReceptionStatus.PENDING,
        scheduledDate: data.scheduledDate,
        receptionCommittee: data.committee,
        chairmanId: data.chairmanId,
        chairmanName: (await this.employeeRepository.findById(data.chairmanId) as any)?.fullName || 'Unknown',
        participants: await this.createParticipants(data.committee),
        documents: uploadedDocuments,
        inspections: [],
        findings: [],
        decisions: [],
        conditions: [],
        notes: data.notes,
        createdBy: data.chairmanId
      });

      return reception;
    } catch (error) {
      console.error('Failed to create definitive reception:', error);
      throw error;
    }
  }

  async approveDefinitiveReception(receptionId: string, data: {
    findings: ReceptionFindingDTO[];
    conditions: ReceptionConditionDTO[];
    notes: string;
    approvedBy: string;
    certificateNumber?: string;
  }): Promise<ReceptionDTO> {
    try {
      // Validate all conditions are met
      const validation = await this.validateDefinitiveReception(receptionId, data.findings, data.conditions);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Cannot approve reception: ${validation.errors.join(', ')}`);
      }

      // Create approval decision
      const decision: ReceptionDecisionDTO = {
        id: `decision-${Date.now()}`,
        type: data.conditions.length > 0 ? 'conditional_approval' : 'approval',
        description: 'Definitive reception approved',
        conditions: data.conditions.map(c => c.description),
        decidedBy: data.approvedBy,
        decidedAt: new Date().toISOString()
      };

      return await this.updateReception(receptionId, {
        status: ReceptionStatus.APPROVED,
        findings: data.findings,
        conditions: data.conditions,
        decisions: [decision],
        definitiveApprovalDate: new Date().toISOString(),
        notes: `${data.notes}${data.certificateNumber ? `\nCertificate Number: ${data.certificateNumber}` : ''}`,
        actualDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to approve definitive reception:', error);
      throw error;
    }
  }

  // =================== VALIDATION ===================

  async validateReception(receptionId: string): Promise<ReceptionValidationDTO> {
    try {
      const reception = await this.getReceptionById(receptionId);
      if (!reception) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Reception not found');
      }

      const errors: any[] = [];
      const warnings: any[] = [];
      const recommendations: string[] = [];

      // Validate required documents
      const requiredDocuments = this.getRequiredDocuments(reception.type);
      const submittedDocuments = reception.documents.filter(d => d.isRequired);
      const missingDocuments = requiredDocuments.filter(req => 
        !submittedDocuments.find(sub => sub.type === req)
      );

      if (missingDocuments.length > 0) {
        errors.push({
          field: 'documents',
          code: 'MISSING_DOCUMENTS',
          message: `Missing required documents: ${missingDocuments.join(', ')}`,
          severity: 'error',
          suggestedFix: 'Upload all required documents'
        });
      }

      // Validate inspections
      const inspectionsCompleted = reception.inspections.every(i => i.status === 'completed');
      if (!inspectionsCompleted) {
        warnings.push({
          field: 'inspections',
          code: 'PENDING_INSPECTIONS',
          message: 'Some inspections are not yet completed',
          severity: 'warning',
          recommendation: 'Complete all inspections before approval'
        });
      }

      // Validate findings resolution
      const criticalFindings = reception.findings.filter(f => f.severity === 'critical');
      const unresolvedCriticalFindings = criticalFindings.filter(f => f.resolutionStatus !== 'resolved');
      if (unresolvedCriticalFindings.length > 0) {
        errors.push({
          field: 'findings',
          code: 'UNRESOLVED_CRITICAL_FINDINGS',
          message: `${unresolvedCriticalFindings.length} critical findings must be resolved`,
          severity: 'error',
          suggestedFix: 'Resolve all critical findings before approval'
        });
      }

      // Generate recommendations
      if (reception.type === ReceptionType.PROVISIONAL && reception.provisionalValidUntil) {
        recommendations.push('Schedule definitive reception before provisional approval expires');
      }

      return {
        isValid: errors.length === 0 && warnings.length === 0,
        receptionType: reception.type,
        requiredDocuments,
        submittedDocuments: submittedDocuments.map(d => d.type),
        missingDocuments,
        invalidDocuments: [],
        inspectionsCompleted,
        findingsResolved: unresolvedCriticalFindings.length === 0,
        conditionsMet: reception.conditions.filter(c => c.status === 'completed').length === reception.conditions.length,
        errors,
        warnings,
        recommendations
      };
    } catch (error) {
      console.error('Failed to validate reception:', error);
      throw error;
    }
  }

  // =================== HELPER METHODS ===================

  private validateReceptionData(data: Omit<ReceptionDTO, 'id' | 'createdAt' | 'updatedAt'>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.projectId) errors.push('Project ID is required');
    if (!data.type) errors.push('Reception type is required');
    if (!data.scheduledDate) errors.push('Scheduled date is required');
    if (!data.chairmanId) errors.push('Chairman ID is required');
    if (!data.receptionCommittee || data.receptionCommittee.length === 0) {
      errors.push('Reception committee is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async uploadDocuments(projectId: string, files: File[]): Promise<ReceptionDocumentDTO[]> {
    const { supabase } = await import('@/integrations/supabase/client');
    const documents: ReceptionDocumentDTO[] = [];

    for (const file of files) {
      const docId = crypto.randomUUID();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `receptions/${projectId}/${docId}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from('project-documents')
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('project-documents').getPublicUrl(path);

      const nowIso = new Date().toISOString();
      const document = {
        id: docId,
        projectId,
        title: file.name,
        description: `Uploaded document: ${file.name}`,
        type: this.getDocumentType(file.type),
        fileUrl: pub.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: nowIso,
        uploadedBy: 'system',
        isRequired: true,
        isSubmitted: true,
        validationStatus: 'pending',
        createdAt: nowIso,
        updatedAt: nowIso,
      } as ReceptionDocumentDTO;
      documents.push(document);
    }

    return documents;
  }

  private getDocumentType(mimeType: string): ReceptionDocumentDTO['type'] {
    if (mimeType.includes('pdf')) return 'certificate';
    if (mimeType.includes('image')) return 'photo';
    if (mimeType.includes('text')) return 'report';
    if (mimeType.includes('application/vnd.ms-excel') || mimeType.includes('application/vnd.openxmlformats')) return 'plan';
    return 'other';
  }

  private async createParticipants(committee: string[]): Promise<ReceptionParticipantDTO[]> {
    const participants: ReceptionParticipantDTO[] = [];
    
    for (const member of committee) {
      participants.push({
        id: crypto.randomUUID(),
        name: member,
        role: 'committee_member',
        organization: 'organization',
        hasApproved: false
      });
    }

    return participants;
  }

  private getRequiredDocuments(type: ReceptionType): string[] {
    if (type === ReceptionType.PROVISIONAL) {
      return ['certificate', 'report', 'plan'];
    } else {
      return ['certificate', 'report', 'photo', 'plan'];
    }
  }

  private async validateDefinitiveReception(
    receptionId: string, 
    findings: ReceptionFindingDTO[], 
    conditions: ReceptionConditionDTO[]
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check if all critical findings are resolved
    const criticalFindings = findings.filter(f => f.severity === 'critical');
    const unresolvedCritical = criticalFindings.filter(f => f.resolutionStatus !== 'resolved');
    if (unresolvedCritical.length > 0) {
      errors.push(`All critical findings must be resolved (${unresolvedCritical.length} remaining)`);
    }

    // Check if all conditions are met
    const unmetConditions = conditions.filter(c => c.status !== 'completed');
    if (unmetConditions.length > 0) {
      errors.push(`All conditions must be completed (${unmetConditions.length} remaining)`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // =================== WORKFLOW MANAGEMENT ===================

  async getReceptionWorkflow(projectId: string): Promise<ReceptionWorkflowDTO> {
    try {
      const receptions = await this.getReceptionsByProject(projectId);
      
      const hasProvisional = receptions.some(r => r.type === ReceptionType.PROVISIONAL);
      const hasDefinitive = receptions.some(r => r.type === ReceptionType.DEFINITIVE);
      
      const steps: any[] = [
        { step: 1, name: 'provisional', title: 'Réception Provisoire', status: hasProvisional ? 'completed' : 'pending' },
        { step: 2, name: 'definitive', title: 'Réception Définitive', status: hasDefinitive ? 'completed' : 'pending' }
      ];

      const currentStep = hasProvisional && !hasDefinitive ? 1 : hasDefinitive ? 2 : 0;
      const totalSteps = 2;

      return {
        projectId,
        currentStep,
        totalSteps,
        steps,
        status: currentStep === 0 ? 'not_started' : currentStep === totalSteps ? 'approved' : 'in_progress',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get reception workflow:', error);
      throw error;
    }
  }
}
