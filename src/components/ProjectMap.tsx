
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { GoogleMap, useJsApiLoader, Marker as GoogleMarker } from '@react-google-maps/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

type Location = {
  id: string;
  name: string;
  type: 'project' | 'material';
  latitude: number;
  longitude: number;
};

type MapProvider = 'openstreetmap' | 'google';

const GoogleMapComponent = ({ 
  locations, 
  apiKey 
}: { 
  locations: Location[];
  apiKey: string;
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || ''
  });

  const mapCenter = {
    lat: locations.length > 0 
      ? locations[0].latitude 
      : 18.0735, // Default to a location in Mauritania
    lng: locations.length > 0 
      ? locations[0].longitude 
      : -15.9582
  };
  
  if (!isLoaded || !apiKey) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-adrar-600">Chargement Google Maps...</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
      center={mapCenter}
      zoom={5}
    >
      {locations.map(location => (
        <GoogleMarker
          key={location.id}
          position={{ lat: location.latitude, lng: location.longitude }}
          title={location.name}
          icon={{
            url: location.type === 'project' 
              ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
              : 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
          }}
        />
      ))}
    </GoogleMap>
  );
};

const OpenStreetMapComponent = ({ locations }: { locations: Location[] }) => {
  const mapCenter: [number, number] = locations.length > 0 
    ? [locations[0].latitude, locations[0].longitude] 
    : [18.0735, -15.9582]; // Default to a location in Mauritania

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={5} 
      style={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map(location => (
        <Marker 
          key={location.id} 
          position={[location.latitude, location.longitude]}
        >
          <Popup>
            <div>
              <p className="font-bold">{location.name}</p>
              <p className="text-xs">{location.type === 'project' ? 'Projet' : 'Source de matériaux'}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

const ProjectMap = ({
  locations = [],
  className
}: {
  locations?: Array<{id: string, name: string, type: 'project' | 'material', latitude: number, longitude: number}>,
  className?: string
}) => {
  const [mapProvider, setMapProvider] = useState<MapProvider>('openstreetmap');
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>('');
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center text-adrar-800 font-serif">
          <MapPin className="mr-2 h-5 w-5 text-terracotta-500" />
          Carte des projets et matériaux
        </CardTitle>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <Layers className="h-4 w-4 mr-2" />
              Changer de carte
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setMapProvider('openstreetmap')}>
              OpenStreetMap
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMapProvider('google')}>
              Google Maps
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          {mapProvider === 'google' && (
            <div className="mb-4">
              <label htmlFor="google-maps-key" className="block text-sm font-medium text-adrar-700 mb-1">
                Clé API Google Maps (temporaire)
              </label>
              <input
                id="google-maps-key"
                type="text"
                value={googleMapsApiKey}
                onChange={(e) => setGoogleMapsApiKey(e.target.value)}
                placeholder="Entrez votre clé API Google Maps"
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              />
              <p className="mt-1 text-xs text-adrar-500">
                Obtenir une clé sur <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-terracotta-500 hover:underline">Google Cloud Console</a>
              </p>
            </div>
          )}

          <div className="h-80 rounded-lg overflow-hidden border border-gray-200">
            {mapProvider === 'openstreetmap' ? (
              <OpenStreetMapComponent locations={locations} />
            ) : (
              <GoogleMapComponent 
                locations={locations} 
                apiKey={googleMapsApiKey} 
              />
            )}
          </div>

          {/* Location list */}
          <div className="mt-4">
            <h3 className="font-medium text-adrar-700 mb-2">Emplacements ({locations.length})</h3>
            {locations.length > 0 ? (
              <ul className="space-y-2">
                {locations.map(location => (
                  <li key={location.id} className="flex items-start p-2 rounded-md bg-white border border-gray-100 shadow-sm">
                    <MapPin className={`mr-2 h-4 w-4 mt-0.5 ${location.type === 'project' ? 'text-terracotta-500' : 'text-green-500'}`} />
                    <div>
                      <p className="font-medium text-adrar-700">{location.name}</p>
                      <p className="text-xs text-adrar-500">
                        {location.type === 'project' ? 'Projet' : 'Source de matériaux'} - 
                        Lat: {location.latitude.toFixed(4)}, Long: {location.longitude.toFixed(4)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-adrar-500">Aucun emplacement à afficher</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectMap;
