/**
 * Unified Location Selector Component
 * Clean, reusable component for location selection with autocomplete and geocoding
 * Following PROMPTS.md Rule #4: Use centralized DTOs, no type redefinition
 * Following Rule #5: UI layer separation with business logic in hooks
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Globe, Map, Target, Loader2 } from 'lucide-react';

// Import location components and hooks
import LocationAutocomplete from './LocationAutocomplete';
import { useLocationAutoFill, AutoFillLocationData } from '@/hooks/hexagonal/useLocationAutoFill';

// Import DTOs following Rule #4
import { LocationDTO } from '@/dtos/shared';

interface UnifiedLocationSelectorProps {
  /** Current location value */
  value?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    regionCode?: string;
    cityCode?: string;
    locationData?: LocationDTO;
  };

  /** Callback when location changes */
  onChange: (location: {
    address?: string;
    latitude?: number;
    longitude?: number;
    regionCode?: string;
    cityCode?: string;
    locationData?: LocationDTO;
  }) => void;

  /** Component styling */
  className?: string;

  /** Show coordinate input tab */
  showCoordinates?: boolean;

  /** Show GPS capture tab */
  showGPS?: boolean;

  /** Allow manual address entry */
  allowManualEntry?: boolean;

  /** Placeholder text for autocomplete */
  placeholder?: string;

  /** Location filter */
  filter?: 'all' | 'regions' | 'cities';
}

