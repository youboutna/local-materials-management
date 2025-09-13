import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, Eye, Workflow } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import WorkflowStepSelector from './WorkflowStepSelector';
import DocumentShareDialog from './DocumentShareDialog';
import { 
  PROCUREMENT_PHASES, 
  PROCUREMENT_STAGES, 
  PROCUREMENT_PHASE_LABELS,
  ProcurementPhase,
  ProcurementStage,
  SUGGESTED_DOCUMENTS
} from './PublicProcurementWorkflow';
import ProcurementStepSelector from './ProcurementStepSelector';

interface Tender {
  id: string;
  title: string;
  description: string;
  project_id?: string;
  launch_date?: string;
  attribution_date?: string;
  deadline_date?: string;
  submission_deadline?: string;
  evaluation_deadline?: string;
  selection_mode?: string;
  market_type?: string;
  financing_source?: string;
  project_reference?: string;
  current_phase?: string;
  current_stage?: string;
  procurement_type?: string;
  estimated_value?: number;
  status: 'draft' | 'published' | 'closed' | 'awarded';
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
}

interface TenderCrudProps {
  onTenderSelect?: (tender: Tender) => void;
  selectedTenderId?: string;
}

const TenderCrud = ({ onTenderSelect, selectedTenderId }: TenderCrudProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [isProcurementWorkflowSelectorOpen, setIsProcurementWorkflowSelectorOpen] = useState(false);
  const [selectedProcurementSteps, setSelectedProcurementSteps] = useState<Array<{phase: ProcurementPhase, stage: { value: ProcurementStage; label: string }, selected_documents?: string[]}>>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    launch_date: '',
    attribution_date: '',
    deadline_date: '',
    submission_deadline: '',
    evaluation_deadline: '',
    selection_mode: '',
    market_type: '',
    financing_source: '',
    project_reference: '',
    current_phase: '',
    current_stage: '',
    procurement_type: '',
    estimated_value: '',
    status: 'draft' as 'draft' | 'published' | 'closed' | 'awarded'
  });

  const [isEditDocsOpen, setIsEditDocsOpen] = useState(false);
  const [editDocsIndex, setEditDocsIndex] = useState<number | null>(null);
  const [editDocsSelection, setEditDocsSelection] = useState<string[]>([]);
  const [isDocumentShareOpen, setIsDocumentShareOpen] = useState(false);
  const [sharePhase, setSharePhase] = useState<{ phase: ProcurementPhase; title: string } | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tenders
  const { data: tenders, isLoading } = useQuery({
    queryKey: ['tenders'],
    queryFn: async (): Promise<Tender[]> => {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(tender => ({
        ...tender,
        current_phase: tender.current_phase?.toString() || '',
        current_stage: tender.current_stage?.toString() || ''
      })) as Tender[];
    },
  });

  // Fetch projects for dropdown
  const { data: projects } = useQuery({
    queryKey: ['projects-for-tender'],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, description')
        .order('title', { ascending: true });
      
      if (error) throw error;
      return data as Project[] || [];
    },
  });

  // Handle phase selection - auto-select all stages of the phase
  const handleSelectProcurementPhase = (phase: ProcurementPhase) => {
    const phaseStages = PROCUREMENT_STAGES[phase];
    const newSteps = phaseStages.map(stage => ({
      phase,
      stage,
      selected_documents: [] as string[]
    }));

    setSelectedProcurementSteps(prev => {
      // Remove existing steps for this phase
      const filtered = prev.filter(s => s.phase !== phase);
      return [...filtered, ...newSteps];
    });
    setIsProcurementWorkflowSelectorOpen(false);
  };

  // Handle individual step selection
  const handleSelectProcurementStep = (phase: ProcurementPhase, stage: { value: ProcurementStage; label: string }, selectedDocuments?: string[]) => {
    if (!selectedProcurementSteps.find(s => s.phase === phase && s.stage.value === stage.value)) {
      setSelectedProcurementSteps(prev => [...prev, { phase, stage, selected_documents: selectedDocuments || [] }]);
    }
    setIsProcurementWorkflowSelectorOpen(false);
  };

  // Create/Update tender mutation
  const tenderMutation = useMutation({
    mutationFn: async (tenderData: typeof formData) => {
      const dataToSubmit = {
        title: tenderData.title,
        description: tenderData.description,
        project_id: tenderData.project_id || null,
        launch_date: tenderData.launch_date || null,
        attribution_date: tenderData.attribution_date || null,
        deadline_date: tenderData.deadline_date || null,
        submission_deadline: tenderData.submission_deadline || null,
        evaluation_deadline: tenderData.evaluation_deadline || null,
        selection_mode: tenderData.selection_mode || null,
        market_type: tenderData.market_type || null,
        financing_source: tenderData.financing_source || null,
        project_reference: tenderData.project_reference || null,
        procurement_type: tenderData.procurement_type || null,
        estimated_value: tenderData.estimated_value ? parseFloat(tenderData.estimated_value) : null,
        status: tenderData.status
      };

      if (editingTender) {
        const { data, error } = await supabase
          .from('tenders')
          .update(dataToSubmit)
          .eq('id', editingTender.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('tenders')
          .insert([dataToSubmit])
          .select()
          .single();
        if (error) throw error;
        
        // Add workflow steps if creating new tender and steps are selected
        let stepNumber = 1;
        const allStepsToInsert: any[] = [];

        if (selectedProcurementSteps.length > 0) {
          const procurementSteps = selectedProcurementSteps.map(({ phase, stage, selected_documents }) => ({
            tender_id: data.id,
            title: stage.label,
            description: `Phase: ${PROCUREMENT_PHASE_LABELS[phase]} - ${stage.label}`,
            step_number: stepNumber++,
            required_documents: selected_documents || [],
            procurement_phase: phase,
            procurement_stage: stage.value,
            status: 'pending'
          }));
          allStepsToInsert.push(...procurementSteps);
        }

        if (allStepsToInsert.length > 0) {
          const { error: stepsError } = await supabase
            .from('tender_steps')
            .insert(allStepsToInsert);
          
          if (stepsError) {
            console.error('Error adding workflow steps:', stepsError);
          }
        }

        // Update tender with current phase and stage if using standard mauritanien
        if (dataToSubmit.procurement_type === 'standard_mauritanien' && selectedProcurementSteps.length > 0) {
          const firstStep = selectedProcurementSteps[0];
          const phaseNumbers: Record<string, number> = {
            'planification': 1,
            'publicite': 2,
            'reception_analyse': 3,
            'attribution': 4,
            'controle_regulation': 5
          };
          
          await supabase
            .from('tenders')
            .update({
              current_phase: phaseNumbers[firstStep.phase] || 1,
              current_stage: firstStep.stage.value
            })
            .eq('id', data.id);
        }
        
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      toast({
        title: editingTender ? 'Appel d\'offres modifié' : 'Appel d\'offres créé',
        description: 'L\'opération a été effectuée avec succès.',
      });
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Tender operation error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur s\'est produite lors de l\'opération.',
        variant: 'destructive',
      });
    },
  });

  // Delete tender mutation
  const deleteMutation = useMutation({
    mutationFn: async (tenderId: string) => {
      const { error } = await supabase
        .from('tenders')
        .delete()
        .eq('id', tenderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      toast({
        title: 'Appel d\'offres supprimé',
        description: 'L\'appel d\'offres a été supprimé avec succès.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Erreur de validation',
        description: 'Le titre et la description sont requis.',
        variant: 'destructive',
      });
      return;
    }

    tenderMutation.mutate(formData);
  };

  const handleEdit = (tender: Tender) => {
    setEditingTender(tender);
    setFormData({
      title: tender.title,
      description: tender.description,
      project_id: tender.project_id || '',
      launch_date: tender.launch_date || '',
      attribution_date: tender.attribution_date || '',
      deadline_date: tender.deadline_date || '',
      submission_deadline: tender.submission_deadline || '',
      evaluation_deadline: tender.evaluation_deadline || '',
      selection_mode: tender.selection_mode || '',
      market_type: tender.market_type || '',
      financing_source: tender.financing_source || '',
      project_reference: tender.project_reference || '',
      current_phase: tender.current_phase || '',
      current_stage: tender.current_stage || '',
      procurement_type: tender.procurement_type || '',
      estimated_value: tender.estimated_value?.toString() || '',
      status: tender.status
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTender(null);
    setSelectedProcurementSteps([]);
    setFormData({
      title: '',
      description: '',
      project_id: '',
      launch_date: '',
      attribution_date: '',
      deadline_date: '',
      submission_deadline: '',
      evaluation_deadline: '',
      selection_mode: '',
      market_type: '',
      financing_source: '',
      project_reference: '',
      current_phase: '',
      current_stage: '',
      procurement_type: '',
      estimated_value: '',
      status: 'draft'
    });
  };

  const removeProcurementStep = (phase: ProcurementPhase, stageValue: string) => {
    setSelectedProcurementSteps(prev => prev.filter(s => !(s.phase === phase && s.stage.value === stageValue)));
  };

  const openEditDocsForStep = (index: number) => {
    const step = selectedProcurementSteps[index];
    setEditDocsIndex(index);
    setEditDocsSelection(step.selected_documents ? [...step.selected_documents] : []);
    setIsEditDocsOpen(true);
  };

  const toggleEditDoc = (doc: string) => {
    setEditDocsSelection(prev => prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]);
  };

  const saveEditedDocs = () => {
    if (editDocsIndex === null) return;
    setSelectedProcurementSteps(prev => {
      const copy = [...prev];
      copy[editDocsIndex] = {
        ...copy[editDocsIndex],
        selected_documents: editDocsSelection
      };
      return copy;
    });
    setIsEditDocsOpen(false);
    setEditDocsIndex(null);
    setEditDocsSelection([]);
  };

  const handleShareDocuments = (phase: ProcurementPhase, phaseTitle: string) => {
    setSharePhase({ phase, title: phaseTitle });
    setIsDocumentShareOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Brouillon', color: 'bg-gray-500' },
      published: { label: 'Publié', color: 'bg-blue-500' },
      closed: { label: 'Fermé', color: 'bg-orange-500' },
      awarded: { label: 'Attribué', color: 'bg-green-500' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gestion des Appels d'Offres</h3>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel Appel d'Offres
        </Button>
      </div>

      {/* Enhanced Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">
              {editingTender ? 'Modifier l\'Appel d\'Offres' : 'Créer un Nouvel Appel d\'Offres'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold text-primary">Informations Générales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      required
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                </div>
              </div>

              {/* Project Association Section */}
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold text-primary">Association Projet</h3>
                <div>
                  <Label htmlFor="project_id">Projet associé (optionnel)</Label>
                  <Select 
                    value={formData.project_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value === 'none' ? '' : value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner un projet..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun projet associé</SelectItem>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Dates Section */}
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold text-primary">Dates Importantes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="launch_date">Date de lancement</Label>
                    <Input
                      id="launch_date"
                      type="date"
                      value={formData.launch_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, launch_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="attribution_date">Date d'attribution</Label>
                    <Input
                      id="attribution_date"
                      type="date"
                      value={formData.attribution_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, attribution_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="deadline_date">Date limite générale</Label>
                    <Input
                      id="deadline_date"
                      type="datetime-local"
                      value={formData.deadline_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, deadline_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="submission_deadline">Date limite de soumission</Label>
                    <Input
                      id="submission_deadline"
                      type="datetime-local"
                      value={formData.submission_deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, submission_deadline: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold text-primary">Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Statut</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value: 'draft' | 'published' | 'closed' | 'awarded') => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="published">Publié</SelectItem>
                        <SelectItem value="closed">Fermé</SelectItem>
                        <SelectItem value="awarded">Attribué</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="estimated_value">Valeur estimée (MRU)</Label>
                    <Input
                      id="estimated_value"
                      type="number"
                      value={formData.estimated_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimated_value: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Procurement Type and Workflow */}
              {!editingTender && (
                <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Configuration du Workflow</h3>
                  <div>
                    <Label htmlFor="procurement_type">Type de procédure</Label>
                    <Select 
                      value={formData.procurement_type} 
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, procurement_type: value }));
                        if (value === 'standard_mauritanien') {
                          // Auto-select first phase when Standard Mauritanien is selected
                          handleSelectProcurementPhase('planification');
                        } else {
                          // Clear steps for other types
                          setSelectedProcurementSteps([]);
                        }
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner un type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard_mauritanien">Modèle Standard Mauritanien</SelectItem>
                        <SelectItem value="international">Procédure Internationale</SelectItem>
                        <SelectItem value="urgence">Procédure d'Urgence</SelectItem>
                        <SelectItem value="gre_gre">Gré à Gré</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.procurement_type === 'standard_mauritanien' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>Phases du workflow séquentiel</Label>
                        <div className="flex gap-2">
                          <Button 
                            type="button"
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsProcurementWorkflowSelectorOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter une étape
                          </Button>
                          <Button 
                            type="button"
                            variant="secondary" 
                            size="sm"
                            onClick={() => {
                              Object.keys(PROCUREMENT_STAGES).forEach(phase => {
                                handleSelectProcurementPhase(phase as ProcurementPhase);
                              });
                            }}
                          >
                            <Workflow className="h-4 w-4 mr-2" />
                            Toutes les phases
                          </Button>
                        </div>
                      </div>

                      {selectedProcurementSteps.length > 0 && (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {selectedProcurementSteps.map((step, index) => (
                            <div key={`${step.phase}-${step.stage.value}`} className="bg-white p-4 rounded border">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{step.stage.label}</h4>
                                  <p className="text-xs text-gray-600">Phase: {PROCUREMENT_PHASE_LABELS[step.phase]}</p>
                                  {step.selected_documents && step.selected_documents.length > 0 && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      {step.selected_documents.length} document(s) sélectionné(s)
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDocsForStep(index)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeProcurementStep(step.phase, step.stage.value)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                    💡 Pour le modèle Standard Mauritanien, les phases sont séquentielles : Planification → Publicité → Réception & Analyse → Attribution → Contrôle & Régulation
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t mt-8">
                <Button type="button" variant="outline" onClick={handleCloseDialog} size="lg">
                  Annuler
                </Button>
                <Button type="submit" disabled={tenderMutation.isPending} size="lg">
                  {tenderMutation.isPending ? 'Enregistrement...' : (editingTender ? 'Modifier' : 'Créer')}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
  
      {/* Procurement Workflow Step Selector */}
      <ProcurementStepSelector
        isOpen={isProcurementWorkflowSelectorOpen}
        onClose={() => setIsProcurementWorkflowSelectorOpen(false)}
        onSelectStep={handleSelectProcurementStep}
        existingSteps={selectedProcurementSteps}
      />

      {/* Edit documents dialog (inline) */}
      <Dialog open={isEditDocsOpen} onOpenChange={setIsEditDocsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier les documents de l'étape</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {editDocsIndex !== null ? (
              <>
                <p className="text-sm text-gray-600">
                  Étape: {selectedProcurementSteps[editDocsIndex].stage.label}
                </p>

                <div className="space-y-2">
                  {(SUGGESTED_DOCUMENTS[selectedProcurementSteps[editDocsIndex].stage.value] || []).map((doc) => (
                    <label key={doc} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editDocsSelection.includes(doc)}
                        onChange={() => toggleEditDoc(doc)}
                      />
                      <span>{doc}</span>
                    </label>
                  ))}

                  {(!SUGGESTED_DOCUMENTS[selectedProcurementSteps[editDocsIndex]?.stage?.value] || SUGGESTED_DOCUMENTS[selectedProcurementSteps[editDocsIndex]?.stage?.value]?.length === 0) && (
                    <p className="text-xs text-gray-500">Aucune suggestion disponible pour cette étape.</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsEditDocsOpen(false)}>Annuler</Button>
                  <Button onClick={saveEditedDocs}>Enregistrer</Button>
                </div>
              </>
            ) : (
              <p>Aucune étape sélectionnée.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Share Dialog */}
      {sharePhase && (
        <DocumentShareDialog
          isOpen={isDocumentShareOpen}
          onClose={() => {
            setIsDocumentShareOpen(false);
            setSharePhase(null);
          }}
          tenderId={editingTender?.id || ''}
          phase={sharePhase.phase}
          phaseTitle={sharePhase.title}
        />
      )}

      {/* Tenders List */}
      <div className="grid gap-4">
        {tenders?.map((tender) => (
          <Card 
            key={tender.id} 
            className={`cursor-pointer transition-colors ${selectedTenderId === tender.id ? 'ring-2 ring-primary' : ''}`}
            onClick={() => onTenderSelect?.(tender)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{tender.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{tender.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(tender.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(tender);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(tender.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">
                Créé le {format(new Date(tender.created_at), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {tenders?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Aucun appel d'offres trouvé.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TenderCrud;