import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { GoogleMap, useJsApiLoader, Marker as GoogleMarker } from '@react-google-maps/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertCircle, MapPin } from 'lucide-react';

// Fix for Leaflet marker icon issue
// This is needed because Leaflet's default marker icons use relative URLs
// which don't work properly when bundled by Vite/Webpack
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

// Define the location type
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

// Props for the ProjectMap component
interface ProjectMapProps {
  locations: MapLocation[];
  className?: string;
  filteredLocations?: MapLocation[];
  showFilters?: boolean;
}

// Define Google Maps container style
const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.75rem',
};

// Type for center to help TypeScript understand what we're passing to Leaflet
type LatLngTuple = [number, number];

const ProjectMap = ({ 
  locations, 
  className = '',
  filteredLocations,
  showFilters = false 
}: ProjectMapProps) => {
  const [mapProvider, setMapProvider] = useState<'openstreetmap' | 'google'>('openstreetmap');
  const [googleApiKey, setGoogleApiKey] = useState<string>('');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState<boolean>(false);
  const [dialogApiKey, setDialogApiKey] = useState<string>('');
  
  // Use filtered locations if provided, otherwise use all locations
  const displayLocations = filteredLocations || locations;
  
  // Calculate the center point based on the locations
  const center = displayLocations.length > 0
    ? [displayLocations[0].latitude, displayLocations[0].longitude] as LatLngTuple
    : [18.079052, -15.965634] as LatLngTuple; // Default: Nouakchott
  
  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleApiKey || '',
  });
  
  const handleSaveApiKey = () => {
    setGoogleApiKey(dialogApiKey);
    setShowApiKeyDialog(false);
  };

  // Get marker color based on location type or status
  const getMarkerColor = (location: MapLocation) => {
    if (location.type === 'material') return 'blue';
    if (location.type === 'supplier') return 'green';
    
    // For projects, color based on status
    switch(location.status) {
      case 'en cours': return 'orange';
      case 'terminé': return 'green';
      case 'en attente': return 'gray';
      case 'suspendu': return 'red';
      case 'annulé': return 'black';
      default: return 'red';
    }
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
            className="text-sm"
          >
            OpenStreetMap
          </Button>
          
          <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
            <DialogTrigger asChild>
              <Button
                variant={mapProvider === 'google' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (!googleApiKey) {
                    setShowApiKeyDialog(true);
                  } else {
                    setMapProvider('google');
                  }
                }}
                className="text-sm"
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
                    Vous pouvez obtenir une clé API sur le site <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google Cloud Console</a>.
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
        {mapProvider === 'openstreetmap' && (
          <MapContainer 
            className="w-full h-full"
            scrollWheelZoom={true}
            whenCreated={(mapInstance) => {
              mapInstance.setView(center, 13);
            }}
          >
            {displayLocations.map(location => (
              <Marker 
                key={location.id}
                position={[location.latitude, location.longitude] as LatLngTuple}
              >
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold">{location.name}</h3>
                    <p className="text-sm text-gray-600">Type: {location.type}</p>
                    {location.status && (
                      <p className="text-sm text-gray-600">Statut: {location.status}</p>
                    )}
                    {location.region && (
                      <p className="text-sm text-gray-600">Wilaya: {location.region}</p>
                    )}
                    {location.startDate && (
                      <p className="text-sm text-gray-600">
                        Période: {location.startDate} {location.endDate ? `- ${location.endDate}` : ''}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
            
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </MapContainer>
        )}
        
        {mapProvider === 'google' && isLoaded && googleApiKey && (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={{ lat: center[0], lng: center[1] }}
            zoom={13}
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
