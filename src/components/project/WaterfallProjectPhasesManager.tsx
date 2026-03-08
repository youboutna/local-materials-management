import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  BarChart3, 
  Workflow, 
  Target,
  Clock,
  CheckCircle2,
  DollarSign,
  MapPin,
  User,
  Building,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  TrendingUp
} from 'lucide-react';
import WaterfallGanttChart from './WaterfallGanttChart';
import WaterfallProjectKPIs from './WaterfallProjectKPIs';
import ConstructionPhaseManager from './ConstructionPhaseManager';
import { useProjects } from '@/hooks/projects/useProjects';
import type { ProjectData } from '@/types/project';

interface WaterfallProjectPhasesManagerProps {
  selectedProject: ProjectData | null;
  onProjectChange?: (project: ProjectData | null) => void;
}

const WaterfallProjectPhasesManager: React.FC<WaterfallProjectPhasesManagerProps> = ({
  selectedProject,
  onProjectChange
}) => {
  const [activeTab, setActiveTab] = useState('phases');
  const { projects, isLoading: loading } = useProjects();
  const [phases, setPhases] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [isEditingPhase, setIsEditingPhase] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<any>(null);
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

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!selectedProject) return;

      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: phasesData } = await supabase
          .from('project_phases')
          .select('*')
          .eq('project_id', selectedProject.id)
          .order('start_date', { ascending: true });

        // Récupérer les jalons spécifiques au projet sélectionné
        const { data: milestonesData } = await supabase
          .from('project_milestones')
          .select('*')
          .eq('project_id', selectedProject.id)
          .order('target_date', { ascending: true });

        if (phasesData) {
          setPhases(phasesData.map(p => ({
            id: p.id,
            name: p.phase_name,
            plannedProgress: 0, // Fixed: use hardcoded value since field doesn't exist
            actualProgress: p.progress || 0,
            budget: p.estimated_cost || 0,
            actualCost: p.actual_cost || 0,
            startDate: p.start_date,
            endDate: p.end_date,
            status: p.status,
            procurementStep: '', // Fixed: use hardcoded value since field doesn't exist
            projectId: p.project_id,
            description: p.description || ''
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
            phase: '', // Fixed: use hardcoded value since field doesn't exist
            stage: '' // Fixed: use hardcoded value since field doesn't exist
          })));
        }

        // Calcul des métriques EVM à partir des phases
        if (phasesData && phasesData.length > 0) {
          const earnedValue = phasesData.reduce((sum, p) => sum + ((p.progress || 0) / 100) * (p.estimated_cost || 0), 0);
          const plannedValue = phasesData.reduce((sum, p) => sum + (0 / 100) * (p.estimated_cost || 0), 0); // Fixed: use 0 since planned_progress doesn't exist
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

  const handleProjectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!onProjectChange) return;
    
    const projectId = event.target.value;
    const newProject = projects.find(p => p.id === projectId) || null;
    onProjectChange(newProject);
  };

  const handleAddPhase = () => {
    setCurrentPhase({
      name: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: 0,
      status: 'not_started'
    });
    setIsEditingPhase(true);
  };

  const handleEditPhase = (phase: any) => {
    setCurrentPhase(phase);
    setIsEditingPhase(true);
  };

  const handleSavePhase = async () => {
    if (!selectedProject) return;

    try {
      if (currentPhase.id) {
        // Mise à jour d'une phase existante
        const { error } = await supabase
          .from('project_phases')
          .update({
            phase_name: currentPhase.name,
            description: currentPhase.description,
            start_date: currentPhase.startDate,
            end_date: currentPhase.endDate,
            estimated_cost: currentPhase.budget,
            status: currentPhase.status
          })
          .eq('id', currentPhase.id);

        if (error) throw error;
      } else {
        // Création d'une nouvelle phase
        const { error } = await supabase
          .from('project_phases')
          .insert({
            project_id: selectedProject.id,
            phase_name: currentPhase.name,
            description: currentPhase.description,
            start_date: currentPhase.startDate,
            end_date: currentPhase.endDate,
            estimated_cost: currentPhase.budget,
            status: currentPhase.status,
            progress: 0,
            planned_progress: 0
          });

        if (error) throw error;
      }

      setIsEditingPhase(false);
      setCurrentPhase(null);
      
      // Recharger les données
      const { data: phasesData } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('start_date', { ascending: true });

      if (phasesData) {
        setPhases(phasesData.map(p => ({
          id: p.id,
          name: p.phase_name,
          plannedProgress: 0, // Fixed: use hardcoded value since field doesn't exist
          actualProgress: p.progress || 0,
          budget: p.estimated_cost || 0,
          actualCost: p.actual_cost || 0,
          startDate: p.start_date,
          endDate: p.end_date,
          status: p.status,
          procurementStep: '', // Fixed: use hardcoded value since field doesn't exist
          projectId: p.project_id,
          description: p.description || ''
        })));
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la phase:', error);
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette phase?')) return;

    try {
      const { error } = await supabase
        .from('project_phases')
        .delete()
        .eq('id', phaseId);

      if (error) throw error;

      // Mettre à jour l'état local
      setPhases(phases.filter(p => p.id !== phaseId));
    } catch (error) {
      console.error('Erreur lors de la suppression de la phase:', error);
    }
  };

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
          <p className="text-lg font-medium">Aucun projet sélectionné</p>
          <p className="text-muted-foreground">Veuillez sélectionner un projet pour gérer ses phases.</p>
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
            <select 
              value={selectedProject.id} 
              onChange={handleProjectChange}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Informations du projet sélectionné */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center">
            <Building className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-bold truncate">{selectedProject.title}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="waterfall">Waterfall</TabsTrigger>
            <TabsTrigger value="phases" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Gestion des Phases
            </TabsTrigger>
            <TabsTrigger value="gantt" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Diagramme de Gantt
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Analytics EVM
            </TabsTrigger>
          </TabsList>
          <TabsContent value="waterfall">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Méthodologie Waterfall - Marchés Publics Mauritanie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Waterfall Phase Mapping */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Phase Waterfall</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="font-medium text-blue-800">Démarrage</div>
                        <div className="text-sm text-blue-600">Charte projet, parties prenantes</div>
                      </div>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="font-medium text-green-800">Planification</div>
                        <div className="text-sm text-green-600">WBS, planning détaillé, communication</div>
                      </div>
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-medium text-yellow-800">Exécution</div>
                        <div className="text-sm text-yellow-600">Pilotage de la publication & réception</div>
                      </div>
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="font-medium text-purple-800">Contrôle</div>
                        <div className="text-sm text-purple-600">Suivi risques, valeur acquise</div>
                      </div>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="font-medium text-gray-800">Clôture</div>
                        <div className="text-sm text-gray-600">PV de recette, documentation</div>
                      </div>
                    </div>
                  </div>

                  {/* Procurement Steps */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Étapes Marchés Publics</h4>
                    <div className="space-y-2">
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium">1. Planification des achats</div>
                        <div className="text-sm text-muted-foreground">PAA & PPM alignés sur Charte projet</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium">2. Publicité et appel d'offres</div>
                        <div className="text-sm text-muted-foreground">Avis sur Portail National & journaux</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium">3. Réception & analyse des offres</div>
                        <div className="text-sm text-muted-foreground">CPMP présidée par PRMP</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium">4. Attribution du marché</div>
                        <div className="text-sm text-muted-foreground">Offre économiquement avantageuse</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium">5. Contrôle & régulation</div>
                        <div className="text-sm text-muted-foreground">CNCMP & ARMP</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

          <TabsContent value="phases" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Phases du Projet</h2>
              <Button onClick={handleAddPhase} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter une phase
              </Button>
            </div>

            {isEditingPhase ? (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {currentPhase.id ? 'Modifier la Phase' : 'Nouvelle Phase'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium">Nom de la phase</label>
                      <input
                        type="text"
                        value={currentPhase.name}
                        onChange={(e) => setCurrentPhase({...currentPhase, name: e.target.value})}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Statut</label>
                      <select
                        value={currentPhase.status}
                        onChange={(e) => setCurrentPhase({...currentPhase, status: e.target.value})}
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
                        onChange={(e) => setCurrentPhase({...currentPhase, startDate: e.target.value})}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Date de fin</label>
                      <input
                        type="date"
                        value={currentPhase.endDate}
                        onChange={(e) => setCurrentPhase({...currentPhase, endDate: e.target.value})}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Budget (USD)</label>
                      <input
                        type="number"
                        value={currentPhase.budget}
                        onChange={(e) => setCurrentPhase({...currentPhase, budget: Number(e.target.value)})}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={currentPhase.description}
                      onChange={(e) => setCurrentPhase({...currentPhase, description: e.target.value})}
                      className="w-full p-2 border rounded-md"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSavePhase}>
                      {currentPhase.id ? 'Mettre à jour' : 'Créer'}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsEditingPhase(false);
                      setCurrentPhase(null);
                    }}>
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <ConstructionPhaseManager
              workflowData={{ phases: phases.map((p: any) => ({
                id: p.id,
                title: p.title || p.name || 'Phase',
                description: p.description || '',
                startDate: p.startDate,
                endDate: p.endDate,
                estimatedDuration: Math.ceil((new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24)),
                status: p.status,
                budget: p.budget || 0,
                actualCost: p.actualCost || 0,
                progress: p.actualProgress || p.progress || 0,
                materials: [],
                humanResources: [],
                suppliers: [],
                location: selectedProject?.location || '',
                notes: ''
              })) } as any}
              phases={phases as any}
              projectId={selectedProject?.id}
              onStepComplete={(stepData: any) => {
                const newPhases = stepData?.phases || phases;
                setPhases(newPhases.map((up: any) => ({
                  id: up.id,
                  name: up.title || up.name,
                  description: up.description,
                  startDate: up.startDate,
                  endDate: up.endDate,
                  status: up.status,
                  budget: up.budget,
                  actualCost: up.actualCost,
                  actualProgress: up.progress,
                  plannedProgress: up.progress,
                  procurementStep: '',
                  projectId: selectedProject.id
                })));
              }}
              projectBudget={selectedProject.budget}
            />
          </TabsContent>

          <TabsContent value="gantt" className="space-y-4">
            <WaterfallGanttChart 
              tasks={phases.map(p => ({
                id: p.id,
                name: p.title,
                startDate: new Date(p.startDate),
                endDate: new Date(p.endDate),
                progress: p.actualProgress,
                phase: p.title,
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
            <WaterfallProjectKPIs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WaterfallProjectPhasesManager;