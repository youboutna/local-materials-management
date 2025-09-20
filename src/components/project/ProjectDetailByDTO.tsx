import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ProjectService } from '@/services/ProjectService';
import { ProjectSummaryDTO } from '@/types/dto';
import { ReportManager } from '@/components/reports/ReportManager';
import FinancialOverview from '@/components/project/FinaancialOverview';
import PhaseList from '@/components/project/PhaseList';
import RiskOverview from '@/components/project/RiskOverview';
import TaskList from '@/components/project/TaskList';
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
  BarChart3
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
  const [activeTab, setActiveTab] = useState('overview');
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

  // Fetch payments data
  const { data: payments = [] } = useQuery({
    queryKey: ['project-payments', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) {
        console.error('Error fetching payments:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch risks data (DB entity), used for risks tab and overview
  const { data: risksData = [] } = useQuery({
    queryKey: ['project-risks', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_risks')
        .select('*')
        .eq('project_id', projectId);
      if (error) return [];
      return data || [];
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  // Fetch stakeholders (user roles as proxy)
  const { data: stakeholders = [] } = useQuery({
    queryKey: ['project-stakeholders', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role_name');
      if (error) return [];
      return data || [];
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  // Fetch phases data (used for counts and phases tab)
  const { data: phasesData = [] } = useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('phase_order', { ascending: true });
      if (error) return [];
      return data || [];
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  // Calculations (PERT, Gantt)
  const { data: calculations } = useQuery({
    queryKey: ['project-calculations', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      return await projectService.getProjectCalculations(projectId);
    },
    enabled: !!projectId && (activeTab === 'gantt' || activeTab === 'pert'),
    staleTime: 30_000,
  });

  // Prepare data for components
  const [tasks, setTasks] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  // Transform project data when loaded and fetch additional data
  useEffect(() => {
    if (project && projectId) {
      fetchAdditionalData();
    }
  }, [project, projectId, phasesData, risksData, stakeholders]);

  const fetchAdditionalData = async () => {
    if (!project || !projectId) return;

    try {
      // Create tasks from phases data
      const allTasks = (phasesData || []).flatMap((phase: any) => {
        const milestones = phase.milestones || {};
        const stages = Array.isArray(phase.stages) && phase.stages.length > 0
          ? phase.stages
          : [
              {
                name: `${phase.phase_name || phase.phase || phase.construction_stage || 'Phase'} - ${phase.construction_stage || 'Étape'}`,
                description: phase.description,
                status: phase.status || 'not_started',
                progress: phase.progress || 0,
                startDate: phase.start_date || phase.startDate,
                endDate: phase.end_date || phase.endDate,
              },
            ];

        return stages.map((stage: any, index: number) => ({
          id: `${phase.id}-task-${index}`,
          name: stage.name,
          description: stage.description,
          status: stage.status || 'not_started',
          progress: stage.progress || 0,
          startDate: stage.startDate || phase.start_date,
          endDate: stage.endDate || phase.end_date,
          assignedTo: [],
          dependencies: phase.dependencies || [],
        }));
      });
      setTasks(allTasks);

      // Use risks from database
      setRisks(risksData || []);

      // Extract resources from phases
      const phaseResources = (phasesData || []).flatMap((phase: any) => {
        const milestones = phase.milestones || {};
        const materials = milestones.materials || phase.materials || [];
        const humanResources = milestones.humanResources || phase.human_resources || [];

        const materialResources = (materials || []).map((material: any, index: number) => ({
          id: `material-${phase.id}-${index}`,
          name: material.name || material.materialId || `Matériau ${index + 1}`,
          type: 'material',
          costPerHour: material.pricePerUnit || material.costPerHour || 0,
          availability: material.availability || 100,
          quantity: material.quantity || 1,
        }));

        const humanResourcesList = (humanResources || []).map((resource: any, index: number) => ({
          id: `human-${phase.id}-${index}`,
          name: resource.name || resource.employeeId || `Employé ${index + 1}`,
          type: 'human',
          position: resource.role || resource.position || 'Worker',
          costPerHour: resource.dailyRate || resource.costPerHour || 0,
          availability: resource.availability || 100,
        }));

        return [...materialResources, ...humanResourcesList];
      });

      // Map stakeholders to human resources (fallback names as role)
      const stakeholderResources = (stakeholders || []).map((s: any, idx: number) => ({
        id: `stakeholder-${idx}`,
        name: s.role_name || 'Stakeholder',
        type: 'human',
        position: s.role_name,
        costPerHour: 0,
        availability: 100,
      }));

      setResources([...(phaseResources || []), ...stakeholderResources]);
    } catch (error) {
      console.error('Error fetching additional data:', error);
    }
  };

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
                <p className="text-2xl font-bold">{project.progress}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <Progress value={project.progress} className="mt-2" />
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
                <p className="text-2xl font-bold">{phasesData?.length || project.phasesCount || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {phasesData?.filter((p: any) => p.status === 'completed').length || 0} terminées
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
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="financial">Financier</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="risks">Risques</TabsTrigger>
          <TabsTrigger value="resources">Ressources</TabsTrigger>
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
                <Progress value={project.progress} className="mt-4" />
                <p className="text-xs text-center text-muted-foreground">
                  Progression globale: {project.progress}%
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
                      {phasesData?.reduce((total: number, phase: any) => {
                        const milestones = phase.milestones || {};
                        const extra = Array.isArray(phase.materials) ? phase.materials.length : 0;
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
                      {phasesData?.length || 0}
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
                    <p className="text-lg font-bold">0</p>
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
            phases={phasesData || []}
            financialMetrics={{}}
          />
        </TabsContent>

        <TabsContent value="phases" className="mt-6">
          <PhaseList phases={(phasesData || []).map((phase: any) => ({
            id: phase.id,
            phase: phase.phase_name || phase.phase || phase.construction_stage || 'Phase',
            status: phase.status || 'planned',
            progress: phase.progress || 0,
            startDate: phase.start_date || phase.startDate,
            endDate: phase.end_date || phase.endDate,
            stages: Array.isArray(phase.stages) ? phase.stages : (phase.construction_stage ? [{ name: phase.construction_stage, status: phase.status }] : [])
          }))} projectId={projectId!} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <TaskList tasks={tasks} projectId={projectId!} />
        </TabsContent>

        <TabsContent value="risks" className="mt-6">
          <RiskOverview risks={risks} projectId={projectId!} />
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <TeamOverview resources={resources} projectId={projectId!} />
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <InteractiveMapGIS
            title="Localisation du projet"
            description="Carte interactive avec outils GIS"
            allowPolygon={true}
            value={{
              coordinates: project.coordinates ? {
                lat: (project.coordinates as any).latitude || (project.coordinates as any).lat,
                lng: (project.coordinates as any).longitude || (project.coordinates as any).lng
              } : undefined,
              address: project.location,
              shape: (project as any).shape
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
            phases={(phasesData || []).map((p: any) => ({
              id: p.id,
              name: p.phase_name || p.phase || p.construction_stage || 'Phase',
              startDate: new Date(p.start_date || p.startDate || new Date()),
              endDate: new Date(p.end_date || p.endDate || new Date()),
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
              {calculations?.pertAnalysis ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Durée attendue totale</p>
                    <p className="text-2xl font-bold">{calculations.pertAnalysis.totalExpectedDuration.toFixed(1)} j</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Écart-type total</p>
                    <p className="text-2xl font-bold">{(calculations.pertAnalysis.totalStdDeviation || 0).toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tâches sur chemin critique</p>
                    <p className="text-2xl font-bold">{calculations.pertAnalysis.criticalPath?.length || 0}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Sélectionnez l'onglet PERT pour charger l'analyse.</p>
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