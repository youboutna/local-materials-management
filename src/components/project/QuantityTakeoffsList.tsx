import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Calculator } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { QuantityTakeoffWithDetails } from '@/types/quantityTakeoff';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { usePagination } from '@/hooks/usePagination';
import { useQuantityTakeoffsHex } from '@/hooks/hexagonal'

interface QuantityTakeoffsListProps {
  projectId: string;
}

const QuantityTakeoffsList = ({ projectId }: QuantityTakeoffsListProps) => {
  const {
    quantityTakeoffs,
    isLoading,
    deleteMutation,
    getTotalQuantityByUnit,
    getTotalValue
  } = useQuantityTakeoffsHex(projectId);

  const {
    currentData: paginatedTakeoffs,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    goToPage
  } = usePagination({
    data: quantityTakeoffs || [],
    itemsPerPage: 10
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting quantity takeoff:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Liste des Métrés
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {paginatedTakeoffs.map((takeoff) => (
            <div key={takeoff.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-lg">{takeoff.material?.name}</h4>
                  <p className="text-sm text-gray-600">
                    {takeoff.quantity} {takeoff.material?.unit} Ã  {takeoff.material?.price_per_unit} MRU/unité
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {takeoff.material?.category}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(takeoff.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                Total: {(takeoff.quantity * (takeoff.material?.price_per_unit || 0)).toLocaleString()} MRU
              </div>
            </div>
          ))}
          
          {paginatedTakeoffs.length === 0 && (
            <div className="text-center py-8">
              <Calculator className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-600 mt-2">Aucun métré trouvé pour ce projet</p>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h5 className="font-medium">Total par unité</h5>
              <div className="space-y-2">
                {['m', 'm²', 'm³', 'kg', 't', 'ml'].map((unit) => {
                  const quantity = getTotalQuantityByUnit(unit);
                  return (
                    <div key={unit} className="flex justify-between">
                      <span className="text-sm">{unit}:</span>
                      <span className="font-medium">{quantity}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h5 className="font-medium">Valeur totale</h5>
              <p className="text-2xl font-bold text-green-600">
                {getTotalValue().toLocaleString()} MRU
              </p>
            </div>
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={goToPage}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default QuantityTakeoffsList;
