// ============================================================
// src/components/project/WaterfallProjectPhasesManager.tsx
// ============================================================
/**
 * WaterfallProjectPhasesManager
 * -----------------------------
 * Hexagonal: aucune dépendance directe à Supabase ni à `ProjectAggregateDTO`.
 * Hydratation via `usePhasesHex` + `useMilestonesHex`. Mapping camelCase ↔ snake_case
 * réalisé dans les hooks/transformers.
 * 
 * Updated to integrate with ProjectManagerProvider and AlertService
 */

import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  BarChart3,
  Target,
  Building,
  AlertCircle,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  ExternalLink,
} from 'lucide-react';
import WaterfallGanttChart from './WaterfallGanttChart';
import WaterfallProjectKPIs from './WaterfallProjectKPIs';
import ConstructionPhaseManager from './ConstructionPhaseManager';
import { useProjects } from '@/hooks/projects/useProjects';
import { usePhasesHex } from '@/hooks/hexagonal/usePhasesHex';
import { useMilestonesHex } from '@/hooks/hexagonal/useMilestonesHex';
import { useProjectManager } from '@/hooks/useProjectManager';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/domain/entities/Alert';

/**
 * Vue projet minimale consommée par ce composant. Camelcase strict.
 */
export interface WaterfallProjectSummaryDTO {
  id: string;
  title: string;
  description?: string;
  location?: string;
  status: string;
  progress: number;
  budget?: number;
  teamSize?: number;
}

interface WaterfallProjectPhasesManagerProps {
  selectedProject: WaterfallProjectSummaryDTO | null;
  onProjectChange?: (project: WaterfallProjectSummaryDTO | null) => void;
}

interface PhaseFormState {
  id?: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
}

