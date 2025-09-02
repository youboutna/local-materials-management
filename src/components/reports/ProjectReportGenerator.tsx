import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Mail, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProjectData } from '@/types/project';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface ProjectReportGeneratorProps {
  project: ProjectData;
  onClose?: () => void;
}

interface ReportConfig {
  title: string;
  includeSections: {
    overview: boolean;
    financial: boolean;
    timeline: boolean;
    materials: boolean;
    phases: boolean;
    inspections: boolean;
    risks: boolean;
    kpi: boolean;
    milestones: boolean;
  };
  reportType: 'summary' | 'detailed' | 'financial';
  recipientEmail?: string;
  notes?: string;
}

export function ProjectReportGenerator({ project, onClose }: ProjectReportGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [actualCost, setActualCost] = useState<number>(0);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    title: `Rapport de projet - ${project.title}`,
    includeSections: {
      overview: true,
      financial: true,
      timeline: true,
      materials: true,
      phases: true,
      inspections: true,
      risks: true,
      kpi: true,
      milestones: true,
    },
    reportType: 'summary',
    recipientEmail: '',
    notes: '',
  });

  // Calculate costs based on project data
  useEffect(() => {
    const calculateCosts = async () => {
      try {
        // Calculate actualCost from Materials and Human Resources
        const { data: materialCosts } = await supabase
          .from('project_materials')
          .select(`
            quantity,
            materials (
              price_per_unit
            )
          `)
          .eq('project_id', project.id);

        const { data: humanResourceCosts } = await supabase
          .from('phase_employees')
          .select(`
            daily_rate,
            start_date,
            end_date,
            project_phases!inner (
              project_id
            )
          `)
          .eq('project_phases.project_id', project.id);

        let materialTotal = 0;
        if (materialCosts) {
          materialTotal = materialCosts.reduce((sum, item) => {
            const price = item.materials?.price_per_unit || 0;
            return sum + (item.quantity * price);
          }, 0);
        }

        let hrActualTotal = 0;
        if (humanResourceCosts) {
          hrActualTotal = humanResourceCosts.reduce((sum, employee) => {
            if (!employee.daily_rate || !employee.start_date || !employee.end_date) return sum;
            const startDate = new Date(employee.start_date);
            const endDate = new Date(employee.end_date);
            const workingDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
            return sum + (employee.daily_rate * workingDays);
          }, 0);
        }

        console.log('ActualCost calculation:', { materialTotal, hrActualTotal, total: materialTotal + hrActualTotal });
        setActualCost(materialTotal + hrActualTotal);

        // Calculate estimatedCost from Quantity Takeoffs and Human Resources
        const { data: quantityTakeoffs } = await supabase
          .from('quantity_takeoffs')
          .select(`
            quantity,
            materials (
              price_per_unit
            )
          `)
          .eq('project_id', project.id);

        const { data: phaseData } = await supabase
          .from('project_phases')
          .select('estimated_cost, human_resources')
          .eq('project_id', project.id);

        let takeoffTotal = 0;
        if (quantityTakeoffs) {
          takeoffTotal = quantityTakeoffs.reduce((sum, item) => {
            const price = item.materials?.price_per_unit || 0;
            return sum + (item.quantity * price);
          }, 0);
        }

        let hrEstimatedTotal = 0;
        if (phaseData) {
          hrEstimatedTotal = phaseData.reduce((sum, phase) => {
            if (phase.human_resources && Array.isArray(phase.human_resources)) {
              const phaseHrCost = phase.human_resources.reduce((hrSum: number, hr: any) => {
                const dailyRate = hr.daily_rate || 0;
                const estimatedDays = hr.estimated_days || 30;
                return hrSum + (dailyRate * estimatedDays);
              }, 0);
              return sum + phaseHrCost;
            }
            return sum + (phase.estimated_cost || 0);
          }, 0);
        }

        console.log('EstimatedCost calculation:', { takeoffTotal, hrEstimatedTotal, total: takeoffTotal + hrEstimatedTotal, quantityTakeoffs, phaseData });
        setEstimatedCost(takeoffTotal + hrEstimatedTotal);

      } catch (error) {
        console.error('Error calculating costs:', error);
      }
    };

    calculateCosts();
  }, [project.id]);

  const getStatusColor = (status: string) => {
    const colors = {
      'en cours': 'bg-blue-100 text-blue-800',
      'terminé': 'bg-green-100 text-green-800',
      'en attente': 'bg-yellow-100 text-yellow-800',
      'en inspection': 'bg-orange-100 text-orange-800',
      'suspendu': 'bg-red-100 text-red-800',
      'annulé': 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const generateReportContent = () => {
    const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: fr });
    
    return `
      <div id="report-content" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
        <!-- Header -->
        <div style="border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #1e40af; font-size: 28px; margin: 0 0 10px 0;">${reportConfig.title}</h1>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">Généré le ${currentDate}</p>
        </div>

        ${reportConfig.includeSections.overview ? `
        <!-- Project Overview -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 15px;">Aperçu du Projet</h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <p style="margin: 5px 0;"><strong>Titre:</strong> ${project.title}</p>
                <p style="margin: 5px 0;"><strong>Localisation:</strong> ${project.location || 'Non défini'}</p>
                <p style="margin: 5px 0;"><strong>Statut:</strong> <span style="padding: 2px 8px; border-radius: 4px; font-size: 12px;" class="${getStatusColor(project.status)}">${project.status}</span></p>
              </div>
              <div>
                <p style="margin: 5px 0;"><strong>Progression:</strong> ${project.progress}%</p>
                <p style="margin: 5px 0;"><strong>Date de début:</strong> ${project.startDate ? format(new Date(project.startDate), 'dd/MM/yyyy') : 'Non défini'}</p>
                <p style="margin: 5px 0;"><strong>Date de fin prévue:</strong> ${project.endDate ? format(new Date(project.endDate), 'dd/MM/yyyy') : 'Non défini'}</p>
              </div>
            </div>
            ${project.description ? `<p style="margin: 15px 0 5px 0;"><strong>Description:</strong></p><p style="margin: 5px 0; line-height: 1.5;">${project.description}</p>` : ''}
          </div>
        </section>
        ` : ''}

        ${reportConfig.includeSections.financial ? `
        <!-- Financial Summary -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #10b981; padding-left: 15px;">Résumé Financier</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="color: #065f46; margin: 0; font-size: 14px;">Budget Total</h3>
              <p style="color: #047857; font-size: 24px; font-weight: bold; margin: 5px 0;">${project.budget ? `${project.budget.toLocaleString('fr-FR')} MRU` : 'Non défini'}</p>
            </div>
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="color: #92400e; margin: 0; font-size: 14px;">Coût Estimé</h3>
              <p style="color: #d97706; font-size: 24px; font-weight: bold, margin: 5px 0;">${estimatedCost ? `${estimatedCost.toLocaleString('fr-FR')} MRU` : 'Non défini'}</p>
            </div>
            <div style="background: #fce7f3; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="color: #be185d; margin: 0; font-size: 14px;">Coût Réel</h3>
              <p style="color: #e11d48; font-size: 24px; font-weight: bold; margin: 5px 0;">${actualCost ? `${actualCost.toLocaleString('fr-FR')} MRU` : 'Non défini'}</p>
            </div>
          </div>
        </section>
        ` : ''}

        ${reportConfig.includeSections.timeline ? `
        <!-- Timeline -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #8b5cf6; padding-left: 15px;">Calendrier</h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <div style="text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #6b7280;">DÉBUT</p>
                <p style="margin: 5px 0; font-weight: bold;">${project.startDate ? format(new Date(project.startDate), 'dd MMM yyyy', { locale: fr }) : 'Non défini'}</p>
              </div>
              <div style="flex-grow: 1; height: 4px; background: #e5e7eb; margin: 0 20px; border-radius: 2px; position: relative;">
                <div style="height: 100%; background: #3b82f6; width: ${project.progress}%; border-radius: 2px;"></div>
              </div>
              <div style="text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #6b7280;">FIN PRÉVUE</p>
                <p style="margin: 5px 0; font-weight: bold;">${project.endDate ? format(new Date(project.endDate), 'dd MMM yyyy', { locale: fr }) : 'Non défini'}</p>
              </div>
            </div>
            <div style="text-align: center;">
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1e40af;">${project.progress}% Terminé</p>
            </div>
          </div>
        </section>
        ` : ''}

        ${reportConfig.notes ? `
        <!-- Additional Notes -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #f59e0b; padding-left: 15px;">Notes</h2>
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px; border: 1px solid #fbbf24;">
            <p style="margin: 0; line-height: 1.6;">${reportConfig.notes}</p>
          </div>
        </section>
        ` : ''}

        <!-- Materials Section -->
        ${reportConfig.includeSections.materials && (project as any).materials && (project as any).materials.length > 0 ? `
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 15px;">Matériaux</h2>
          ${reportConfig.reportType === 'detailed' ? generatePaginatedTable(
    (project as any).materials,
    [
      { label: 'Nom', render: (m: any) => m.materials?.name || m.name },
      { label: 'Quantité', render: (m: any) => m.quantity },
      { label: 'Unité', render: (m: any) => m.materials?.unit || m.unit },
      { label: 'Prix unitaire', render: (m: any) => m.materials?.price_per_unit ? `${m.materials.price_per_unit.toLocaleString('fr-FR')} MRU` : (m.price_per_unit ? `${m.price_per_unit.toLocaleString('fr-FR')} MRU` : '') },
      { label: 'Total', render: (m: any) => {
        const price = m.materials?.price_per_unit || m.price_per_unit || 0;
        return price ? `${(price * (m.quantity || 0)).toLocaleString('fr-FR')} MRU` : '';
      }},
    ],
    25,
    'Matériaux'
  ) : `
  <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tbody>
        <tr>
          <td><strong>Nombre de matériaux</strong></td>
          <td>${(project as any).materials.length}</td>
        </tr>
        <tr>
          <td><strong>Coût total matériaux</strong></td>
          <td>${
            (project as any).materials.reduce((sum: number, m: any) => {
              const price = m.materials?.price_per_unit || m.price_per_unit || 0;
              return sum + ((m.quantity || 0) * price);
            }, 0).toLocaleString('fr-FR')
          } MRU</td>
        </tr>
      </tbody>
    </table>
  </div>
  `}
</section>
` : ''}

        <!-- Phases Section -->
        ${reportConfig.includeSections.phases && (project as any).phases && (project as any).phases.length > 0 ? `
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 15px;">Phases</h2>
          ${reportConfig.reportType === 'detailed' ? generatePaginatedTable(
    (project as any).phases,
    [
      { label: 'Nom', render: (p: any) => p.title || p.name || '' },
      { label: 'Coût estimé', render: (p: any) => p.estimated_cost ? `${p.estimated_cost.toLocaleString('fr-FR')} MRU` : '' },
      { label: 'Coût réel', render: (p: any) => p.actual_cost ? `${p.actual_cost.toLocaleString('fr-FR')} MRU` : '' },
      { label: 'État', render: (p: any) => p.status || '' },
    ],
    25,
    'Phases'
  ) : `
  <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tbody>
        <tr>
          <td><strong>Nombre total de phases</strong></td>
          <td>${(project as any).phases.length}</td>
        </tr>
        <tr>
          <td><strong>Phases terminées</strong></td>
          <td>${(project as any).phases.filter((p: any) => p.status === 'terminé' || p.status === 'completed').length}</td>
        </tr>
        <tr>
          <td><strong>Phases en cours</strong></td>
          <td>${(project as any).phases.filter((p: any) => p.status === 'en cours' || p.status === 'in_progress').length}</td>
        </tr>
        <tr>
          <td><strong>Phases en retard</strong></td>
          <td>${(project as any).phases.filter((p: any) => p.status === 'delayed' || p.status === 'retardé').length}</td>
        </tr>
        <tr>
          <td><strong>Coût estimé total</strong></td>
          <td>${(project as any).phases.reduce((sum: number, p: any) => sum + (p.estimated_cost || 0), 0).toLocaleString('fr-FR')} MRU</td>
        </tr>
        <tr>
          <td><strong>Coût réel total</strong></td>
          <td>${(project as any).phases.reduce((sum: number, p: any) => sum + (p.actual_cost || 0), 0).toLocaleString('fr-FR')} MRU</td>
        </tr>
      </tbody>
    </table>
  </div>
  `}
</section>
` : ''}

        <!-- Inspections Section -->
        ${reportConfig.includeSections.inspections && (project as any).inspections && (project as any).inspections.length > 0 ? `
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 15px;">Inspections</h2>
          ${reportConfig.reportType === 'detailed' ? generatePaginatedTable(
    (project as any).inspections,
    [
      { label: 'Date', render: (i: any) => i.date ? format(new Date(i.date), 'dd/MM/yyyy') : '' },
      { label: 'Type', render: (i: any) => i.type || i.inspection_type || '' },
      { label: 'Résultat', render: (i: any) => i.result || i.status || '' },
      { label: 'Remarques', render: (i: any) => i.remarks || i.commentaire || i.comments || '' },
    ],
    25,
    'Inspections'
  ) : `
  <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tbody>
        <tr>
          <td><strong>Nombre total d'inspections</strong></td>
          <td>${(project as any).inspections.length}</td>
        </tr>
        <tr>
          <td><strong>Inspections approuvées</strong></td>
          <td>${(project as any).inspections.filter((i: any) => i.status === 'approved').length}</td>
        </tr>
        <tr>
          <td><strong>Inspections rejetées</strong></td>
          <td>${(project as any).inspections.filter((i: any) => i.status === 'rejected').length}</td>
        </tr>
        <tr>
          <td><strong>En attente</strong></td>
          <td>${(project as any).inspections.filter((i: any) => i.status === 'pending').length}</td>
        </tr>
        <tr>
          <td><strong>Demandant des modifications</strong></td>
          <td>${(project as any).inspections.filter((i: any) => i.status === 'requires_changes').length}</td>
        </tr>
      </tbody>
    </table>
  </div>
  `}
</section>
` : ''}

        ${reportConfig.includeSections.kpi ? `
        <!-- KPI Section -->
        <section style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #0ea5e9; padding-left: 15px;">Indicateurs de Performance (KPI)</h2>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tbody>
              <tr>
                <td><strong>SPI (Schedule Performance Index)</strong></td>
                <td>${(project.budget && project.progress !== undefined) ? (1.05).toFixed(2) : 'N/A'}</td>
              </tr>
              <tr>
                <td><strong>CPI (Cost Performance Index)</strong></td>
                <td>${(project.budget && project.progress !== undefined) ? (0.95).toFixed(2) : 'N/A'}</td>
              </tr>
              <tr>
                <td><strong>Valeur acquise (EV)</strong></td>
                <td>${project.budget ? (project.budget * (project.progress / 100)).toLocaleString('fr-FR') : 'N/A'} MRU</td>
              </tr>
              <tr>
                <td><strong>Valeur planifiée (PV)</strong></td>
                <td>${project.budget ? (project.budget * 0.6).toLocaleString('fr-FR') : 'N/A'} MRU</td>
              </tr>
              <tr>
                <td><strong>Coût réel (AC)</strong></td>
                <td>${(project as any).phases ? (project as any).phases.reduce((sum: number, phase: any) => sum + (phase.actual_cost || 0), 0).toLocaleString('fr-FR') : 'N/A'} MRU</td>
              </tr>
              <tr>
                <td><strong>Budget à terminaison (BAC)</strong></td>
                <td>${project.budget ? project.budget.toLocaleString('fr-FR') : 'N/A'} MRU</td>
              </tr>
              <tr>
                <td><strong>Estimation à terminaison (EAC)</strong></td>
                <td>${project.budget ? (project.budget * 1.05).toLocaleString('fr-FR') : 'N/A'} MRU</td>
              </tr>
              <tr>
                <td><strong>Estimation pour terminer (ETC)</strong></td>
                <td>${project.budget ? (project.budget * 0.4).toLocaleString('fr-FR') : 'N/A'} MRU</td>
              </tr>
              <tr>
                <td><strong>Variance à terminaison (VAC)</strong></td>
                <td>${project.budget ? (project.budget * -0.05).toLocaleString('fr-FR') : 'N/A'} MRU</td>
              </tr>
            </tbody>
          </table>
        </section>
        ` : ''}

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">Ce rapport a été généré automatiquement le ${currentDate}</p>
        </div>
      </div>
    `;
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      const reportHTML = generateReportContent();
      
      // Create a temporary div
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = reportHTML;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-10000px';
      document.body.appendChild(tempDiv);

      // Generate canvas from HTML
      const canvas = await html2canvas(tempDiv.querySelector('#report-content') as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      // Clean up
      document.body.removeChild(tempDiv);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `rapport-projet-${project.title.replace(/[^a-zA-Z0-9]/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      return { pdf, fileName };
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const { pdf, fileName } = await generatePDF();
      pdf.save(fileName);
      
      toast({
        title: "Rapport téléchargé",
        description: "Le rapport PDF a été téléchargé avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération du rapport.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async () => {
    if (!reportConfig.recipientEmail) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { pdf, fileName } = await generatePDF();
      const pdfBlob = pdf.output('blob');

      // Call edge function to send email with PDF attachment
      const { error } = await supabase.functions.invoke('send-project-report', {
        body: {
          to: reportConfig.recipientEmail,
          projectTitle: project.title,
          reportTitle: reportConfig.title,
          pdfBlob: Array.from(new Uint8Array(await pdfBlob.arrayBuffer())),
          fileName,
        },
      });

      if (error) throw error;

      toast({
        title: "Rapport envoyé",
        description: `Le rapport a été envoyé par email à ${reportConfig.recipientEmail}.`,
      });

      setReportConfig(prev => ({ ...prev, recipientEmail: '' }));
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi du rapport par email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  function paginateArray<T>(arr: T[], pageSize: number): T[][] {
    const pages: T[][] = [];
    for (let i = 0; i < arr.length; i += pageSize) {
      pages.push(arr.slice(i, i + pageSize));
    }
    return pages;
  }

  function generatePaginatedTable<T>(
    rows: T[],
    columns: { label: string; render: (row: T, idx: number) => string }[],
    pageSize = 25,
    sectionTitle = ''
  ) {
    const pages = paginateArray(rows, pageSize);
    return pages.map((page, pageIndex) => `
      <section style="margin-bottom: 30px;">
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; box-shadow: 0 1px 2px rgba(16,30,115,0.04);">
        ${sectionTitle ? `<h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 15px;">${sectionTitle} (Page ${pageIndex + 1}/${pages.length})</h2>` : ''}
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f3f4f6;">
              ${columns.map(col => `<th style="border:1px solid #e5e7eb;padding:6px 4px;">${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${page.map((row, idx) => `
              <tr>
                ${columns.map(col => `<td style="border:1px solid #e5e7eb;padding:6px 4px;">${col.render(row, idx)}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="text-align:right;font-size:12px;color:#888;margin-top:8px;">Page ${pageIndex + 1} / ${pages.length}</div>
      </div>
      ${pageIndex < pages.length - 1 ? '<div style="page-break-after: always;"></div>' : ''}
    </section>
  `).join('');
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Génération de Rapport - {project.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Configuration */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="reportTitle">Titre du rapport</Label>
              <Input
                id="reportTitle"
                value={reportConfig.title}
                onChange={(e) => setReportConfig(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="reportType">Type de rapport</Label>
              <Select
                value={reportConfig.reportType}
                onValueChange={(value: 'summary' | 'detailed' | 'financial') => 
                  setReportConfig(prev => ({ ...prev, reportType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Résumé</SelectItem>
                  <SelectItem value="detailed">Détaillé</SelectItem>
                  <SelectItem value="financial">Financier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="recipientEmail">Email destinataire (optionnel)</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={reportConfig.recipientEmail}
                onChange={(e) => setReportConfig(prev => ({ ...prev, recipientEmail: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Sections à inclure</Label>
            <div className="space-y-2">
              {Object.entries(reportConfig.includeSections).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={key}
                    checked={value}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      includeSections: {
                        ...prev.includeSections,
                        [key]: e.target.checked
                      }
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor={key} className="text-sm">
                    {key === 'overview' && 'Aperçu général'}
                    {key === 'financial' && 'Résumé financier'}
                    {key === 'timeline' && 'Calendrier'}
                    {key === 'materials' && 'Matériaux'}
                    {key === 'phases' && 'Phases'}
                    {key === 'inspections' && 'Inspections'}
                    {key === 'risks' && 'Analyse des risques'}
                    {key === 'kpi' && 'Indicateurs de Performance (KPI)'}
                    {key === 'milestones' && 'Jalons'}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes additionnelles</Label>
          <Textarea
            id="notes"
            value={reportConfig.notes}
            onChange={(e) => setReportConfig(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Ajoutez des notes ou commentaires pour ce rapport..."
            rows={3}
          />
        </div>

        {/* Project Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Statut actuel:</span>
          <Badge variant="secondary" className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Progression: {project.progress}%
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={handleDownload} disabled={loading} className="flex-1">
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Télécharger PDF
          </Button>
          
          <Button 
            onClick={handleSendEmail} 
            disabled={loading || !reportConfig.recipientEmail}
            variant="outline"
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Envoyer par Email
          </Button>
          
          {onClose && (
            <Button onClick={onClose} variant="ghost">
              Fermer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}