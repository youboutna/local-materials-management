import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ReportingService } from '@/application/services/ReportingService';
import { ProjectAnalyticsService } from '@/application/services/ProjectAnalyticsService';
import { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import { ReportCalculations } from '@/utils/reportCalculations';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { Download, FileText, Loader2, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CompactProjectPDFDocument, SingleCompactProjectPDF } from './pdf/CompactProjectPDFDocument';
import type { EVMMetrics, PERTAnalysis, ProjectData } from '@/types/project';

interface CompactProjectReportGeneratorProps {
  project?: ProjectData;
  projects?: ProjectData[];
  onClose?: () => void;
  useDirectData?: boolean;
}

export function CompactProjectReportGenerator({ 
  project, 
  projects, 
  onClose,
  useDirectData = false 
}: CompactProjectReportGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportTitle, setReportTitle] = useState('Rapport des Projets SOMELEC');
  
  // Data maps for multiple projects
  const [enrichedDataMap, setEnrichedDataMap] = useState<Map<string, ProjectDetailDTO>>(new Map());
  const [evmMetricsMap, setEvmMetricsMap] = useState<Map<string, EVMMetrics>>(new Map());
  const [pertAnalysisMap, setPertAnalysisMap] = useState<Map<string, PERTAnalysis>>(new Map());
  
  // Single project data
  const [singleEnrichedData, setSingleEnrichedData] = useState<ProjectDetailDTO | null>(null);
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
          if (useDirectData) {
            // Utiliser les données directes du projet avec les services
            console.log('📊 Using direct project data for report:', project);
            
            const analyticsService = new ProjectAnalyticsService();
            const comprehensiveAnalytics = await analyticsService.getProjectAnalytics(project.id);
            
            // Calculs EVM basés sur les données réelles du service
            const evmMetrics: EVMMetrics = {
              schedulePerformanceIndex: comprehensiveAnalytics.schedule_performance || 1.0,
              costPerformanceIndex: comprehensiveAnalytics.cost_efficiency || 1.0,
              earnedValue: comprehensiveAnalytics.total_budget * (comprehensiveAnalytics.progress_percentage / 100),
              plannedValue: comprehensiveAnalytics.total_budget * (comprehensiveAnalytics.progress_percentage / 100),
              actualCost: comprehensiveAnalytics.actual_cost,
              budgetAtCompletion: comprehensiveAnalytics.total_budget,
              estimateAtCompletion: comprehensiveAnalytics.actual_cost + (comprehensiveAnalytics.total_budget - comprehensiveAnalytics.actual_cost),
              estimateToComplete: comprehensiveAnalytics.total_budget - comprehensiveAnalytics.actual_cost,
              varianceAtCompletion: comprehensiveAnalytics.budget_variance,
              scheduleVariance: comprehensiveAnalytics.timeline_variance || 0,
              costVariance: comprehensiveAnalytics.budget_variance || 0
            };
            
            // Create PERT analysis
            const pertAnalysis: PERTAnalysis = {
              optimisticEstimate: 0,
              mostLikelyEstimate: 0,
              pessimisticEstimate: 0,
              expectedTime: 0,
              standardDeviation: 0,
              variance: 0
            };
            
            // Create ProjectDetailDTO
            const projectDetailDTO: ProjectDetailDTO = {
              id: project.id,
              title: project.title,
              description: project.description || '',
              location: project.location || '',
              status: project.status || 'en cours',
              progress: project.progress || 0,
              budget: project.budget || 0,
              startDate: project.startDate?.toString() || new Date().toISOString(),
              endDate: project.endDate?.toString(),
              thumbnail: project.thumbnail || '',
              teamSize: project.teamSize || 0,
              coordinates: project.coordinates,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              tasks: project.tasks || [],
              risks: project.risks || [],
              resources: project.resources || [],
              inspections: project.inspections || [],
              plannedPhases: project.phases || [],
              expenses: project.expenses || [],
              alerts: project.alerts || [],
              insurancePolicies: project.insurancePolicies || [],
              methodology: project.methodology || 'hybrid',
              ganttChart: project.ganttChart,
              pertAnalysis: project.pertAnalysis,
              earnedValueManagement: project.earnedValueManagement
            };
            
            setSingleEnrichedData(projectDetailDTO);
            setSingleEvmMetrics(evmMetrics);
            setSinglePertAnalysis(pertAnalysis);
          } else {
            // Use ReportingService for comprehensive report
            const completeReport = await ReportingService.generateCompleteProjectReport(project);
            setSingleEnrichedData(completeReport.reportDTO);
            
            const evmMetricsResult = ReportCalculations.calculateEVMMetrics(
              project,
              completeReport.costCalculation.actualCost
            );
            setSingleEvmMetrics(evmMetricsResult);
            
            const pertResult = ReportCalculations.calculatePERTAnalysis(project);
            setSinglePertAnalysis(pertResult);
          }
          
          setReportTitle(`Rapport - ${project.title}`);
        } else {
          // Load multiple projects data
          const enrichedMap = new Map<string, ProjectDetailDTO>();
          const evmMap = new Map<string, EVMMetrics>();
          const pertMap = new Map<string, PERTAnalysis>();
          
          for (const proj of projectList) {
            try {
              const completeReport = await ReportingService.generateCompleteProjectReport(proj);
              enrichedMap.set(proj.id, completeReport.reportDTO);
              
              const evmMetricsResult = ReportCalculations.calculateEVMMetrics(
                proj,
                completeReport.costCalculation.actualCost
              );
              evmMap.set(proj.id, evmMetricsResult);
              
              const pertResult = ReportCalculations.calculatePERTAnalysis(proj);
              pertMap.set(proj.id, pertResult);
            } catch (error) {
              console.error(`Failed to load data for project ${proj.id}:`, error);
            }
          }
          
          setEnrichedDataMap(enrichedMap);
          setEvmMetricsMap(evmMap);
          setPertAnalysisMap(pertMap);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Erreur",
          description: "Failed to load project data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [project, projects, isSingleProject, projectList.length, toast, useDirectData]);

  const generatePDF = async () => {
    if (projectList.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun projet à exporter.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isSingleProject && singleEnrichedData && singleEvmMetrics && singlePertAnalysis) {
        const blob = await pdf(
          <SingleCompactProjectPDF 
            project={project}
            enrichedData={singleEnrichedData}
            evmMetrics={singleEvmMetrics}
            pertAnalysis={singlePertAnalysis}
            reportTitle={reportTitle}
          />
        ).toBlob();
        
        saveAs(blob, `${reportTitle.replace(/\s+/g, '_')}.pdf`);
        
        toast({
          title: "Succès",
          description: "Rapport généré avec succès",
        });
      } else {
        const projectsData = Array.from(enrichedDataMap.entries()).map(([id, data]) => ({
          id,
          data,
          evmMetrics: evmMetricsMap.get(id),
          pertAnalysis: pertAnalysisMap.get(id)
        }));
        
        const blob = await pdf(
          <CompactProjectPDFDocument 
            projects={projectsData}
            reportTitle={reportTitle}
          />
        ).toBlob();
        
        saveAs(blob, `${reportTitle.replace(/\s+/g, '_')}.pdf`);
        
        toast({
          title: "Succès",
          description: "Rapport généré avec succès",
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erreur",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Générateur de Rapport Compact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="report-title">Titre du Rapport</Label>
            <Input
              id="report-title"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Entrez le titre du rapport"
            />
          </div>
          <Button
            onClick={generatePDF}
            disabled={loading || projectList.length === 0}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Générer PDF
          </Button>
        </div>
        
        {projectList.length > 0 && (
          <div className="space-y-2">
            <Badge variant="outline">
              {isSingleProject ? '1 projet sélectionné' : `${projectList.length} projets sélectionnés`}
            </Badge>
            {isSingleProject && project && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {project.location || 'Localisation non spécifiée'}
              </div>
            )}
          </div>
        )}
        
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