const WaterfallProjectPhasesManager: React.FC<WaterfallProjectPhasesManagerProps> = ({
  selectedProject,
  onProjectChange,
}) => {
  const [activeTab, setActiveTab] = useState('phases');
  const { projects, isLoading: loading } = useProjects();
  const projectId = selectedProject?.id;

  // ✅ Use ProjectManager for alerts
  const { 
    alerts, 
    state, 
    acknowledgeAlert, 
    resolveAlert, 
    getSummaryStats,
    loading: alertsLoading,
    runChecks 
  } = useProjectManager();

  const {
    phases: phasesEntities,
    createPhase,
    updatePhase,
    deletePhase,
    isCreating,
    isUpdating,
  } = usePhasesHex(projectId);

  const { milestones } = useMilestonesHex(projectId);

  const [isEditingPhase, setIsEditingPhase] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<PhaseFormState | null>(null);

  // Get all alerts from context
  const allAlerts = state?.alerts || alerts || [];
  const stats = getSummaryStats();

  // Filter alerts related to phases
  const phaseAlerts = useMemo(() => {
    return allAlerts.filter((alert: Alert) => 
      alert.type === 'phase' || 
      alert.type === 'deadline' ||
      alert.type === 'milestone' ||
      alert.source === 'phase'
    );
  }, [allAlerts]);

  // Map domain Phase → ViewModel camelCase pour l'UI
  const phases = useMemo(
    () =>
      phasesEntities.map((p: any) => ({
        id: p.id,
        name: p.phaseName ?? p.name ?? 'Phase',
        title: p.phaseName ?? p.name ?? 'Phase',
        description: p.description ?? '',
        startDate: p.startDate ?? '',
        endDate: p.endDate ?? '',
        status: (p.status ?? 'not_started') as PhaseFormState['status'],
        budget: p.estimatedCost ?? 0,
        actualCost: p.actualCost ?? 0,
        actualProgress: p.progress ?? 0,
        plannedProgress: 0,
        procurementStep: '',
        projectId: p.projectId ?? projectId,
      })),
    [phasesEntities, projectId]
  );

  const metrics = useMemo(() => {
    if (!phases.length || !selectedProject) {
      return {
        schedulePerformanceIndex: 1,
        costPerformanceIndex: 1,
        earnedValue: 0,
        plannedValue: 0,
        actualCost: 0,
        budgetAtCompletion: selectedProject?.budget ?? 0,
        estimateAtCompletion: 0,
        estimateToComplete: 0,
        varianceAtCompletion: 0,
      };
    }
    const earnedValue = phases.reduce(
      (sum, p) => sum + ((p.actualProgress || 0) / 100) * (p.budget || 0),
      0
    );
    const plannedValue = phases.reduce(
      (sum, p) => sum + ((p.plannedProgress || 0) / 100) * (p.budget || 0),
      0
    );
    const actualCost = phases.reduce((sum, p) => sum + (p.actualCost || 0), 0);
    const budgetAtCompletion =
      selectedProject.budget || phases.reduce((sum, p) => sum + (p.budget || 0), 0);
    return {
      schedulePerformanceIndex: plannedValue > 0 ? earnedValue / plannedValue : 1,
      costPerformanceIndex: actualCost > 0 ? earnedValue / actualCost : 1,
      earnedValue,
      plannedValue,
      actualCost,
      budgetAtCompletion,
      estimateAtCompletion: actualCost + (budgetAtCompletion - earnedValue),
      estimateToComplete: budgetAtCompletion - earnedValue,
      varianceAtCompletion:
        budgetAtCompletion - (actualCost + (budgetAtCompletion - earnedValue)),
    };
  }, [phases, selectedProject]);

  // ============================================================
  // Handlers
  // ============================================================
  const handleProjectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!onProjectChange) return;
    const id = event.target.value;
    const next = projects.find((p: any) => p.id === id);
    onProjectChange(
      next
        ? {
            id: next.id,
            title: next.title,
            description: next.description,
            location: next.location,
            status: String(next.status),
            progress: next.progress,
            budget: next.budget,
            teamSize: (next as any).teamSize,
          }
        : null
    );
  };

  const handleAddPhase = () => {
    setCurrentPhase({
      name: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: 0,
      status: 'not_started',
    });
    setIsEditingPhase(true);
  };

  const handleSavePhase = async () => {
    if (!currentPhase || !projectId) return;
    if (currentPhase.id) {
      await updatePhase(currentPhase.id, {
        phase_name: currentPhase.name,
        description: currentPhase.description,
        start_date: currentPhase.startDate,
        end_date: currentPhase.endDate,
        estimated_cost: currentPhase.budget,
        status: currentPhase.status,
      });
    } else {
      await createPhase({
        phase_name: currentPhase.name,
        description: currentPhase.description,
        start_date: currentPhase.startDate,
        end_date: currentPhase.endDate,
        estimated_cost: currentPhase.budget,
      });
    }
    setIsEditingPhase(false);
    setCurrentPhase(null);
    // Refresh alerts after phase update
    await runChecks();
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette phase ?')) return;
    await deletePhase(phaseId);
    // Refresh alerts after phase deletion
    await runChecks();
  };

  const handleAcknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId, 'current-user', 'Traité depuis la gestion des phases');
      await runChecks();
    } catch (error) {
      console.error('Erreur lors de l\'acquittement:', error);
    }
  }, [acknowledgeAlert, runChecks]);

  const handleResolveAlert = useCallback(async (alertId: string) => {
    try {
      await resolveAlert(alertId, 'current-user', 'Phase mise à jour');
      await runChecks();
    } catch (error) {
      console.error('Erreur lors de la résolution:', error);
    }
  }, [resolveAlert, runChecks]);

  // ============================================================
  // Loading States
  // ============================================================
  if (loading || alertsLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des projets et alertes...</p>
        </div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">Aucun projet sélectionné</p>
          <p className="text-muted-foreground">
            Veuillez sélectionner un projet pour gérer ses phases.
          </p>
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
        {/* Header with project selector and alert stats */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <select
              value={selectedProject.id}
              onChange={handleProjectChange}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
          
          {/* Alert Stats Summary */}
          <div className="flex items-center gap-3">
            {stats.criticalAlerts > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {stats.criticalAlerts} critique(s)
              </Badge>
            )}
            {stats.highAlerts > 0 && (
              <Badge variant="destructive" className="bg-orange-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {stats.highAlerts} élevée(s)
              </Badge>
            )}
            {stats.openAlerts > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {stats.openAlerts} ouverte(s)
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={runChecks}
              className="text-xs"
            >
              Actualiser
            </Button>
          </div>
        </div>

        {/* Project Info & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-bold truncate">{selectedProject.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm">Progression: {selectedProject.progress || 0}%</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm">Jalons: {milestones.length}</p>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm">Alertes phases: {phaseAlerts.length}</p>
          </div>
        </div>

        {/* Phase Alerts Section */}
        {phaseAlerts.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5" />
                Alertes des Phases
                <Badge variant="outline" className="ml-2">
                  {phaseAlerts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {phaseAlerts.map((alert: Alert) => (
                  <div key={alert.id} className="p-3 bg-white border border-yellow-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{alert.title || alert.message}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {alert.type}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            alert.severity === 'critical' ? 'text-red-600 border-red-200' :
                            alert.severity === 'high' ? 'text-orange-600 border-orange-200' :
                            'text-yellow-600 border-yellow-200'
                          }`}
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.status === 'open' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Acquitter
                        </Button>
                      )}
                      {(alert.status === 'open' || alert.status === 'acknowledged') && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Résoudre
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="waterfall">Waterfall</TabsTrigger>
            <TabsTrigger value="phases" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Phases
            </TabsTrigger>
            <TabsTrigger value="gantt" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Gantt
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Target className="h-4 w-4" /> EVM
            </TabsTrigger>
          </TabsList>

          <TabsContent value="waterfall">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Méthodologie Waterfall - Marchés Publics Mauritanie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">SPI</p>
                    <p className="text-lg font-semibold">{metrics.schedulePerformanceIndex.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPI</p>
                    <p className="text-lg font-semibold">{metrics.costPerformanceIndex.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">BAC</p>
                    <p className="text-lg font-semibold">{metrics.budgetAtCompletion.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">EVM</p>
                    <p className="text-lg font-semibold">{metrics.earnedValue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phases" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Phases du Projet</h2>
              <Button onClick={handleAddPhase} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Ajouter une phase
              </Button>
            </div>

            {isEditingPhase && currentPhase && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {currentPhase.id ? 'Modifier la Phase' : 'Nouvelle Phase'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium">Nom</label>
                      <input
                        type="text"
                        value={currentPhase.name}
                        onChange={(e) =>
                          setCurrentPhase({ ...currentPhase, name: e.target.value })
                        }
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Statut</label>
                      <select
                        value={currentPhase.status}
                        onChange={(e) =>
                          setCurrentPhase({
                            ...currentPhase,
                            status: e.target.value as PhaseFormState['status'],
                          })
                        }
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="not_started">Non commencé</option>
                        <option value="in_progress">En cours</option>
                        <option value="completed">Terminé</option>
                        <option value="delayed">Retardé</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Date de début</label>
                      <input
                        type="date"
                        value={currentPhase.startDate}
                        onChange={(e) =>
                          setCurrentPhase({ ...currentPhase, startDate: e.target.value })
                        }
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Date de fin</label>
                      <input
                        type="date"
                        value={currentPhase.endDate}
                        onChange={(e) =>
                          setCurrentPhase({ ...currentPhase, endDate: e.target.value })
                        }
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Budget</label>
                      <input
                        type="number"
                        value={currentPhase.budget}
                        onChange={(e) =>
                          setCurrentPhase({
                            ...currentPhase,
                            budget: Number(e.target.value),
                          })
                        }
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={currentPhase.description}
                      onChange={(e) =>
                        setCurrentPhase({ ...currentPhase, description: e.target.value })
                      }
                      className="w-full p-2 border rounded-md"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSavePhase} disabled={isCreating || isUpdating}>
                      {currentPhase.id ? 'Mettre à jour' : 'Créer'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingPhase(false);
                        setCurrentPhase(null);
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <ConstructionPhaseManager
              workflowData={
                {
                  phases: phases.map((p) => ({
                    id: p.id,
                    title: p.title,
                    description: p.description,
                    startDate: p.startDate,
                    endDate: p.endDate,
                    estimatedDuration: p.startDate && p.endDate
                      ? Math.ceil(
                          (new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      : 0,
                    status: p.status,
                    budget: p.budget,
                    actualCost: p.actualCost,
                    progress: p.actualProgress,
                    materials: [],
                    humanResources: [],
                    suppliers: [],
                    location: selectedProject.location ?? '',
                    notes: '',
                  })),
                } as any
              }
              phases={phases as any}
              projectId={projectId}
              onStepComplete={() => {
                // hex hooks invalident automatiquement le cache
                runChecks();
              }}
              projectBudget={selectedProject.budget ?? 0}
            />
          </TabsContent>

          <TabsContent value="gantt" className="space-y-4">
            {(() => {
              const parse = (v: any) => {
                if (!v) return null;
                const d = new Date(v);
                return isNaN(d.getTime()) ? null : d;
              };
              const ganttTasks = phases
                .map((p) => ({
                  id: p.id,
                  name: p.title,
                  startDate: parse(p.startDate),
                  endDate: parse(p.endDate),
                  progress: p.actualProgress,
                  phase: p.title,
                  status: p.status,
                  procurementStep: 1,
                  assignedTo: '',
                  budget: p.budget,
                }))
                .filter((t) => t.startDate && t.endDate) as any[];
              const starts = ganttTasks.map((t) => t.startDate.getTime());
              const ends = ganttTasks.map((t) => t.endDate.getTime());
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
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <WaterfallProjectKPIs />
            {phases.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleDeletePhase(phases[0].id)}
              >
                (debug) supprimer 1ère phase
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WaterfallProjectPhasesManager;