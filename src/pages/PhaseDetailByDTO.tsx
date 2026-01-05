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
import PhaseMaterials from '@/components/project/PhaseMaterials';
import PhaseEmployees from '@/components/project/PhaseEmployees';
import PhaseDocuments from '@/components/project/PhaseDocuments';
import UnifiedPhaseWorkflow from '@/components/project/monitoring/UnifiedPhaseWorkflow';
import { ProjectDataTransformer } from '@/services/projectDataTransformer';
import { MilestoneService } from '@/services/MilestoneService';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Users, 
  Package, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  TrendingUp,
  Target,
  Layers
} from 'lucide-react';

const PhaseDetailByDTO: React.FC = () => {
  const { projectId, phaseId } = useParams<{ projectId: string; phaseId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [phase, setPhase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actualCost, setActualCost] = useState<number>(0);
  const [materialsCount, setMaterialsCount] = useState<number>(0);
  const [employeesCount, setEmployeesCount] = useState<number>(0);

  // Fetch project data using React Query
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      return await ProjectDataTransformer.getProjectById(projectId);
    },
    enabled: !!projectId,
  });

  // Milestone progress for phase
  const { data: milestoneProgress } = useQuery({
    queryKey: ['phase-milestone-progress', projectId, phaseId],
    queryFn: async () => {
      if (!projectId || !phaseId) return null;
      return await MilestoneService.getMilestoneProgress(projectId, phaseId);
    },
    enabled: !!projectId && !!phaseId,
  });

  // Calculate phase metrics when project data is loaded
  useEffect(() => {
    const calculatePhaseMetrics = async () => {
      if (!projectId || !phaseId || !project) return;
      
      try {
        // Find the specific phase
        const foundPhase = project.plannedPhases?.find((p: any) => p.id === phaseId);
        if (foundPhase) {
          setPhase(foundPhase);
          
          // Calculate actual cost from materials
          const materialCost = (foundPhase as any).materials?.reduce((sum: number, material: any) => 
            sum + (material.quantity * (material.pricePerUnit || 0)), 0) || 0;
          
          // Calculate cost from employees
          const employeeCost = (foundPhase as any).humanResources?.reduce((sum: number, emp: any) => {
            const dailyRate = emp.dailyRate || 0;
            const startDate = emp.startDate ? new Date(emp.startDate) : null;
            const endDate = emp.endDate ? new Date(emp.endDate) : null;
            
            if (startDate && endDate) {
              const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return sum + (dailyRate * diffDays);
            }
            return sum;
          }, 0) || 0;

          setActualCost(materialCost + employeeCost);
          setMaterialsCount((foundPhase as any).materials?.length || 0);
          setEmployeesCount((foundPhase as any).humanResources?.length || 0);
        } else {
          toast({
            title: "Erreur",
            description: "Phase non trouvée",
            variant: "destructive",
          });
          navigate(`/projects/${projectId}`);
        }
      } catch (error) {
        console.error('Error calculating phase metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (project && !projectLoading) {
      calculatePhaseMetrics();
    }
  }, [project, projectId, phaseId, navigate, projectLoading]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'delayed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (projectLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!phase) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Phase non trouvée</h1>
          <Button onClick={() => navigate(`/projects/${projectId}`)}>
            Retour au projet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/projects/${projectId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au projet
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{phase.phase}</h1>
            <p className="text-muted-foreground mt-1">{phase.description}</p>
          </div>
        </div>
        <Badge className={`${getStatusColor(phase.status)} flex items-center gap-1`}>
          {getStatusIcon(phase.status)}
          {phase.status === 'completed' ? 'Terminée' : 
           phase.status === 'in_progress' ? 'En cours' : 
           phase.status === 'delayed' ? 'En retard' : 'Non commencée'}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progression</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{phase.progress || 0}%</div>
            <Progress value={phase.progress || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget estimé</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {phase.budget?.toLocaleString() || 0} MRU
            </div>
            <p className="text-xs text-muted-foreground">
              Coût réel: {actualCost.toLocaleString()} MRU
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durée</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{phase.estimatedDuration} jours</div>
            <p className="text-xs text-muted-foreground">
              {phase.startDate} → {phase.endDate}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Localisation</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{phase.location || 'Non spécifiée'}</div>
            {phase.notes && (
              <p className="text-xs text-muted-foreground mt-1">{phase.notes}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="workflow">
            <Target className="h-4 w-4 mr-1" />
            Suivi & Étapes
          </TabsTrigger>
          <TabsTrigger value="materials">Matériaux</TabsTrigger>
          <TabsTrigger value="team">Équipe</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Layers className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Étapes</p>
                    <p className="text-lg font-bold">{phase.stages?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Jalons</p>
                    <p className="text-lg font-bold">{milestoneProgress?.total_milestones || 0}</p>
                    {milestoneProgress && milestoneProgress.total_milestones > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {milestoneProgress.completed_milestones} terminés
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-orange-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Matériaux</p>
                    <p className="text-lg font-bold">{materialsCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-purple-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Équipe</p>
                    <p className="text-lg font-bold">{employeesCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Phase Status Integration */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Statut de la phase</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <Badge className={getStatusColor(phase.status)}>
                  {getStatusIcon(phase.status)} {phase.status === 'completed' ? 'Terminée' : 
                   phase.status === 'in_progress' ? 'En cours' : 
                   phase.status === 'delayed' ? 'En retard' : 'Non commencée'}
                </Badge>
                <div className="flex-1 min-w-48">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progression</span>
                    <span className="font-medium">{phase.progress || 0}%</span>
                  </div>
                  <Progress value={phase.progress || 0} />
                </div>
                {milestoneProgress?.schedule_performance_index !== undefined && (
                  <Badge variant={milestoneProgress.schedule_performance_index >= 1 ? 'default' : 'destructive'}>
                    SPI: {milestoneProgress.schedule_performance_index}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Materials Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Matériaux requis ({materialsCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {phase.materials?.slice(0, 3).map((material: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{material.name || `Matériau ${material.materialId}`}</span>
                      <Badge variant="outline">{material.quantity}</Badge>
                    </div>
                  ))}
                  {phase.materials && phase.materials.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{phase.materials.length - 3} autres matériaux
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Ressources humaines ({employeesCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {phase.humanResources?.slice(0, 3).map((resource: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{resource.name || resource.role || `Rôle ${resource.employeeId}`}</span>
                      <Badge variant="outline">{resource.dailyRate ? `${resource.dailyRate} MRU/jour` : 'N/A'}</Badge>
                    </div>
                  ))}
                  {phase.humanResources && phase.humanResources.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{phase.humanResources.length - 3} autres ressources
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Unified Workflow Tab - Merges Stages and Monitoring */}
        <TabsContent value="workflow" className="space-y-6">
          <UnifiedPhaseWorkflow
            projectId={projectId!}
            phaseId={phaseId!}
            phaseName={phase.phase || phase.phase_name || 'Phase'}
            stages={phase.stages?.map((stage: any, index: number) => ({
              id: stage.id || `stage-${index}`,
              name: stage.name,
              description: stage.description,
              status: stage.status || 'pending',
              progress: stage.progress || 0
            })) || []}
            phaseProgress={phase.progress || 0}
            phaseBudget={phase.budget || 0}
          />
        </TabsContent>
        
        <TabsContent value="materials">
          <PhaseMaterials phaseId={phaseId!} projectId={projectId!} />
        </TabsContent>

        <TabsContent value="team">
          <PhaseEmployees phaseId={phaseId!} />
        </TabsContent>

        <TabsContent value="documents">
          <PhaseDocuments phaseId={phaseId!} projectId={projectId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PhaseDetailByDTO;