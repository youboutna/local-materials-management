/**
 * Service for generating inspection PV (Procès-Verbaux)
 * Uses in-memory storage as the PV tables don't exist in the database
 */
import jsPDF from 'jspdf';
import {
  GeneratedPV,
  PVType,
  ConformityStatus,
} from '@/types/inspection-execution';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

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

// In-memory store for generated PVs
const pvStore = new Map<string, GeneratedPV>();
let pvCounter = 1;

export class PVGeneratorService {
  /**
   * Generate PV from inspection data
   */
  async generatePV(
    inspectionId: string,
    pvType: PVType = 'technical_inspection'
  ): Promise<GeneratedPV | null> {
    try {
      // Fetch inspection with project info
      const inspection = await this.getInspectionWithProject(inspectionId);
      if (!inspection) return null;

      // Generate PV content
      const pvContent = this.generatePVContent(inspection, pvType);
      
      // Create PDF
      const pdf = new jsPDF();
      pdf.text(pvContent, 10, 10);
      const pdfUrl = pdf.output('datauristring');
      
      const pvNumber = `PV-${format(new Date(), 'yyyyMMdd')}-${String(pvCounter++).padStart(4, '0')}`;
      
      // Create GeneratedPV object
      const generatedPV: GeneratedPV = {
        id: crypto.randomUUID(),
        inspection_id: inspectionId,
        pv_type: pvType,
        pv_number: pvNumber,
        title: `Procès-Verbal - ${inspection.projects?.title || 'Projet'}`,
        header: {
          project_title: inspection.projects?.title || 'Projet',
          phase_name: inspection.project_phases?.phase_name,
          inspection_date: inspection.date,
          inspection_type: pvType,
          location: inspection.projects?.location || 'Non spécifié'
        },
        participants: [],
        object: `Inspection ${pvType === 'technical_inspection' ? 'technique' : 'de sécurité'}`,
        observations_summary: inspection.comments || 'Aucune observation particulière',
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

      // Store in memory
      pvStore.set(generatedPV.id, generatedPV);

      return generatedPV;

    } catch (error) {
      console.error('Error generating PV:', error);
      return null;
    }
  }

  /**
   * Fetch inspection with project info from Supabase
   */
  private async getInspectionWithProject(inspectionId: string): Promise<InspectionWithProject | null> {
    const { data, error } = await supabase
      .from('inspections')
      .select(`
        *,
        projects:project_id (title, location),
        project_phases:phase_id (phase_name)
      `)
      .eq('id', inspectionId)
      .single();

    if (error || !data) return null;
    
    return {
      id: data.id,
      project_id: data.project_id,
      phase_id: data.phase_id,
      date: data.date,
      inspector: data.inspector,
      status: data.status,
      comments: data.comments,
      progress_at_inspection: data.progress_at_inspection,
      documents: data.documents,
      projects: data.projects as any,
      project_phases: data.project_phases as any
    };
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
    const pvs: GeneratedPV[] = [];
    pvStore.forEach(pv => {
      if (pv.inspection_id === inspectionId) {
        pvs.push(pv);
      }
    });
    return pvs;
  }

  /**
   * Download PV as PDF
   */
  async downloadPV(pvId: string): Promise<string | null> {
    const pv = pvStore.get(pvId);
    return pv?.pdf_url || null;
  }

  /**
   * Get PV by ID
   */
  async getPVById(pvId: string): Promise<GeneratedPV | null> {
    return pvStore.get(pvId) || null;
  }
}
