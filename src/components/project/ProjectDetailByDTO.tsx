import React, { useState, useEffect, useMemo } from 'react';
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

  // Fetch detailed project data (includes plannedPhases, tasks, etc.)
  const { data: projectDetail } = useQuery({
    queryKey: ['project-detail', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      return await projectService.getProjectDetail(projectId);
    },
    enabled: !!projectId,
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

  // Fetch task assignments for this project
  const { data: taskAssignmentsData = [] } = useQuery({
    queryKey: ['project-task-assignments', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('project_id', projectId);
      if (error) return [];
      return data || [];
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  // Fetch employees for resource mapping
  const { data: employeesData = [] } = useQuery({
    queryKey: ['employees-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, position')
        .eq('is_active', true);
      if (error) return [];
      return data || [];
    },
    staleTime: 60_000,
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

  // Consolidated phases source from detail DTO or direct query
  const phasesSource: any[] = (projectDetail?.plannedPhases as any[]) || (phasesData as any[]) || [];

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

  // Prepare data for components
  const [tasks, setTasks] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  // Transform project data when loaded and fetch additional data
  useEffect(() => {
    if (project && projectId) {
      fetchAdditionalData();
    }
  }, [project, projectId, phasesData, risksData, projectDetail, taskAssignmentsData, employeesData]);

  const fetchAdditionalData = async () => {
    if (!project || !projectId) return;

    try {
      // Create tasks from phases data
      const allTasks = (phasesSource || []).flatMap((phase: any) => {
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
          assignedTo: Array.isArray(stage.assignedTo) ? stage.assignedTo : [],
          dependencies: Array.isArray(phase.dependencies) ? phase.dependencies : [],
        }));
      });
      setTasks(allTasks);

      // Use risks from database - transform to expected format
      const transformedRisks = (risksData || []).map((risk: any) => ({
        id: risk.id,
        title: risk.risk_title || 'Risque non nommé',
        description: risk.risk_description || '',
        probability: parseInt(risk.probability) || 0,
        impact: parseInt(risk.impact) || 0,
        mitigationPlan: risk.mitigation_strategy || '',
        status: risk.status || 'identified',
        createdAt: risk.created_at,
        created_at: risk.created_at,
        relatedTasks: []
      }));
      setRisks(transformedRisks);

      // Get project manager from project data
      const projectManagerResources: any[] = [];
      if (projectDetail?.projectResponsableId) {
        const projectManager = employeesData?.find(emp => emp.id === projectDetail.projectResponsableId);
        if (projectManager) {
          projectManagerResources.push({
            id: `manager-${projectManager.id}`,
            name: projectManager.full_name,
            type: 'human',
            position: 'Chef de projet',
            costPerHour: 0,
            availability: 100,
          });
        }
      }

      // Get assigned employees from task assignments
      const taskAssignedEmployees: any[] = [];
      if (taskAssignmentsData && Array.isArray(taskAssignmentsData)) {
        const assignedEmployeeIds = [...new Set(
          taskAssignmentsData
            .filter(task => task.project_id === projectId && task.assigned_to)
            .map(task => task.assigned_to)
        )];
        
        assignedEmployeeIds.forEach(employeeId => {
          const employee = employeesData?.find(emp => emp.id === employeeId);
          if (employee && !projectManagerResources.find(r => r.id === `manager-${employee.id}`)) {
            taskAssignedEmployees.push({
              id: `assigned-${employee.id}`,
              name: employee.full_name,
              type: 'human',
              position: employee.position || 'Employé assigné',
              costPerHour: 0,
              availability: 100,
            });
          }
        });
      }

      // Get contractors and consultants
      const contractorResources: any[] = [];
      if (projectDetail?.mainContractor) {
        contractorResources.push({
          id: `contractor-main`,
          name: projectDetail.mainContractor,
          type: 'human',
          position: 'Contractant principal',
          costPerHour: 0,
          availability: 100,
        });
      }
      if ((projectDetail as any)?.engineering_consultant) {
        contractorResources.push({
          id: `consultant-engineering`,
          name: (projectDetail as any).engineering_consultant,
          type: 'human',
          position: 'Bureau d\'études',
          costPerHour: 0,
          availability: 100,
        });
      }

      // Extract materials from phases
      const materialResources = (phasesSource || []).flatMap((phase: any) => {
        const milestones = phase.milestones || {};
        const materials = milestones.materials || phase.materials || [];
        
        return (Array.isArray(materials) ? materials : []).map((material: any, index: number) => ({
          id: `material-${phase.id}-${index}`,
          name: material.name || material.materialId || `Matériau ${index + 1}`,
          type: 'material',
          costPerHour: material.pricePerUnit || material.costPerHour || 0,
          availability: material.availability || 100,
          quantity: material.quantity || 1,
        }));
      });

      const allResources = [
        ...projectManagerResources,
        ...taskAssignedEmployees,
        ...contractorResources,
        ...materialResources,
      ];

      setResources(allResources);
      console.debug('📊 ProjectDetailByDTO data:', {
        phasesCount: (phasesSource || []).length,
        tasksCount: allTasks.length,
        resourcesCount: allResources.length,
        risksCount: transformedRisks.length,
        materialResourcesCount: materialResources.length,
      });
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Indice Performance Coût</p>
                    <p className="text-2xl font-bold">0.95</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  CPI (Cost Performance Index)
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Indice Performance Planning</p>
                    <p className="text-2xl font-bold">0.92</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  SPI (Schedule Performance Index)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Incidents Sécurité</p>
                    <p className="text-2xl font-bold">2</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total incidents HSE
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Émissions CO2</p>
                    <p className="text-2xl font-bold">12.5k</p>
                  </div>
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Tonnes CO2 équivalent
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Conformité réglementaire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Permis de construire</h4>
                        <p className="text-sm text-muted-foreground">Ministère Habitat</p>
                        <p className="text-sm text-muted-foreground">Émis le: 10/05/2021</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Valide</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Audit environnemental</h4>
                        <p className="text-sm text-muted-foreground">Agence Environnement</p>
                        <p className="text-sm text-muted-foreground">Complété le: 12/11/2022</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Complété</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Plans HSE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Plan prévention accidents</h4>
                        <p className="text-sm text-muted-foreground">Dernière révision: 01/08/2023</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Actif</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Plan gestion déchets chantier</h4>
                        <p className="text-sm text-muted-foreground">Dernière révision: 01/08/2023</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Actif</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Parties prenantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Ministère de l'Énergie</h4>
                        <p className="text-sm text-muted-foreground">Autorité contractante</p>
                      </div>
                      <Badge variant="destructive">Haute influence</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Communes locales</h4>
                        <p className="text-sm text-muted-foreground">Population impactée</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Influence moyenne</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">ONG environnementale</h4>
                        <p className="text-sm text-muted-foreground">Observateur</p>
                      </div>
                      <Badge variant="outline">Faible influence</Badge>
                    </div>
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
              {calculations?.pertAnalysis ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Durée attendue totale</p>
                    <p className="text-2xl font-bold">{calculations.pertAnalysis.totalExpectedDuration.toFixed(1)} j</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Écart-type total</p>
                    <p className="text-2xl font-bold">
                      {calculations.pertAnalysis.variances 
                        ? Math.sqrt(Object.values(calculations.pertAnalysis.variances).reduce((sum, variance) => sum + variance, 0)).toFixed(1)
                        : '0.0'}
                    </p>
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