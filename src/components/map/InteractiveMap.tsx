
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

  useEffect(() => {
    if (value) {
      setMapData(value);
      setAddress(value.address || '');
    }
  }, [value]);

  // Initialize simple clickable map
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

  // Handle map click to set coordinates
  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert pixel coordinates to approximate lat/lng
    // This is a simplified conversion for demonstration
    const lat = 18.0735 + (rect.height / 2 - y) / rect.height * 10; // Mauritania center area
    const lng = -15.9582 + (x - rect.width / 2) / rect.width * 20;
    
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

        {/* Interactive Map */}
        <div className="space-y-2">
          <Label>Carte interactive</Label>
          <div 
            ref={mapRef}
            onClick={handleMapClick}
            className="relative w-full h-64 border border-gray-300 rounded-lg cursor-crosshair bg-gradient-to-br from-blue-100 to-green-100 overflow-hidden"
            title="Cliquez sur la carte pour sélectionner une position"
          >
            {/* Map background with grid */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-grid-pattern bg-repeat" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%23000000' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)' /%3E%3C/svg%3E")`
              }}></div>
            </div>

            {/* Selected position marker */}
            {mapData.center && (
              <div 
                className="absolute w-6 h-6 transform -translate-x-3 -translate-y-6 z-10"
                style={{
                  left: `${50 + ((mapData.center.lng + 15.9582) / 20) * 100}%`,
                  top: `${50 - ((mapData.center.lat - 18.0735) / 10) * 100}%`
                }}
              >
                <MapPin className="w-6 h-6 text-red-500 fill-red-500" />
              </div>
            )}

            {/* Instructions overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/90 px-4 py-2 rounded-lg shadow-sm text-center">
                <MapPin className="h-8 w-8 mx-auto text-gray-400 mb-1" />
                <p className="text-sm text-gray-600">
                  {mapData.center ? 'Position sélectionnée' : 'Cliquez pour sélectionner une position'}
                </p>
                {allowPolygon && (
                  <p className="text-xs text-gray-500 mt-1">
                    {allowPolygon ? "Tracez une zone en cliquant plusieurs points" : ""}
                  </p>
                )}
              </div>
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
