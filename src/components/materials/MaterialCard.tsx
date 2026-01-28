import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price_per_unit: number;
  available_quantity: number;
  image?: string;
  origin_location?: string;
  local_type?: string;
  coordinates_latitude?: number;
  coordinates_longitude?: number;
}

interface MaterialCardProps {
  material: Material;
  onClick: () => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material, onClick }) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
      <CardContent className="p-4" onClick={onClick}>
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-md">

            
              {material?.image && material.image.length > 0 ? (
                <img
                  src={material.image}
                  alt={material.name}
                  className="w-full h-32 object-cover transition-transform duration-200 hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = window.location.origin + '/img/material-placeholder.jpg';
                  }}
                />
              ) : (
                <img
                  src={window.location.origin + '/img/material-placeholder.jpg'}
                  alt={material.name}
                  className="w-full h-32 object-cover transition-transform duration-200 hover:scale-105"
                />
              )}
          </div>

          <div>
            <h3 className="font-semibold text-lg text-foreground line-clamp-1">
              {material.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {material.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{material.category}</Badge>
            {material.local_type && (
              <Badge variant="outline">{material.local_type}</Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Prix:</span>
              <span className="font-semibold text-sm">
                {(material.price_per_unit || 0).toLocaleString()} MRU/{material.unit}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Stock:</span>
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-sm">
                  {material.available_quantity} {material.unit}
                </span>
              </div>
            </div>

            {material.origin_location && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Origine:</span>
                <span className="font-medium text-xs text-primary">
                  {material.origin_location}
                </span>
              </div>
            )}

            {material.coordinates_latitude && material.coordinates_longitude && (
              <div className="flex items-center gap-1 text-xs text-primary">
                <MapPin className="h-3 w-3" />
                <span>Géolocalisé</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaterialCard;