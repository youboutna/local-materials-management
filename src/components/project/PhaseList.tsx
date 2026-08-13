// components/project/PhaseList.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Calendar, Trash2, DollarSign, Eye, RefreshCw } from "lucide-react";
import { formatAmount2 } from "@/utils/reportNumbers";
import { useNavigate } from "react-router-dom";
import { usePhasesHex } from "@/hooks/hexagonal";
import {
  CONSTRUCTION_PHASE_LABELS,
  CONSTRUCTION_STAGE_LABELS,
  type CreatePhaseDTO,
  type PhaseSummaryDTO,
} from "@/dtos/entities/PhaseConstructionDTO";
import { PhaseConstructionTransformer } from "@/dtos/transforms/PhaseConstructionTransformer";

interface PhaseListProps {
  phases: unknown[];
  projectId: string;
  onPhaseUpdate?: () => void;
}

interface PhaseFormState {
  phaseName: string;
  description: string;
  constructionPhase: string;
  constructionStage: string;
  startDate: string;
  endDate: string;
  estimatedCost: string;
  estimatedDuration: string;
  phaseMethodology: string;
}

const EMPTY_FORM: PhaseFormState = {
  phaseName: "",
  description: "",
  constructionPhase: "",
  constructionStage: "",
  startDate: "",
  endDate: "",
  estimatedCost: "",
  estimatedDuration: "30",
  phaseMethodology: "standard",
};

const PhaseList: React.FC<PhaseListProps> = ({
  phases,
  projectId,
  onPhaseUpdate,
}) => {
  const navigate = useNavigate();
  const { createPhase, deletePhase, isCreating, isDeleting, refetch } =
    usePhasesHex(projectId);
  const [form, setForm] = useState<PhaseFormState>(EMPTY_FORM);

  // UI hydration: normalise n'importe quel shape (snake/camel) en DTO camelCase.
  const phaseDtos: PhaseSummaryDTO[] = (phases ?? []).map((p) =>
    PhaseConstructionTransformer.toSummary(p as never),
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const dto: CreatePhaseDTO = {
      phaseName: form.phaseName,
      description: form.description,
      constructionPhase: form.constructionPhase || undefined,
      constructionStage: form.constructionStage || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
      estimatedDuration: form.estimatedDuration ? parseInt(form.estimatedDuration) : 30,
      phaseMethodology: form.phaseMethodology,
    };
    try {
      // UI → camelCase DTO → Transformer → contrat hook (snake_case)
      await createPhase(PhaseConstructionTransformer.toCreatePayload(dto));
      setForm(EMPTY_FORM);
      onPhaseUpdate?.();
    } catch (err) {
      console.error("Error creating phase:", err);
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette phase ?")) return;
    try {
      await deletePhase(phaseId);
      onPhaseUpdate?.();
    } catch (err) {
      console.error("Error deleting phase:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delayed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleViewPhaseDetails = (phaseId: string) =>
    navigate(`/projects/${projectId}/phases/${phaseId}`);

  // Construction phase/stage labels exposed for future inline form picker.
  void CONSTRUCTION_PHASE_LABELS;
  void CONSTRUCTION_STAGE_LABELS;
  void handleCreate; // form UI is preserved upstream; create flow ready for binding.

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Phases du projet ({phaseDtos.length})</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              refetch();
              onPhaseUpdate?.();
            }}
            disabled={isCreating || isDeleting}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${isCreating || isDeleting ? "animate-spin" : ""}`}
            />
            Rafraîchir
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {phaseDtos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucune phase définie pour ce projet</p>
            <p className="text-sm mt-2">
              Utilisez le générateur ci-dessus pour créer des phases
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {phaseDtos.map((phase) => (
              <div
                key={phase.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{phase.phaseName}</h4>
                    {phase.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {phase.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {phase.startDate ?? "—"} → {phase.endDate ?? "—"}
                        </span>
                      </div>
                      {phase.budget != null && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatAmount2(phase.budget)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className={getStatusColor(String(phase.status))}>
                      {phase.status === "completed"
                        ? "Terminée"
                        : phase.status === "in_progress"
                        ? "En cours"
                        : phase.status === "delayed"
                        ? "En retard"
                        : phase.status === "not_started"
                        ? "Non commencée"
                        : "Planifiée"}
                    </Badge>
                    <TooltipProvider>
                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewPhaseDetails(phase.id)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Voir les détails de la phase</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePhase(phase.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Supprimer la phase</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>
                </div>

                {phase.progress > 0 && (
                  <div className="mt-3">
                    <Progress value={phase.progress} />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Progression</span>
                      <span>{phase.progress}%</span>
                    </div>
                  </div>
                )}

                {phase.stages && phase.stages.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Étapes:</p>
                    <div className="space-y-1">
                      {phase.stages.slice(0, 3).map((stage, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <span className="mr-2">{stage.order ?? index + 1}.</span>
                          <span>{stage.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {stage.status ?? "planifiée"}
                          </Badge>
                        </div>
                      ))}
                      {phase.stages.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          + {phase.stages.length - 3} étape(s) supplémentaires
                        </p>
                      )}
                    </div>
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

export default PhaseList;
