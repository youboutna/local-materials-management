
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Calculator } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { QuantityTakeoffWithDetails } from '@/types/quantityTakeoff';

interface QuantityTakeoffsListProps {
  projectId: string;
}

const QuantityTakeoffsList = ({ projectId }: QuantityTakeoffsListProps) => {
  const queryClient = useQueryClient();

  const { data: quantityTakeoffs, isLoading } = useQuery({
    queryKey: ['quantity-takeoffs', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quantity_takeoffs')
        .select(`
          *,
          material:materials(
            id,
            name,
            unit,
            price_per_unit,
            category
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as QuantityTakeoffWithDetails[];
    },
  });

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quantity_takeoffs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Métré supprimé",
        description: "Le métré a été supprimé avec succès.",
      });

      queryClient.invalidateQueries({ queryKey: ['quantity-takeoffs', projectId] });
    } catch (error) {
      console.error('Error deleting quantity takeoff:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le métré.",
        variant: "destructive",
      });
    }
  };

  const getTotalQuantityByUnit = (unit: string) => {
    return quantityTakeoffs
      ?.filter(qt => qt.unit === unit)
      .reduce((sum, qt) => sum + qt.quantity, 0) || 0;
  };

  const getTotalValue = () => {
    return quantityTakeoffs?.reduce((sum, qt) => {
      const materialPrice = qt.material?.price_per_unit || 0;
      return sum + (qt.quantity * materialPrice);
    }, 0) || 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{getTotalQuantityByUnit('m³').toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total Volume (m³)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{getTotalQuantityByUnit('m²').toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total Surface (m²)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{getTotalQuantityByUnit('m').toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total Linéaire (m)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{getTotalValue().toFixed(2)} MRU</div>
            <p className="text-xs text-muted-foreground">Valeur Totale</p>
          </CardContent>
        </Card>
      </div>

      {/* Quantity Takeoffs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Liste des Métrés
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quantityTakeoffs && quantityTakeoffs.length > 0 ? (
            <div className="space-y-4">
              {quantityTakeoffs.map((qt) => (
                <div key={qt.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{qt.element_type}</h3>
                        <Badge variant="outline">{qt.unit}</Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Matériau:</strong> {qt.material?.name || 'Non spécifié'} 
                        {qt.material?.category && (
                          <span className="text-gray-500"> ({qt.material.category})</span>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Dimensions:</strong> L: {qt.length}m
                        {qt.width && ` × l: ${qt.width}m`}
                        {qt.height && ` × H: ${qt.height}m`}
                      </div>

                      <div className="text-lg font-semibold text-primary">
                        Quantité: {qt.quantity.toFixed(2)} {qt.unit}
                      </div>

                      {qt.material?.price_per_unit && (
                        <div className="text-sm text-gray-600">
                          Valeur: {(qt.quantity * qt.material.price_per_unit).toFixed(2)} MRU
                        </div>
                      )}

                      {qt.note && (
                        <div className="text-sm text-gray-600 mt-2">
                          <strong>Note:</strong> {qt.note}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(qt.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>Aucun métré trouvé pour ce projet.</p>
              <p className="text-sm">Créez votre premier métré pour commencer.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuantityTakeoffsList;
