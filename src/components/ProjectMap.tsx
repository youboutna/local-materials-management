
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ProjectData } from '@/types/project';
import { Badge } from '@/components/ui/badge';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface MapLocation {
  id: string;
  name: string;
  type: 'project' | 'warehouse' | 'material';
  latitude: number;
  longitude: number;
  status?: string;
  region?: string;
  startDate?: string;
  endDate?: string;
}

export type ProjectStatus = 'en cours' | 'terminé' | 'en attente' | 'en inspection' | 'suspendu' | 'annulé';

interface ProjectMapProps {
  projects?: ProjectData[];
  locations?: MapLocation[];
  defaultCenter?: [number, number];
  defaultZoom?: number;
  height?: string;
  width?: string;
  className?: string;
  focusRegion?: string;
  selectable?: boolean;
  onLocationSelect?: (latitude: number, longitude: number) => void;
  interactive?: boolean;
}

// Regional coordinates for Mauritania wilayas
const MAURITANIA_REGIONS = {
  'Nouakchott': [18.0735, -15.9582],
  'Nouadhibou': [20.9000, -17.0347],
  'Adrar': [20.5279, -10.0309],
  'Assaba': [16.3333, -11.0000],
  'Brakna': [16.5500, -12.8833],
  'Dakhlet Nouadhibou': [21.0000, -17.0000],
  'Gorgol': [16.2500, -11.7500],
  'Guidimaka': [15.7500, -12.2500],
  'Hodh Ech Chargui': [18.5000, -7.0000],
  'Hodh El Gharbi': [16.5000, -9.5000],
  'Inchiri': [19.5000, -16.0000],
  'Tagant': [18.5000, -9.5000],
  'Tiris Zemmour': [22.6667, -11.4000],
  'Trarza': [17.5000, -15.5000]
} as const;

// Map Focus Controller Component
const MapFocusController: React.FC<{ focusRegion?: string }> = ({ focusRegion }) => {
  const map = useMap();

  useEffect(() => {
    if (focusRegion && MAURITANIA_REGIONS[focusRegion as keyof typeof MAURITANIA_REGIONS]) {
      const coordinates = MAURITANIA_REGIONS[focusRegion as keyof typeof MAURITANIA_REGIONS];
      map.setView([coordinates[0], coordinates[1]], 8, { animate: true });
    }
  }, [focusRegion, map]);

  return null;
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'en cours': return '#3b82f6';
    case 'terminé': return '#10b981';
    case 'en attente': return '#f59e0b';
    case 'en inspection': return '#eab308';
    case 'suspendu': return '#8b5cf6';
    case 'annulé': return '#ef4444';
    default: return '#6b7280';
  }
};

const createCustomIcon = (status?: string) => {
  const color = getStatusColor(status);
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const ProjectMap: React.FC<ProjectMapProps> = ({
  projects,
  locations,
  defaultCenter = [20.5279, -10.0309],
  defaultZoom = 6,
  height = "400px",
  width,
  className = "",
  focusRegion,
  selectable = false,
  onLocationSelect,
  interactive = true
}) => {
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);

  useEffect(() => {
    if (locations) {
      setMapLocations(locations);
    } else if (projects) {
      const projectLocations: MapLocation[] = projects
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
      setMapLocations(projectLocations);
    }
  }, [projects, locations]);

  // Get unique statuses for legend
  const uniqueStatuses = Array.from(new Set(mapLocations.map(loc => loc.status).filter(Boolean)));

  const mapStyle = {
    height: '100%',
    width: '100%',
    ...(width && { width })
  };

  return (
    <div className={`relative ${className}`} style={{ height, ...(width && { width }) }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={mapStyle}
        className="rounded-lg"
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Focus controller for region selection */}
        <MapFocusController focusRegion={focusRegion} />
        
        {mapLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude] as L.LatLngExpression}
            icon={createCustomIcon(location.status)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm">{location.name}</h3>
                <p className="text-xs text-gray-600 mb-2">{location.region}</p>
                {location.status && (
                  <Badge 
                    style={{ backgroundColor: getStatusColor(location.status) }}
                    className="text-white text-xs mb-1"
                  >
                    {location.status.toUpperCase()}
                  </Badge>
                )}
                {location.startDate && (
                  <p className="text-xs">
                    Début: {new Date(location.startDate).toLocaleDateString('fr-FR')}
                  </p>
                )}
                {location.endDate && (
                  <p className="text-xs">
                    Fin: {new Date(location.endDate).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Enhanced Legend - positioned to avoid overlap */}
      {uniqueStatuses.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border max-w-xs z-[1000]">
          <h4 className="font-semibold text-sm mb-2">Statuts des projets</h4>
          <div className="grid grid-cols-1 gap-1 text-xs">
            {uniqueStatuses.map((status) => (
              <div key={status} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full border border-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: getStatusColor(status) }}
                />
                <span className="truncate">{status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMap;
