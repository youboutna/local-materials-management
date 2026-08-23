/**
 * PhaseEditDialog Component
 * Dialog for editing phase details
 * Max 350 lines following SRP
 */

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Building,
  Calendar,
  DollarSign,
  Edit,
  Info,
  Target,
} from "lucide-react";
import { PhaseDTO, PhaseStatus } from "@/dtos/types/phase-dto";
import { CompletionValidationResult, getCompletionBlockReasons } from "@/utils/completionValidation";
import { T } from '@/components/i18n/T';

interface PhaseEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editForm: Partial<PhaseDTO>;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<PhaseDTO>>>;
  onSave: () => void;
  isUpdating: boolean;
  phaseName: string;
  completionValidation: CompletionValidationResult;
}

const PhaseEditDialog: React.FC<PhaseEditDialogProps> = ({
  isOpen,
  onOpenChange,
  editForm,
  setEditForm,
  onSave,
  isUpdating,
  phaseName,
  completionValidation,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Edit className="h-5 w-5 text-primary" />
            </div>
            <T k="auto.phaseeditdialog.modifier_la_phase" fallback="Modifier la phase" />
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Modifiez les informations de la phase "{phaseName}"
          </p>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Section: Informations générales */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building className="h-4 w-4" />
              <T k="auto.phaseeditdialog.informations_generales" fallback="Informations générales" />
            </div>
            
            <div className="grid gap-4 pl-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  <T k="auto.phaseeditdialog.nom_de_la_phase" fallback="Nom de la phase" /> <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={editForm.phaseName || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phaseName: e.target.value })
                  }
                  placeholder="Ex: Fondations et terrassement"
                  className="h-10"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium"><T k="auto.phaseeditdialog.description" fallback="Description" /></Label>
                <Textarea
                  value={editForm.description || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  placeholder="Décrivez les objectifs et le contenu de cette phase..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Section: Planification */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <T k="auto.phaseeditdialog.planification" fallback="Planification" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium"><T k="auto.phaseeditdialog.date_de_debut" fallback="Date de début" /></Label>
                <Input
                  type="date"
                  value={editForm.startDate || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, startDate: e.target.value })
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium"><T k="auto.phaseeditdialog.date_de_fin" fallback="Date de fin" /></Label>
                <Input
                  type="date"
                  value={editForm.endDate || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, endDate: e.target.value })
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-medium"><T k="auto.phaseeditdialog.duree_estimee" fallback="Durée estimée" /></Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    value={editForm.estimatedDurationDays || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        estimatedDurationDays: parseInt(e.target.value) || undefined,
                      })
                    }
                    className="h-10 pr-14"
                    placeholder="30"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    jours
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section: Budget */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <T k="auto.phaseeditdialog.budget" fallback="Budget" />
            </div>
            
            <div className="grid grid-cols-1 gap-4 pl-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium"><T k="auto.phaseeditdialog.cout_estime" fallback="Coût estimé" /></Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    value={editForm.estimatedCost || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        estimatedCost: parseFloat(e.target.value) || undefined,
                      })
                    }
                    className="h-10 pr-14"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    <T k="auto.phaseeditdialog.mru" fallback="MRU" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section: État et progression */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Target className="h-4 w-4" />
              <T k="auto.phaseeditdialog.etat_et_progression" fallback="État et progression" />
            </div>
            
            {/* Completion Validation Warning */}
            {!completionValidation.canComplete && (
              <Alert className="ml-6 border-warning/30 bg-warning/10">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-sm">
                  <span className="font-medium"><T k="auto.phaseeditdialog.impossible_de_marquer_comme_termine" fallback="Impossible de marquer comme terminé" /></span>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    {getCompletionBlockReasons(completionValidation).map((reason, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-amber-500" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium"><T k="auto.phaseeditdialog.statut" fallback="Statut" /></Label>
                <Select
                  value={editForm.status || "pending"}
                  onValueChange={(value) => {
                    if (value === 'completed' && !completionValidation.canComplete) {
                      return;
                    }
                    setEditForm({ ...editForm, status: value as PhaseStatus });
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        <T k="auto.phaseeditdialog.en_attente" fallback="En attente" />
                      </div>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <T k="auto.phaseeditdialog.en_cours" fallback="En cours" />
                      </div>
                    </SelectItem>
                    <SelectItem 
                      value="completed"
                      disabled={!completionValidation.canComplete}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "h-2 w-2 rounded-full",
                                !completionValidation.canComplete 
                                  ? "bg-gray-300" 
                                  : "bg-success"
                              )} />
                              Terminé
                              {!completionValidation.canComplete && (
                                <Info className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          </TooltipTrigger>
                          {!completionValidation.canComplete && (
                            <TooltipContent side="right" className="max-w-xs">
                              <p className="text-xs"><T k="auto.phaseeditdialog.conditions_non_remplies" fallback="Conditions non remplies" /></p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </SelectItem>
                    <SelectItem value="delayed">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <T k="auto.phaseeditdialog.en_retard" fallback="En retard" />
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gray-500" />
                        <T k="auto.phaseeditdialog.annule" fallback="Annulé" />
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Progression: {editForm.progress || 0}%
                </Label>
                <Slider
                  value={[editForm.progress || 0]}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, progress: value[0] })
                  }
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="pt-4 border-t gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <T k="auto.phaseeditdialog.annuler" fallback="Annuler" />
          </Button>
          <Button onClick={onSave} disabled={isUpdating}>
            {isUpdating ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhaseEditDialog;
