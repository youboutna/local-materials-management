import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MapPin, Package, Trash2 } from 'lucide-react';
import { MaterialUIDTO } from '@/dtos/transforms';

interface MaterialCardProps {
  material: MaterialUIDTO;
  onClick: () => void;
  onDelete?: (materialId: string) => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material, onClick, onDelete }) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1 relative">
      {onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 z-10 h-8 w-8"
              onClick={(e) => e.stopPropagation()}
              aria-label="Supprimer le matériau"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce matériau ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le matériau "{material.name}" sera définitivement supprimé.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(material.id)}>
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
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
            {material.localType && (
              <Badge variant="outline">{material.localType}</Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Prix:</span>
              <span className="font-semibold text-sm">
                {(material.pricePerUnit || 0).toLocaleString()} MRU/{material.unit}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Stock:</span>
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-sm">
                  {material.availableQuantity} {material.unit}
                </span>
              </div>
            </div>

            {material.originLocation && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Origine:</span>
                <span className="font-medium text-xs text-primary">
                  {material.originLocation}
                </span>
              </div>
            )}

            {material.coordinatesLatitude && material.coordinatesLongitude && (
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