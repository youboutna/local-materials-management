import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Calendar, FileText } from 'lucide-react';
import { getWorkflowStepService } from '@/application/services/WorkflowStepService';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface WorkflowStepsManagerProps {
  tenderId: string;
}

const PROCUREMENT_PHASES = [
  'preparation',
  'publication',
  'soumission',
  'evaluation',
  'attribution',
  'execution'
];

const PROCUREMENT_STAGES = [
  'planning',
  'documentation',
  'publication_avis',
  'reception_offres',
  'analyse_technique',
  'analyse_financiere',
  'negociation',
  'attribution_marche',
  'signature_contrat',
  'execution_travaux'
];

const WorkflowStepsManager = ({ tenderId }: WorkflowStepsManagerProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [stepData, setStepData] = useState({
    title: '',
    description: '',
    step_number: 1,
    procurement_phase: '',
    procurement_stage: '',
    required_documents: [] as string[],
    status: 'pending'
  });

  const [newRequiredDoc, setNewRequiredDoc] = useState('');

  const handleCreateStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepData.title.trim()) return;

    setIsCreating(true);
    try {
      const svc = getWorkflowStepService();
      await svc.createWorkflowStep({
        tender_id: tenderId,
        title: stepData.title,
        description: stepData.description,
        step_number: stepData.step_number,
        procurement_phase: stepData.procurement_phase,
        procurement_stage: stepData.procurement_stage,
        required_documents: stepData.required_documents,
        status: stepData.status,
      });

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['workflow-steps', tenderId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-progress', tenderId] });

      toast({
        title: 'Étape créée',
        description: 'L\'étape du workflow a été créée avec succès.',
      });

      // Reset form
      setStepData({
        title: '',
        description: '',
        step_number: stepData.step_number + 1,
        procurement_phase: '',
        procurement_stage: '',
        required_documents: [],
        status: 'pending'
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating workflow step:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la création de l\'étape.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const addRequiredDocument = () => {
    if (newRequiredDoc.trim() && !stepData.required_documents.includes(newRequiredDoc.trim())) {
      setStepData(prev => ({
        ...prev,
        required_documents: [...prev.required_documents, newRequiredDoc.trim()]
      }));
      setNewRequiredDoc('');
    }
  };

  const removeRequiredDocument = (doc: string) => {
    setStepData(prev => ({
      ...prev,
      required_documents: prev.required_documents.filter(d => d !== doc)
    }));
  };

  return (
    <div>
      <Button 
        onClick={() => setIsCreateDialogOpen(true)}
        className="mb-4"
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une étape
      </Button>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle étape</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateStep} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="step-number">Numéro d'étape</Label>
                <Input
                  id="step-number"
                  type="number"
                  min="1"
                  value={stepData.step_number}
                  onChange={(e) => setStepData(prev => ({
                    ...prev,
                    step_number: parseInt(e.target.value) || 1
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select 
                  value={stepData.status} 
                  onValueChange={(value) => setStepData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminée</SelectItem>
                    <SelectItem value="approved">Approuvée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Titre de l'étape *</Label>
              <Input
                id="title"
                value={stepData.title}
                onChange={(e) => setStepData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Préparation du dossier technique"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={stepData.description}
                onChange={(e) => setStepData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description détaillée de l'étape..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="procurement-phase">Phase de marché</Label>
                <Select 
                  value={stepData.procurement_phase} 
                  onValueChange={(value) => setStepData(prev => ({ ...prev, procurement_phase: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCUREMENT_PHASES.map(phase => (
                      <SelectItem key={phase} value={phase}>
                        {phase.charAt(0).toUpperCase() + phase.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="procurement-stage">Étape de procédure</Label>
                <Select 
                  value={stepData.procurement_stage} 
                  onValueChange={(value) => setStepData(prev => ({ ...prev, procurement_stage: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une étape" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCUREMENT_STAGES.map(stage => (
                      <SelectItem key={stage} value={stage}>
                        {stage.replace(/_/g, ' ').charAt(0).toUpperCase() + stage.replace(/_/g, ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Documents requis</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newRequiredDoc}
                    onChange={(e) => setNewRequiredDoc(e.target.value)}
                    placeholder="Nom du document requis"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequiredDocument())}
                  />
                  <Button type="button" onClick={addRequiredDocument} size="sm">
                    Ajouter
                  </Button>
                </div>
                
                {stepData.required_documents.length > 0 && (
                  <div className="space-y-1">
                    {stepData.required_documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{doc}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRequiredDocument(doc)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isCreating || !stepData.title.trim()}>
                {isCreating ? 'Création...' : 'Créer l\'étape'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowStepsManager;