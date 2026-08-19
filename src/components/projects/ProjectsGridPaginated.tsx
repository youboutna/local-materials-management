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
  Eye,
  Pencil,
  Rows3,
  LayoutGrid,
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
  // UX 3.1 — densité d'affichage des cartes, préférence conservée localement.
  const [density, setDensityState] = React.useState<"compact" | "detailed">(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("projects.cardDensity") : null;
    return stored === "detailed" ? "detailed" : "compact";
  });
  const setDensity = (value: "compact" | "detailed") => {
    setDensityState(value);
    try {
      window.localStorage.setItem("projects.cardDensity", value);
    } catch {
      /* préférence non persistable (mode privé) : ignoré */
    }
  };
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

      {/* Results summary + densité d'affichage (UX 3.1) */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {totalItems} projet{totalItems > 1 ? "s" : ""} trouvé
          {totalItems > 1 ? "s" : ""}
          {totalPages > 1 ? ` · Page ${currentPage} sur ${totalPages}` : ""}
        </p>
        <div className="flex items-center gap-1 rounded-md border p-0.5">
          <Button
            variant={density === "compact" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setDensity("compact")}
            aria-pressed={density === "compact"}
          >
            <Rows3 className="h-3.5 w-3.5 mr-1" /> Compact
          </Button>
          <Button
            variant={density === "detailed" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setDensity("detailed")}
            aria-pressed={density === "detailed"}
          >
            <LayoutGrid className="h-3.5 w-3.5 mr-1" /> Détaillé
          </Button>
        </div>
      </div>

      {/* Projects Grid — carte entière cliquable, actions visibles sans scroll */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const compact = density === "compact";
          return (
            <div key={project.id} className="relative group">
              {onProjectSelect && (
                <div className="absolute top-3 left-3 z-20">
                  <Checkbox
                    checked={selectedProjects?.has(project.id)}
                    onCheckedChange={() => onProjectSelect(project.id)}
                    aria-label={`Sélectionner ${project.title}`}
                  />
                </div>
              )}

              {/* Barre d'actions flottante au survol */}
              <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <Button asChild size="icon" variant="secondary" className="h-7 w-7">
                  <Link to={`/projects/${project.id}`} aria-label="Voir les détails">
                    <Eye className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button asChild size="icon" variant="secondary" className="h-7 w-7">
                  <Link to={`/projects/${project.id}/edit`} aria-label="Modifier le projet">
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-ring">
                <CardContent className={compact ? "p-4" : "p-5"}>
                  <div className={compact ? "space-y-2" : "space-y-3"}>
                    <div className="flex justify-between items-start gap-3 pr-16">
                      <Link
                        to={`/projects/${project.id}`}
                        className="font-semibold text-base text-foreground line-clamp-2 hover:underline outline-none"
                      >
                        {project.title}
                      </Link>
                      <StatusBadge status={project.status} />
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>

                    {compact ? (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {project.location && (
                          <span className="inline-flex items-center gap-1 max-w-[45%] truncate">
                            <MapPin className="h-3.5 w-3.5" /> {project.location}
                          </span>
                        )}
                        {project.startDate && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {new Date(project.startDate).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {project.teamSize}
                        </span>
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                          <DollarSign className="h-3.5 w-3.5" />
                          {project.budget.toLocaleString()} MRU
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {project.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{project.location}</span>
                          </div>
                        )}
                        {project.startDate && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            Début: {new Date(project.startDate).toLocaleDateString("fr-FR")}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {project.teamSize} membres
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {project.budget.toLocaleString()} MRU
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Badge variant="outline" className="text-[11px]">
                        {project.progress}% avancement
                      </Badge>
                      <div className="flex gap-1.5">
                        <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                          <Link to={`/projects/${project.id}/edit`}>Modifier</Link>
                        </Button>
                        <Button asChild size="sm" className="h-7 px-2 text-xs">
                          <Link to={`/projects/${project.id}`}>Voir les détails</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
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
