import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PortfolioMetricsSummary from "@/components/project/PortfolioMetricsSummary";
import {
  getProjectListViews,
  getDefaultProjectListView,
} from "@/config/referentials/projects/project-list-views.referential";
import { Map, Grid, Filter, Plus } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import ProjectsGridPaginated from "@/components/projects/ProjectsGridPaginated";
import ProjectFilters from "@/components/projects/ProjectFilters";
import MapFilters from "@/components/projects/MapFilters";
import ProjectMap from "@/components/ProjectMap";
import InteractiveMapFilters from "@/components/projects/InteractiveMapFilters";
import InteractiveProjectsList from "@/components/projects/InteractiveProjectsList";
import EnhancedInteractiveMap from "@/components/projects/EnhancedInteractiveMap";
import { useProjectsHex } from "@/hooks/hexagonal";
import { usePagination } from "@/hooks/usePagination";
import { ProjectData } from '@/dtos/entities/ProjectDTO';
import { MapLocation } from '@/domain/entities/Location';
import { useProjectsFilter } from "@/hooks/useProjectsFilter";
import { ElectricSpinner } from "@/components/loading-page";
import { useBulkSelection } from "@/hooks/projects/useBulkSelection";
import BulkActions from "@/components/projects/BulkActions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatAmount2 } from "@/utils/reportNumbers";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProjectCoordinates } from "@/utils/projectLocationBuckets";

const Projects: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  // Use hexagonal architecture hook
  const { projects: hexProjects, isLoading, error, deleteProject } = useProjectsHex();
  const projects = React.useMemo(() => hexProjects ?? [], [hexProjects]);
  
  const [filteredMapLocations, setFilteredMapLocations] = useState<MapLocation[]>([]);
  const [interactiveFilteredProjects, setInteractiveFilteredProjects] = useState<ProjectData[]>([]);

  // Use the projects filter hook
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    regionFilter,
    setRegionFilter,
    sortOption,
    setSortOption,
    filteredProjects,
    searchResults,
    showSearchResults,
    handleSelectSearchResult,
    clearSearch,
    availableStatuses,
    availableRegions,
    performSearch,
  } = useProjectsFilter(projects || []);

  // Sync ?stage= or ?status= from URL into the status filter (e.g. sidebar deep links)
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const stage = searchParams.get('stage');
    const status = searchParams.get('status');
    if (status) {
      setStatusFilter(status);
      return;
    }
    if (!stage) return;
    // Map lifecycle stage → coarse project status filter (best-effort, no hardcoded enums)
    const stageToStatus: Record<string, string> = {
      PLANIFICATION: 'en attente',
      EXECUTION: 'en cours',
      CONTROLE: 'en cours',
      CLOTURE: 'terminé',
    };
    const target = stageToStatus[stage];
    if (target) setStatusFilter(target);
  }, [searchParams, setStatusFilter]);

  // Pagination for projects
  const {
    currentData: paginatedProjects,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
  } = usePagination({
    data: filteredProjects,
    itemsPerPage: 20,
  });

  // Add bulk selection
  const {
    selectedProjects,
    toggleProjectSelection,
    selectAllOnPage,
    deselectAllOnPage,
    selectAll,
    clearSelection,
    isProjectSelected,
  } = useBulkSelection();

  // Add delete handler using hexagonal architecture
  const handleBulkDelete = async (projectIds: string[]) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer ${projectIds.length} projet(s) ? Cette action est irréversible.`
      )
    ) {
      return;
    }

    try {
      // Use hexagonal delete via use case
      for (const projectId of projectIds) {
        await deleteProject(projectId);
      }
      clearSelection();
      handleReset();
      toast.success(`${projectIds.length} projet(s) supprimé(s) avec succès`);
    } catch (err) {
      console.error("Error deleting projects:", err);
      toast.error("Erreur lors de la suppression des projets");
    }
  };

  // Memoized location conversion to avoid repeated filtering
  const originalMapLocations = React.useMemo(() => {
    if (!projects) return [];
    
    return projects
      .filter((project) => Boolean(getProjectCoordinates(project)))
      .map((project) => {
        const coords = getProjectCoordinates(project)!;
        return {
        id: project.id,
        name: project.title,
        type: "project" as const,
        latitude: coords.latitude,
        longitude: coords.longitude,
        status: project.status,
        region: project.location,
        startDate: project.startDate,
        endDate: project.endDate,
        interventionZone: (project as { interventionZone?: import('@/dtos/entities/InterventionZoneDTO').InterventionZoneDTO }).interventionZone,
        };
      });

  }, [projects]);

  // Initialize map locations from the memoized list (aucune recréation à chaque
  // rendu : évite la boucle "Maximum update depth exceeded").
  useEffect(() => {
    setFilteredMapLocations((current) => {
      const unchanged =
        current.length === originalMapLocations.length &&
        current.every((location, index) => location.id === originalMapLocations[index]?.id);
      return unchanged ? current : originalMapLocations;
    });
  }, [originalMapLocations]);


  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setRegionFilter("all");
    setSortOption("newest");
  };

  const handleMapFilterChange = useCallback((filteredLocations: MapLocation[]) => {
    setFilteredMapLocations((current) => {
      const unchanged =
        current.length === filteredLocations.length &&
        current.every((location, index) => location.id === filteredLocations[index]?.id);
      return unchanged ? current : filteredLocations;
    });
  }, []);
  const handleSearchChange = (query: string) => {
    // Supprimer setLocalSearchQuery pour éviter la dépendance circulaire
    // setLocalSearchQuery(query);
    setSearchQuery(query); // This will trigger the debounced search
  };
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <ElectricSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          Erreur lors du chargement des projets
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      showBreadcrumb
      pageTitle={t("nav.projects")}
      pageDescription={`${filteredProjects.length} projets`}
      actions={
        <Button asChild>
          <Link to="/projects/create">
            <Plus className="h-4 w-4 mr-2" />
            {t("projects.new")}
          </Link>
        </Button>
      }
    >
      <div className="space-y-3">
        {/* Synthèse portefeuille — commune à tous les onglets de la liste.
            Source unique : ProjectMetricsOrchestrator. */}
        <PortfolioMetricsSummary projects={filteredProjects} />

        <Tabs defaultValue={getDefaultProjectListView()} className="w-full">
          <TabsList
            className="grid w-full h-9"
            style={{ gridTemplateColumns: `repeat(${getProjectListViews().length}, minmax(0, 1fr))` }}
          >
            {getProjectListViews().map((view) => {
              const Icon = view.icon === "Grid" ? Grid : view.icon === "Filter" ? Filter : Map;
              return (
                <TabsTrigger
                  key={view.uiValue}
                  value={view.uiValue}
                  className="flex items-center gap-2 text-xs"
                  title={view.description?.fr}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {view.label.fr}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="grid" className="space-y-3">
            {/* Add Bulk Actions Component */}
            <BulkActions
              selectedProjects={selectedProjects}
              projects={projects || []}
              onDelete={handleBulkDelete}
              onClearSelection={clearSelection}
            />

            {/* Selection Options - compact */}
            {selectedProjects.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-muted/40 rounded-md text-xs">
                <span className="text-muted-foreground">
                  {selectedProjects.size} sélectionné(s) / {filteredProjects.length}
                </span>
                <div className="flex gap-1.5 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() =>
                      selectAllOnPage(paginatedProjects.map((p) => p.id))
                    }
                  >
                    Page
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => selectAll(projects?.map((p) => p.id) || [])}
                  >
                    Tout
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={clearSelection}>
                    Effacer
                  </Button>
                </div>
              </div>
            )}


            <ProjectFilters
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onSearchSubmit={performSearch}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              regionFilter={regionFilter}
              onRegionChange={setRegionFilter}
              sortOption={sortOption}
              onSortChange={setSortOption}
              availableStatuses={availableStatuses}
              availableRegions={availableRegions}
              onReset={handleReset}
              resultCount={filteredProjects.length}
            />

            <ProjectsGridPaginated
              projects={paginatedProjects}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={goToPage}
              isLoading={isLoading}
              selectedProjects={selectedProjects}
              onProjectSelect={toggleProjectSelection}
              onSelectAllOnPage={selectAllOnPage}
              onDeselectAllOnPage={deselectAllOnPage}
            />
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <MapFilters
              locations={originalMapLocations}
              onFilterChange={handleMapFilterChange}
            />

            <Card>
              <CardContent className="p-0">
                <ProjectMap
                  locations={filteredMapLocations}
                  height="600px"
                  focusRegion={
                    regionFilter !== "all" ? regionFilter : undefined
                  }
                  className="rounded-lg"
                />
              </CardContent>
            </Card>

            {/* Project Details based on filtered results */}
            {filteredMapLocations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Projets Filtrés ({filteredMapLocations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMapLocations.map((location) => {
                      const project = projects?.find(
                        (p) => p.id === location.id
                      );
                      return (
                        <div
                          key={location.id}
                          className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                        >
                          <h4 className="font-medium text-lg mb-2">
                            {location.name}
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              <strong>Région:</strong> {location.region}
                            </p>
                            <p>
                              <strong>Statut:</strong>
                              <span
                                className={`ml-1 px-2 py-1 rounded text-xs ${
                                  location.status === "en cours"
                                    ? "bg-blue-100 text-blue-800"
                                    : location.status === "terminé"
                                    ? "bg-green-100 text-green-800"
                                    : location.status === "en attente"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {location.status}
                              </span>
                            </p>
                            {project && (
                              <>
                                <p>
                                  <strong>Budget:</strong>{" "}
                                  {formatAmount2(project.budget)}
                                </p>
                                <p>
                                  <strong>Équipe:</strong> {project.teamSize}{" "}
                                  membres
                                </p>
                                <p>
                                  <strong>Progrès:</strong> {project.progress}%
                                </p>
                              </>
                            )}
                            <p className="text-xs text-gray-500">
                              Coordonnées: {location.latitude.toFixed(6)},{" "}
                              {location.longitude.toFixed(6)}
                            </p>
                            {location.startDate && (
                              <p>
                                <strong>Début:</strong>{" "}
                                {new Date(
                                  location.startDate
                                ).toLocaleDateString("fr-FR")}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {filteredMapLocations.length === 0 &&
              originalMapLocations.length > 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <div className="text-gray-500">
                      <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">
                        Aucun projet trouvé
                      </h3>
                      <p>
                        Aucun projet ne correspond aux critères de filtrage
                        sélectionnés.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
          </TabsContent>

          <TabsContent value="interactive" className="space-y-6">
            {/* Interactive Map Filters */}
            <InteractiveMapFilters
              projects={projects || []}
              onFiltersChange={setInteractiveFilteredProjects}
            />

            {/* Enhanced Interactive Map */}
            <EnhancedInteractiveMap
              projects={
                interactiveFilteredProjects.length > 0
                  ? interactiveFilteredProjects
                  : projects || []
              }
              onProjectSelect={(project) => {
                navigate(`/projects/${project.id}`);
              }}
            />

            {/* Projects List with Pagination */}
            <InteractiveProjectsList
              projects={
                interactiveFilteredProjects.length > 0
                  ? interactiveFilteredProjects
                  : projects || []
              }
              onProjectSelect={(project) => {
                navigate(`/projects/${project.id}`);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Projects;
