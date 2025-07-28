import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Layers } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ProjectData } from '@/types/project';

// Fix default markers in Leaflet
const DefaultIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const ProjectIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [1, -34],
  shadowSize: [45, 45],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface EnhancedInteractiveMapProps {
  projects: ProjectData[];
  onProjectSelect?: (project: ProjectData) => void;
  className?: string;
}

// Component to handle map clicks
const MapClickHandler = ({ 
  onMapClick 
}: { 
  onMapClick: (latlng: L.LatLng) => void;
}) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
};

const EnhancedInteractiveMap: React.FC<EnhancedInteractiveMapProps> = ({
  projects,
  onProjectSelect,
  className = ""
}) => {
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lng: number} | null>(null);

  // Mauritania cities for reference
  const mauritaniaCities = [
    { name: "Nouakchott", lat: 18.0735, lng: -15.9582, isCapital: true },
    { name: "Nouadhibou", lat: 20.9, lng: -17.0347 },
    { name: "Rosso", lat: 16.5167, lng: -15.8 },
    { name: "Kaédi", lat: 16.15, lng: -13.5 },
    { name: "Zouérat", lat: 22.75, lng: -12.4667 },
    { name: "Kiffa", lat: 16.6167, lng: -11.4 },
    { name: "Atar", lat: 20.5167, lng: -13.05 },
    { name: "Aleg", lat: 17.05, lng: -13.9167 },
    { name: "Boutilimit", lat: 17.55, lng: -14.7 },
    { name: "Tidjikja", lat: 18.55, lng: -11.4333 },
    { name: "Aioun", lat: 16.661879 , lng: -9.615950 },
    { name: "Nema", lat: 16.612300 , lng: -7.260246 },
  ];

  // Filter projects that have GPS coordinates
  const projectsWithCoords = projects.filter(project => 
    project.coordinates?.latitude && project.coordinates?.longitude
  );

  const handleMapClick = useCallback((latlng: L.LatLng) => {
    setSelectedCoords({ lat: latlng.lat, lng: latlng.lng });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'en cours':
        return '#3b82f6'; // blue
      case 'terminé':
        return '#10b981'; // green
      case 'en attente':
        return '#f59e0b'; // yellow
      case 'suspendu':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const formatBudget = (budget: number) => {
    if (budget >= 1000000) {
      return `${(budget / 1000000).toFixed(1)}M MRU`;
    } else if (budget >= 1000) {
      return `${(budget / 1000).toFixed(0)}K MRU`;
    }
    return `${budget.toLocaleString()} MRU`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Create custom project icon based on status
  const createProjectIcon = (status: string) => {
    const color = getStatusColor(status);
    return L.divIcon({
      className: 'custom-project-marker',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: ${color};
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: white;
          "></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
  };

  return (
    <Card className={`${className} border-0 shadow-elegant bg-gradient-to-br from-card via-card/90 to-muted/20 backdrop-blur-sm`}>
      <CardHeader className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-b border-border/50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-lg">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Carte Interactive des Projets</h3>
              <p className="text-sm text-muted-foreground">
                Explorez tous les projets sur une carte interactive de la Mauritanie
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-gradient-to-r from-accent/20 to-accent/10 text-accent-foreground border-accent/20">
            <MapPin className="h-3 w-3 mr-1" />
            {projectsWithCoords.length} projets
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[600px] w-full relative">
          <MapContainer
            center={[20.0, -12.0]}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            className="rounded-b-lg"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />

            <MapClickHandler onMapClick={handleMapClick} />

            {/* Mauritania cities markers */}
            {mauritaniaCities.map((city, index) => (
              <Marker key={`city-${index}`} position={[city.lat, city.lng]}>
                <Popup>
                  <div className="text-center">
                    <strong className={city.isCapital ? "text-red-600" : "text-blue-600"}>
                      {city.name}
                    </strong>
                    {city.isCapital && <div className="text-xs text-red-500">Capitale</div>}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Project markers */}
            {projectsWithCoords.map((project) => (
              <Marker
                key={`project-${project.id}`}
                position={[project.coordinates!.latitude, project.coordinates!.longitude]}
                icon={createProjectIcon(project.status)}
              >
                <Popup className="project-popup">
                  <div className="p-2 min-w-[280px]">
                    <div className="space-y-3">
                      {/* Project Header */}
                      <div className="border-b pb-2">
                        <h4 className="font-semibold text-lg text-gray-800 mb-1">
                          {project.title}
                        </h4>
                        <div className="flex items-center justify-between">
                          <span 
                            className="inline-block px-2 py-1 text-xs rounded-full"
                            style={{ 
                              backgroundColor: `${getStatusColor(project.status)}20`,
                              color: getStatusColor(project.status),
                              border: `1px solid ${getStatusColor(project.status)}40`
                            }}
                          >
                            {project.status}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Navigation className="h-3 w-3" />
                            {project.coordinates!.latitude.toFixed(4)}, {project.coordinates!.longitude.toFixed(4)}
                          </div>
                        </div>
                      </div>

                      {/* Project Details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="text-gray-700">{project.location}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500">Budget:</span>
                            <div className="font-medium text-green-600">
                              {formatBudget(project.budget)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Équipe:</span>
                            <div className="font-medium">{project.teamSize} membres</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500">Progrès:</span>
                            <div className="font-medium">{project.progress}%</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Début:</span>
                            <div className="font-medium text-xs">{formatDate(project.startDate)}</div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${project.progress}%`,
                                backgroundColor: getStatusColor(project.status)
                              }}
                            />
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => onProjectSelect?.(project)}
                          className="w-full mt-3 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Voir les détails
                        </button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Selected coordinates marker */}
            {selectedCoords && (
              <Marker position={[selectedCoords.lat, selectedCoords.lng]}>
                <Popup>
                  <div className="text-center">
                    <strong className="text-green-600">Position sélectionnée</strong>
                    <div className="text-xs text-gray-500 mt-1">
                      {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedInteractiveMap;