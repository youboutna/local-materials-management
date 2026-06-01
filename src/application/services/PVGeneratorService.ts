/**
 * PV Generator Service - Hexagonal Architecture
 * Service for generating inspection PV (Procès-Verbaux)
 */

import jsPDF from 'jspdf';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import {
  GeneratedPV,
  PVType,
  ConformityStatus,
} from '@/types/inspection-execution';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Service DTOs for data exchange
export interface InspectionWithProjectDTO {
  id: string;
  project_id: string;
  phase_id?: string | null;
  date: string;
  inspector: string;
  status: string;
  comments?: string | null;
  progress_at_inspection: number;
  documents?: unknown[];
  projects?: {
    title: string;
    location?: string;
  } | null;
  project_phases?: {
    phase_name: string;
  } | null;
}

export interface GeneratePVRequestDto {
  inspectionId: string;
  pvType: PVType;
  customTitle?: string;
  customContent?: string;
}

export interface PVGenerationResult {
  success: boolean;
  pv?: GeneratedPV;
  error?: string;
}

export class PVGeneratorService {
  private pvCounter = 1;
  private inspectionRepository: IInspectionRepository;
  private projectRepository: IProjectRepository;
  private phaseRepository: IPhaseRepository;
  private documentRepository: IDocumentRepository;
  private pvRepository = RepositoryFactory.getPVGeneratorRepository();

  constructor() {
    this.inspectionRepository = RepositoryFactory.getInspectionRepository();
    this.projectRepository = RepositoryFactory.getProjectRepository();
    this.phaseRepository = RepositoryFactory.getPhaseRepository();
    this.documentRepository = RepositoryFactory.getDocumentRepository();
  }

