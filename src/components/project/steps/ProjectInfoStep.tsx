import React from "react";
import { Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import EmployeeSelector from "../../selectors/EmployeeSelector";
import SimpleSupplierSelector from "../../selectors/SimpleSupplierSelector";
import { Progress } from "@/components/ui/progress";

// Import entity DTOs (following "similitude des voisins le plus proche")
import { ProjectDTO, ProjectStatus } from "@/dtos/entities/ProjectDTO";

interface ProjectInfoStepProps {
  formData: Partial<ProjectDTO>;
  onUpdate: (data: Partial<ProjectDTO>) => void;
  isEditing?: boolean;
  baseData?: Partial<ProjectDTO>;
}

const ProjectInfoStep: React.FC<ProjectInfoStepProps> = ({
  formData,
  onUpdate,
  isEditing = false,
  baseData = {},
}) => {
  const statusOptions: Array<{ value: ProjectStatus; label: string }> = [
    { value: "enCours" as ProjectStatus, label: "En cours" },
    { value: "termine" as ProjectStatus, label: "Terminé" },
    { value: "enAttente" as ProjectStatus, label: "En attente" },
    { value: "suspendu" as ProjectStatus, label: "Suspendu" },
    { value: "annule" as ProjectStatus, label: "Annulé" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-blue-500" />
          Informations Générales du Projet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Titre du projet *
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Nom du projet de construction"
                required
                value={formData.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Référence du projet
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="REF-2025-001"
                value={formData.projectReference || ""}
                onChange={(e) =>
                  onUpdate({ projectReference: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 ">
            <div>
              <label className="block text-sm font-medium mb-2">
                Progress *
              </label>

              {/* Progress Bar */}
              <div className="flex items-center gap-3 mb-2">
                <Progress
                  value={formData.progress || 0}
                  className="flex-1 h-2"
                />
                <span className="text-sm font-medium w-12 text-right">
                  {formData.progress || 0}%
                </span>
              </div>

              {/* Input */}
              <input
                type="number"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0"
                min={0}
                max={100}
                required
                value={formData.progress || ""}
                onChange={(e) =>
                  onUpdate({ progress: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description détaillée *
            </label>
            <textarea
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px]"
              placeholder="Description complète du projet, objectifs et spécifications techniques"
              required
              value={formData.description || ""}
              onChange={(e) => onUpdate({ description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Budget total *
              </label>
              <input
                type="number"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="1000000"
                required
                value={formData.budget || ""}
                onChange={(e) =>
                  onUpdate({
                    budget:
                      e.target.value === ""
                        ? undefined
                        : parseFloat(e.target.value),
                  })
                }
              />
            </div>
             <div>
              <label className="block text-sm font-medium mb-2">
                Type de marché *
              </label>
              <Select
                value={formData.marketType ?? ''}
                onValueChange={(value) => onUpdate({ marketType: value })}
              >
                <SelectTrigger className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <SelectValue placeholder="Sélectionner le type de marché" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start">
                  <SelectItem value="public" className="cursor-pointer">
                    Marché public
                  </SelectItem>
                  <SelectItem value="private" className="cursor-pointer">
                    Marché privé
                  </SelectItem>
                  <SelectItem value="ppp" className="cursor-pointer">
                    Partenariat public-privé (PPP)
                  </SelectItem>
                  <SelectItem value="concession" className="cursor-pointer">
                    Concession
                  </SelectItem>
                  <SelectItem value="delegation" className="cursor-pointer">
                    Délégation de service public
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* <div>
              <EmployeeSelector
                label="Chef de projet"
                value={formData.project_responsable_id || ""}
                onChange={(employeeId) =>
                  onUpdate({ project_responsable_id: employeeId })
                }
                placeholder="Sélectionner le chef de projet"
                departmentFilter={["management", "engineering"]}
              />
            </div> */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Mode de sélection
              </label>
              <Select
                value={formData.selectionMode || ""}
                onValueChange={(value) => onUpdate({ selectionMode: value })}
              >
                <SelectTrigger className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <SelectValue placeholder="Sélectionner le mode" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start">
                  <SelectItem value="open" className="cursor-pointer">
                    Appel d'offres ouvert
                  </SelectItem>
                  <SelectItem value="restricted" className="cursor-pointer">
                    Appel d'offres restreint
                  </SelectItem>
                  <SelectItem value="negotiated" className="cursor-pointer">
                    Procédure négociée
                  </SelectItem>
                  <SelectItem value="competitive" className="cursor-pointer">
                    Dialogue compétitif
                  </SelectItem>
                  <SelectItem value="innovation" className="cursor-pointer">
                    Partenariat d'innovation
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Source de financement
              </label>
              <Select
                value={formData.financingSource || ""}
                onValueChange={(value) => onUpdate({ financingSource: value })}
              >
                <SelectTrigger className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <SelectValue placeholder="Sélectionner la source" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start">
                  <SelectItem value="budget_state" className="cursor-pointer">
                    Budget de l'État
                  </SelectItem>
                  <SelectItem value="budget_local" className="cursor-pointer">
                    Budget collectivité locale
                  </SelectItem>
                  <SelectItem value="eu_funds" className="cursor-pointer">
                    Fonds européens
                  </SelectItem>
                  <SelectItem value="private" className="cursor-pointer">
                    Financement privé
                  </SelectItem>
                  <SelectItem value="mixed" className="cursor-pointer">
                    Financement mixte
                  </SelectItem>
                  <SelectItem value="loan" className="cursor-pointer">
                    Emprunt
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Date de début prévue
              </label>
              <input
                type="date"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={String(formData.startDate || "")}
                onChange={(e) =>
                  onUpdate({
                    startDate: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Date de fin prévue
              </label>
              <input
                type="date"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={String(formData.endDate || "")}
                onChange={(e) =>
                  onUpdate({
                    endDate: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Taille estimée de l'équipe
              </label>
              <input
                type="number"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="10"
                min="1"
                value={formData.teamSize || ""}
                onChange={(e) =>
                  onUpdate({
                    teamSize:
                      e.target.value === ""
                        ? undefined
                        : parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Statut du projet
              </label>
              <Select
                value={formData.status || "enCours"}
                onValueChange={(value) => onUpdate({ status: value as ProjectStatus })}
              >
                <SelectTrigger className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <SelectValue placeholder="Sélectionner le statut" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start">
                  <SelectItem value="enCours" className="cursor-pointer">
                    En cours
                  </SelectItem>
                  <SelectItem value="suspendu" className="cursor-pointer">
                    Suspendu
                  </SelectItem>
                  <SelectItem value="termine" className="cursor-pointer">
                    Terminé
                  </SelectItem>
                  <SelectItem value="annule" className="cursor-pointer">
                    Annulé
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="allowsInitialPayment"
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              checked={Boolean(formData.allowsInitialPayment)}
              onChange={(e) =>
                onUpdate({ allowsInitialPayment: e.target.checked })
              }
            />
            <label
              htmlFor="allowsInitialPayment"
              className="text-sm font-medium"
            >
              Autoriser un paiement initial
            </label>
          </div>

          {Boolean(formData.allowsInitialPayment) && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Pourcentage de paiement initial (%)
              </label>
              <input
                type="number"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="15"
                min="0"
                max="100"
                value={String(formData.initialPaymentPercentage || "")}
                onChange={(e) =>
                  onUpdate({
                    initialPaymentPercentage:
                      e.target.value === ""
                        ? undefined
                        : parseFloat(e.target.value),
                  })
                }
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectInfoStep;
