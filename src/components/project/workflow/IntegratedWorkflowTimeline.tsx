/**
 * IntegratedWorkflowTimeline - Jalons positionnés par rapport aux étapes
 * 
 * Vue unifiée: Étapes et Jalons sur une timeline chronologique
 * Les jalons sont positionnés relativement aux activités de la phase
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Flag,
  ShieldCheck,
  Package,
  CheckSquare,
  Play,
  Layers,
  TrendingUp,
  TrendingDown,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { getMilestoneService, MilestoneService } from '@/application/services/MilestoneService';
import { 
  MilestoneSummaryDTO, 
  MilestoneProgressDTO, 
  MilestoneType, 
  MilestonePriority,
  MILESTONE_TYPES,
  MILESTONE_PRIORITIES 
} from '@/dtos/entities/MilestoneDTO';
import { PhaseStepDTO } from '@/dtos/entities/PhaseDTO';
import { format, parseISO, isBefore, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface IntegratedWorkflowTimelineProps {
  projectId: string;
  phaseId: string;
  phaseName: string;
  steps: PhaseStepDTO[];
  phaseStartDate?: string;
  phaseEndDate?: string;
  onMilestoneClick?: (milestoneId: string) => void;
  onStepClick?: (step: PhaseStepDTO) => void;
}

interface TimelineItem {
  type: 'step' | 'milestone';
  id: string;
  title: string;
  date: string;
  endDate?: string;
  status: string;
  data: PhaseStepDTO | MilestoneSummaryDTO;
  milestoneType?: MilestoneType;
  priority?: string;
  isCritical?: boolean;
  progress?: number;
}

const IntegratedWorkflowTimeline: React.FC<IntegratedWorkflowTimelineProps> = ({
  projectId,
  phaseId,
  phaseName,
  steps,
  phaseStartDate,
  phaseEndDate,
  onMilestoneClick,
  onStepClick,
}) => {
  const [milestones, setMilestones] = useState<MilestoneSummaryDTO[]>([]);
  const [progress, setProgress] = useState<MilestoneProgressDTO | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog state for adding milestones
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: phaseStartDate || '',
    weight: 0.2,
    notes: '',
    type: 'checkpoint' as MilestoneType,
    priority: 'normal' as MilestonePriority
  });

  // Préconfigurations contextuelles par type de jalon
  const MILESTONE_PRESETS: Record<MilestoneType, {
    title: string;
    description: string;
    weight: number;
    priority: MilestonePriority;
    dateOffset: number; // jours depuis début phase
  }> = {
    checkpoint: {
      title: `Point d'avancement - ${phaseName}`,
      description: `Vérification de l'avancement des travaux de la phase ${phaseName}. Évaluer la progression, les ressources utilisées et les éventuels blocages.`,
      weight: 0.15,
      priority: 'normal',
      dateOffset: 7,
    },
    event: {
      title: `Démarrage de la phase ${phaseName}`,
      description: `Événement marquant le lancement officiel de la phase ${phaseName}. Mobilisation des équipes et des ressources.`,
      weight: 0.1,
      priority: 'high',
      dateOffset: 0,
    },
    gate: {
      title: `Validation qualité - ${phaseName}`,
      description: `Point de contrôle qualité obligatoire avant passage à l'étape suivante. Vérification de la conformité aux normes et spécifications.`,
      weight: 0.25,
      priority: 'critical',
      dateOffset: 14,
    },
    deliverable: {
      title: `Livrable - ${phaseName}`,
      description: `Livrable attendu pour la phase ${phaseName}. Document, rapport ou élément physique à fournir.`,
      weight: 0.2,
      priority: 'high',
      dateOffset: 21,
    },
  };

  useEffect(() => {
    loadMilestones();
  }, [projectId, phaseId]);

  const loadMilestones = async () => {
    try {
      setLoading(true);
      const milestoneService = getMilestoneService();
      const milestonesData = await milestoneService.getProjectMilestones(projectId);
      setMilestones(milestonesData as any);
      setProgress(null);
    } catch (error) {
      console.error('Error loading milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcul date cible selon offset
  const getTargetDate = (offsetDays: number): string => {
    const baseDate = phaseStartDate ? new Date(phaseStartDate) : new Date();
    baseDate.setDate(baseDate.getDate() + offsetDays);
    return baseDate.toISOString().split('T')[0];
  };

  // Appliquer preset quand le type change
  const applyPreset = (type: MilestoneType) => {
    const preset = MILESTONE_PRESETS[type];
    setFormData(prev => ({
      ...prev,
      type,
      title: preset.title,
      description: preset.description,
      weight: preset.weight,
      priority: preset.priority,
      target_date: getTargetDate(preset.dateOffset),
    }));
  };

  const handleAddMilestone = () => {
    // Par défaut, pré-remplir avec checkpoint
    const defaultType: MilestoneType = 'checkpoint';
    const preset = MILESTONE_PRESETS[defaultType];
    setFormData({
      title: preset.title,
      description: preset.description,
      target_date: getTargetDate(preset.dateOffset),
      weight: preset.weight,
      notes: '',
      type: defaultType,
      priority: preset.priority,
    });
    setIsDialogOpen(true);
  };

  const handleSaveMilestone = async () => {
    try {
      const milestoneService = getMilestoneService();
      await milestoneService.createMilestone({
        ...formData,
        phaseId: phaseId,
        projectId: projectId,
      } as any);
      toast({ title: 'Jalon ajouté avec succès' });
      setIsDialogOpen(false);
      loadMilestones();
    } catch (error) {
      console.error('Error saving milestone:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le jalon',
        variant: 'destructive'
      });
    }
  };

  // Build unified timeline combining steps and milestones
  const timelineItems: TimelineItem[] = React.useMemo(() => {
    const items: TimelineItem[] = [];

    // Add steps
    steps.forEach(step => {
      items.push({
        type: 'step',
        id: step.id,
        title: step.name,
        date: step.start_date || phaseStartDate || '',
        endDate: step.end_date,
        status: step.status,
        progress: step.progress,
        data: step,
      });
    });

    // Add milestones
    milestones.forEach(m => {
      items.push({
        type: 'milestone',
        id: m.id,
        title: m.title,
        date: m.targetDate,
        status: m.status,
        data: m,
        milestoneType: m.type,
        priority: m.priority,
        isCritical: m.isCritical,
      });
    });

    // Sort by date
    return items.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    });
  }, [steps, milestones, phaseStartDate]);

  const getStatusInfo = (item: TimelineItem) => {
    const today = new Date();
    
    if (item.type === 'milestone') {
      const targetDate = parseISO(item.date);
      
      if (item.status === 'completed') {
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Terminé' };
      }
      if (isBefore(targetDate, today)) {
        const daysLate = differenceInDays(today, targetDate);
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: `En retard (${daysLate}j)` };
      }
      return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'À venir' };
    }
    
    // Step status
    switch (item.status) {
      case 'completed': return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Terminée' };
      case 'in_progress': return { icon: Play, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'En cours' };
      case 'delayed': return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Retard' };
      default: return { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Planifiée' };
    }
  };

  const getTypeIcon = (type?: MilestoneType) => {
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
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <Card className="overflow-hidden">
        <div className={cn(
          "p-4",
          progress?.criticalPath_status === 'delayed' 
            ? "bg-gradient-to-r from-destructive/10 to-transparent" 
            : "bg-gradient-to-r from-primary/10 to-transparent"
        )}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Planification & Jalons</h3>
                <p className="text-sm text-muted-foreground">
                  {steps.length} étapes • {milestones.length} jalons
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {progress?.schedule_performance_index !== undefined && (
                <Badge 
                  variant={progress.schedule_performance_index >= 1 ? 'default' : 'destructive'}
                  className={cn(
                    "flex items-center gap-1",
                    progress.schedule_performance_index >= 1 && "bg-green-600"
                  )}
                >
                  {progress.schedule_performance_index >= 1 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  SPI: {progress.schedule_performance_index}
                </Badge>
              )}
              <Button size="sm" variant="outline" onClick={handleAddMilestone}>
                <Plus className="h-3 w-3 mr-1" /> Jalon
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          {progress && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progression pondérée</span>
                <span className="font-medium">{progress.weighted_progress}%</span>
              </div>
              <Progress value={progress.weighted_progress} className="h-2" />
            </div>
          )}

          {/* Status indicators */}
          <div className="flex flex-wrap gap-3 mt-3 text-sm">
            {progress?.overdue_milestones && progress.overdue_milestones.length > 0 && (
              <div className="flex items-center gap-1.5 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>{progress.overdue_milestones.length} en retard</span>
              </div>
            )}
            {progress?.upcoming_milestones && progress.upcoming_milestones.length > 0 && (
              <div className="flex items-center gap-1.5 text-amber-600">
                <Clock className="h-4 w-4" />
                <span>{progress.upcoming_milestones.length} à venir (14j)</span>
              </div>
            )}
            {progress?.critical_path_status && progress.critical_path_status !== 'on_track' && (
              <div className={cn(
                "flex items-center gap-1.5",
                progress.critical_path_status === 'delayed' ? 'text-destructive' : 'text-amber-600'
              )}>
                <ShieldCheck className="h-4 w-4" />
                <span>Chemin critique {progress.critical_path_status === 'delayed' ? 'en retard' : 'à risque'}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Integrated Timeline */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Timeline Étapes & Jalons
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timelineItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune étape ou jalon défini</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-4">
                {timelineItems.map((item, idx) => {
                  const status = getStatusInfo(item);
                  const StatusIcon = status.icon;
                  const TypeIcon = item.type === 'milestone' ? getTypeIcon(item.milestoneType) : Layers;
                  const isStep = item.type === 'step';

                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className={cn(
                        "relative pl-14 cursor-pointer transition-all rounded-lg p-3",
                        "hover:bg-muted/50",
                        isStep ? "border-2 border-primary/20 bg-primary/5" : "border border-border",
                        item.isCritical && item.status !== 'completed' && "ring-2 ring-destructive/30"
                      )}
                      onClick={() => {
                        if (isStep && onStepClick) {
                          onStepClick(item.data as PhaseStepDTO);
                        } else if (!isStep && onMilestoneClick) {
                          onMilestoneClick(item.id);
                        }
                      }}
                    >
                      {/* Timeline dot */}
                      <div className={cn(
                        "absolute left-3.5 top-4 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-background",
                        isStep ? "border-primary" : status.color.replace('text-', 'border-')
                      )}>
                        {isStep ? (
                          <span className="text-xs font-bold text-primary">{idx + 1}</span>
                        ) : (
                          <StatusIcon className={cn("h-3 w-3", status.color)} />
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={isStep ? 'default' : 'outline'} className="text-xs">
                              {isStep ? 'ÉTAPE' : MILESTONE_TYPES[item.milestoneType!]?.label || 'Jalon'}
                            </Badge>
                            <p className={cn(
                              "font-medium",
                              item.status === 'completed' && "line-through opacity-60"
                            )}>
                              {item.title}
                            </p>
                            {item.isCritical && (
                              <Badge variant="destructive" className="text-xs">Critique</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {item.date ? format(parseISO(item.date), 'd MMM yyyy', { locale: fr }) : '—'}
                                {item.endDate && ` → ${format(parseISO(item.endDate), 'd MMM', { locale: fr })}`}
                              </span>
                            </div>
                            <Badge className={cn("text-xs", status.bg, status.color)}>
                              {status.label}
                            </Badge>
                          </div>

                          {/* Progress bar for steps */}
                          {isStep && item.progress !== undefined && (
                            <div className="flex items-center gap-2 mt-2">
                              <Progress value={item.progress} className="flex-1 h-1.5" />
                              <span className="text-xs font-medium">{item.progress}%</span>
                            </div>
                          )}
                        </div>

                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Milestone Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau jalon</DialogTitle>
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
            
            {/* Type and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => applyPreset(value as MilestoneType)}
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
              <Button onClick={handleSaveMilestone} disabled={!formData.title || !formData.target_date}>
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegratedWorkflowTimeline;
