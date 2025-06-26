
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import ProjectMap, { MapLocation } from '@/components/ProjectMap';

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
}

const MaterialLocationMap: React.FC<MaterialLocationMapProps> = ({
  material,
  height = "300px",
  className = ""
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
          Localisation sur la carte
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mapLocations.length > 0 ? (
          <ProjectMap
            locations={mapLocations}
            height={height}
            defaultCenter={[material.coordinates_latitude!, material.coordinates_longitude!]}
            defaultZoom={12}
            interactive={true}
          />
        ) : (
          <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
            <div className="text-center">
              <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Aucune localisation GPS disponible</p>
              <p className="text-sm text-gray-500 mt-1">
                Ajoutez des coordonnées pour voir la position sur la carte
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialLocationMap;
