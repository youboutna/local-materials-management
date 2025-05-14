
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProjectsHeader from '@/components/projects/ProjectsHeader';
import ProjectFilters from '@/components/projects/ProjectFilters';
import ProjectsGrid from '@/components/projects/ProjectsGrid';
import EmptyProjectsState from '@/components/projects/EmptyProjectsState';
import { useProjectsFilter } from '@/hooks/useProjectsFilter';
import { useProjects } from '@/hooks/projects/useProjects';
import ProjectMap from '@/components/ProjectMap';
import MapFilters from '@/components/projects/MapFilters';
import { MapLocation } from '@/components/ProjectMap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, List } from 'lucide-react';

const Projects = () => {
  const { projects, loading } = useProjects();
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [filteredMapLocations, setFilteredMapLocations] = useState<MapLocation[]>([]);
  
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortOption,
    setSortOption,
    filteredProjects,
    searchResults,
    showSearchResults,
    handleSelectSearchResult,
    clearSearch
  } = useProjectsFilter(projects);

  // Convert projects to map locations
  useEffect(() => {
    if (projects && projects.length > 0) {
      const locations: MapLocation[] = projects
        .filter(project => project.coordinates?.latitude && project.coordinates?.longitude)
        .map(project => ({
          id: project.id,
          name: project.title,
          type: 'project' as const,
          latitude: project.coordinates!.latitude,
          longitude: project.coordinates!.longitude,
          status: project.status,
          region: project.location,
          startDate: project.startDate,
          endDate: project.endDate
        }));
      
      setMapLocations(locations);
      setFilteredMapLocations(locations);
    }
  }, [projects]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-adrar-600">Chargement des projets...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <ProjectsHeader title="Projets" />
          
          {/* View Toggle Tabs */}
          <Tabs defaultValue="list" className="mt-6 mb-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Liste
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Carte
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="mt-6">
              {/* Filters and Actions */}
              <ProjectFilters 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sortOption={sortOption}
                setSortOption={setSortOption}
                searchResults={searchResults}
                showSearchResults={showSearchResults}
                handleSelectSearchResult={handleSelectSearchResult}
                clearSearch={clearSearch}
              />
              
              {/* Projects Grid or Empty State */}
              {filteredProjects.length > 0 ? (
                <ProjectsGrid projects={filteredProjects} />
              ) : (
                <EmptyProjectsState />
              )}
            </TabsContent>
            
            <TabsContent value="map" className="mt-6">
              {/* Map Filters */}
              <MapFilters 
                locations={mapLocations} 
                onFilterChange={setFilteredMapLocations} 
              />
              
              {/* Map View */}
              {mapLocations.length > 0 ? (
                <div className="h-[600px]">
                  <ProjectMap 
                    locations={filteredMapLocations}
                    defaultCenter={[20.5279, -10.0309]}
                    defaultZoom={6}
                    className="h-full"
                  />
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-elegant p-8 text-center">
                  <MapPin className="h-12 w-12 text-adrar-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-adrar-800 mb-2">Aucun projet géolocalisé</h3>
                  <p className="text-adrar-600">
                    Aucun projet avec des coordonnées géographiques n'a été trouvé.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Projects;
