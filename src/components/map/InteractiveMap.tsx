
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, ZoomIn, ZoomOut, Plus, Square, Circle, Diamond, Pentagon, Trash2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default markers in Leaflet - more robust approach
const DefaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

type Coordinate = { lat: number; lng: number };

interface MapData {
  center?: Coordinate;
  polygon?: Coordinate[];
  warehouseShape?: Coordinate[];
  address?: string;
  shapeType?: "polygon" | "rectangle" | "circle" | "diamond";
}

interface InteractiveMapProps {
  title?: string;
  description?: string;
  value?: MapData;
  onChange?: (data: MapData) => void;
  allowPolygon?: boolean;
  className?: string;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  title = "Carte interactive",
  description = "Sélectionnez une localisation sur la carte",
  value = {},
  onChange,
  allowPolygon = false,
  className = ""
}) => {
  const [mapData, setMapData] = useState<MapData>(value);
  const [address, setAddress] = useState(value?.address || '');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const mauritaniaCities = [
    { name: 'Nouakchott', lat: 18.0735, lng: -15.9582, isCapital: true },
    { name: 'Nouadhibou', lat: 20.9000, lng: -17.0347 },
    { name: 'Rosso', lat: 16.5167, lng: -15.8000 },
    { name: 'Kaédi', lat: 16.1500, lng: -13.5000 },
    { name: 'Zouérat', lat: 22.7500, lng: -12.4667 },
    { name: 'Kiffa', lat: 16.6167, lng: -11.4000 },
    { name: 'Atar', lat: 20.5167, lng: -13.0500 },
    { name: 'Aleg', lat: 17.0500, lng: -13.9167 },
    { name: 'Boutilimit', lat: 17.5500, lng: -14.7000 },
    { name: 'Tidjikja', lat: 18.5500, lng: -11.4333 }
  ];

  useEffect(() => {
    if (value) {
      setMapData(value);
      setAddress(value.address || '');
    }
  }, [value]);

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    const updatedData = { ...mapData, address: newAddress };
    setMapData(updatedData);
    if (onChange) {
      onChange(updatedData);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        const updatedData = { ...mapData, center };
        setMapData(updatedData);
        
        if (onChange) {
          onChange(updatedData);
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        alert('Impossible d\'obtenir votre position. Veuillez vérifier les permissions de géolocalisation.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const mapCenter: [number, number] = mapData.center ? [mapData.center.lat, mapData.center.lng] : [20.0, -12.0];
  const mapZoom = mapData.center ? 10 : 6;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="map-address">Adresse</Label>
          <Input
            id="map-address"
            placeholder="Saisissez l'adresse"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
          />
        </div>

        {mapData.center && (
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>Coordonnées GPS:</strong>
            </p>
            <p className="text-sm font-mono">
              {mapData.center.lat.toFixed(6)}, {mapData.center.lng.toFixed(6)}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label>Carte de la Mauritanie (OpenStreetMap)</Label>
          <div className="relative w-full h-96 border-2 border-gray-300 rounded-lg overflow-hidden">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {mauritaniaCities.map((city, index) => (
                <Marker key={index} position={[city.lat, city.lng]}>
                  <Popup>
                    <div className="text-center">
                      <strong className={city.isCapital ? 'text-red-600' : 'text-blue-600'}>
                        {city.name}
                      </strong>
                      {city.isCapital && <div className="text-xs text-red-500">Capitale</div>}
                    </div>
                  </Popup>
                </Marker>
              ))}

              {mapData.center && (
                <Marker position={[mapData.center.lat, mapData.center.lng]}>
                  <Popup>
                    <div className="text-center">
                      <strong className="text-green-600">Position sélectionnée</strong>
                      <div className="text-xs text-gray-600">
                        {mapData.center.lat.toFixed(6)}, {mapData.center.lng.toFixed(6)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {mapData.warehouseShape && mapData.warehouseShape.length > 0 && (
                <Polygon
                  positions={mapData.warehouseShape.map(point => [point.lat, point.lng])}
                  pathOptions={{ 
                    color: '#3b82f6', 
                    fillColor: '#3b82f6', 
                    fillOpacity: 0.2,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="text-center">
                      <strong className="text-blue-600">Forme de l'entrepôt</strong>
                      <div className="text-xs text-gray-600">
                        Type: {mapData.shapeType || 'polygon'}
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              )}
            </MapContainer>

            {!mapData.center && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1001] bg-black/20">
                <div className="bg-white/95 px-6 py-4 rounded-lg shadow-lg text-center">
                  <MapPin className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-700 font-medium">
                    Cliquez sur la carte pour sélectionner une position
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Utilisez les contrôles de zoom pour naviguer
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="flex items-center gap-2"
          >
            <Navigation className={`h-4 w-4 ${isGettingLocation ? 'animate-spin' : ''}`} />
            {isGettingLocation ? 'Localisation...' : 'Utiliser ma position actuelle'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveMap;
