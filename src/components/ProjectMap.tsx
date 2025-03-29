
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { GoogleMap, useJsApiLoader, Marker as GoogleMarker } from '@react-google-maps/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertCircle } from 'lucide-react';

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
interface MapLocation {
  id: string;
  name: string;
  type: 'project' | 'material' | 'supplier';
  latitude: number;
  longitude: number;
}

// Props for the ProjectMap component
interface ProjectMapProps {
  locations: MapLocation[];
  className?: string;
}

// Define Google Maps container style
const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.75rem',
};

const ProjectMap = ({ locations, className = '' }: ProjectMapProps) => {
  const [mapProvider, setMapProvider] = useState<'openstreetmap' | 'google'>('openstreetmap');
  const [googleApiKey, setGoogleApiKey] = useState<string>('');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState<boolean>(false);
  const [dialogApiKey, setDialogApiKey] = useState<string>('');
  
  // Calculate the center point based on the locations
  const center = locations.length > 0
    ? [locations[0].latitude, locations[0].longitude] as [number, number]
    : [18.079052, -15.965634] as [number, number]; // Default: Nouakchott
  
  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleApiKey || '',
  });
  
  const handleSaveApiKey = () => {
    setGoogleApiKey(dialogApiKey);
    setShowApiKeyDialog(false);
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
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clé API Google Maps</DialogTitle>
              </DialogHeader>
              
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
            style={{ width: '100%', height: '100%' }}
            center={center as any}
            zoom={13}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {locations.map(location => (
              <Marker 
                key={location.id}
                position={[location.latitude, location.longitude]}
              >
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold">{location.name}</h3>
                    <p className="text-sm text-gray-600">Type: {location.type}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
        
        {mapProvider === 'google' && isLoaded && googleApiKey && (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={{ lat: center[0], lng: center[1] }}
            zoom={13}
          >
            {locations.map(location => (
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
