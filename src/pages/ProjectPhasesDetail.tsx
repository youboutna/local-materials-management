import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PhaseMaterials from '@/components/project/PhaseMaterials';
import PhaseEmployees from '@/components/project/PhaseEmployees';
import PhaseDocuments from '@/components/project/PhaseDocuments';
import PhaseTasks from '@/components/project/PhaseTasks';
import EnhancedRiskManager from '@/components/project/EnhancedRiskManager';
import PhaseCompliance from '@/components/project/PhaseCompliance';
import PhaseMilestones from '@/components/project/PhaseMilestones';
import ResourcesMaterialsStep from '@/components/project/steps/ResourcesMaterialsStep';
import StepDocumentUpload from '@/components/project/steps/StepDocumentUpload';
import { ArrowLeft, Layers, ClipboardList, FileText, ShieldCheck, TriangleAlert, CalendarClock, Package } from 'lucide-react';

interface PhaseOption { id: string; name: string; }

const ProjectPhasesDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [phases, setPhases] = useState<PhaseOption[]>([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Array<{ materialId: string; quantity: number }>>([]);

  useEffect(() => {
    const loadPhases = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('project_phases')
          .select('id, phase_name')
          .eq('project_id', id)
          .order('start_date', { ascending: true });
        if (error) throw error;
        const options = (data || []).map(p => ({ id: p.id, name: p.phase_name || 'Phase sans nom' }));
        setPhases(options);
        
        // Check for phase query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const phaseParam = urlParams.get('phase');
        setSelectedPhaseId(phaseParam || options[0]?.id);
      } catch (err) {
        console.error(err);
        toast({ title: 'Erreur', description: "Impossible de charger les phases", variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadPhases();
  }, [id]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link to={`/projects/${id}/edit`}>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour à l'édition du projet
          </Button>
        </Link>
        <div className="w-full max-w-md">
          <label className="block text-sm font-medium mb-2">Sélectionner une phase</label>
          <Select value={selectedPhaseId} onValueChange={setSelectedPhaseId}>
            <SelectTrigger className="w-full">
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
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="resources" className="flex items-center gap-2"><ClipboardList className="h-4 w-4"/>Ressources</TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center gap-2"><Package className="h-4 w-4"/>Matériaux</TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2"><FileText className="h-4 w-4"/>Documents</TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2"><ClipboardList className="h-4 w-4"/>Tâches</TabsTrigger>
              <TabsTrigger value="risks" className="flex items-center gap-2"><TriangleAlert className="h-4 w-4"/>Risques</TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2"><ShieldCheck className="h-4 w-4"/>Conformité</TabsTrigger>
              <TabsTrigger value="gantt" className="flex items-center gap-2"><CalendarClock className="h-4 w-4"/>Gantt</TabsTrigger>
              <TabsTrigger value="planning" className="flex items-center gap-2"><CalendarClock className="h-4 w-4"/>Planning</TabsTrigger>
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectPhasesDetail;
