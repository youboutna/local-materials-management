import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";
import { ProjectData } from "@/types/project";
import { ReportManager } from "../reports/ReportManager";

interface BulkActionsProps {
  selectedProjects: Set<string>;
  projects: ProjectData[];
  onDelete: (projectIds: string[]) => void;
  onClearSelection: () => void;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedProjects,
  projects,
  onDelete,
  onClearSelection,
}) => {
  const [reportOpen, setReportOpen] = useState(false);

  if (selectedProjects.size === 0) {
    return null;
  }

  const handleDelete = () => {
    const projectIds = Array.from(selectedProjects);
    onDelete(projectIds);
  };

  const selectedProjectNames = projects
    .filter((project) => selectedProjects.has(project.id))
    .map((project) => project.title);
  const selectedProjectObjects = projects.filter((project) =>
    selectedProjects.has(project.id)
  );
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
              {selectedProjects.size}
            </span>
            <span className="font-medium">
              {selectedProjects.size} projet(s) sélectionné(s)
            </span>
          </div>

          {selectedProjectNames.length > 0 && (
            <div className="text-sm text-gray-600 max-w-md truncate">
              {selectedProjectNames.join(", ")}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer ({selectedProjects.size})
          </Button>
          {/* 
          <ReportManager
            data={{ projects: selectedProjectObjects }}
            reportType="compact"
          /> */}

          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActions;
