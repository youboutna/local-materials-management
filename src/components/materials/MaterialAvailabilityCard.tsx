
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, CheckCircle } from 'lucide-react';

interface MaterialAvailabilityCardProps {
  material: {
    available_quantity: number;
    unit: string;
    price_per_unit: number;
  };
  className?: string;
}

const MaterialAvailabilityCard: React.FC<MaterialAvailabilityCardProps> = ({
  material,
  className = ""
}) => {
  const isAvailable = material.available_quantity > 0;
  const isLowStock = material.available_quantity > 0 && material.available_quantity < 10;
  
  const getStatusIcon = () => {
    if (!isAvailable) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (isLowStock) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getStatusBadge = () => {
    if (!isAvailable) {
      return <Badge className="bg-red-500 text-white">Rupture de stock</Badge>;
    }
    if (isLowStock) {
      return <Badge className="bg-yellow-500 text-white">Stock faible</Badge>;
    }
    return <Badge className="bg-green-500 text-white">Disponible</Badge>;
  };

  const getTotalValue = () => {
    return material.available_quantity * material.price_per_unit;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Disponibilité et stock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <div>
              <p className="text-2xl font-bold text-adrar-900">
                {material.available_quantity.toLocaleString('fr-FR')}
              </p>
              <p className="text-sm text-gray-600">{material.unit} en stock</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-gray-600">Prix unitaire</p>
            <p className="font-medium">
              {material.price_per_unit.toLocaleString('fr-FR')} MRU
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Valeur totale</p>
            <p className="font-medium text-terracotta-600">
              {getTotalValue().toLocaleString('fr-FR')} MRU
            </p>
          </div>
        </div>

        {isLowStock && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Stock faible - Pensez à réapprovisionner bientôt
              </p>
            </div>
          </div>
        )}

        {!isAvailable && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-800">
                Matériau en rupture de stock - Réapprovisionnement nécessaire
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialAvailabilityCard;
