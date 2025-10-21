import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProjectService } from '@/services/ProjectService';
import { ProjectAnalyticsService } from '@/services/ProjectAnalyticsService';
import { ProjectSummaryDTO, ProjectDetailDTO } from '@/types/dto';
import { ReportManager } from '@/components/reports/ReportManager';
import FinancialOverview from '@/components/project/FinaancialOverview';
import PhaseList from '@/components/project/PhaseList';
import EnhancedRiskManager from '@/components/project/EnhancedRiskManager';
import EnhancedTaskManager from '@/components/project/EnhancedTaskManager';
import TeamOverview from '@/components/project/TeamOverview';
import InteractiveMapGIS from '@/components/materials/InteractiveMapGIS';
import ProjectGantt from '@/components/project/ProjectGantt';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  Users,
  AlertTriangle,
  TrendingUp,
  Package,
  Target,
  FileText,
  CheckCircle,
  Clock,
  Layers,
  BarChart3,
  Shield
} from 'lucide-react';

interface ProjectDetailByDTOProps {
  projectId?: string;
  onEdit?: () => void;
  onClose?: () => void;
}

const ProjectDetailByDTO: React.FC<ProjectDetailByDTOProps> = ({ 
  projectId: propProjectId, 
  onEdit, 
  onClose 
}) => {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const projectId = propProjectId || routeProjectId;

  console.log('🔍 ProjectDetailByDTO render - projectId:', projectId);

  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const queryClient = useQueryClient();
  const projectService = new ProjectService();

  // Fetch project data using ProjectService
  const { data: project, isLoading: projectLoading, error: projectError } = useQuery<ProjectSummaryDTO>({
    queryKey: ['project-summary', projectId],
    queryFn: async () => {
      console.log('🔍 Query function starting for projectId:', projectId);
      if (!projectId) throw new Error('ID du projet manquant');
      
      console.log('🔍 Calling ProjectService.getProjectSummary...');
      const result = await projectService.getProjectSummary(projectId);
      console.log('🔍 ProjectService result:', result ? 'SUCCESS' : 'NULL');
      if (!result) throw new Error('Projet non trouvé');
      return result;
    },
    enabled: !!projectId,
    retry: 1,
    staleTime: 30_000,
  });

  // Fetch detailed project data (includes plannedPhases, tasks, risks, inspections, etc.)
  const { data: projectDetail, isLoading: detailLoading } = useQuery<ProjectDetailDTO | null>({
    queryKey: ['project-detail', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      return await projectService.getProjectDetail(projectId);
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  // Analytics from ProjectService
  const { data: analytics } = useQuery({
    queryKey: ['project-analytics', projectId],
    queryFn: async () => {
      if (!projectId || !projectDetail) return null;
      return await ProjectAnalyticsService.getComprehensiveAnalytics(projectDetail);
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000,
  });

  // KPIs from ProjectAnalyticsService
  const { data: kpiMetrics } = useQuery({
    queryKey: ['project-kpis', projectId],
    queryFn: async () => {
      if (!projectId || !projectDetail) return null;
      return await ProjectAnalyticsService.getKPIMetrics(projectDetail);
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000,
  });

  // Compliance data
  const { data: complianceData } = useQuery({
    queryKey: ['project-compliance', projectId],
    queryFn: async () => {
      if (!projectId || !projectDetail) return null;
      return await ProjectAnalyticsService.getComplianceData(projectDetail);
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000,
  });

  // PERT Analysis
  const { data: pertAnalysis } = useQuery({
    queryKey: ['project-pert', projectId],
    queryFn: async () => {
      if (!projectId || !projectDetail) return null;
      const { ProjectCalculationService } = await import('@/services/ProjectCalculationService');
      return ProjectCalculationService.calculatePERTAnalysis(projectDetail);
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000,
  });

  // Gantt Chart
  const { data: ganttChart } = useQuery({
    queryKey: ['project-gantt', projectId],
    queryFn: async () => {
      if (!projectId || !projectDetail) return null;
      const { ProjectCalculationService } = await import('@/services/ProjectCalculationService');
      return ProjectCalculationService.generateGanttChart(projectDetail);
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000,
  });

  // Use data from ProjectDetailDTO
  const phasesSource: any[] = projectDetail?.plannedPhases || [];
  const tasksSource = projectDetail?.tasks || [];
  const risksSource = projectDetail?.risks || [];
  const inspectionsSource = projectDetail?.inspections || [];
  const paymentsSource = projectDetail?.inspections || []; // TODO: Add payments to DTO

  // Normalized phases for UI
  const computedPhases = useMemo(() => {
    const normalize = (p: any) => ({
      id: p.id,
      phase: p.phase_name || p.phase || p.name || p.construction_stage || 'Phase',
      status: p.status || 'planned',
      progress: p.progress || 0,
      startDate: p.start_date || p.startDate || p.start || '',
      endDate: p.end_date || p.endDate || p.end || '',
      stages: Array.isArray(p.stages)
        ? p.stages
        : (p.construction_stage ? [{ name: p.construction_stage, status: p.status || 'planned' }] : [])
    });
    return (phasesSource || []).map(normalize);
  }, [phasesSource]);

  // Compute derived data from DTO
  const [resources, setResources] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);

  useEffect(() => {
    if (projectDetail) {
      computeResources();
      setTasks(tasksSource);
      setRisks(risksSource);
    }
  }, [projectDetail?.id]);

  const computeResources = () => {
    if (!projectDetail) return;
    const allResources: any[] = [];
    if (projectDetail.projectResponsableId) {
      allResources.push({
        id: `manager-${projectDetail.projectResponsableId}`,
        name: 'Chef de projet',
        type: 'human',
        position: 'Chef de projet',
        costPerHour: 0,
        availability: 100,
      });
    }
    if (projectDetail.mainContractor) {
      allResources.push({
        id: `contractor-main`,
        name: projectDetail.mainContractor,
        type: 'human',
        position: 'Contractant principal',
        costPerHour: 0,
        availability: 100,
      });
    }
    setResources(allResources);
  };

  // Calculate realistic progress
  const [calculatedProgress, setCalculatedProgress] = useState<number>(0);
  
  useEffect(() => {
    const calculateProgress = async () => {
      if (projectDetail) {
        const { ProgressCalculationService } = await import('@/services/ProgressCalculationService');
        const progress = ProgressCalculationService.calculateProjectProgress(
          projectDetail.plannedPhases || [],
          projectDetail.tasks || [],
          projectDetail.inspections || []
        );
        setCalculatedProgress(progress);
      }
    };
    calculateProgress();
  }, [projectDetail?.id, projectDetail?.plannedPhases, projectDetail?.tasks, projectDetail?.inspections]);

  // Use data from DTO for all tabs
  const payments = paymentsSource;
  const documentsData: any[] = [];
  const bankGuaranteesData: any[] = [];
  const insuranceCertificatesData: any[] = [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-200';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'planned': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'delayed': return <AlertTriangle className="h-4 w-4" />;
      case 'on_hold': return <Clock className="h-4 w-4" />;
      case 'planned': return <Target className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des données du projet...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Récupération des informations depuis la base de données
          </p>
        </div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-2">
            {projectError?.message || 'Impossible de charger le projet'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Vérifiez que l'ID du projet est correct ou que vous avez les permissions nécessaires.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()} variant="outline">
              Réessayer
            </Button>
            <Button onClick={() => navigate('/projects')}>
              Retour aux projets
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/projects')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux projets
            </Button>
          </div>
          <h1 className="text-3xl font-bold">{project?.title || 'Projet sans titre'}</h1>
          <p className="text-muted-foreground mt-2">{project?.description || 'Aucune description'}</p>
          <div className="flex items-center gap-4 mt-4">
            <Badge variant={project?.status === 'terminé' ? 'default' : 'secondary'} className={getStatusColor(project?.status || 'en cours')}>
              {getStatusIcon(project?.status || 'en cours')}
              {project?.status || 'En cours'}
            </Badge>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{project?.location || 'Localisation non définie'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">{project?.teamSize || 0} membres</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button onClick={onEdit} variant="outline">
              Modifier
            </Button>
          )}
          {onClose && (
            <Button onClick={onClose} variant="ghost">
              Fermer
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progression</p>
                <p className="text-2xl font-bold">{calculatedProgress}%</p>
                <p className="text-xs text-muted-foreground mt-1">Calculée: Phases + Tâches + Inspections</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <Progress value={calculatedProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget</p>
                <p className="text-2xl font-bold">{(project.budget || 0).toLocaleString()} MRU</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Budget alloué
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phases</p>
                <p className="text-2xl font-bold">{computedPhases.length || project.phasesCount || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {computedPhases.filter((p: any) => p.status === 'completed').length || 0} terminées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Équipe</p>
                <p className="text-2xl font-bold">{resources.length}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {resources.filter(r => r.type === 'human').length} membres
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-12">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="financial">Financier</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="risks">Risques</TabsTrigger>
          <TabsTrigger value="resources">Équipe</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="compliance">Conformité</TabsTrigger>
          <TabsTrigger value="gantt">Gantt</TabsTrigger>
          <TabsTrigger value="pert">PERT</TabsTrigger>
          <TabsTrigger value="map">Carte</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Date de début</p>
                  <p className="text-sm text-muted-foreground">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Non définie'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Date de fin prévue</p>
                  <p className="text-sm text-muted-foreground">
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Non définie'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Source de financement</p>
                  <p className="text-sm text-muted-foreground">{project.financingSource || 'Non spécifiée'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Type de marché</p>
                  <p className="text-sm text-muted-foreground">{project.marketType || 'Non spécifié'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statut du projet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Phase actuelle</span>
                  <Badge variant="outline">{project.currentPhase || 'Non définie'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Étape actuelle</span>
                  <Badge variant="outline">{project.currentStage || 'Non définie'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Méthodologie</span>
                  <Badge variant="outline">Standard</Badge>
                </div>
                <Progress value={calculatedProgress} className="mt-4" />
                <p className="text-xs text-center text-muted-foreground">
                  Progression globale calculée: {calculatedProgress}%
                </p>
                <p className="text-xs text-center text-muted-foreground mt-1">
                  Basée sur: {computedPhases.length} phases, {tasksSource.length} tâches, {inspectionsSource.length} inspections
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Matériaux</p>
                    <p className="text-lg font-bold">
                      {computedPhases.reduce((total: number, phase: any) => {
                        const milestones = (phase as any).milestones || {};
                        const extra = Array.isArray((phase as any).materials) ? (phase as any).materials.length : 0;
                        return total + (milestones.materials?.length || 0) + extra;
                      }, 0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Jalons</p>
                    <p className="text-lg font-bold">
                      {computedPhases.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium">Documents</p>
                    <p className="text-lg font-bold">{documentsData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          <FinancialOverview 
            budget={project.budget || 0}
            spent={0}
            phases={phasesSource || []}
            financialMetrics={{}}
          />
        </TabsContent>

        <TabsContent value="phases" className="mt-6">
          <PhaseList phases={computedPhases} projectId={projectId!} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <EnhancedTaskManager 
            projectId={projectId!} 
            tasks={tasks}
            setTasks={setTasks}
            phases={computedPhases}
          />
        </TabsContent>

        <TabsContent value="risks" className="mt-6">
          <EnhancedRiskManager 
            projectId={projectId!} 
            risks={risks}
            setRisks={setRisks}
            phases={computedPhases}
          />
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <TeamOverview 
            resources={resources} 
            setResources={setResources}
            projectId={projectId!} 
            phases={computedPhases}
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Échéancier de paiements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.allowsInitialPayment && (
                  <div className="p-4 border rounded-lg bg-green-50">
                    <h4 className="font-medium">Avance initiale autorisée</h4>
                    <p className="text-sm text-muted-foreground">
                      {project.initialPaymentPercentage}% du montant total
                    </p>
                    <p className="font-semibold text-green-700">
                      {((project.budget || 0) * (project.initialPaymentPercentage || 0) / 100).toLocaleString()} MRU
                    </p>
                  </div>
                )}
                {payments.length > 0 ? (
                  <div className="grid gap-4">
                    {payments.map((payment: any) => (
                      <div key={payment.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{payment.description || 'Paiement'}</h4>
                            <p className="text-sm text-muted-foreground">
                              Date: {new Date(payment.payment_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Progression: {payment.progress_at_payment}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{(payment.amount || 0).toLocaleString()} MRU</p>
                            <Badge 
                              variant={payment.status === 'approved' ? 'default' : 'secondary'}
                              className={payment.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucun paiement enregistré</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpis" className="mt-6">
          {kpiMetrics ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Progress KPIs */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Progression</p>
                        <p className="text-2xl font-bold">{kpiMetrics.overallProgress}%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiMetrics.completedTasks} tâches terminées / {kpiMetrics.delayedTasks} en retard
                    </p>
                  </CardContent>
                </Card>

                {/* Budget KPIs */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Utilisation Budget</p>
                        <p className="text-2xl font-bold">{kpiMetrics.budgetUtilization.toFixed(1)}%</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Reste: {kpiMetrics.remainingBudget.toLocaleString()} MRU
                    </p>
                  </CardContent>
                </Card>

                {/* EVM - CPI */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">CPI (Coût)</p>
                        <p className="text-2xl font-bold">{kpiMetrics.cpi.toFixed(2)}</p>
                      </div>
                      <TrendingUp className={`h-8 w-8 ${kpiMetrics.cpi >= 1 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiMetrics.cpi >= 1 ? 'En dessous du budget' : 'Au-dessus du budget'}
                    </p>
                  </CardContent>
                </Card>

                {/* EVM - SPI */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">SPI (Planning)</p>
                        <p className="text-2xl font-bold">{kpiMetrics.spi.toFixed(2)}</p>
                      </div>
                      <Calendar className={`h-8 w-8 ${kpiMetrics.spi >= 1 ? 'text-green-600' : 'text-orange-600'}`} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiMetrics.spi >= 1 ? 'En avance' : 'En retard'}
                    </p>
                  </CardContent>
                </Card>

                {/* Quality */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Qualité</p>
                        <p className="text-2xl font-bold">{kpiMetrics.inspectionPassRate.toFixed(0)}%</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiMetrics.criticalIssues} incidents critiques
                    </p>
                  </CardContent>
                </Card>

                {/* Risks */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Risques</p>
                        <p className="text-2xl font-bold">{kpiMetrics.totalRisks}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiMetrics.highRisks} risques élevés
                    </p>
                  </CardContent>
                </Card>

                {/* Health Score */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Santé Globale</p>
                        <p className="text-2xl font-bold">{kpiMetrics.healthScore}</p>
                      </div>
                      <Target className={`h-8 w-8 ${kpiMetrics.healthScore >= 80 ? 'text-green-600' : kpiMetrics.healthScore >= 60 ? 'text-orange-600' : 'text-red-600'}`} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Score sur 100
                    </p>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Délai</p>
                        <p className="text-2xl font-bold">{kpiMetrics.remainingDays}j</p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiMetrics.elapsedDays}j écoulés
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed KPI Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Budget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Valeur acquise</span>
                        <span className="font-semibold">{kpiMetrics.earnedValue.toLocaleString()} MRU</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Variance coût</span>
                        <span className={`font-semibold ${kpiMetrics.costVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {kpiMetrics.costVariance.toLocaleString()} MRU
                        </span>
                      </div>
                      <Progress value={kpiMetrics.budgetUtilization} className="mt-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Planning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Variance planning</span>
                        <span className={`font-semibold ${kpiMetrics.scheduleVariance >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                          {kpiMetrics.scheduleVariance.toFixed(1)} jours
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Tâches en retard</span>
                        <span className="font-semibold text-red-600">{kpiMetrics.delayedTasks}</span>
                      </div>
                      <Progress value={kpiMetrics.overallProgress} className="mt-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Chargement des KPIs...</p>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <div className="space-y-6">
            {/* Bank Guarantees */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Garanties bancaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bankGuaranteesData.length > 0 ? (
                  <div className="space-y-4">
                    {bankGuaranteesData.map((guarantee: any) => (
                      <div key={guarantee.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{guarantee.guarantee_type}</h4>
                            <p className="text-sm text-muted-foreground">
                              Banque: {guarantee.bank_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Montant: {guarantee.guarantee_amount?.toLocaleString()} MRU
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Émission: {new Date(guarantee.issue_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Échéance: {new Date(guarantee.expiry_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge 
                            className={guarantee.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                            }
                          >
                            {guarantee.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Aucune garantie bancaire enregistrée
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Insurance Certificates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Assurances
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insuranceCertificatesData.length > 0 ? (
                  <div className="space-y-4">
                    {insuranceCertificatesData.map((cert: any) => (
                      <div key={cert.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{cert.coverage_type}</h4>
                            <p className="text-sm text-muted-foreground">
                              Assureur: {cert.insurance_company}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Police: {cert.policy_number}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Couverture: {cert.coverage_amount?.toLocaleString()} MRU
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Validité: {new Date(cert.valid_from).toLocaleDateString()} - {new Date(cert.valid_until).toLocaleDateString()}
                            </p>
                            {cert.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Notes: {cert.notes}
                              </p>
                            )}
                          </div>
                          <Badge 
                            className={cert.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                            }
                          >
                            {cert.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Aucune assurance enregistrée
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Compliance Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Documents de conformité
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documentsData.filter((doc: any) => 
                  ['contract', 'project_report', 'tender'].includes(doc.document_type)
                ).length > 0 ? (
                  <div className="space-y-4">
                    {documentsData
                      .filter((doc: any) => ['contract', 'project_report', 'tender'].includes(doc.document_type))
                      .map((doc: any) => (
                        <div key={doc.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{doc.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                Type: {doc.document_type}
                              </p>
                              {doc.description && (
                                <p className="text-sm text-muted-foreground">
                                  {doc.description}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                Créé le: {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge 
                              className={
                                doc.status === 'approved' 
                                  ? 'bg-green-100 text-green-800'
                                  : doc.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            >
                              {doc.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Aucun document de conformité
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Résumé de conformité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">{bankGuaranteesData.length}</p>
                    <p className="text-sm text-muted-foreground">Garanties bancaires</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">{insuranceCertificatesData.length}</p>
                    <p className="text-sm text-muted-foreground">Assurances</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">
                      {documentsData.filter((d: any) => 
                        ['contract', 'project_report', 'tender'].includes(d.document_type)
                      ).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Documents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <InteractiveMapGIS
            title="Localisation du projet"
            description="Carte interactive avec outils GIS"
            allowPolygon={true}
            value={{
              coordinates: project.coordinates ? {
                lat: project.coordinates.latitude,
                lng: project.coordinates.longitude
              } : undefined,
              polygon: Array.isArray((project as any).localisation) ? (project as any).localisation : [],
              warehouseShape: Array.isArray((project as any).localisation) ? (project as any).localisation : [],
              address: typeof (project as any).adresse === 'string' ? (project as any).adresse : ((project as any).adresse?.address || project.location || ''),
              shapeType: (project as any).forme
            }}
            onChange={(data) => {
              console.log('Map data changed:', data);
              // Handle map data updates
            }}
          />
        </TabsContent>

        <TabsContent value="gantt" className="mt-6">
          <ProjectGantt 
            project={project as any}
            phases={(computedPhases || []).map((p: any) => ({
              id: p.id,
              name: p.phase,
              startDate: new Date(p.startDate || new Date()),
              endDate: new Date(p.endDate || new Date()),
              progress: p.progress || 0,
              status: (p.status || 'planned') as any,
            }))}
          />
        </TabsContent>

        <TabsContent value="pert" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analyse PERT</CardTitle>
            </CardHeader>
            <CardContent>
              {pertAnalysis ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Durée attendue totale</p>
                      <p className="text-2xl font-bold">{pertAnalysis.totalExpectedDuration.toFixed(1)} jours</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Écart-type total</p>
                      <p className="text-2xl font-bold">
                        {pertAnalysis.variances 
                          ? Math.sqrt(Object.values(pertAnalysis.variances).reduce((sum: number, variance: number) => sum + variance, 0)).toFixed(1)
                          : '0.0'} jours
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tâches sur chemin critique</p>
                      <p className="text-2xl font-bold">{pertAnalysis.criticalPath?.length || 0}</p>
                    </div>
                  </div>

                  {/* Activities Table */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Activités PERT</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Activité</th>
                            <th className="text-right p-2">Optimiste</th>
                            <th className="text-right p-2">Probable</th>
                            <th className="text-right p-2">Pessimiste</th>
                            <th className="text-right p-2">Estimation PERT</th>
                            <th className="text-right p-2">Écart-type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pertAnalysis.activities.slice(0, 10).map((activity, index) => (
                            <tr key={index} className="border-b hover:bg-muted/50">
                              <td className="p-2 font-medium">{activity.name}</td>
                              <td className="p-2 text-right">{activity.optimistic.toFixed(1)}j</td>
                              <td className="p-2 text-right">{activity.mostLikely.toFixed(1)}j</td>
                              <td className="p-2 text-right">{activity.pessimistic.toFixed(1)}j</td>
                              <td className="p-2 text-right font-semibold">{activity.pertEstimate.toFixed(1)}j</td>
                              <td className="p-2 text-right">{activity.standardDeviation.toFixed(2)}j</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {pertAnalysis.activities.length > 10 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Affichage de 10 activités sur {pertAnalysis.activities.length}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Chargement de l'analyse PERT...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Rapports et analyses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReportManager 
            data={{ project }}
            reportType="project"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetailByDTO;