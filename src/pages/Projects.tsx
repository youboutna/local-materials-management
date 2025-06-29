
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, Grid, Filter } from "lucide-react";
import ProjectsGrid from "@/components/projects/ProjectsGrid";
import ProjectsHeader from "@/components/projects/ProjectsHeader";
import ProjectFilters from "@/components/projects/ProjectFilters";
import MapFilters from "@/components/projects/MapFilters";
import ProjectMap from "@/components/ProjectMap";
import InteractiveMap from "@/components/map/InteractiveMap";
import { useProjects } from "@/hooks/useProjects";
import { ProjectData } from "@/types/project";
import { MapLocation } from "@/components/ProjectMap";
import Navbar from "@/components/Navbar";

const Projects: React.FC = () => {
  const { projects, loading: isLoading, error } = useProjects();
  const [filteredProjects, setFilteredProjects] = useState<ProjectData[]>([]);
  const [originalMapLocations, setOriginalMapLocations] = useState<MapLocation[]>([]);
  const [filteredMapLocations, setFilteredMapLocations] = useState<MapLocation[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Initialize locations when projects load
  useEffect(() => {
    if (projects) {
      setFilteredProjects(projects);

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

      console.log('Projects initialized - Total locations:', locations.length);
      setOriginalMapLocations(locations);
      setFilteredMapLocations(locations);
    }
  }, [projects]);

  const handleFilterChange = (filters: any) => {
    if (!projects) return;

    console.log('Grid filters applied:', filters);
    let filtered = [...projects];

    // Apply filters
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter(
        (project) => project.status === filters.status
      );
    }

    if (filters.location) {
      filtered = filtered.filter((project) =>
        project.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.dateRange) {
      // Apply date range filter if needed
    }

    setFilteredProjects(filtered);
    setSelectedRegion(filters.location || "");
    setSelectedStatus(filters.status || "");

    // Update map locations based on filtered projects
    const filteredLocations: MapLocation[] = filtered
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

    console.log('Grid filter - Updated map locations:', filteredLocations.length);
    setFilteredMapLocations(filteredLocations);
  };

  const handleMapFilterChange = (filteredLocations: MapLocation[]) => {
    console.log('Map filter applied - Filtered locations:', filteredLocations.length);
    setFilteredMapLocations(filteredLocations);
    
    // Also update the filtered projects to match the map filter
    if (projects) {
      const filteredProjectIds = new Set(filteredLocations.map(loc => loc.id));
      const matchingProjects = projects.filter(project => filteredProjectIds.has(project.id));
      console.log('Map filter - Updated grid projects:', matchingProjects.length);
      setFilteredProjects(matchingProjects);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Chargement des projets...</div>
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
      <Navbar />
      <div className="mt-10 space-y-6">
        <ProjectsHeader />

        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Vue Grille
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtres
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectFilters onFilterChange={handleFilterChange} />
              </CardContent>
            </Card>

            <ProjectsGrid projects={filteredProjects} />
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
                  focusRegion={selectedRegion}
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
                      const project = projects?.find(p => p.id === location.id);
                      return (
                        <div key={location.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <h4 className="font-medium text-lg mb-2">{location.name}</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Région:</strong> {location.region}</p>
                            <p><strong>Statut:</strong> 
                              <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                location.status === 'en cours' ? 'bg-blue-100 text-blue-800' :
                                location.status === 'terminé' ? 'bg-green-100 text-green-800' :
                                location.status === 'en attente' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {location.status}
                              </span>
                            </p>
                            {project && (
                              <>
                                <p><strong>Budget:</strong> {project.budget.toLocaleString()} MRO</p>
                                <p><strong>Équipe:</strong> {project.teamSize} membres</p>
                                <p><strong>Progrès:</strong> {project.progress}%</p>
                              </>
                            )}
                            <p className="text-xs text-gray-500">
                              Coordonnées: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                            </p>
                            {location.startDate && (
                              <p><strong>Début:</strong> {new Date(location.startDate).toLocaleDateString('fr-FR')}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {filteredMapLocations.length === 0 && originalMapLocations.length > 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-gray-500">
                    <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Aucun projet trouvé</h3>
                    <p>Aucun projet ne correspond aux critères de filtrage sélectionnés.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="interactive" className="space-y-6">
            <InteractiveMap
              title="Carte Interactive des Projets"
              description="Explorez tous les projets sur une carte interactive de la Mauritanie"
              allowPolygon={false}
              className="min-h-[600px]"
            />

            {originalMapLocations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Projets avec Coordonnées GPS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {originalMapLocations.map((location) => (
                      <div key={location.id} className="p-3 border rounded-lg">
                        <h4 className="font-medium">{location.name}</h4>
                        <p className="text-sm text-gray-600 truncate">
                          {location.region}
                        </p>
                        <p className="text-xs text-gray-500">
                          {location.latitude.toFixed(6)},{" "}
                          {location.longitude.toFixed(6)}
                        </p>
                        {location.status && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                            {location.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Projects;
