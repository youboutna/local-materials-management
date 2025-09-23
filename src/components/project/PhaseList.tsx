// components/project/PhaseList.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ConstructionPhase, ConstructionStage } from '@/types/project';

interface PhaseListProps {
  phases: any[];
  projectId: string;
}

interface PhaseFormData {
  phase_name: string;
  description: string;
  construction_phase: string;
  construction_stage: string;
  start_date: string;
  end_date: string;
  estimated_cost: string;
  estimated_duration: string;
  phase_methodology?: string;
}

const CONSTRUCTION_PHASES: Record<ConstructionPhase, string> = {
  'pre_construction': 'Pré-construction',
  'site_preparation': 'Préparation du site',
  'foundation': 'Fondations',
  'framing': 'Charpente',
  'structural_work': 'Travaux structurels',
  'finishing': 'Finitions',
  'post_construction': 'Post-construction',
  'handover': 'Livraison'
};

const CONSTRUCTION_STAGES: Record<ConstructionStage, string> = {
  'planning_design': 'Planification et conception',
  'permits_approvals': 'Permis et approbations',
  'site_clearing': 'Déblaiement du site',
  'excavation': 'Excavation',
  'foundation_work': 'Travaux de fondation',
  'structural_framing': 'Charpente structurelle',
  'roofing': 'Toiture',
  'electrical_plumbing': 'Électricité et plomberie',
  'interior_finishing': 'Finitions intérieures',
  'exterior_finishing': 'Finitions extérieures',
  'final_inspection': 'Inspection finale',
  'handover_complete': 'Livraison complète'
};

