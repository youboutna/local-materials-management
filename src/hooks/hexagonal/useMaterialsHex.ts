/**
 * Hook hexagonal pour les matériaux
 * Encapsule les use cases de l'architecture hexagonale
 */
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { 
  GetMaterialsListUseCase,
  GetMaterialByIdUseCase,
  CreateMaterialUseCase,
  type CreateMaterialInput
} from '@/application/use-cases';
import { Material } from '@/domain/entities/Material';

// Singleton instances des use cases
const materialRepository = RepositoryFactory.getMaterialRepository();
const getMaterialsListUseCase = new GetMaterialsListUseCase(materialRepository);
const getMaterialByIdUseCase = new GetMaterialByIdUseCase(materialRepository);
const createMaterialUseCase = new CreateMaterialUseCase(materialRepository);

export interface Workspace {
  id: string;
  name: string;
  location: string | null;
  status: string | null;
}

export interface UseMaterialsHexResult {
  materials: Material[];
  loading: boolean;
  error: Error | null;
  workspaces: Workspace[];
  refetch: () => Promise<void>;
  createMaterial: (data: CreateMaterialInput) => Promise<Material | null>;
  updateMaterial: ReturnType<typeof useMutation<any, Error, { id: string; data: any }>>;
}

export function useMaterialsHex(): UseMaterialsHexResult {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  // Fetch workspaces
  const { data: workspaces = [] } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data, error } = await supabase.from('workspaces').select('id, name, location, status');
      if (error) throw error;
      return data || [];
    },
  });

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getMaterialsListUseCase.execute();
      if (result.success) {
        setMaterials(result.materials);
      } else {
        throw new Error(result.error || 'Failed to fetch materials');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch materials'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const createMaterialFn = useCallback(async (data: CreateMaterialInput): Promise<Material | null> => {
    const result = await createMaterialUseCase.execute(data);
    if (result.success && result.material) {
      await fetchMaterials();
      return result.material;
    }
    throw new Error(result.error || 'Failed to create material');
  }, [fetchMaterials]);

  // Update material mutation
  const updateMaterial = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: result, error } = await supabase
        .from('materials')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['material'] });
      fetchMaterials();
    },
  });

  return {
    materials,
    loading,
    error,
    workspaces,
    refetch: fetchMaterials,
    createMaterial: createMaterialFn,
    updateMaterial,
  };
}

export interface UseMaterialHexResult {
  material: Material | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useMaterialHex(materialId: string | undefined): UseMaterialHexResult {
  const [material, setMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMaterial = useCallback(async () => {
    if (!materialId) {
      setMaterial(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await getMaterialByIdUseCase.execute(materialId);
      if (result.success) {
        setMaterial(result.material);
      } else {
        throw new Error(result.error || 'Failed to fetch material');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch material'));
    } finally {
      setIsLoading(false);
    }
  }, [materialId]);

  useEffect(() => {
    fetchMaterial();
  }, [fetchMaterial]);

  return {
    material,
    isLoading,
    error,
    refetch: fetchMaterial,
  };
}
