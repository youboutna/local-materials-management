
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
import { OFFICIAL_WORKFLOW_STEPS, OfficialWorkflowStep } from './OfficialWorkflowSteps';

interface Tender {
  id: string;
  title: string;
  description: string;
  project_id?: string;
  launch_date?: string;
  attribution_date?: string;
  selection_mode?: string;
  market_type?: string;
  financing_source?: string;
  project_reference?: string;
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
  const [isWorkflowSelectorOpen, setIsWorkflowSelectorOpen] = useState(false);
  const [selectedWorkflowSteps, setSelectedWorkflowSteps] = useState<OfficialWorkflowStep[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    launch_date: '',
    attribution_date: '',
    selection_mode: '',
    market_type: '',
    financing_source: '',
    project_reference: '',
    status: 'draft' as 'draft' | 'published' | 'closed' | 'awarded'
  });

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
      return data as Tender[] || [];
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

  // Create/Update tender mutation
  const tenderMutation = useMutation({
    mutationFn: async (tenderData: typeof formData) => {
      const dataToSubmit = {
        title: tenderData.title,
        description: tenderData.description,
        project_id: tenderData.project_id || null,
        launch_date: tenderData.launch_date || null,
        attribution_date: tenderData.attribution_date || null,
        selection_mode: tenderData.selection_mode || null,
        market_type: tenderData.market_type || null,
        financing_source: tenderData.financing_source || null,
        project_reference: tenderData.project_reference || null,
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
        if (selectedWorkflowSteps.length > 0) {
          const stepsToInsert = selectedWorkflowSteps.map((step, index) => ({
            tender_id: data.id,
            title: step.title,
            description: step.description,
            step_number: index + 1,
            required_documents: step.requiredDocuments || [],
            status: 'pending'
          }));

          const { error: stepsError } = await supabase
            .from('tender_steps')
            .insert(stepsToInsert);
          
          if (stepsError) {
            console.error('Error adding workflow steps:', stepsError);
            // Don't throw error, tender was created successfully
          }
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
      selection_mode: tender.selection_mode || '',
      market_type: tender.market_type || '',
      financing_source: tender.financing_source || '',
      project_reference: tender.project_reference || '',
      status: tender.status
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTender(null);
    setSelectedWorkflowSteps([]);
    setFormData({
      title: '',
      description: '',
      project_id: '',
      launch_date: '',
      attribution_date: '',
      selection_mode: '',
      market_type: '',
      financing_source: '',
      project_reference: '',
      status: 'draft'
    });
  };

  const handleSelectWorkflowStep = (step: OfficialWorkflowStep) => {
    if (!selectedWorkflowSteps.find(s => s.id === step.id)) {
      setSelectedWorkflowSteps(prev => [...prev, step]);
    }
    setIsWorkflowSelectorOpen(false);
  };

  const removeWorkflowStep = (stepId: number) => {
    setSelectedWorkflowSteps(prev => prev.filter(s => s.id !== stepId));
  };

  const getExistingStepIds = () => {
    return selectedWorkflowSteps.map(step => step.id);
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

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTender ? 'Modifier l\'Appel d\'Offres' : 'Créer un Nouvel Appel d\'Offres'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="project_id">Projet associé (optionnel)</Label>
                <Select 
                  value={formData.project_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger>
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
              
              <div>
                <Label htmlFor="launch_date">Date de lancement</Label>
                <Input
                  id="launch_date"
                  type="date"
                  value={formData.launch_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, launch_date: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="attribution_date">Date d'attribution</Label>
                <Input
                  id="attribution_date"
                  type="date"
                  value={formData.attribution_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, attribution_date: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'draft' | 'published' | 'closed' | 'awarded') => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
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
            </div>

            {/* Workflow Steps Section - only show during creation */}
            {!editingTender && (
              <div className="md:col-span-2 space-y-3">
                <Label>Étapes du Workflow Initial (optionnel)</Label>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setIsWorkflowSelectorOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Workflow className="h-4 w-4" />
                    Ajouter Étapes Officielles
                  </Button>
                </div>
                
                {selectedWorkflowSteps.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Étapes sélectionnées :</p>
                    <div className="space-y-2">
                      {selectedWorkflowSteps.map((step) => (
                        <div key={step.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">
                            Étape {step.id}: {step.title}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeWorkflowStep(step.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                  💡 Vous pourrez ajouter d'autres étapes personnalisées ou officielles après la création de l'appel d'offres dans la section "Workflow".
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit" disabled={tenderMutation.isPending}>
                {tenderMutation.isPending ? 'En cours...' : editingTender ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Workflow Step Selector */}
      <WorkflowStepSelector
        isOpen={isWorkflowSelectorOpen}
        onClose={() => setIsWorkflowSelectorOpen(false)}
        onSelectStep={handleSelectWorkflowStep}
        existingStepNumbers={getExistingStepIds()}
      />

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
