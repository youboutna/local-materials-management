import { useState, useEffect } from 'react';
import { InspectionService } from '@/services/InspectionService';
import { InspectionDTO } from '@/types/inspection.dto';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook for managing supplier inspections
 * Provides inspections data and loading state with proper error handling
 */
export const useSupplierInspections = (supplierId: string | null) => {
  const [inspections, setInspections] = useState<InspectionDTO[]>([]);
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
      const data = await InspectionService.getInspectionsForSupplier(supplierId);
      setInspections(data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error fetching supplier inspections:', error);
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
