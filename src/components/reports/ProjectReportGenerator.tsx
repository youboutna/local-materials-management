import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Mail, Loader2, CheckSquare, Square } from 'lucide-react';
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

  const handleSelectAll = () => {
    const allSections = Object.keys(reportConfig.includeSections) as Array<keyof ReportConfig['includeSections']>;
    const allSelected = allSections.every(section => reportConfig.includeSections[section]);
    
    const newSections = {} as ReportConfig['includeSections'];
    allSections.forEach(section => {
      newSections[section] = !allSelected;
    });
    
    setReportConfig(prev => ({
      ...prev,
      includeSections: newSections
    }));
  };

  const handleReportTypeChange = (newType: string) => {
    const reportType = newType as ReportConfig['reportType'];
    
    // Define default sections for each report type
    const defaultSections: Record<ReportConfig['reportType'], Partial<ReportConfig['includeSections']>> = {
      summary: {
        overview: true,
        financial: true,
        timeline: true,
        phases: true,
        kpi: true,
        milestones: true,
        risks: false,
        materials: false,
        inspections: false,
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
      detailed: {
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
      },
      financial: {
        overview: true,
        financial: true,
        timeline: false,
        materials: false,
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
        employees: false,
        escalationAlerts: true,
        evmAnalysis: true,
        pertAnalysis: false,
        ganttChart: false,
      },
      project_manager: {
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
        documents: true,
        employees: true,
        escalationAlerts: true,
        evmAnalysis: true,
        pertAnalysis: true,
        ganttChart: true,
      },
    };

    setReportConfig(prev => ({
      ...prev,
      reportType,
      includeSections: {
        ...prev.includeSections,
        ...defaultSections[reportType]
      }
    }));
  };

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
            <div className="space-y-3">
              <Label htmlFor="type" className="text-sm font-medium">Type de rapport</Label>
              <Select
                value={reportConfig.reportType}
                onValueChange={handleReportTypeChange}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Rapide</Badge>
                      <span>Résumé exécutif</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="detailed">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Complet</Badge>
                      <span>Rapport détaillé</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="financial">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Finance</Badge>
                      <span>Analyse financière</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="project_manager">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Gestion</Badge>
                      <span>Chef de projet</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground mt-1">
                {getReportTypeDescription(reportConfig.reportType)}
              </div>
            </div>
          </div>

          {/* Sections à inclure */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Sections à inclure</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-8 px-3 text-xs"
              >
                {Object.values(reportConfig.includeSections).every(Boolean) ? (
                  <>
                    <Square className="h-3 w-3 mr-1" />
                    Désélectionner tout
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3 w-3 mr-1" />
                    Sélectionner tout
                  </>
                )}
              </Button>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(reportConfig.includeSections).map(([key, value]) => (
                  <div 
                    key={key} 
                    className={`flex items-center space-x-3 p-2 rounded-md transition-colors hover:bg-background/50 ${
                      value ? 'bg-primary/5 border border-primary/20' : 'bg-background/30'
                    }`}
                  >
                    <Checkbox
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) => updateSectionConfig(key as any, checked as boolean)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor={key} className="text-sm font-normal cursor-pointer flex-1">
                      {getSectionLabel(key)}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="text-xs text-muted-foreground">
                  {Object.values(reportConfig.includeSections).filter(Boolean).length} sections sélectionnées sur {Object.keys(reportConfig.includeSections).length}
                </div>
              </div>
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

function getReportTypeDescription(type: ReportConfig['reportType']): string {
  const descriptions: Record<ReportConfig['reportType'], string> = {
    summary: 'Rapport concis avec les informations essentielles du projet',
    detailed: 'Rapport complet incluant toutes les sections et analyses disponibles',
    financial: 'Focus sur les aspects financiers, garanties et contrôles de paiement',
    project_manager: 'Rapport orienté gestion avec timeline, ressources et analyses avancées'
  };
  return descriptions[type];
}