import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Target, Plus, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  target_date: string;
  completed_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  weight: number;
  notes?: string;
}

interface PhaseMilestonesProps {
  phaseId: string;
  projectId: string;
}

const PhaseMilestones: React.FC<PhaseMilestonesProps> = ({ phaseId, projectId }) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: '',
    weight: 0.1,
    notes: ''
  });

  useEffect(() => {
    loadMilestones();
  }, [phaseId, projectId]);

  const loadMilestones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('enhanced_project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .eq('phase_id', phaseId)
        .order('target_date', { ascending: true });

      if (error) throw error;
      const transformedData = (data || []).map(milestone => ({
        ...milestone,
        description: milestone.description || undefined,
        notes: milestone.notes || undefined,
        completed_date: milestone.completed_date || undefined,
        status: (milestone.status || 'pending') as 'pending' | 'in_progress' | 'completed' | 'delayed',
        weight: milestone.weight || 0.1
      }));
      setMilestones(transformedData);
    } catch (error) {
      console.error('Error loading milestones:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les jalons',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const milestoneData = {
        project_id: projectId,
        phase_id: phaseId,
        title: formData.title,
        description: formData.description,
        target_date: formData.target_date,
        weight: formData.weight,
        notes: formData.notes,
        status: 'pending'
      };

      let result;
      if (editingMilestone) {
        result = await supabase
          .from('enhanced_project_milestones')
          .update(milestoneData)
          .eq('id', editingMilestone.id);
      } else {
        result = await supabase
          .from('enhanced_project_milestones')
          .insert(milestoneData);
      }

      if (result.error) throw result.error;

      toast({
        title: 'Succès',
        description: editingMilestone ? 'Jalon modifié' : 'Jalon ajouté'
      });

      setIsDialogOpen(false);
      resetForm();
      loadMilestones();
    } catch (error) {
      console.error('Error saving milestone:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      title: milestone.title,
      description: milestone.description || '',
      target_date: milestone.target_date,
      weight: milestone.weight,
      notes: milestone.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleMarkCompleted = async (milestone: Milestone) => {
    try {
      const { error } = await supabase
        .from('enhanced_project_milestones')
        .update({
          status: milestone.status === 'completed' ? 'pending' : 'completed',
          completed_date: milestone.status === 'completed' ? null : new Date().toISOString().split('T')[0]
        })
        .eq('id', milestone.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: milestone.status === 'completed' ? 'Jalon marqué comme en attente' : 'Jalon marqué comme terminé'
      });

      loadMilestones();
    } catch (error) {
      console.error('Error updating milestone status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setEditingMilestone(null);
    setFormData({
      title: '',
      description: '',
      target_date: '',
      weight: 0.1,
      notes: ''
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'delayed': return <Clock className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  const calculateProgress = () => {
    if (milestones.length === 0) return 0;
    const completedWeight = milestones
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + m.weight, 0);
    const totalWeight = milestones.reduce((sum, m) => sum + m.weight, 0);
    return totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
  };

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Jalons de la Phase
          {milestones.length > 0 && (
            <Badge variant="outline">
              {Math.round(calculateProgress())}% complété
            </Badge>
          )}
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMilestone ? 'Modifier' : 'Ajouter'} un jalon
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titre du jalon"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du jalon"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_date">Date cible</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Poids (0.1 - 1.0)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes additionnelles"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave}>
                  {editingMilestone ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun jalon pour cette phase
          </div>
        ) : (
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="border rounded-lg p-4 hover:bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(milestone.status)}
                      <h4 className="font-medium">{milestone.title}</h4>
                      <Badge className={getStatusColor(milestone.status)}>
                        {milestone.status}
                      </Badge>
                      <Badge variant="outline">
                        Poids: {milestone.weight}
                      </Badge>
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {milestone.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        Cible: {new Date(milestone.target_date).toLocaleDateString()}
                      </div>
                      {milestone.completed_date && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Terminé: {new Date(milestone.completed_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkCompleted(milestone)}
                    >
                      {milestone.status === 'completed' ? 'Marquer en attente' : 'Marquer terminé'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(milestone)}
                    >
                      Modifier
                    </Button>
                  </div>
                </div>
                {milestone.notes && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Notes: {milestone.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhaseMilestones;