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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Calendar, Save, Trash2, DollarSign, Eye, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePhasesHex } from "@/hooks/hexagonal";
import { toast } from "@/hooks/use-toast";
import { ConstructionPhase, ConstructionStage } from "@/types/project";

interface PhaseListProps {
  phases: any[];
  projectId: string;
  onPhaseUpdate?: () => void;
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
  pre_construction: "Pré-construction",
  site_preparation: "Préparation du site",
  foundation: "Fondations",
  framing: "Charpente",
  structural_work: "Travaux structurels",
  finishing: "Finitions",
  post_construction: "Post-construction",
  handover: "Livraison",
};

const CONSTRUCTION_STAGES: Record<ConstructionStage, string> = {
  planning_design: "Planification et conception",
  permits_approvals: "Permis et approbations",
  site_clearing: "Déblaiement du site",
  excavation: "Excavation",
  foundation_work: "Travaux de fondation",
  structural_framing: "Charpente structurelle",
  roofing: "Toiture",
  electrical_plumbing: "Électricité et plomberie",
  interior_finishing: "Finitions intérieures",
  exterior_finishing: "Finitions extérieures",
  final_inspection: "Inspection finale",
  handover_complete: "Livraison complète",
};

const PhaseList: React.FC<PhaseListProps> = ({
  phases,
  projectId,
  onPhaseUpdate,
}) => {
  const navigate = useNavigate();
  const { createPhase, deletePhase, isCreating, isDeleting, refetch } = usePhasesHex(projectId);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [formData, setFormData] = useState<PhaseFormData>({
    phase_name: "",
    description: "",
    construction_phase: "",
    construction_stage: "",
    start_date: "",
    end_date: "",
    estimated_cost: "",
    estimated_duration: "30",
    phase_methodology: "standard",
  });

  // Helper function to get Waterfall stages based on phase
  const getWaterfallStages = (phase: string) => {
    const waterfallStages = {
      planification: [
        ["estimation_ressources", "Estimation des ressources financières"],
        ["planification_achats", "Planification des achats par catégorie"],
        [
          "modalites_planification",
          "Définition des modalités de planification",
        ],
      ],
      publicite: [
        ["publication_portail", "Publication via le Portail National"],
        [
          "diffusion_journaux",
          "Diffusion dans les journaux d'annonces légales",
        ],
        ["inscription_candidats", "Inscription des candidats potentiels"],
        [
          "notification_opportunites",
          "Notifications d'opportunités aux candidats",
        ],
      ],
      reception_analyse: [
        ["soumission_dossiers", "Soumission des dossiers techniques"],
        ["analyse_cpmp", "Analyse par la CPMP"],
        ["assistance_sous_commission", "Assistance de la sous-commission"],
        ["evaluation_conformite", "Évaluation de la conformité des offres"],
      ],
      attribution: [
        ["selection_prix", "Sélection basée sur le prix"],
        ["choix_economique", "Choix de l'offre économiquement avantageuse"],
        ["publication_attribution", "Publication de l'avis d'attribution"],
        ["signature_marche", "Signature du marché avec l'attributaire"],
      ],
      controle_regulation: [
        ["controle_cncmp", "Contrôle a priori et a posteriori par la CNCMP"],
        [
          "verification_regulier",
          "Vérification de la régularité des procédures",
        ],
        ["regulation_armp", "Régulation par l'ARMP"],
        [
          "commission_disciplinaire",
          "Commission Disciplinaire pour les sanctions",
        ],
      ],
    };
    return waterfallStages[phase] || [];
  };

  const resetForm = () => {
    setFormData({
      phase_name: "",
      description: "",
      construction_phase: "",
      construction_stage: "",
      start_date: "",
      end_date: "",
      estimated_cost: "",
      estimated_duration: "30",
      phase_methodology: "standard",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPhase({
        phase_name: formData.phase_name,
        description: formData.description,
        construction_phase: formData.construction_phase || undefined,
        construction_stage: formData.construction_stage || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : undefined,
        estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : 30,
      });
      setIsCreatingForm(false);
      resetForm();
      if (onPhaseUpdate) onPhaseUpdate();
    } catch (error) {
      console.error('Error creating phase:', error);
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette phase ?")) return;

    try {
      await deletePhase(phaseId);
      if (onPhaseUpdate) onPhaseUpdate();
    } catch (error) {
      console.error("Error deleting phase:", error);
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
  const handleViewPhaseDetails = (phaseId: string) => {
    navigate(`/projects/${projectId}/phases/${phaseId}`);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Phases du projet ({phases.length})</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              refetch();
              if (onPhaseUpdate) onPhaseUpdate();
            }}
            disabled={isCreating || isDeleting}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isCreating || isDeleting ? 'animate-spin' : ''}`} />
            Rafraîchir
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {phases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucune phase définie pour ce projet</p>
            <p className="text-sm mt-2">
              Utilisez le générateur ci-dessus pour créer des phases
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {phases.map((phase) => (
              <div
                key={phase.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {phase.phase_name || phase.phase}
                    </h4>
                    {phase.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {phase.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {phase.startDate} → {phase.endDate}
                        </span>
                      </div>
                      {phase.budget && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{phase.budget.toLocaleString()} MRU</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className={getStatusColor(phase.status)}>
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
                      {phase.stages
                        .slice(0, 3)
                        .map((stage: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center text-sm"
                          >
                            <span className="mr-2">
                              {stage.order || index + 1}.
                            </span>
                            <span>{stage.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {stage.status || "planifiée"}
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
