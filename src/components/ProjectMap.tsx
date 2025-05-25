
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ProjectData } from './ProjectCard';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Export types and constants that are used in other files
export interface MapLocation {
  id: string;
  name: string;
  type: 'project' | 'material';
  latitude: number;
  longitude: number;
  status?: string;
  region?: string;
  startDate?: string;
  endDate?: string;
}

export type ProjectStatus = 'en cours' | 'terminé' | 'en attente' | 'en inspection' | 'suspendu' | 'annulé';

export const statusColors = {
  'en cours': '#3b82f6',
  'terminé': '#10b981',
  'en attente': '#f59e0b',
  'en inspection': '#eab308',
  'suspendu': '#8b5cf6',
  'annulé': '#ef4444'
};

interface ProjectMapProps {
  projects?: ProjectData[];
  selectedProject?: ProjectData | null;
  onProjectSelect?: (project: ProjectData) => void;
  className?: string;
  locations?: MapLocation[];
  defaultCenter?: number[];
  defaultZoom?: number;
  height?: string;
  width?: string;
  selectable?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  interactive?: boolean;
}

const ProjectMap: React.FC<ProjectMapProps> = ({ 
  projects = [], 
  selectedProject, 
  onProjectSelect,
  className = "",
  locations = [],
  defaultCenter,
  defaultZoom = 7,
  height = "400px",
  width = "100%",
  selectable = false,
  onLocationSelect,
  interactive = true
}) => {
  // Filter projects that have coordinates
  const projectsWithCoordinates = useMemo(() => {
    return projects.filter(project => 
      project.coordinates && 
      project.coordinates.latitude && 
      project.coordinates.longitude
    );
  }, [projects]);

  // Calculate map center based on projects or use provided defaults
  const mapCenter: LatLngExpression = useMemo(() => {
    if (defaultCenter && defaultCenter.length === 2) {
      return [defaultCenter[0], defaultCenter[1]];
    }
    
    if (selectedProject?.coordinates) {
      return [selectedProject.coordinates.latitude, selectedProject.coordinates.longitude];
    }
    
    if (projectsWithCoordinates.length > 0) {
      const avgLat = projectsWithCoordinates.reduce((sum, p) => sum + p.coordinates!.latitude, 0) / projectsWithCoordinates.length;
      const avgLng = projectsWithCoordinates.reduce((sum, p) => sum + p.coordinates!.longitude, 0) / projectsWithCoordinates.length;
      return [avgLat, avgLng];
    }
    
    // Default to Nouakchott, Mauritania
    return [18.079052, -15.965634];
  }, [projectsWithCoordinates, selectedProject, defaultCenter]);

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || '#6b7280';
  };

  // Handle map click for location selection
  const handleMapClick = (e: any) => {
    if (selectable && onLocationSelect) {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    }
  };

  if (projectsWithCoordinates.length === 0 && locations.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`} style={{ height, width }}>
        <p className="text-gray-600">Aucun projet avec coordonnées géographiques à afficher</p>
      </div>
    );
  }

  // Prepare MapContainer props
  const mapContainerProps: any = {
    center: mapCenter,
    zoom: defaultZoom,
    style: { height: '100%', width: '100%' },
    className: "rounded-lg"
  };

  // Add click handler only if selectable
  if (selectable) {
    mapContainerProps.eventHandlers = { click: handleMapClick };
  }

  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <MapContainer {...mapContainerProps}>
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render project markers */}
        {projectsWithCoordinates.map((project) => (
          <Marker
            key={project.id}
            position={[project.coordinates!.latitude, project.coordinates!.longitude] as LatLngExpression}
            eventHandlers={{
              click: () => onProjectSelect?.(project),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm">{project.title}</h3>
                <p className="text-xs text-gray-600 mb-1">{project.location}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span 
                    className="px-2 py-1 rounded text-white"
                    style={{ backgroundColor: getStatusColor(project.status) }}
                  >
                    {project.status}
                  </span>
                  <span className="text-gray-700">{project.progress}%</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Budget: {project.budget.toLocaleString()} MRU
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render location markers */}
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude] as LatLngExpression}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm">{location.name}</h3>
                <p className="text-xs text-gray-600">{location.type}</p>
                {location.status && (
                  <span 
                    className="px-2 py-1 rounded text-white text-xs"
                    style={{ backgroundColor: getStatusColor(location.status) }}
                  >
                    {location.status}
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend - only show for projects */}
      {projectsWithCoordinates.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
          <h4 className="text-xs font-semibold mb-2">Statuts des projets</h4>
          <div className="space-y-1">
            {[
              { status: 'en cours', label: 'En cours' },
              { status: 'terminé', label: 'Terminé' },
              { status: 'en attente', label: 'En attente' },
              { status: 'en inspection', label: 'En inspection' },
              { status: 'suspendu', label: 'Suspendu' },
              { status: 'annulé', label: 'Annulé' }
            ].map(({ status, label }) => (
              <div key={status} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getStatusColor(status) }}
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMap;
