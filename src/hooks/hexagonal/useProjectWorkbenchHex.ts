import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getProjectWorkbenchService } from '@/application/services/ProjectWorkbenchService';
import type { SaveProjectOperationDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
import type { SpatialZoneDTO, SaveInfrastructureDTO, InfrastructureRealizationDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
export function useWorkbenchProjects() { return useQuery({ queryKey: ['workbench-projects'], queryFn: () => getProjectWorkbenchService().projects() }); }
export function useProjectWorkbench(projectId: string) { return useQuery({ queryKey: ['project-workbench', projectId], queryFn: () => getProjectWorkbenchService().load(projectId), enabled: Boolean(projectId) }); }
export function useWorkbenchOperations(projectId: string) {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['project-workbench', projectId] });
  const save = useMutation({ mutationFn: async (input: SaveProjectOperationDTO) => { const result = await getProjectWorkbenchService().saveOperation(input); await invalidate(); return result; } });
  const remove = useMutation({ mutationFn: async (id: string) => { await getProjectWorkbenchService().deleteOperation(projectId, id); await invalidate(); } });
  return { saveOperation: save.mutateAsync, deleteOperation: remove.mutateAsync, isPending: save.isPending || remove.isPending, error: save.error || remove.error };
}
export function useInfrastructureWorkbench(projectId: string) {
  const service = getProjectWorkbenchService();
  const query = useQuery({ queryKey: ['infra-assets',projectId], queryFn: () => service.assets(projectId), enabled: Boolean(projectId) });
  return { assets: query.data || [], error: query.error, isLoading: query.isLoading, refresh: query.refetch,
    saveAsset: (input: SaveInfrastructureDTO) => service.saveAsset(input),
    deleteAsset: (id: string) => service.deleteAsset(projectId,id),
    analyze: (zone: SpatialZoneDTO,buffer: number) => service.analyze(projectId,zone,buffer),
    saveRealization: (input: InfrastructureRealizationDTO) => service.saveRealization(input) };
}