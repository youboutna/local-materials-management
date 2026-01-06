import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  X,
  Download,
  Mail,
  Tag,
  Filter,
  EyeOff,
  CheckCircle,
  Clock,
  AlertCircle,
  Ban,
} from "lucide-react";
import { ProjectData } from "@/types/project";
import { ReportManager } from "../reports/ReportManager";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BulkActionsProps {
  selectedProjects: Set<string>;
  projects: ProjectData[];
  onDelete: (projectIds: string[]) => void;
  onClearSelection: () => void;
  onBulkStatusUpdate?: (status: string) => void;
  onExport?: (projectIds: string[]) => void;
  onSendEmail?: (projectIds: string[]) => void;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedProjects,
  projects,
  onDelete,
  onClearSelection,
  onBulkStatusUpdate,
  onExport,
  onSendEmail,
}) => {
  const [reportOpen, setReportOpen] = useState(false);

  if (selectedProjects.size === 0) {
    return null;
  }

  const handleDelete = () => {
    const projectIds = Array.from(selectedProjects);
    onDelete(projectIds);
  };

  const handleExport = () => {
    const projectIds = Array.from(selectedProjects);
    if (onExport) {
      onExport(projectIds);
    } else {
      // Default export behavior
      const selectedProjectObjects = projects.filter((project) =>
        selectedProjects.has(project.id)
      );
      console.log("Exporting projects:", selectedProjectObjects);
      toast.success(`${selectedProjectObjects.length} projet(s) exporté(s)`);
    }
  };

  const handleSendEmail = () => {
    const projectIds = Array.from(selectedProjects);
    if (onSendEmail) {
      onSendEmail(projectIds);
    } else {
      console.log("Sending email for projects:", projectIds);
      toast.success(`Email envoyé pour ${projectIds.length} projet(s)`);
    }
  };

  const selectedProjectNames = projects
    .filter((project) => selectedProjects.has(project.id))
    .map((project) => project.title);
  const selectedProjectObjects = projects.filter((project) =>
    selectedProjects.has(project.id)
  );

  const statusOptions = [
    {
      value: "en cours",
      label: "En cours",
      icon: <CheckCircle className="h-4 w-4 text-blue-600" />,
      color: "text-blue-600 bg-blue-50",
    },
    {
      value: "terminé",
      label: "Terminé",
      icon: <CheckCircle className="h-4 w-4 text-green-600" />,
      color: "text-green-600 bg-green-50",
    },
    {
      value: "en attente",
      label: "En attente",
      icon: <Clock className="h-4 w-4 text-yellow-600" />,
      color: "text-yellow-600 bg-yellow-50",
    },
    {
      value: "annulé",
      label: "Annulé",
      icon: <Ban className="h-4 w-4 text-red-600" />,
      color: "text-red-600 bg-red-50",
    },
    {
      value: "en retard",
      label: "En retard",
      icon: <AlertCircle className="h-4 w-4 text-orange-600" />,
      color: "text-orange-600 bg-orange-50",
    },
  ];

  // Calculate total budget
  const totalBudget = selectedProjectObjects.reduce(
    (sum, project) => sum + (project.budget || 0),
    0
  );

  // Calculate average progress
  const averageProgress =
    selectedProjectObjects.length > 0
      ? Math.round(
          selectedProjectObjects.reduce(
            (sum, project) => sum + (project.progress || 0),
            0
          ) / selectedProjectObjects.length
        )
      : 0;

  return (
    <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Selection Info */}
        <div className="flex items-start gap-4">
          <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold shadow-sm">
            {selectedProjects.size}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-foreground">
                {selectedProjects.size} projet
                {selectedProjects.size > 1 ? "s" : ""} sélectionné
                {selectedProjects.size > 1 ? "s" : ""}
              </h3>
              <span className="px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">
                {averageProgress}% de progression moyen
              </span>
            </div>

            <div className="text-sm text-muted-foreground mt-1">
              <span className="font-medium text-foreground">
                {totalBudget.toLocaleString()} MRU
              </span>
              <span className="mx-2">•</span>
              <span>
                {selectedProjectObjects.reduce(
                  (sum, p) => sum + (p.teamSize || 0),
                  0
                )}{" "}
                membres d'équipe
              </span>
            </div>

            {selectedProjectNames.length > 0 && (
              <div className="text-sm text-gray-600 max-w-lg truncate mt-1">
                <span className="font-medium">Projets :</span>{" "}
                {selectedProjectNames.slice(0, 3).join(", ")}
                {selectedProjectNames.length > 3 &&
                  ` et ${selectedProjectNames.length - 3} de plus...`}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Status Update Dropdown */}
          {onBulkStatusUpdate && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Tag className="h-4 w-4" />
                  Modifier le statut
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Changer le statut en</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statusOptions.map((status) => (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={() => onBulkStatusUpdate(status.value)}
                    className={cn("flex items-center gap-2", status.color)}
                  >
                    {status.icon}
                    <span>{status.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter
          </Button>

          {/* Email Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendEmail}
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            Envoyer par email
          </Button>

          {/* Report Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReportOpen(true)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Générer rapport
          </Button>

          {/* Delete Button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="gap-2 shadow-sm"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Annuler
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-primary/10">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {selectedProjects.size}
          </div>
          <div className="text-xs text-muted-foreground">Projets</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {averageProgress}%
          </div>
          <div className="text-xs text-muted-foreground">Progression moy.</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {
              selectedProjectObjects.filter((p) => p.status === "en cours")
                .length
            }
          </div>
          <div className="text-xs text-muted-foreground">En cours</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">
            {(totalBudget / 1000000).toFixed(1)}M
          </div>
          <div className="text-xs text-muted-foreground">
            Budget total (MRU)
          </div>
        </div>
      </div>

      {/* Report Manager Modal */}
      {/* {reportOpen && (
        <ReportManager
          data={{ projects: selectedProjectObjects }}
          reportType="compact"
          onClose={() => setReportOpen(false)}
        />
      )} */}
    </div>
  );
};

export default BulkActions;
