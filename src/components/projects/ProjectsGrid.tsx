import React from "react";
import { ProjectData } from "@/types/project";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  ChevronRight,
  Clock,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProjectsGridProps {
  projects: ProjectData[];
  isLoading?: boolean;
  variant?: "grid" | "list";
}

const ProjectsGrid: React.FC<ProjectsGridProps> = ({
  projects,
  isLoading,
  variant = "grid",
}) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "en cours":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "terminé":
        return "bg-green-100 text-green-700 border-green-200";
      case "en attente":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "annulé":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "Faible":
        return "bg-red-500";
      case "Moyenne":
        return "bg-yellow-500";
      case "Élevée":
        return "bg-green-500";
      case "Très élevée":
        return "bg-purple-500";
      default:
        return "bg-gray-300";
    }
  };
  // Helper function to calculate project duration in days
  const calculateDuration = (
    startDate: string,
    endDate?: string
  ): number | string => {
    if (!endDate) return "N/A";

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate difference in days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // Helper function to calculate remaining days if project is ongoing
  const calculateRemainingDays = (endDate?: string): number | string => {
    if (!endDate) return "N/A";

    const end = new Date(endDate);
    const now = new Date();

    if (now > end) return "Terminé";

    const diffTime = Math.abs(end.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // Helper function to get duration display text
  const getDurationDisplay = (project: ProjectData): string => {
    const duration = calculateDuration(project.startDate, project.endDate);

    if (duration === "N/A") {
      return "N/A";
    }

    const totalDays = duration as number;

    if (project.status === "terminé") {
      return `${totalDays} jours (terminé)`;
    } else if (project.status === "en cours") {
      const remainingDays = calculateRemainingDays(project.endDate);
      if (remainingDays === "Terminé" || remainingDays === "N/A") {
        return `${totalDays} jours`;
      }
      return `${remainingDays} jours restants / ${totalDays} jours`;
    } else if (project.status === "en attente") {
      return `${totalDays} jours (prévu)`;
    }

    return `${totalDays} jours`;
  };
  if (isLoading) {
    return (
      <div
        className={cn(
          "grid gap-6",
          variant === "grid"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        )}
      >
        {[...Array(variant === "grid" ? 6 : 3)].map((_, i) => (
          <Card
            key={i}
            className="animate-pulse overflow-hidden border-0 shadow-sm"
          >
            <CardHeader className="pb-3">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full"></div>
            </CardContent>
            <CardFooter>
              <div className="h-9 bg-gray-200 rounded-md w-full"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Target className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun projet trouvé
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Aucun projet ne correspond à vos critères de recherche. Essayez
          d'ajuster vos filtres.
        </p>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-4">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="hover:shadow-md transition-all duration-200 border-0 shadow-sm"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`h-2 w-2 rounded-full ${getPriorityColor(
                        project.priorityLevel
                      )}`}
                    />
                    <h3 className="font-semibold text-lg text-gray-900 truncate">
                      {project.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        "ml-auto text-xs font-medium border",
                        getStatusColor(project.status)
                      )}
                    >
                      {project.status}
                    </Badge>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{project.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(project.startDate).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>{project.teamSize} membres</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">
                        {project.budget.toLocaleString()} MRU
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Progrès
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {project.progress}%
                      </span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                </div>

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="ml-4 flex-shrink-0"
                >
                  <Link to={`/projects/${project.id}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div key={project.id} className="group animate-in fade-in duration-300">
          <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-sm overflow-hidden group-hover:shadow-xl">
            {/* Project Header with Status */}
            <CardHeader className="pb-3 relative">
              <div className="absolute top-4 right-4">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium border",
                    getStatusColor(project.status)
                  )}
                >
                  {project.status}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`h-2 w-2 rounded-full ${getPriorityColor(
                    project.priorityLevel
                  )}`}
                />
                <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight">
                  {project.title}
                </CardTitle>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Démarré le{" "}
                  {new Date(project.startDate).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Project Description */}
              <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                {project.description}
              </p>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-700">
                    Progression
                  </span>
                  <span className="text-xs font-bold text-gray-900">
                    {project.progress}%
                  </span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>

              {/* Project Details Icons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="p-1.5 bg-white rounded-md shadow-xs">
                    <MapPin className="h-3.5 w-3.5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Localisation</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {project.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="p-1.5 bg-white rounded-md shadow-xs">
                    <Users className="h-3.5 w-3.5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Équipe</p>
                    <p className="text-sm font-medium text-gray-900">
                      {project.teamSize} membres
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="p-1.5 bg-white rounded-md shadow-xs">
                    <DollarSign className="h-3.5 w-3.5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Budget</p>
                    <p className="text-sm font-medium text-gray-900">
                      {project.budget.toLocaleString()} MRU
                    </p>
                  </div>
                </div>
                {project.startDate && project.endDate && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="p-1.5 bg-white rounded-md shadow-xs">
                      <Calendar className="h-3.5 w-3.5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Durée</p>
                      <p className="text-sm font-medium text-gray-900">
                        {getDurationDisplay(project)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="pt-0">
              <Button asChild className="w-full group/btn">
                <Link
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-center gap-2"
                >
                  Voir les détails
                  <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default ProjectsGrid;
