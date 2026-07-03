import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, Eye, Workflow, Search, Calendar, FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';
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
import {
  useTenders,
  useProjectsForTenders,
  useTenderMutation,
  useDeleteTender,
  TenderFormData
} from '@/hooks/hexagonal'
import { TenderDTO } from '@/dtos/entities/TenderDTO';
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';

// Local type aliases for backward compatibility
type Tender = TenderDTO & {
  // Legacy snake_case properties for backward compatibility
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
};
type Project = ProjectDTO;

interface TenderCrudProps {
  onTenderSelect?: (tender: Tender) => void;
  selectedTenderId?: string;
}

// Convert a timestamp/ISO string to HTML input datetime-local value (YYYY-MM-DDTHH:mm)
const toInputDateTime = (value?: string | null): string => {
  if (!value) return '';
  // If it's already in the right format without seconds/timezone
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

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

  // Use hexagonal hooks
  const { data: tenders = [], isLoading: tendersLoading } = useTenders();
  const { data: projects = [], isLoading: projectsLoading } = useProjectsForTenders();
  const tenderMutation = useTenderMutation();
  const deleteTenderMutation = useDeleteTender();

  // Handle phase selection - auto-select all stages of phase
  const handleSelectProcurementPhase = (phase: ProcurementPhase) => {
    const phaseStages = PROCUREMENT_STAGES[phase];
    const newSteps = phaseStages.map(stage => ({
      phase,
      stage,
      selected_documents: [] as string[]
    }));

    setSelectedProcurementSteps(prev => {
      // Remove existing steps for this phase
      const filtered = prev.filter(step => step.phase !== phase);
      return [...filtered, ...newSteps];
    });
  };

  // Handle individual stage selection
  const handleSelectProcurementStage = (phase: ProcurementPhase, stage: { value: ProcurementStage; label: string }) => {
    setSelectedProcurementSteps(prev => {
      const existing = prev.find(step => step.phase === phase && step.stage.value === stage.value);
      if (existing) {
        // Remove if already selected
        return prev.filter(step => !(step.phase === phase && step.stage.value === stage.value));
      } else {
        // Add new stage
        return [...prev, { phase, stage, selected_documents: [] }];
      }
    });
  };

  // Handle document selection for a specific step
  const handleStepDocumentSelection = (phase: ProcurementPhase, stageValue: ProcurementStage, documents: string[]) => {
    setSelectedProcurementSteps(prev => 
      prev.map(step => 
        (step.phase === phase && step.stage.value === stageValue)
          ? { ...step, selected_documents: documents }
          : step
      )
    );
  };

  // Reset form
  const resetForm = () => {
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
    setSelectedProcurementSteps([]);
    setEditingTender(null);
  };

  // Open dialog for new tender
  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for editing
  const openEditDialog = (tender: Tender) => {
    setEditingTender(tender);
    setFormData({
      title: tender.title || '',
      description: tender.description || '',
      project_id: tender.projectId || tender.project_id || '',
      launch_date: toInputDateTime(tender.launchDate || tender.launch_date),
      attribution_date: toInputDateTime(tender.attributionDate || tender.attribution_date),
      deadline_date: toInputDateTime(tender.deadlineDate || tender.deadline_date),
      submission_deadline: toInputDateTime(tender.submissionDeadline || tender.submission_deadline),
      evaluation_deadline: toInputDateTime(tender.evaluationDeadline || tender.evaluation_deadline),
      selection_mode: tender.selectionMode || tender.selection_mode || '',
      market_type: tender.marketType || tender.market_type || '',
      financing_source: tender.financingSource || tender.financing_source || '',
      project_reference: tender.projectReference || tender.project_reference || '',
      current_phase: tender.currentPhase?.toString() || tender.current_phase || '',
      current_stage: tender.currentStage || tender.current_stage || '',
      procurement_type: tender.procurementType || tender.procurement_type || '',
      estimated_value: (tender.estimatedValue || tender.estimated_value)?.toString() || '',
      status: (tender.status === 'cancelled' ? 'closed' : tender.status) as 'draft' | 'published' | 'closed' | 'awarded'
    });
    setIsDialogOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await tenderMutation.mutateAsync({
        formData,
        editingTenderId: editingTender?.id,
        procurementSteps: selectedProcurementSteps
      });
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving tender:', error);
    }
  };

  // Handle delete
  const handleDelete = async (tenderId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet appel d\'offres ?')) {
      try {
        await deleteTenderMutation.mutateAsync(tenderId);
      } catch (error) {
        console.error('Error deleting tender:', error);
      }
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      closed: 'bg-red-100 text-red-800',
      awarded: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const isLoading = tendersLoading || projectsLoading;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Workflow className="h-5 w-5" />
          Gestion des Appels d'Offres
        </CardTitle>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouvel Appel d'Offres
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : (
          <TenderListView
            tenders={tenders as any[]}
            projects={projects}
            selectedTenderId={selectedTenderId}
            onSelect={(t) => onTenderSelect?.(t as any)}
            onEdit={(t) => openEditDialog(t as any)}
            onDelete={(id) => handleDelete(id)}
          />
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTender ? 'Modifier l\'Appel d\'Offres' : 'Nouvel Appel d\'Offres'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="project_id">Projet associé</Label>
                <Select 
                  value={formData.project_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="launch_date">Date de lancement</Label>
                <Input
                  id="launch_date"
                  type="datetime-local"
                  value={formData.launch_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, launch_date: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="submission_deadline">Date limite de soumission</Label>
                <Input
                  id="submission_deadline"
                  type="datetime-local"
                  value={formData.submission_deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, submission_deadline: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="selection_mode">Mode de sélection</Label>
                <Select 
                  value={formData.selection_mode} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, selection_mode: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mode de sélection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Ouvert</SelectItem>
                    <SelectItem value="restricted">Restreint</SelectItem>
                    <SelectItem value="negotiated">Négocié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="market_type">Type de marché</Label>
                <Select 
                  value={formData.market_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, market_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type de marché" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Privé</SelectItem>
                    <SelectItem value="mixed">Mixte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="estimated_value">Valeur estimée (â‚¬)</Label>
                <Input
                  id="estimated_value"
                  type="number"
                  value={formData.estimated_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_value: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Workflow de passation</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProcurementWorkflowSelectorOpen(true)}
                className="w-full"
              >
                {selectedProcurementSteps.length > 0 
                  ? `${selectedProcurementSteps.length} étape(s) sélectionnée(s)`
                  : 'Sélectionner les étapes du workflow'
                }
              </Button>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={tenderMutation.isPending}>
                {tenderMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ProcurementStepSelector
        isOpen={isProcurementWorkflowSelectorOpen}
        onClose={() => setIsProcurementWorkflowSelectorOpen(false)}
        onSelectStep={(phase, stage, selectedDocuments) => {
          handleSelectProcurementStage(phase, stage);
          if (selectedDocuments) {
            handleStepDocumentSelection(phase, stage.value, selectedDocuments);
          }
        }}
        existingSteps={selectedProcurementSteps}
      />
    </Card>
  );
};

export default TenderCrud;
