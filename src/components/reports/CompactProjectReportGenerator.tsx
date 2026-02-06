import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ReportingService } from '@/application/services/ReportingService';
import { ProjectAnalyticsService } from '@/application/services/ProjectAnalyticsService';
import { ProjectDetailDTO, ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { ReportCalculations } from '@/utils/reportCalculations';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { Download, FileText, Loader2, MapPin } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { CompactProjectPDFDocument, SingleCompactProjectPDF } from './pdf/CompactProjectPDFDocument';

// Local type aliases for report generation
interface EVMMetrics {
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
  earnedValue: number;
  plannedValue: number;
  actualCost: number;
  budgetAtCompletion: number;
  estimateAtCompletion: number;
  estimateToComplete: number;
  varianceAtCompletion: number;
  scheduleVariance: number;
  costVariance: number;
}

interface PertAnalysis {
  expectedDuration: number;
  variance: number;
  optimisticEstimate?: number;
  mostLikelyEstimate?: number;
  pessimisticEstimate?: number;
  expectedTime?: number;
  standardDeviation?: number;
}

// Alias for backward compatibility
type ProjectData = ProjectDTO;

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
  const [pertAnalysisMap, setPertAnalysisMap] = useState<Map<string, PertAnalysis>>(new Map());
  
  // Single project data
  const [singleEnrichedData, setSingleEnrichedData] = useState<ProjectDetailDTO | null>(null);
  const [singleEvmMetrics, setSingleEvmMetrics] = useState<EVMMetrics | null>(null);
  const [singlePertAnalysis, setSinglePertAnalysis] = useState<PertAnalysis | null>(null);

  const projectList = useMemo(() => projects || (project ? [project] : []), [projects, project]);
  const isSingleProject = !projects && project;

  // Create service instance
  const reportingService = useMemo(() => new ReportingService(), []);

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
            
            // Safely extract analytics values
            const analytics = comprehensiveAnalytics || {};
            const totalBudget = (analytics as any).total_budget || project.budget || 0;
            const progressPercentage = (analytics as any).progress_percentage || project.progress || 0;
            const actualCostValue = (analytics as any).actual_cost || 0;
            const schedulePerformance = (analytics as any).schedule_performance || 1.0;
            const costEfficiency = (analytics as any).cost_efficiency || 1.0;
            const budgetVariance = (analytics as any).budget_variance || 0;
            const timelineVariance = (analytics as any).timeline_variance || 0;
            
            // Calculs EVM basés sur les données réelles du service
            const evmMetrics: EVMMetrics = {
              schedulePerformanceIndex: schedulePerformance,
              costPerformanceIndex: costEfficiency,
              earnedValue: totalBudget * (progressPercentage / 100),
              plannedValue: totalBudget * (progressPercentage / 100),
              actualCost: actualCostValue,
              budgetAtCompletion: totalBudget,
              estimateAtCompletion: actualCostValue + (totalBudget - actualCostValue),
              estimateToComplete: totalBudget - actualCostValue,
              varianceAtCompletion: budgetVariance,
              scheduleVariance: timelineVariance,
              costVariance: budgetVariance
            };
            
            // Create PERT analysis
            const pertAnalysis: PertAnalysis = {
              expectedDuration: 0,
              variance: 0,
              optimisticEstimate: 0,
              mostLikelyEstimate: 0,
              pessimisticEstimate: 0,
              expectedTime: 0,
              standardDeviation: 0
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
              createdAt: project.createdAt || new Date().toISOString(),
              updatedAt: project.updatedAt || new Date().toISOString(),
              currency: project.currency || 'MRU',
              tasks: (project as any).tasks || [],
              risks: (project as any).risks || [],
              resources: (project as any).resources || [],
              inspections: (project as any).inspections || [],
              plannedPhases: (project as any).phases || [],
              expenses: (project as any).expenses || [],
              alerts: (project as any).alerts || [],
              insurancePolicies: (project as any).insurancePolicies || [],
              methodology: (project as any).methodology || 'hybrid',
              ganttChart: (project as any).ganttChart,
              pertAnalysis: (project as any).pertAnalysis,
              earnedValueManagement: (project as any).earnedValueManagement
            };
            
            setSingleEnrichedData(projectDetailDTO);
            setSingleEvmMetrics(evmMetrics);
            setSinglePertAnalysis(pertAnalysis);
          } else {
            // Use ReportingService for comprehensive report
            const completeReport = await reportingService.generateCompleteProjectReport({ project });
            const reportProject = completeReport.reportDTO.project || {};
            
            // Convert ProjectData to ProjectDetailDTO
            const projectDetailFromService: ProjectDetailDTO = {
              ...reportProject,
              id: project.id,
              title: project.title,
              currency: project.currency || 'MRU',
              teamSize: project.teamSize || 0,
              createdAt: project.createdAt || new Date().toISOString(),
              updatedAt: project.updatedAt || new Date().toISOString(),
              tasks: (reportProject as any).tasks || [],
              risks: (reportProject as any).risks || [],
              resources: (reportProject as any).resources || [],
              inspections: (reportProject as any).inspections || [],
              plannedPhases: (reportProject as any).phases || [],
              expenses: (reportProject as any).expenses || [],
              alerts: (reportProject as any).alerts || [],
              insurancePolicies: (reportProject as any).insurancePolicies || [],
              methodology: (reportProject as any).methodology || 'hybrid',
              ganttChart: (reportProject as any).ganttChart,
              pertAnalysis: (reportProject as any).pertAnalysis,
              earnedValueManagement: (reportProject as any).earnedValueManagement
            };
            setSingleEnrichedData(projectDetailFromService);
            
            const evmMetricsResult = ReportCalculations.calculateEVMMetrics(
              project as any,
              completeReport.costCalculation.actualCost
            );
            setSingleEvmMetrics(evmMetricsResult as EVMMetrics);
            
            const pertResult = ReportCalculations.calculatePERTAnalysis(project as any);
            // Map PERT result to our interface
            setSinglePertAnalysis({
              expectedDuration: (pertResult as any).totalExpectedDuration || (pertResult as any).expectedDuration || 0,
              variance: (pertResult as any).totalVariance || (pertResult as any).variance || 0,
              ...pertResult
            });
          }
          
          setReportTitle(`Rapport - ${project.title}`);
        } else {
          // Load multiple projects data
          const enrichedMap = new Map<string, ProjectDetailDTO>();
          const evmMap = new Map<string, EVMMetrics>();
          const pertMap = new Map<string, PertAnalysis>();
          
          for (const proj of projectList) {
            try {
              const completeReport = await reportingService.generateCompleteProjectReport({ project: proj });
              const reportProject = completeReport.reportDTO.project || {};
              
              // Convert ProjectData to ProjectDetailDTO
              const projectDetailFromService: ProjectDetailDTO = {
                ...reportProject,
                id: proj.id,
                title: proj.title,
                currency: proj.currency || 'MRU',
                teamSize: proj.teamSize || 0,
                createdAt: proj.createdAt || new Date().toISOString(),
                updatedAt: proj.updatedAt || new Date().toISOString(),
                tasks: (reportProject as any).tasks || [],
                risks: (reportProject as any).risks || [],
                resources: (reportProject as any).resources || [],
                inspections: (reportProject as any).inspections || [],
                plannedPhases: (reportProject as any).phases || [],
                expenses: (reportProject as any).expenses || [],
                alerts: (reportProject as any).alerts || [],
                insurancePolicies: (reportProject as any).insurancePolicies || [],
                methodology: (reportProject as any).methodology || 'hybrid',
                ganttChart: (reportProject as any).ganttChart,
                pertAnalysis: (reportProject as any).pertAnalysis,
                earnedValueManagement: (reportProject as any).earnedValueManagement
              };
              enrichedMap.set(proj.id, projectDetailFromService);
              
              const evmMetricsResult = ReportCalculations.calculateEVMMetrics(
                proj as any,
                completeReport.costCalculation.actualCost
              );
              evmMap.set(proj.id, evmMetricsResult as EVMMetrics);
              
              const pertResult = ReportCalculations.calculatePERTAnalysis(proj as any);
              pertMap.set(proj.id, {
                expectedDuration: (pertResult as any).totalExpectedDuration || (pertResult as any).expectedDuration || 0,
                variance: (pertResult as any).totalVariance || (pertResult as any).variance || 0,
                ...pertResult
              });
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
  }, [project, projects, isSingleProject, projectList.length, toast, useDirectData, projectList, reportingService]);

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
            project={project as any}
            enrichedData={singleEnrichedData}
            evmMetrics={singleEvmMetrics as any}
            pertAnalysis={singlePertAnalysis as any}
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
            projects={projectsData as any}
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
