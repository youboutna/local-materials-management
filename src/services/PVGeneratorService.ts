import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import {
  GeneratedPV,
  PVType,
  InspectionExecutionData,
  ConformityStatus,
} from '@/types/inspection-execution';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

/**
 * Service for generating inspection PV (Procès-Verbaux)
 */
export class PVGeneratorService {
  
  /**
   * Generate PV from inspection data
   */
  static async generatePV(
    inspectionId: string,
    pvType: PVType = 'technical_inspection'
  ): Promise<GeneratedPV | null> {
    try {
      // Fetch inspection with project info
      const { data: inspection, error } = await supabase
        .from('inspections')
        .select(`
          *,
          projects (title, location),
          project_phases (phase_name)
        `)
        .eq('id', inspectionId)
        .single();

      if (error || !inspection) {
        console.error('Error fetching inspection:', error);
        return null;
      }

      const typedInspection = inspection as InspectionWithProject;
      const executionData = typedInspection.documents as InspectionExecutionData | null;

      // Generate PV number
      const pvNumber = await this.generatePVNumber(typedInspection.project_id, pvType);

      const pv: GeneratedPV = {
        id: crypto.randomUUID(),
        inspection_id: inspectionId,
        pv_type: pvType,
        pv_number: pvNumber,
        title: this.getPVTitle(pvType),
        
        header: {
          project_title: typedInspection.projects?.title || 'Projet non spécifié',
          phase_name: typedInspection.project_phases?.phase_name,
          inspection_date: typedInspection.date,
          inspection_type: this.getInspectionTypeLabel(pvType),
          location: typedInspection.projects?.location || 'Non spécifié',
        },
        
        participants: executionData?.participants || [],
        object: this.generateObject(pvType, typedInspection),
        observations_summary: typedInspection.comments || executionData?.summary || '',
        
        observations_table: (executionData?.observations || []).map(obs => ({
          category: obs.category,
          observation: obs.description,
          conformity: obs.conformity,
          action: obs.corrective_action,
        })),
        
        conclusions: {
          overall_status: executionData?.overall_conformity || 'partial',
          summary: this.generateConclusion(executionData, typedInspection),
          conditions: this.generateConditions(executionData),
        },
        
        recommendations: executionData?.recommendations || [],
        
        reserves: (executionData?.observations || [])
          .filter(o => o.conformity === 'non_conform' && o.severity)
          .map(o => ({
            description: o.description,
            severity: o.severity!,
            deadline: o.deadline || format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            responsible: 'À définir',
          })),
        
        signatures: this.getRequiredSignatures(pvType),
        
        annexes: (executionData?.documents || []).map(doc => ({
          title: doc.name,
          document_url: doc.url,
        })),
        
        status: 'draft',
        generated_at: new Date().toISOString(),
        generated_by: (await supabase.auth.getUser()).data.user?.id || 'system',
        version: 1,
      };

      return pv;
    } catch (error) {
      console.error('[PVGeneratorService] generatePV error:', error);
      return null;
    }
  }

  /**
   * Generate PDF from PV data
   */
  static async generatePDF(pv: GeneratedPV): Promise<{ blob: Blob; fileName: string }> {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = 40;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(pv.title, pageWidth / 2, y, { align: 'center' });
    y += 30;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`N° ${pv.pv_number}`, pageWidth / 2, y, { align: 'center' });
    y += 40;

    // Project info box
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(1);
    doc.rect(margin, y, pageWidth - 2 * margin, 80);
    
    y += 20;
    doc.setFontSize(10);
    doc.text(`Projet: ${pv.header.project_title}`, margin + 10, y);
    y += 15;
    if (pv.header.phase_name) {
      doc.text(`Phase: ${pv.header.phase_name}`, margin + 10, y);
      y += 15;
    }
    doc.text(`Date d'inspection: ${format(new Date(pv.header.inspection_date), 'dd MMMM yyyy', { locale: fr })}`, margin + 10, y);
    y += 15;
    doc.text(`Type: ${pv.header.inspection_type}`, margin + 10, y);
    y += 15;
    doc.text(`Lieu: ${pv.header.location}`, margin + 10, y);
    y += 40;

    // Object
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('OBJET', margin, y);
    y += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const objectLines = doc.splitTextToSize(pv.object, pageWidth - 2 * margin);
    doc.text(objectLines, margin, y);
    y += objectLines.length * 12 + 20;

    // Participants
    if (pv.participants.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PARTICIPANTS', margin, y);
      y += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      pv.participants.forEach(p => {
        doc.text(`• ${p.name} - ${p.role}${p.organization ? ` (${p.organization})` : ''}`, margin + 10, y);
        y += 12;
      });
      y += 15;
    }

