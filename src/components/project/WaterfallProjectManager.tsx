import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  BarChart3, 
  Target,
  Clock,
  CheckCircle2,
  DollarSign,
  MapPin,
  User,
  Building,
  AlertCircle
} from 'lucide-react';
import WaterfallGanttChart from './WaterfallGanttChart';
import WaterfallProjectKPIs from './WaterfallProjectKPIs';
import { useProjects } from '@/hooks/projects/useProjects';
import { supabase } from '@/integrations/supabase/client';
import { EscalationRoles,ActionLabels, ProjectData } from '@/types/project';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ProjectManagerProvider } from '@/components/project/ProjectManagerProvider';

// Define default roles (adjust based on your actual role structure use )
//@TODO use position and hierachy from template   of Organization
const defaultRoles: EscalationRoles = {
  level1: 'Chef de projet',
  level2: 'Directeur Technique',
  level3: 'DG',
  level4: 'Comité juridique'
};

const actionLabels: ActionLabels = {
  task_assignment: 'Assigner une tâche',
  hierarchy_notification: 'Notifier la hiérarchie',
  sms: 'Envoyer SMS',
  call: 'Programmer appel',
  email: 'Envoyer email',
  mail: 'Courrier postal',
  export_receipt: 'Exporter reçu',
  blockchain_verification: 'Vérification blockchain',
  document_upload: 'Uploader document',
  meeting_schedule: 'Planifier réunion',
  financial_review: 'Revue financière',
  legal_consultation: 'Consultation juridique',
};

const WaterfallProjectManager = () => {
  const [activeTab, setActiveTab] = useState('gantt');
  const { projects, loading } = useProjects();
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [phases, setPhases] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    schedulePerformanceIndex: 1,
    costPerformanceIndex: 1,
    earnedValue: 0,
    plannedValue: 0,
    actualCost: 0,
    budgetAtCompletion: 0,
    estimateAtCompletion: 0,
    estimateToComplete: 0,
    varianceAtCompletion: 0
  });

  // Sélectionner automatiquement le premier projet au chargement
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject]);

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!selectedProject) return;

      try {
        // Récupérer les phases spécifiques au projet sélectionné
        const { data: phasesData } = await supabase
          .from('project_phases')
          .select('*')
          .eq('project_id', selectedProject.id);

        // Récupérer les jalons spécifiques au projet sélectionné
        const { data: milestonesData } = await supabase
          .from('project_milestones')
          .select('*')
          .eq('project_id', selectedProject.id);

        if (phasesData) {
          setPhases(phasesData.map(p => ({
            id: p.id,
            name: p.phase_name,
            plannedProgress: 0,
            actualProgress: p.progress || 0,
            budget: p.estimated_cost || 0,
            actualCost: p.actual_cost || 0,
            startDate: p.start_date,
            endDate: p.end_date,
            status: p.status,
            procurementStep: '',
            projectId: p.project_id
          })));
        }

        if (milestonesData) {
          setMilestones(milestonesData.map(m => ({
            id: m.id,
            title: m.title,
            targetDate: m.target_date,
            completedDate: m.completion_date,
            status: m.status,
            projectId: m.project_id,
            phase: '',
            stage: ''
          })));
        }

        // Calcul des métriques EVM à partir des phases
        if (phasesData && phasesData.length > 0) {
          const earnedValue = phasesData.reduce((sum, p) => sum + ((p.progress || 0) / 100) * (p.estimated_cost || 0), 0);
          const plannedValue = phasesData.reduce((sum, p) => sum + (0 / 100) * (p.estimated_cost || 0), 0);
          const actualCost = phasesData.reduce((sum, p) => sum + (p.actual_cost || 0), 0);
          const budgetAtCompletion = selectedProject.budget || phasesData.reduce((sum, p) => sum + (p.estimated_cost || 0), 0);

          setMetrics({
            schedulePerformanceIndex: plannedValue > 0 ? earnedValue / plannedValue : 1,
            costPerformanceIndex: actualCost > 0 ? earnedValue / actualCost : 1,
            earnedValue,
            plannedValue,
            actualCost,
            budgetAtCompletion,
            estimateAtCompletion: actualCost + (budgetAtCompletion - earnedValue),
            estimateToComplete: budgetAtCompletion - earnedValue,
            varianceAtCompletion: budgetAtCompletion - (actualCost + (budgetAtCompletion - earnedValue))
          });
        }

      } catch (err) {
        console.error('Erreur lors du fetch phases/milestones', err);
      }
    };

    fetchProjectData();
  }, [selectedProject]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">Chargement des projets...</div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">Aucun projet disponible</p>
          <p className="text-muted-foreground">Aucun projet n'a été trouvé dans la base de données.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête avec sélecteur de projet */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Méthodologie cascade avec diagramme de Gantt et workflow des marchés publics mauritaniens
            </p>
          </div>
          
          <select 
            value={selectedProject.id} 
            onChange={(e) => setSelectedProject(projects.find(p => p.id === e.target.value) || null)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>

        {/* Informations du projet sélectionné */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Projet
                  </p>
                  <p className="text-sm font-bold truncate">{selectedProject.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Localisation
                  </p>
                  <p className="text-sm font-bold">{selectedProject.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Équipe
                  </p>
                  <p className="text-sm font-bold">{selectedProject.teamSize} personnes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Budget
                  </p>
                  <p className="text-sm font-bold">{(selectedProject.budget / 1000000).toFixed(1)}M MRU</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métriques de performance */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Progression
                  </p>
                  <p className="text-2xl font-bold">{selectedProject.progress}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Phases Terminées
                  </p>
                  <p className="text-2xl font-bold">{phases.filter(p => p.status === 'completed').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    SPI
                  </p>
                  <p className="text-2xl font-bold">{metrics.schedulePerformanceIndex.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    CPI
                  </p>
                  <p className="text-2xl font-bold">{metrics.costPerformanceIndex.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wrap the tabs with ProjectManagerProvider */}
        <ProjectManagerProvider project={selectedProject} roles={defaultRoles}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="gantt" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Gantt & KPIs
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Analytics EVM
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gantt" className="space-y-4">
              <WaterfallGanttChart 
                tasks={phases.map(p => ({
                  id: p.id,
                  name: p.name,
                  startDate: new Date(p.startDate),
                  endDate: new Date(p.endDate),
                  progress: p.actualProgress,
                  phase: p.name,
                  status: p.status,
                  procurementStep: 1,
                  assignedTo: '',
                  budget: p.budget
                }))}
                projectStartDate={new Date(Math.min(...phases.map(p => new Date(p.startDate).getTime())))}
                projectEndDate={new Date(Math.max(...phases.map(p => new Date(p.endDate).getTime())))}
                ProjectTitle={selectedProject.title}
                ProjectDescription={selectedProject.description}
                ProjectLocation={selectedProject.location}
                ProjectStatus={selectedProject.status}
                ProjectProgress={selectedProject.progress}
                projectBudget={selectedProject.budget}
                ProjectTeamSize={selectedProject.teamSize}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <ErrorBoundary fallback={
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="text-lg font-medium text-red-800">Erreur de chargement</h3>
                  <p className="text-red-600">Impossible de charger les indicateurs de performance.</p>
                </div>
              }>
                <WaterfallProjectKPIs
                  projectData={selectedProject}
                  roles={defaultRoles}
                  actions={actionLabels}
                  projectTitle={selectedProject.title}
                  projectBudget={selectedProject.budget}
                />
              </ErrorBoundary>
            </TabsContent>
          </Tabs>
        </ProjectManagerProvider>
      </div>
    </div>
  );
};

export default WaterfallProjectManager;