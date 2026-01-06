import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Users,
  Building2,
  DollarSign,
  MapPin,
  Grid,
  List,
  Eye,
  Edit,
  Download,
  Share2,
  CheckSquare,
  Square,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ProjectData } from "@/types/project";
import StatusBadge from "@/components/StatusBadge";
import { Checkbox } from "../ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ProjectsGridPaginatedProps {
  projects: ProjectData[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  selectedProjects?: Set<string>;
  onProjectSelect?: (projectId: string) => void;
  onSelectAllOnPage?: (projectIds: string[]) => void;
  onDeselectAllOnPage?: (projectIds: string[]) => void;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
  allVisibleProjectsCount?: number; // Add this prop to show total visible projects
}

const ProjectsGridPaginated: React.FC<ProjectsGridPaginatedProps> = ({
  projects,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  selectedProjects = new Set(),
  onProjectSelect,
  onSelectAllOnPage,
  onDeselectAllOnPage,
  isLoading = false,
  viewMode: externalViewMode,
  onViewModeChange,
  allVisibleProjectsCount,
}) => {
  const [internalViewMode, setInternalViewMode] = useState<"grid" | "list">(
    "grid"
  );
  const viewMode = externalViewMode || internalViewMode;
  const setViewMode = onViewModeChange || setInternalViewMode;

  const generateVisiblePages = () => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter(
      (item, index, self) => self.indexOf(item) === index
    );
  };

  const visiblePages = generateVisiblePages();

  // Selection state calculation
  const allProjectIdsOnPage = projects.map((p) => p.id);
  const allSelectedOnPage =
    allProjectIdsOnPage.length > 0 &&
    allProjectIdsOnPage.every((id) => selectedProjects?.has(id));
  const someSelectedOnPage =
    allProjectIdsOnPage.some((id) => selectedProjects?.has(id)) &&
    !allSelectedOnPage;

  const handleSelectAllChange = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      onSelectAllOnPage?.(allProjectIdsOnPage);
    } else {
      onDeselectAllOnPage?.(allProjectIdsOnPage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "en cours":
        return "border-blue-200 bg-blue-50 text-blue-700";
      case "terminé":
        return "border-green-200 bg-green-50 text-green-700";
      case "en attente":
        return "border-yellow-200 bg-yellow-50 text-yellow-700";
      case "annulé":
        return "border-red-200 bg-red-50 text-red-700";
      default:
        return "border-gray-200 bg-gray-50 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                  <div className="h-2 bg-muted rounded-full"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-muted rounded-full w-16"></div>
                    <div className="h-6 bg-muted rounded-full w-20"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="text-center py-16">
          <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <Building2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">
            Aucun projet trouvé
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Aucun projet ne correspond à vos critères de recherche. Essayez
            d'ajuster vos filtres ou de créer un nouveau projet.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/projects/create">Créer un nouveau projet</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Use allVisibleProjectsCount or totalItems as fallback
  const visibleProjectsCount = allVisibleProjectsCount || totalItems;

  return (
    <div className="space-y-6">
      {/* Header with View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <Tabs
            defaultValue="grid"
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "grid" | "list")}
            className="w-fit"
          >
            <TabsList className="grid w-24 grid-cols-2 h-9">
              <TabsTrigger value="grid" className="h-7 text-xs">
                <Grid className="h-3.5 w-3.5 mr-1.5" />
                Grille
              </TabsTrigger>
              <TabsTrigger value="list" className="h-7 text-xs">
                <List className="h-3.5 w-3.5 mr-1.5" />
                Liste
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Results Summary */}
          <div className="text-sm">
            <span className="font-semibold text-foreground">{totalItems}</span>
            <span className="text-muted-foreground">
              {" "}
              projet{totalItems > 1 ? "s" : ""} trouvé
              {totalItems > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Pagination Info */}
        {totalPages > 1 && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Page{" "}
              <span className="font-semibold text-foreground">
                {currentPage}
              </span>{" "}
              sur {totalPages}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Selection Header */}
      {onProjectSelect && selectedProjects.size > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={allSelectedOnPage}
                onCheckedChange={handleSelectAllChange}
                className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground h-5 w-5"
              />
              <div>
                <p className="font-medium text-foreground">
                  {selectedProjects.size} projet
                  {selectedProjects.size > 1 ? "s" : ""} sélectionné
                  {selectedProjects.size > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  sur {visibleProjectsCount} visible
                  {visibleProjectsCount > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectAllOnPage?.(allProjectIdsOnPage)}
                className="h-8"
              >
                Sélectionner la page
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeselectAllOnPage?.(allProjectIdsOnPage)}
                className="h-8"
              >
                Désélectionner tout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="group relative">
              {/* Selection Checkbox */}
              {onProjectSelect && (
                <div className="absolute top-4 left-4 z-10">
                  <Checkbox
                    checked={selectedProjects?.has(project.id)}
                    onCheckedChange={() => onProjectSelect(project.id)}
                    className="h-5 w-5 bg-white border-2 shadow-sm"
                  />
                </div>
              )}

              <Card className="h-full hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-sm overflow-hidden group-hover:shadow-xl">
                <CardContent className="p-0">
                  {/* Project Header with Status */}
                  <div className="p-6 pb-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="font-bold text-lg text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {project.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir les détails
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Exporter
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-medium px-2.5 py-0.5",
                          getStatusColor(project.status)
                        )}
                      >
                        {project.status}
                      </Badge>
                      <div className="text-sm font-semibold text-foreground">
                        {project.budget.toLocaleString()} MRU
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-foreground">
                          Progression
                        </span>
                        <span className="font-bold text-primary">
                          {project.progress}%
                        </span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="px-6 pb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 bg-muted rounded-md">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-foreground truncate">
                          {project.location}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 bg-muted rounded-md">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-foreground">
                          {project.teamSize} membres
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 bg-muted rounded-md">
                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-foreground">
                          {new Date(project.startDate).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 bg-muted rounded-md">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-foreground">
                          Budget
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-6 pb-6 pt-2 border-t">
                    <div className="flex gap-2">
                      <Button asChild size="sm" className="flex-1">
                        <Link to={`/projects/${project.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Détails
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/projects/${project.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {projects.map((project) => (
            <div key={project.id} className="group">
              <Card className="hover:shadow-md transition-all duration-200 border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="flex items-center p-4">
                    {/* Selection Checkbox */}
                    {onProjectSelect && (
                      <div className="pr-4">
                        <Checkbox
                          checked={selectedProjects?.has(project.id)}
                          onCheckedChange={() => onProjectSelect(project.id)}
                          className="h-5 w-5"
                        />
                      </div>
                    )}

                    {/* Project Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground truncate">
                          {project.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-medium px-2.5 py-0.5",
                            getStatusColor(project.status)
                          )}
                        >
                          {project.status}
                        </Badge>
                        <div className="ml-auto text-sm font-semibold text-primary">
                          {project.budget.toLocaleString()} MRU
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                        {project.description}
                      </p>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{project.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{project.teamSize} membres</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {new Date(project.startDate).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress and Actions */}
                    <div className="flex items-center gap-4 pl-6">
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progrès</span>
                          <span className="font-bold">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-9"
                        >
                          <Link to={`/projects/${project.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-9"
                        >
                          <Link to={`/projects/${project.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-6 border-t">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    currentPage > 1 && onPageChange(currentPage - 1)
                  }
                  className={cn(
                    "h-10 px-4",
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer hover:bg-muted"
                  )}
                />
              </PaginationItem>

              {visiblePages.map((page, index) => (
                <PaginationItem key={index}>
                  {page === "..." ? (
                    <PaginationEllipsis className="h-10 px-4" />
                  ) : (
                    <PaginationLink
                      onClick={() =>
                        typeof page === "number" && onPageChange(page)
                      }
                      isActive={currentPage === page}
                      className={cn(
                        "h-10 px-4 cursor-pointer",
                        currentPage === page
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "hover:bg-muted"
                      )}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    currentPage < totalPages && onPageChange(currentPage + 1)
                  }
                  className={cn(
                    "h-10 px-4",
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer hover:bg-muted"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default ProjectsGridPaginated;
