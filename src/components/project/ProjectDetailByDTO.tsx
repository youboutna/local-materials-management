import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ProjectDataTransformer } from '@/services/projectDataTransformer';
import { ReportManager } from '@/components/reports/ReportManager';
import FinancialOverview from '@/components/project/FinaancialOverview';
import PhaseList from '@/components/project/PhaseList';
import RiskOverview from '@/components/project/RiskOverview';
import TaskList from '@/components/project/TaskList';
import TeamOverview from '@/components/project/TeamOverview';
import InteractiveMapGIS from '@/components/materials/InteractiveMapGIS';
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch project data using ProjectDataTransformer
  const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ['project-dto', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('ID du projet manquant');
      const result = await ProjectDataTransformer.getProjectById(projectId);
      if (!result) throw new Error('Projet non trouvé');
      return result;
    },
    enabled: !!projectId,
    retry: 1,
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

  // Prepare data for components
  const [tasks, setTasks] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  // Transform project data when loaded and fetch additional data
  useEffect(() => {
    if (project && projectId) {
      fetchAdditionalData();
    }
  }, [project, projectId]);

  const fetchAdditionalData = async () => {
    if (!project || !projectId) return;

    try {
      // Extract tasks from phases with real data structure
      const allTasks = project.plannedPhases?.flatMap((phase: any) => {
        // Use the actual phase data structure from ProjectDataTransformer
        const phaseData = phase.customPhaseData || {};
        const stages = phaseData.stages || phase.stages || [];
        
        return stages.map((stage: any, index: number) => ({
          id: `${phase.id}-task-${index}`,
          name: stage.name || stage.stage || `Tâche ${index + 1}`,
          description: stage.description || `Tâche de la phase ${phase.constructionPhase}`,
          status: stage.status || 'not_started',
          progress: stage.progress || 0,
          startDate: phase.startDate,
          endDate: phase.endDate,
          assignedTo: stage.assignedTo || [],
          dependencies: stage.dependencies || []
        }));
      }) || [];
      setTasks(allTasks);

      // Fetch risks from the database or project data
      const projectRisks = project.risks || [];
      if (projectRisks.length === 0) {
        // If no risks in project data, try to fetch from database
        try {
          const { data: riskData } = await supabase
            .from('project_phases')
            .select('risk_factors')
            .eq('project_id', projectId);
          
          const combinedRisks = riskData?.flatMap((phase: any) => 
            phase.risk_factors || []
          ) || [];
          setRisks(combinedRisks);
        } catch (error) {
          console.log('No risks table, using empty risks');
          setRisks([]);
        }
      } else {
        setRisks(projectRisks);
      }

      // Extract resources from project phases and materials
      const phaseResources = project.plannedPhases?.flatMap((phase: any) => {
        const phaseData = phase.customPhaseData || {};
        const materials = phaseData.materials || [];
        const humanResources = phaseData.humanResources || [];

        const materialResources = materials.map((material: any, index: number) => ({
          id: `material-${phase.id}-${index}`,
          name: material.name || material.materialId,
          type: 'material',
          costPerHour: material.pricePerUnit || 0,
          availability: 100,
          quantity: material.quantity
        }));

        const humanResourcesList = humanResources.map((resource: any, index: number) => ({
          id: `human-${phase.id}-${index}`,
          name: resource.name || resource.employeeId,
          type: 'human',
          position: resource.role || 'Worker',
          costPerHour: resource.dailyRate || 0,
          availability: resource.availability || 100
        }));

        return [...materialResources, ...humanResourcesList];
      }) || [];

      setResources(phaseResources);
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

  if (projectLoading || loading) {
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
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <p className="text-muted-foreground mt-2">{project.description}</p>
          <div className="flex items-center gap-4 mt-4">
            <Badge variant={project.status === 'terminé' ? 'default' : 'secondary'} className={getStatusColor(project.status)}>
              {getStatusIcon(project.status)}
              {project.status}
            </Badge>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{project.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">{project.teamSize} membres</span>
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
              Dépensé: {((project as any).spent || 0).toLocaleString()} MRU
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phases</p>
                <p className="text-2xl font-bold">{project.plannedPhases?.length || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {project.plannedPhases?.filter((p: any) => p.status === 'completed').length || 0} terminées
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
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="financial">Financier</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="risks">Risques</TabsTrigger>
          <TabsTrigger value="resources">Ressources</TabsTrigger>
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
                  <Badge variant="outline">{project.methodology || 'Standard'}</Badge>
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
                      {project.plannedPhases?.reduce((total: number, phase: any) => 
                        total + (phase.materials?.length || 0), 0) || 0}
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
                      {project.plannedPhases?.reduce((total: number, phase: any) => 
                        total + (phase.stages?.length || 0), 0) || 0}
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
            spent={(project as any).spent || 0}
            phases={project.plannedPhases || []}
            financialMetrics={(project as any).financialMetrics}
          />
        </TabsContent>

        <TabsContent value="phases" className="mt-6">
          <PhaseList phases={project.plannedPhases || []} projectId={projectId!} />
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