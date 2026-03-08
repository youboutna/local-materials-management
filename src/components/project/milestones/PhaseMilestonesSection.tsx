import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getMilestoneTemplates } from '@/config/referentials/milestones.referential';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getMilestoneService } from '@/application/services/MilestoneService';
import {
  MILESTONE_PRIORITIES,
  MILESTONE_TYPES,
  MilestoneDTO,
  MilestonePriority,
  MilestoneProgressDTO,
  MilestoneType
} from '@/dtos/entities/MilestoneDTO';
import { format, isBefore, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertTriangle,
  CheckCircle,
  CheckSquare,
  Clock,
  Edit,
  Flag,
  Package,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

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
    notes: '',
    type: 'checkpoint' as MilestoneType,
    priority: 'normal' as MilestonePriority
  });

  const milestoneService = getMilestoneService();
  const hasTemplates = constructionPhase ? getMilestoneTemplates(constructionPhase).length > 0 : false;

  useEffect(() => {
    loadData();
  }, [projectId, phaseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const milestonesData = await milestoneService.getProjectMilestones(projectId);
      // Filter by phase - milestones don't have phase_id natively, use as any
      const phaseMilestones = milestonesData.filter((m: any) => m.phase_id === phaseId);
      setMilestones(phaseMilestones as unknown as MilestoneDTO[]);
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
      // Generate milestones from templates manually
      const templates = getMilestoneTemplates(constructionPhase);
      for (const template of templates) {
        await milestoneService.createMilestone({
          project_id: projectId,
          title: template.name,
          description: template.description || '',
          target_date: phaseStartDate,
          priority: 'medium',
        });
      }
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
        await milestoneService.updateMilestone(editingMilestone.id, formData as any);
        toast({ title: 'Jalon modifié' });
      } else {
        await milestoneService.createMilestone({
          project_id: projectId,
          title: formData.title,
          description: formData.description,
          target_date: formData.target_date,
          priority: formData.priority as any,
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
      const newStatus = milestone.status === 'completed' ? 'pending' : 'completed';
      await milestoneService.updateMilestone(milestone.id, { status: newStatus } as any);
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
      await milestoneService.deleteMilestone(milestoneId);
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
      target_date: milestone.targetDate,
      weight: milestone.weight,
      notes: milestone.notes || '',
      type: milestone.type || 'checkpoint',
      priority: milestone.priority || 'normal'
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
      notes: '',
      type: 'checkpoint',
      priority: 'normal'
    });
  };

  const getStatusInfo = (milestone: MilestoneDTO) => {
    const today = new Date();
    const targetDate = parseISO(milestone.targetDate);
    
    if (milestone.status === 'completed') {
      return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' };
    }
    if (isBefore(targetDate, today)) {
      return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100' };
    }
    return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100' };
  };

  const getTypeIcon = (type: MilestoneType) => {
    switch (type) {
      case 'gate': return ShieldCheck;
      case 'deliverable': return Package;
      case 'event': return Flag;
      case 'checkpoint':
      default: return CheckSquare;
    }
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
              {milestones.filter(m => m.status === 'completed').length}/{milestones.length}
            </Badge>
          )}
        </CardTitle>
        
        {!readonly && (
          <div className="flex gap-2">
            {hasTemplates && milestones.filter(m => m.isFromTemplate).length === 0 && (
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
              <DialogContent className="max-w-md">
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
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value as MilestoneType })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(MILESTONE_TYPES).map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priorité</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData({ ...formData, priority: value as MilestonePriority })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(MILESTONE_PRIORITIES).map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
              const TypeIcon = getTypeIcon(milestone.type);

              return (
                <div
                  key={milestone.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border",
                    milestone.status === 'completed' && "bg-muted/50",
                    milestone.priority === 'critical' && milestone.status !== 'completed' && "border-red-200"
                  )}
                >
                  <div className={cn("p-1.5 rounded-full", status.bg)}>
                    <StatusIcon className={cn("h-4 w-4", status.color)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "font-medium",
                            milestone.status === 'completed' && "line-through text-muted-foreground"
                          )}>
                            {milestone.title}
                          </p>
                          <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {milestone.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span>
                            Cible: {format(parseISO(milestone.targetDate), 'd MMM yyyy', { locale: fr })}
                          </span>
                          {milestone.completedDate && (
                            <span className="text-green-600">
                              ✓ {format(parseISO(milestone.completedDate), 'd MMM', { locale: fr })}
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {MILESTONE_TYPES[milestone.type]?.label || 'Checkpoint'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Poids: {Math.round((milestone.weight || 0.2) * 100)}%
                          </Badge>
                        </div>
                      </div>

                      {!readonly && (
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleToggleComplete(milestone)}
                          >
                            <CheckCircle className={cn(
                              "h-4 w-4",
                              milestone.status === 'completed' ? "text-green-500" : "text-muted-foreground"
                            )} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleEdit(milestone)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive"
                            onClick={() => handleDelete(milestone.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
