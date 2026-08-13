import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ReportingService, getReportingService} from '@/application/services/ReportingService';
import { getOrganizationService } from '@/application/services/OrganizationService';
import type { OrganizationDTO } from '@/dtos/entities/OrganizationDTO';
import { ProjectAnalyticsService } from '@/application/services/ProjectAnalyticsService';
import { ProjectDetailDTO, ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { ReportCalculations } from '@/utils/reportCalculations';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { Building2, Download, FileText, Loader2, MapPin } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { REPORT_PROFILES, type ReportProfile, defaultSectionsFor } from '@/config/referentials/reports/report-profiles.referential';
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

// Alias for backward compatibility - flexible interface for report generator
type ProjectData = ProjectDTO & {
  description: string;
};

interface CompactProjectReportGeneratorProps {
  project?: ProjectDTO;
  projects?: ProjectDTO[];
  onClose?: () => void;
}

export function CompactProjectReportGenerator({
  project,
  projects,
  onClose,
}: CompactProjectReportGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportTitle, setReportTitle] = useState('Rapport des Projets SOMELEC');
  const [profile, setProfile] = useState<ReportProfile>('summary');
  // Organisation propriétaire réelle du projet (en-tête du rapport)
  const [ownerOrganization, setOwnerOrganization] = useState<OrganizationDTO | null>(null);
  

  
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
  const reportingService = useMemo(() => getReportingService(), []);
  const organizationService = useMemo(() => getOrganizationService(), []);

  // Organisation propriétaire : celle du projet, sinon l'organisation par défaut.
  useEffect(() => {
    let cancelled = false;
    const loadOwner = async () => {
      try {
        const organizationId = (projectList[0] as any)?.organizationId as string | undefined;
        const owner = organizationId
          ? await organizationService.get(organizationId).catch(() => null)
          : null;
        const resolved = owner ?? (await organizationService.getDefault().catch(() => null));
        if (!cancelled) setOwnerOrganization(resolved);
      } catch (error) {
        console.warn('[CompactProjectReportGenerator] owner organization unavailable', error);
        if (!cancelled) setOwnerOrganization(null);
      }
    };
    loadOwner();
    return () => {
      cancelled = true;
    };
  }, [organizationService, projectList]);

  // Bloc "société" du PDF construit sur les données réelles de l'organisation.
  const companyInfo = useMemo(() => {
    if (!ownerOrganization) return undefined;
    return {
      name: ownerOrganization.name,
      address: ownerOrganization.address || '',
      phone: ownerOrganization.phone || '',
      email: ownerOrganization.email || '',
      logo: ownerOrganization.logoUrl || undefined,
    };
  }, [ownerOrganization]);



  useEffect(() => {
    const loadData = async () => {
      if (projectList.length === 0) return;
      
      setLoading(true);
      try {
        if (isSingleProject && project) {
          // Toujours passer par ReportingService pour garantir des KPIs cohérents
          // (EVM via ReportCalculations, écarts via DeviationEngine, coûts réels via repository).
          const completeReport = await reportingService.generateCompleteProjectReport({ project: project as any, profile, sections: defaultSectionsFor(profile) });
          const reportProject = completeReport.reportDTO.project || {};
          const realCosts: any = completeReport.realCosts || {};
          const actualCost = Number(
            realCosts.totalSpent ?? completeReport.costCalculation.actualCost ?? 0
          );

          // EVM réel : PV temporel, EV pondéré par phase, AC issu du repo
          const reportPhases = ((reportProject as any).phases || []) as any[];
          const evmMetricsResult = ReportCalculations.calculateEVMMetrics(
            project as any,
            actualCost,
            reportPhases,
          );
          setSingleEvmMetrics(evmMetricsResult as EVMMetrics);

          // PERT sur les phases/tâches RÉELLES (auparavant le projet était passé
          // à la place des phases, ce qui déclenchait des activités fictives).
          const pertResult = ReportCalculations.calculatePERTAnalysis(
            reportPhases,
            ((reportProject as any).tasks || (project as any).tasks || []) as any,
          );
          setSinglePertAnalysis({
            expectedDuration: (pertResult as any).totalExpectedDuration || (pertResult as any).expectedDuration || 0,
            variance: (pertResult as any).totalVariance || (pertResult as any).variance || 0,
            ...pertResult,
          });


          // Construire le DTO projet enrichi (préserver null si absent — ne pas mentir avec new Date())
          const projectDetailFromService = {
            ...reportProject,
            id: project.id || '',
            title: project.title || '',
            description: project.description || (reportProject as any).description || '',
            location: project.location || (reportProject as any).location || '',
            status: project.status || (reportProject as any).status || 'planning',
            progress: project.progress ?? (reportProject as any).progress ?? 0,
            budget: project.budget ?? (reportProject as any).budget ?? 0,
            startDate: project.startDate?.toString() || (reportProject as any).startDate || null,
            endDate: project.endDate?.toString() || (reportProject as any).endDate || null,
            currency: project.currency || 'MRU',
            teamSize: project.teamSize || 0,
            createdAt: project.createdAt || (reportProject as any).createdAt || null,
            updatedAt: project.updatedAt || (reportProject as any).updatedAt || null,
            thumbnail: project.thumbnail || '',
            coordinates: project.coordinates,
            // Required arrays
            phases: (reportProject as any).phases || [],
            tasks: (reportProject as any).tasks || [],
            risks: (reportProject as any).risks || [],
            milestones: (reportProject as any).milestones || [],
            payments: (reportProject as any).payments || [],
            materials: (reportProject as any).materials || [],
            stakeholders: (reportProject as any).stakeholders || [],
            insurancePolicies: (reportProject as any).insurancePolicies || [],
            insuranceCertificates: (reportProject as any).insuranceCertificates || [],
            alerts: (reportProject as any).alerts || [],
            tenders: (reportProject as any).tenders || [],
            plannedPhases: (reportProject as any).plannedPhases || (reportProject as any).phases || [],
            constructionMilestones: (reportProject as any).constructionMilestones || [],
            expenses: (reportProject as any).expenses || [],
            resources: (reportProject as any).resources || [],
            inspections: (reportProject as any).inspections || [],
            methodology: (reportProject as any).methodology || 'hybrid',
            ganttChart: (reportProject as any).ganttChart,
            pertAnalysis: (reportProject as any).pertAnalysis,
            earnedValueManagement: (reportProject as any).earnedValueManagement,
            // Écarts calculés via DeviationEngine (référentiel deviation-rules)
            deviations: completeReport.deviations,
            healthScore: completeReport.healthScore,
          } as ProjectDetailDTO;
          setSingleEnrichedData(projectDetailFromService);

          setReportTitle(`Rapport - ${project.title}`);
        } else {
          // Load multiple projects data
          const enrichedMap = new Map<string, ProjectDetailDTO>();
          const evmMap = new Map<string, EVMMetrics>();
          const pertMap = new Map<string, PertAnalysis>();
          
          for (const proj of projectList) {
            try {
              const completeReport = await reportingService.generateCompleteProjectReport({ project: proj as any, profile, sections: defaultSectionsFor(profile) });
              const reportProject = completeReport.reportDTO.project || {};
              const realCosts: any = completeReport.realCosts || {};
              const actualCost = Number(
                realCosts.totalSpent ?? completeReport.costCalculation.actualCost ?? 0
              );

              const projectDetailFromService = {
                ...reportProject,
                id: proj.id || '',
                title: proj.title || '',
                currency: proj.currency || 'MRU',
                teamSize: proj.teamSize || 0,
                createdAt: proj.createdAt || (reportProject as any).createdAt || null,
                updatedAt: proj.updatedAt || (reportProject as any).updatedAt || null,
                phases: (reportProject as any).phases || [],
                tasks: (reportProject as any).tasks || [],
                risks: (reportProject as any).risks || [],
                milestones: (reportProject as any).milestones || [],
                payments: (reportProject as any).payments || [],
                materials: (reportProject as any).materials || [],
                stakeholders: (reportProject as any).stakeholders || [],
                insurancePolicies: (reportProject as any).insurancePolicies || [],
                insuranceCertificates: (reportProject as any).insuranceCertificates || [],
                alerts: (reportProject as any).alerts || [],
                tenders: (reportProject as any).tenders || [],
                plannedPhases: (reportProject as any).plannedPhases || (reportProject as any).phases || [],
                constructionMilestones: (reportProject as any).constructionMilestones || [],
                expenses: (reportProject as any).expenses || [],
                resources: (reportProject as any).resources || [],
                inspections: (reportProject as any).inspections || [],
                methodology: (reportProject as any).methodology || 'hybrid',
                ganttChart: (reportProject as any).ganttChart,
                pertAnalysis: (reportProject as any).pertAnalysis,
                earnedValueManagement: (reportProject as any).earnedValueManagement,
                deviations: completeReport.deviations,
                healthScore: completeReport.healthScore,
              } as ProjectDetailDTO;
              enrichedMap.set(proj.id, projectDetailFromService);

              const evmMetricsResult = ReportCalculations.calculateEVMMetrics(
                proj as any,
                actualCost,
              );
              evmMap.set(proj.id, evmMetricsResult as EVMMetrics);

              const pertResult = ReportCalculations.calculatePERTAnalysis(proj as any);
              pertMap.set(proj.id, {
                expectedDuration: (pertResult as any).totalExpectedDuration || (pertResult as any).expectedDuration || 0,
                variance: (pertResult as any).totalVariance || (pertResult as any).variance || 0,
                ...pertResult,
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
  }, [project, projects, isSingleProject, projectList.length, toast, projectList, reportingService, profile]);

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
            sections={defaultSectionsFor(profile)}
            profile={profile}
            organizationName={ownerOrganization?.name}
            organizationCode={ownerOrganization?.code}
            company={companyInfo}
          />
        ).toBlob();
        
        saveAs(blob, `${reportTitle.replace(/\s+/g, '_')}.pdf`);
        
        toast({
          title: "Succès",
          description: "Rapport généré avec succès",
        });
      } else {
        const blob = await pdf(
          <CompactProjectPDFDocument 
            projects={projectList as any}
            enrichedDataMap={enrichedDataMap}
            evmMetricsMap={evmMetricsMap as any}
            pertAnalysisMap={pertAnalysisMap as any}
            reportTitle={reportTitle}
            sections={defaultSectionsFor(profile)}
            profile={profile}
            organizationName={ownerOrganization?.name}
            organizationCode={ownerOrganization?.code}
            company={companyInfo}
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
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
          <div>
            <Label htmlFor="report-title">Titre du Rapport</Label>
            <Input
              id="report-title"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Entrez le titre du rapport"
            />
          </div>
          <div className="min-w-[200px]">
            <Label htmlFor="report-profile">Profil</Label>
            <Select value={profile} onValueChange={(v) => setProfile(v as ReportProfile)}>
              <SelectTrigger id="report-profile">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(REPORT_PROFILES).map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.label.fr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              {ownerOrganization?.name || 'Organisation propriétaire non définie'}
            </div>
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
