/**
 * InspectionFormWithContext - Formulaire d'inspection enrichi avec contexte
 * Pré-remplit les champs grâce au CheckpointActionContextService
 * Harmonisé avec les types d'inspection de AdvancedInspectionScheduler
 * Envoie des notifications après création
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clipboard, CheckSquare, AlertTriangle, Info, Loader2, Bell } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
type InspectionStatusLocal = 'approved' | 'requires_changes' | 'rejected' | 'pending';
import { InspectorSelector } from '@/components/selectors/InspectorSelector';
import { useInspectionActionContext } from '@/hooks/useCheckpointActionContext';
import { MilestoneActionContext } from '@/components/project/milestones';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NotificationService } from '@/application/services/NotificationService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { supabase } from '@/integrations/supabase/client';

// Types d'inspection harmonisés avec AdvancedInspectionScheduler
const INSPECTION_TYPES = [
  { value: 'quality', label: 'Contrôle Qualité' },
  { value: 'safety', label: 'Sécurité' },
  { value: 'progress', label: 'Avancement des Travaux' },
  { value: 'compliance', label: 'Conformité Réglementaire' },
  { value: 'materials', label: 'Contrôle Matériaux' },
  { value: 'structural', label: 'Contrôle Structurel' },
  { value: 'final', label: 'Réception Définitive' }
];

interface InspectionFormWithContextProps {
  projectId: string;
  milestoneContext?: MilestoneActionContext;
  isOpen: boolean;
  onClose: () => void;
  onInspectionCreated?: () => void;
}

export function InspectionFormWithContext({
  projectId,
  milestoneContext,
  isOpen,
  onClose,
  onInspectionCreated
}: InspectionFormWithContextProps) {
  const { toast } = useToast();
  
  // Fetch full context using the service
  const { data: context, isLoading: contextLoading } = useInspectionActionContext(
    isOpen ? projectId : undefined,
    milestoneContext?.milestoneId,
    milestoneContext?.phaseId
  );

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [inspectorId, setInspectorId] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [status, setStatus] = useState<InspectionStatusLocal>('pending');
  const [inspectionType, setInspectionType] = useState('progress');
  const [comments, setComments] = useState('');
  const [progress, setProgress] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [notifyHierarchy, setNotifyHierarchy] = useState(true);

  // Pre-fill form when context is loaded
  useEffect(() => {
    if (context) {
      setProgress(context.suggestedProgress || context.project.progress);
      // Auto-select inspection type based on context
      if (context.inspectionType) {
        const mappedType = context.inspectionType === 'technical' ? 'structural' : 
                          context.inspectionType === 'regulatory' ? 'compliance' : 
                          context.inspectionType;
        setInspectionType(mappedType);
      }
    }
  }, [context]);

  // Pre-fill from milestone context
  useEffect(() => {
    if (milestoneContext?.suggestedProgress) {
      setProgress(milestoneContext.suggestedProgress);
    }
  }, [milestoneContext]);

  const handleChecklistToggle = (item: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(item)) {
      newChecked.delete(item);
    } else {
      newChecked.add(item);
    }
    setCheckedItems(newChecked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inspectorId || !inspectorName) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez sélectionner un inspecteur",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Build comments with checklist items and inspection type
      const inspectionTypeLabel = INSPECTION_TYPES.find(t => t.value === inspectionType)?.label || inspectionType;
      let fullComments = `Type: ${inspectionTypeLabel}\n\n${comments}`;
      if (checkedItems.size > 0) {
        const checklistSummary = Array.from(checkedItems).map(item => `✓ ${item}`).join('\n');
        fullComments = `${fullComments}\n\n--- Points de contrôle validés ---\n${checklistSummary}`;
      }

      const { data: inspection, error } = await supabase
        .from('inspections')
        .insert({
          project_id: projectId,
          date: format(date, 'yyyy-MM-dd'),
          status,
          inspector: inspectorName,
          progress_at_inspection: progress,
          comments: fullComments || null,
          phase_id: context?.linkedPhase?.id || milestoneContext?.phaseId || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update milestone if linked
      if (milestoneContext?.milestoneId && status === 'approved') {
        await RepositoryFactory.getMilestoneRepository().update(milestoneContext.milestoneId, {
            status: 'completed',
            completion_date: format(new Date(), 'yyyy-MM-dd')
        });
      }

      // Send notification if enabled
      if (notifyHierarchy && inspection) {
        try {
          await NotificationService.createNotification({
            recipientId: inspectorId,
            title: 'Nouvelle inspection créée',
            message: `Inspection ${inspectionTypeLabel} programmée pour le ${format(date, 'dd/MM/yyyy')} - Projet: ${context?.project.title || projectId}`,
            type: 'info',
            relatedId: inspection.id || undefined,
            metadata: {
              project_id: projectId,
              inspection_type: inspectionType,
              inspection_date: format(date, 'yyyy-MM-dd'),
              progress: progress,
              milestone_id: milestoneContext?.milestoneId
            }
          });
        } catch (notifError) {
          console.warn('Failed to send notification:', notifError);
        }
      }

      toast({
        title: "Inspection créée",
        description: notifyHierarchy 
          ? "L'inspection a été enregistrée et une notification a été envoyée" 
          : "L'inspection a été enregistrée avec succès",
      });

      onClose();
      onInspectionCreated?.();
    } catch (error: any) {
      console.error('Error creating inspection:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'inspection",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Map context inspection types for display
  const inspectionTypeLabelsMap: Record<string, string> = {
    technical: 'Technique',
    quality: 'Qualité',
    safety: 'Sécurité',
    regulatory: 'Réglementaire',
    progress: 'Avancement',
    compliance: 'Conformité',
    materials: 'Matériaux',
    structural: 'Structurel',
    final: 'Réception'
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clipboard className="h-5 w-5" />
            Nouvelle inspection
          </DialogTitle>
          <DialogDescription>
            {milestoneContext ? (
              <>Inspection liée au jalon: <strong>{milestoneContext.milestoneTitle}</strong></>
            ) : (
              <>Créer une inspection pour le projet</>
            )}
          </DialogDescription>
        </DialogHeader>

        {contextLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Chargement du contexte...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Context Summary */}
            {context && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Contexte du projet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Projet:</span>
                      <span className="ml-1 font-medium">{context.project.title}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Progression:</span>
                      <span className="ml-1 font-medium">{context.project.progress}%</span>
                    </div>
                    {context.linkedPhase && (
                      <div>
                        <span className="text-muted-foreground">Phase:</span>
                        <span className="ml-1 font-medium">{context.linkedPhase.name}</span>
                      </div>
                    )}
                    {context.inspectionType && (
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="outline" className="ml-1">
                          {inspectionTypeLabelsMap[context.inspectionType] || context.inspectionType}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {context.isGateInspection && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Cette inspection est liée à une porte de phase (Gate). Son approbation validera le passage à la phase suivante.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Form Fields */}
            <div className="grid gap-4">
              {/* Date */}
              <div>
                <Label htmlFor="date">Date d'inspection</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd/MM/yyyy") : "Sélectionner une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Inspector */}
              <InspectorSelector
                projectId={projectId}
                value={inspectorId}
                onValueChange={(id, name) => {
                  setInspectorId(id);
                  setInspectorName(name);
                }}
                label="Inspecteur"
                placeholder="Sélectionner un inspecteur"
              />

              {/* Inspection Type */}
              <div>
                <Label htmlFor="inspectionType">Type d'inspection</Label>
                <Select value={inspectionType} onValueChange={setInspectionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSPECTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select value={status} onValueChange={(v: InspectionStatusLocal) => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="scheduled">Programmée</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="requires_changes">Modifications requises</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Progress */}
              <div>
                <Label htmlFor="progress">
                  Progression au moment de l'inspection (%)
                  {context?.suggestedProgress && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (suggéré: {context.suggestedProgress}%)
                    </span>
                  )}
                </Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Checklist Items */}
              {context?.checklistItems && context.checklistItems.length > 0 && (
                <div>
                  <Label className="mb-2 block">Points de contrôle</Label>
                  <Card className="p-3 space-y-2">
                    {context.checklistItems.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`checklist-${index}`}
                          checked={checkedItems.has(item)}
                          onCheckedChange={() => handleChecklistToggle(item)}
                        />
                        <label
                          htmlFor={`checklist-${index}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {item}
                        </label>
                      </div>
                    ))}
                  </Card>
                </div>
              )}

              {/* Pending Tasks */}
              {context?.pendingTasks && context.pendingTasks.length > 0 && (
                <div>
                  <Label className="mb-2 block flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Tâches en cours ({context.pendingTasks.length})
                  </Label>
                  <Card className="p-3 max-h-32 overflow-y-auto">
                    {context.pendingTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center justify-between text-sm py-1">
                        <span>{task.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {task.progress}%
                        </Badge>
                      </div>
                    ))}
                    {context.pendingTasks.length > 5 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +{context.pendingTasks.length - 5} autres tâches...
                      </p>
                    )}
                  </Card>
                </div>
              )}

              {/* Comments */}
              <div>
                <Label htmlFor="comments">Commentaires</Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Observations et remarques..."
                  rows={3}
                />
              </div>

              {/* Notify option */}
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="notifyHierarchy"
                  checked={notifyHierarchy}
                  onCheckedChange={(checked) => setNotifyHierarchy(checked === true)}
                />
                <label
                  htmlFor="notifyHierarchy"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  Envoyer une notification à l'inspecteur
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer l\'inspection'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
