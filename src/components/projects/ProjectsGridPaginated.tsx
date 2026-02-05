import React from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Users,
  Building2,
  DollarSign,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ProjectData } from '@/dtos/entities/ProjectDTO';
import StatusBadge from "@/components/StatusBadge";
import { Checkbox } from "../ui/checkbox";

interface ProjectsGridPaginatedProps {
  projects: ProjectData[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  // New props for bulk selection
  selectedProjects?: Set<string>;
  onProjectSelect?: (projectId: string) => void;
  onSelectAllOnPage?: (projectIds: string[]) => void;
  onDeselectAllOnPage?: (projectIds: string[]) => void;
}

const ProjectsGridPaginated: React.FC<ProjectsGridPaginatedProps> = ({
  projects,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  selectedProjects,
  onProjectSelect,
  onSelectAllOnPage,
  onDeselectAllOnPage,
  isLoading = false,
}) => {
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

  // NEW: Selection state calculation
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-20"></div>
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
      <Card>
        <CardContent className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Aucun projet trouvé
          </h3>
          <p className="text-muted-foreground">
            Aucun projet ne correspond à vos critères de recherche.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selection Header - NEW */}
      {onProjectSelect && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={allSelectedOnPage}
              onCheckedChange={handleSelectAllChange}
              className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
            />
            <span className="text-sm font-medium">
              {selectedProjects?.size} sélectionné(s)
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectAllOnPage?.(allProjectIdsOnPage)}
            >
              Sélectionner la page
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDeselectAllOnPage?.(allProjectIdsOnPage)}
            >
              Désélectionner la page
            </Button>
          </div>
        </div>
      )}

      {/* Results summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {totalItems} projet{totalItems > 1 ? "s" : ""} trouvé
          {totalItems > 1 ? "s" : ""}
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </p>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="relative group">
            {/* Checkbox overlay - NEW */}
            {onProjectSelect && (
              <div className="absolute top-3 left-3 z-10">
                <Checkbox
                  checked={selectedProjects?.has(project.id)}
                  onCheckedChange={() => onProjectSelect(project.id)}
                />
              </div>
            )}
            <Card className="hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-semibold text-lg text-foreground line-clamp-2">
                      {project.title}
                    </h3>
                    <StatusBadge status={project.status} />
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {project.description}
                  </p>

                  <div className="space-y-2">
                    {project.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {project.location}
                        </span>
                      </div>
                    )}

                    {project.startDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Début:{" "}
                          {new Date(project.startDate).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {project.teamSize} membres
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {project.budget.toLocaleString()} MRU
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="text-sm text-muted-foreground">
                      Progrès: {project.progress}%
                    </div>
                    <Button asChild size="sm">
                      <Link to={`/projects/${project.id}`}>
                        Voir les détails
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {visiblePages.map((page, index) => (
              <PaginationItem key={index}>
                {page === "..." ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() =>
                      typeof page === "number" && onPageChange(page)
                    }
                    isActive={currentPage === page}
                    className="cursor-pointer"
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
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default ProjectsGridPaginated;
