
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type ProjectStatus = 'en cours' | 'terminé' | 'en attente' | 'payé' | 'en inspection' | 'suspendu' | 'annulé';

export interface MapLocation {
  id: string;
  name: string;
  type: 'project' | 'material';
  latitude: number;
  longitude: number;
  status?: ProjectStatus;
  region?: string;
  startDate?: string;
  endDate?: string;
}

interface ProjectMapProps {
  locations: MapLocation[];
  defaultCenter?: [number, number];
  defaultZoom?: number;
  className?: string;
  interactive?: boolean;
  selectable?: boolean;
  onLocationSelect?: (latitude: number, longitude: number) => void;
}

const ProjectMap = ({ 
  locations, 
  defaultCenter = [0, 0], 
  defaultZoom = 2, 
  className = '', 
  interactive = false,
  selectable = false,
  onLocationSelect 
}: ProjectMapProps) => {
  const [activeLocation, setActiveLocation] = useState<MapLocation | null>(null);

  const customIcon = (status?: ProjectStatus, locationType: 'project' | 'material' = 'project') => {
    let color = 'gray';

    if (locationType === 'material') {
      color = '#e67e22'; // Distinctive color for materials
    } else if (status) {
      switch (status) {
        case 'en cours':
          color = 'blue';
          break;
        case 'terminé':
          color = 'green';
          break;
        case 'en attente':
          color = 'orange';
          break;
        case 'payé':
          color = 'purple';
          break;
        case 'en inspection':
          color = 'yellow';
          break;
        case 'suspendu':
          color = 'gray';
          break;
        case 'annulé':
          color = 'red';
          break;
        default:
          color = 'gray';
          break;
      }
    }

    return divIcon({
      className: 'custom-marker',
      html: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8" fill="${color}" />
          </svg>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10],
    });
  };

  const handleMapClick = (e: any) => {
    if (selectable && onLocationSelect) {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    }
  };

  return (
    <MapContainer 
      // Cast the center and other props properly for TypeScript
      center={defaultCenter as any}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%', cursor: interactive ? 'grab' : 'default' }}
      className={className}
      scrollWheelZoom={interactive}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        // Use any type assertion to satisfy TypeScript
        {...{} as any}
      />
      {locations.map(location => (
        <Marker
          key={location.id}
          position={[location.latitude, location.longitude] as LatLngTuple}
          // Use any type assertion for icon prop
          icon={customIcon(location.status, location.type) as any}
          eventHandlers={{
            click: () => {
              setActiveLocation(location);
            },
          }}
        >
          <Popup>
            <div>
              <h3>{location.name}</h3>
              <p>{location.type === 'material' ? 'Source de matériau' : 'Projet'}</p>
              <p>{location.region || ''}</p>
              {location.type === 'project' && location.startDate && (
                <p>Date de début: {location.startDate}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
      {selectable && (
        <div 
          onClick={handleMapClick}
          className="absolute inset-0 z-[400] cursor-crosshair"
        />
      )}
    </MapContainer>
  );
};

export default ProjectMap;
