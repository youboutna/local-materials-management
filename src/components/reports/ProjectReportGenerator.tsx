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
import { ReportingService, ReportData, CostCalculation } from '@/services/reportingService';
import { ReportCalculations, EVMMetrics, PERTAnalysis } from '@/utils/reportCalculations';
import { ReportFormatting } from '@/utils/reportFormatting';

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
    bankGuarantees: boolean;
    insurance: boolean;
    paymentBlocks: boolean;
    suppliers: boolean;
    documents: boolean;
    employees: boolean;
    escalationAlerts: boolean;
    evmAnalysis: boolean;
    pertAnalysis: boolean;
    ganttChart: boolean;
  };
  reportType: 'summary' | 'detailed' | 'financial' | 'project_manager';
  recipientEmail?: string;
  notes?: string;
}

export function ProjectReportGenerator({ project, onClose }: ProjectReportGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [costCalculation, setCostCalculation] = useState<CostCalculation | null>(null);
  const [evmMetrics, setEvmMetrics] = useState<EVMMetrics | null>(null);
  const [pertAnalysis, setPertAnalysis] = useState<PERTAnalysis | null>(null);
  
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
      bankGuarantees: false,
      insurance: false,
      paymentBlocks: false,
      suppliers: false,
      documents: false,
      employees: false,
      escalationAlerts: false,
      evmAnalysis: false,
      pertAnalysis: false,
      ganttChart: false,
    },
    reportType: 'summary',
    recipientEmail: '',
    notes: '',
  });

  // Load all report data on component mount
  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [reportDataResult, costCalculationResult] = await Promise.all([
          ReportingService.fetchReportData(project.id),
          ReportingService.calculateProjectCosts(project.id)
        ]);
        
        setReportData(reportDataResult);
        setCostCalculation(costCalculationResult);
        
        // Calculate EVM metrics
        const evmMetricsResult = ReportCalculations.calculateEVMMetrics(project, costCalculationResult.actualCost);
        setEvmMetrics(evmMetricsResult);
        
        // Calculate PERT analysis
        const pertAnalysisResult = ReportCalculations.calculatePERTAnalysis(reportDataResult.phases);
        setPertAnalysis(pertAnalysisResult);
        
      } catch (error) {
        console.error('Error loading report data:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du rapport.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [project.id, toast]);

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

  const generateReportContent = async () => {
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
              <p style="color: #d97706; font-size: 24px; font-weight: bold, margin: 5px 0;">${costCalculation?.estimatedCost ? `${costCalculation.estimatedCost.toLocaleString('fr-FR')} MRU` : 'Non défini'}</p>
            </div>
            <div style="background: #fce7f3; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="color: #be185d; margin: 0; font-size: 14px;">Coût Réel</h3>
              <p style="color: #e11d48; font-size: 24px; font-weight: bold; margin: 5px 0;">${costCalculation?.actualCost ? `${costCalculation.actualCost.toLocaleString('fr-FR')} MRU` : 'Non défini'}</p>
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
        <section style="margin-bottom: 30px; page-break-inside: avoid;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #0ea5e9; padding-left: 15px;">Indicateurs de Performance (KPI)</h2>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border: 1px solid #0ea5e9;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tbody>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e7ff;"><strong>SPI (Schedule Performance Index)</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e7ff; text-align: right;">${(project.budget && project.progress !== undefined) ? (1.05).toFixed(2) : 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e7ff;"><strong>CPI (Cost Performance Index)</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e7ff; text-align: right;">${(project.budget && project.progress !== undefined) ? (0.95).toFixed(2) : 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e7ff;"><strong>Valeur acquise (EV)</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e7ff; text-align: right;">${project.budget ? (project.budget * (project.progress / 100)).toLocaleString('fr-FR') : 'N/A'} MRU</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e7ff;"><strong>Valeur planifiée (PV)</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e7ff; text-align: right;">${project.budget ? (project.budget * 0.6).toLocaleString('fr-FR') : 'N/A'} MRU</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e7ff;"><strong>Coût réel (AC)</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e7ff; text-align: right;">${(project as any).phases ? (project as any).phases.reduce((sum: number, phase: any) => sum + (phase.actual_cost || 0), 0).toLocaleString('fr-FR') : 'N/A'} MRU</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e7ff;"><strong>Budget à terminaison (BAC)</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e7ff; text-align: right;">${project.budget ? project.budget.toLocaleString('fr-FR') : 'N/A'} MRU</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e7ff;"><strong>Estimation à terminaison (EAC)</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e7ff; text-align: right;">${project.budget ? (project.budget * 1.05).toLocaleString('fr-FR') : 'N/A'} MRU</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e7ff;"><strong>Estimation pour terminer (ETC)</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e7ff; text-align: right;">${project.budget ? (project.budget * 0.4).toLocaleString('fr-FR') : 'N/A'} MRU</td>
                </tr>
                <tr>
                  <td style="padding: 8px;"><strong>Variance à terminaison (VAC)</strong></td>
                  <td style="padding: 8px; text-align: right;">${project.budget ? (project.budget * -0.05).toLocaleString('fr-FR') : 'N/A'} MRU</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        ` : ''}

        ${reportConfig.includeSections.milestones ? `
        <!-- Milestones Section -->
        <section style="margin-bottom: 30px; page-break-inside: avoid;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #8b5cf6; padding-left: 15px;">Jalons</h2>
          <div style="background: #faf5ff; padding: 20px; border-radius: 8px; border: 1px solid #8b5cf6;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
                <h4 style="margin: 0 0 8px 0; color: #065f46;">Jalon 1: Démarrage du Projet</h4>
                <p style="margin: 0; font-size: 13px; color: #6b7280;">Date: ${project.startDate ? format(new Date(project.startDate), 'dd/MM/yyyy') : 'Non défini'}</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #059669;">✓ Terminé</p>
              </div>
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid ${project.progress >= 25 ? '#10b981' : '#f59e0b'};">
                <h4 style="margin: 0 0 8px 0; color: #374151;">Jalon 2: 25% d'Avancement</h4>
                <p style="margin: 0; font-size: 13px; color: #6b7280;">Progression: ${project.progress}%</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: ${project.progress >= 25 ? '#059669' : '#d97706'};">${project.progress >= 25 ? '✓ Terminé' : '⏳ En cours'}</p>
              </div>
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid ${project.progress >= 50 ? '#10b981' : '#f59e0b'};">
                <h4 style="margin: 0 0 8px 0; color: #374151;">Jalon 3: 50% d'Avancement</h4>
                <p style="margin: 0; font-size: 13px; color: #6b7280;">Progression: ${project.progress}%</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: ${project.progress >= 50 ? '#059669' : '#d97706'};">${project.progress >= 50 ? '✓ Terminé' : '⏳ En cours'}</p>
              </div>
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid ${project.progress >= 75 ? '#10b981' : '#f59e0b'};">
                <h4 style="margin: 0 0 8px 0; color: #374151;">Jalon 4: 75% d'Avancement</h4>
                <p style="margin: 0; font-size: 13px; color: #6b7280;">Progression: ${project.progress}%</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: ${project.progress >= 75 ? '#059669' : '#d97706'};">${project.progress >= 75 ? '✓ Terminé' : '⏳ En cours'}</p>
              </div>
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid ${project.progress >= 100 ? '#10b981' : '#f59e0b'};">
                <h4 style="margin: 0 0 8px 0; color: #374151;">Jalon 5: Finalisation</h4>
                <p style="margin: 0; font-size: 13px; color: #6b7280;">Date: ${project.endDate ? format(new Date(project.endDate), 'dd/MM/yyyy') : 'Non défini'}</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: ${project.progress >= 100 ? '#059669' : '#d97706'};">${project.progress >= 100 ? '✓ Terminé' : '⏳ En attente'}</p>
              </div>
            </div>
          </div>
        </section>
        ` : ''}

        ${reportConfig.includeSections.risks ? `
        <!-- Risk Analysis Section -->
        <section style="margin-bottom: 30px; page-break-inside: avoid;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #ef4444; padding-left: 15px;">Analyse des Risques</h2>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #ef4444;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444;">
                <h4 style="margin: 0 0 8px 0; color: #dc2626;">Risque Élevé</h4>
                <p style="margin: 0; font-size: 13px; line-height: 1.4;">Retards dans la livraison des matériaux critiques pouvant impacter le planning général</p>
                <div style="margin-top: 8px;">
                  <span style="background: #fecaca; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 11px;">CRITIQUE</span>
                </div>
              </div>
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
                <h4 style="margin: 0 0 8px 0; color: #d97706;">Risque Moyen</h4>
                <p style="margin: 0; font-size: 13px; line-height: 1.4;">Conditions météorologiques défavorables pouvant ralentir les travaux extérieurs</p>
                <div style="margin-top: 8px;">
                  <span style="background: #fed7aa; color: #c2410c; padding: 2px 6px; border-radius: 4px; font-size: 11px;">MOYEN</span>
                </div>
              </div>
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
                <h4 style="margin: 0 0 8px 0; color: #059669;">Risque Faible</h4>
                <p style="margin: 0; font-size: 13px; line-height: 1.4;">Légères variations dans les coûts des matériaux non critiques</p>
                <div style="margin-top: 8px;">
                  <span style="background: #bbf7d0; color: #047857; padding: 2px 6px; border-radius: 4px; font-size: 11px;">FAIBLE</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        ` : ''}

        ${reportConfig.includeSections.bankGuarantees ? `
        <section style="margin-bottom: 30px; page-break-inside: avoid;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #06b6d4; padding-left: 15px;">Garanties Bancaires</h2>
          <div style="background: #f0fdfa; padding: 20px; border-radius: 8px; text-align: center; color: #6b7280;">
            <p>Section en cours de développement. Les données seront disponibles prochainement.</p>
          </div>
        </section>
        ` : ''}
        
        ${reportConfig.includeSections.insurance ? `
        <section style="margin-bottom: 30px; page-break-inside: avoid;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #10b981; padding-left: 15px;">Assurances</h2>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center; color: #6b7280;">
            <p>Section en cours de développement. Les données seront disponibles prochainement.</p>
          </div>
        </section>
        ` : ''}
        
        ${reportConfig.includeSections.suppliers ? `
        <section style="margin-bottom: 30px; page-break-inside: avoid;">
          <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #8b5cf6; padding-left: 15px;">Fournisseurs</h2>
          <div style="background: #faf5ff; padding: 20px; border-radius: 8px; text-align: center; color: #6b7280;">
            <p>Section en cours de développement. Les données seront disponibles prochainement.</p>
          </div>
        </section>
        ` : ''}
        
        ${reportConfig.includeSections.evmAnalysis && evmMetrics ? generateEVMSection(evmMetrics) : ''}
        ${reportConfig.includeSections.pertAnalysis && pertAnalysis ? generatePERTSection(pertAnalysis) : ''}
        ${reportConfig.includeSections.ganttChart ? generateGanttSection(project, reportData?.phases) : ''}

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">Ce rapport a été généré automatiquement le ${currentDate}</p>
        </div>
      </div>
    `;
  };

  // Helper functions for generating sections
  const generateEVMSection = (metrics: EVMMetrics): string => {
    return `
      <section style="margin-bottom: 30px; page-break-inside: avoid;">
        ${ReportFormatting.generateSectionHeader(
          'Analyse EVM (Earned Value Management)',
          'Analyse de la valeur acquise pour le suivi de performance'
        )}
        <div style="background: white; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px;">
            ${ReportFormatting.generateMetricCard('Valeur Planifiée (PV)', ReportFormatting.formatCurrency(metrics.plannedValue), '#3b82f6', '📅')}
            ${ReportFormatting.generateMetricCard('Valeur Acquise (EV)', ReportFormatting.formatCurrency(metrics.earnedValue), '#10b981', '✅')}
            ${ReportFormatting.generateMetricCard('Coût Réel (AC)', ReportFormatting.formatCurrency(metrics.actualCost), '#ef4444', '💰')}
          </div>
          
          <table style="width:100%;border-collapse:collapse;font-size:14px;background:white;border-radius:6px;border:1px solid #e5e7eb;">
            <tbody>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>Variance de Planning (SV)</strong></td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: ${metrics.scheduleVariance >= 0 ? '#059669' : '#dc2626'};">${ReportFormatting.formatCurrency(metrics.scheduleVariance)}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>Variance de Coût (CV)</strong></td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: ${metrics.costVariance >= 0 ? '#059669' : '#dc2626'};">${ReportFormatting.formatCurrency(metrics.costVariance)}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>Indice de Performance Planning (SPI)</strong></td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: ${metrics.schedulePerformanceIndex >= 1 ? '#059669' : '#dc2626'};">${metrics.schedulePerformanceIndex.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 12px;"><strong>Indice de Performance Coût (CPI)</strong></td>
                <td style="padding: 12px; text-align: right; color: ${metrics.costPerformanceIndex >= 1 ? '#059669' : '#dc2626'};">${metrics.costPerformanceIndex.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div style="margin-top: 15px; padding: 15px; background: ${metrics.schedulePerformanceIndex >= 1 && metrics.costPerformanceIndex >= 1 ? '#f0fdf4' : '#fef2f2'}; border-radius: 6px; border: 1px solid ${metrics.schedulePerformanceIndex >= 1 && metrics.costPerformanceIndex >= 1 ? '#bbf7d0' : '#fecaca'};">
            <p style="margin: 0; font-size: 14px; color: ${metrics.schedulePerformanceIndex >= 1 && metrics.costPerformanceIndex >= 1 ? '#047857' : '#dc2626'};">
              <strong>Interprétation:</strong> 
              ${metrics.schedulePerformanceIndex >= 1 && metrics.costPerformanceIndex >= 1 
                ? 'Le projet est en bonne voie, respectant les délais et le budget.' 
                : metrics.schedulePerformanceIndex < 1 && metrics.costPerformanceIndex < 1
                ? 'Le projet présente des retards et des dépassements de coûts nécessitant une attention immédiate.'
                : metrics.schedulePerformanceIndex < 1
                ? 'Le projet présente des retards mais les coûts sont maîtrisés.'
                : 'Le projet respecte les délais mais présente des dépassements de coûts.'}
            </p>
          </div>
        </div>
      </section>
    `;
  };

  const generatePERTSection = (analysis: PERTAnalysis): string => {
    const tableColumns = [
      { label: 'Activité', render: (a: any) => a.name },
      { label: 'Optimiste (j)', render: (a: any) => a.optimistic.toString() },
      { label: 'Probable (j)', render: (a: any) => a.mostLikely.toString() },
      { label: 'Pessimiste (j)', render: (a: any) => a.pessimistic.toString() },
      { label: 'Estimation PERT', render: (a: any) => a.pertEstimate.toFixed(1) },
      { label: 'Écart-type', render: (a: any) => a.standardDeviation.toFixed(2) }
    ];

    return `
      <section style="margin-bottom: 30px; page-break-inside: avoid;">
        ${ReportFormatting.generateSectionHeader(
          'Analyse PERT',
          'Program Evaluation and Review Technique pour l\'estimation des durées'
        )}
        <div style="background: white; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
            L'analyse PERT permet d'estimer la durée des activités en tenant compte de l'incertitude et de calculer la probabilité de respect des délais.
          </p>
          
          ${ReportFormatting.generatePaginatedTable(analysis.activities, tableColumns, { pageSize: 10 })}
          
          <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            ${ReportFormatting.generateMetricCard('Durée Totale Estimée', `${analysis.totalDuration.toFixed(1)} jours`, '#8b5cf6', '⏱️')}
            ${ReportFormatting.generateMetricCard('Écart-type Total', `${analysis.totalStandardDeviation.toFixed(2)} jours`, '#8b5cf6', '📊')}
          </div>
        </div>
      </section>
    `;
  };

  const generateGanttSection = (project: ProjectData, phases?: any[]): string => {
    const timeline = ReportCalculations.generatePhaseTimeline(project, phases);
    
    return `
      <section style="margin-bottom: 30px; page-break-inside: avoid;">
        ${ReportFormatting.generateSectionHeader(
          'Diagramme de Gantt',
          `Planning du projet: ${project.title}`
        )}
        <div style="background: white; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
          <div style="text-align: center; margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 6px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Période: Du ${project.startDate ? ReportFormatting.formatDate(project.startDate) : 'Non défini'} 
              au ${project.endDate ? ReportFormatting.formatDate(project.endDate) : 'Non défini'}
            </p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; color: #6b7280; padding: 0 20px;">
              <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
            </div>
            
            ${timeline.map(phase => `
              <div style="display: flex; align-items: center; margin-bottom: 12px; padding: 8px; background: #f9fafb; border-radius: 4px;">
                <span style="width: 120px; font-size: 13px; font-weight: 600; color: #374151;">${phase.name}</span>
                <div style="flex: 1; height: 24px; background: #e5e7eb; border-radius: 12px; position: relative; margin-left: 15px; overflow: hidden;">
                  <div style="height: 100%; background: ${phase.color}; width: ${phase.progress}%; border-radius: 12px; transition: width 0.3s ease;"></div>
                  <span style="position: absolute; right: 8px; top: 4px; font-size: 11px; color: ${phase.progress > 50 ? 'white' : '#374151'}; font-weight: 500;">${phase.status}</span>
                </div>
                <span style="margin-left: 10px; font-size: 12px; font-weight: 600; color: ${phase.color}; min-width: 40px;">${phase.progress}%</span>
              </div>
            `).join('')}
          </div>
          
          <div style="margin-top: 25px; padding: 20px; background: #f8fafc; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="margin: 0; font-size: 16px; color: #374151; font-weight: 600;">Progression globale: ${project.progress}%</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">Dernière mise à jour: ${ReportFormatting.formatDate(new Date())}</p>
            </div>
            ${ReportFormatting.generateProgressBar(project.progress, '#3b82f6', '12px')}
          </div>
        </div>
      </section>
    `;
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      const reportHTML = await generateReportContent();
      
      // Create a temporary div with better styling for PDF generation
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = reportHTML;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-10000px';
      tempDiv.style.width = '800px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.lineHeight = '1.4';
      document.body.appendChild(tempDiv);

      // Generate canvas from HTML with improved settings
      const canvas = await html2canvas(tempDiv.querySelector('#report-content') as HTMLElement, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        windowWidth: 800,
      });

      // Clean up
      document.body.removeChild(tempDiv);

      // Create PDF with better pagination logic
      const imgData = canvas.toDataURL('image/png', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = margin;
      let page = 1;

      // Add first page
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - margin * 2);

      // Add additional pages with proper breaks
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - margin * 2);
        page++;
      }

      const fileName = `rapport-projet-${project.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      return { pdf, fileName };
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
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
      <section style="margin-bottom: 30px; page-break-inside: avoid;">
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; box-shadow: 0 1px 2px rgba(16,30,115,0.04);">
        ${sectionTitle ? `<h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 15px;">${sectionTitle} (Page ${pageIndex + 1}/${pages.length})</h2>` : ''}
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f3f4f6;">
              ${columns.map(col => `<th style="border:1px solid #e5e7eb;padding:8px 6px;text-align:left;">${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${page.map((row, idx) => `
              <tr style="${idx % 2 === 0 ? 'background:#ffffff;' : 'background:#f9fafb;'}">
                ${columns.map(col => `<td style="border:1px solid #e5e7eb;padding:8px 6px;vertical-align:top;line-height:1.4;">${col.render(row, idx)}</td>`).join('')}
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

  // Helper functions for analysis sections
  const getEVMAnalysisSection = (project: ProjectData, actualCost: number, estimatedCost: number) => {
    const budget = project.budget || 0;
    const progress = project.progress || 0;
    
    // Calculate EVM metrics
    const plannedValue = budget * 0.6; // Assume 60% should be completed by now
    const earnedValue = budget * (progress / 100);
    const actualCostEVM = actualCost;
    
    const scheduleVariance = earnedValue - plannedValue;
    const costVariance = earnedValue - actualCostEVM;
    const schedulePerformanceIndex = plannedValue > 0 ? earnedValue / plannedValue : 0;
    const costPerformanceIndex = actualCostEVM > 0 ? earnedValue / actualCostEVM : 0;

    return `
      <section style="margin-bottom: 30px; page-break-inside: avoid;">
        <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 15px;">Analyse EVM (Earned Value Management)</h2>
        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; border: 1px solid #3b82f6;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
              <h4 style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">Valeur Planifiée (PV)</h4>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #3b82f6;">${plannedValue.toLocaleString('fr-FR')} MRU</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
              <h4 style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">Valeur Acquise (EV)</h4>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #10b981;">${earnedValue.toLocaleString('fr-FR')} MRU</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
              <h4 style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">Coût Réel (AC)</h4>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #ef4444;">${actualCostEVM.toLocaleString('fr-FR')} MRU</p>
            </div>
          </div>
          
          <table style="width:100%;border-collapse:collapse;font-size:14px;background:white;border-radius:6px;">
            <tbody>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>Variance de Planning (SV)</strong></td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: ${scheduleVariance >= 0 ? '#059669' : '#dc2626'};">${scheduleVariance.toLocaleString('fr-FR')} MRU</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>Variance de Coût (CV)</strong></td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: ${costVariance >= 0 ? '#059669' : '#dc2626'};">${costVariance.toLocaleString('fr-FR')} MRU</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>Indice de Performance Planning (SPI)</strong></td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: ${schedulePerformanceIndex >= 1 ? '#059669' : '#dc2626'};">${schedulePerformanceIndex.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 12px;"><strong>Indice de Performance Coût (CPI)</strong></td>
                <td style="padding: 12px; text-align: right; color: ${costPerformanceIndex >= 1 ? '#059669' : '#dc2626'};">${costPerformanceIndex.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div style="margin-top: 15px; padding: 12px; background: ${schedulePerformanceIndex >= 1 && costPerformanceIndex >= 1 ? '#f0fdf4' : '#fef2f2'}; border-radius: 6px;">
            <p style="margin: 0; font-size: 13px; color: ${schedulePerformanceIndex >= 1 && costPerformanceIndex >= 1 ? '#047857' : '#dc2626'};">
              <strong>Interprétation:</strong> 
              ${schedulePerformanceIndex >= 1 && costPerformanceIndex >= 1 
                ? 'Le projet est en bonne voie, respectant les délais et le budget.' 
                : schedulePerformanceIndex < 1 && costPerformanceIndex < 1
                ? 'Le projet présente des retards et des dépassements de coûts nécessitant une attention immédiate.'
                : schedulePerformanceIndex < 1
                ? 'Le projet présente des retards mais les coûts sont maîtrisés.'
                : 'Le projet respecte les délais mais présente des dépassements de coûts.'}
            </p>
          </div>
        </div>
      </section>
    `;
  };

  const getPERTAnalysisSection = (project: ProjectData) => {
    // Mock PERT analysis data - in real implementation, this would come from project phases
    const activities = [
      { name: 'Préparation du site', optimistic: 5, mostLikely: 7, pessimistic: 10 },
      { name: 'Fondations', optimistic: 10, mostLikely: 15, pessimistic: 22 },
      { name: 'Structure', optimistic: 20, mostLikely: 25, pessimistic: 35 },
      { name: 'Finitions', optimistic: 15, mostLikely: 20, pessimistic: 28 },
    ];

    const calculatePERTEstimate = (o: number, m: number, p: number) => (o + 4 * m + p) / 6;
    const calculateVariance = (o: number, p: number) => Math.pow((p - o) / 6, 2);

    return `
      <section style="margin-bottom: 30px; page-break-inside: avoid;">
        <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #8b5cf6; padding-left: 15px;">Analyse PERT</h2>
        <div style="background: #faf5ff; padding: 20px; border-radius: 8px; border: 1px solid #8b5cf6;">
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
            L'analyse PERT (Program Evaluation and Review Technique) permet d'estimer la durée des activités en tenant compte de l'incertitude.
          </p>
          
          <table style="width:100%;border-collapse:collapse;font-size:13px;background:white;border-radius:6px;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Activité</th>
                <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">Optimiste (jours)</th>
                <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">Probable (jours)</th>
                <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">Pessimiste (jours)</th>
                <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">Estimation PERT</th>
                <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">Écart-type</th>
              </tr>
            </thead>
            <tbody>
              ${activities.map((activity, index) => {
                const pertEstimate = calculatePERTEstimate(activity.optimistic, activity.mostLikely, activity.pessimistic);
                const variance = calculateVariance(activity.optimistic, activity.pessimistic);
                const standardDev = Math.sqrt(variance);
                
                return `
                  <tr style="${index % 2 === 0 ? 'background:#ffffff;' : 'background:#f9fafb;'}">
                    <td style="padding: 8px; border: 1px solid #e5e7eb;">${activity.name}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${activity.optimistic}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${activity.mostLikely}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${activity.pessimistic}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center; font-weight: bold;">${pertEstimate.toFixed(1)}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${standardDev.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
              <h4 style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">Durée Totale Estimée</h4>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #8b5cf6;">
                ${activities.reduce((sum, activity) => sum + calculatePERTEstimate(activity.optimistic, activity.mostLikely, activity.pessimistic), 0).toFixed(1)} jours
              </p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
              <h4 style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">Écart-type Total</h4>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #8b5cf6;">
                ${Math.sqrt(activities.reduce((sum, activity) => sum + calculateVariance(activity.optimistic, activity.pessimistic), 0)).toFixed(2)} jours
              </p>
            </div>
          </div>
        </div>
      </section>
    `;
  };

  const getGanttChartSection = (project: ProjectData) => {
    return `
      <section style="margin-bottom: 30px; page-break-inside: avoid;">
        <h2 style="color: #374151; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #ef4444; padding-left: 15px;">Diagramme de Gantt</h2>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #ef4444;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">Planning du Projet: ${project.title}</h3>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Du ${project.startDate ? format(new Date(project.startDate), 'dd/MM/yyyy') : 'Non défini'} 
              au ${project.endDate ? format(new Date(project.endDate), 'dd/MM/yyyy') : 'Non défini'}
            </p>
          </div>
          
          <!-- Timeline representation -->
          <div style="background: white; padding: 20px; border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 12px; color: #6b7280;">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
            
            <!-- Project phases timeline -->
            <div style="margin-bottom: 15px;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="width: 120px; font-size: 13px; font-weight: bold;">Phase 1</span>
                <div style="flex: 1; height: 20px; background: #e5e7eb; border-radius: 10px; position: relative; margin-left: 10px;">
                  <div style="height: 100%; background: #10b981; width: 100%; border-radius: 10px;"></div>
                  <span style="position: absolute; right: 5px; top: 2px; font-size: 11px; color: white;">Terminé</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="width: 120px; font-size: 13px; font-weight: bold;">Phase 2</span>
                <div style="flex: 1; height: 20px; background: #e5e7eb; border-radius: 10px; position: relative; margin-left: 10px;">
                  <div style="height: 100%; background: #3b82f6; width: ${Math.min(project.progress, 100)}%; border-radius: 10px;"></div>
                  <span style="position: absolute; right: 5px; top: 2px; font-size: 11px; color: ${project.progress > 50 ? 'white' : '#374151'};">En cours</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="width: 120px; font-size: 13px; font-weight: bold;">Phase 3</span>
                <div style="flex: 1; height: 20px; background: #e5e7eb; border-radius: 10px; position: relative; margin-left: 10px;">
                  <div style="height: 100%; background: #f59e0b; width: ${Math.max(0, project.progress - 60)}%; border-radius: 10px;"></div>
                  <span style="position: absolute; right: 5px; top: 2px; font-size: 11px; color: #374151;">Planifié</span>
                </div>
              </div>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Progression globale:</strong> ${project.progress}%</p>
                  <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">Dernière mise à jour: ${format(new Date(), 'dd/MM/yyyy')}</p>
                </div>
                <div style="width: 80px; height: 80px; border-radius: 50%; background: conic-gradient(#3b82f6 0deg ${project.progress * 3.6}deg, #e5e7eb ${project.progress * 3.6}deg 360deg); display: flex; align-items: center; justify-content: center;">
                  <div style="width: 60px; height: 60px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; color: #374151;">
                    ${project.progress}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  };

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
                onValueChange={(value: 'summary' | 'detailed' | 'financial' | 'project_manager') => 
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
                  <SelectItem value="project_manager">Gestionnaire de Projet</SelectItem>
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
                    {key === 'bankGuarantees' && 'Garanties bancaires'}
                    {key === 'insurance' && 'Assurances'}
                    {key === 'paymentBlocks' && 'Blocages de paiements'}
                    {key === 'suppliers' && 'Fournisseurs'}
                    {key === 'documents' && 'Documents'}
                    {key === 'employees' && 'Employés'}
                    {key === 'escalationAlerts' && 'Alertes d\'escalade'}
                    {key === 'evmAnalysis' && 'Analyse EVM'}
                    {key === 'pertAnalysis' && 'Analyse PERT'}
                    {key === 'ganttChart' && 'Diagramme de Gantt'}
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
