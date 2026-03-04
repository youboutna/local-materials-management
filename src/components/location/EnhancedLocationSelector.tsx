/**
 * Enhanced Location Selector Component
 * Combines autocomplete, GPS capture, and coordinate input
 * Following PROMPTS.md Rule #4: Use centralized DTOs, no type redefinition
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Search, Globe, Map } from 'lucide-react';
import LocationAutocomplete from './LocationAutocomplete';

// Import DTOs following Rule #4
import { LocationDTO } from '@/dtos/shared';
import { GeographicUnit, Region, City } from '@/utils/mauritania';
import { getWilayaByCode, getCityByCode } from '@/utils/mauritaniaUtils';

interface EnhancedLocationSelectorProps {
  value?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    regionCode?: string;
    cityCode?: string;
  };
  onChange: (location: {
    address?: string;
    latitude?: number;
    longitude?: number;
    regionCode?: string;
    cityCode?: string;
    locationData?: LocationDTO;
  }) => void;
  className?: string;
  showCoordinates?: boolean;
  showGPS?: boolean;
  allowManualEntry?: boolean;
}

const EnhancedLocationSelector: React.FC<EnhancedLocationSelectorProps> = ({
  value = {},
  onChange,
  className = '',
  showCoordinates = true,
  showGPS = true,
  allowManualEntry = true
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'coordinates' | 'gps'>('search');
  const [address, setAddress] = useState(value.address || '');
  const [latitude, setLatitude] = useState(value.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(value.longitude?.toString() || '');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedLocationData, setSelectedLocationData] = useState<LocationDTO | null>(null);

  // Handle location selection from autocomplete
  const handleLocationSelect = useCallback((locationAddress: string, locationData?: LocationDTO) => {
    setAddress(locationAddress);
    setSelectedLocationData(locationData || null);
    
    // Update coordinates if available from location data
    if (locationData?.coordinates) {
      setLatitude(locationData.coordinates.lat.toString());
      setLongitude(locationData.coordinates.lng.toString());
      
      onChange({
        address: locationAddress,
        latitude: locationData.coordinates.lat,
        longitude: locationData.coordinates.lng,
        regionCode: locationData.type === 'region' ? locationData.code : locationData.parentCode,
        cityCode: locationData.type === 'city' ? locationData.code : undefined,
        locationData
      });
    } else {
      onChange({
        address: locationAddress,
        latitude: value.latitude,
        longitude: value.longitude,
        regionCode: value.regionCode,
        cityCode: value.cityCode
      });
    }
  }, [onChange, value]);

  // Handle manual address change
  const handleAddressChange = useCallback((newAddress: string) => {
    setAddress(newAddress);
    onChange({
      address: newAddress,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      regionCode: value.regionCode,
      cityCode: value.cityCode
    });
  }, [onChange, latitude, longitude, value.regionCode, value.cityCode]);

  // Handle coordinate changes
  const handleCoordinateChange = useCallback(() => {
    const lat = latitude ? parseFloat(latitude) : undefined;
    const lng = longitude ? parseFloat(longitude) : undefined;
    
    onChange({
      address: address,
      latitude: lat,
      longitude: lng,
      regionCode: value.regionCode,
      cityCode: value.cityCode
    });
  }, [address, latitude, longitude, value.regionCode, value.cityCode, onChange]);

  // Get current GPS location
  const getCurrentLocation = useCallback(() => {
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
        
        // Try to reverse geocode to get address
        const address = `Position GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setAddress(address);
        
        onChange({
          address,
          latitude: lat,
          longitude: lng,
          regionCode: value.regionCode,
          cityCode: value.cityCode
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
  }, [onChange, value.regionCode, value.cityCode]);

  // Get location info from codes
  const getLocationInfo = useCallback(() => {
    if (!value.regionCode && !value.cityCode) return null;

    let location: GeographicUnit | null = null;
    
    if (value.cityCode) {
      location = getCityByCode(value.cityCode) || null;
    } else if (value.regionCode) {
      location = getWilayaByCode(value.regionCode) || null;
    }

    if (!location) return null;

    return (
      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-800">
            {location.name}
          </span>
          {'nameAr' in location && (
            <Badge variant="secondary" className="text-xs">
              {location.nameAr}
            </Badge>
          )}
        </div>
        {'economicImportance' in location && location.economicImportance && (
          <div className="text-sm text-blue-600">
            Importance: {location.economicImportance}
          </div>
        )}
        {'population' in location && location.population && (
          <div className="text-sm text-blue-600">
            Population: {location.population.toLocaleString()}
          </div>
        )}
      </div>
    );
  }, [value.regionCode, value.cityCode]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Sélection de localisation avancée
        </CardTitle>
        <CardDescription>
          Recherchez une localisation, utilisez le GPS ou entrez des coordonnées manuelles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'search' | 'coordinates' | 'gps')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Recherche
            </TabsTrigger>
            {showCoordinates && (
              <TabsTrigger value="coordinates" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Coordonnées
              </TabsTrigger>
            )}
            {showGPS && (
              <TabsTrigger value="gps" className="flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                GPS
              </TabsTrigger>
            )}
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <LocationAutocomplete
              value={address}
              onChange={handleLocationSelect}
              placeholder="Rechercher une région, ville ou localité..."
              filter="all"
            />
            
            {allowManualEntry && (
              <div className="space-y-2">
                <Label htmlFor="manual-address">Adresse manuelle</Label>
                <Input
                  id="manual-address"
                  placeholder="Entrez une adresse manuellement"
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                />
              </div>
            )}

            {getLocationInfo()}
          </TabsContent>

          {/* Coordinates Tab */}
          {showCoordinates && (
            <TabsContent value="coordinates" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    placeholder="Ex: 18.079052"
                    value={latitude}
                    onChange={(e) => {
                      setLatitude(e.target.value);
                      handleCoordinateChange();
                    }}
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
                    onChange={(e) => {
                      setLongitude(e.target.value);
                      handleCoordinateChange();
                    }}
                  />
                </div>
              </div>

              {latitude && longitude && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Coordonnées sélectionnées:</strong>
                  </p>
                  <p className="text-sm font-mono">
                    {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      // Open in maps
                      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <Map className="h-4 w-4 mr-2" />
                    Voir sur la carte
                  </Button>
                </div>
              )}
            </TabsContent>
          )}

          {/* GPS Tab */}
          {showGPS && (
            <TabsContent value="gps" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Navigation className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Géolocalisation GPS</h3>
                  <p className="text-sm text-gray-600">
                    Utilisez la position actuelle de votre appareil
                  </p>
                </div>
                <Button
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Navigation className={`h-4 w-4 ${isGettingLocation ? 'animate-spin' : ''}`} />
                  {isGettingLocation ? 'Localisation...' : 'Utiliser ma position actuelle'}
                </Button>
                
                {latitude && longitude && (
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-sm text-green-800">
                      <strong>Position GPS capturée</strong>
                    </p>
                    <p className="text-sm font-mono text-green-700">
                      {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Current Location Summary */}
        {(address || (latitude && longitude)) && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Résumé de la localisation</h4>
            <div className="bg-gray-50 p-3 rounded-md">
              {address && (
                <p className="text-sm">
                  <strong>Adresse:</strong> {address}
                </p>
              )}
              {latitude && longitude && (
                <p className="text-sm">
                  <strong>Coordonnées:</strong> {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
                </p>
              )}
              {selectedLocationData && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    <strong>Type:</strong> {selectedLocationData.type === 'region' ? 'Région' : 'Ville'}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>Code:</strong> {selectedLocationData.code}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedLocationSelector;
