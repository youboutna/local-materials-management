
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation } from 'lucide-react';

interface MapData {
  center?: { lat: number; lng: number };
  polygon?: { lat: number; lng: number }[];
  address?: string;
  shapeType?: "polygon" | "rectangle" | "circle";
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
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);

  // Mauritania major cities and regions coordinates
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

  // Regional boundaries (simplified)
  const mauritaniaRegions = [
    { name: 'Nouakchott', bounds: { north: 18.3, south: 17.8, east: -15.6, west: -16.2 } },
    { name: 'Nouadhibou', bounds: { north: 21.2, south: 20.6, east: -16.8, west: -17.2 } },
    { name: 'Adrar', bounds: { north: 21.5, south: 19.5, east: -11.0, west: -13.5 } },
    { name: 'Trarza', bounds: { north: 18.0, south: 16.0, east: -14.5, west: -16.5 } },
    { name: 'Brakna', bounds: { north: 17.5, south: 15.5, east: -12.0, west: -14.0 } }
  ];

  useEffect(() => {
    if (value) {
      setMapData(value);
      setAddress(value.address || '');
    }
  }, [value]);

  useEffect(() => {
    if (mapRef.current && !mapReady) {
      setMapReady(true);
    }
  }, [mapReady]);

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    const updatedData = { ...mapData, address: newAddress };
    setMapData(updatedData);
    if (onChange) {
      onChange(updatedData);
    }
  };

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert pixel coordinates to Mauritania lat/lng bounds
    // Mauritania bounds: roughly 15°N to 27°N, 17°W to 5°W
    const lat = 27 - (y / rect.height) * 12; // 27 to 15 degrees N
    const lng = -17 + (x / rect.width) * 12; // -17 to -5 degrees W
    
    const center = { lat: Math.round(lat * 1000000) / 1000000, lng: Math.round(lng * 1000000) / 1000000 };
    const updatedData = { ...mapData, center };
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

  // Convert lat/lng to pixel position for markers
  const getMarkerPosition = (lat: number, lng: number) => {
    if (!mapRef.current) return { x: 0, y: 0 };
    const rect = mapRef.current.getBoundingClientRect();
    
    // Convert lat/lng to pixel coordinates
    const x = ((lng + 17) / 12) * rect.width;
    const y = ((27 - lat) / 12) * rect.height;
    
    return { x, y };
  };

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
        {/* Address input */}
        <div className="space-y-2">
          <Label htmlFor="map-address">Adresse</Label>
          <Input
            id="map-address"
            placeholder="Saisissez l'adresse"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
          />
        </div>

        {/* GPS Coordinates display */}
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

        {/* Interactive Mauritania Map */}
        <div className="space-y-2">
          <Label>Carte de la Mauritanie</Label>
          <div 
            ref={mapRef}
            onClick={handleMapClick}
            className="relative w-full h-96 border-2 border-gray-300 rounded-lg cursor-crosshair bg-gradient-to-b from-yellow-50 to-orange-50 overflow-hidden"
            title="Cliquez sur la carte pour sélectionner une position"
          >
            {/* Mauritania outline background */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-orange-100 opacity-30"></div>
            
            {/* Atlantic Ocean (left side) */}
            <div className="absolute left-0 top-0 w-12 h-full bg-gradient-to-r from-blue-200 to-blue-100 opacity-60"></div>
            
            {/* Sahara Desert (northern region) */}
            <div className="absolute top-0 right-0 w-full h-24 bg-gradient-to-b from-yellow-200 to-yellow-100 opacity-40"></div>
            
            {/* Senegal River (southern border) */}
            <div className="absolute bottom-0 left-12 right-0 h-2 bg-blue-300 opacity-70"></div>

            {/* Regional boundaries */}
            {mauritaniaRegions.map((region, index) => {
              const width = Math.abs(region.bounds.east - region.bounds.west) / 12 * 100;
              const height = Math.abs(region.bounds.north - region.bounds.south) / 12 * 100;
              const left = (region.bounds.west + 17) / 12 * 100;
              const top = (27 - region.bounds.north) / 12 * 100;
              
              return (
                <div
                  key={index}
                  className="absolute border border-dashed border-gray-400 opacity-30"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${width}%`,
                    height: `${height}%`
                  }}
                >
                  <span className="absolute top-1 left-1 text-xs text-gray-600 font-medium">
                    {region.name}
                  </span>
                </div>
              );
            })}

            {/* Major cities */}
            {mauritaniaCities.map((city, index) => {
              const position = getMarkerPosition(city.lat, city.lng);
              return (
                <div
                  key={index}
                  className="absolute transform -translate-x-1 -translate-y-1 z-20"
                  style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`
                  }}
                >
                  <div className={`w-3 h-3 rounded-full ${city.isCapital ? 'bg-red-600' : 'bg-blue-600'} border-2 border-white shadow-md`}></div>
                  <span className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700 bg-white/80 px-1 rounded whitespace-nowrap">
                    {city.name}
                  </span>
                </div>
              );
            })}

            {/* Selected position marker */}
            {mapData.center && (
              <div 
                className="absolute w-8 h-8 transform -translate-x-4 -translate-y-8 z-30"
                style={{
                  left: `${getMarkerPosition(mapData.center.lat, mapData.center.lng).x}px`,
                  top: `${getMarkerPosition(mapData.center.lat, mapData.center.lng).y}px`
                }}
              >
                <MapPin className="w-8 h-8 text-green-600 fill-green-500 drop-shadow-lg" />
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Position sélectionnée
                </div>
              </div>
            )}

            {/* Instructions overlay */}
            {!mapData.center && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white/90 px-6 py-4 rounded-lg shadow-lg text-center">
                  <MapPin className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-700 font-medium">
                    Cliquez sur la carte pour sélectionner une position
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Villes principales et régions affichées
                  </p>
                </div>
              </div>
            )}

            {/* Scale indicator */}
            <div className="absolute bottom-4 right-4 bg-white/90 px-2 py-1 rounded text-xs text-gray-600">
              Échelle: ~1:4,000,000
            </div>
          </div>
        </div>

        {/* Current location button */}
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
