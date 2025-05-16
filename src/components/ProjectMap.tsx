
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

const statusColors = {
  'en cours': 'blue',
  'en attente': 'orange',
  'terminé': 'green',
  'suspendu': 'purple',
  'annulé': 'red',
  // Add more statuses as needed
};

type ProjectMapProps = {
  height?: string;
  width?: string;
  selectedProject?: any;
  showAllProjects?: boolean;
  onMarkerClick?: (projectId: string) => void;
};

const ProjectMap = ({
  height = '400px',
  width = '100%',
  selectedProject,
  showAllProjects = false,
  onMarkerClick,
}: ProjectMapProps) => {
  const { projects, isLoading } = useProjects();
  const navigate = useNavigate();
  const [mapCenter, setMapCenter] = useState<[number, number]>([18.0735, -15.9582]); // Nouakchott coordinates
  const [mapZoom, setMapZoom] = useState(10);

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

  const getMarkerIcon = (status: string) => {
    const color = statusColors[status as keyof typeof statusColors] || 'gray';
    
    // Using the default icon for now - later could be customized by status
    return customIcon;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Chargement de la carte...</div>;
  }

  return (
    <div style={{ height, width }} className="border rounded-md overflow-hidden">
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        />

        {showAllProjects && projects && projects.map((project: any) => {
          if (project.latitude && project.longitude) {
            return (
              <Marker
                key={project.id}
                position={[project.latitude, project.longitude]}
                eventHandlers={{
                  click: () => handleMarkerClick(project.id),
                }}
                icon={getMarkerIcon(project.status)}
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