  /**
   * Generate PV from inspection data
   */
  async generatePV(request: GeneratePVRequestDto): Promise<PVGenerationResult> {
    try {
      if (!request.inspectionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      }

      // Fetch inspection with project info
      const inspection = await this.getInspectionWithProject(request.inspectionId);
      if (!inspection) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');
      }

      // Generate PV content
      const pvContent = this.generatePVContent(inspection, request.pvType);
      
      // Create PDF
      const pdf = new jsPDF();
      pdf.text(pvContent, 10, 10);
      const pdfUrl = pdf.output('datauristring');
      
      const pvNumber = `PV-${format(new Date(), 'yyyyMMdd')}-${String(this.pvCounter++).padStart(4, '0')}`;
      
      // Create GeneratedPV object
      const generatedPV: GeneratedPV = {
        id: `pv-${Date.now()}`,
        inspection_id: request.inspectionId,
        pv_type: request.pvType,
        pv_number: pvNumber,
        title: request.customTitle || `Procès-Verbal - ${inspection.projects?.title || 'Projet'}`,
        header: {
          project_title: inspection.projects?.title || 'Projet',
          phase_name: inspection.project_phases?.phase_name,
          inspection_date: inspection.date,
          inspection_type: request.pvType,
          location: inspection.projects?.location || 'Non spécifié'
        },
        participants: [],
        object: `Inspection ${request.pvType === 'technical_inspection' ? 'technique' : 'de sécurité'}`,
        observations_summary: request.customContent || inspection.comments || 'Aucune observation particulière',
        observations_table: [],
        conclusions: {
          overall_status: inspection.status === 'approved' ? 'conform' : 'non_conform',
          summary: `Progression: ${inspection.progress_at_inspection}%`
        },
        recommendations: [],
        signatures: [],
        annexes: [],
        status: 'draft',
        generated_at: new Date().toISOString(),
        generated_by: inspection.inspector,
        version: 1,
        pdf_url: pdfUrl
      };

      // Persist PV via repository
      try {
        const saved = await this.pvRepository.savePV({
          inspection_id: request.inspectionId,
          pv_number: pvNumber,
          pv_type: request.pvType,
          title: generatedPV.title,
          content: pvContent,
          pdf_url: pdfUrl,
          status: generatedPV.status,
          generated_by: generatedPV.generated_by,
          version: generatedPV.version,
          metadata: { header: generatedPV.header, conclusions: generatedPV.conclusions },
          generated_at: generatedPV.generated_at,
        });
        if (saved && saved.id) {
          generatedPV.id = saved.id;
        }
      } catch (persistError) {
        console.error('PVGeneratorService.generatePV: failed to persist PV', persistError);
        throw persistError instanceof AppError
          ? persistError
          : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to persist generated PV');
      }

      return { success: true, pv: generatedPV };


    } catch (error) {
      console.error('PVGeneratorService.generatePV failed:', error);
      if (error instanceof AppError) {
        return { success: false, error: error.message };
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Fetch inspection with project info from repository
   */
  private async getInspectionWithProject(inspectionId: string): Promise<InspectionWithProjectDTO | null> {
    try {
      if (!inspectionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      }

      // Get inspection with project and phase data
      const inspection = await this.inspectionRepository.findById(inspectionId);
      
      if (!inspection) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');
      }

      // Get project data
      const project = await this.projectRepository.findById(inspection.projectId || '');
      
      if (!project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }

      // Get phase data if available
      let phase: unknown = null;
      if (inspection.phaseId) {
        phase = await this.phaseRepository.findById(inspection.phaseId);
      }

      // Get related documents - use findAll as getAll is not available
      const documents = await this.documentRepository.findAll();

      return {
        id: inspection.id,
        project_id: inspection.projectId || '',
        phase_id: inspection.phaseId || undefined,
        date: inspection.date,
        inspector: typeof inspection.inspector === 'string' ? inspection.inspector : inspection.inspector?.name || '',
        status: inspection.status,
        comments: inspection.comments,
        progress_at_inspection: inspection.progressAtInspection || 0,
        documents: documents || [],
        projects: {
          title: project.title,
          location: project.location
        },
        project_phases: phase && typeof phase === 'object' && phase !== null && 'name' in phase ? {
          phase_name: (phase as { name?: string }).name || 'Phase'
        } : undefined
      };
    } catch (error) {
      console.error('PVGeneratorService.getInspectionWithProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get inspection with project');
    }
  }

  /**
   * Generate PV content based on inspection data
   */
  private generatePVContent(
    inspection: InspectionWithProjectDTO,
    pvType: PVType
  ): string {
    const date = format(new Date(inspection.date), 'dd MMMM yyyy', { locale: fr });
    
    let content = '';
    
    if (pvType === 'technical_inspection') {
      content = `
PROCÈS-VERBAL D'INSPECTION TECHNIQUE
${inspection.projects?.title || 'Projet'} - ${inspection.projects?.location || 'Lieu'}
${inspection.project_phases?.phase_name ? `Phase: ${inspection.project_phases.phase_name}` : ''}

Date: ${date}
Inspecteur: ${inspection.inspector}

Objet de l'inspection:
${inspection.comments || 'Aucun commentaire particulier'}

Progression à l'inspection: ${inspection.progress_at_inspection}%

Conformité: ${inspection.status === 'approved' ? 'CONFORME' : 'NON CONFORME'}

${inspection.documents ? 'Documents joints: ' + (Array.isArray(inspection.documents) ? inspection.documents.length : 1) + ' document(s)' : ''}

Fait à ${inspection.projects?.location || 'Lieu'}, le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}
      `;
    } else if (pvType === 'safety_inspection') {
      content = `
PROCÈS-VERBAL D'INSPECTION SÉCURITÉ
${inspection.projects?.title || 'Projet'} - ${inspection.projects?.location || 'Lieu'}
${inspection.project_phases?.phase_name ? `Phase: ${inspection.project_phases.phase_name}` : ''}

Date: ${date}
Inspecteur: ${inspection.inspector}

Objet de l'inspection:
${inspection.comments || 'Aucun commentaire particulier'}

Progression à l'inspection: ${inspection.progress_at_inspection}%

Conformité sécurité: ${inspection.status === 'approved' ? 'CONFORME' : 'NON CONFORME'}

${inspection.documents ? 'Documents joints: ' + (Array.isArray(inspection.documents) ? inspection.documents.length : 1) + ' document(s)' : ''}

Fait à ${inspection.projects?.location || 'Lieu'}, le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}
      `;
    }

    return content;
  }

  /**
   * Get all PVs for an inspection
   */
  async getInspectionPVs(inspectionId: string): Promise<GeneratedPV[]> {
    try {
      if (!inspectionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      }

      // For now, return empty array as PV repository is not available
      // TODO: Implement proper PV retrieval when PV repository is available
      console.warn('PVGeneratorService.getInspectionPVs: PV repository not available');
      
      return [];
    } catch (error) {
      console.error('PVGeneratorService.getInspectionPVs failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get inspection PVs');
    }
  }

  /**
   * Download PV as PDF
   */
  async downloadPV(pvId: string): Promise<string | null> {
    try {
      if (!pvId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'PV ID is required');
      }

      // For now, return null as PV repository is not available
      // TODO: Implement proper PV download when PV repository is available
      console.warn('PVGeneratorService.downloadPV: PV repository not available');
      console.log(`Downloading PV: ${pvId}`);
      
      return null;
    } catch (error) {
      console.error('PVGeneratorService.downloadPV failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to download PV');
    }
  }

  /**
   * Get PV by ID
   */
  async getPVById(pvId: string): Promise<GeneratedPV | null> {
    try {
      if (!pvId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'PV ID is required');
      }

      // For now, return null as PV repository is not available
      // TODO: Implement proper PV retrieval when PV repository is available
      console.warn('PVGeneratorService.getPVById: PV repository not available');
      
      return null;
    } catch (error) {
      console.error('PVGeneratorService.getPVById failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get PV by ID');
    }
  }
}
