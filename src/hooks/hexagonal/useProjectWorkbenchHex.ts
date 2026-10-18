import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getProjectWorkbenchService } from '@/application/services/ProjectWorkbenchService';
import type { SaveProjectOperationDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
import type { SpatialZoneDTO, SaveInfrastructureDTO, InfrastructureRealizationDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
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