
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, CheckCircle } from 'lucide-react';

import { TranslatedUnit } from '@/components/i18n/TranslatedBadges';
import { T } from '@/components/i18n/T';
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
      return <Badge className="bg-destructive text-destructive-foreground"><T k="auto.materialavailabilitycard.rupture_de_stock" fallback="Rupture de stock" /></Badge>;
    }
    if (isLowStock) {
      return <Badge className="bg-warning text-warning-foreground"><T k="auto.materialavailabilitycard.stock_faible" fallback="Stock faible" /></Badge>;
    }
    return <Badge className="bg-success text-success-foreground"><T k="auto.materialavailabilitycard.disponible" fallback="Disponible" /></Badge>;
  };

  const getTotalValue = () => {
    return material.available_quantity * (material.price_per_unit || 0);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <T k="auto.materialavailabilitycard.disponibilite_et_stock" fallback="Disponibilité et stock" />
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
              <p className="text-sm text-muted-foreground"><TranslatedUnit code={material.unit} /> en stock</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground"><T k="auto.materialavailabilitycard.prix_unitaire" fallback="Prix unitaire" /></p>
            <p className="font-medium">
              {(material.price_per_unit || 0).toLocaleString('fr-FR')} MRU
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground"><T k="auto.materialavailabilitycard.valeur_totale" fallback="Valeur totale" /></p>
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
                <T k="auto.materialavailabilitycard.stock_faible_pensez_a_reapprovisionner_bientot" fallback="Stock faible - Pensez à réapprovisionner bientôt" />
              </p>
            </div>
          </div>
        )}

        {!isAvailable && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">
                <T k="auto.materialavailabilitycard.materiau_en_rupture_de_stock_reapprovisionnement" fallback="Matériau en rupture de stock - Réapprovisionnement nécessaire" />
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialAvailabilityCard;