const UnifiedLocationSelector: React.FC<UnifiedLocationSelectorProps> = ({
  value = {},
  onChange,
  className = '',
  showCoordinates = true,
  showGPS = true,
  allowManualEntry = true,
  placeholder = "Rechercher une région ou une ville...",
  filter = 'all'
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'coordinates' | 'gps'>('search');
  const [address, setAddress] = useState(value.address || '');
  const [latitude, setLatitude] = useState(value.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(value.longitude?.toString() || '');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Use the location auto-fill hook for geocoding functionality
  const {
    handleMapClick,
    geocodeAddress,
    reverseGeocode,
    isLoading: isGeocoding
  } = useLocationAutoFill();

  // Handle location selection from autocomplete
  const handleLocationSelect = useCallback((locationAddress: string, locationData?: LocationDTO) => {
    setAddress(locationAddress);

    if (locationData?.coordinates) {
      setLatitude(locationData.coordinates.lat.toString());
      setLongitude(locationData.coordinates.lng.toString());
    }

    onChange({
      address: locationAddress,
      latitude: locationData?.coordinates?.lat || value.latitude,
      longitude: locationData?.coordinates?.lng || value.longitude,
      regionCode: locationData?.type === 'region' ? locationData.code :
                 locationData?.type === 'city' ? locationData.parentCode : value.regionCode,
      cityCode: locationData?.type === 'city' ? locationData.code : value.cityCode,
      locationData
    });
  }, [onChange, value]);

  // Handle manual address changes
  const handleAddressChange = useCallback(async (newAddress: string) => {
    setAddress(newAddress);

    // Attempt geocoding if address looks like it could be geocoded
    if (newAddress.trim().length > 3) {
      try {
        const geocodedLocation = await geocodeAddress(newAddress);
        if (geocodedLocation?.coordinates) {
          setLatitude(geocodedLocation.coordinates.lat.toString());
          setLongitude(geocodedLocation.coordinates.lng.toString());
        }
      } catch (error) {
        console.warn('Geocoding failed for manual address:', error);
      }
    }

    onChange({
      address: newAddress,
      latitude: latitude ? parseFloat(latitude) : value.latitude,
      longitude: longitude ? parseFloat(longitude) : value.longitude,
      regionCode: value.regionCode,
      cityCode: value.cityCode
    });
  }, [geocodeAddress, latitude, longitude, value, onChange]);

  // Handle coordinate changes
  const handleCoordinateChange = useCallback(async () => {
    const lat = latitude ? parseFloat(latitude) : undefined;
    const lng = longitude ? parseFloat(longitude) : undefined;

    // Attempt reverse geocoding if coordinates are valid
    if (lat && lng) {
      try {
        const reverseGeocodedLocation = await reverseGeocode(lat, lng);
        if (reverseGeocodedLocation?.address) {
          setAddress(reverseGeocodedLocation.address);
        }
      } catch (error) {
        console.warn('Reverse geocoding failed:', error);
      }
    }

    onChange({
      address,
      latitude: lat,
      longitude: lng,
      regionCode: value.regionCode,
      cityCode: value.cityCode
    });
  }, [reverseGeocode, address, latitude, longitude, value.regionCode, value.cityCode, onChange]);

  // Get current GPS location
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(lat.toString());
        setLongitude(lng.toString());

        // Use reverse geocoding to get address
        try {
          const locationData = await reverseGeocode(lat, lng);
          const finalAddress = locationData?.address || `Position GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setAddress(finalAddress);

          onChange({
            address: finalAddress,
            latitude: lat,
            longitude: lng,
            regionCode: locationData?.region?.code || value.regionCode,
            cityCode: locationData?.city?.code || value.cityCode,
            locationData: locationData
          });
        } catch (error) {
          console.error('GPS reverse geocoding failed:', error);
          const fallbackAddress = `Position GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setAddress(fallbackAddress);

          onChange({
            address: fallbackAddress,
            latitude: lat,
            longitude: lng,
            regionCode: value.regionCode,
            cityCode: value.cityCode
          });
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
  }, [reverseGeocode, value, onChange]);

  // Validate coordinates
  const areCoordinatesValid = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Sélecteur de localisation
        </CardTitle>
        <CardDescription>
          Recherchez, saisissez des coordonnées ou utilisez le GPS pour définir une localisation
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'search' | 'coordinates' | 'gps')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
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
              placeholder={placeholder}
              filter={filter}
            />

            {allowManualEntry && (
              <div className="space-y-2">
                <Label htmlFor="manual-address">Adresse manuelle</Label>
                <Input
                  id="manual-address"
                  placeholder="Saisir une adresse manuellement"
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  disabled={isGeocoding}
                />
                {isGeocoding && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Géocodage en cours...
                  </div>
                )}
              </div>
            )}
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
                    onChange={(e) => setLatitude(e.target.value)}
                    onBlur={handleCoordinateChange}
                    disabled={isGeocoding}
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
                    onChange={(e) => setLongitude(e.target.value)}
                    onBlur={handleCoordinateChange}
                    disabled={isGeocoding}
                  />
                </div>
              </div>

              {areCoordinatesValid() && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Coordonnées validées</span>
                  </div>
                  <p className="text-sm font-mono text-blue-700">
                    {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <Map className="h-4 w-4 mr-2" />
                    Voir sur la carte
                  </Button>
                </div>
              )}

              {isGeocoding && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Géocodage des coordonnées...
                </div>
              )}
            </TabsContent>
          )}

          {/* GPS Tab */}
          {showGPS && (
            <TabsContent value="gps" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Navigation className="h-8 w-8 text-blue-600" />
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
                  {isGettingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                  {isGettingLocation ? 'Localisation...' : 'Utiliser ma position actuelle'}
                </Button>

                {areCoordinatesValid() && (
                  <div className="bg-green-50 p-3 rounded-md border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Navigation className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Position GPS capturée</span>
                    </div>
                    <p className="text-sm font-mono text-green-700">
                      {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      {address}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Location Summary */}
        {(address || (latitude && longitude)) && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Résumé de la localisation
            </h4>
            <div className="bg-gray-50 p-3 rounded-md space-y-2">
              {address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Adresse</p>
                    <p className="text-sm text-gray-600 break-words">{address}</p>
                  </div>
                </div>
              )}
              {areCoordinatesValid() && (
                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Coordonnées</p>
                    <p className="text-sm font-mono text-gray-600">
                      {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedLocationSelector;
