import React from "react";
import { Building } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import EmployeeSelector from "../../selectors/EmployeeSelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { FormSection } from "@/components/ui/form-section";

// Import entity DTOs (following PROMPTS.md Rule #4: No type redefinition)
import {
  ProjectDTO,
  ProjectStatus,
  PROJECT_STATUS_LABELS,
} from "@/dtos/entities/ProjectDTO";
import { ProjectWorkflowData } from '@/dtos/entities/TaskAssignmentDTO';;

interface ProjectInfoStepProps {
  workflowData: ProjectWorkflowData | null;
  onStepComplete: (stepData: { projectData: ProjectDTO }) => void;
  isEditing?: boolean;
  mode?: "create" | "edit";
}

/**
 * ProjectInfoStep — formulaire compact (Étape 1).
 *
 * Règles UX :
 * - Largeurs proportionnelles au contenu (REF court, Titre large).
 * - Grille 12 colonnes pour éviter le scroll vertical inutile.
 * - Composants shadcn (Input/Label/Select) pour hériter de la densité globale.
 */
const ProjectInfoStep: React.FC<ProjectInfoStepProps> = ({
  workflowData,
  onStepComplete,
}) => {
  const projectData = workflowData?.projectData || ({} as ProjectDTO);

  const handleUpdate = (updates: Partial<ProjectDTO>) => {
    const updated: ProjectDTO = {
      ...projectData,
      ...updates,
      id: projectData.id || "",
      createdAt: projectData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onStepComplete?.({ projectData: updated });
  };

  const statusOptions = Object.entries(PROJECT_STATUS_LABELS).map(
    ([value, label]) => ({ value: value as ProjectStatus, label }),
  );

  return (
    <FormSection
      title="Informations générales du projet"
      description="Identité, calendrier et cadre financier de base."
      icon={<Building className="h-5 w-5 text-primary" />}
      stage="PLANIFICATION"
    >
      <div className="space-y-4">
        {/* Ligne 1 : Référence (compacte) + Titre (large) + Statut */}
        <div className="grid grid-cols-12 gap-3">
          <div className="form-group col-span-12 sm:col-span-3">
            <Label htmlFor="project-ref">Référence</Label>
            <Input
              id="project-ref"
              placeholder="REF-2025-001"
              value={projectData.projectReference || ""}
              onChange={(e) =>
                handleUpdate({ projectReference: e.target.value })
              }
            />
          </div>
          <div className="form-group col-span-12 sm:col-span-6">
            <Label htmlFor="project-title">
              Titre du projet <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project-title"
              placeholder="Nom du projet de construction"
              required
              value={projectData.title || ""}
              onChange={(e) => handleUpdate({ title: e.target.value })}
            />
          </div>
          <div className="form-group col-span-12 sm:col-span-3">
            <Label htmlFor="project-status">Statut</Label>
            <Select
              value={projectData.status || ProjectStatus.EN_ATTENTE}
              onValueChange={(value) =>
                handleUpdate({ status: value as ProjectStatus })
              }
            >
              <SelectTrigger id="project-status">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <Label htmlFor="project-desc">
            Description détaillée <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="project-desc"
            placeholder="Objectifs, contexte, spécifications techniques…"
            className="min-h-[96px]"
            required
            value={projectData.description || ""}
            onChange={(e) => handleUpdate({ description: e.target.value })}
          />
        </div>

        {/* Ligne 2 : Budget + Type marché + Mode sélection */}
        <div className="grid grid-cols-12 gap-3">
          <div className="form-group col-span-12 sm:col-span-4">
            <Label htmlFor="project-budget">
              Budget total (MRU) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project-budget"
              type="number"
              placeholder="1 000 000"
              required
              value={projectData.budget ?? ""}
              onChange={(e) =>
                handleUpdate({
                  budget:
                    e.target.value === ""
                      ? undefined
                      : parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div className="form-group col-span-12 sm:col-span-4">
            <Label htmlFor="project-market">
              Type de marché <span className="text-destructive">*</span>
            </Label>
            <Select
              value={projectData.marketType ?? ""}
              onValueChange={(value) => handleUpdate({ marketType: value })}
            >
              <SelectTrigger id="project-market">
                <SelectValue placeholder="Type de marché" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Marché public</SelectItem>
                <SelectItem value="private">Marché privé</SelectItem>
                <SelectItem value="ppp">PPP</SelectItem>
                <SelectItem value="concession">Concession</SelectItem>
                <SelectItem value="delegation">Délégation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="form-group col-span-12 sm:col-span-4">
            <Label htmlFor="project-selection">Mode de sélection</Label>
            <Select
              value={projectData.selectionMode || ""}
              onValueChange={(value) => handleUpdate({ selectionMode: value })}
            >
              <SelectTrigger id="project-selection">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Appel d'offres ouvert</SelectItem>
                <SelectItem value="restricted">
                  Appel d'offres restreint
                </SelectItem>
                <SelectItem value="negotiated">Procédure négociée</SelectItem>
                <SelectItem value="competitive">
                  Dialogue compétitif
                </SelectItem>
                <SelectItem value="innovation">
                  Partenariat d'innovation
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Ligne 3 : Financement + Chef de projet + Équipe */}
        <div className="grid grid-cols-12 gap-3">
          <div className="form-group col-span-12 sm:col-span-4">
            <Label htmlFor="project-financing">Source de financement</Label>
            <Select
              value={projectData.financingSource || ""}
              onValueChange={(value) =>
                handleUpdate({ financingSource: value })
              }
            >
              <SelectTrigger id="project-financing">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="budget_state">Budget de l'État</SelectItem>
                <SelectItem value="budget_local">
                  Budget collectivité locale
                </SelectItem>
                <SelectItem value="eu_funds">Fonds européens</SelectItem>
                <SelectItem value="private">Financement privé</SelectItem>
                <SelectItem value="mixed">Financement mixte</SelectItem>
                <SelectItem value="loan">Emprunt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="form-group col-span-12 sm:col-span-5">
            <EmployeeSelector
              label="Chef de projet"
              value={projectData.projectManagerId || ""}
              onChange={(employeeId) =>
                handleUpdate({ projectManagerId: employeeId })
              }
              placeholder="Sélectionner le chef de projet"
              departmentFilter={["management", "engineering"]}
            />
          </div>
          <div className="form-group col-span-12 sm:col-span-3">
            <Label htmlFor="project-team">Taille équipe</Label>
            <Input
              id="project-team"
              type="number"
              placeholder="10"
              min={1}
              value={projectData.teamSize ?? ""}
              onChange={(e) =>
                handleUpdate({
                  teamSize:
                    e.target.value === ""
                      ? undefined
                      : parseInt(e.target.value),
                })
              }
            />
          </div>
        </div>

        {/* Ligne 4 : Dates + Avancement */}
        <div className="grid grid-cols-12 gap-3">
          <div className="form-group col-span-6 sm:col-span-3">
            <Label htmlFor="project-start">Date début</Label>
            <Input
              id="project-start"
              type="date"
              value={String(projectData.startDate || "")}
              onChange={(e) => handleUpdate({ startDate: e.target.value })}
            />
          </div>
          <div className="form-group col-span-6 sm:col-span-3">
            <Label htmlFor="project-end">Date fin</Label>
            <Input
              id="project-end"
              type="date"
              value={String(projectData.endDate || "")}
              onChange={(e) => handleUpdate({ endDate: e.target.value })}
            />
          </div>
          <div className="form-group col-span-12 sm:col-span-6">
            <Label htmlFor="project-progress">Avancement</Label>
            <div className="flex items-center gap-3">
              <Progress
                value={projectData.progress || 0}
                className="flex-1 h-2"
              />
              <Input
                id="project-progress"
                type="number"
                className="w-20 text-right"
                placeholder="0"
                min={0}
                max={100}
                value={projectData.progress ?? ""}
                onChange={(e) =>
                  handleUpdate({ progress: parseInt(e.target.value) || 0 })
                }
              />
              <span className="text-sm text-muted-foreground w-6">%</span>
            </div>
          </div>
        </div>

        {/* Paiement initial */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Checkbox
              id="allowsInitialPayment"
              checked={Boolean(projectData.allowsInitialPayment)}
              onCheckedChange={(checked) =>
                handleUpdate({ allowsInitialPayment: Boolean(checked) })
              }
            />
            <Label htmlFor="allowsInitialPayment" className="cursor-pointer">
              Autoriser un paiement initial
            </Label>
          </div>
          {Boolean(projectData.allowsInitialPayment) && (
            <div className="flex items-center gap-2">
              <Label htmlFor="initialPaymentPct" className="whitespace-nowrap">
                Pourcentage :
              </Label>
              <Input
                id="initialPaymentPct"
                type="number"
                className="w-24"
                placeholder="15"
                min={0}
                max={100}
                value={String(
                  (projectData as any).initialPaymentPercentage || "",
                )}
                onChange={(e) =>
                  handleUpdate({
                    initialPaymentPercentage:
                      e.target.value === ""
                        ? undefined
                        : parseFloat(e.target.value),
                  } as Partial<ProjectDTO>)
                }
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          )}
        </div>
      </div>
    </FormSection>
  );
};

export default ProjectInfoStep;
