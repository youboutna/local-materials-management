import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, DollarSign, TrendingUp, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { ProjectData } from '@/types/project';
import { ProjectReportDTO, EnhancedPhaseDTO, ConstructionMilestoneDTO, ProjectAnalyticsDTO, RiskAssessmentDTO } from '@/types/reportTypes';
import { ReportDataTransformer } from '@/services/reportDataTransformer';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ProjectGantt from './ProjectGantt';
import GanttDiagramWithMilestones from './GanttDiagramWithMilestones';

interface ProjectDetailByDTOProps {
  projectId: string;
  onEdit?: () => void;
  onClose?: () => void;
}

export function ProjectDetailByDTO({ projectId, onEdit, onClose }: ProjectDetailByDTOProps) {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [enrichedData, setEnrichedData] = useState<ProjectReportDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch actual project data from database
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError || !projectData) {
        throw new Error('Projet non trouvé');
      }

      // Transform to ProjectData format
      const transformedProject: ProjectData = {
        id: projectData.id,
        title: projectData.title,
        description: projectData.description || '',
        location: projectData.location || '',
        status: projectData.status as any,
        progress: projectData.progress || 0,
        budget: projectData.budget || 0,
        startDate: projectData.start_date || new Date().toISOString(),
        endDate: projectData.end_date || new Date().toISOString(),
        thumbnail: projectData.thumbnail || '',
        teamSize: projectData.team_size || 1,
        coordinates: undefined,
        financingSource: projectData.financing_source || undefined,
        marketType: projectData.market_type || undefined,
        selectionMode: projectData.selection_mode || undefined,
        launchDate: projectData.launch_date || undefined,
        attributionDate: projectData.attribution_date || undefined,
        currentPhase: 'pre_construction',
        currentStage: 'planning_design',
        methodology: 'waterfall'
      };

      setProject(transformedProject);

      // Get enriched data for reporting
      const enriched = await ReportDataTransformer.transformProjectForReport(transformedProject);
      setEnrichedData(enriched);
    } catch (err) {
      console.error('Error loading project data:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du projet');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des données du projet...</p>
        </div>
      </div>
    );
  }

  if (error || !project || !enrichedData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">{error || 'Impossible de charger le projet'}</p>
          <Button onClick={loadProjectData} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <p className="text-muted-foreground mt-2">{project.description}</p>
          <div className="flex items-center gap-4 mt-4">
            <Badge variant={project.status === 'terminé' ? 'default' : 'secondary'}>
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
                <p className="text-2xl font-bold">{(project.budget || 0).toLocaleString()} €</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Dépensé: {enrichedData.financialMetrics.spentAmount.toLocaleString()} €
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phases</p>
                <p className="text-2xl font-bold">{enrichedData.phases.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {enrichedData.phases.filter(p => p.status === 'completed').length} terminées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jalons</p>
                <p className="text-2xl font-bold">{enrichedData.constructionMilestones.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {enrichedData.constructionMilestones.filter(m => m.status === 'completed').length} atteints
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="milestones">Jalons</TabsTrigger>
          <TabsTrigger value="gantt">Gantt</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="risks">Risques</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab project={project} enrichedData={enrichedData} />
        </TabsContent>

        <TabsContent value="phases" className="space-y-4">
          <PhasesTab phases={enrichedData.phases} />
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <MilestonesTab milestones={enrichedData.constructionMilestones} />
        </TabsContent>

        <TabsContent value="gantt" className="space-y-4">
          <GanttTab project={project} phases={enrichedData.phases} milestones={enrichedData.constructionMilestones} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsTab analytics={enrichedData.analytics} />
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <RisksTab riskAssessment={enrichedData.riskAssessment} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components for each tab
function OverviewTab({ project, enrichedData }: { project: ProjectData; enrichedData: ProjectReportDTO }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Date de début</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(project.startDate || Date.now()), 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Date de fin prévue</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(project.endDate || Date.now()), 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Source de financement</p>
            <p className="text-sm text-muted-foreground">{project.financingSource || 'Non spécifié'}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Type de marché</p>
            <p className="text-sm text-muted-foreground">{project.marketType || 'Non spécifié'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Métriques financières</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm">Budget total</span>
            <span className="font-medium">{enrichedData.financialMetrics.totalBudget.toLocaleString()} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Montant dépensé</span>
            <span className="font-medium">{enrichedData.financialMetrics.spentAmount.toLocaleString()} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Budget restant</span>
            <span className="font-medium">{enrichedData.financialMetrics.remainingBudget.toLocaleString()} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Dépassement</span>
            <span className={`font-medium ${enrichedData.financialMetrics.costOverrun > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {enrichedData.financialMetrics.costOverrun.toLocaleString()} €
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PhasesTab({ phases }: { phases: EnhancedPhaseDTO[] }) {
  return (
    <div className="space-y-4">
      {phases.map((phase) => (
        <Card key={phase.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">{phase.name}</CardTitle>
              <Badge variant={
                phase.status === 'completed' ? 'default' :
                phase.status === 'in_progress' ? 'secondary' :
                phase.status === 'delayed' ? 'destructive' : 'outline'
              }>
                {phase.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium">Progression</p>
                <Progress value={phase.actualProgress} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">{phase.actualProgress}%</p>
              </div>
              <div>
                <p className="text-sm font-medium">Budget</p>
                <p className="text-sm text-muted-foreground">{phase.budget.toLocaleString()} €</p>
                <p className="text-xs text-muted-foreground">Dépensé: {phase.actualCost.toLocaleString()} €</p>
              </div>
              <div>
                <p className="text-sm font-medium">Niveau de risque</p>
                <Badge variant={
                  phase.riskLevel === 'high' ? 'destructive' :
                  phase.riskLevel === 'medium' ? 'secondary' : 'default'
                }>
                  {phase.riskLevel}
                </Badge>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Date de début</p>
                <p className="text-muted-foreground">
                  {format(phase.startDate, 'dd/MM/yyyy')}
                </p>
              </div>
              <div>
                <p className="font-medium">Date de fin</p>
                <p className="text-muted-foreground">
                  {format(phase.endDate, 'dd/MM/yyyy')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MilestonesTab({ milestones }: { milestones: ConstructionMilestoneDTO[] }) {
  return (
    <div className="space-y-4">
      {milestones.map((milestone) => (
        <Card key={milestone.id}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold">{milestone.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant={
                    milestone.priority === 'critical' ? 'destructive' :
                    milestone.priority === 'high' ? 'secondary' : 'default'
                  }>
                    {milestone.priority}
                  </Badge>
                  <Badge variant={
                    milestone.stage === 'execution' ? 'default' :
                    milestone.stage === 'validation' ? 'secondary' : 'outline'
                  }>
                    {milestone.stage}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={
                  milestone.status === 'completed' ? 'default' :
                  milestone.status === 'overdue' ? 'destructive' : 'secondary'
                }>
                  {milestone.status}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  {format(milestone.targetDate, 'dd/MM/yyyy')}
                </p>
                {milestone.completedDate && (
                  <p className="text-xs text-green-600">
                    Terminé: {format(milestone.completedDate, 'dd/MM/yyyy')}
                  </p>
                )}
              </div>
            </div>
            <Progress value={milestone.completionPercentage} className="mt-4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function GanttTab({ project, phases, milestones }: { 
  project: ProjectData; 
  phases: EnhancedPhaseDTO[]; 
  milestones: ConstructionMilestoneDTO[] 
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Diagramme de Gantt du Projet</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectGantt 
            project={project} 
            phases={phases} 
            compact={false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diagramme avec Jalons</CardTitle>
        </CardHeader>
        <CardContent>
          <GanttDiagramWithMilestones 
            projectTitle={project.title}
            projectPeriode={project.startDate}
            phases={phases}
            milestones={milestones.map(m => ({
              id: m.id,
              name: m.title,
              date: m.targetDate,
              status: m.status === 'completed' ? 'completed' : m.status === 'in_progress' ? 'current' : 'upcoming',
              completed: m.status === 'completed'
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsTab({ analytics }: { analytics: ProjectAnalyticsDTO }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance des délais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.schedulePerformanceIndex.toFixed(2)}</div>
          <p className="text-sm text-muted-foreground">Indice de performance des délais</p>
          <Progress value={analytics.onTimePerformance} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">{analytics.onTimePerformance.toFixed(1)}% dans les délais</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance des coûts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.costPerformanceIndex.toFixed(2)}</div>
          <p className="text-sm text-muted-foreground">Indice de performance des coûts</p>
          <div className="mt-2">
            <p className="text-xs">Variance budget: {analytics.budgetVariance.toFixed(1)}%</p>
            <Progress value={Math.abs(analytics.budgetVariance)} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Efficacité équipe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.teamEfficiency.toFixed(0)}%</div>
          <p className="text-sm text-muted-foreground">Efficacité de l'équipe</p>
          <Progress value={analytics.teamEfficiency} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">Score qualité: {analytics.qualityScore.toFixed(0)}/100</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Métriques EVM (Earned Value Management)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium">Valeur acquise</p>
              <p className="text-lg font-bold">{analytics.earnedValue.toLocaleString()} €</p>
            </div>
            <div>
              <p className="text-sm font-medium">Valeur planifiée</p>
              <p className="text-lg font-bold">{analytics.plannedValue.toLocaleString()} €</p>
            </div>
            <div>
              <p className="text-sm font-medium">Coût réel</p>
              <p className="text-lg font-bold">{analytics.actualCost.toLocaleString()} €</p>
            </div>
            <div>
              <p className="text-sm font-medium">Estimation à l'achèvement</p>
              <p className="text-lg font-bold">{analytics.estimateAtCompletion.toLocaleString()} €</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RisksTab({ riskAssessment }: { riskAssessment: RiskAssessmentDTO }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Évaluation globale des risques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={
            riskAssessment.overallRiskLevel === 'critical' ? 'destructive' :
            riskAssessment.overallRiskLevel === 'high' ? 'secondary' : 'default'
          } className="text-lg px-4 py-2">
            {riskAssessment.overallRiskLevel}
          </Badge>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {riskAssessment.risks.map((risk) => (
          <Card key={risk.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold">{risk.description}</h3>
                  <Badge variant="outline" className="mt-2">
                    {risk.category}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Score: {risk.riskScore}</p>
                  <Badge variant={
                    risk.status === 'mitigated' ? 'default' :
                    risk.status === 'closed' ? 'secondary' : 'destructive'
                  }>
                    {risk.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm font-medium">Probabilité</p>
                  <Progress value={risk.probability} className="mt-1" />
                  <p className="text-xs text-muted-foreground">{risk.probability}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Impact</p>
                  <Progress value={risk.impact} className="mt-1" />
                  <p className="text-xs text-muted-foreground">{risk.impact}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}