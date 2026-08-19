
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, CheckCircle } from 'lucide-react';

interface MaterialAvailabilityCardProps {
  material: {
    available_quantity: number;
    unit: string;
    price_per_unit?: number;
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
    if (!isAvailable) return <AlertTriangle className="h-5 w-5 text-destructive" />;
    if (isLowStock) return <AlertTriangle className="h-5 w-5 text-warning" />;
    return <CheckCircle className="h-5 w-5 text-success" />;
  };

  const getStatusBadge = () => {
    if (!isAvailable) {
      return <Badge className="bg-destructive text-destructive-foreground">Rupture de stock</Badge>;
    }
    if (isLowStock) {
      return <Badge className="bg-warning text-warning-foreground">Stock faible</Badge>;
    }
    return <Badge className="bg-success text-success-foreground">Disponible</Badge>;
  };

  const getTotalValue = () => {
    return material.available_quantity * (material.price_per_unit || 0);
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
              <p className="text-2xl font-bold text-primary">
                {material.available_quantity.toLocaleString('fr-FR')}
              </p>
              <p className="text-sm text-muted-foreground">{material.unit} en stock</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Prix unitaire</p>
            <p className="font-medium">
              {(material.price_per_unit || 0).toLocaleString('fr-FR')} MRU
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valeur totale</p>
            <p className="font-medium text-accent-foreground">
              {getTotalValue().toLocaleString('fr-FR')} MRU
            </p>
          </div>
        </div>

        {isLowStock && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <p className="text-sm text-warning">
                Stock faible - Pensez à réapprovisionner bientôt
              </p>
            </div>
          </div>
        )}

        {!isAvailable && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">
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
