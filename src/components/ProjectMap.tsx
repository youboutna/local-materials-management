import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { GoogleMap, useJsApiLoader, Marker as GoogleMarker } from '@react-google-maps/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertCircle, Navigation } from 'lucide-react';

// Fix for Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

export interface MapLocation {
  id: string;
  name: string;
  type: 'project' | 'material' | 'supplier';
  latitude: number;
  longitude: number;
  status?: string;
  region?: string;
  startDate?: string;
  endDate?: string;
}

export const defaultMapLocation: MapLocation = {
  id: 'default-atar',
  name: 'Projet par défaut - Atar',
  type: 'project',
  latitude: 20.5169,
  longitude: -13.0499,
  status: 'en attente',
  region: 'Adrar',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
};

interface ProjectMapProps {
  locations: MapLocation[];
  className?: string;
  filteredLocations?: MapLocation[];
  showFilters?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectable?: boolean;
}

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.75rem',
};

type LatLngTuple = [number, number];

const SetMapView = ({ center, zoom }: { center: LatLngTuple, zoom: number }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const GeolocationControl = ({ onSuccess }: { onSuccess: (lat: number, lng: number) => void }) => {
  const map = useMap();
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.flyTo([latitude, longitude], 15);
          onSuccess(latitude, longitude);
        },
        (error) => console.error('Erreur de géolocalisation :', error),
        { enableHighAccuracy: true }
      );
    }
  };
  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '60px' }}>
      <div className="leaflet-control leaflet-bar">
        <Button 
          variant="outline" 
          size="icon" 
          className="bg-white hover:bg-gray-100"
          onClick={handleGetLocation}
          title="Ma position"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const ProjectMap = ({ 
  locations, 
  className = '',
  filteredLocations,
  showFilters = false,
  onLocationSelect,
  selectable = false
}: ProjectMapProps) => {
  const [mapProvider, setMapProvider] = useState<'openstreetmap' | 'google'>('openstreetmap');
  const [googleApiKey, setGoogleApiKey] = useState<string>('');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState<boolean>(false);
  const [dialogApiKey, setDialogApiKey] = useState<string>('');

  const rawLocations = filteredLocations || locations;
  const displayLocations = rawLocations.length > 0 ? rawLocations : [defaultMapLocation];

  const center: LatLngTuple = [displayLocations[0].latitude, displayLocations[0].longitude];

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleApiKey || '',
  });

  const handleSaveApiKey = () => {
    setGoogleApiKey(dialogApiKey);
    setShowApiKeyDialog(false);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (selectable && onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  };

  const getMarkerColor = (location: MapLocation) => {
    if (location.type === 'material') return 'blue';
    if (location.type === 'supplier') return 'green';
    switch (location.status) {
      case 'en cours': return 'orange';
      case 'terminé': return 'green';
      case 'en attente': return 'gray';
      case 'suspendu': return 'red';
      case 'annulé': return 'black';
      default: return 'red';
    }
  };

  const createCustomIcon = (color: string) => {
    return new L.Icon({
      iconUrl: `https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|${color}`,
      iconSize: [30, 42],
      iconAnchor: [15, 42],
      popupAnchor: [0, -36],
    });
  };

  return (
    <div className={`rounded-xl overflow-hidden shadow-elegant ${className}`}>
      <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-serif text-lg text-adrar-800">Localisation</h3>
        <div className="flex space-x-2">
          <Button
            variant={mapProvider === 'openstreetmap' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMapProvider('openstreetmap')}
          >
            OpenStreetMap
          </Button>

          <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
            <DialogTrigger asChild>
              <Button
                variant={mapProvider === 'google' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (!googleApiKey) setShowApiKeyDialog(true);
                  else setMapProvider('google');
                }}
              >
                Google Maps
              </Button>
            </DialogTrigger>

            <DialogHeader>
              <DialogTitle>Clé API Google Maps</DialogTitle>
            </DialogHeader>

            <DialogContent>
              <div className="py-4">
                <Label htmlFor="apiKey">Clé API</Label>
                <Input 
                  id="apiKey" 
                  value={dialogApiKey} 
                  onChange={(e) => setDialogApiKey(e.target.value)}
                  placeholder="Entrez votre clé API Google Maps"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-2 flex items-start">
                  <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                  <span>
                    Vous pouvez obtenir une clé API sur <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google Cloud Console</a>.
                  </span>
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveApiKey}>Enregistrer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="h-[400px] bg-gray-100">
        {displayLocations.length === 0 && (
          <div className="text-center py-4 text-gray-500">Aucun projet trouvé.</div>
        )}

        {mapProvider === 'openstreetmap' && (
          <MapContainer 
            className="w-full h-full"
            whenReady={(mapInstance) => {
              mapInstance.target.setView(center, 13);
            }}
          >
            <SetMapView center={center} zoom={13} />

            {displayLocations.map(location => (
              <Marker 
                key={location.id}
                position={[location.latitude, location.longitude] as LatLngTuple}
                icon={createCustomIcon(getMarkerColor(location))}
              >
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold">{location.name}</h3>
                    <p className="text-sm text-gray-600">Type: {location.type}</p>
                    {location.status && <p className="text-sm">Statut: {location.status}</p>}
                    {location.region && <p className="text-sm">Wilaya: {location.region}</p>}
                    {location.startDate && (
                      <p className="text-sm">
                        Période: {location.startDate} {location.endDate ? `- ${location.endDate}` : ''}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            <GeolocationControl onSuccess={(lat, lng) => handleMapClick(lat, lng)} />
          </MapContainer>
        )}

        {mapProvider === 'google' && isLoaded && googleApiKey && (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={{ lat: center[0], lng: center[1] }}
            zoom={13}
            onClick={selectable && onLocationSelect ? (e) => {
              if (e.latLng) handleMapClick(e.latLng.lat(), e.latLng.lng());
            } : undefined}
          >
            {displayLocations.map(location => (
              <GoogleMarker
                key={location.id}
                position={{ lat: location.latitude, lng: location.longitude }}
                title={location.name}
              />
            ))}
          </GoogleMap>
        )}

        {mapProvider === 'google' && (!isLoaded || !googleApiKey) && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="mb-4 text-adrar-600">
                {!googleApiKey ? 'Veuillez configurer votre clé API Google Maps' : 'Chargement de Google Maps...'}
              </p>
              {!googleApiKey && (
                <Button 
                  onClick={() => setShowApiKeyDialog(true)}
                  className="bg-terracotta-500 hover:bg-terracotta-600"
                >
                  Configurer la clé API
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectMap;
