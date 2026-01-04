import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Target, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Sparkles,
  Trash2,
  Edit
} from 'lucide-react';
import { MilestoneService } from '@/services/MilestoneService';
import { getMilestoneTemplates } from '@/data/referential-milestones';
import { MilestoneDTO, MilestoneProgressDTO } from '@/types/milestone-dto';
import { format, parseISO, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PhaseMilestonesSectionProps {
  projectId: string;
  phaseId: string;
  phaseName: string;
  constructionPhase?: string;
  phaseStartDate?: string;
  readonly?: boolean;
}

const PhaseMilestonesSection: React.FC<PhaseMilestonesSectionProps> = ({
  projectId,
  phaseId,
  phaseName,
  constructionPhase,
  phaseStartDate,
  readonly = false
}) => {
  const [milestones, setMilestones] = useState<MilestoneDTO[]>([]);
  const [progress, setProgress] = useState<MilestoneProgressDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneDTO | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: '',
    weight: 0.2,
    notes: ''
  });

  // Check if referential templates are available
  const hasTemplates = constructionPhase ? getMilestoneTemplates(constructionPhase).length > 0 : false;

  useEffect(() => {
    loadData();
  }, [projectId, phaseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [milestonesData, progressData] = await Promise.all([
        MilestoneService.getPhaseMilestones(projectId, phaseId),
        MilestoneService.getMilestoneProgress(projectId, phaseId)
      ]);
      setMilestones(milestonesData);
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromTemplate = async () => {
    if (!constructionPhase || !phaseStartDate) {
      toast({
        title: 'Erreur',
        description: 'Phase de construction ou date de début manquante',
        variant: 'destructive'
      });
      return;
    }

    try {
      await MilestoneService.generateFromReferential(
        projectId,
        phaseId,
        constructionPhase,
        phaseStartDate
      );
      toast({
        title: 'Succès',
        description: 'Jalons générés depuis le référentiel'
      });
      loadData();
    } catch (error) {
      console.error('Error generating milestones:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer les jalons',
        variant: 'destructive'
      });
    }
  };

  const handleSave = async () => {
    try {
      if (editingMilestone) {
        await MilestoneService.updateMilestone(editingMilestone.id, formData);
        toast({ title: 'Jalon modifié' });
      } else {
        await MilestoneService.createMilestone(projectId, {
          ...formData,
          phase_id: phaseId
        });
        toast({ title: 'Jalon ajouté' });
      }
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving milestone:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le jalon',
        variant: 'destructive'
      });
    }
  };

  const handleToggleComplete = async (milestone: MilestoneDTO) => {
    try {
      await MilestoneService.toggleComplete(milestone.id);
      toast({
        title: milestone.status === 'completed' ? 'Jalon marqué en attente' : 'Jalon terminé'
      });
      loadData();
    } catch (error) {
      console.error('Error toggling milestone:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (milestoneId: string) => {
    if (!confirm('Supprimer ce jalon ?')) return;
    
    try {
      await MilestoneService.deleteMilestone(milestoneId);
      toast({ title: 'Jalon supprimé' });
      loadData();
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le jalon',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (milestone: MilestoneDTO) => {
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

  const resetForm = () => {
    setEditingMilestone(null);
    setFormData({
      title: '',
      description: '',
      target_date: phaseStartDate || '',
      weight: 0.2,
      notes: ''
    });
  };

  const getStatusInfo = (milestone: MilestoneDTO) => {
    const today = new Date();
    const targetDate = parseISO(milestone.target_date);
    
    if (milestone.status === 'completed') {
      return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' };
    }
    if (isBefore(targetDate, today)) {
      return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100' };
    }
    return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5 text-primary" />
          Jalons
          {milestones.length > 0 && (
            <Badge variant="outline">
              {progress?.completed_milestones || 0}/{milestones.length}
            </Badge>
          )}
        </CardTitle>
        
        {!readonly && (
          <div className="flex gap-2">
            {hasTemplates && milestones.filter(m => m.is_from_template).length === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateFromTemplate}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Générer depuis référentiel
              </Button>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingMilestone ? 'Modifier le jalon' : 'Nouveau jalon'}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
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
                      placeholder="Description optionnelle"
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
                    <Button onClick={handleSave} disabled={!formData.title || !formData.target_date}>
                      {editingMilestone ? 'Modifier' : 'Ajouter'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Progress bar */}
        {progress && milestones.length > 0 && (
          <div className="mb-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{progress.weighted_progress}%</span>
            </div>
            <Progress value={progress.weighted_progress} className="h-2" />
          </div>
        )}

        {milestones.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucun jalon défini</p>
            {hasTemplates && !readonly && (
              <p className="text-sm mt-1">
                Cliquez sur "Générer depuis référentiel" pour créer les jalons standards
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map((milestone) => {
              const status = getStatusInfo(milestone);
              const StatusIcon = status.icon;

              return (
                <div
                  key={milestone.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border",
                    milestone.status === 'completed' && "bg-muted/50"
                  )}
                >
                  <div className={cn("p-1.5 rounded-full", status.bg)}>
                    <StatusIcon className={cn("h-4 w-4", status.color)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn(
                          "font-medium",
                          milestone.status === 'completed' && "line-through text-muted-foreground"
                        )}>
                          {milestone.title}
                        </p>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {milestone.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>
                            Cible: {format(parseISO(milestone.target_date), 'd MMM yyyy', { locale: fr })}
                          </span>
                          {milestone.completed_date && (
                            <span className="text-green-600">
                              ✓ {format(parseISO(milestone.completed_date), 'd MMM', { locale: fr })}
                            </span>
                          )}
                          {milestone.is_from_template && (
                            <Badge variant="secondary" className="text-xs">
                              Référentiel
                            </Badge>
                          )}
                        </div>
                      </div>

                      {!readonly && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleComplete(milestone)}
                          >
                            {milestone.status === 'completed' ? 'Réouvrir' : 'Terminer'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(milestone)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(milestone.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhaseMilestonesSection;
