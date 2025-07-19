import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Users, 
  Package, 
  Building,
  Clock,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectPhase {
  id: string;
  project_id: string;
  phase_name: string;
  phase_type: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  progress: number | null;
  description: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  dependencies: any;
  milestones: any;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface ProjectPhasesProps {
  projectId: string;
  onUpdate?: () => void;
}

const ProjectPhases: React.FC<ProjectPhasesProps> = ({ projectId, onUpdate }) => {
  const { t } = useLanguage();
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<ProjectPhase | null>(null);
  const [newPhase, setNewPhase] = useState({
    phase_name: '',
    phase_type: 'construction',
    start_date: '',
    end_date: '',
    status: 'pending',
    progress: 0,
    description: '',
    estimated_cost: 0
  });

  const fetchProjectPhases = async () => {
    try {
      const { data, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setPhases(data || []);
    } catch (error) {
      console.error('Error fetching project phases:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les phases du projet.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectPhases();
  }, [projectId]);

  const handleAddPhase = async () => {
    try {
      const phaseToAdd = {
        ...newPhase,
        project_id: projectId,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { error } = await supabase
        .from('project_phases')
        .insert(phaseToAdd);

      if (error) throw error;

      toast({
        title: "Phase ajoutée",
        description: "La nouvelle phase a été ajoutée avec succès.",
      });

      setIsAddDialogOpen(false);
      setNewPhase({
        phase_name: '',
        phase_type: 'construction',
        start_date: '',
        end_date: '',
        status: 'pending',
        progress: 0,
        description: '',
        estimated_cost: 0
      });
      fetchProjectPhases();
      onUpdate?.();
    } catch (error) {
      console.error('Error adding phase:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la phase.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePhase = async (updatedPhase: ProjectPhase) => {
    try {
      const { error } = await supabase
        .from('project_phases')
        .update({
          phase_name: updatedPhase.phase_name,
          phase_type: updatedPhase.phase_type,
          start_date: updatedPhase.start_date,
          end_date: updatedPhase.end_date,
          status: updatedPhase.status,
          progress: updatedPhase.progress,
          description: updatedPhase.description,
          estimated_cost: updatedPhase.estimated_cost,
          actual_cost: updatedPhase.actual_cost
        })
        .eq('id', updatedPhase.id);

      if (error) throw error;

      toast({
        title: "Phase mise à jour",
        description: "La phase a été mise à jour avec succès.",
      });

      setEditingPhase(null);
      fetchProjectPhases();
      onUpdate?.();
    } catch (error) {
      console.error('Error updating phase:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la phase.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette phase ?")) return;

    try {
      const { error } = await supabase
        .from('project_phases')
        .delete()
        .eq('id', phaseId);

      if (error) throw error;

      toast({
        title: "Phase supprimée",
        description: "La phase a été supprimée avec succès.",
      });

      fetchProjectPhases();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting phase:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la phase.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in_progress': return 'En cours';
      case 'delayed': return 'Retardé';
      case 'pending': return 'En attente';
      default: return 'Non défini';
    }
  };

  const calculateTotalBudget = () => {
    return phases.reduce((total, phase) => total + (phase.estimated_cost || 0), 0);
  };

  const calculateTotalActualCost = () => {
    return phases.reduce((total, phase) => total + (phase.actual_cost || 0), 0);
  };

  const calculateAverageProgress = () => {
    if (phases.length === 0) return 0;
    const totalProgress = phases.reduce((total, phase) => total + (phase.progress || 0), 0);
    return Math.round(totalProgress / phases.length);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-adrar-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Phases du projet
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une phase
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Ajouter une nouvelle phase</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nom de la phase</Label>
                      <Input
                        value={newPhase.phase_name}
                        onChange={(e) => setNewPhase({ ...newPhase, phase_name: e.target.value })}
                        placeholder="Ex: Fondations"
                      />
                    </div>
                    <div>
                      <Label>Type de phase</Label>
                      <Select 
                        value={newPhase.phase_type} 
                        onValueChange={(value) => setNewPhase({ ...newPhase, phase_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="construction">Construction</SelectItem>
                          <SelectItem value="planning">Planification</SelectItem>
                          <SelectItem value="finishing">Finitions</SelectItem>
                          <SelectItem value="inspection">Inspection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newPhase.description}
                      onChange={(e) => setNewPhase({ ...newPhase, description: e.target.value })}
                      placeholder="Description détaillée de la phase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date de début</Label>
                      <Input
                        type="date"
                        value={newPhase.start_date}
                        onChange={(e) => setNewPhase({ ...newPhase, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Date de fin</Label>
                      <Input
                        type="date"
                        value={newPhase.end_date}
                        onChange={(e) => setNewPhase({ ...newPhase, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Budget estimé (MRU)</Label>
                      <Input
                        type="number"
                        value={newPhase.estimated_cost}
                        onChange={(e) => setNewPhase({ ...newPhase, estimated_cost: parseInt(e.target.value) || 0 })}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label>Statut</Label>
                      <Select 
                        value={newPhase.status} 
                        onValueChange={(value) => setNewPhase({ ...newPhase, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="in_progress">En cours</SelectItem>
                          <SelectItem value="completed">Terminé</SelectItem>
                          <SelectItem value="delayed">Retardé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddPhase} disabled={!newPhase.phase_name.trim()}>
                      Ajouter la phase
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-adrar-600">{phases.length}</p>
              <p className="text-sm text-gray-600">Phases totales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-terracotta-600">
                {calculateTotalBudget().toLocaleString('fr-FR')} MRU
              </p>
              <p className="text-sm text-gray-600">Budget total estimé</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {calculateTotalActualCost().toLocaleString('fr-FR')} MRU
              </p>
              <p className="text-sm text-gray-600">Coût réel</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{calculateAverageProgress()}%</p>
              <p className="text-sm text-gray-600">Progression moyenne</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phases List */}
      {phases.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune phase définie</h3>
            <p className="text-gray-600 mb-4">
              Commencez par ajouter des phases à ce projet pour organiser les travaux et ressources.
            </p>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une phase
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {phases.map((phase) => (
            <Card key={phase.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg">{phase.phase_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{phase.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{phase.phase_type}</Badge>
                      <Badge className={getStatusColor(phase.status)}>
                        {getStatusLabel(phase.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPhase(phase)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePhase(phase.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Période</p>
                      <p className="text-sm">
                        {phase.start_date ? new Date(phase.start_date).toLocaleDateString() : 'Non défini'} - 
                        {phase.end_date ? new Date(phase.end_date).toLocaleDateString() : 'Non défini'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Budget estimé</p>
                      <p className="text-sm font-medium">
                        {(phase.estimated_cost || 0).toLocaleString('fr-FR')} MRU
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Coût réel</p>
                      <p className="text-sm font-medium">
                        {(phase.actual_cost || 0).toLocaleString('fr-FR')} MRU
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Progression</p>
                      <p className="text-sm font-medium">{phase.progress || 0}%</p>
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${phase.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* TODO: Add materials and human resources per phase here */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Matériaux associés</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      À implémenter - Liste des matériaux nécessaires pour cette phase
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Ressources humaines</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      À implémenter - Équipe et rôles assignés à cette phase
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Phase Dialog */}
      {editingPhase && (
        <Dialog open={true} onOpenChange={() => setEditingPhase(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier la phase: {editingPhase.phase_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom de la phase</Label>
                  <Input
                    value={editingPhase.phase_name}
                    onChange={(e) => setEditingPhase({ ...editingPhase, phase_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Type de phase</Label>
                  <Select 
                    value={editingPhase.phase_type} 
                    onValueChange={(value) => setEditingPhase({ ...editingPhase, phase_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="planning">Planification</SelectItem>
                      <SelectItem value="finishing">Finitions</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingPhase.description || ''}
                  onChange={(e) => setEditingPhase({ ...editingPhase, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date de début</Label>
                  <Input
                    type="date"
                    value={editingPhase.start_date || ''}
                    onChange={(e) => setEditingPhase({ ...editingPhase, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Date de fin</Label>
                  <Input
                    type="date"
                    value={editingPhase.end_date || ''}
                    onChange={(e) => setEditingPhase({ ...editingPhase, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Budget estimé (MRU)</Label>
                  <Input
                    type="number"
                    value={editingPhase.estimated_cost || 0}
                    onChange={(e) => setEditingPhase({ ...editingPhase, estimated_cost: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div>
                  <Label>Coût réel (MRU)</Label>
                  <Input
                    type="number"
                    value={editingPhase.actual_cost || 0}
                    onChange={(e) => setEditingPhase({ ...editingPhase, actual_cost: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div>
                  <Label>Progression (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editingPhase.progress || 0}
                    onChange={(e) => setEditingPhase({ ...editingPhase, progress: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label>Statut</Label>
                <Select 
                  value={editingPhase.status} 
                  onValueChange={(value) => setEditingPhase({ ...editingPhase, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="delayed">Retardé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingPhase(null)}>
                  Annuler
                </Button>
                <Button onClick={() => handleUpdatePhase(editingPhase)}>
                  Sauvegarder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProjectPhases;