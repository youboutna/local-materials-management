import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, Grid, Filter } from "lucide-react";
import ProjectsGridPaginated from "@/components/projects/ProjectsGridPaginated";
import ProjectsHeader from "@/components/projects/ProjectsHeader";
import ProjectFilters from "@/components/projects/ProjectFilters";
import MapFilters from "@/components/projects/MapFilters";
import ProjectMap from "@/components/ProjectMap";
import InteractiveMap from "@/components/map/InteractiveMap";
import InteractiveMapGIS from "@/components/materials/InteractiveMapGIS";
import InteractiveMapFilters from "@/components/projects/InteractiveMapFilters";
import InteractiveProjectsList from "@/components/projects/InteractiveProjectsList";
import EnhancedInteractiveMap from "@/components/projects/EnhancedInteractiveMap";
import { useProjects } from "@/hooks/useProjects";
import { usePagination } from "@/hooks/usePagination";
import { ProjectData } from "@/types/project";
import { MapLocation } from "@/components/ProjectMap";
import Navbar from "@/components/Navbar";
import { useProjectsFilter } from "@/hooks/useProjectsFilter";
import WaterfallProjectManager from "@/components/project/WaterfallProjectManager";
import { ElectricSpinner } from "@/components/loading-page";
import { useBulkSelection } from "@/hooks/projects/useBulkSelection";
import BulkActions from "@/components/projects/BulkActions";
import { Button } from "@/components/ui/button";
import { ProjectService } from "@/services/ProjectService";
import { toast } from "sonner";

const Projects: React.FC = () => {
  const { projects, loading: isLoading, error } = useProjects();
  const [originalMapLocations, setOriginalMapLocations] = useState<
    MapLocation[]
  >([]);
  const [filteredMapLocations, setFilteredMapLocations] = useState<
    MapLocation[]
  >([]);
  const [interactiveFilteredProjects, setInteractiveFilteredProjects] =
    useState<ProjectData[]>([]);
  const projectService = new ProjectService();

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
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

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

  // Add delete handler
  const handleBulkDelete = async (projectIds: string[]) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer ${projectIds.length} projet(s) ? Cette action est irréversible.`
      )
    ) {
      return;
    }

    try {
      // Implement your bulk delete API call here
      console.log("Deleting projects:", projectIds);

      // Example API call (replace with your actual API):
      for (const projectId of projectIds) {
        await projectService.deleteProject(projectId);
      }
      // After successful deletion, clear selection
      clearSelection();

      // You might want to refetch projects here or update the local state
      handleReset();

      // Show success message
      toast.success(`${projectIds.length} projet(s) supprimé(s) avec succès`);
    } catch (error) {
      console.error("Error deleting projects:", error);
      toast.error("Erreur lors de la suppression des projets");
    }
  };

  // Initialize locations when projects load
  useEffect(() => {
    if (projects) {
      // Convert projects to map locations
      const locations: MapLocation[] = projects
        .filter(
          (project) =>
            project.coordinates?.latitude && project.coordinates?.longitude
        )
        .map((project) => ({
          id: project.id,
          name: project.title,
          type: "project" as const,
          latitude: project.coordinates!.latitude,
          longitude: project.coordinates!.longitude,
          status: project.status,
          region: project.location,
          startDate: project.startDate,
          endDate: project.endDate,
        }));

      console.log("Projects initialized - Total locations:", locations.length);
      setOriginalMapLocations(locations);
      setFilteredMapLocations(locations);
    }
  }, [projects]);

  // Update map locations when filtered projects change
  useEffect(() => {
    if (filteredProjects) {
      const filteredLocations: MapLocation[] = filteredProjects
        .filter(
          (project) =>
            project.coordinates?.latitude && project.coordinates?.longitude
        )
        .map((project) => ({
          id: project.id,
          name: project.title,
          type: "project" as const,
          latitude: project.coordinates!.latitude,
          longitude: project.coordinates!.longitude,
          status: project.status,
          region: project.location,
          startDate: project.startDate,
          endDate: project.endDate,
        }));

      setFilteredMapLocations(filteredLocations);
    }
  }, [filteredProjects]);

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setRegionFilter("all");
    setSortOption("newest");
  };

  const handleMapFilterChange = (filteredLocations: MapLocation[]) => {
    console.log(
      "Map filter applied - Filtered locations:",
      filteredLocations.length
    );
    setFilteredMapLocations(filteredLocations);

    // Also update the filtered projects to match the map filter
    if (projects) {
      const filteredProjectIds = new Set(
        filteredLocations.map((loc) => loc.id)
      );
      const matchingProjects = projects.filter((project) =>
        filteredProjectIds.has(project.id)
      );
      console.log(
        "Map filter - Updated grid projects:",
        matchingProjects.length
      );
      // Note: filteredProjects is handled by the hook
    }
  };
  const handleSearchChange = (query: string) => {
    setLocalSearchQuery(query);
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
    <div className="container mx-auto px-4 py-8  ">
      <div className="mt-10 space-y-6">
        <ProjectsHeader />

        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Vue Grille
            </TabsTrigger>
            <TabsTrigger value="waterfall" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Gestion Waterfall
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Carte des Projets
            </TabsTrigger>
            <TabsTrigger
              value="interactive"
              className="flex items-center gap-2"
            >
              <Map className="h-4 w-4" />
              Carte Interactive
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-6">
            {/* Add Bulk Actions Component */}
            <BulkActions
              selectedProjects={selectedProjects}
              projects={projects || []}
              onDelete={handleBulkDelete}
              onClearSelection={clearSelection}
            />

            {/* Selection Options - Separate from ProjectFilters */}
            {selectedProjects.size > 0 && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  {selectedProjects.size} élément(s) sélectionné(s) sur{" "}
                  {filteredProjects.length}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      selectAllOnPage(paginatedProjects.map((p) => p.id))
                    }
                  >
                    Sélectionner la page
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectAll(projects?.map((p) => p.id) || [])}
                  >
                    Tout sélectionner
                  </Button>

                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Tout désélectionner
                  </Button>
                </div>
              </div>
            )}

            <ProjectFilters
              searchQuery={localSearchQuery}
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

          <TabsContent value="waterfall" className="space-y-6">
            <WaterfallProjectManager />
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
                                  {project.budget.toLocaleString()} MRU
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
                console.log("Selected project:", project);
                // Navigate to project detail or show modal
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
                console.log("Selected project from list:", project);
                // Navigate to project detail or show modal
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Projects;