    // Observations summary
    if (pv.observations_summary) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVATIONS', margin, y);
      y += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const summaryLines = doc.splitTextToSize(pv.observations_summary, pageWidth - 2 * margin);
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * 12 + 20;
    }

    // Observations table
    if (pv.observations_table.length > 0) {
      // Check if we need a new page
      if (y > 650) {
        doc.addPage();
        y = 40;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TABLEAU DES OBSERVATIONS', margin, y);
      y += 20;

      // Table header
      const colWidths = [120, 200, 80, 100];
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, pageWidth - 2 * margin, 20, 'F');
      doc.setFontSize(9);
      doc.text('Catégorie', margin + 5, y + 14);
      doc.text('Observation', margin + colWidths[0] + 5, y + 14);
      doc.text('Conformité', margin + colWidths[0] + colWidths[1] + 5, y + 14);
      doc.text('Action', margin + colWidths[0] + colWidths[1] + colWidths[2] + 5, y + 14);
      y += 20;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      pv.observations_table.slice(0, 10).forEach(obs => {
        if (y > 750) {
          doc.addPage();
          y = 40;
        }
        doc.rect(margin, y, pageWidth - 2 * margin, 25);
        doc.text(obs.category.substring(0, 15), margin + 5, y + 15);
        doc.text(obs.observation.substring(0, 35), margin + colWidths[0] + 5, y + 15);
        doc.text(this.getConformityLabel(obs.conformity), margin + colWidths[0] + colWidths[1] + 5, y + 15);
        doc.text((obs.action || '-').substring(0, 15), margin + colWidths[0] + colWidths[1] + colWidths[2] + 5, y + 15);
        y += 25;
      });
      y += 20;
    }

    // Conclusions
    if (y > 650) {
      doc.addPage();
      y = 40;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CONCLUSIONS', margin, y);
    y += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Statut global: ${this.getConformityLabel(pv.conclusions.overall_status)}`, margin, y);
    y += 15;
    const conclusionLines = doc.splitTextToSize(pv.conclusions.summary, pageWidth - 2 * margin);
    doc.text(conclusionLines, margin, y);
    y += conclusionLines.length * 12 + 20;

    // Recommendations
    if (pv.recommendations.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RECOMMANDATIONS', margin, y);
      y += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      pv.recommendations.forEach((rec, i) => {
        doc.text(`${i + 1}. ${rec}`, margin + 10, y);
        y += 12;
      });
      y += 15;
    }

    // Reserves
    if (pv.reserves && pv.reserves.length > 0) {
      if (y > 650) {
        doc.addPage();
        y = 40;
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RÉSERVES', margin, y);
      y += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      pv.reserves.forEach((res, i) => {
        doc.text(`${i + 1}. ${res.description}`, margin + 10, y);
        y += 12;
        doc.text(`   Gravité: ${res.severity} | Délai: ${res.deadline}`, margin + 10, y);
        y += 15;
      });
    }

    // Signatures section
    if (y > 600) {
      doc.addPage();
      y = 40;
    }
    y += 30;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SIGNATURES', margin, y);
    y += 25;

    const sigWidth = (pageWidth - 2 * margin - 40) / 2;
    let sigX = margin;
    pv.signatures.forEach((sig, i) => {
      if (i > 0 && i % 2 === 0) {
        y += 70;
        sigX = margin;
      }
      doc.rect(sigX, y, sigWidth, 60);
      doc.setFontSize(9);
      doc.text(sig.role, sigX + 5, y + 15);
      doc.text(sig.name || '________________', sigX + 5, y + 30);
      doc.text('Date: ___/___/______', sigX + 5, y + 50);
      sigX += sigWidth + 40;
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')} - Page ${i}/${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 20,
        { align: 'center' }
      );
      doc.setTextColor(0);
    }

    const fileName = `PV_${pv.pv_number.replace(/\//g, '-')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
    const blob = doc.output('blob');

    return { blob, fileName };
  }

  /**
   * Save PV to storage and create document record
   */
  static async savePV(
    pv: GeneratedPV,
    projectId: string,
    inspectionId: string
  ): Promise<string | null> {
    try {
      const { blob, fileName } = await this.generatePDF(pv);

      // Upload to storage
      const filePath = `pv/${projectId}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);

      // Create document record
      const user = (await supabase.auth.getUser()).data.user;
      await supabase.from('documents').insert({
        title: `PV ${pv.pv_number} - ${pv.title}`,
        file_name: fileName,
        file_url: publicUrl,
        file_size: blob.size,
        mime_type: 'application/pdf',
        document_type: 'inspection_report' as const,
        project_id: projectId,
        inspection_id: inspectionId,
        uploaded_by: user?.id,
        status: 'approved' as const,
        metadata: {
          pv_number: pv.pv_number,
          pv_type: pv.pv_type,
          generated_at: pv.generated_at,
        } as any,
      });

      return publicUrl;
    } catch (error) {
      console.error('[PVGeneratorService] savePV error:', error);
      return null;
    }
  }

  // Helper methods
  private static async generatePVNumber(projectId: string, pvType: PVType): Promise<string> {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('document_type', 'inspection_report')
      .eq('project_id', projectId);

    const sequence = String((count || 0) + 1).padStart(3, '0');
    const typeCode = pvType.substring(0, 3).toUpperCase();
    return `PV-${typeCode}/${year}/${sequence}`;
  }

  private static getPVTitle(pvType: PVType): string {
    const titles: Record<PVType, string> = {
      technical_inspection: 'PROCÈS-VERBAL D\'INSPECTION TECHNIQUE',
      provisional_reception: 'PROCÈS-VERBAL DE RÉCEPTION PROVISOIRE',
      final_reception: 'PROCÈS-VERBAL DE RÉCEPTION DÉFINITIVE',
      safety_inspection: 'PROCÈS-VERBAL D\'INSPECTION SÉCURITÉ',
      quality_control: 'PROCÈS-VERBAL DE CONTRÔLE QUALITÉ',
    };
    return titles[pvType];
  }

  private static getInspectionTypeLabel(pvType: PVType): string {
    const labels: Record<PVType, string> = {
      technical_inspection: 'Inspection Technique',
      provisional_reception: 'Réception Provisoire',
      final_reception: 'Réception Définitive',
      safety_inspection: 'Inspection Sécurité',
      quality_control: 'Contrôle Qualité',
    };
    return labels[pvType];
  }

  private static getConformityLabel(status: ConformityStatus): string {
    const labels: Record<ConformityStatus, string> = {
      conform: 'Conforme',
      non_conform: 'Non conforme',
      partial: 'Partiellement conforme',
    };
    return labels[status];
  }

  private static generateObject(pvType: PVType, inspection: InspectionWithProject): string {
    const date = format(new Date(inspection.date), 'dd MMMM yyyy', { locale: fr });
    const project = inspection.projects?.title || 'le projet';
    
    switch (pvType) {
      case 'provisional_reception':
        return `Le présent procès-verbal a pour objet de constater la réception provisoire des travaux réalisés dans le cadre du projet "${project}" à la date du ${date}.`;
      case 'final_reception':
        return `Le présent procès-verbal a pour objet de constater la réception définitive des travaux et la levée des réserves émises lors de la réception provisoire du projet "${project}".`;
      case 'safety_inspection':
        return `Le présent procès-verbal consigne les observations de l'inspection sécurité réalisée le ${date} sur le chantier du projet "${project}".`;
      case 'quality_control':
        return `Le présent procès-verbal documente le contrôle qualité effectué le ${date} dans le cadre du projet "${project}".`;
      default:
        return `Le présent procès-verbal consigne les observations et conclusions de l'inspection technique réalisée le ${date} sur le projet "${project}".`;
    }
  }

  private static generateConclusion(data: InspectionExecutionData | null, inspection: InspectionWithProject): string {
    if (data?.summary) return data.summary;

    const progress = inspection.progress_at_inspection;
    const conformity = data?.overall_conformity || 'partial';

    if (conformity === 'conform') {
      return `L'inspection conclut à la conformité des travaux inspectés. L'avancement constaté est de ${progress}%. Les travaux peuvent se poursuivre selon le planning établi.`;
    } else if (conformity === 'non_conform') {
      return `L'inspection révèle des non-conformités nécessitant des actions correctives avant poursuite des travaux. Avancement constaté: ${progress}%.`;
    }
    return `L'inspection révèle une conformité partielle des travaux. Certains points nécessitent des corrections mineures. Avancement constaté: ${progress}%.`;
  }

  private static generateConditions(data: InspectionExecutionData | null): string[] | undefined {
    if (!data?.observations?.some(o => o.conformity !== 'conform')) return undefined;
    
    const conditions: string[] = [];
    const nonConformities = data.observations.filter(o => o.conformity !== 'conform');
    
    if (nonConformities.length > 0) {
      conditions.push('Correction des non-conformités identifiées dans les délais impartis');
    }
    if (data.corrective_actions_required) {
      conditions.push('Mise en œuvre des actions correctives avant reprise des travaux');
    }
    
    return conditions.length > 0 ? conditions : undefined;
  }

  private static getRequiredSignatures(pvType: PVType): GeneratedPV['signatures'] {
    const baseSignatures = [
      { role: 'Inspecteur', name: '', order: 1 },
      { role: 'Responsable Qualité', name: '', order: 2 },
      { role: 'Chef de Projet', name: '', order: 3 },
    ];

    if (pvType === 'provisional_reception' || pvType === 'final_reception') {
      baseSignatures.push({ role: 'Représentant Client', name: '', order: 4 });
    }

    return baseSignatures;
  }
}
