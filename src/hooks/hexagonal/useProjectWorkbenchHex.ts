import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getProjectWorkbenchService } from '@/application/services/ProjectWorkbenchService';
import type { SaveProjectOperationDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
import type { SpatialZoneDTO, SaveInfrastructureDTO, InfrastructureRealizationDTO, ImportFeatureItemDTO, SaveInfraStructureDTO, SaveAssetTypeDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
import type { ProjectCalendarEventDTO, } from '@/dtos/entities/ProjectWorkbenchDTO';
import type { CreateTaskAssignmentDTO, UpdateTaskAssignmentDTO } from '@/dtos/entities/TaskAssignmentDTO';
import { getTaskAssignmentService } from '@/application/services/TaskAssignmentService';
export function useWorkbenchCalendarActions(projectId: string) {
  const client = useQueryClient();
  const refresh = async () => { await Promise.all([client.invalidateQueries({ queryKey: ['project-workbench',projectId] }), client.invalidateQueries({ queryKey: ['task-assignments-hex'] }), client.invalidateQueries({ queryKey: ['projects'] })]); };
  const save = useMutation({ mutationFn: async (input: { id?: string; data: CreateTaskAssignmentDTO | UpdateTaskAssignmentDTO }) => {
    const taskService = getTaskAssignmentService();
    const result = input.id ? await taskService.update(input.id,input.data) : await taskService.create(input.data as CreateTaskAssignmentDTO);
    await refresh(); return result;
  } });
  const remove = useMutation({ mutationFn: async (input: {kind: ProjectCalendarEventDTO['kind']; id: string}) => { await getProjectWorkbenchService().deleteCalendarEntry(projectId,input.kind,input.id); await refresh(); } });
  return { saveTask: save.mutateAsync, deleteEntry: remove.mutateAsync, isPending: save.isPending || remove.isPending };
}
export function useWorkbenchProjects() { return useQuery({ queryKey: ['workbench-projects'], queryFn: () => getProjectWorkbenchService().projects() }); }
export function useProjectWorkbench(projectId: string) { return useQuery({ queryKey: ['project-workbench', projectId], queryFn: () => getProjectWorkbenchService().load(projectId), enabled: Boolean(projectId) }); }
export function useWorkbenchFinance(projectId: string) { return useQuery({ queryKey: ['workbench-finance', projectId], queryFn: () => getProjectWorkbenchService().finance(projectId), enabled: Boolean(projectId) }); }
export function useWorkbenchOperations(projectId: string) {
  const client = useQueryClient();
  const invalidate = () => Promise.all([client.invalidateQueries({ queryKey: ['project-workbench', projectId] }),client.invalidateQueries({queryKey:['workbench-finance',projectId]}),client.invalidateQueries({queryKey:['project-financials',projectId]})]);
  const save = useMutation({ mutationFn: async (input: SaveProjectOperationDTO) => { const result = await getProjectWorkbenchService().saveOperation(input); await invalidate(); return result; } });
  const remove = useMutation({ mutationFn: async (id: string) => { await getProjectWorkbenchService().deleteOperation(projectId, id); await invalidate(); } });
  const transition = useMutation({mutationFn: async (input:{id:string;status:'validated'|'cancelled'}) => { await getProjectWorkbenchService().transitionOperation(projectId,input.id,input.status); await invalidate(); }});
  return { saveOperation: save.mutateAsync, deleteOperation: remove.mutateAsync, transitionOperation:transition.mutateAsync, isPending: save.isPending || remove.isPending || transition.isPending, error: save.error || remove.error || transition.error };
}
export function useInfrastructureWorkbench(projectId: string) {
  const service = getProjectWorkbenchService();
  const query = useQuery({ queryKey: ['infra-assets',projectId], queryFn: () => service.assets(projectId), enabled: Boolean(projectId) });
  const structures = useQuery({ queryKey: ['infra-structures',projectId], queryFn: () => service.structures(projectId), enabled: Boolean(projectId) });
  const types = useQuery({ queryKey: ['infra-asset-types'], queryFn: () => service.assetTypes() });
  const domains = useQuery({ queryKey: ['infra-domains'], queryFn: () => service.domains() });
  const refresh = async () => { await Promise.all([query.refetch(), structures.refetch(), types.refetch(), domains.refetch()]); };
  return { assets: query.data || [], structures: structures.data || [], assetTypes: types.data || [], domains: domains.data || [],
    error: query.error || structures.error || types.error || domains.error, isLoading: query.isLoading, refresh,
    saveAsset: (input: SaveInfrastructureDTO) => service.saveAsset(input),
    importAssets: (items: ImportFeatureItemDTO[]) => service.importAssets(projectId, items),
    deleteAsset: (id: string) => service.deleteAsset(projectId,id),
    saveStructure: (input: SaveInfraStructureDTO) => service.saveStructure(input),
    deleteStructure: (id: string) => service.deleteStructure(projectId,id),
    saveAssetType: (input: SaveAssetTypeDTO) => service.saveAssetType(input),
    analyze: (zone: SpatialZoneDTO,buffer: number) => service.analyze(projectId,zone,buffer),
    saveRealization: (input: InfrastructureRealizationDTO) => service.saveRealization(input) };
}