const PhaseList: React.FC<PhaseListProps> = ({ phases, projectId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<PhaseFormData>({
    phase_name: '',
    description: '',
    construction_phase: '',
    construction_stage: '',
    start_date: '',
    end_date: '',
    estimated_cost: '',
    estimated_duration: '30',
    phase_methodology: 'standard'
  });

  // Helper function to get Waterfall stages based on phase
  const getWaterfallStages = (phase: string) => {
    const waterfallStages = {
      planification: [
        ['estimation_ressources', 'Estimation des ressources financières'],
        ['planification_achats', 'Planification des achats par catégorie'],
        ['modalites_planification', 'Définition des modalités de planification']
      ],
      publicite: [
        ['publication_portail', 'Publication via le Portail National'],
        ['diffusion_journaux', 'Diffusion dans les journaux d\'annonces légales'],
        ['inscription_candidats', 'Inscription des candidats potentiels'],
        ['notification_opportunites', 'Notifications d\'opportunités aux candidats']
      ],
      reception_analyse: [
        ['soumission_dossiers', 'Soumission des dossiers techniques'],
        ['analyse_cpmp', 'Analyse par la CPMP'],
        ['assistance_sous_commission', 'Assistance de la sous-commission'],
        ['evaluation_conformite', 'Évaluation de la conformité des offres']
      ],
      attribution: [
        ['selection_prix', 'Sélection basée sur le prix'],
        ['choix_economique', 'Choix de l\'offre économiquement avantageuse'],
        ['publication_attribution', 'Publication de l\'avis d\'attribution'],
        ['signature_marche', 'Signature du marché avec l\'attributaire']
      ],
      controle_regulation: [
        ['controle_cncmp', 'Contrôle a priori et a posteriori par la CNCMP'],
        ['verification_regulier', 'Vérification de la régularité des procédures'],
        ['regulation_armp', 'Régulation par l\'ARMP'],
        ['commission_disciplinaire', 'Commission Disciplinaire pour les sanctions']
      ]
    };
    return waterfallStages[phase] || [];
  };

  const createPhaseMutation = useMutation({
    mutationFn: async (phaseData: PhaseFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('project_phases')
        .insert({
          project_id: projectId,
          phase_name: phaseData.phase_name,
          description: phaseData.description,
          construction_phase: phaseData.construction_phase || null,
          construction_stage: phaseData.construction_stage || null,
          start_date: phaseData.start_date || null,
          end_date: phaseData.end_date || null,
          estimated_cost: phaseData.estimated_cost ? parseFloat(phaseData.estimated_cost) : null,
          estimated_duration: phaseData.estimated_duration ? parseInt(phaseData.estimated_duration) : 30,
          status: 'not_started',
          progress: 0,
          created_by: user.id,
          phase_type: 'construction'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-phases', projectId] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-risks', projectId] });
      setIsCreating(false);
      resetForm();
      toast({ title: 'Phase créée avec succès' });
    },
    onError: (error) => {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de créer la phase',
        variant: 'destructive' 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      phase_name: '',
      description: '',
      construction_phase: '',
      construction_stage: '',
      start_date: '',
      end_date: '',
      estimated_cost: '',
      estimated_duration: '30',
      phase_methodology: 'standard'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPhaseMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Phases du projet</h3>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle phase
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle phase</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phase_name">Nom de la phase *</Label>
                  <Input
                    id="phase_name"
                    value={formData.phase_name}
                    onChange={(e) => setFormData({ ...formData, phase_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="estimated_duration">Durée estimée (jours)</Label>
                  <Input
                    id="estimated_duration"
                    type="number"
                    value={formData.estimated_duration}
                    onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="phase_methodology">Méthodologie de phase</Label>
                  <Select
                    value={formData.phase_methodology || 'standard'}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      phase_methodology: value,
                      construction_phase: '',
                      construction_stage: ''
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une méthodologie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Mauritanien</SelectItem>
                      <SelectItem value="waterfall">Waterfall/Cascade</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="construction_phase">
                      {formData.phase_methodology === 'waterfall' ? 'Phase Waterfall' : 'Phase de construction'}
                    </Label>
                    <Select
                      value={formData.construction_phase}
                      onValueChange={(value) => setFormData({ ...formData, construction_phase: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une phase" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.phase_methodology === 'waterfall' ? (
                          <>
                            <SelectItem value="planification">Planification</SelectItem>
                            <SelectItem value="publicite">Publicité</SelectItem>
                            <SelectItem value="reception_analyse">Réception et Analyse</SelectItem>
                            <SelectItem value="attribution">Attribution</SelectItem>
                            <SelectItem value="controle_regulation">Contrôle et Régulation</SelectItem>
                          </>
                        ) : (
                          Object.entries(CONSTRUCTION_PHASES).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="construction_stage">Étape</Label>
                    <Select
                      value={formData.construction_stage}
                      onValueChange={(value) => setFormData({ ...formData, construction_stage: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une étape" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.phase_methodology === 'waterfall' && formData.construction_phase ? (
                          getWaterfallStages(formData.construction_phase).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))
                        ) : (
                          Object.entries(CONSTRUCTION_STAGES).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Date de début</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Date de fin</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="estimated_cost">Coût estimé (€)</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  step="0.01"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreating(false)}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPhaseMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createPhaseMutation.isPending ? 'Création...' : 'Créer la phase'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {phases.map((phase, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{phase.phase}</span>
                <Badge className={getStatusColor(phase.status)}>
                  {phase.status === 'completed' ? 'Terminée' : 
                   phase.status === 'in_progress' ? 'En cours' : 
                   phase.status === 'delayed' ? 'En retard' : 'Non commencée'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={phase.progress || 0} />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{phase.startDate} → {phase.endDate}</span>
                  </div>
                  <span>{phase.progress || 0}% complet</span>
                </div>
                {phase.stages && phase.stages.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Étapes:</h4>
                    <div className="space-y-2">
                      {phase.stages.map((stage: any, stageIndex: number) => (
                        <div key={stageIndex} className="flex justify-between items-center text-sm">
                          <span>{stage.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {stage.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {phases.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-muted-foreground text-center mb-4">
              Aucune phase planifiée pour ce projet
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Planifier une phase
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PhaseList;