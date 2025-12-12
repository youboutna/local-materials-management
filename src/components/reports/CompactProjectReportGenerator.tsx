import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { EnhancedReportingService } from '@/services/enhancedReportingService';
import { EVMMetrics, PERTAnalysis, ProjectData } from '@/types/project';
import { ProjectReportDTO } from '@/types/reportTypes';
import { ReportCalculations } from '@/utils/reportCalculations';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CompactProjectPDFDocument, SingleCompactProjectPDF } from './pdf/CompactProjectPDFDocument';

interface CompactProjectReportGeneratorProps {
  project?: ProjectData;
  projects?: ProjectData[];
  onClose?: () => void;
}

export function CompactProjectReportGenerator({ 
  project, 
  projects, 
  onClose 
}: CompactProjectReportGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportTitle, setReportTitle] = useState('Rapport des Projets SOMELEC');
  
  // Data maps for multiple projects
  const [enrichedDataMap, setEnrichedDataMap] = useState<Map<string, ProjectReportDTO>>(new Map());
  const [evmMetricsMap, setEvmMetricsMap] = useState<Map<string, EVMMetrics>>(new Map());
  const [pertAnalysisMap, setPertAnalysisMap] = useState<Map<string, PERTAnalysis>>(new Map());
  
  // Single project data
  const [singleEnrichedData, setSingleEnrichedData] = useState<ProjectReportDTO | null>(null);
  const [singleEvmMetrics, setSingleEvmMetrics] = useState<EVMMetrics | null>(null);
  const [singlePertAnalysis, setSinglePertAnalysis] = useState<PERTAnalysis | null>(null);

  const projectList = projects || (project ? [project] : []);
  const isSingleProject = !projects && project;

  useEffect(() => {
    const loadData = async () => {
      if (projectList.length === 0) return;
      
      setLoading(true);
      try {
        if (isSingleProject && project) {
          // Load single project data
          const completeReport = await EnhancedReportingService.generateCompleteProjectReport(project);
          setSingleEnrichedData(completeReport.reportDTO);
          
          const evmMetricsResult = ReportCalculations.calculateEVMMetrics(
            project,
            completeReport.costCalculation.actualCost,
            completeReport.reportDTO.phases
          );
          setSingleEvmMetrics(evmMetricsResult);
          
          const pertAnalysisResult = ReportCalculations.calculatePERTAnalysis(
            completeReport.reportDTO.phases,
            project.tasks || []
          );
          setSinglePertAnalysis(pertAnalysisResult);
          
          setReportTitle(`Rapport - ${project.title}`);
        } else {
          // Load multiple projects data
          const enrichedMap = new Map<string, ProjectReportDTO>();
          const evmMap = new Map<string, EVMMetrics>();
          const pertMap = new Map<string, PERTAnalysis>();
          
          for (const proj of projectList) {
            try {
              const completeReport = await EnhancedReportingService.generateCompleteProjectReport(proj);
              enrichedMap.set(proj.id, completeReport.reportDTO);
              
              const evmMetricsResult = ReportCalculations.calculateEVMMetrics(
                proj,
                completeReport.costCalculation.actualCost,
                completeReport.reportDTO.phases
              );
              evmMap.set(proj.id, evmMetricsResult);
              
              const pertAnalysisResult = ReportCalculations.calculatePERTAnalysis(
                completeReport.reportDTO.phases,
                proj.tasks || []
              );
              pertMap.set(proj.id, pertAnalysisResult);
            } catch (error) {
              console.error(`Error loading data for project ${proj.id}:`, error);
            }
          }
          
          setEnrichedDataMap(enrichedMap);
          setEvmMetricsMap(evmMap);
          setPertAnalysisMap(pertMap);
        }
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

    loadData();
  }, [project, projects, toast]);

  const generatePDF = async () => {
    if (projectList.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun projet à exporter.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      let pdfDoc;
      
      if (isSingleProject && project) {
        pdfDoc = (
          <SingleCompactProjectPDF
            project={project}
            reportTitle={reportTitle}
            enrichedData={singleEnrichedData || undefined}
            evmMetrics={singleEvmMetrics || undefined}
            pertAnalysis={singlePertAnalysis || undefined}
          />
        );
      } else {
        pdfDoc = (
          <CompactProjectPDFDocument
            projects={projectList}
            reportTitle={reportTitle}
            enrichedDataMap={enrichedDataMap}
            evmMetricsMap={evmMetricsMap}
            pertAnalysisMap={pertAnalysisMap}
          />
        );
      }

      const blob = await pdf(pdfDoc).toBlob();
      const fileName = `${reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
      saveAs(blob, fileName);
      
      toast({
        title: "Succès",
        description: `Rapport généré avec ${projectList.length} projet(s).`,
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

  if (loading && enrichedDataMap.size === 0 && !singleEnrichedData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des données...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Rapport Compact (Un projet par page)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Titre du rapport</Label>
          <Input
            id="title"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder="Titre du rapport"
          />
        </div>

        {/* Projects Summary */}
        <div className="bg-muted/30 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Projets à inclure</span>
            <Badge variant="secondary">{projectList.length} projet(s)</Badge>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {projectList.map((proj) => (
              <div key={proj.id} className="flex items-center justify-between p-2 bg-background rounded border">
                <div>
                  <p className="text-sm font-medium">{proj.title}</p>
                  <p className="text-xs text-muted-foreground">{proj.location || 'Sans localisation'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {proj.progress || 0}%
                  </Badge>
                <Badge 
                    variant={proj.status === 'terminé' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {proj.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">Format compact</p>
          <p>Chaque projet sera affiché sur une seule page A4 avec un résumé des informations clés : 
          budget, progression, risques, dépenses et conformité.</p>
        </div>

        {/* Generate Button */}
        <Button 
          onClick={generatePDF} 
          disabled={loading || projectList.length === 0}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Télécharger le rapport PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
