// ============================================================
// src/components/project/WaterfallProjectManager.tsx
// ============================================================
/**
 * WaterfallProjectManager
 * -----------------------
 * Hexagonal: hydrate phases/milestones via hooks hex (`usePhasesHex`,
 * `useMilestonesHex`). Aucun appel direct Supabase. Le `ProjectManagerProvider`
 * conserve son contrat existant via cast structurel.
 * 
 * Updated to use AlertService and ProjectManagerProvider
 */

import ErrorBoundary from '@/components/ErrorBoundary';
import { ProjectManagerProvider } from '@/components/project/ProjectManagerProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePhasesHex } from '@/hooks/hexagonal/usePhasesHex';
import { useProjects } from '@/hooks/projects/useProjects';
import { ProjectMetricsOrchestrator } from '@/application/services/ProjectMetricsOrchestrator';
import { ProjectGanttTimeline } from '@/components/project/ProjectGanttTimeline';
import {
    AlertCircle,
    BarChart3,
    Building,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    MapPin,
    Target,
    User,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import WaterfallGanttChart from './WaterfallGanttChart';

// ============================================================
// Types
// ============================================================
interface PhaseData {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  actualProgress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  budget: number;
  actualCost: number;
}

interface ProjectMetrics {
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
  totalPhases: number;
  completedPhases: number;
  inProgressPhases: number;
  notStartedPhases: number;
}

// ============================================================
// Rôles et labels (shape conservée pour le provider)
// ============================================================
const defaultRoles = {
  level1: 'Chef de projet',
  level2: 'Directeur Technique',
  level3: 'DG',
  level4: 'Comité juridique',
} as const;

const actionLabels = {
  budget: 'Budget',
  timeline: 'Calendrier',
  quality: 'Qualité',
  resource: 'Ressources',
  risk: 'Risques',
  compliance: 'Conformité',
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

// ============================================================
// Composant principal
// ============================================================
const WaterfallProjectManager = () => {
  const [activeTab, setActiveTab] = useState('gantt');
  const { projects, isLoading: loading } = useProjects();
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Sélectionner le premier projet
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject]);

  // Récupérer les phases via le hook hexagonal
  const { phases: phasesEntities, isLoading: phasesLoading } = usePhasesHex(selectedProject?.id);

  // Transformer les phases pour l'UI
  const phases = useMemo<PhaseData[]>(
    () =>
      phasesEntities.map((p: any) => ({
        id: p.id,
        title: p.phaseName ?? p.name ?? 'Phase',
        startDate: p.startDate ?? '',
        endDate: p.endDate ?? '',
        actualProgress: p.progress ?? 0,
        status: p.status ?? 'not_started',
        budget: p.estimatedCost ?? 0,
        actualCost: p.actualCost ?? 0,
      })),
    [phasesEntities]
  );

  // Calculer les métriques
  const metrics = useMemo<ProjectMetrics>(() => {
    if (!phases.length) {
      return {
        schedulePerformanceIndex: 1,
        costPerformanceIndex: 1,
        totalPhases: 0,
        completedPhases: 0,
        inProgressPhases: 0,
        notStartedPhases: 0,
      };
    }

    const earnedValue = phases.reduce(
      (sum, p) => sum + ((p.actualProgress || 0) / 100) * (p.budget || 0),
      0
    );
    const actualCost = phases.reduce((sum, p) => sum + (p.actualCost || 0), 0);
    
    const completedPhases = phases.filter(p => p.status === 'completed').length;
    const inProgressPhases = phases.filter(p => p.status === 'in_progress').length;
    const notStartedPhases = phases.filter(p => p.status === 'not_started').length;

    return {
      schedulePerformanceIndex: 1,
      costPerformanceIndex: actualCost > 0 ? earnedValue / actualCost : 1,
      totalPhases: phases.length,
      completedPhases,
      inProgressPhases,
      notStartedPhases,
    };
  }, [phases]);

  // Modèle Gantt UNIQUE, alimenté par l'orchestrateur (GanttModel)
  const ganttModel = useMemo(
    () =>
      ProjectMetricsOrchestrator.compute({
        project: {
          id: selectedProject?.id,
          title: selectedProject?.title,
          budget: selectedProject?.budget,
          progress: selectedProject?.progress,
          startDate: selectedProject?.startDate,
          endDate: selectedProject?.endDate,
        },
        phases: phases.map((p) => ({
          id: p.id,
          name: p.title,
          startDate: p.startDate,
          endDate: p.endDate,
          progress: p.actualProgress,
          status: p.status,
          budget: p.budget,
          actualCost: p.actualCost,
        })),
      }).gantt,
    [selectedProject, phases]
  );

  // ============================================================
  // Fonctions utilitaires
  // ============================================================
  const parseDate = useCallback((value: any): Date | null => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, []);

  // ============================================================
  // États de chargement
  // ============================================================
  if (loading || phasesLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des projets...</p>
        </div>
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

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête avec sélecteur de projet */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gestion de Projet en Cascade</h1>
            <p className="text-muted-foreground">
              Méthodologie cascade avec diagramme de Gantt et workflow des marchés publics mauritaniens
            </p>
          </div>
          
          <select 
            value={selectedProject.id} 
            onChange={(e) => setSelectedProject(projects.find(p => p.id === e.target.value) || null)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[200px]"
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>

        {/* Informations du projet sélectionné */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <p className="text-sm font-bold">{selectedProject.location || 'Non spécifiée'}</p>
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
                  <p className="text-sm font-bold">{selectedProject.teamSize || 0} personnes</p>
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
                  <p className="text-sm font-bold">
                    {selectedProject.budget ? `${(selectedProject.budget / 1000000).toFixed(1)}M MRU` : 'Non défini'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métriques de performance */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Progression
                  </p>
                  <p className="text-2xl font-bold">{selectedProject.progress || 0}%</p>
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
                  <p className="text-2xl font-bold">{metrics.completedPhases}</p>
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
                    En Cours
                  </p>
                  <p className="text-2xl font-bold">{metrics.inProgressPhases}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Target className="h-4 w-4 text-blue-600" />
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

        {/* ============================================================
            Wrap des tabs avec ProjectManagerProvider
            ============================================================ */}
        <ProjectManagerProvider 
          project={selectedProject} 
          roles={defaultRoles} 
          actionLabels={actionLabels}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="gantt" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Gantt & KPIs
              </TabsTrigger>
              <TabsTrigger value="gantt-diagram" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Diagramme de Gantt
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Analytics EVM
              </TabsTrigger>
            </TabsList>

            {/* Tab Gantt & KPIs */}
            <TabsContent value="gantt" className="space-y-4">
              <ErrorBoundary fallback={
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h3 className="text-lg font-medium text-yellow-800">Erreur de chargement</h3>
                  <p className="text-yellow-600">Impossible de charger le diagramme de Gantt.</p>
                </div>
              }>
                {(() => {
                  const ganttTasks = phases
                    .map(p => ({
                      id: p.id,
                      name: p.title,
                      startDate: parseDate(p.startDate),
                      endDate: parseDate(p.endDate),
                      progress: p.actualProgress,
                      phase: p.title,
                      status: p.status,
                      procurementStep: 1,
                      assignedTo: '',
                      budget: p.budget
                    }))
                    .filter(t => t.startDate && t.endDate) as any[];

                  const starts = ganttTasks.map(t => t.startDate.getTime());
                  const ends = ganttTasks.map(t => t.endDate.getTime());

                  return (
                    <WaterfallGanttChart
                      tasks={ganttTasks}
                      projectStartDate={starts.length ? new Date(Math.min(...starts)) : undefined}
                      projectEndDate={ends.length ? new Date(Math.max(...ends)) : undefined}
                      ProjectTitle={selectedProject.title}
                      ProjectDescription={selectedProject.description}
                      ProjectLocation={selectedProject.location}
                      ProjectStatus={selectedProject.status}
                      ProjectProgress={selectedProject.progress}
                      projectBudget={selectedProject.budget}
                      ProjectTeamSize={selectedProject.teamSize}
                    />
                  );
                })()}
              </ErrorBoundary>
            </TabsContent>

            {/* Tab Diagramme de Gantt — vue UNIQUE (GanttModel de l'orchestrateur) */}
            <TabsContent value="gantt-diagram" className="space-y-4">
              <ErrorBoundary fallback={
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h3 className="text-lg font-medium text-yellow-800">Erreur de chargement</h3>
                  <p className="text-yellow-600">Impossible de charger le diagramme de Gantt détaillé.</p>
                </div>
              }>
                <Card>
                  <CardContent className="pt-6">
                    <ProjectGanttTimeline gantt={ganttModel} />
                  </CardContent>
                </Card>
              </ErrorBoundary>
            </TabsContent>

            {/* Tab Analytics EVM */}
            <TabsContent value="analytics" className="space-y-4">
              <ErrorBoundary fallback={
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="text-lg font-medium text-red-800">Erreur de chargement</h3>
                  <p className="text-red-600">Impossible de charger les indicateurs de performance.</p>
                </div>
              }>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SPI (Schedule Performance Index)</p>
                      <p className="text-2xl font-bold">{metrics.schedulePerformanceIndex.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CPI (Cost Performance Index)</p>
                      <p className="text-2xl font-bold">{metrics.costPerformanceIndex.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                </div>
              </ErrorBoundary>
            </TabsContent>
          </Tabs>
        </ProjectManagerProvider>
      </div>
    </div>
  );
};

export default WaterfallProjectManager;