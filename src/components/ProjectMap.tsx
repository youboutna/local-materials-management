import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type ProjectStatus = 'en cours' | 'terminé' | 'en attente' | 'payé' | 'en inspection' | 'suspendu' | 'annulé';

export interface MapLocation {
  id: string;
  name: string;
  type: 'project';
  latitude: number;
  longitude: number;
  status: ProjectStatus;
  region: string;
  startDate: string;
  endDate?: string;
}

interface ProjectMapProps {
  locations: MapLocation[];
  defaultCenter?: [number, number];
  defaultZoom?: number;
  className?: string;
  interactive?: boolean;
}

const ProjectMap = ({ locations, defaultCenter = [0, 0], defaultZoom = 2, className = '', interactive = false }: ProjectMapProps) => {
  const [activeLocation, setActiveLocation] = useState<MapLocation | null>(null);

  const customIcon = (status: ProjectStatus) => {
    let color = 'gray';

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

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%', cursor: interactive ? 'grab' : 'default' }}
      className={className}
      dragging={interactive}
      doubleClickZoom={interactive}
      scrollWheelZoom={interactive}
      touchZoom={interactive}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {locations.map(location => (
        <Marker
          key={location.id}
          position={[location.latitude, location.longitude]}
          icon={customIcon(location.status)}
          eventHandlers={{
            click: () => {
              setActiveLocation(location);
            },
          }}
        >
          <Popup>
            <div>
              <h3>{location.name}</h3>
              <p>{location.region}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default ProjectMap;
