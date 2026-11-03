/**
 * Infrastructure Workbench Hook (Hexagonal)
 * TanStack Query hook for infrastructure data management
 * Following hexagonal architecture principles
 * Uses InfrastructureService with IInfraRepository
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getInfrastructureService } from '@/application/services/InfrastructureService';
import type {
  InfrastructureAssetDTO,
  SaveInfrastructureDTO,
  ImportResultDTO,
  InfraStructureDTO,
  SaveInfraStructureDTO,
  InfrastructureAnalysisDTO,
  InfrastructureRealizationDTO,
  AssetTypeDTO,
  ImportFeatureItemDTO,
  SaveAssetTypeDTO
} from '@/dtos/entities/ProjectWorkbenchDTO';
import type { Geometry, FeatureCollection } from 'geojson';

export function useInfrastructureWorkbench(projectId: string) {
  const service = getInfrastructureService();
  const client = useQueryClient();

  // Queries
  const assetsQuery = useQuery({
    queryKey: ['infra-assets', projectId],
    queryFn: () => service.assets(projectId),
    enabled: Boolean(projectId)
  });

  const structuresQuery = useQuery({
    queryKey: ['infra-structures', projectId],
    queryFn: () => service.structures(projectId),
    enabled: Boolean(projectId)
  });

  const assetTypesQuery = useQuery({
    queryKey: ['infra-asset-types'],
    queryFn: () => service.assetTypes()
  });

  const domainsQuery = useQuery({
    queryKey: ['infra-domains'],
    queryFn: () => service.domains()
  });

  // Mutations
  const saveAssetMutation = useMutation({
    mutationFn: (input: SaveInfrastructureDTO) => service.saveAsset(projectId, input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['infra-assets', projectId] });
    }
  });

  const importAssetsMutation = useMutation({
    mutationFn: (items: ImportFeatureItemDTO[]) => service.importAssets(projectId, items),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['infra-assets', projectId] });
    }
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (id: string) => service.deleteAsset(projectId, id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['infra-assets', projectId] });
    }
  });

  const saveStructureMutation = useMutation({
    mutationFn: (input: SaveInfraStructureDTO) => service.saveStructure(input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['infra-structures', projectId] });
    }
  });

  const deleteStructureMutation = useMutation({
    mutationFn: (id: string) => service.deleteStructure(projectId, id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['infra-structures', projectId] });
    }
  });

  const saveRealizationMutation = useMutation({
    mutationFn: (input: InfrastructureRealizationDTO) => service.saveRealization(input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['infra-assets', projectId] });
    }
  });

  const saveAssetTypeMutation = useMutation({
    mutationFn: (input: SaveAssetTypeDTO) => service.saveAssetType(input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['infra-asset-types'] });
    }
  });

  // Combined refresh
  const refresh = async () => {
    await Promise.all([
      assetsQuery.refetch(),
      structuresQuery.refetch(),
      assetTypesQuery.refetch(),
      domainsQuery.refetch()
    ]);
  };

  return {
    assets: assetsQuery.data || [],
    structures: structuresQuery.data || [],
    assetTypes: assetTypesQuery.data || [],
    domains: domainsQuery.data || [],
    error: assetsQuery.error || structuresQuery.error || assetTypesQuery.error || domainsQuery.error,
    isLoading: assetsQuery.isLoading || structuresQuery.isLoading || assetTypesQuery.isLoading || domainsQuery.isLoading,
    refresh,
    saveAsset: saveAssetMutation.mutateAsync,
    importAssets: importAssetsMutation.mutateAsync,
    deleteAsset: deleteAssetMutation.mutateAsync,
    saveStructure: saveStructureMutation.mutateAsync,
    deleteStructure: deleteStructureMutation.mutateAsync,
    saveRealization: saveRealizationMutation.mutateAsync,
    saveAssetType: saveAssetTypeMutation.mutateAsync,
    analyze: (geometry: Geometry | FeatureCollection, bufferMeters: number) =>
      service.analyze(projectId, geometry, bufferMeters),
    isPending: saveAssetMutation.isPending ||
                importAssetsMutation.isPending ||
                deleteAssetMutation.isPending ||
                saveStructureMutation.isPending ||
                deleteStructureMutation.isPending ||
                saveRealizationMutation.isPending ||
                saveAssetTypeMutation.isPending
  };
}
