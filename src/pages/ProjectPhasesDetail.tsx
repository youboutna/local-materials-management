import React, { useEffect, useId, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { PhaseService } from '@/application/services/PhaseService';
import { ProjectService } from '@/application/services/ProjectService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import type { Phase } from '@/domain/entities/Phase';
import type { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import PhaseMaterials from '@/components/project/PhaseMaterials';
import PhaseEmployees from '@/components/project/PhaseEmployees';
import PhaseDocuments from '@/components/project/PhaseDocuments';
import PhaseTasks from '@/components/project/PhaseTasks';
import EnhancedRiskManager from '@/components/project/EnhancedRiskManager';
import PhaseCompliance from '@/components/project/PhaseCompliance';
import PhaseMilestones from '@/components/project/PhaseMilestones';
import ResourcesMaterialsStep from '@/components/project/steps/ResourcesMaterialsStep';
import StepDocumentUpload from '@/components/project/steps/StepDocumentUpload';
import MonitoringEvaluationPanel from '@/components/project/monitoring/MonitoringEvaluationPanel';
import { ArrowLeft, Layers, ClipboardList, FileText, ShieldCheck, TriangleAlert, CalendarClock, Package, Activity } from 'lucide-react';

interface PhaseRow {
  id: string;
  name: string;
  status?: string;
  progress?: number;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number | null;
}

const ProjectPhasesDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const phaseSelectId = useId();
  const [phases, setPhases] = useState<PhaseRow[]>([]);
  const [project, setProject] = useState<ProjectDetailDTO | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Array<{ materialId: string; quantity: number }>>([]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const phaseService = new PhaseService();
        const projectService = new ProjectService(RepositoryFactory.getProjectRepository());
        const [phasesData, projectData] = await Promise.all([
          phaseService.getPhasesByProject(id),
          projectService.getProjectWithDetails(id).catch(() => null),
        ]);

        // Mapping strict DTO (camelCase) — plus de snake_case côté UI
        const rows: PhaseRow[] = (phasesData as Phase[]).map((p) => ({
          id: p.id,
          name: p.phaseName?.trim() || 'Phase sans nom',
          status: p.status,
          progress: p.progress ?? 0,
          startDate: p.startDate ?? null,
          endDate: p.endDate ?? null,
          budget: p.estimatedCost ?? null,
        }));

        setPhases(rows);
        setProject(projectData as ProjectDetailDTO | null);

        const urlParams = new URLSearchParams(window.location.search);
        const phaseParam = urlParams.get('phase');
        setSelectedPhaseId(phaseParam || rows[0]?.id);
      } catch (err) {
        console.error(err);
        toast({
          title: 'Erreur',
          description: "Impossible de charger les phases via PhaseService",
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const monitoringPhases = useMemo(
    () =>
      phases.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        progress: p.progress,
        startDate: p.startDate,
        endDate: p.endDate,
        budget: p.budget,
        actualProgress: p.progress,
      })),
    [phases],
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link to={`/projects/${id}/edit`}>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour à l'édition du projet
          </Button>
        </Link>
        <div className="w-full max-w-md">
          <label htmlFor={phaseSelectId} className="block text-sm font-medium mb-2">Sélectionner une phase</label>
          <Select value={selectedPhaseId} onValueChange={setSelectedPhaseId}>
            <SelectTrigger id={phaseSelectId} className="w-full" aria-label="Sélectionner une phase">
              <SelectValue placeholder={loading ? 'Chargement...' : 'Choisir une phase'} />
            </SelectTrigger>
            <SelectContent side="bottom" align="start">
              {phases.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Gestion détaillée des phases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="resources" className="space-y-6">
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="resources" className="flex items-center gap-2"><ClipboardList className="h-4 w-4"/>Ressources</TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center gap-2"><Package className="h-4 w-4"/>Matériaux</TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2"><FileText className="h-4 w-4"/>Documents</TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2"><ClipboardList className="h-4 w-4"/>Tâches</TabsTrigger>
              <TabsTrigger value="risks" className="flex items-center gap-2"><TriangleAlert className="h-4 w-4"/>Risques</TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2"><ShieldCheck className="h-4 w-4"/>Conformité</TabsTrigger>
              <TabsTrigger value="gantt" className="flex items-center gap-2"><CalendarClock className="h-4 w-4"/>Gantt</TabsTrigger>
              <TabsTrigger value="planning" className="flex items-center gap-2"><CalendarClock className="h-4 w-4"/>Planning</TabsTrigger>
              <TabsTrigger value="monitoring" className="flex items-center gap-2"><Activity className="h-4 w-4"/>Suivi & Éval.</TabsTrigger>
            </TabsList>

            <TabsContent value="resources">
              {selectedPhaseId ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PhaseEmployees phaseId={selectedPhaseId} />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Veuillez sélectionner une phase.</div>
              )}
            </TabsContent>

            <TabsContent value="materials">
              {selectedPhaseId ? (
                <ResourcesMaterialsStep
                  selectedMaterials={selectedMaterials}
                  onMaterialsChange={setSelectedMaterials}
                  formData={{ id }}
                  currentPhaseId={selectedPhaseId}
                  isEditing={true}
                />
              ) : (
                <div className="text-sm text-muted-foreground">Veuillez sélectionner une phase.</div>
              )}
            </TabsContent>

            <TabsContent value="documents">
              {selectedPhaseId ? (
                <div className="space-y-4">
                  <PhaseDocuments phaseId={selectedPhaseId} projectId={id!} />
                  <StepDocumentUpload
                    projectId={id!}
                    phaseId={selectedPhaseId}
                    stepId=""
                    stepTitle="Documents de phase"
                  />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Veuillez sélectionner une phase.</div>
              )}
            </TabsContent>

            <TabsContent value="tasks">
              {selectedPhaseId ? (
                <PhaseTasks phaseId={selectedPhaseId} projectId={id!} />
              ) : (
                <div className="text-sm text-muted-foreground">Veuillez sélectionner une phase.</div>
              )}
            </TabsContent>

            <TabsContent value="risks">
              {id ? (
                <EnhancedRiskManager projectId={id} />
              ) : (
                <div className="text-sm text-muted-foreground">Projet introuvable.</div>
              )}
            </TabsContent>

            <TabsContent value="compliance">
              {selectedPhaseId ? (
                <PhaseCompliance phaseId={selectedPhaseId} projectId={id!} />
              ) : (
                <div className="text-sm text-muted-foreground">Veuillez sélectionner une phase.</div>
              )}
            </TabsContent>

            <TabsContent value="gantt">
              {selectedPhaseId ? (
                <PhaseMilestones phaseId={selectedPhaseId} projectId={id!} />
              ) : (
                <div className="text-sm text-muted-foreground">Veuillez sélectionner une phase.</div>
              )}
            </TabsContent>

            <TabsContent value="planning">
              {selectedPhaseId ? (
                <div className="space-y-4">
                  <PhaseMilestones phaseId={selectedPhaseId} projectId={id!} />
                  <PhaseCompliance phaseId={selectedPhaseId} projectId={id!} />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Veuillez sélectionner une phase.</div>
              )}
            </TabsContent>

            <TabsContent value="monitoring">
              {project && selectedPhaseId ? (
                <MonitoringEvaluationPanel
                  scope="phase"
                  project={project}
                  phases={monitoringPhases}
                  phaseId={selectedPhaseId}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  Sélectionnez une phase pour afficher les indicateurs de suivi & évaluation.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectPhasesDetail;
