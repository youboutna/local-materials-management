import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { MapPin, Package, DollarSign, Truck, Eye } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { MaterialUIDTO } from '@/dtos/transforms';

interface InteractiveMaterialsListProps {
  materials: MaterialUIDTO[];
  onMaterialSelect?: (material: MaterialUIDTO) => void;
}

const InteractiveMaterialsList: React.FC<InteractiveMaterialsListProps> = ({
  materials,
  onMaterialSelect
}) => {
  const {
    currentData: paginatedMaterials,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    goToPage
  } = usePagination({
    data: materials,
    itemsPerPage: 10 // Show pagination only if more than 10 items
  });

  const getStockLevel = (available: number, unit: string) => {
    if (available === 0) return 'out';
    if (available < 10) return 'low';
    if (available < 50) return 'medium';
    return 'high';
  };

  const getStockColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-success';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-orange-500';
      case 'out': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getStockLabel = (level: string) => {
    switch (level) {
      case 'high': return 'Stock Élevé';
      case 'medium': return 'Stock Moyen';
      case 'low': return 'Stock Faible';
      case 'out': return 'Rupture';
      default: return 'Indéterminé';
    }
  };

  const formatPrice = (price: number | undefined | null): string => {
    if (!price && price !== 0) return "0 MRU";
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M MRU`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}K MRU`;
    }
    return `${price.toLocaleString()} MRU`;
  };


  if (materials.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Aucun matériau trouvé
          </h3>
          <p className="text-muted-foreground">
            Aucun matériau avec coordonnées GPS ne correspond à vos critères.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5 text-primary" />
          Matériaux avec Coordonnées GPS
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {materials.length} matériaux géolocalisés trouvés
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {paginatedMaterials.map((material) => {
            const stockLevel = getStockLevel(material.availableQuantity, material.unit);
            const stockColor = getStockColor(stockLevel);
            const stockLabel = getStockLabel(stockLevel);

            return (
              <Card 
                key={material.id} 
                className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary"
                onClick={() => onMaterialSelect?.(material)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-primary mb-1">
                        {material.name}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {material.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {material.category}
                      </Badge>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${stockColor} ml-3 mt-1`} title={stockLabel}></div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {/* Location */}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">
                        {material.originLocation || 'Région non spécifiée'}
                      </span>
                    </div>

                    {/* GPS Coordinates */}
                    {material.coordinatesLatitude && material.coordinatesLongitude && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-success" />
                        <span className="text-xs text-muted-foreground font-mono">
                          GPS: {material.coordinatesLatitude.toFixed(4)}, {material.coordinatesLongitude.toFixed(4)}
                        </span>
                      </div>
                    )}

                    {/* Address */}
                    {material.adresse && (
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-purple-500" />
                        <span className="text-xs text-muted-foreground">
                          {typeof material.adresse === 'string' ? material.adresse : JSON.stringify(material.adresse)}
                        </span>
                      </div>
                    )}

                    {/* Price and Stock */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-success" />
                        <span className="font-medium text-success">
                          {formatPrice(material.pricePerUnit)}/{material.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {material.availableQuantity} {material.unit}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs text-white ${stockColor}`}
                        >
                          {stockLabel}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {onMaterialSelect && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-3 text-primary hover:text-primary/80 hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMaterialSelect(material);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir sur la carte
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination */}
        {materials.length > 10 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={goToPage}
            showItemsPerPage={false}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveMaterialsList;