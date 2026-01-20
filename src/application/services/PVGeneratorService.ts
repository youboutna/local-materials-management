/**
 * Service for generating inspection PV (Procès-Verbaux)
 */
import jsPDF from 'jspdf';
import {
  GeneratedPV,
  PVType,
  InspectionExecutionData,
  ConformityStatus,
} from '@/types/inspection-execution';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { IPVGeneratorRepository } from '@/domain/repositories/IPVGeneratorRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

interface InspectionWithProject {
  id: string;
  project_id: string;
  phase_id?: string | null;
  date: string;
  inspector: string;
  status: string;
  comments?: string | null;
  progress_at_inspection: number;
  documents?: any;
  projects?: {
    title: string;
    location?: string;
  } | null;
  project_phases?: {
    phase_name: string;
  } | null;
}

export class PVGeneratorService {
  private pvRepository: IPVGeneratorRepository;

  constructor() {
    this.pvRepository = RepositoryFactory.getPVGeneratorRepository();
  }
  
  /**
   * Generate PV from inspection data
   */
  async generatePV(
    inspectionId: string,
    pvType: PVType = 'technical_inspection'
  ): Promise<GeneratedPV | null> {
    try {
      // Fetch inspection with project info
      const inspection = await this.pvRepository.getInspectionWithProject(inspectionId);
      if (!inspection) return null;

      // Generate PV content
      const pvContent = this.generatePVContent(inspection, pvType);
      
      // Create PDF
      const pdf = new jsPDF();
      pdf.text(pvContent, 10, 10);
      
      // Save to database
      const savedPV = await this.pvRepository.savePV({
        inspection_id: inspectionId,
        pv_type: pvType,
        content: pdf.output('datauristring'),
        generated_at: new Date().toISOString(),
      });

      // Return generated PV
      return {
        id: savedPV.id,
        inspection_id: inspectionId,
        pv_type: pvType,
        generated_at: savedPV.generated_at,
        download_url: '', // Could be generated
      };

    } catch (error) {
      console.error('Error generating PV:', error);
      return null;
    }
  }

  /**
   * Generate PV content based on inspection data
   */
  private generatePVContent(
    inspection: InspectionWithProject,
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

${inspection.documents ? 'Documents joints: ' + inspection.documents.length + ' document(s)' : ''}

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

${inspection.documents ? 'Documents joints: ' + inspection.documents.length + ' document(s)' : ''}

Fait à ${inspection.projects?.location || 'Lieu'}, le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}
      `;
    }

    return content;
  }

  /**
   * Get all PVs for an inspection
   */
  async getInspectionPVs(inspectionId: string): Promise<any[]> {
    return await this.pvRepository.getInspectionPVs(inspectionId);
  }

  /**
   * Download PV as PDF
   */
  async downloadPV(pvId: string): Promise<string | null> {
    return await this.pvRepository.getPVContent(pvId);
  }
}
