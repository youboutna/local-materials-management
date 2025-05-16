
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
  shadowSize: [41, 41]
});

// Define status colors
export const statusColors = {
  'en cours': 'blue',
  'en attente': 'orange',
  'terminé': 'green',
  'suspendu': 'purple',
  'annulé': 'red',
  // Add more statuses as needed
};

export type ProjectStatus = 'en cours' | 'en attente' | 'terminé' | 'suspendu' | 'annulé';

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

// MapView component to handle map center and zoom changes
const MapView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

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
  defaultCenter = [18.0735, -15.9582], // Nouakchott coordinates
  defaultZoom = 10,
  className,
}: ProjectMapProps) => {
  const { projects, loading } = useProjects();
  const navigate = useNavigate();
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [mapZoom, setMapZoom] = useState(defaultZoom);

  useEffect(() => {
    if (selectedProject && selectedProject.latitude && selectedProject.longitude) {
      setMapCenter([selectedProject.latitude, selectedProject.longitude]);
      setMapZoom(13);
    }
  }, [selectedProject]);

  const handleMarkerClick = (projectId: string) => {
    if (onMarkerClick) {
      onMarkerClick(projectId);
    } else {
      navigate(`/projects/${projectId}`);
    }
  };

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (selectable && onLocationSelect) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  };

  const getMarkerIcon = (status: string = 'en attente') => {
    // Using the default icon for now - later could be customized by status
    return customIcon;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Chargement de la carte...</div>;
  }

  return (
    <div style={{ height, width }} className={`border rounded-md overflow-hidden ${className || ''}`}>
      <MapContainer 
        style={{ height: '100%', width: '100%' }}
        center={mapCenter}
        zoom={mapZoom}
      >
        <TileLayer
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {selectable && interactive && (
          <div className="leaflet-map-click-handler" onClick={(e) => handleMapClick(e as any)} />
        )}

        {showAllProjects && projects && projects.map((project: any) => {
          if (project.latitude && project.longitude) {
            return (
              <Marker
                key={project.id}
                position={[project.latitude, project.longitude]}
                icon={getMarkerIcon(project.status)}
                eventHandlers={{
                  click: () => handleMarkerClick(project.id),
                }}
              >
                <Popup>
                  <div className="font-medium">{project.name}</div>
                  <div className="text-sm text-gray-600">{project.location}</div>
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

        {locations && locations.map((location) => (
          <Marker 
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={getMarkerIcon(location.status)}
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

        {selectedProject && selectedProject.latitude && selectedProject.longitude && (
          <Marker 
            position={[selectedProject.latitude, selectedProject.longitude]}
            icon={getMarkerIcon(selectedProject.status)}
          >
            <Popup>
              <div className="font-medium">{selectedProject.name}</div>
              <div className="text-sm text-gray-600">{selectedProject.location}</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default ProjectMap;
