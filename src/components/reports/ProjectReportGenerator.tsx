import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Download, Mail, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProjectData } from '@/types/project';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { ReportingService, ReportData, CostCalculation } from '@/services/reportingService';
import { ReportCalculations, EVMMetrics, PERTAnalysis } from '@/utils/reportCalculations';
import { ProjectPDFDocument } from './pdf/ProjectPDFDocument';

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
      bankGuarantees: true,
      insurance: true,
      paymentBlocks: true,
      suppliers: true,
      documents: true,
      employees: true,
      escalationAlerts: true,
      evmAnalysis: true,
      pertAnalysis: true,
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

  const generatePDF = async () => {
    if (!reportData || !costCalculation) {
      toast({
        title: "Erreur",
        description: "Les données du rapport ne sont pas encore chargées.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const pdfDoc = (
        <ProjectPDFDocument
          project={project}
          reportData={reportData}
          costCalculation={costCalculation}
          evmMetrics={evmMetrics || undefined}
          pertAnalysis={pertAnalysis || undefined}
          reportConfig={reportConfig}
        />
      );

      const blob = await pdf(pdfDoc).toBlob();
      saveAs(blob, `${reportConfig.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      
      toast({
        title: "Succès",
        description: "Le rapport PDF a été généré avec succès.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport PDF.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

    if (!reportData || !costCalculation) {
      toast({
        title: "Erreur",
        description: "Les données du rapport ne sont pas encore chargées.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const pdfDoc = (
        <ProjectPDFDocument
          project={project}
          reportData={reportData}
          costCalculation={costCalculation}
          evmMetrics={evmMetrics || undefined}
          pertAnalysis={pertAnalysis || undefined}
          reportConfig={reportConfig}
        />
      );

      const blob = await pdf(pdfDoc).toBlob();
      const fileName = `${reportConfig.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;

      // Call edge function to send email with PDF attachment
      const { error } = await supabase.functions.invoke('send-project-report', {
        body: {
          to: reportConfig.recipientEmail,
          projectTitle: project.title,
          reportTitle: reportConfig.title,
          pdfBlob: Array.from(new Uint8Array(await blob.arrayBuffer())),
          fileName,
        },
      });

      if (error) throw error;

      toast({
        title: "Rapport envoyé",
        description: `Le rapport a été envoyé par email à ${reportConfig.recipientEmail}.`,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le rapport par email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSectionConfig = (section: keyof ReportConfig['includeSections'], value: boolean) => {
    setReportConfig(prev => ({
      ...prev,
      includeSections: {
        ...prev.includeSections,
        [section]: value
      }
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    const newSections = Object.keys(reportConfig.includeSections).reduce((acc, key) => ({
      ...acc,
      [key]: checked
    }), {} as ReportConfig['includeSections']);
    
    setReportConfig(prev => ({
      ...prev,
      includeSections: newSections
    }));
  };

  const handleReportTypeChange = (type: ReportConfig['reportType']) => {
    let sectionsConfig: ReportConfig['includeSections'];
    
    switch (type) {
      case 'summary':
        sectionsConfig = {
          overview: true,
          financial: true,
          timeline: true,
          materials: false,
          phases: true,
          inspections: false,
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
        };
        break;
        
      case 'financial':
        sectionsConfig = {
          overview: true,
          financial: true,
          timeline: false,
          materials: true,
          phases: true,
          inspections: false,
          risks: true,
          kpi: true,
          milestones: false,
          bankGuarantees: true,
          insurance: true,
          paymentBlocks: true,
          suppliers: true,
          documents: false,
          employees: true,
          escalationAlerts: false,
          evmAnalysis: true,
          pertAnalysis: false,
          ganttChart: false,
        };
        break;
        
      case 'detailed':
        sectionsConfig = {
          overview: true,
          financial: true,
          timeline: true,
          materials: true,
          phases: true,
          inspections: true,
          risks: true,
          kpi: true,
          milestones: true,
          bankGuarantees: true,
          insurance: true,
          paymentBlocks: true,
          suppliers: true,
          documents: true,
          employees: true,
          escalationAlerts: true,
          evmAnalysis: true,
          pertAnalysis: true,
          ganttChart: true,
        };
        break;
        
      case 'project_manager':
        sectionsConfig = {
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
          paymentBlocks: true,
          suppliers: false,
          documents: true,
          employees: true,
          escalationAlerts: true,
          evmAnalysis: true,
          pertAnalysis: true,
          ganttChart: true,
        };
        break;
        
      default:
        sectionsConfig = reportConfig.includeSections;
    }
    
    setReportConfig(prev => ({
      ...prev,
      reportType: type,
      includeSections: sectionsConfig
    }));
  };

  const isAllSelected = Object.values(reportConfig.includeSections).every(Boolean);
  const isSomeSelected = Object.values(reportConfig.includeSections).some(Boolean);
  const isIndeterminate = isSomeSelected && !isAllSelected;

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des données...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Générateur de Rapport de Projet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration du rapport */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du rapport</Label>
              <Input
                id="title"
                value={reportConfig.title}
                onChange={(e) => setReportConfig(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type de rapport</Label>
              <Select
                value={reportConfig.reportType}
                onValueChange={handleReportTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Résumé</SelectItem>
                  <SelectItem value="detailed">Détaillé</SelectItem>
                  <SelectItem value="financial">Financier</SelectItem>
                  <SelectItem value="project_manager">Chef de projet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sections à inclure */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Sections à inclure</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  className={isIndeterminate ? "data-[state=checked]:bg-primary/50" : ""}
                />
                <Label htmlFor="select-all" className="text-sm font-normal cursor-pointer">
                  {isAllSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                </Label>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground mb-2">
              {reportConfig.reportType === 'summary' && '📋 Rapport résumé : sections essentielles pour un aperçu rapide'}
              {reportConfig.reportType === 'financial' && '💰 Rapport financier : focus sur les aspects budgétaires et financiers'}
              {reportConfig.reportType === 'detailed' && '📊 Rapport détaillé : toutes les sections pour une analyse complète'}
              {reportConfig.reportType === 'project_manager' && '👨‍💼 Rapport chef de projet : sections orientées gestion et suivi'}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(reportConfig.includeSections).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) => updateSectionConfig(key as any, checked as boolean)}
                  />
                  <Label htmlFor={key} className="text-sm font-normal">
                    {getSectionLabel(key)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email de destinataire (optionnel)</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemple@email.com"
              value={reportConfig.recipientEmail}
              onChange={(e) => setReportConfig(prev => ({ ...prev, recipientEmail: e.target.value }))}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes additionnelles (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Ajoutez des commentaires ou observations..."
              value={reportConfig.notes}
              onChange={(e) => setReportConfig(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={generatePDF}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Envoyer par Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getSectionLabel(key: string): string {
  const labels: { [key: string]: string } = {
    overview: 'Aperçu général',
    financial: 'Résumé financier',
    timeline: 'Calendrier',
    materials: 'Matériaux',
    phases: 'Phases',
    inspections: 'Inspections',
    risks: 'Analyse des risques',
    kpi: 'Indicateurs de performance',
    milestones: 'Jalons',
    bankGuarantees: 'Garanties bancaires',
    insurance: 'Assurances',
    paymentBlocks: 'Blocages de paiements',
    suppliers: 'Fournisseurs',
    documents: 'Documents',
    employees: 'Employés',
    escalationAlerts: 'Alertes d\'escalade',
    evmAnalysis: 'Analyse EVM',
    pertAnalysis: 'Analyse PERT',
    ganttChart: 'Diagramme de Gantt'
  };
  return labels[key] || key;
}