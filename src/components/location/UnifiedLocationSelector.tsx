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
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import location components and hooks
import LocationAutocomplete from './LocationAutocomplete';
import { useLocationAutoFill, AutoFillLocationData } from '@/hooks/hexagonal/useLocationAutoFill';
import { LocationDTO } from '@/dtos';
import { MapPin, Target, Globe, Navigation, Loader2, Crosshair, CheckCircle, X, Map } from 'lucide-react';

// Import Mauritania location data
import { MAURITANIA_REGIONS, MAURITANIA_CITIES } from '@/utils/mauritania';

// Fix default markers in Leaflet
const DefaultIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map clicks
const MapClickHandler = ({
  onMapClick,
  isActive
}: {
  onMapClick?: (coordinates: { lat: number; lng: number }) => void;
  isActive: boolean;
}) => {
  useMapEvents({
    click: (e) => {
      if (isActive && onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
};

interface UnifiedLocationSelectorProps {
  /** Current location value */
  value?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    regionCode?: string;
    cityCode?: string;
    locationData?: AutoFillLocationData;
  };

  /** Callback when location changes */
  onChange: (location: {
    address?: string;
    latitude?: number;
    longitude?: number;
    regionCode?: string;
    cityCode?: string;
    locationData?: AutoFillLocationData;
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

  /** Show map tab for clicking selection */
  showMap?: boolean;
}

const UnifiedLocationSelector: React.FC<UnifiedLocationSelectorProps> = ({
  value = {},
  onChange,
  className = '',
  showCoordinates = true,
  showGPS = true,
  allowManualEntry = true,
  placeholder = "Rechercher une région ou une ville...",
  filter = 'all',
  showMap = true,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'coordinates' | 'gps' | 'map'>('search');
  const [address, setAddress] = useState(value.address || '');
  const [latitude, setLatitude] = useState(value.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(value.longitude?.toString() || '');
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Use the location auto-fill hook for geocoding functionality
  const {
    geocodeAddress,
    reverseGeocode,
    isLoading: isGeocoding
  } = useLocationAutoFill();

  // Location data from Mauritania utils
  const allRegions = MAURITANIA_REGIONS;
  const allCities = MAURITANIA_CITIES;

  // Handle location selection from autocomplete
  const handleLocationSelect = useCallback((locationAddress: string, locationData?: LocationDTO) => {
    setAddress(locationAddress);

    // Transform LocationDTO to AutoFillLocationData if provided
    let transformedLocationData: AutoFillLocationData | undefined;
    if (locationData) {
      transformedLocationData = {
        address: locationData.name,
        coordinates: locationData.coordinates,
        confidence: 0.9, // High confidence for selected autocomplete results
        type: locationData.type as 'region' | 'city',
        metadata: {
          code: locationData.code,
          economicImportance: locationData.economicImportance,
          population: locationData.population
        }
      };

      // Add region/city data if available
      if (locationData.type === 'region') {
        // For regions, we might need to get the region data from our local data
        transformedLocationData.region = allRegions.find(r => r.code === locationData.code);
      } else if (locationData.type === 'city') {
        // For cities, we might need to get the city and region data
        transformedLocationData.city = allCities.find(c => c.code === locationData.code);
        if (transformedLocationData.city?.parentCode) {
          transformedLocationData.region = allRegions.find(r => r.code === transformedLocationData.city?.parentCode) || undefined;
        }
      }
    }

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
      locationData: transformedLocationData
    });
  }, [onChange, value, allRegions, allCities]);

  // Handle manual address changes with auto-fill
  const handleAddressChange = useCallback(async (newAddress: string) => {
    setAddress(newAddress);

    // Attempt geocoding if address looks like it could be geocoded
    if (newAddress.trim().length > 3) {
      try {
        const geocodedLocation = await geocodeAddress(newAddress);
        if (geocodedLocation?.coordinates && geocodedLocation.confidence > 0.7) {
          // Auto-fill with good geocoding result
          setLatitude(geocodedLocation.coordinates.lat.toString());
          setLongitude(geocodedLocation.coordinates.lng.toString());

          onChange({
            address: geocodedLocation.address,
            latitude: geocodedLocation.coordinates.lat,
            longitude: geocodedLocation.coordinates.lng,
            regionCode: geocodedLocation.region?.code || value.regionCode,
            cityCode: geocodedLocation.city?.code || value.cityCode,
            locationData: geocodedLocation || undefined,
          });

          // Switch to map tab to show the auto-filled location
          setActiveTab('map');
          return;
        } else if (geocodedLocation?.coordinates) {
          // Found coordinates but low confidence - allow manual verification
          setLatitude(geocodedLocation.coordinates.lat.toString());
          setLongitude(geocodedLocation.coordinates.lng.toString());
          setActiveTab('map');
        } else {
          // No geocoding results found - switch to map for manual selection
          setActiveTab('map');
        }
      } catch (error) {
        console.warn('Geocoding failed for manual address:', error);
        setActiveTab('map'); // Fall back to map selection
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

    // Validate coordinates first
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      toast.error('❌ Coordonnées invalides', {
        description: 'Veuillez saisir des coordonnées numériques valides.',
        duration: 3000,
      });
      return;
    }

    if (lat < -90 || lat > 90) {
      toast.error('❌ Latitude invalide', {
        description: 'La latitude doit être comprise entre -90° et +90°.',
        duration: 3000,
      });
      return;
    }

    if (lng < -180 || lng > 180) {
      toast.error('❌ Longitude invalide', {
        description: 'La longitude doit être comprise entre -180° et +180°.',
        duration: 3000,
      });
      return;
    }

    // Attempt reverse geocoding if coordinates are valid
    try {
      const locationData = await reverseGeocode(lat, lng);
      const finalAddress = locationData?.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(finalAddress);

      toast.success('✅ Coordonnées validées', {
        description: `Position: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        duration: 3000,
      });

      // Switch to map tab to show the coordinates
      setActiveTab('map');
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(fallbackAddress);

      toast.warning('⚠️ Coordonnées saisies, géocodage partiel', {
        description: 'Les coordonnées sont valides mais l\'adresse n\'a pas pu être déterminée.',
        duration: 4000,
      });

      setActiveTab('map');
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
      toast.error('❌ Géolocalisation non supportée', {
        description: 'Votre navigateur ne prend pas en charge la géolocalisation.',
        duration: 5000,
      });
      return;
    }

    // Check for permissions API support
    if ('permissions' in navigator) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        if (permissionStatus.state === 'denied') {
          toast.error('❌ Permission refusée', {
            description: 'L\'accès à la géolocalisation a été refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.',
            duration: 7000,
          });
          return;
        }
      } catch (error) {
        console.warn('Permission check failed:', error);
      }
    }

    setIsGettingLocation(true);
    toast.info('📍 Détection de la position GPS...', {
      description: 'Veuillez patienter pendant la recherche de votre position.',
      duration: 3000,
    });

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
            locationData: locationData || undefined
          });

          toast.success('✅ Position GPS capturée', {
            description: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            duration: 4000,
          });

          // Switch to map tab to show the location
          setActiveTab('map');
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

          toast.warning('⚠️ Position capturée, géocodage partiel', {
            description: 'Les coordonnées ont été obtenues mais l\'adresse n\'a pas pu être déterminée.',
            duration: 5000,
          });

          setActiveTab('map');
        }

        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        setIsGettingLocation(false);

        let errorMessage = 'Erreur inconnue de géolocalisation';
        let errorDescription = 'Veuillez réessayer ou saisir manuellement les coordonnées.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permission refusée';
            errorDescription = 'L\'accès à la géolocalisation a été refusé. Autorisez l\'accès dans les paramètres de votre navigateur.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position indisponible';
            errorDescription = 'Votre position n\'a pas pu être déterminée. Vérifiez votre connexion GPS.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Délai dépassé';
            errorDescription = 'La recherche de position a pris trop de temps. Réessayez.';
            break;
        }

        toast.error(`❌ ${errorMessage}`, {
          description: errorDescription,
          duration: 6000,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 300000 // Accept cached position up to 5 minutes old
      }
    );
  }, [reverseGeocode, value, onChange]);

  // Handle map click for manual selection
  const handleMapClick = useCallback(async (coordinates: { lat: number; lng: number }) => {
    setLatitude(coordinates.lat.toString());
    setLongitude(coordinates.lng.toString());

    // Attempt reverse geocoding
    try {
      const locationData = await reverseGeocode(coordinates.lat, coordinates.lng);
      const finalAddress = locationData?.address || `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
      setAddress(finalAddress);

      onChange({
        address: finalAddress,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        regionCode: locationData?.region?.code || value.regionCode,
        cityCode: locationData?.city?.code || value.cityCode,
        locationData: locationData || undefined
      });
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      const fallbackAddress = `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
      setAddress(fallbackAddress);

      onChange({
        address: fallbackAddress,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        regionCode: value.regionCode,
        cityCode: value.cityCode
      });
    }
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
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'search' | 'coordinates' | 'gps' | 'map')}>
          <TabsList className={showMap ? "grid w-full grid-cols-4" : "grid w-full grid-cols-3"}>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Crosshair className="h-4 w-4" />
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
            {showMap && (
              <TabsTrigger value="map" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Carte
              </TabsTrigger>
            )}
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <div className="space-y-4">
              <LocationAutocomplete
                value={address}
                onChange={handleLocationSelect}
                placeholder={placeholder}
                filter={filter}
              />

              {allowManualEntry && (
                <div className="space-y-2">
                  <Label htmlFor="manual-address">Adresse complète ou recherche globale</Label>
                  <Input
                    id="manual-address"
                    placeholder="Saisir une adresse, ville, ou lieu (recherche mondiale)"
                    value={address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    disabled={isGeocoding}
                    className="mt-1"
                  />
                  {isGeocoding && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Recherche en cours...
                    </div>
                  )}

                  {/* Show geocoding results if available */}
                  {address && !isGeocoding && (
                    <div className="text-xs text-muted-foreground">
                      💡 Tapez une adresse complète pour une recherche mondiale avec géocodage automatique
                    </div>
                  )}
                </div>
              )}

              {/* Search tips */}
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <div className="flex items-start gap-2">
                  <Crosshair className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 mb-1">Conseils de recherche</p>
                    <ul className="text-blue-700 space-y-1 text-xs">
                      <li>• Utilisez l'autocomplete pour les régions et villes de Mauritanie</li>
                      <li>• Tapez une adresse complète pour une recherche mondiale</li>
                      <li>• Les coordonnées seront automatiquement détectées</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
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
                    onBlur={() => {
                      // Auto-validate and update when user leaves the field
                      if (latitude && longitude) {
                        handleCoordinateChange();
                      }
                    }}
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
                    onBlur={() => {
                      // Auto-validate and update when user leaves the field
                      if (latitude && longitude) {
                        handleCoordinateChange();
                      }
                    }}
                    disabled={isGeocoding}
                  />
                </div>
              </div>

              {/* Validation feedback */}
              {latitude && longitude && (
                <div className="flex items-center gap-2 text-sm">
                  {areCoordinatesValid() ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Coordonnées valides</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <X className="h-4 w-4" />
                      <span>Coordonnées invalides</span>
                    </div>
                  )}
                </div>
              )}

              {/* Coordinate validation help */}
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 mb-1">Format des coordonnées</p>
                    <ul className="text-blue-700 space-y-1 text-xs">
                      <li>• Latitude: -90° à +90° (Nord positif, Sud négatif)</li>
                      <li>• Longitude: -180° à +180° (Est positif, Ouest négatif)</li>
                      <li>• Utilisez le point (.) comme séparateur décimal</li>
                      <li>• La validation se fait automatiquement</li>
                    </ul>
                  </div>
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

          {/* Map Tab */}
          {showMap && (
            <TabsContent value="map" className="space-y-4">
              {/* Map Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Type de carte:</Label>
                  <div className="flex bg-gray-100 rounded-md p-1">
                    <Button
                      variant={mapType === 'standard' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMapType('standard')}
                      className="text-xs px-3 py-1"
                    >
                      Standard
                    </Button>
                    <Button
                      variant={mapType === 'satellite' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMapType('satellite')}
                      className="text-xs px-3 py-1"
                    >
                      Satellite
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Crosshair className="h-3 w-3" />
                  <span>Cliquez pour sélectionner une position</span>
                </div>
              </div>

              <div className="relative z-0 w-full h-96 border border-border/50 rounded-xl overflow-hidden shadow-lg bg-background/50 backdrop-blur-sm">
                <MapContainer
                  center={areCoordinatesValid() ? [parseFloat(latitude), parseFloat(longitude)] : [20.0, -12.0]}
                  zoom={areCoordinatesValid() ? 12 : 6}
                  style={{ height: "100%", width: "100%" }}
                  className="z-0"
                  zoomControl={false} // Disable default zoom control, we'll add custom one
                  scrollWheelZoom={true}
                  doubleClickZoom={true}
                  touchZoom={true}
                  dragging={true}
                  zoomAnimation={true}
                  fadeAnimation={true}
                  markerZoomAnimation={true}
                >
                  <ZoomControl position="topright" />

                  {/* Tile Layer based on map type */}
                  <TileLayer
                    attribution={
                      mapType === 'satellite'
                        ? '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    }
                    url={
                      mapType === 'satellite'
                        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    }
                    maxZoom={mapType === 'satellite' ? 19 : 18}
                    minZoom={3}
                  />

                  <MapClickHandler
                    onMapClick={handleMapClick}
                    isActive={true}
                  />

                  {areCoordinatesValid() && (
                    <Marker position={[parseFloat(latitude), parseFloat(longitude)]}>
                      <Popup>
                        <div className="text-center">
                          <strong className="text-green-600">
                            Position sélectionnée
                          </strong>
                          <div className="text-xs text-gray-600 mt-1">
                            {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
                          </div>
                          {address && (
                            <div className="text-xs text-gray-500 mt-1">
                              {address}
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>

                {!areCoordinatesValid() && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1001] bg-black/10 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-background/95 to-muted/95 border border-border/50 px-6 py-4 rounded-xl shadow-lg text-center backdrop-blur-sm">
                      <Crosshair className="h-10 w-10 mx-auto text-primary mb-3" />
                      <p className="text-sm text-foreground font-medium mb-1">
                        Cliquez sur la carte pour sélectionner une position
                      </p>
                      <p className="text-xs text-muted-foreground">
                        La localisation sera automatiquement géocodée en adresse
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Map Instructions */}
              <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                <div className="flex items-start gap-2">
                  <Map className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 mb-1">Contrôles de la carte</p>
                    <ul className="text-amber-700 space-y-1 text-xs">
                      <li>• Utilisez les boutons +/- pour zoomer</li>
                      <li>• Cliquez et faites glisser pour vous déplacer</li>
                      <li>• Double-cliquez pour zoomer rapidement</li>
                      <li>• Utilisez la molette de la souris pour zoomer</li>
                    </ul>
                  </div>
                </div>
              </div>

              {areCoordinatesValid() && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Localisation sélectionnée</span>
                  </div>
                  <div className="text-sm text-green-700 bg-green-100/50 px-3 py-2 rounded-lg">
                    {address}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Coordonnées: {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
                  </div>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Location Summary */}
        {(address || (latitude && longitude)) && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Crosshair className="h-4 w-4" />
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

