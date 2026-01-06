import { Button } from "@/components/ui/button";
import { Plus, FileSpreadsheet, BarChart3, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";

interface ProjectsHeaderProps {
  totalProjects?: number;
  activeProjects?: number;
}

const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({
  totalProjects = 0,
  activeProjects = 0,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
            {t("projects.header.title")}
          </h1>
          <p className="text-gray-600 mt-2 max-w-2xl">
            {t("projects.header.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/projects/analytics">
              <BarChart3 className="h-4 w-4" />
              {t("projects.header.analytics")}
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/projects/import">
              <FileSpreadsheet className="h-4 w-4" />
              {t("projects.header.import_export")}
            </Link>
          </Button>
          <Button
            asChild
            className="gap-2 bg-gradient-to-r from-primary to-primary/90"
          >
            <Link to="/projects/create">
              <Plus className="h-4 w-4" />
              {t("projects.header.new_project")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {(totalProjects > 0 || activeProjects > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Total des projets
                </p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {totalProjects}
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-xs">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">
                  Projets actifs
                </p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {activeProjects}
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-xs">
                <Filter className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">
                  Taux d'achèvement
                </p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {totalProjects > 0
                    ? Math.round((activeProjects / totalProjects) * 100)
                    : 0}
                  %
                </p>
              </div>
              <Badge
                variant="secondary"
                className="bg-white text-purple-700 border-purple-200"
              >
                {totalProjects - activeProjects} terminés
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsHeader;
