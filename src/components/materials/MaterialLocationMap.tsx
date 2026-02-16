import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Map } from 'lucide-react';
import ProjectMap from '@/components/ProjectMap';
import { MapLocation } from '@/domain/entities/Location';
import LocationAutocomplete from '../location/LocationAutocomplete';

interface MaterialLocationMapProps {
  material: {
    id: string;
    name: string;
    coordinates_latitude?: number;
    coordinates_longitude?: number;
    adresse?: string;
    origin_location?: string;
  };
  height?: string;
  className?: string;
  onLocationUpdate?: (locationData: {
    address?: string;
    latitude?: number;
    longitude?: number;
    regionCode?: string;
    cityCode?: string;
  }) => void;
}

const MaterialLocationMap: React.FC<MaterialLocationMapProps> = ({
  material,
  height = "300px",
  className = "",
  onLocationUpdate
}) => {
  // Create map location from material data
  const mapLocations: MapLocation[] = [];
  
  if (material.coordinates_latitude && material.coordinates_longitude) {
    mapLocations.push({
      id: material.id,
      name: material.name,
      type: 'material',
      latitude: material.coordinates_latitude,
      longitude: material.coordinates_longitude,
      adresse: material.adresse,
      region: material.origin_location || 'Non spécifié'
    });
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Localisation du Matériau
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enhanced Location Input */}
        <div>
          <LocationAutocomplete
            value={material.adresse || material.origin_location || ''}
            onChange={(address, locationData) => {
              if (onLocationUpdate) {
                onLocationUpdate({
                  address,
                  latitude: locationData?.coordinates?.lat,
                  longitude: locationData?.coordinates?.lng,
                  regionCode: locationData?.type === 'region' ? locationData.code : locationData?.parentCode,
                  cityCode: locationData?.type === 'city' ? locationData.code : undefined
                });
              }
            }}
            placeholder="Rechercher une localisation pour ce matériau..."
            filter="all"
            className="w-full"
          />
        </div>

        {/* Map Display */}
        {mapLocations.length > 0 ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Map className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Position sur la carte</span>
            </div>
            <ProjectMap
              locations={mapLocations}
              height={height}
              defaultCenter={[material.coordinates_latitude!, material.coordinates_longitude!]}
              defaultZoom={12}
              interactive={true}
            />
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
            <div className="text-center">
              <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Aucune localisation GPS disponible</p>
              <p className="text-sm text-gray-500 mt-1">
                Utilisez la recherche ci-dessus pour définir une position
              </p>
            </div>
          </div>
        )}

        {/* Current Location Info */}
        {(material.adresse || material.origin_location) && (
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm font-medium text-blue-800 mb-1">Informations actuelles:</p>
            <div className="text-sm text-blue-700 space-y-1">
              {material.adresse && (
                <p><strong>Adresse:</strong> {material.adresse}</p>
              )}
              {material.origin_location && (
                <p><strong>Région:</strong> {material.origin_location}</p>
              )}
              {material.coordinates_latitude && material.coordinates_longitude && (
                <p><strong>Coordonnées:</strong> {material.coordinates_latitude.toFixed(6)}, {material.coordinates_longitude.toFixed(6)}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialLocationMap;
