
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, Grid, Filter } from 'lucide-react';
import ProjectsGrid from '@/components/projects/ProjectsGrid';
import ProjectsHeader from '@/components/projects/ProjectsHeader';
import ProjectFilters from '@/components/projects/ProjectFilters';
import MapFilters from '@/components/projects/MapFilters';
import ProjectMap from '@/components/ProjectMap';
import InteractiveMap from '@/components/map/InteractiveMap';
import { useProjects } from '@/hooks/useProjects';
import { ProjectData } from '@/types/project';
import { MapLocation } from '@/components/ProjectMap';

const Projects: React.FC = () => {
  const { projects, loading: isLoading, error } = useProjects();
  const [filteredProjects, setFilteredProjects] = useState<ProjectData[]>([]);
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    if (projects) {
      setFilteredProjects(projects);
      
      // Convert projects to map locations
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
    }
  }, [projects]);

  const handleFilterChange = (filters: any) => {
    if (!projects) return;
    
    let filtered = [...projects];
    
    // Apply filters
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(project => project.status === filters.status);
    }
    
    if (filters.location) {
      filtered = filtered.filter(project => 
        project.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    if (filters.dateRange) {
      // Apply date range filter if needed
    }
    
    setFilteredProjects(filtered);
    setSelectedRegion(filters.location || '');
    setSelectedStatus(filters.status || '');
    
    // Update map locations based on filtered projects
    const filteredLocations: MapLocation[] = filtered
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
    
    setMapLocations(filteredLocations);
  };

  const handleMapFilterChange = (filteredLocations: MapLocation[]) => {
    setMapLocations(filteredLocations);
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
        <div className="text-center text-red-600">Erreur lors du chargement des projets</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
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
          <TabsTrigger value="interactive" className="flex items-center gap-2">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres de la carte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MapFilters 
                locations={mapLocations} 
                onFilterChange={handleMapFilterChange} 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-0">
              <ProjectMap 
                locations={mapLocations}
                height="600px"
                focusRegion={selectedRegion}
                className="rounded-lg"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactive" className="space-y-6">
          <InteractiveMap
            title="Carte Interactive des Projets"
            description="Explorez tous les projets sur une carte interactive de la Mauritanie"
            allowPolygon={false}
            className="min-h-[600px]"
          />
          
          {mapLocations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Projets avec Coordonnées GPS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mapLocations.map((location) => (
                    <div key={location.id} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{location.name}</h4>
                      <p className="text-sm text-gray-600">{location.region}</p>
                      <p className="text-xs text-gray-500">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
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
  );
};

export default Projects;
