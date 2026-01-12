/**
 * Hook hexagonal pour les matériaux
 * Encapsule les use cases de l'architecture hexagonale
 */
import { useState, useEffect, useCallback } from 'react';
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

export interface UseMaterialsHexResult {
  materials: Material[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createMaterial: (data: CreateMaterialInput) => Promise<Material | null>;
}

export function useMaterialsHex(): UseMaterialsHexResult {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

  const createMaterial = useCallback(async (data: CreateMaterialInput): Promise<Material | null> => {
    const result = await createMaterialUseCase.execute(data);
    if (result.success && result.material) {
      await fetchMaterials();
      return result.material;
    }
    throw new Error(result.error || 'Failed to create material');
  }, [fetchMaterials]);

  return {
    materials,
    loading,
    error,
    refetch: fetchMaterials,
    createMaterial,
  };
}

export interface UseMaterialHexResult {
  material: Material | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useMaterialHex(materialId: string | undefined): UseMaterialHexResult {
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMaterial = useCallback(async () => {
    if (!materialId) {
      setMaterial(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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
      setLoading(false);
    }
  }, [materialId]);

  useEffect(() => {
    fetchMaterial();
  }, [fetchMaterial]);

  return {
    material,
    loading,
    error,
    refetch: fetchMaterial,
  };
}
