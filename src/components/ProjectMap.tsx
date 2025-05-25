
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

interface ProjectMapProps {
  projects: ProjectData[];
  selectedProject?: ProjectData | null;
  onProjectSelect?: (project: ProjectData) => void;
  className?: string;
}

const ProjectMap: React.FC<ProjectMapProps> = ({ 
  projects, 
  selectedProject, 
  onProjectSelect,
  className = ""
}) => {
  // Filter projects that have coordinates
  const projectsWithCoordinates = useMemo(() => {
    return projects.filter(project => 
      project.coordinates && 
      project.coordinates.latitude && 
      project.coordinates.longitude
    );
  }, [projects]);

  // Calculate map center based on projects
  const mapCenter: LatLngExpression = useMemo(() => {
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
  }, [projectsWithCoordinates, selectedProject]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en cours': return '#3b82f6'; // blue
      case 'terminé': return '#10b981'; // green
      case 'en attente': return '#f59e0b'; // amber
      case 'en inspection': return '#eab308'; // yellow
      case 'suspendu': return '#8b5cf6'; // purple
      case 'annulé': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const createCustomIcon = (project: ProjectData) => {
    const color = getStatusColor(project.status);
    const isSelected = selectedProject?.id === project.id;
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: ${isSelected ? '20px' : '16px'};
          height: ${isSelected ? '20px' : '16px'};
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${isSelected ? '10px' : '8px'};
          color: white;
          font-weight: bold;
        ">
          ${project.progress}%
        </div>
      `,
      iconSize: [isSelected ? 24 : 20, isSelected ? 24 : 20],
      iconAnchor: [isSelected ? 12 : 10, isSelected ? 12 : 10],
    });
  };

  if (projectsWithCoordinates.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-600">Aucun projet avec coordonnées géographiques à afficher</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={7}
        style={{ height: '400px', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {projectsWithCoordinates.map((project) => (
          <Marker
            key={project.id}
            position={[project.coordinates!.latitude, project.coordinates!.longitude]}
            icon={createCustomIcon(project)}
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
      </MapContainer>
      
      {/* Legend */}
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
    </div>
  );
};

export default ProjectMap;
