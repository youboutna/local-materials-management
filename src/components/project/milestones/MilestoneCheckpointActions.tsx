/**
 * MilestoneCheckpointActions - Actions disponibles sur les checkpoints des jalons
 * Permet de déclencher des inspections et paiements directement depuis les jalons
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Target,
  ClipboardCheck,
  DollarSign,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  Package,
  Flag,
  CheckSquare,
  ChevronRight,
  Play
} from 'lucide-react';
import { MilestoneSummaryDTO, MilestoneType, MILESTONE_TYPES } from '@/types/milestone-dto';
import { format, parseISO, isBefore, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MilestoneCheckpointActionsProps {
  milestones: MilestoneSummaryDTO[];
  projectId: string;
  phaseId?: string;
  onAddInspection?: (milestoneId: string, milestoneTitle: string) => void;
  onAddPayment?: (milestoneId: string, milestoneTitle: string) => void;
  onMilestoneComplete?: (milestoneId: string) => void;
}

const MilestoneCheckpointActions: React.FC<MilestoneCheckpointActionsProps> = ({
  milestones,
  projectId,
  phaseId,
  onAddInspection,
  onAddPayment,
  onMilestoneComplete
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneSummaryDTO | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const getStatusInfo = (milestone: MilestoneSummaryDTO) => {
    const today = new Date();
    const targetDate = parseISO(milestone.target_date);
    
    if (milestone.status === 'completed') {
      return { 
        icon: CheckCircle, 
        color: 'text-success', 
        bgColor: 'bg-success/10',
        borderColor: 'border-success',
        label: 'Terminé',
        canTrigger: false
      };
    }
    
    if (isBefore(targetDate, today)) {
      const daysLate = differenceInDays(today, targetDate);
      return { 
        icon: AlertTriangle, 
        color: 'text-destructive', 
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive',
        label: `En retard (${daysLate}j)`,
        canTrigger: true
      };
    }

    const daysUntil = differenceInDays(targetDate, today);
    if (daysUntil <= 7) {
      return { 
        icon: Clock, 
        color: 'text-warning', 
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning',
        label: `Dans ${daysUntil}j`,
        canTrigger: true
      };
    }

    if (daysUntil <= 14) {
      return { 
        icon: Clock, 
        color: 'text-primary', 
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary',
        label: 'Prochainement',
        canTrigger: true
      };
    }

    return { 
      icon: Clock, 
      color: 'text-muted-foreground', 
      bgColor: 'bg-muted',
      borderColor: 'border-muted-foreground/30',
      label: 'À venir',
      canTrigger: false
    };
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

  // Filter checkpoints that are actionable (gate, checkpoint types)
  const actionableMilestones = milestones.filter(m => 
    m.type === 'gate' || m.type === 'checkpoint'
  );

  const handleOpenActions = (milestone: MilestoneSummaryDTO) => {
    setSelectedMilestone(milestone);
    setDialogOpen(true);
  };

  const handleTriggerInspection = () => {
    if (selectedMilestone && onAddInspection) {
      onAddInspection(selectedMilestone.id, selectedMilestone.title);
      setDialogOpen(false);
    }
  };

  const handleTriggerPayment = () => {
    if (selectedMilestone && onAddPayment) {
      onAddPayment(selectedMilestone.id, selectedMilestone.title);
      setDialogOpen(false);
    }
  };

  const handleMarkComplete = () => {
    if (selectedMilestone && onMilestoneComplete) {
      onMilestoneComplete(selectedMilestone.id);
      setDialogOpen(false);
    }
  };

  if (actionableMilestones.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm">
            Aucun point de contrôle (checkpoint/gate) disponible.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Les inspections et paiements sont déclenchés sur les jalons de type "Checkpoint" ou "Porte".
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Points de contrôle ({actionableMilestones.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actionableMilestones.map((milestone) => {
            const status = getStatusInfo(milestone);
            const StatusIcon = status.icon;
            const TypeIcon = getTypeIcon(milestone.type);

            return (
              <div
                key={milestone.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border-l-4 transition-all",
                  status.borderColor,
                  status.bgColor,
                  status.canTrigger && "hover:shadow-md cursor-pointer"
                )}
                onClick={() => status.canTrigger && handleOpenActions(milestone)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "p-2 rounded-full",
                    milestone.status === 'completed' ? 'bg-success/20' : 'bg-background'
                  )}>
                    <StatusIcon className={cn("h-4 w-4", status.color)} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "font-medium text-sm truncate",
                        milestone.status === 'completed' && "line-through text-muted-foreground"
                      )}>
                        {milestone.title}
                      </p>
                      <TypeIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(parseISO(milestone.target_date), 'd MMM yyyy', { locale: fr })}</span>
                      <Badge variant="outline" className="text-xs h-4">
                        {MILESTONE_TYPES[milestone.type]?.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={cn(status.bgColor, status.color, "border-0 text-xs")}>
                    {status.label}
                  </Badge>
                  {status.canTrigger && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Actions Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Actions sur le jalon
            </DialogTitle>
            <DialogDescription>
              {selectedMilestone?.title}
              <span className="block text-xs mt-1">
                Date cible: {selectedMilestone && format(parseISO(selectedMilestone.target_date), 'd MMMM yyyy', { locale: fr })}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {/* Trigger Inspection */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={handleTriggerInspection}
            >
              <div className="p-2 bg-orange-100 rounded-lg">
                <ClipboardCheck className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-left">
                <p className="font-medium">Déclencher une inspection</p>
                <p className="text-xs text-muted-foreground">
                  Créer une inspection liée à ce jalon
                </p>
              </div>
            </Button>

            {/* Trigger Payment */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={handleTriggerPayment}
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium">Effectuer un paiement</p>
                <p className="text-xs text-muted-foreground">
                  Enregistrer un paiement lié à ce jalon
                </p>
              </div>
            </Button>

            {/* Mark as Complete */}
            {selectedMilestone?.status !== 'completed' && (
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-3 border-success/50 hover:bg-success/10"
                onClick={handleMarkComplete}
              >
                <div className="p-2 bg-success/20 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Marquer comme terminé</p>
                  <p className="text-xs text-muted-foreground">
                    Valider ce point de contrôle
                  </p>
                </div>
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MilestoneCheckpointActions;
