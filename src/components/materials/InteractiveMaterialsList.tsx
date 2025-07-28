import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { MapPin, Package, DollarSign, Truck, Eye } from 'lucide-react';

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
  coordinates_latitude?: number;
  coordinates_longitude?: number;
  forme?: string;
  adresse?: string;
}

interface InteractiveMaterialsListProps {
  materials: Material[];
  onMaterialSelect?: (material: Material) => void;
}

const InteractiveMaterialsList: React.FC<InteractiveMaterialsListProps> = ({
  materials,
  onMaterialSelect
}) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(materials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMaterials = materials.slice(startIndex, startIndex + itemsPerPage);

  const getStockLevel = (available: number, unit: string) => {
    if (available === 0) return 'out';
    if (available < 10) return 'low';
    if (available < 50) return 'medium';
    return 'high';
  };

  const getStockColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-orange-500';
      case 'out': return 'bg-red-500';
      default: return 'bg-gray-500';
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

  const formatPrice = (price: number): string => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M MRU`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}K MRU`;
    }
    return `${price.toLocaleString()} MRU`;
  };

  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

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
          <Package className="h-5 w-5 text-blue-600" />
          Matériaux avec Coordonnées GPS
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {materials.length} matériaux géolocalisés trouvés
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {paginatedMaterials.map((material) => {
            const stockLevel = getStockLevel(material.available_quantity, material.unit);
            const stockColor = getStockColor(stockLevel);
            const stockLabel = getStockLabel(stockLevel);

            return (
              <Card 
                key={material.id} 
                className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500"
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
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span className="text-muted-foreground">
                        {material.origin_location || 'Région non spécifiée'}
                      </span>
                    </div>

                    {/* GPS Coordinates */}
                    {material.coordinates_latitude && material.coordinates_longitude && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-muted-foreground font-mono">
                          GPS: {material.coordinates_latitude.toFixed(4)}, {material.coordinates_longitude.toFixed(4)}
                        </span>
                      </div>
                    )}

                    {/* Address */}
                    {material.adresse && (
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-purple-500" />
                        <span className="text-xs text-muted-foreground">
                          {material.adresse}
                        </span>
                      </div>
                    )}

                    {/* Price and Stock */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-600">
                          {formatPrice(material.price_per_unit)}/{material.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">
                          {material.available_quantity} {material.unit}
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
                      className="w-full mt-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {pageNumbers.map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveMaterialsList;