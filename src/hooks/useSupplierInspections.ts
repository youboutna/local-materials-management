import { getInspectionService } from '@/application/services/InspectionService';
import { Inspection } from '@/domain/entities/Inspection';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

/**
 * Custom hook for managing supplier inspections
 */
export const useSupplierInspections = (supplierId: string | null) => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchInspections = async () => {
    if (!supplierId) {
      setInspections([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const inspectionService = getInspectionService();
      // Use getAllInspections and filter by supplier
      const allInspections = await inspectionService.getAllInspections();
      const supplierInspections = allInspections.filter(
        (i: any) => i.supplierId === supplierId || i.contractorId === supplierId
      );
      setInspections(supplierInspections);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('[useSupplierInspections] Error fetching supplier inspections:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les inspections',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [supplierId]);

  return {
    inspections,
    loading,
    error,
    refetch: fetchInspections
  };
};
