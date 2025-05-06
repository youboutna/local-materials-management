
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Define map location type
export interface MapLocation {
  id: string;
  name: string;
  type: 'project' | 'material';
  latitude: number;
  longitude: number;
  status?: 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé';
  region?: string;
  startDate?: string;
  endDate?: string;
}

// Define map props
interface ProjectMapProps {
  locations: MapLocation[];
  selectable?: boolean;
  onLocationSelect?: (latitude: number, longitude: number) => void;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  filteredLocations?: MapLocation[];
  className?: string;
}

// SetViewOnMapReady component to set the view when map is ready
const SetViewOnMapReady = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// CurrentLocationButton component
const CurrentLocationButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="absolute z-[1000] top-4 right-4 bg-white p-2 rounded-md shadow-md flex items-center text-sm font-medium text-adrar-700 hover:bg-gray-50"
    title="Utiliser ma position actuelle"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
    Position
  </button>
);

// Get custom marker icon based on type and status
const getMarkerIcon = (type: 'project' | 'material', status?: string) => {
  let iconUrl = '/img/marker-default.png';
  
  // Choose icon based on type and status
  if (type === 'project') {
    switch (status) {
      case 'en cours':
        iconUrl = '/img/marker-project-in-progress.png';
        break;
      case 'terminé':
        iconUrl = '/img/marker-project-completed.png';
        break;
      case 'en attente':
        iconUrl = '/img/marker-project-pending.png';
        break;
      case 'suspendu':
        iconUrl = '/img/marker-project-suspended.png';
        break;
      case 'annulé':
        iconUrl = '/img/marker-project-cancelled.png';
        break;
      default:
        iconUrl = '/img/marker-project-default.png';
    }
  } else if (type === 'material') {
    iconUrl = '/img/marker-material.png';
  }
  
  // Return Leaflet Icon object
  return new Icon({
    iconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Define event handler type for map ready event
type MapReadyEventHandler = (event: { target: any }) => void;

const ProjectMap: React.FC<ProjectMapProps> = ({
  locations = [],
  filteredLocations,
  selectable = false,
  onLocationSelect,
  defaultCenter = [20.5279, -10.0309], // Default to Mauritania center
  defaultZoom = 6,
  className
}) => {
  const [center, setCenter] = useState<[number, number]>(defaultCenter);
  const [zoom, setZoom] = useState<number>(defaultZoom);
  const [selectMarker, setSelectMarker] = useState<[number, number] | null>(null);
  const mapRef = useRef<any>(null);
  
  // Use filteredLocations if provided, otherwise use all locations
  const displayLocations = filteredLocations || locations;

  // Handle map click for location selection
  const handleMapClick = useCallback((e: LeafletMouseEvent) => {
    if (selectable && onLocationSelect) {
      const { lat, lng } = e.latlng;
      setSelectMarker([lat, lng]);
      onLocationSelect(lat, lng);
    }
  }, [selectable, onLocationSelect]);

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCenter([latitude, longitude]);
          setZoom(13);
          
          if (selectable && onLocationSelect) {
            setSelectMarker([latitude, longitude]);
            onLocationSelect(latitude, longitude);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Impossible d\'obtenir votre position actuelle. Veuillez vérifier vos paramètres de localisation.');
        }
      );
    } else {
      alert('La géolocalisation n\'est pas supportée par votre navigateur.');
    }
  };

  // Set map view based on locations
  useEffect(() => {
    if (displayLocations.length > 0 && !selectMarker) {
      // If there's only one location, center on it
      if (displayLocations.length === 1) {
        setCenter([displayLocations[0].latitude, displayLocations[0].longitude]);
        setZoom(13);
      } 
      // If there are multiple locations, we could implement a bounding box here
    }
  }, [displayLocations, selectMarker]);

  // Store the map instance when ready
  const onMapReady: MapReadyEventHandler = useCallback((mapInstance) => {
    mapRef.current = mapInstance.target;
    if (mapRef.current) {
      mapRef.current.on('click', handleMapClick);
    }
  }, [handleMapClick]);

  return (
    <div className={`relative h-full w-full rounded-lg overflow-hidden border border-gray-300 ${className || ''}`}>
      <MapContainer 
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        whenReady={onMapReady as unknown as () => void}
      >
        <SetViewOnMapReady center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          {...{} as any} // Type cast to avoid TypeScript error
        />
        
        {/* Render project and material markers */}
        {displayLocations.map(location => (
          <Marker 
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={getMarkerIcon(location.type, location.status)}
            {...{} as any} // Type cast to avoid TypeScript error
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-medium">{location.name}</h3>
                <p className="text-sm text-gray-600">{location.type === 'project' ? 'Projet' : 'Matériau'}</p>
                {location.status && (
                  <span className={`inline-block px-2 py-1 text-xs rounded mt-1 ${
                    location.status === 'en cours' ? 'bg-blue-100 text-blue-800' :
                    location.status === 'terminé' ? 'bg-green-100 text-green-800' :
                    location.status === 'en attente' ? 'bg-yellow-100 text-yellow-800' :
                    location.status === 'suspendu' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {location.status}
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Render the selected location marker if in selectable mode */}
        {selectable && selectMarker && (
          <Marker 
            position={selectMarker}
            icon={getMarkerIcon('project')}
            {...{} as any} // Type cast to avoid TypeScript error
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-medium">Emplacement sélectionné</h3>
                <p className="text-xs text-gray-600">
                  {selectMarker[0].toFixed(6)}, {selectMarker[1].toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      
      {/* Current location button */}
      {selectable && (
        <CurrentLocationButton onClick={getCurrentLocation} />
      )}
    </div>
  );
};

export default ProjectMap;
