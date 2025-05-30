
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Search } from 'lucide-react';

interface LocationSelectorProps {
  value?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  onChange: (location: {
    latitude?: number;
    longitude?: number;
    address?: string;
  }) => void;
  className?: string;
}

const LocationSelector = ({ value, onChange, className }: LocationSelectorProps) => {
  const [address, setAddress] = useState(value?.address || '');
  const [latitude, setLatitude] = useState(value?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(value?.longitude?.toString() || '');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    onChange({
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      address: newAddress
    });
  };

  const handleLatitudeChange = (newLatitude: string) => {
    setLatitude(newLatitude);
    onChange({
      latitude: newLatitude ? parseFloat(newLatitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      address: address
    });
  };

  const handleLongitudeChange = (newLongitude: string) => {
    setLongitude(newLongitude);
    onChange({
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: newLongitude ? parseFloat(newLongitude) : undefined,
      address: address
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setLatitude(lat.toString());
        setLongitude(lng.toString());
        
        onChange({
          latitude: lat,
          longitude: lng,
          address: address
        });
        
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
          Sélection de localisation
        </CardTitle>
        <CardDescription>
          Définissez la localisation du projet en saisissant une adresse ou des coordonnées GPS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address input */}
        <div className="space-y-2">
          <Label htmlFor="address">Adresse</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="address"
                placeholder="Saisissez l'adresse du projet"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* GPS Coordinates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="0.000001"
              placeholder="Ex: 18.079052"
              value={latitude}
              onChange={(e) => handleLatitudeChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="0.000001"
              placeholder="Ex: -15.965634"
              value={longitude}
              onChange={(e) => handleLongitudeChange(e.target.value)}
            />
          </div>
        </div>

        {/* Current location button */}
        <div className="flex justify-start">
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

        {/* Display current coordinates if available */}
        {latitude && longitude && (
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>Coordonnées sélectionnées:</strong>
            </p>
            <p className="text-sm font-mono">
              {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationSelector;
