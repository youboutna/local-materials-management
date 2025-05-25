import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// Fix leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon
const customIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Define status colors
export const statusColors = {
  'en cours': 'blue',
  'en attente': 'orange',
  'terminé': 'green',
  'suspendu': 'purple',
  'annulé': 'red',
  'en inspection': 'yellow',
};

export type ProjectStatus =
  | 'en cours'
  | 'en attente'
  | 'terminé'
  | 'suspendu'
  | 'annulé'
  | 'en inspection';

export interface MapLocation {
  id: string;
  name: string;
  type: 'project' | 'material' | 'supplier';
  latitude: number;
  longitude: number;
  status?: ProjectStatus;
  region?: string;
  startDate?: string;
  endDate?: string;
}

interface ProjectMapProps {
  height?: string;
  width?: string;
  selectedProject?: any;
  showAllProjects?: boolean;
  onMarkerClick?: (projectId: string) => void;
  locations?: MapLocation[];
  selectable?: boolean;
  onLocationSelect?: (latitude: number, longitude: number) => void;
  interactive?: boolean;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  className?: string;
}

// Component to handle map initialization and event listeners
function MapInitializer({ 
  selectable, 
  onLocationSelect, 
  interactive 
}: { 
  selectable: boolean; 
  onLocationSelect?: (latitude: number, longitude: number) => void; 
  interactive: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (selectable && onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    };

    if (selectable) {
      map.on('click', handleMapClick);
    }
    
    if (!interactive) {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
    }

    return () => {
      if (selectable) {
        map.off('click', handleMapClick);
      }
    };
  }, [map, selectable, onLocationSelect, interactive]);

  return null;
}

const ProjectMap = ({
  height = '400px',
  width = '100%',
  selectedProject,
  showAllProjects = false,
  onMarkerClick,
  locations,
  selectable = false,
  onLocationSelect,
  interactive = false,
  defaultCenter = [18.0735, -15.9582],
  defaultZoom = 10,
  className,
}: ProjectMapProps) => {
  const { projects, loading } = useProjects();
  const navigate = useNavigate();

  const handleMarkerClick = (projectId: string) => {
    if (onMarkerClick) {
      onMarkerClick(projectId);
    } else {
      navigate(`/projects/${projectId}`);
    }
  };

  const getMarkerIcon = (status: string = 'en attente') => {
    return customIcon;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        Chargement de la carte...
      </div>
    );
  }

  // Determine the center point for the map - prioritize selectedProject coordinates
  let mapCenter: [number, number] = defaultCenter;
  let mapZoom = defaultZoom;

  if (selectedProject?.coordinates?.latitude && selectedProject?.coordinates?.longitude) {
    mapCenter = [selectedProject.coordinates.latitude, selectedProject.coordinates.longitude];
    mapZoom = 15; // Zoom closer for specific project
  } else if (locations && locations.length > 0) {
    // Use first location if no selectedProject
    mapCenter = [locations[0].latitude, locations[0].longitude];
    mapZoom = 13;
  }

  return (
    <div
      style={{ height, width }}
      className={`border rounded-md overflow-hidden ${className || ''}`}
    >
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
      >
        <MapInitializer 
          selectable={selectable} 
          onLocationSelect={onLocationSelect} 
          interactive={interactive} 
        />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {showAllProjects &&
          projects?.map((project: any) => {
            if (project.coordinates?.latitude && project.coordinates?.longitude) {
              return (
                <Marker
                  key={project.id}
                  position={[project.coordinates.latitude, project.coordinates.longitude]}
                  eventHandlers={{
                    click: () => handleMarkerClick(project.id),
                  }}
                >
                  <Popup>
                    <div className="font-medium">{project.title}</div>
                    <div className="text-sm text-gray-600">
                      {project.location}
                    </div>
                    <Button
                      variant="link"
                      className="p-0 mt-1 h-auto"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      Voir le projet
                    </Button>
                  </Popup>
                </Marker>
              );
            }
            return null;
          })}

        {locations?.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
          >
            <Popup>
              <div className="font-medium">{location.name}</div>
              <div className="text-sm text-gray-600">{location.region || ''}</div>
              {location.type === 'project' && (
                <Button
                  variant="link"
                  className="p-0 mt-1 h-auto"
                  onClick={() => navigate(`/projects/${location.id}`)}
                >
                  Voir le projet
                </Button>
              )}
            </Popup>
          </Marker>
        ))}

        {selectedProject?.coordinates?.latitude && selectedProject?.coordinates?.longitude && (
          <Marker
            position={[selectedProject.coordinates.latitude, selectedProject.coordinates.longitude]}
          >
            <Popup>
              <div className="font-medium">{selectedProject.title || selectedProject.name}</div>
              <div className="text-sm text-gray-600">{selectedProject.location}</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default ProjectMap;
